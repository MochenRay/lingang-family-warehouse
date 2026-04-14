from typing import Any

from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel


class ConflictRecordBase(SQLModel):
    id: str
    source: str = Field(max_length=16)
    title: str = Field(index=True, max_length=120)
    type: str = Field(max_length=32)
    description: str = Field(sa_column=Column(Text, nullable=False))
    involvedParties: list[dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False),
    )
    status: str = Field(max_length=16)
    gridId: str = Field(foreign_key="grids.id", index=True, max_length=64)
    location: str = Field(sa_column=Column(Text, nullable=False))
    timeline: list[dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False),
    )
    images: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    createdAt: str = Field(max_length=32)
    updatedAt: str = Field(max_length=32)


class ConflictRecord(ConflictRecordBase, table=True):
    __tablename__ = "conflict_records"

    id: str = Field(primary_key=True, max_length=64)
