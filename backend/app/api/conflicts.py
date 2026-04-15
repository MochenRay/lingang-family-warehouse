from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, select

from app.database import get_session
from app.models.conflict import ConflictRecord
from app.schemas.conflict import ConflictRecordRead

router = APIRouter(prefix="/conflicts", tags=["conflicts"])


class ConflictsListResponse(SQLModel):
    items: list[ConflictRecordRead]
    total: int


class ConflictCreate(SQLModel):
    source: str = "上级下派"
    title: str
    type: str
    description: str
    involvedParties: list[dict[str, Any]] = Field(default_factory=list)
    status: str = "调解中"
    gridId: str
    location: str = "待核实"
    timeline: list[dict[str, Any]] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    createdAt: str
    updatedAt: str


@router.get("", response_model=ConflictsListResponse)
def list_conflicts(
    session: Session = Depends(get_session),
    q: str | None = Query(default=None),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    conflict_type: str | None = Query(default=None, alias="type"),
    grid_id: str | None = Query(default=None, alias="gridId"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> ConflictsListResponse:
    conflicts = list(session.exec(select(ConflictRecord)))

    keyword_source = q or search
    if keyword_source:
        keyword = keyword_source.strip().lower()
        conflicts = [
            conflict
            for conflict in conflicts
            if keyword in conflict.title.lower()
            or keyword in conflict.description.lower()
            or any(keyword in party["name"].lower() for party in conflict.involvedParties)
        ]
    if status:
        conflicts = [conflict for conflict in conflicts if conflict.status == status]
    if conflict_type:
        conflicts = [conflict for conflict in conflicts if conflict.type == conflict_type]
    if grid_id:
        conflicts = [conflict for conflict in conflicts if conflict.gridId == grid_id]

    conflicts.sort(key=lambda conflict: (conflict.updatedAt, conflict.createdAt, conflict.id), reverse=True)
    total = len(conflicts)
    items = [ConflictRecordRead.model_validate(conflict) for conflict in conflicts[offset : offset + limit]]
    return ConflictsListResponse(items=items, total=total)


@router.get("/{conflict_id}", response_model=ConflictRecordRead)
def get_conflict(conflict_id: str, session: Session = Depends(get_session)) -> ConflictRecordRead:
    conflict = session.get(ConflictRecord, conflict_id)
    if conflict is None:
        raise HTTPException(status_code=404, detail=f"Conflict '{conflict_id}' not found")
    return ConflictRecordRead.model_validate(conflict)


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
    payload: dict[str, Any] = Body(...),
    session: Session = Depends(get_session),
) -> ConflictRecordRead:
    conflict = session.get(ConflictRecord, conflict_id)
    if conflict is None:
        raise HTTPException(status_code=404, detail=f"Conflict '{conflict_id}' not found")

    allowed_fields = set(ConflictRecord.model_fields.keys()) - {"id"}
    unknown_fields = sorted(set(payload.keys()) - allowed_fields)
    if unknown_fields:
        raise HTTPException(status_code=400, detail=f"Unsupported fields: {', '.join(unknown_fields)}")

    for field, value in payload.items():
        setattr(conflict, field, value)

    session.add(conflict)
    session.commit()
    session.refresh(conflict)
    return ConflictRecordRead.model_validate(conflict)
