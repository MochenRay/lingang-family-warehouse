from collections import Counter
from datetime import date, datetime, timedelta

from app.api.stats import (
    DEMOGRAPHICS_EDUCATION_ORDER,
    DEMOGRAPHICS_NATION_ORDER,
    RISK_TAGS,
    _normalize_demographics_education,
    _normalize_demographics_nation,
    _risk_tag_delta,
    _is_housing_warning,
)
from app.demo_data.background_generator import (
    MIGRATION_REFERENCE_DATE,
    RECENT_MIGRATION_MONTHS,
)
from seed import build_demo_seed_bundle
from app.demo_data.regions import REGION_GRID_BY_ID


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
    assert len(bundle.people) == 1917


def test_demo_conflict_kpi_stays_at_the_canonical_total() -> None:
    bundle = build_demo_seed_bundle()

    assert len(bundle.conflicts) == 16
    assert sum(conflict.status == "已化解" for conflict in bundle.conflicts) == 3


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


def test_demo_housing_regions_keep_total_and_have_independent_warning_counts() -> None:
    bundle = build_demo_seed_bundle()
    expected = {
        "蓬莱区": 188,
        "芝罘区": 76,
        "福山区": 52,
        "牟平区": 61,
        "莱山区": 45,
        "龙口市": 74,
        "莱阳市": 55,
        "莱州市": 66,
        "招远市": 49,
        "栖霞市": 57,
        "海阳市": 65,
    }
    house_counts = Counter(REGION_GRID_BY_ID[house.gridId].district for house in bundle.houses)
    rental_counts = Counter()
    warning_counts = Counter()
    for house in bundle.houses:
        district = REGION_GRID_BY_ID[house.gridId].district
        rental_counts[district] += house.type == "出租"
        warning_counts[district] += _is_housing_warning(house)

    assert dict(house_counts) == expected
    assert sum(house_counts.values()) == 788
    assert sum(rental_counts[name] != warning_counts[name] for name in expected) >= 5


def test_demo_current_residents_have_current_history_and_first_page_has_depth() -> None:
    bundle = build_demo_seed_bundle()
    current_names_by_house: dict[str, set[str]] = {}
    current_pairs: list[tuple[str, str]] = []
    for history in bundle.housing_histories:
        if history.period.split("~", maxsplit=1)[-1].strip() == "至今":
            current_names_by_house.setdefault(history.houseId, set()).add(history.personName)
            current_pairs.append((history.houseId, history.personName))

    assert len(current_pairs) == len(set(current_pairs))

    assert all(
        person.name in current_names_by_house.get(person.houseId or "", set())
        for person in bundle.people
        if person.houseId
    )
    history_house_ids = {history.houseId for history in bundle.housing_histories}
    empty_houses = [house for house in bundle.houses if house.type == "空置"]
    assert any(house.id in history_house_ids for house in empty_houses)
    assert any(house.id not in history_house_ids for house in empty_houses)

    visits_by_person = Counter(
        visit.targetId for visit in bundle.visits if visit.targetType == "person"
    )
    people_by_house = Counter(
        person.houseId for person in bundle.people if person.houseId
    )
    first_page = sorted(
        bundle.people,
        key=lambda person: (person.updatedAt, person.id),
        reverse=True,
    )[:20]
    for person in first_page:
        minimum = 3 if person.risk == "High" else 2 if person.risk == "Medium" else 1
        assert visits_by_person[person.id] >= minimum
        assert people_by_house[person.houseId] > 1 or bool(person.familyRelations)


def test_demo_task_freshness_tracks_an_injected_future_reference_date() -> None:
    baseline_bundle = build_demo_seed_bundle(
        freshness_reference_date=date(2026, 7, 30),
    )
    reference_date = date(2035, 1, 17)
    bundle = build_demo_seed_bundle(freshness_reference_date=reference_date)
    fresh_date = (reference_date - timedelta(days=1)).isoformat()
    overdue_date = (reference_date - timedelta(days=20)).isoformat()

    fresh_visits = [
        visit
        for visit in bundle.visits
        if visit.id.startswith("v_task_fresh_")
    ]
    baseline_fresh_visit_ids = {
        visit.id
        for visit in baseline_bundle.visits
        if visit.id.startswith("v_task_fresh_")
    }
    assert len(fresh_visits) == 49
    assert {visit.id for visit in fresh_visits} == baseline_fresh_visit_ids
    assert {visit.date for visit in fresh_visits} == {fresh_date}

    medium_grid_ids = {"g_zf_1", "g_fs_1", "g_mp_1"}
    preserved_people = []
    for grid_id in sorted(medium_grid_ids):
        eligible = sorted(
            (
                person
                for person in bundle.people
                if person.gridId == grid_id
                if person.risk == "High" or bool(person.careLabels)
            ),
            key=lambda person: person.id,
        )
        preserved = eligible[0]
        preserved_people.append(preserved)
        assert preserved.updatedAt == overdue_date

        related_target_ids = {preserved.id, preserved.houseId}
        related_visits = [
            visit for visit in bundle.visits
            if visit.targetId in related_target_ids
        ]
        assert related_visits
        assert {visit.date for visit in related_visits} == {overdue_date}

    assert len(preserved_people) == 3
    assert bundle.counts() == baseline_bundle.counts()
    assert [(conflict.id, conflict.status) for conflict in bundle.conflicts] == [
        (conflict.id, conflict.status) for conflict in baseline_bundle.conflicts
    ]
    assert [(person.id, person.risk) for person in bundle.people] == [
        (person.id, person.risk) for person in baseline_bundle.people
    ]

    visits_by_person = Counter(
        visit.targetId for visit in bundle.visits if visit.targetType == "person"
    )
    people_by_house = Counter(person.houseId for person in bundle.people if person.houseId)
    first_page = sorted(
        bundle.people,
        key=lambda person: (person.updatedAt, person.id),
        reverse=True,
    )[:20]
    for person in first_page:
        minimum = 3 if person.risk == "High" else 2 if person.risk == "Medium" else 1
        assert visits_by_person[person.id] >= minimum
        assert people_by_house[person.houseId] > 1 or bool(person.familyRelations)
