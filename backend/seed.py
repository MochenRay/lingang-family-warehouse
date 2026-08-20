from __future__ import annotations

from collections.abc import Sequence
from datetime import date, timedelta
from pathlib import Path
import sys
from typing import TypeVar

from sqlalchemy import delete
from sqlmodel import Session

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from app.config import get_settings
from app.database import engine, init_database
from app.demo_data import DemoSeedBundle
from app.demo_data.hero_cases import build_hero_bundle
from app.demo_data.knowledge import build_knowledge_records
from app.demo_data.notices import build_notice_records
from app.demo_data.task_rules import build_task_rule_records
from app.demo_data.regions import REGION_GRID_BY_ID
from app.models.conflict import ConflictRecord
from app.models.grid import Grid
from app.models.house import House, HousingHistory
from app.models.knowledge import KnowledgeRecord
from app.models.notice import NoticeRecord
from app.models.person import Person
from app.models.task_rule import TaskRule
from app.models.tag import PersonTagAssignment
from app.models.visit import VisitRecord

RecordT = TypeVar("RecordT")
CANONICAL_RESOLVED_CONFLICT_IDS = {"c_bg_004", "c_bg_005", "c_bg_010"}


def build_demo_seed_bundle(
    *,
    freshness_reference_date: date | None = None,
) -> DemoSeedBundle:
    hero_bundle = build_hero_bundle()

    from app.demo_data.background_generator import build_background_bundle

    background_bundle = build_background_bundle(hero_bundle, seed=20260415)
    bundle = hero_bundle.extend(background_bundle)
    bundle.knowledge_records.extend(build_knowledge_records())
    bundle.notices.extend(build_notice_records())
    bundle.task_rules.extend(build_task_rule_records())
    _restore_canonical_conflict_statuses(bundle)
    _enforce_demo_consistency(bundle)
    _rebalance_background_task_freshness(
        bundle,
        reference_date=freshness_reference_date or date.today(),
    )
    _enforce_first_page_depth(bundle)
    return bundle


def _restore_canonical_conflict_statuses(bundle: DemoSeedBundle) -> None:
    """Keep the pre-redistribution conflict KPI while retaining deterministic records."""
    for conflict in bundle.conflicts:
        if conflict.id.startswith("c_bg_"):
            conflict.status = (
                "已化解" if conflict.id in CANONICAL_RESOLVED_CONFLICT_IDS else "调解中"
            )


def _enforce_demo_consistency(bundle: DemoSeedBundle) -> None:
    """Keep housing histories logically complete without changing migration totals."""
    houses_by_id = {house.id: house for house in bundle.houses}
    histories_by_house: dict[str, list[HousingHistory]] = {}
    for history in bundle.housing_histories:
        histories_by_house.setdefault(history.houseId, []).append(history)

    for person in bundle.people:
        if not person.houseId or person.houseId not in houses_by_id:
            continue
        existing = histories_by_house.get(person.houseId, [])
        has_current_record = any(
            history.personName == person.name
            and history.period.split("~", maxsplit=1)[-1].strip() == "至今"
            for history in existing
        )
        if has_current_record:
            continue
        house = houses_by_id[person.houseId]
        stable_number = sum(ord(char) for char in person.id)
        start = date(2024, 1, 1) + timedelta(days=stable_number % 330)
        history = HousingHistory(
            id=f"hh_current_{person.id}",
            houseId=person.houseId,
            personName=person.name,
            type=(
                "租客"
                if house.type == "出租"
                else "业主" if person.name == house.ownerName else "家属"
            ),
            period=f"{start.isoformat()} ~ 至今",
            moveOutReason=None,
        )
        bundle.housing_histories.append(history)
        histories_by_house.setdefault(person.houseId, []).append(history)


def _enforce_first_page_depth(bundle: DemoSeedBundle) -> None:
    """Keep the final date-sorted first page useful after freshness rebalancing."""
    people_by_house: dict[str, list[Person]] = {}
    for person in bundle.people:
        if person.houseId:
            people_by_house.setdefault(person.houseId, []).append(person)

    first_page = sorted(
        bundle.people,
        key=lambda person: (person.updatedAt, person.id),
        reverse=True,
    )[:20]
    people_by_grid: dict[str, list[Person]] = {}
    for person in bundle.people:
        people_by_grid.setdefault(person.gridId, []).append(person)

    for index, person in enumerate(first_page):
        co_residents = [
            candidate
            for candidate in people_by_house.get(person.houseId or "", [])
            if candidate.id != person.id
        ]
        if not co_residents and not person.familyRelations:
            candidates = [candidate for candidate in people_by_grid[person.gridId] if candidate.id != person.id]
            if candidates:
                related = candidates[index % len(candidates)]
                person.familyRelations = [
                    {"relatedPersonId": related.id, "relationType": "兄弟姐妹"}
                ]

    visits_by_person: dict[str, list[VisitRecord]] = {}
    for visit in bundle.visits:
        if visit.targetType == "person":
            visits_by_person.setdefault(visit.targetId, []).append(visit)

    templates = (
        ("常规走访", "核对联系方式、实际居住状态和近期服务诉求。"),
        ("风险复核", "复核重点标签、风险变化和上一轮处置结果。"),
        ("服务回访", "跟进已登记需求，确认办理进度并约定下一次联系时间。"),
    )
    anchor = date(2026, 7, 29)
    for person_index, person in enumerate(first_page):
        minimum = 3 if person.risk == "High" else 2 if person.risk == "Medium" else 1
        current = visits_by_person.setdefault(person.id, [])
        for visit_index in range(len(current), minimum):
            tag, content = templates[visit_index % len(templates)]
            visit = VisitRecord(
                id=f"v_first_{person.id}_{visit_index + 1}",
                targetId=person.id,
                targetType="person",
                gridId=person.gridId,
                visitorName=REGION_GRID_BY_ID[person.gridId].manager_name,
                date=(anchor - timedelta(days=person_index * 2 + visit_index * 11)).isoformat(),
                content=content,
                images=[],
                tags=[tag],
            )
            bundle.visits.append(visit)
            current.append(visit)


def _rebalance_background_task_freshness(
    bundle: DemoSeedBundle,
    *,
    reference_date: date,
) -> None:
    """Keep rule-generated overdue counts useful for severity demos instead of all-red noise."""
    fresh_date = (reference_date - timedelta(days=1)).isoformat()
    overdue_date = (reference_date - timedelta(days=20)).isoformat()
    background_grid_ids = set(REGION_GRID_BY_ID) - {"g1", "g2"}
    medium_grid_ids = {"g_zf_1", "g_fs_1", "g_mp_1"}
    people_by_grid: dict[str, list[Person]] = {}
    for person in bundle.people:
        if person.gridId in background_grid_ids:
            people_by_grid.setdefault(person.gridId, []).append(person)

    for conflict in bundle.conflicts:
        if conflict.gridId in background_grid_ids and conflict.status != "已化解":
            conflict.updatedAt = f"{fresh_date} 10:00:00"

    for grid_id in sorted(background_grid_ids):
        eligible = sorted(
            (
                person
                for person in people_by_grid.get(grid_id, [])
                if person.risk == "High" or bool(person.careLabels)
            ),
            key=lambda person: person.id,
        )
        if grid_id in medium_grid_ids and not eligible:
            candidates = sorted(people_by_grid.get(grid_id, []), key=lambda person: person.id)
            if candidates:
                candidates[0].risk = "High"
                eligible = [candidates[0]]

        preserved_overdue_ids = {
            person.id for person in eligible[:1]
        } if grid_id in medium_grid_ids else set()
        preserved_house_ids = {
            person.houseId
            for person in eligible
            if person.id in preserved_overdue_ids and person.houseId
        }

        for visit in bundle.visits:
            if (
                visit.targetId in preserved_overdue_ids
                or visit.targetId in preserved_house_ids
            ):
                visit.date = overdue_date

        for person in eligible:
            if person.id in preserved_overdue_ids:
                person.updatedAt = overdue_date
                continue
            bundle.visits.append(VisitRecord(
                id=f"v_task_fresh_{person.id}",
                targetId=person.id,
                targetType="person",
                gridId=person.gridId,
                visitorName=REGION_GRID_BY_ID[person.gridId].manager_name,
                date=fresh_date,
                content="完成近期风险与关爱对象复核，当前无需生成超期任务。",
                images=[],
                tags=["近期复核"],
            ))


def purge_existing_data(session: Session) -> None:
    for model in (PersonTagAssignment, TaskRule, NoticeRecord, KnowledgeRecord, ConflictRecord, VisitRecord, Person, HousingHistory, House, Grid):
        session.exec(delete(model))
    session.commit()


def insert_records(session: Session, records: Sequence[RecordT]) -> None:
    session.add_all(records)
    session.commit()


def summarize_hero_cases(bundle: DemoSeedBundle) -> dict[str, int]:
    people = bundle.people
    houses = bundle.houses
    conflicts = bundle.conflicts

    return {
        "独居老人": sum("独居老人" in (person.tags + (person.careLabels or [])) for person in people),
        "群租房": sum("群租风险" in house.tags for house in houses),
        "重点关注对象": sum(
            "重点关注" in person.tags
            or bool((person.categoryLabels or {}).get("focusType"))
            for person in people
        ),
        "长期未走访对象": sum("长期未走访" in person.tags for person in people),
        "矛盾纠纷对象": len(conflicts),
        "低保困难家庭": sum(
            "低保家庭" in person.tags or "困难" in (person.careLabels or [])
            for person in people
        ),
    }


def main() -> None:
    init_database()
    reference_time = get_settings().effective_test_reference_time
    bundle = build_demo_seed_bundle(
        freshness_reference_date=reference_time.date() if reference_time else None,
    )
    hero_coverage = summarize_hero_cases(bundle)

    with Session(engine) as session:
        purge_existing_data(session)
        insert_records(session, bundle.grids)
        insert_records(session, bundle.houses)
        insert_records(session, bundle.housing_histories)
        insert_records(session, bundle.people)
        insert_records(session, bundle.visits)
        insert_records(session, bundle.conflicts)
        insert_records(session, bundle.knowledge_records)
        insert_records(session, bundle.notices)
        insert_records(session, bundle.task_rules)

    print("Seed completed.")
    print("Counts:", bundle.counts())
    print("Hero coverage:", hero_coverage)


if __name__ == "__main__":
    main()
