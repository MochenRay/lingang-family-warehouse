from typing import Any

from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel


class NoticeBase(SQLModel):
    id: str
    title: str = Field(index=True, max_length=160)
    type: str = Field(index=True, max_length=32)
    content: str = Field(sa_column=Column(Text, nullable=False))
    scope: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    grids: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    status: str = Field(index=True, max_length=16, default="published")
    publishedAt: str = Field(max_length=32)
    publisher: str = Field(max_length=80)
    department: str = Field(max_length=120, default="临港区社会治理现代化指挥中心")
    scheduledTime: str | None = Field(default=None, max_length=32)
    readCount: int = Field(default=0, ge=0)
    attachments: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))


class NoticeRecord(NoticeBase, table=True):
    __tablename__ = "notice_records"

    id: str = Field(primary_key=True, max_length=64)
