from collections import Counter
from datetime import date, datetime

from app.api.stats import (
    DEMOGRAPHICS_EDUCATION_ORDER,
    DEMOGRAPHICS_NATION_ORDER,
    RISK_TAGS,
    _normalize_demographics_education,
    _normalize_demographics_nation,
    _risk_tag_delta,
)
from app.demo_data.background_generator import (
    MIGRATION_REFERENCE_DATE,
    RECENT_MIGRATION_MONTHS,
)
from seed import build_demo_seed_bundle


def test_demo_people_cover_every_demographic_bucket_from_person_records() -> None:
    bundle = build_demo_seed_bundle()

    type_counts = Counter(person.type for person in bundle.people)
    education_counts = Counter(
        _normalize_demographics_education(person.education) for person in bundle.people
    )
    nation_counts = Counter(
        _normalize_demographics_nation(person.nation) for person in bundle.people
    )

    assert set(type_counts) == {"户籍", "流动", "留守", "境外"}
    assert all(type_counts[name] > 0 for name in ("留守", "境外"))
    assert all(education_counts[name] > 0 for name in DEMOGRAPHICS_EDUCATION_ORDER[:-1])
    assert all(nation_counts[name] > 0 for name in DEMOGRAPHICS_NATION_ORDER)
    assert sum(type_counts.values()) == len(bundle.people)
    assert sum(education_counts.values()) == len(bundle.people)
    assert sum(nation_counts.values()) == len(bundle.people)


def test_demo_recent_migration_records_drive_monthly_totals_and_hotspots() -> None:
    bundle = build_demo_seed_bundle()
    houses = {house.id for house in bundle.houses}
    recent_months = {month for month, _inbound, _outbound in RECENT_MIGRATION_MONTHS}

    recent_starts = []
    recent_ends = []
    for history in bundle.housing_histories:
        start_raw, end_raw = (part.strip() for part in history.period.split("~", maxsplit=1))
        if start_raw[:7] in recent_months:
            recent_starts.append(history)
        if end_raw[:7] in recent_months:
            recent_ends.append(history)

    assert len(recent_starts) == sum(inbound for _month, inbound, _outbound in RECENT_MIGRATION_MONTHS)
    assert len(recent_ends) == sum(outbound for _month, _inbound, outbound in RECENT_MIGRATION_MONTHS)
    assert {history.period[:7] for history in recent_starts} == recent_months
    assert {history.period.split("~", maxsplit=1)[1].strip()[:7] for history in recent_ends} == recent_months
    assert all(history.houseId in houses for history in [*recent_starts, *recent_ends])
    assert all(
        date.fromisoformat(history.period.split("~", maxsplit=1)[0].strip())
        <= MIGRATION_REFERENCE_DATE
        for history in recent_starts
    )
    assert all(
        date.fromisoformat(history.period.split("~", maxsplit=1)[1].strip())
        <= MIGRATION_REFERENCE_DATE
        for history in recent_ends
    )


def test_demo_priority_labels_are_derived_and_other_is_last() -> None:
    bundle = build_demo_seed_bundle()
    houses_by_id = {house.id: house for house in bundle.houses}
    now = datetime(2026, 7, 23)

    counts = {
        name: _risk_tag_delta(bundle.people, houses_by_id, list(terms), now)[0]
        for name, _level, terms in RISK_TAGS
    }

    assert list(counts)[-1] == "其他重点标签"
    assert all(count > 0 for count in counts.values())


def test_demo_house_member_counts_match_bound_people() -> None:
    bundle = build_demo_seed_bundle()
    bound_people = Counter(person.houseId for person in bundle.people if person.houseId)

    assert all(
        house.memberCount == bound_people[house.id]
        for house in bundle.houses
    )
