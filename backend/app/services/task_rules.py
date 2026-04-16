from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from sqlmodel import Session, select

from app.models.conflict import ConflictRecord
from app.models.house import House
from app.models.person import Person
from app.models.task_rule import TaskRule
from app.models.visit import VisitRecord
from app.schemas.task_rule import (
    TaskProjectionItemRead,
    TaskProjectionRead,
    TaskProjectionSummaryRead,
    TaskRuleRead,
)


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    candidates = (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d %H:%M",
    )
    for pattern in candidates:
        try:
            return datetime.strptime(value, pattern)
        except ValueError:
            continue

    normalized = value.replace("年", "-").replace("月", "-").replace("日", "")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def to_datetime_string(value: datetime) -> str:
    return value.strftime("%Y-%m-%d %H:%M")


def days_since(value: str | None) -> int:
    parsed = parse_datetime(value)
    if parsed is None:
        return 10_000
    return max((datetime.now() - parsed).days, 0)


def summarize_content(content: str, max_length: int = 72) -> str:
    normalized = " ".join(content.split())
    if len(normalized) <= max_length:
        return normalized
    return f"{normalized[:max_length]}..."


def _priority_rank(value: str) -> int:
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    return order.get(value, 9)


def _build_visit_task_id(rule_id: str, person_id: str) -> str:
    return f"{rule_id}__{person_id}"


def _build_visit_done_task_id(visit_id: str) -> str:
    return f"visit_done__{visit_id}"


def _build_conflict_task_id(conflict_id: str) -> str:
    return f"conflict__{conflict_id}"


def _build_conflict_done_task_id(conflict_id: str) -> str:
    return f"conflict_done__{conflict_id}"


def _load_entities(session: Session, grid_id: str | None = None) -> tuple[list[TaskRule], list[Person], list[House], list[VisitRecord], list[ConflictRecord]]:
    rules = list(session.exec(select(TaskRule)).all())
    people_query = select(Person)
    houses_query = select(House)
    visits_query = select(VisitRecord)
    conflicts_query = select(ConflictRecord)

    if grid_id:
        people_query = people_query.where(Person.gridId == grid_id)
        houses_query = houses_query.where(House.gridId == grid_id)
        visits_query = visits_query.where(VisitRecord.gridId == grid_id)
        conflicts_query = conflicts_query.where(ConflictRecord.gridId == grid_id)

    people = list(session.exec(people_query).all())
    houses = list(session.exec(houses_query).all())
    visits = list(session.exec(visits_query).all())
    conflicts = list(session.exec(conflicts_query).all())
    return rules, people, houses, visits, conflicts


def _build_visits_by_person_id(people: list[Person], visits: list[VisitRecord], houses_by_id: dict[str, House]) -> dict[str, list[VisitRecord]]:
    residents_by_house_id: dict[str, list[str]] = {}
    for person in people:
        if person.houseId:
            residents_by_house_id.setdefault(person.houseId, []).append(person.id)

    visits_by_person_id: dict[str, list[VisitRecord]] = {}
    for visit in visits:
        if visit.targetType == "person":
            visits_by_person_id.setdefault(visit.targetId, []).append(visit)
            continue

        if visit.targetType == "house" and visit.targetId in houses_by_id:
            for resident_id in residents_by_house_id.get(visit.targetId, []):
                visits_by_person_id.setdefault(resident_id, []).append(visit)

    for bucket in visits_by_person_id.values():
        bucket.sort(key=lambda item: (parse_datetime(item.date) or datetime.min, item.id), reverse=True)
    return visits_by_person_id


def _rule_matches_person(rule: TaskRule, person: Person, latest_visit: VisitRecord | None) -> bool:
    idle_days = days_since(latest_visit.date if latest_visit else person.updatedAt)
    max_idle_days = int(rule.conditions.get("maxIdleDays", 7))
    match_mode = rule.conditions.get("match")

    if match_mode == "care_label":
        return bool(person.careLabels) and idle_days >= max_idle_days
    if match_mode == "high_risk":
        return person.risk == "High" and idle_days >= max_idle_days
    return False


def _build_person_task(rule: TaskRule, person: Person, latest_visit: VisitRecord | None) -> TaskProjectionItemRead:
    idle_days = days_since(latest_visit.date if latest_visit else person.updatedAt)
    urgent_after_days = int(rule.conditions.get("urgentAfterDays", 7))
    deadline_days = int(rule.action.get("deadlineDays", rule.conditions.get("maxIdleDays", 7)))
    deadline_base = latest_visit.date if latest_visit else person.updatedAt
    urgent = idle_days >= urgent_after_days

    signals = [
        person.risk == "High" and rule.id == "rule_risk_watch" and "高风险对象" or None,
        person.careLabels and rule.id == "rule_visit_followup" and f"关爱标签：{'、'.join(person.careLabels[:2])}" or None,
        not person.phone and "缺少联系电话" or None,
        latest_visit and f"距上次走访已 {idle_days} 天" or "暂无历史走访",
    ]

    title = f"{person.name}{'风险关注' if rule.id == 'rule_risk_watch' else '重点走访'}"
    return TaskProjectionItemRead(
        id=_build_visit_task_id(rule.id, person.id),
        title=title,
        type=rule.taskType,
        sourceKind="person",
        sourceId=person.id,
        gridId=person.gridId,
        route=f"person-detail/{person.id}",
        priority=rule.priority,
        urgent=urgent,
        description="，".join([item for item in signals if item]),
        assignedBy=str(rule.action.get("assignedBy", "系统规则")),
        deadline=to_datetime_string((parse_datetime(deadline_base) or datetime.now()) + timedelta(days=deadline_days)),
        status="pending",
        statusLabel=str(rule.action.get("statusLabel", "待处理")),
        personId=person.id,
        houseId=person.houseId,
    )


def _build_pending_person_tasks(person_rules: list[TaskRule], people: list[Person], visits_by_person_id: dict[str, list[VisitRecord]]) -> tuple[list[TaskProjectionItemRead], dict[str, int]]:
    tasks: list[TaskProjectionItemRead] = []
    covered_counts = {rule.id: 0 for rule in person_rules}
    ordered_rules = sorted(person_rules, key=lambda item: (_priority_rank(item.priority), item.id))

    for person in people:
        latest_visit = (visits_by_person_id.get(person.id) or [None])[0]
        matched_rule = next((rule for rule in ordered_rules if _rule_matches_person(rule, person, latest_visit)), None)
        if matched_rule is None:
            continue
        tasks.append(_build_person_task(matched_rule, person, latest_visit))
        covered_counts[matched_rule.id] += 1

    tasks.sort(key=lambda item: (parse_datetime(item.deadline) or datetime.max, _priority_rank(item.priority), item.id))
    return tasks, covered_counts


def _build_pending_conflict_tasks(rule: TaskRule | None, conflicts: list[ConflictRecord]) -> tuple[list[TaskProjectionItemRead], int]:
    if rule is None:
        return [], 0

    max_idle_days = int(rule.conditions.get("maxIdleDays", 3))
    overdue_after_days = int(rule.conditions.get("overdueAfterDays", 7))
    urgent_sources = {str(item) for item in rule.conditions.get("urgentSources", [])}
    deadline_days = int(rule.action.get("deadlineDays", max_idle_days))

    tasks: list[TaskProjectionItemRead] = []
    for conflict in conflicts:
        if conflict.status == "已化解":
            continue

        idle_days = days_since(conflict.updatedAt or conflict.createdAt)
        if idle_days < max_idle_days:
            continue

        urgent = idle_days >= overdue_after_days or conflict.source in urgent_sources
        tasks.append(
            TaskProjectionItemRead(
                id=_build_conflict_task_id(conflict.id),
                title=f"跟进：{conflict.title}",
                type=rule.taskType,
                sourceKind="conflict",
                sourceId=conflict.id,
                gridId=conflict.gridId,
                route=f"conflict-detail/{conflict.id}",
                priority=rule.priority,
                urgent=urgent,
                description=summarize_content(conflict.description, 72),
                assignedBy=str(rule.action.get("assignedBy", conflict.source)),
                deadline=to_datetime_string((parse_datetime(conflict.updatedAt or conflict.createdAt) or datetime.now()) + timedelta(days=deadline_days)),
                status="pending",
                statusLabel="回访超期" if idle_days >= overdue_after_days else str(rule.action.get("statusLabel", "待跟进")),
                conflictId=conflict.id,
                personId=next((party.get("id") for party in conflict.involvedParties if party.get("type") == "resident"), None),
            )
        )

    tasks.sort(key=lambda item: (parse_datetime(item.deadline) or datetime.max, _priority_rank(item.priority), item.id))
    return tasks, len(tasks)


def _build_completed_visit_tasks(people_by_id: dict[str, Person], visits: list[VisitRecord]) -> list[TaskProjectionItemRead]:
    tasks: list[TaskProjectionItemRead] = []
    for visit in visits:
        if visit.targetType != "person":
            continue
        person = people_by_id.get(visit.targetId)
        if person is None:
            continue
        if days_since(visit.date) > 30:
            continue
        tasks.append(
            TaskProjectionItemRead(
                id=_build_visit_done_task_id(visit.id),
                title=f"完成走访：{person.name}",
                type="走访反馈",
                sourceKind="person",
                sourceId=person.id,
                gridId=person.gridId,
                route=f"person-detail/{person.id}",
                priority="high" if person.risk == "High" else "medium",
                urgent=False,
                description=summarize_content(visit.content, 72),
                assignedBy=visit.visitorName,
                completedAt=visit.date,
                status="completed",
                statusLabel="已回访",
                feedback=summarize_content(visit.content, 88),
                personId=person.id,
                houseId=person.houseId,
                visitId=visit.id,
                onTime=True,
            )
        )
    tasks.sort(key=lambda item: (parse_datetime(item.completedAt) or datetime.min, item.id), reverse=True)
    return tasks[:12]


def _build_completed_conflict_tasks(conflicts: list[ConflictRecord]) -> list[TaskProjectionItemRead]:
    tasks: list[TaskProjectionItemRead] = []
    for conflict in conflicts:
        if conflict.status != "已化解":
            continue
        tasks.append(
            TaskProjectionItemRead(
                id=_build_conflict_done_task_id(conflict.id),
                title=f"完成调解：{conflict.title}",
                type="矛盾调解",
                sourceKind="conflict",
                sourceId=conflict.id,
                gridId=conflict.gridId,
                route=f"conflict-detail/{conflict.id}",
                priority="medium",
                urgent=False,
                description=summarize_content(conflict.description, 72),
                assignedBy=conflict.source,
                completedAt=conflict.updatedAt,
                status="completed",
                statusLabel="已化解",
                feedback=conflict.timeline[-1]["content"] if conflict.timeline else None,
                conflictId=conflict.id,
                personId=next((party.get("id") for party in conflict.involvedParties if party.get("type") == "resident"), None),
                onTime=days_since(conflict.updatedAt) <= 7,
            )
        )
    tasks.sort(key=lambda item: (parse_datetime(item.completedAt) or datetime.min, item.id), reverse=True)
    return tasks[:12]


def build_task_projection(session: Session, grid_id: str | None = None) -> TaskProjectionRead:
    rules, people, houses, visits, conflicts = _load_entities(session, grid_id=grid_id)
    houses_by_id = {house.id: house for house in houses}
    people_by_id = {person.id: person for person in people}
    visits_by_person_id = _build_visits_by_person_id(people, visits, houses_by_id)

    person_rules = [rule for rule in rules if rule.enabled and rule.subjectType == "person"]
    conflict_rule = next((rule for rule in rules if rule.enabled and rule.subjectType == "conflict"), None)

    pending_person_tasks, _ = _build_pending_person_tasks(person_rules, people, visits_by_person_id)
    pending_conflict_tasks, _ = _build_pending_conflict_tasks(conflict_rule, conflicts)
    pending = sorted(
        [*pending_conflict_tasks, *pending_person_tasks],
        key=lambda item: (
            0 if (parse_datetime(item.deadline) or datetime.max) < datetime.now() else 1,
            0 if item.urgent else 1,
            parse_datetime(item.deadline) or datetime.max,
            item.id,
        ),
    )

    completed = sorted(
        [
            *_build_completed_conflict_tasks(conflicts),
            *_build_completed_visit_tasks(people_by_id, visits),
        ],
        key=lambda item: (parse_datetime(item.completedAt) or datetime.min, item.id),
        reverse=True,
    )

    overdue = sum(1 for item in pending if (parse_datetime(item.deadline) or datetime.max) < datetime.now())
    total = len(pending) + len(completed)
    summary = TaskProjectionSummaryRead(
        pending=len(pending),
        overdue=overdue,
        completed=len(completed),
        completionRate=round((len(completed) / total) * 100) if total else 100,
    )
    return TaskProjectionRead(pending=pending, completed=completed, summary=summary)


def list_task_rules_with_coverage(session: Session, grid_id: str | None = None) -> list[TaskRuleRead]:
    rules, people, houses, visits, conflicts = _load_entities(session, grid_id=grid_id)
    houses_by_id = {house.id: house for house in houses}
    visits_by_person_id = _build_visits_by_person_id(people, visits, houses_by_id)
    person_rules = [rule for rule in rules if rule.subjectType == "person" and rule.enabled]
    _, person_coverage = _build_pending_person_tasks(person_rules, people, visits_by_person_id)
    conflict_rule = next((rule for rule in rules if rule.subjectType == "conflict" and rule.enabled), None)
    _, conflict_coverage = _build_pending_conflict_tasks(conflict_rule, conflicts)

    rule_reads: list[TaskRuleRead] = []
    for rule in sorted(rules, key=lambda item: (_priority_rank(item.priority), item.name, item.id)):
        covered_count = 0
        if rule.subjectType == "person":
            covered_count = person_coverage.get(rule.id, 0) if rule.enabled else 0
        elif rule.subjectType == "conflict":
            covered_count = conflict_coverage if rule.enabled and conflict_rule and conflict_rule.id == rule.id else 0

        rule_reads.append(
            TaskRuleRead(
                **rule.model_dump(),
                coveredCount=covered_count,
            )
        )
    return rule_reads
