from typing import Any

from sqlmodel import Field, SQLModel

from app.schemas.base import ReadSchema


class TaskRuleCreate(SQLModel):
    id: str | None = Field(default=None, max_length=64)
    name: str = Field(max_length=80)
    description: str
    subjectType: str = Field(max_length=16)
    taskType: str = Field(max_length=32)
    triggerType: str = Field(max_length=16)
    priority: str = Field(max_length=16)
    enabled: bool = True
    conditions: dict[str, Any] = Field(default_factory=dict)
    action: dict[str, Any] = Field(default_factory=dict)
    lastRun: str | None = Field(default=None, max_length=32)


class TaskRuleUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=80)
    description: str | None = None
    subjectType: str | None = Field(default=None, max_length=16)
    taskType: str | None = Field(default=None, max_length=32)
    triggerType: str | None = Field(default=None, max_length=16)
    priority: str | None = Field(default=None, max_length=16)
    enabled: bool | None = None
    conditions: dict[str, Any] | None = None
    action: dict[str, Any] | None = None
    lastRun: str | None = Field(default=None, max_length=32)


class TaskRuleRead(ReadSchema):
    id: str
    name: str
    description: str
    subjectType: str
    taskType: str
    triggerType: str
    priority: str
    enabled: bool
    conditions: dict[str, Any] = Field(default_factory=dict)
    action: dict[str, Any] = Field(default_factory=dict)
    createdAt: str
    updatedAt: str
    lastRun: str | None = None
    coveredCount: int = 0


class TaskRuleListRead(ReadSchema):
    items: list[TaskRuleRead] = Field(default_factory=list)
    total: int


class TaskProjectionItemRead(ReadSchema):
    id: str
    title: str
    type: str
    sourceKind: str
    sourceId: str
    gridId: str
    route: str
    priority: str
    urgent: bool
    description: str
    assignedBy: str
    deadline: str | None = None
    completedAt: str | None = None
    status: str
    statusLabel: str
    feedback: str | None = None
    personId: str | None = None
    houseId: str | None = None
    conflictId: str | None = None
    visitId: str | None = None
    onTime: bool | None = None


class TaskProjectionSummaryRead(ReadSchema):
    pending: int
    overdue: int
    completed: int
    completionRate: int


class TaskProjectionRead(ReadSchema):
    pending: list[TaskProjectionItemRead] = Field(default_factory=list)
    completed: list[TaskProjectionItemRead] = Field(default_factory=list)
    summary: TaskProjectionSummaryRead
