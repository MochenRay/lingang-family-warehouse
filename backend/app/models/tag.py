from typing import Any

from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel


class TagDefinition(SQLModel, table=True):
    __tablename__ = "tag_definitions"

    id: str = Field(primary_key=True, max_length=64)
    name: str = Field(index=True, max_length=40)
    normalizedName: str = Field(index=True, unique=True, max_length=40)
    type: str = Field(index=True, max_length=16)
    description: str = Field(sa_column=Column(Text, nullable=False))
    category: str = Field(index=True, max_length=30)
    riskLevel: str = Field(index=True, max_length=16)
    status: str = Field(default="enabled", max_length=16)
    conditions: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    isSystem: bool = Field(default=False)
    createdBy: str = Field(max_length=80)
    createdAt: str = Field(max_length=40)
    updatedAt: str = Field(max_length=40)


class PersonTagAssignment(SQLModel, table=True):
    __tablename__ = "person_tag_assignments"

    tagId: str = Field(foreign_key="tag_definitions.id", primary_key=True, max_length=64)
    personId: str = Field(foreign_key="people.id", primary_key=True, max_length=64)
    createdBy: str = Field(max_length=80)
    createdAt: str = Field(max_length=40)
