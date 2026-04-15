from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, select

from app.database import get_session
from app.models.visit import VisitRecord
from app.schemas.visit import VisitRecordRead

router = APIRouter(prefix="/visits", tags=["visits"])


class VisitsListResponse(SQLModel):
    items: list[VisitRecordRead]
    total: int


class VisitCreate(SQLModel):
    targetId: str
    targetType: str
    gridId: str
    visitorName: str
    date: str
    content: str
    images: list[str] = Field(default_factory=list)
    tags: list[str] | None = None


@router.get("", response_model=VisitsListResponse)
def list_visits(
    session: Session = Depends(get_session),
    grid_id: str | None = Query(default=None, alias="gridId"),
    target_id: str | None = Query(default=None, alias="targetId"),
    target_type: str | None = Query(default=None, alias="targetType"),
    visitor_name: str | None = Query(default=None, alias="visitorName"),
    tag: str | None = Query(default=None),
    order: str = Query(default="desc"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> VisitsListResponse:
    visits = list(session.exec(select(VisitRecord)))

    if grid_id:
        visits = [visit for visit in visits if visit.gridId == grid_id]
    if target_id:
        visits = [visit for visit in visits if visit.targetId == target_id]
    if target_type:
        visits = [visit for visit in visits if visit.targetType == target_type]
    if visitor_name:
        keyword = visitor_name.strip().lower()
        visits = [visit for visit in visits if keyword in visit.visitorName.lower()]
    if tag:
        visits = [visit for visit in visits if tag in (visit.tags or [])]

    reverse = order != "asc"
    visits.sort(key=lambda visit: (visit.date, visit.id), reverse=reverse)
    total = len(visits)
    items = [VisitRecordRead.model_validate(visit) for visit in visits[offset : offset + limit]]
    return VisitsListResponse(items=items, total=total)


@router.get("/{visit_id}", response_model=VisitRecordRead)
def get_visit(visit_id: str, session: Session = Depends(get_session)) -> VisitRecordRead:
    visit = session.get(VisitRecord, visit_id)
    if visit is None:
        raise HTTPException(status_code=404, detail=f"Visit '{visit_id}' not found")
    return VisitRecordRead.model_validate(visit)


@router.post("", response_model=VisitRecordRead, status_code=201)
def create_visit(payload: VisitCreate, session: Session = Depends(get_session)) -> VisitRecordRead:
    visit = VisitRecord(
        id=f"visit_{uuid4().hex[:12]}",
        **payload.model_dump(),
    )
    session.add(visit)
    session.commit()
    session.refresh(visit)
    return VisitRecordRead.model_validate(visit)


@router.patch("/{visit_id}", response_model=VisitRecordRead)
def update_visit(
    visit_id: str,
    payload: dict[str, Any] = Body(...),
    session: Session = Depends(get_session),
) -> VisitRecordRead:
    visit = session.get(VisitRecord, visit_id)
    if visit is None:
        raise HTTPException(status_code=404, detail=f"Visit '{visit_id}' not found")

    allowed_fields = set(VisitRecord.model_fields.keys()) - {"id"}
    unknown_fields = sorted(set(payload.keys()) - allowed_fields)
    if unknown_fields:
        raise HTTPException(status_code=400, detail=f"Unsupported fields: {', '.join(unknown_fields)}")

    for field, value in payload.items():
        setattr(visit, field, value)

    session.add(visit)
    session.commit()
    session.refresh(visit)
    return VisitRecordRead.model_validate(visit)
