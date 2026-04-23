from __future__ import annotations

from calendar import monthrange
from collections import Counter, defaultdict
from datetime import date, datetime
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
    StatsConflictStatsRead,
    StatsDashboardRead,
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
    StatsRiskTagItemRead,
    StatsTrendItemRead,
)
from app.services.task_rules import build_task_projection

router = APIRouter(prefix="/stats", tags=["stats"])

SHANGHAI_TZ = ZoneInfo("Asia/Shanghai")
DEFAULT_DISTRICT_NAME = "蓬莱示范片区"
AGE_BUCKETS = (
    ("0-18岁", 0, 18, "#8b5cf6"),
    ("19-35岁", 19, 35, "#3b82f6"),
    ("36-60岁", 36, 60, "#10b981"),
    ("60岁以上", 61, 200, "#f59e0b"),
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


def _parse_grid_hierarchy(name: str) -> tuple[str, str, str]:
    street_name = name
    community_name = name

    if "街道" in name:
        street_name = f"{name.split('街道', 1)[0]}街道"
        community_name = name[len(street_name):] or name
    elif "镇" in name:
        street_name = f"{name.split('镇', 1)[0]}镇"
        community_name = name[len(street_name):] or name

    if "第" in community_name and "网格" in community_name:
        community_name = community_name.split("第", 1)[0]
    elif "网格" in community_name:
        community_name = community_name.split("网格", 1)[0]

    community_name = community_name.strip() or name
    return DEFAULT_DISTRICT_NAME, street_name.strip() or name, community_name


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
        items.append(
            StatsGridItemRead(
                id=grid_id,
                name=grid.name if grid else grid_id,
                parentId=grid.parentId if grid else None,
                managerName=grid.managerName if grid else None,
                peopleCount=people_counts.get(grid_id, 0),
                houseCount=house_counts.get(grid_id, 0),
                visitCount=visit_counts.get(grid_id, 0),
                conflictCount=conflict_counts.get(grid_id, 0),
            )
        )
    return items


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

        district_name, street_name, community_name = _parse_grid_hierarchy(grid.name)
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
    return _build_dashboard(session)


@router.get("/grids", response_model=StatsGridListRead)
def read_grids(session: Session = Depends(get_session)) -> StatsGridListRead:
    return _build_grid_list(session)


@router.get("/performance", response_model=StatsPerformanceRead)
def read_performance(session: Session = Depends(get_session)) -> StatsPerformanceRead:
    return _build_performance(session)
