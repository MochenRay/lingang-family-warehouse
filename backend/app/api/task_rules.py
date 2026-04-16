from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session

from app.database import get_session
from app.models.task_rule import TaskRule
from app.schemas.task_rule import (
    TaskProjectionRead,
    TaskRuleCreate,
    TaskRuleListRead,
    TaskRuleRead,
    TaskRuleUpdate,
)
from app.services.task_rules import list_task_rules_with_coverage, build_task_projection

router = APIRouter(prefix="/task-rules", tags=["task-rules"])


def _now_string() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


@router.get("", response_model=TaskRuleListRead)
def read_task_rules(
    gridId: str | None = Query(default=None),
    session: Session = Depends(get_session),
) -> TaskRuleListRead:
    items = list_task_rules_with_coverage(session, grid_id=gridId)
    return TaskRuleListRead(items=items, total=len(items))


@router.get("/projection", response_model=TaskProjectionRead)
def read_task_projection(
    gridId: str | None = Query(default=None),
    session: Session = Depends(get_session),
) -> TaskProjectionRead:
    return build_task_projection(session, grid_id=gridId)


@router.post("", response_model=TaskRuleRead, status_code=status.HTTP_201_CREATED)
def create_task_rule(
    payload: TaskRuleCreate,
    session: Session = Depends(get_session),
) -> TaskRuleRead:
    identifier = payload.id or f"rule_{uuid4().hex[:8]}"
    if session.get(TaskRule, identifier) is not None:
        raise HTTPException(status_code=409, detail=f"Task rule '{identifier}' already exists")

    now = _now_string()
    record = TaskRule(
        id=identifier,
        name=payload.name,
        description=payload.description,
        subjectType=payload.subjectType,
        taskType=payload.taskType,
        triggerType=payload.triggerType,
        priority=payload.priority,
        enabled=payload.enabled,
        conditions=payload.conditions,
        action=payload.action,
        createdAt=now,
        updatedAt=now,
        lastRun=payload.lastRun,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return TaskRuleRead(**record.model_dump(), coveredCount=0)


@router.patch("/{rule_id}", response_model=TaskRuleRead)
def update_task_rule(
    rule_id: str,
    payload: TaskRuleUpdate,
    session: Session = Depends(get_session),
) -> TaskRuleRead:
    record = session.get(TaskRule, rule_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Task rule '{rule_id}' not found")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(record, key, value)
    record.updatedAt = _now_string()

    session.add(record)
    session.commit()
    session.refresh(record)

    covered_counts = {item.id: item.coveredCount for item in list_task_rules_with_coverage(session)}
    return TaskRuleRead(**record.model_dump(), coveredCount=covered_counts.get(record.id, 0))


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_rule(
    rule_id: str,
    session: Session = Depends(get_session),
) -> Response:
    record = session.get(TaskRule, rule_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"Task rule '{rule_id}' not found")

    session.delete(record)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
