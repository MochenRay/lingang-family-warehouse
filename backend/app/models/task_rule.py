from typing import Any

from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel


class TaskRuleBase(SQLModel):
    id: str
    name: str = Field(index=True, max_length=80)
    description: str = Field(sa_column=Column(Text, nullable=False))
    subjectType: str = Field(index=True, max_length=16)
    taskType: str = Field(max_length=32)
    triggerType: str = Field(max_length=16)
    priority: str = Field(max_length=16)
    enabled: bool = Field(default=True)
    conditions: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    action: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    createdAt: str = Field(max_length=32)
    updatedAt: str = Field(max_length=32)
    lastRun: str | None = Field(default=None, max_length=32)


class TaskRule(TaskRuleBase, table=True):
    __tablename__ = "task_rules"

    id: str = Field(primary_key=True, max_length=64)
