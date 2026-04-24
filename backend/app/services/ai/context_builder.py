from __future__ import annotations

from collections import Counter
from datetime import datetime

from sqlmodel import Session, select

from app.models.conflict import ConflictRecord
from app.models.grid import Grid
from app.models.house import House, HousingHistory
from app.models.person import Person
from app.models.visit import VisitRecord


def _parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    for pattern in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%Y-%m"):
        try:
            return datetime.strptime(value, pattern)
        except ValueError:
            continue
    return None


def _latest_by_date(items: list[VisitRecord], limit: int = 3) -> list[VisitRecord]:
    return sorted(items, key=lambda item: (_parse_date(item.date) or datetime.min, item.id), reverse=True)[:limit]


def _select_default_person(session: Session) -> Person | None:
    people = list(session.exec(select(Person)).all())
    if not people:
        return None
    return sorted(people, key=lambda item: (item.risk != "High", item.updatedAt, item.id))[0]


def _select_default_grid(session: Session) -> Grid | None:
    grids = list(session.exec(select(Grid)).all())
    return sorted(grids, key=lambda item: item.id)[0] if grids else None


def build_person_context(session: Session, person_id: str | None = None) -> dict[str, object]:
    person = session.get(Person, person_id) if person_id else _select_default_person(session)
    if person is None:
        return {"status": "missing", "context_type": "person", "context_id": person_id}

    house = session.get(House, person.houseId) if person.houseId else None
    grid = session.get(Grid, person.gridId)
    visits = list(
        session.exec(
            select(VisitRecord).where(
                (VisitRecord.targetType == "person") & (VisitRecord.targetId == person.id)
            )
        ).all()
    )
    if house:
        visits.extend(
            list(
                session.exec(
                    select(VisitRecord).where(
                        (VisitRecord.targetType == "house") & (VisitRecord.targetId == house.id)
                    )
                ).all()
            )
        )
    latest_visits = _latest_by_date(visits)

    histories = (
        list(session.exec(select(HousingHistory).where(HousingHistory.houseId == house.id)).all())
        if house
        else []
    )

    labels = list(dict.fromkeys([*(person.tags or []), *((person.careLabels or []) or [])]))
    missing_fields = [
        label
        for label, ok in (
            ("联系电话", bool(person.phone)),
            ("身份证号", bool(person.idCard)),
            ("居住地址", bool(person.address)),
            ("房屋绑定", bool(person.houseId)),
            ("健康记录", bool(person.healthRecord)),
            ("走访记录", bool(latest_visits)),
        )
        if not ok
    ]

    return {
        "status": "ready",
        "context_type": "person",
        "context_id": person.id,
        "person": {
            "id": person.id,
            "name": person.name,
            "age": person.age,
            "gender": person.gender,
            "type": person.type,
            "risk": person.risk,
            "tags": person.tags or [],
            "care_labels": person.careLabels or [],
            "phone_present": bool(person.phone),
            "biography": person.biography,
            "important_events": person.importantEvents,
        },
        "grid": {
            "id": grid.id,
            "name": grid.name,
            "managerName": grid.managerName,
        }
        if grid
        else None,
        "house": {
            "id": house.id,
            "address": house.address,
            "type": house.type,
            "memberCount": house.memberCount,
            "tags": house.tags or [],
            "occupancyStatus": house.occupancyStatus,
            "residenceType": house.residenceType,
        }
        if house
        else None,
        "latest_visits": [
            {
                "id": visit.id,
                "date": visit.date,
                "visitorName": visit.visitorName,
                "content": visit.content,
                "tags": visit.tags or [],
            }
            for visit in latest_visits
        ],
        "housing_history_count": len(histories),
        "signals": labels,
        "missing_fields": missing_fields,
    }


def build_grid_context(session: Session, grid_id: str | None = None) -> dict[str, object]:
    grid = session.get(Grid, grid_id) if grid_id else _select_default_grid(session)
    if grid is None:
        return {"status": "missing", "context_type": "grid", "context_id": grid_id}

    people = list(session.exec(select(Person).where(Person.gridId == grid.id)).all())
    houses = list(session.exec(select(House).where(House.gridId == grid.id)).all())
    visits = list(session.exec(select(VisitRecord).where(VisitRecord.gridId == grid.id)).all())
    conflicts = list(session.exec(select(ConflictRecord).where(ConflictRecord.gridId == grid.id)).all())

    risk_counter = Counter(person.risk for person in people)
    tag_counter: Counter[str] = Counter()
    for person in people:
        tag_counter.update(person.tags or [])
        tag_counter.update(person.careLabels or [])

    active_conflicts = [item for item in conflicts if item.status != "已化解"]
    active_conflicts.sort(key=lambda item: (_parse_date(item.updatedAt) or datetime.min, item.id), reverse=True)

    return {
        "status": "ready",
        "context_type": "grid",
        "context_id": grid.id,
        "grid": {
            "id": grid.id,
            "name": grid.name,
            "managerName": grid.managerName,
        },
        "counts": {
            "people": len(people),
            "houses": len(houses),
            "visits": len(visits),
            "conflicts": len(conflicts),
            "active_conflicts": len(active_conflicts),
        },
        "risk_counts": {
            "High": risk_counter.get("High", 0),
            "Medium": risk_counter.get("Medium", 0),
            "Low": risk_counter.get("Low", 0),
        },
        "top_signals": [{"name": name, "count": count} for name, count in tag_counter.most_common(6)],
        "active_conflicts": [
            {
                "id": conflict.id,
                "title": conflict.title,
                "type": conflict.type,
                "status": conflict.status,
                "location": conflict.location,
                "updatedAt": conflict.updatedAt,
            }
            for conflict in active_conflicts[:5]
        ],
    }


def build_policy_context(query: str) -> dict[str, object]:
    return {
        "status": "ready",
        "context_type": "policy",
        "query": query,
        "notes": [
            "当前政策上下文仍为演示口径。",
            "回答不得捏造未经核验的地方政策细则。",
        ],
    }
