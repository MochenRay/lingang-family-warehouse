from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path
import sys
from typing import TypeVar

from sqlalchemy import delete
from sqlmodel import Session

CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from app.database import engine, init_database
from app.demo_data import DemoSeedBundle
from app.demo_data.hero_cases import build_hero_bundle
from app.demo_data.task_rules import build_task_rule_records
from app.models.conflict import ConflictRecord
from app.models.grid import Grid
from app.models.house import House, HousingHistory
from app.models.person import Person
from app.models.task_rule import TaskRule
from app.models.visit import VisitRecord

RecordT = TypeVar("RecordT")


def build_demo_seed_bundle() -> DemoSeedBundle:
    hero_bundle = build_hero_bundle()

    from app.demo_data.background_generator import build_background_bundle

    background_bundle = build_background_bundle(hero_bundle, seed=20260415)
    bundle = hero_bundle.extend(background_bundle)
    bundle.task_rules.extend(build_task_rule_records())
    return bundle


def purge_existing_data(session: Session) -> None:
    for model in (TaskRule, ConflictRecord, VisitRecord, Person, HousingHistory, House, Grid):
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
    bundle = build_demo_seed_bundle()
    hero_coverage = summarize_hero_cases(bundle)

    with Session(engine) as session:
        purge_existing_data(session)
        insert_records(session, bundle.grids)
        insert_records(session, bundle.houses)
        insert_records(session, bundle.housing_histories)
        insert_records(session, bundle.people)
        insert_records(session, bundle.visits)
        insert_records(session, bundle.conflicts)
        insert_records(session, bundle.task_rules)

    print("Seed completed.")
    print("Counts:", bundle.counts())
    print("Hero coverage:", hero_coverage)


if __name__ == "__main__":
    main()
