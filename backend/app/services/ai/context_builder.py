from __future__ import annotations

from collections import Counter
from datetime import datetime

from sqlmodel import Session, select

from app.models.conflict import ConflictRecord
from app.models.grid import Grid
from app.models.house import House, HousingHistory
from app.models.person import Person
from app.models.visit import VisitRecord

MAX_AI_CONTEXT_LABELS = 8
MAX_AI_CONTEXT_VISITS = 2
SAFE_AI_SIGNAL_RULES: tuple[tuple[str, str], ...] = (
    ("长期未走访", "长期未走访"),
    ("重点关注", "重点关注"),
    ("独居", "独居老人"),
    ("高龄", "高龄老人"),
    ("失独", "失独家庭"),
    ("高血压", "高血压"),
    ("糖尿病", "糖尿病"),
    ("慢性病", "慢性病"),
    ("孕", "孕产妇"),
    ("残疾", "残疾"),
    ("低保", "低保家庭"),
    ("困难", "困难群体"),
    ("服药", "用药回访"),
    ("用药", "用药回访"),
    ("安全", "安全检查"),
    ("救助", "救助需求"),
    ("隐患", "隐患核验"),
    ("回访", "回访"),
    ("日常走访", "日常走访"),
)
SAFE_AI_GENDERS = {"男": "男", "女": "女", "其他": "other", "未知": "unknown"}
SAFE_AI_PERSON_TYPES = {"户籍": "户籍", "流动": "流动", "留守": "留守", "境外": "境外"}
SAFE_AI_RISK_LEVELS = {
    "High": "High",
    "Medium": "Medium",
    "Low": "Low",
    "高": "High",
    "中": "Medium",
    "低": "Low",
}


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


def _project_safe_signals(values: list[str] | None) -> list[str]:
    """Map editable labels to a fixed taxonomy; never forward raw label text."""
    signals: list[str] = []
    for value in values or []:
        for keyword, canonical_signal in SAFE_AI_SIGNAL_RULES:
            if keyword in value and canonical_signal not in signals:
                signals.append(canonical_signal)
            if len(signals) >= MAX_AI_CONTEXT_LABELS:
                return signals
    return signals


def _project_safe_enum(value: str | None, allowed: dict[str, str]) -> str:
    return allowed.get((value or "").strip(), "unknown")


def _project_safe_age(value: int) -> int | None:
    return value if 0 <= value <= 120 else None


def build_safe_person_ai_context(session: Session, person_id: str) -> dict[str, object] | None:
    """Return the minimum person context allowed to cross the LLM boundary."""
    person = session.get(Person, person_id)
    if person is None:
        return None

    visits = list(
        session.exec(
            select(VisitRecord).where(
                (VisitRecord.targetType == "person") & (VisitRecord.targetId == person.id)
            )
        ).all()
    )
    signals = _project_safe_signals([*(person.tags or []), *((person.careLabels or []) or [])])
    recent_visits = _latest_by_date(visits, limit=MAX_AI_CONTEXT_VISITS)

    return {
        "age": _project_safe_age(person.age),
        "gender": _project_safe_enum(person.gender, SAFE_AI_GENDERS),
        "person_type": _project_safe_enum(person.type, SAFE_AI_PERSON_TYPES),
        "risk_level": _project_safe_enum(person.risk, SAFE_AI_RISK_LEVELS),
        "signals": signals,
        "recent_visits": [
            {
                "date": parsed.date().isoformat() if (parsed := _parse_date(visit.date)) else None,
                "signals": _project_safe_signals(visit.tags),
            }
            for visit in recent_visits
        ],
    }


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
