from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlmodel import Session, select

from app.models.conflict import ConflictRecord
from app.models.house import House
from app.models.person import Person
from app.models.tag import PersonTagAssignment, TagDefinition
from app.models.visit import VisitRecord
from app.schemas.tag import (
    TagDefinitionRead,
    TaggedHouseSummaryRead,
    TagMatchRead,
    TagSnapshotRead,
    TaggedPersonSummaryRead,
    TaggedPersonRead,
)

SHANGHAI = ZoneInfo("Asia/Shanghai")

SYSTEM_TAGS = (
    {
        "id": "tag_released_offender",
        "name": "刑满释放",
        "type": "ordinary",
        "description": "刑满释放后纳入社区衔接与服务台账的人员。",
        "category": "重点关注",
        "riskLevel": "High",
        "conditions": [],
    },
    {
        "id": "tag_drug_history",
        "name": "吸毒人员",
        "type": "ordinary",
        "description": "需要由工作人员根据线下核实结果人工维护的重点人员标签。",
        "category": "重点关注",
        "riskLevel": "High",
        "conditions": [],
    },
    {
        "id": "tag_senior",
        "name": "高龄老人",
        "type": "smart",
        "description": "年龄达到 80 岁后自动纳入高龄关爱范围。",
        "category": "重点关爱",
        "riskLevel": "Medium",
        "conditions": [{"field": "age", "operator": "gte", "value": 80}],
    },
    {
        "id": "tag_high_age_living_alone",
        "name": "高龄独居",
        "type": "smart",
        "description": "年龄达到 80 岁且当前同住人数不超过 1 人。",
        "category": "重点关爱",
        "riskLevel": "High",
        "conditions": [
            {"field": "age", "operator": "gte", "value": 80},
            {"field": "household_size", "operator": "lte", "value": 1},
        ],
    },
    {
        "id": "tag_key_stability_control",
        "name": "重点稳控",
        "type": "smart",
        "description": "高风险或存在重点关注类型的对象自动进入稳控台账。",
        "category": "重点关注",
        "riskLevel": "High",
        "conditions": [{"field": "risk", "operator": "eq", "value": "High"}],
    },
    {
        "id": "tag_frequent_conflict",
        "name": "矛盾频发",
        "type": "smart",
        "description": "存在未化解纠纷或累计多次纠纷关联的人员。",
        "category": "矛盾治理",
        "riskLevel": "Medium",
        "conditions": [{"field": "risk", "operator": "neq", "value": "Low"}],
    },
    {
        "id": "tag_pending_followup",
        "name": "待回访",
        "type": "smart",
        "description": "存在未化解纠纷或重点对象走访间隔超过 14 天。",
        "category": "走访治理",
        "riskLevel": "Medium",
        "conditions": [{"field": "risk", "operator": "neq", "value": "Low"}],
    },
    {
        "id": "tag_long_time_no_visit",
        "name": "长期未访",
        "type": "smart",
        "description": "没有走访记录或最近一次走访已超过 30 天。",
        "category": "走访治理",
        "riskLevel": "Medium",
        "conditions": [{"field": "risk", "operator": "neq", "value": "Low"}],
    },
)


def normalize_tag_name(value: str) -> str:
    return " ".join(value.strip().casefold().split())


def _now() -> datetime:
    return datetime.now(SHANGHAI)


def _now_string() -> str:
    return _now().isoformat(timespec="seconds")


def ensure_system_tags(session: Session) -> None:
    existing_ids = set(session.exec(select(TagDefinition.id)))
    created_at = _now_string()
    additions = [
        TagDefinition(
            **definition,
            normalizedName=normalize_tag_name(definition["name"]),
            status="enabled",
            isSystem=True,
            createdBy="系统",
            createdAt=created_at,
            updatedAt=created_at,
        )
        for definition in SYSTEM_TAGS
        if definition["id"] not in existing_ids
    ]
    if additions:
        session.add_all(additions)
        session.commit()


def _person_age(person: Person, today: date) -> int:
    candidates: list[str] = []
    if person.birthDate:
        candidates.append(person.birthDate)
    identity_birth_date = _identity_card_birth_date(person.idCard)
    if identity_birth_date:
        candidates.append(identity_birth_date)

    for raw in candidates:
        normalized = raw.strip().replace("/", "-")
        try:
            if len(normalized) == 7:
                born = date.fromisoformat(f"{normalized}-01")
            elif len(normalized) == 8 and normalized.isdigit():
                born = date(int(normalized[:4]), int(normalized[4:6]), int(normalized[6:8]))
            else:
                born = date.fromisoformat(normalized[:10])
        except ValueError:
            continue
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    return person.age


def _identity_card_birth_date(raw: str) -> str | None:
    normalized = raw.strip().upper()
    if len(normalized) == 18 and normalized[:17].isdigit() and normalized[-1] in "0123456789X":
        weights = (7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2)
        checks = "10X98765432"
        expected = checks[sum(int(character) * weight for character, weight in zip(normalized[:17], weights)) % 11]
        if normalized[-1] != expected:
            return None
        candidate = normalized[6:14]
    elif len(normalized) == 15 and normalized.isdigit():
        candidate = f"19{normalized[6:12]}"
    else:
        return None

    try:
        born = date(int(candidate[:4]), int(candidate[4:6]), int(candidate[6:8]))
    except ValueError:
        return None
    return born.isoformat()


def _compare(actual: int | str | None, operator: str, expected: int | str) -> bool:
    if actual is None:
        return False
    if operator == "eq":
        return actual == expected
    if operator == "neq":
        return actual != expected
    if not isinstance(actual, int) or not isinstance(expected, int):
        return False
    if operator == "gt":
        return actual > expected
    if operator == "gte":
        return actual >= expected
    if operator == "lt":
        return actual < expected
    if operator == "lte":
        return actual <= expected
    return False


def _condition_label(field: str, operator: str, value: int | str) -> str:
    field_label = {
        "age": "年龄",
        "household_size": "同住人数",
        "person_type": "居住类型",
        "risk": "风险等级",
    }.get(field, field)
    operator_label = {"eq": "=", "neq": "≠", "gt": ">", "gte": "≥", "lt": "<", "lte": "≤"}.get(operator, operator)
    displayed_value = {
        "High": "高风险",
        "Medium": "中风险",
        "Low": "低风险",
    }.get(value, value) if field == "risk" else value
    return f"{field_label} {operator_label} {displayed_value}"


def _generic_smart_match(
    tag: TagDefinition,
    person: Person,
    *,
    age: int,
    household_size: int | None,
) -> tuple[bool, list[str]]:
    values: dict[str, int | str | None] = {
        "age": age,
        "household_size": household_size,
        "person_type": person.type,
        "risk": person.risk,
    }
    reasons: list[str] = []
    for condition in tag.conditions:
        field = str(condition.get("field", ""))
        operator = str(condition.get("operator", ""))
        expected = condition.get("value")
        if not isinstance(expected, (int, str)) or not _compare(values.get(field), operator, expected):
            return False, []
        reasons.append(_condition_label(field, operator, expected))
    return bool(tag.conditions), reasons


def _system_smart_match(
    tag: TagDefinition,
    person: Person,
    *,
    age: int,
    household_size: int | None,
    last_visit: str | None,
    conflicts: list[ConflictRecord],
    now: datetime,
) -> tuple[bool, list[str]] | None:
    active_conflicts = sum(conflict.status != "已化解" for conflict in conflicts)
    days_since_visit = None
    if last_visit:
        try:
            visited_at = datetime.fromisoformat(last_visit.replace("Z", "+00:00"))
            if visited_at.tzinfo is None:
                visited_at = visited_at.replace(tzinfo=SHANGHAI)
            days_since_visit = max(0, (now.date() - visited_at.astimezone(SHANGHAI).date()).days)
        except ValueError:
            days_since_visit = None

    if tag.id == "tag_senior":
        return age >= 80, [f"年龄 {age} 岁"] if age >= 80 else []
    if tag.id == "tag_high_age_living_alone":
        matched = age >= 80 and household_size is not None and household_size <= 1
        return matched, [f"年龄 {age} 岁", f"当前同住 {household_size} 人"] if matched else []
    if tag.id == "tag_key_stability_control":
        focus_types = person.categoryLabels.get("focusType", []) if person.categoryLabels else []
        matched = person.risk == "High" or bool(focus_types) or "重点关注" in person.tags
        return matched, ["高风险或存在重点关注类型"] if matched else []
    if tag.id == "tag_frequent_conflict":
        matched = active_conflicts >= 1 or len(conflicts) >= 2
        return matched, [f"关联纠纷 {len(conflicts)} 起，其中未化解 {active_conflicts} 起"] if matched else []
    if tag.id == "tag_pending_followup":
        matched = active_conflicts >= 1 or (
            days_since_visit is not None and days_since_visit >= 14 and person.risk != "Low"
        )
        reasons = []
        if active_conflicts:
            reasons.append("存在未化解纠纷")
        if days_since_visit is not None and days_since_visit >= 14:
            reasons.append(f"距最近走访 {days_since_visit} 天")
        return matched, reasons
    if tag.id == "tag_long_time_no_visit":
        matched = last_visit is None or (days_since_visit is not None and days_since_visit >= 30)
        return matched, ["暂无走访记录" if last_visit is None else f"距最近走访 {days_since_visit} 天"] if matched else []
    return None


def build_tag_snapshot(session: Session, *, now: datetime | None = None) -> TagSnapshotRead:
    ensure_system_tags(session)
    current = now or _now()
    people = list(session.exec(select(Person)))
    houses = list(session.exec(select(House)))
    visits = list(session.exec(select(VisitRecord)))
    conflicts = list(session.exec(select(ConflictRecord)))
    tags = [tag for tag in session.exec(select(TagDefinition)) if tag.status == "enabled"]
    assignments = list(session.exec(select(PersonTagAssignment)))

    houses_by_id = {house.id: house for house in houses}
    household_sizes = Counter(person.houseId for person in people if person.houseId)
    visits_by_target: dict[str, list[VisitRecord]] = defaultdict(list)
    for visit in visits:
        visits_by_target[visit.targetId].append(visit)
    conflicts_by_person: dict[str, list[ConflictRecord]] = defaultdict(list)
    for conflict in conflicts:
        for party in conflict.involvedParties:
            party_id = party.get("id") if isinstance(party, dict) else None
            if isinstance(party_id, str):
                conflicts_by_person[party_id].append(conflict)
    manual_by_person: dict[str, set[str]] = defaultdict(set)
    for assignment in assignments:
        manual_by_person[assignment.personId].add(assignment.tagId)

    coverage = Counter()
    tagged_people: list[TaggedPersonRead] = []
    for person in people:
        house = houses_by_id.get(person.houseId or "")
        related_visits = [
            *visits_by_target.get(person.id, []),
            *visits_by_target.get(person.houseId or "", []),
        ]
        last_visit = max((visit.date for visit in related_visits), default=None)
        related_conflicts = conflicts_by_person.get(person.id, [])
        age = _person_age(person, current.date())
        household_size = household_sizes.get(person.houseId) if house is not None else None
        matches: list[TagMatchRead] = []

        for tag in tags:
            if tag.type == "ordinary":
                if tag.id in manual_by_person.get(person.id, set()):
                    matches.append(TagMatchRead(tagId=tag.id, tagName=tag.name, reasons=["管理员人工标记"], source="manual"))
                    coverage[tag.id] += 1
                continue
            special = _system_smart_match(
                tag,
                person,
                age=age,
                household_size=household_size,
                last_visit=last_visit,
                conflicts=related_conflicts,
                now=current,
            ) if tag.isSystem else None
            matched, reasons = special or _generic_smart_match(
                tag,
                person,
                age=age,
                household_size=household_size,
            )
            if matched:
                matches.append(TagMatchRead(tagId=tag.id, tagName=tag.name, reasons=reasons, source="smart"))
                coverage[tag.id] += 1

        if matches:
            tagged_people.append(TaggedPersonRead(
                person=TaggedPersonSummaryRead.model_validate(person),
                house=TaggedHouseSummaryRead.model_validate(house) if house else None,
                lastVisitAt=last_visit,
                totalConflictCount=len(related_conflicts),
                activeConflictCount=sum(conflict.status != "已化解" for conflict in related_conflicts),
                matchedTags=matches,
            ))

    tag_reads = [
        TagDefinitionRead(**tag.model_dump(), coverageCount=coverage[tag.id])
        for tag in sorted(tags, key=lambda item: (not item.isSystem, item.createdAt, item.id))
    ]
    return TagSnapshotRead(
        generatedAt=current.isoformat(timespec="seconds"),
        totalPeople=len(people),
        tags=tag_reads,
        people=tagged_people,
    )
