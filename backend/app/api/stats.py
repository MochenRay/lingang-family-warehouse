from __future__ import annotations

from calendar import monthrange
from collections.abc import Callable
from collections import Counter, defaultdict
from datetime import date, datetime
from time import monotonic
from typing import TypeVar
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models.conflict import ConflictRecord
from app.models.grid import Grid
from app.models.house import House
from app.models.person import Person
from app.models.visit import VisitRecord
from app.schemas.stats import (
    StatsAgeItemRead,
    StatsAgeGenderItemRead,
    StatsConflictStatsRead,
    StatsCountItemRead,
    StatsDashboardRead,
    StatsDemographicsRead,
    StatsGenderItemRead,
    StatsGridItemRead,
    StatsGridListRead,
    StatsHousingStatsRead,
    StatsMetadataRead,
    StatsMobilePeopleStatsRead,
    StatsPerformanceItemRead,
    StatsPerformanceRead,
    StatsPerformanceScoreRead,
    StatsPerformanceSummaryRead,
    StatsQualityAlertRead,
    StatsActionItemRead,
    StatsRegionSummaryRead,
    StatsRiskTagItemRead,
    StatsTrendItemRead,
)
from app.services.task_rules import build_task_projection
from app.demo_data.regions import get_region_for_grid

router = APIRouter(prefix="/stats", tags=["stats"])

SHANGHAI_TZ = ZoneInfo("Asia/Shanghai")
DEFAULT_DISTRICT_NAME = "蓬莱区"
STATS_CACHE_TTL_SECONDS = 60.0
AGE_BUCKETS = (
    ("0-18岁", 0, 18, "#8b5cf6"),
    ("19-35岁", 19, 35, "#3b82f6"),
    ("36-60岁", 36, 60, "#10b981"),
    ("60岁以上", 61, float("inf"), "#f59e0b"),
)
DEMOGRAPHICS_TYPE_ORDER = ("户籍", "流动", "留守", "境外")
DEMOGRAPHICS_EDUCATION_ORDER = (
    "学龄前",
    "未上学",
    "小学",
    "初中",
    "高中",
    "中专",
    "大专",
    "本科",
    "硕士",
    "博士",
    "其他",
    "未记录",
)
RISK_TAGS = (
    ("独居老人", "高", ["独居老人"]),
    ("严重精神障碍", "高", ["严重精神障碍", "精神障碍"]),
    ("社区矫正", "中", ["社区矫正"]),
    ("群租", "中", ["群租", "群租风险", "群租线索"]),
    ("信访", "低", ["信访", "信访人员"]),
)
PERFORMANCE_SCORE_WEIGHTS = StatsPerformanceScoreRead(
    visitFreq=0.25,
    visitQuality=0.25,
    infoComplete=0.20,
    taskCount=0.15,
    taskSpeed=0.15,
)
CacheValueT = TypeVar(
    "CacheValueT",
    StatsDashboardRead,
    StatsGridListRead,
    StatsPerformanceRead,
)
_stats_cache: dict[str, tuple[float, object]] = {}


def _get_cached_stats(key: str) -> object | None:
    cached = _stats_cache.get(key)
    if cached is None:
        return None
    created_at, value = cached
    if monotonic() - created_at > STATS_CACHE_TTL_SECONDS:
        _stats_cache.pop(key, None)
        return None
    return value


def _set_cached_stats(key: str, value: object) -> None:
    _stats_cache[key] = (monotonic(), value)


def _read_cached_stats(key: str, builder: Callable[[], CacheValueT]) -> CacheValueT:
    cached = _get_cached_stats(key)
    if cached is not None:
        return cached  # type: ignore[return-value]
    value = builder()
    _set_cached_stats(key, value)
    return value


def _parse_datetime(raw: str | None) -> datetime | None:
    if not raw:
        return None

    formats = (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%Y-%m",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d %H:%M",
        "%Y/%m/%d",
    )
    for fmt in formats:
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


def _parse_area(raw: str | None) -> float:
    if not raw:
        return 0.0
    cleaned = raw.replace("㎡", "").replace("平米", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _clamp_score(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    return max(minimum, min(maximum, value))


def _average(values: list[float]) -> float:
    if not values:
        return 0.0
    return round(sum(values) / len(values), 1)


def _parse_grid_hierarchy(name: str, grid_id: str | None = None) -> tuple[str, str, str, str]:
    region = get_region_for_grid(grid_id or "", name)
    if region:
        return region.district, region.street, region.community, region.grid_label

    street_name = name
    community_name = name
    grid_label = name

    if "街道" in name:
        street_name = f"{name.split('街道', 1)[0]}街道"
        community_name = name[len(street_name):] or name
    elif "镇" in name:
        street_name = f"{name.split('镇', 1)[0]}镇"
        community_name = name[len(street_name):] or name

    if "第" in community_name and "网格" in community_name:
        grid_label = f"第{community_name.split('第', 1)[1]}"
        community_name = community_name.split("第", 1)[0]
    elif "网格" in community_name:
        grid_label = f"{community_name.split('网格', 1)[0]}网格"
        community_name = community_name.split("网格", 1)[0]

    community_name = community_name.strip() or name
    return DEFAULT_DISTRICT_NAME, street_name.strip() or name, community_name, grid_label.strip() or name


def _person_completeness(person: Person) -> float:
    fields = [
        bool(person.phone),
        bool(person.idCard),
        bool(person.address),
        bool(person.houseId),
        bool(person.updatedAt),
        bool(person.tags),
    ]
    return sum(1 for value in fields if value) / len(fields)


def _house_completeness(house: House) -> float:
    fields = [
        bool(house.ownerPhone),
        bool(house.area),
        bool(house.type),
        bool(house.occupancyStatus),
        bool(house.residenceType),
    ]
    return sum(1 for value in fields if value) / len(fields)


def _is_housing_warning(house: House) -> bool:
    tags = house.tags or []
    return (
        any("群租" in tag or "换租" in tag or "租约到期" in tag for tag in tags)
        or house.occupancyStatus == "户在人不在"
    )


def _visit_quality_score(visit: VisitRecord) -> float:
    content_length = len((visit.content or "").strip())
    tag_bonus = min(len(visit.tags or []) * 6, 18)
    image_bonus = min(len(visit.images or []) * 8, 16)
    score = 42 + min(content_length * 0.6, 32) + tag_bonus + image_bonus
    return round(_clamp_score(score, minimum=45.0), 1)


def _weighted_total(scores: StatsPerformanceScoreRead) -> float:
    total = (
        scores.visitFreq * PERFORMANCE_SCORE_WEIGHTS.visitFreq
        + scores.visitQuality * PERFORMANCE_SCORE_WEIGHTS.visitQuality
        + scores.infoComplete * PERFORMANCE_SCORE_WEIGHTS.infoComplete
        + scores.taskCount * PERFORMANCE_SCORE_WEIGHTS.taskCount
        + scores.taskSpeed * PERFORMANCE_SCORE_WEIGHTS.taskSpeed
    )
    return round(total, 1)


def _month_labels(anchor: datetime, months: int = 6) -> list[tuple[int, int]]:
    pairs: list[tuple[int, int]] = []
    year = anchor.year
    month = anchor.month
    for _ in range(months):
        pairs.append((year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    pairs.reverse()
    return pairs


def _month_end(year: int, month: int) -> date:
    return date(year, month, monthrange(year, month)[1])


def _text_values_for_person(person: Person, houses_by_id: dict[str, House]) -> str:
    parts: list[str] = []
    parts.extend(person.tags or [])
    if person.careLabels:
        parts.extend(person.careLabels)
    category_labels = person.categoryLabels or {}
    focus_types = category_labels.get("focusType")
    if isinstance(focus_types, list):
        parts.extend(str(item) for item in focus_types)
    health_record = person.healthRecord or {}
    if isinstance(health_record, dict):
        for key, value in health_record.items():
            if value is None:
                continue
            parts.append(str(key))
            parts.append(str(value))
    if person.houseId and person.houseId in houses_by_id:
        parts.extend(houses_by_id[person.houseId].tags or [])
    if person.workplace:
        parts.append(person.workplace)
    if person.biography:
        parts.append(person.biography)
    if person.importantEvents:
        parts.append(person.importantEvents)
    return " | ".join(parts)


def _risk_tag_delta(
    people: list[Person],
    houses_by_id: dict[str, House],
    label_terms: list[str],
    now: datetime,
) -> tuple[int, int]:
    current_month = (now.year, now.month)
    previous_year = now.year if now.month > 1 else now.year - 1
    previous_month = now.month - 1 if now.month > 1 else 12

    total = 0
    current_month_count = 0
    previous_month_count = 0

    for person in people:
        text = _text_values_for_person(person, houses_by_id)
        if not any(term in text for term in label_terms):
            continue
        total += 1
        parsed = _parse_datetime(person.updatedAt)
        if parsed is None:
            continue
        if (parsed.year, parsed.month) == current_month:
            current_month_count += 1
        elif (parsed.year, parsed.month) == (previous_year, previous_month):
            previous_month_count += 1

    return total, current_month_count - previous_month_count


def _build_gender_data(people: list[Person]) -> list[StatsGenderItemRead]:
    male = sum(1 for person in people if person.gender == "男")
    female = sum(1 for person in people if person.gender == "女")
    return [
        StatsGenderItemRead(name="男性", value=male, color="#3b82f6"),
        StatsGenderItemRead(name="女性", value=female, color="#ec4899"),
    ]


def _build_age_data(people: list[Person]) -> list[StatsAgeItemRead]:
    age_counts = {bucket[0]: 0 for bucket in AGE_BUCKETS}
    for person in people:
        age = person.age or 0
        for name, lower, upper, _ in AGE_BUCKETS:
            if lower <= age <= upper:
                age_counts[name] += 1
                break

    return [
        StatsAgeItemRead(name=name, value=age_counts[name], fill=color)
        for name, _, _, color in AGE_BUCKETS
    ]


def _normalize_demographics_education(raw: str | None) -> str:
    value = raw.strip() if raw else ""
    if not value:
        return "未记录"
    if value == "研究生":
        return "硕士"
    if value == "博士后":
        return "博士"
    return value


def _build_demographics(session: Session) -> StatsDemographicsRead:
    people = list(session.exec(select(Person)).all())
    total_population = len(people)
    elderly_count = sum(1 for person in people if person.age > 60)

    age_gender_data: list[StatsAgeGenderItemRead] = []
    for name, lower, upper, _color in reversed(AGE_BUCKETS):
        bucket = [person for person in people if lower <= person.age <= upper]
        age_gender_data.append(
            StatsAgeGenderItemRead(
                name=name,
                male=sum(1 for person in bucket if person.gender == "男"),
                female=sum(1 for person in bucket if person.gender == "女"),
            )
        )

    type_counts = Counter(person.type for person in people)
    type_data = [
        StatsCountItemRead(name=name, value=type_counts[name])
        for name in DEMOGRAPHICS_TYPE_ORDER
    ]

    education_counts = Counter(
        _normalize_demographics_education(person.education) for person in people
    )
    known_education = set(DEMOGRAPHICS_EDUCATION_ORDER)
    education_names = [
        *DEMOGRAPHICS_EDUCATION_ORDER,
        *sorted(name for name in education_counts if name not in known_education),
    ]
    education_data = [
        StatsCountItemRead(name=name, value=education_counts[name])
        for name in education_names
    ]

    nation_counts = Counter(
        person.nation.strip() if person.nation and person.nation.strip() else "未记录"
        for person in people
    )
    nation_data = [
        StatsCountItemRead(name=name, value=value)
        for name, value in sorted(
            nation_counts.items(),
            key=lambda item: (-item[1], item[0]),
        )[:6]
    ]

    return StatsDemographicsRead(
        totalPopulation=total_population,
        elderlyCount=elderly_count,
        elderlyRate=round(elderly_count / total_population * 100, 1)
        if total_population
        else 0.0,
        ageGenderData=age_gender_data,
        typeData=type_data,
        educationData=education_data,
        nationData=nation_data,
    )


def _build_trend_data(people: list[Person], now: datetime) -> list[StatsTrendItemRead]:
    update_dates = []
    for person in people:
        parsed = _parse_datetime(person.updatedAt)
        if parsed is not None:
            update_dates.append(parsed.date())

    items: list[StatsTrendItemRead] = []
    for year, month in _month_labels(now, months=6):
        cutoff = _month_end(year, month)
        items.append(StatsTrendItemRead(month=f"{month}月", value=sum(1 for d in update_dates if d <= cutoff)))
    return items


def _build_housing_stats(houses: list[House]) -> StatsHousingStatsRead:
    total = len(houses)
    self_occupied = sum(1 for house in houses if house.type == "自住")
    rental = sum(1 for house in houses if house.type == "出租")
    vacant = sum(1 for house in houses if house.type == "空置")
    commercial = sum(1 for house in houses if house.type == "经营")
    buildings = len({f"{house.communityName}-{house.building}" for house in houses})

    avg_area = round(sum(_parse_area(house.area) for house in houses) / total) if total else 0
    avg_members = round(sum(house.memberCount or 0 for house in houses) / total, 1) if total else 0.0
    completion_rate = (
        round(sum(1 for house in houses if house.ownerName and house.area and house.type) / total * 100)
        if total
        else 0
    )

    return StatsHousingStatsRead(
        total=total,
        selfOccupied=self_occupied,
        rental=rental,
        vacant=vacant,
        commercial=commercial,
        buildings=buildings,
        avgArea=avg_area,
        avgMembers=avg_members,
        completionRate=completion_rate,
    )


def _build_conflict_stats(conflicts: list[ConflictRecord], now: datetime) -> StatsConflictStatsRead:
    total = len(conflicts)
    today = sum(
        1
        for conflict in conflicts
        if (parsed := _parse_datetime(conflict.createdAt)) is not None
        and parsed.date() == now.date()
    )
    resolved = sum(1 for conflict in conflicts if conflict.status == "已化解")
    active = total - resolved
    rate = round(resolved / total * 100) if total else 0

    return StatsConflictStatsRead(
        total=total,
        today=today,
        resolved=resolved,
        active=active,
        rate=rate,
    )


def _build_mobile_people_stats(people: list[Person]) -> StatsMobilePeopleStatsRead:
    total = len(people)
    registered = sum(1 for person in people if person.type == "户籍")
    floating = sum(1 for person in people if person.type == "流动")
    high_risk = sum(1 for person in people if person.risk == "High")
    medium_risk = sum(1 for person in people if person.risk == "Medium")
    low_risk = sum(1 for person in people if person.risk == "Low")
    return StatsMobilePeopleStatsRead(
        total=total,
        registered=registered,
        floating=floating,
        highRisk=high_risk,
        mediumRisk=medium_risk,
        lowRisk=low_risk,
    )


def _build_grid_items(
    grids: list[Grid],
    people: list[Person],
    houses: list[House],
    visits: list[VisitRecord],
    conflicts: list[ConflictRecord],
) -> list[StatsGridItemRead]:
    people_counts = Counter(person.gridId for person in people)
    house_counts = Counter(house.gridId for house in houses)
    visit_counts = Counter(visit.gridId for visit in visits)
    conflict_counts = Counter(conflict.gridId for conflict in conflicts)

    grid_index = {grid.id: grid for grid in grids}
    ordered_ids = [grid.id for grid in sorted(grids, key=lambda item: (item.name, item.id))]
    known_ids = set(ordered_ids)

    for grid_id in sorted(
        set(people_counts) | set(house_counts) | set(visit_counts) | set(conflict_counts)
    ):
        if grid_id not in known_ids:
            ordered_ids.append(grid_id)

    items: list[StatsGridItemRead] = []
    for grid_id in ordered_ids:
        grid = grid_index.get(grid_id)
        district_name, street_name, community_name, grid_label = _parse_grid_hierarchy(grid.name if grid else grid_id, grid_id)
        items.append(
            StatsGridItemRead(
                id=grid_id,
                name=grid.name if grid else grid_id,
                parentId=grid.parentId if grid else None,
                managerName=grid.managerName if grid else None,
                districtName=district_name,
                streetName=street_name,
                communityName=community_name,
                gridLabel=grid_label,
                peopleCount=people_counts.get(grid_id, 0),
                houseCount=house_counts.get(grid_id, 0),
                visitCount=visit_counts.get(grid_id, 0),
                conflictCount=conflict_counts.get(grid_id, 0),
            )
        )
    return items


def _build_region_summaries(
    grid_items: list[StatsGridItemRead],
    people: list[Person],
    houses: list[House],
    conflicts: list[ConflictRecord],
) -> list[StatsRegionSummaryRead]:
    people_by_grid = defaultdict(list)
    houses_by_grid = defaultdict(list)
    conflicts_by_grid = defaultdict(list)
    for person in people:
        people_by_grid[person.gridId].append(person)
    for house in houses:
        houses_by_grid[house.gridId].append(house)
    for conflict in conflicts:
        conflicts_by_grid[conflict.gridId].append(conflict)

    buckets: dict[tuple[str, str], dict[str, object]] = {}

    def add_item(level: str, name: str, parent: str | None, grid: StatsGridItemRead) -> None:
        key = (level, name)
        item = buckets.setdefault(
            key,
            {
                "id": f"{level}:{name}",
                "level": level,
                "name": name,
                "parentName": parent,
                "peopleCount": 0,
                "houseCount": 0,
                "visitCount": 0,
                "conflictCount": 0,
                "floatingCount": 0,
                "activeConflictCount": 0,
                "riskCount": 0,
                "rentalCount": 0,
                "vacantCount": 0,
                "warningCount": 0,
            },
        )
        grid_people = people_by_grid.get(grid.id, [])
        grid_houses = houses_by_grid.get(grid.id, [])
        grid_conflicts = conflicts_by_grid.get(grid.id, [])
        item["peopleCount"] = int(item["peopleCount"]) + grid.peopleCount
        item["houseCount"] = int(item["houseCount"]) + grid.houseCount
        item["visitCount"] = int(item["visitCount"]) + grid.visitCount
        item["conflictCount"] = int(item["conflictCount"]) + grid.conflictCount
        item["floatingCount"] = int(item["floatingCount"]) + sum(1 for person in grid_people if person.type == "流动")
        item["activeConflictCount"] = int(item["activeConflictCount"]) + sum(1 for conflict in grid_conflicts if conflict.status != "已化解")
        item["riskCount"] = int(item["riskCount"]) + sum(1 for person in grid_people if person.risk in {"High", "Medium"})
        item["rentalCount"] = int(item["rentalCount"]) + sum(1 for house in grid_houses if house.type == "出租")
        item["vacantCount"] = int(item["vacantCount"]) + sum(1 for house in grid_houses if house.type == "空置")
        item["warningCount"] = int(item["warningCount"]) + sum(1 for house in grid_houses if _is_housing_warning(house))

    for grid in grid_items:
        add_item("city", "烟台市", None, grid)
        add_item("district", grid.districtName, "烟台市", grid)
        add_item("street", grid.streetName, grid.districtName, grid)
        add_item("community", grid.communityName, grid.streetName, grid)
        add_item("grid", f"{grid.communityName}{grid.gridLabel}", grid.communityName, grid)

    summaries: list[StatsRegionSummaryRead] = []
    level_rank = {"city": 0, "district": 1, "street": 2, "community": 3, "grid": 4}
    for raw in buckets.values():
        people_count = int(raw["peopleCount"])
        visit_gap = max(0, people_count - int(raw["visitCount"]))
        score = round(
            min(
                100.0,
                int(raw["riskCount"]) * 0.9
                + int(raw["activeConflictCount"]) * 8.0
                + int(raw["floatingCount"]) * 0.35
                + visit_gap * 0.06,
            ),
            1,
        )
        summaries.append(StatsRegionSummaryRead(**raw, score=score))

    return sorted(
        summaries,
        key=lambda item: (level_rank.get(item.level, 9), -item.score, item.name),
    )


def _build_action_items(region_summaries: list[StatsRegionSummaryRead]) -> list[StatsActionItemRead]:
    districts = [item for item in region_summaries if item.level == "district"]
    if not districts:
        return []

    by_risk = max(districts, key=lambda item: (item.riskCount, item.score, item.name))
    by_conflict = max(districts, key=lambda item: (item.activeConflictCount, item.score, item.name))
    by_floating = max(districts, key=lambda item: (item.floatingCount, item.score, item.name))

    return [
        StatsActionItemRead(
            id="risk-focus",
            title="重点对象压降",
            description="按区县先定位高风险与中风险对象，再下钻到社区和网格核对责任清单。",
            area=by_risk.name,
            priority="高",
            metric=f"{by_risk.riskCount} 人",
            route="population-tags",
        ),
        StatsActionItemRead(
            id="conflict-followup",
            title="矛盾纠纷清零",
            description="优先处理仍在调解中的事件，避免跨月积压影响市级治理感知。",
            area=by_conflict.name,
            priority="高" if by_conflict.activeConflictCount else "中",
            metric=f"{by_conflict.activeConflictCount} 起",
            route="conflict-management",
        ),
        StatsActionItemRead(
            id="floating-scan",
            title="流动人口复核",
            description="对流动人口集中片区发起复核，联动出租房、走访和移动端任务。",
            area=by_floating.name,
            priority="中",
            metric=f"{by_floating.floatingCount} 人",
            route="migration-trends",
        ),
    ]


def _build_performance(session: Session) -> StatsPerformanceRead:
    people = list(session.exec(select(Person)).all())
    houses = list(session.exec(select(House)).all())
    grids = list(session.exec(select(Grid)).all())
    visits = list(session.exec(select(VisitRecord)).all())
    conflicts = list(session.exec(select(ConflictRecord)).all())
    now = datetime.now(SHANGHAI_TZ)

    people_by_grid: dict[str, list[Person]] = defaultdict(list)
    houses_by_grid: dict[str, list[House]] = defaultdict(list)
    visits_by_grid: dict[str, list[VisitRecord]] = defaultdict(list)
    conflicts_by_grid: dict[str, list[ConflictRecord]] = defaultdict(list)
    for person in people:
        people_by_grid[person.gridId].append(person)
    for house in houses:
        houses_by_grid[house.gridId].append(house)
    for visit in visits:
        visits_by_grid[visit.gridId].append(visit)
    for conflict in conflicts:
        conflicts_by_grid[conflict.gridId].append(conflict)

    projections = {grid.id: build_task_projection(session, grid.id) for grid in grids}
    max_visit_count = max((len(visits_by_grid.get(grid.id, [])) for grid in grids), default=1)
    max_completed_count = max((len(projections[grid.id].completed) for grid in grids), default=1)

    workers: list[StatsPerformanceItemRead] = []
    incomplete_by_grid: dict[str, int] = {}
    overdue_by_grid: dict[str, int] = {}
    late_closed_by_grid: dict[str, int] = {}

    for grid in grids:
        grid_people = people_by_grid.get(grid.id, [])
        grid_houses = houses_by_grid.get(grid.id, [])
        grid_visits = visits_by_grid.get(grid.id, [])
        projection = projections[grid.id]

        visit_count = len(grid_visits)
        visit_freq_score = round((visit_count / max_visit_count) * 100, 1) if max_visit_count else 0.0
        visit_quality = _average([_visit_quality_score(visit) for visit in grid_visits])

        completeness_parts = [
            *[_person_completeness(person) for person in grid_people],
            *[_house_completeness(house) for house in grid_houses],
        ]
        info_complete = round(_average(completeness_parts) * 100, 1) if completeness_parts else 0.0

        completed_count = len(projection.completed)
        task_count_score = round((completed_count / max_completed_count) * 100, 1) if max_completed_count else 0.0

        on_time_flags = [item.onTime for item in projection.completed if item.onTime is not None]
        on_time_rate = (
            round(sum(1 for flag in on_time_flags if flag) / len(on_time_flags) * 100, 1)
            if on_time_flags
            else (60.0 if projection.summary.pending else 100.0)
        )
        overdue_ratio = projection.summary.overdue / max(projection.summary.pending + completed_count, 1)
        task_speed = round(
            _clamp_score(on_time_rate * 0.7 + (1 - overdue_ratio) * 30, minimum=45.0),
            1,
        )

        scores = StatsPerformanceScoreRead(
            visitFreq=visit_freq_score,
            visitQuality=visit_quality,
            infoComplete=info_complete,
            taskCount=task_count_score,
            taskSpeed=task_speed,
        )

        district_name, street_name, community_name, _grid_label = _parse_grid_hierarchy(grid.name, grid.id)
        workers.append(
            StatsPerformanceItemRead(
                id=grid.id,
                name=grid.managerName or grid.name,
                gridId=grid.id,
                gridName=grid.name,
                communityName=community_name,
                streetName=street_name,
                districtName=district_name,
                workerCount=1,
                visitCount=visit_count,
                visitQuality=visit_quality,
                infoCompleteness=info_complete,
                taskCompleted=completed_count,
                pendingCount=projection.summary.pending,
                overdueCount=projection.summary.overdue,
                scores=scores,
                totalScore=_weighted_total(scores),
            )
        )

        incomplete_by_grid[grid.name] = sum(
            1
            for person in grid_people
            if not person.phone or not person.houseId or not person.tags
        ) + sum(
            1
            for house in grid_houses
            if not house.ownerPhone or not house.area or not house.occupancyStatus or not house.residenceType
        )
        overdue_by_grid[grid.name] = projection.summary.overdue
        late_closed_by_grid[grid.name] = sum(1 for item in projection.completed if item.onTime is False)

    workers.sort(key=lambda item: (-item.totalScore, item.name))
    community_scores: dict[str, list[float]] = defaultdict(list)
    for worker in workers:
        community_scores[worker.communityName].append(worker.totalScore)

    best_community = ""
    best_score = -1.0
    for community_name, scores in community_scores.items():
        community_score = sum(scores) / len(scores)
        if community_score > best_score:
            best_score = community_score
            best_community = community_name

    quality_alerts: list[StatsQualityAlertRead] = []
    if incomplete_by_grid:
        area, count = max(incomplete_by_grid.items(), key=lambda item: item[1])
        quality_alerts.append(
            StatsQualityAlertRead(
                id="profile_gap",
                type="档案缺口",
                desc="人员档案缺少联系电话、关联房屋或基础标签。",
                count=count,
                area=area,
            )
        )
    if overdue_by_grid:
        area, count = max(overdue_by_grid.items(), key=lambda item: item[1])
        quality_alerts.append(
            StatsQualityAlertRead(
                id="overdue_followup",
                type="跟进超期",
                desc="待回访或矛盾跟进任务已超期，影响闭环时效。",
                count=count,
                area=area,
            )
        )
    if late_closed_by_grid:
        area, count = max(late_closed_by_grid.items(), key=lambda item: item[1])
        quality_alerts.append(
            StatsQualityAlertRead(
                id="late_resolution",
                type="闭环滞后",
                desc="已化解事件存在超期闭环，建议复盘处置链路。",
                count=count,
                area=area,
            )
        )

    metadata = StatsMetadataRead(
        generatedAt=now.strftime("%Y-%m-%d %H:%M:%S"),
        totalGrids=len(grids),
        totalPeople=len(people),
        totalHouses=len(houses),
        totalVisits=len(visits),
        totalConflicts=len(conflicts),
    )

    summary = StatsPerformanceSummaryRead(
        workerCount=len(workers),
        avgScore=round(sum(worker.totalScore for worker in workers) / len(workers), 1) if workers else 0.0,
        bestCommunity=best_community or "暂无",
        needImproveCount=sum(1 for worker in workers if worker.totalScore < 70),
    )

    return StatsPerformanceRead(
        metadata=metadata,
        weights=PERFORMANCE_SCORE_WEIGHTS,
        workers=workers,
        summary=summary,
        qualityAlerts=quality_alerts,
    )


def _build_dashboard(session: Session) -> StatsDashboardRead:
    people = list(session.exec(select(Person)).all())
    houses = list(session.exec(select(House)).all())
    grids = list(session.exec(select(Grid)).all())
    visits = list(session.exec(select(VisitRecord)).all())
    conflicts = list(session.exec(select(ConflictRecord)).all())
    now = datetime.now(SHANGHAI_TZ)
    houses_by_id = {house.id: house for house in houses}

    gender_data = _build_gender_data(people)
    age_data = _build_age_data(people)
    trend_data = _build_trend_data(people, now)
    housing_stats = _build_housing_stats(houses)
    conflict_stats = _build_conflict_stats(conflicts, now)
    mobile_people_stats = _build_mobile_people_stats(people)
    grid_items = _build_grid_items(grids, people, houses, visits, conflicts)
    region_summaries = _build_region_summaries(grid_items, people, houses, conflicts)
    action_items = _build_action_items(region_summaries)

    risk_items: list[StatsRiskTagItemRead] = []
    for name, level, terms in RISK_TAGS:
        total, delta = _risk_tag_delta(people, houses_by_id, list(terms), now)
        risk_items.append(
            StatsRiskTagItemRead(
                name=name,
                count=total,
                level=level,
                delta=f"{delta:+d}" if delta else "0",
            )
        )

    metadata = StatsMetadataRead(
        generatedAt=now.strftime("%Y-%m-%d %H:%M:%S"),
        totalGrids=len(grids),
        totalPeople=len(people),
        totalHouses=len(houses),
        totalVisits=len(visits),
        totalConflicts=len(conflicts),
    )

    return StatsDashboardRead(
        metadata=metadata,
        totalPopulation=len(people),
        totalHouses=len(houses),
        genderData=gender_data,
        ageData=age_data,
        riskTagsSummary=risk_items,
        trendData=trend_data,
        housingStats=housing_stats,
        conflictStats=conflict_stats,
        mobilePeopleStats=mobile_people_stats,
        grids=grid_items,
        regionSummaries=region_summaries,
        actionItems=action_items,
    )


def _build_grid_list(session: Session) -> StatsGridListRead:
    people = list(session.exec(select(Person)).all())
    houses = list(session.exec(select(House)).all())
    grids = list(session.exec(select(Grid)).all())
    visits = list(session.exec(select(VisitRecord)).all())
    conflicts = list(session.exec(select(ConflictRecord)).all())
    now = datetime.now(SHANGHAI_TZ)

    metadata = StatsMetadataRead(
        generatedAt=now.strftime("%Y-%m-%d %H:%M:%S"),
        totalGrids=len(grids),
        totalPeople=len(people),
        totalHouses=len(houses),
        totalVisits=len(visits),
        totalConflicts=len(conflicts),
    )

    return StatsGridListRead(
        metadata=metadata,
        grids=_build_grid_items(grids, people, houses, visits, conflicts),
    )


@router.get("/dashboard", response_model=StatsDashboardRead)
def read_dashboard(
    session: Session = Depends(get_session),
    range_name: str = Query(default="month", alias="range"),
) -> StatsDashboardRead:
    _ = range_name
    return _read_cached_stats(f"dashboard:{range_name}", lambda: _build_dashboard(session))


@router.get("/demographics", response_model=StatsDemographicsRead)
def read_demographics(session: Session = Depends(get_session)) -> StatsDemographicsRead:
    # 人口写入后刷新页面必须立即反映；1917 条本地种子聚合开销远低于传输明细，
    # 故此端点不复用全局 60 秒 stats cache。
    return _build_demographics(session)


@router.get("/grids", response_model=StatsGridListRead)
def read_grids(session: Session = Depends(get_session)) -> StatsGridListRead:
    return _read_cached_stats("grids", lambda: _build_grid_list(session))


@router.get("/performance", response_model=StatsPerformanceRead)
def read_performance(session: Session = Depends(get_session)) -> StatsPerformanceRead:
    return _read_cached_stats("performance", lambda: _build_performance(session))
