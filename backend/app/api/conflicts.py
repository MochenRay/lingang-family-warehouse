from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, SQLModel, select

from app.database import get_session
from app.models.conflict import ConflictRecord
from app.models.house import House
from app.models.person import Person
from app.models.visit import VisitRecord
from app.schemas.conflict import (
    ConflictContextRead,
    ConflictCreate,
    ConflictFollowUpRead,
    ConflictRecordRead,
    ConflictUpdate,
)
from app.schemas.house import HouseRead
from app.schemas.person import PersonRead
from app.schemas.visit import VisitRecordRead

router = APIRouter(prefix="/conflicts", tags=["conflicts"])


class ConflictsListResponse(SQLModel):
    items: list[ConflictRecordRead]
    total: int


def _parse_datetime(value: str | None) -> datetime | None:
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


def _extract_related_person_ids(conflict: ConflictRecord) -> list[str]:
    return [
        party["id"]
        for party in conflict.involvedParties
        if party.get("type") == "resident" and party.get("id")
    ]


def _filter_conflicts(
    conflicts: list[ConflictRecord],
    keyword_source: str | None,
    status: str | None,
    conflict_type: str | None,
    grid_id: str | None,
    person_id: str | None,
    house_id: str | None,
    session: Session,
) -> list[ConflictRecord]:
    if keyword_source:
        keyword = keyword_source.strip().lower()
        conflicts = [
            conflict
            for conflict in conflicts
            if keyword in conflict.title.lower()
            or keyword in conflict.description.lower()
            or keyword in conflict.location.lower()
            or any(keyword in party["name"].lower() for party in conflict.involvedParties)
        ]

    if status:
        conflicts = [conflict for conflict in conflicts if conflict.status == status]
    if conflict_type:
        conflicts = [conflict for conflict in conflicts if conflict.type == conflict_type]
    if grid_id:
        conflicts = [conflict for conflict in conflicts if conflict.gridId == grid_id]
    if person_id:
        conflicts = [
            conflict
            for conflict in conflicts
            if any(
                party.get("type") == "resident" and party.get("id") == person_id
                for party in conflict.involvedParties
            )
        ]
    if house_id:
        house = session.get(House, house_id)
        if house is None:
            return []

        resident_ids = {
            person.id for person in session.exec(select(Person).where(Person.houseId == house_id))
        }
        house_address = house.address.lower()
        conflicts = [
            conflict
            for conflict in conflicts
            if any(
                party.get("type") == "resident" and party.get("id") in resident_ids
                for party in conflict.involvedParties
            )
            or house_address in conflict.location.lower()
            or conflict.location.lower() in house_address
        ]

    conflicts.sort(
        key=lambda conflict: (_parse_datetime(conflict.updatedAt) or datetime.min, conflict.id),
        reverse=True,
    )
    return conflicts


def _resolve_related_house(
    session: Session,
    conflict: ConflictRecord,
    related_people: list[Person],
) -> House | None:
    resident_house_ids = {person.houseId for person in related_people if person.houseId}
    if len(resident_house_ids) == 1:
        related_house_id = next(iter(resident_house_ids))
        if related_house_id:
            related_house = session.get(House, related_house_id)
            if related_house is not None:
                return related_house

    location = conflict.location.lower()
    houses = list(session.exec(select(House)))
    for house in houses:
        house_address = house.address.lower()
        if house_address in location or location in house_address:
            return house

    return None


def _build_follow_up_status(conflict: ConflictRecord, recent_visits: list[VisitRecord]) -> ConflictFollowUpRead:
    if conflict.status == "已化解":
        return ConflictFollowUpRead(
            code="resolved",
            label="已化解，转入观察",
            detail="当前案件已完成处置，建议保留一次回访观察，确认是否再次反复。",
        )

    last_touch = _parse_datetime(conflict.updatedAt)
    if recent_visits:
        visit_time = max((_parse_datetime(visit.date) for visit in recent_visits), default=None)
        if visit_time and (last_touch is None or visit_time > last_touch):
            last_touch = visit_time

    if last_touch is None:
        return ConflictFollowUpRead(
            code="needs-followup",
            label="缺少最新跟进",
            detail="当前案件缺少可确认的最新跟进记录，建议尽快补一次入户或电话回访。",
        )

    days_since_touch = max((datetime.now() - last_touch).days, 0)
    if days_since_touch >= 7:
        return ConflictFollowUpRead(
            code="overdue",
            label="回访已超期",
            detail=f"距离最近一次更新已超过 {days_since_touch} 天，建议优先安排本周跟进。",
        )
    if days_since_touch >= 3:
        return ConflictFollowUpRead(
            code="watch",
            label="建议继续跟进",
            detail=f"距离最近一次更新已 {days_since_touch} 天，适合补一轮确认和结果回填。",
        )
    return ConflictFollowUpRead(
        code="active",
        label="近期已跟进",
        detail="案件在最近几天内有更新，可继续围绕处置结果和回访安排推进。",
    )


def _build_suggested_actions(
    conflict: ConflictRecord,
    related_people: list[Person],
    related_house: House | None,
    recent_visits: list[VisitRecord],
) -> list[str]:
    actions: list[str] = []

    if conflict.type == "物业纠纷":
        actions.append("结合物业反馈和现场情况，确认是否涉及群租、消防隐患或公共秩序问题。")
    elif conflict.type == "家庭纠纷":
        actions.append("优先梳理家庭成员诉求和赡养/照护分工，形成一轮书面调解纪要。")
    elif conflict.type == "邻里纠纷":
        actions.append("明确争议发生时段、频次和影响范围，避免双方口径长期停留在感受层。")
    else:
        actions.append("先补一轮事实核验，再决定是转调解、转条线还是继续社区跟进。")

    if not recent_visits:
        actions.append("补一次带结果回填的走访，确保当事人、房屋和网格信息能互相印证。")

    high_risk_people = [person.name for person in related_people if person.risk == "High"]
    if high_risk_people:
        actions.append(f"相关当事人中含高风险对象（{', '.join(high_risk_people[:2])}），建议同步做重点对象复核。")

    if related_house and related_house.type == "出租":
        actions.append("该案件关联出租房，建议同步核查同住关系、租住人数和居住合规情况。")

    if conflict.status != "已化解":
        actions.append("当前仍处调解中，建议补齐下一步责任人、时间点和回访口径。")

    return actions[:4]


def _build_conflict_context(conflict: ConflictRecord, session: Session) -> ConflictContextRead:
    related_person_ids = _extract_related_person_ids(conflict)
    related_people = [
        person
        for person_id in related_person_ids
        if (person := session.get(Person, person_id)) is not None
    ]
    related_people.sort(key=lambda person: (person.risk, person.updatedAt, person.id), reverse=True)

    related_house = _resolve_related_house(session, conflict, related_people)

    recent_visits = list(session.exec(select(VisitRecord)))
    visit_targets = {person.id for person in related_people}
    if related_house is not None:
        visit_targets.add(related_house.id)

    recent_visits = [
        visit
        for visit in recent_visits
        if visit.targetId in visit_targets
        and (
            visit.targetType == "person"
            or (related_house is not None and visit.targetType == "house" and visit.targetId == related_house.id)
        )
    ]
    recent_visits.sort(key=lambda visit: (_parse_datetime(visit.date) or datetime.min, visit.id), reverse=True)
    recent_visits = recent_visits[:5]

    return ConflictContextRead(
        relatedPeople=[PersonRead.model_validate(person) for person in related_people],
        relatedHouse=HouseRead.model_validate(related_house) if related_house is not None else None,
        recentVisits=[VisitRecordRead.model_validate(visit) for visit in recent_visits],
        followUpStatus=_build_follow_up_status(conflict, recent_visits),
        suggestedActions=_build_suggested_actions(conflict, related_people, related_house, recent_visits),
    )


@router.get("", response_model=ConflictsListResponse)
def list_conflicts(
    session: Session = Depends(get_session),
    q: str | None = Query(default=None),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    conflict_type: str | None = Query(default=None, alias="type"),
    grid_id: str | None = Query(default=None, alias="gridId"),
    person_id: str | None = Query(default=None, alias="personId"),
    house_id: str | None = Query(default=None, alias="houseId"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> ConflictsListResponse:
    conflicts = list(session.exec(select(ConflictRecord)))
    conflicts = _filter_conflicts(
        conflicts=conflicts,
        keyword_source=q or search,
        status=status,
        conflict_type=conflict_type,
        grid_id=grid_id,
        person_id=person_id,
        house_id=house_id,
        session=session,
    )

    total = len(conflicts)
    items = [ConflictRecordRead.model_validate(conflict) for conflict in conflicts[offset : offset + limit]]
    return ConflictsListResponse(items=items, total=total)


@router.get("/{conflict_id}", response_model=ConflictRecordRead)
def get_conflict(conflict_id: str, session: Session = Depends(get_session)) -> ConflictRecordRead:
    conflict = session.get(ConflictRecord, conflict_id)
    if conflict is None:
        raise HTTPException(status_code=404, detail=f"Conflict '{conflict_id}' not found")
    return ConflictRecordRead.model_validate(conflict)


@router.get("/{conflict_id}/context", response_model=ConflictContextRead)
def get_conflict_context(conflict_id: str, session: Session = Depends(get_session)) -> ConflictContextRead:
    conflict = session.get(ConflictRecord, conflict_id)
    if conflict is None:
        raise HTTPException(status_code=404, detail=f"Conflict '{conflict_id}' not found")
    return _build_conflict_context(conflict, session)


@router.post("", response_model=ConflictRecordRead, status_code=201)
def create_conflict(payload: ConflictCreate, session: Session = Depends(get_session)) -> ConflictRecordRead:
    conflict = ConflictRecord(
        id=f"conflict_{uuid4().hex[:12]}",
        **payload.model_dump(),
    )
    session.add(conflict)
    session.commit()
    session.refresh(conflict)
    return ConflictRecordRead.model_validate(conflict)


@router.patch("/{conflict_id}", response_model=ConflictRecordRead)
def update_conflict(
    conflict_id: str,
    payload: ConflictUpdate,
    session: Session = Depends(get_session),
) -> ConflictRecordRead:
    conflict = session.get(ConflictRecord, conflict_id)
    if conflict is None:
        raise HTTPException(status_code=404, detail=f"Conflict '{conflict_id}' not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(conflict, field, value)

    session.add(conflict)
    session.commit()
    session.refresh(conflict)
    return ConflictRecordRead.model_validate(conflict)
