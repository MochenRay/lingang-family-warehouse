from typing import Any

from sqlmodel import Field

from app.schemas.base import ReadSchema


class ConflictInvolvedPartyRead(ReadSchema):
    type: str
    id: str
    name: str


class ConflictTimelineEntryRead(ReadSchema):
    date: str
    content: str
    operator: str


class ConflictRecordRead(ReadSchema):
    id: str
    source: str
    title: str
    type: str
    description: str
    involvedParties: list[ConflictInvolvedPartyRead | dict[str, Any]] = Field(default_factory=list)
    status: str
    gridId: str
    location: str
    timeline: list[ConflictTimelineEntryRead | dict[str, Any]] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    createdAt: str
    updatedAt: str
