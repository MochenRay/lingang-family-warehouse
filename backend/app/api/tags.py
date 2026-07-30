from datetime import datetime
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.person import Person
from app.models.tag import PersonTagAssignment, TagDefinition
from app.schemas.tag import (
    PersonTagAssignmentRead,
    TagCreate,
    TagDefinitionRead,
    TagListRead,
    TagSnapshotRead,
)
from app.services.tags import build_tag_snapshot, ensure_system_tags, normalize_tag_name

router = APIRouter(prefix="/tags", tags=["tags"])
SHANGHAI = ZoneInfo("Asia/Shanghai")


def _now_string() -> str:
    return datetime.now(SHANGHAI).isoformat(timespec="seconds")


@router.get("", response_model=TagListRead)
def list_tags(session: Session = Depends(get_session)) -> TagListRead:
    snapshot = build_tag_snapshot(session)
    return TagListRead(items=snapshot.tags, total=len(snapshot.tags))


@router.get("/snapshot", response_model=TagSnapshotRead)
def read_tag_snapshot(session: Session = Depends(get_session)) -> TagSnapshotRead:
    return build_tag_snapshot(session)


@router.post("", response_model=TagDefinitionRead, status_code=status.HTTP_201_CREATED)
def create_tag(
    payload: TagCreate,
    operator: str = Header(default="标签管理员", alias="X-Operator-Name"),
    session: Session = Depends(get_session),
) -> TagDefinitionRead:
    ensure_system_tags(session)
    normalized_name = normalize_tag_name(payload.name)
    duplicate = session.exec(
        select(TagDefinition).where(TagDefinition.normalizedName == normalized_name)
    ).first()
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="Tag name already exists")

    now = _now_string()
    tag = TagDefinition(
        id=f"tag_{uuid4().hex[:12]}",
        name=payload.name,
        normalizedName=normalized_name,
        type=payload.type,
        description=payload.description,
        category=payload.category,
        riskLevel=payload.riskLevel,
        status="enabled",
        conditions=[condition.model_dump() for condition in payload.conditions],
        isSystem=False,
        createdBy=operator.strip() or "标签管理员",
        createdAt=now,
        updatedAt=now,
    )
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return TagDefinitionRead(**tag.model_dump(), coverageCount=0)


@router.put("/{tag_id}/assignments/{person_id}", response_model=PersonTagAssignmentRead)
def assign_ordinary_tag(
    tag_id: str,
    person_id: str,
    operator: str = Header(default="标签管理员", alias="X-Operator-Name"),
    session: Session = Depends(get_session),
) -> PersonTagAssignmentRead:
    tag = session.get(TagDefinition, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag.type != "ordinary":
        raise HTTPException(status_code=422, detail="Smart tags cannot be assigned manually")
    if session.get(Person, person_id) is None:
        raise HTTPException(status_code=404, detail="Person not found")

    existing = session.get(PersonTagAssignment, (tag_id, person_id))
    if existing is not None:
        return PersonTagAssignmentRead.model_validate(existing)
    assignment = PersonTagAssignment(
        tagId=tag_id,
        personId=person_id,
        createdBy=operator.strip() or "标签管理员",
        createdAt=_now_string(),
    )
    session.add(assignment)
    session.commit()
    session.refresh(assignment)
    return PersonTagAssignmentRead.model_validate(assignment)


@router.delete("/{tag_id}/assignments/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_ordinary_tag(
    tag_id: str,
    person_id: str,
    session: Session = Depends(get_session),
) -> Response:
    tag = session.get(TagDefinition, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag.type != "ordinary":
        raise HTTPException(status_code=422, detail="Smart tags cannot be assigned manually")
    assignment = session.get(PersonTagAssignment, (tag_id, person_id))
    if assignment is not None:
        session.delete(assignment)
        session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
