from typing import Any

from pydantic import ConfigDict
from sqlmodel import Field

from app.schemas.base import ReadSchema
from app.schemas.house import HouseRead
from app.schemas.person import PersonRead
from app.schemas.visit import VisitRecordRead


class ConflictInvolvedPartyRead(ReadSchema):
    type: str
    id: str
    name: str


class ConflictTimelineEntryRead(ReadSchema):
    date: str
    content: str
    operator: str


class ConflictInvolvedPartyWrite(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    type: str
    id: str
    name: str


class ConflictTimelineEntryWrite(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    date: str
    content: str
    operator: str


class ConflictCreate(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    source: str = "上级下派"
    title: str
    type: str
    description: str
    involvedParties: list[ConflictInvolvedPartyWrite | dict[str, Any]] = Field(default_factory=list)
    status: str = "调解中"
    gridId: str
    location: str = "待核实"
    timeline: list[ConflictTimelineEntryWrite | dict[str, Any]] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    createdAt: str
    updatedAt: str


class ConflictUpdate(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    source: str | None = None
    title: str | None = None
    type: str | None = None
    description: str | None = None
    involvedParties: list[ConflictInvolvedPartyWrite | dict[str, Any]] | None = None
    status: str | None = None
    gridId: str | None = None
    location: str | None = None
    timeline: list[ConflictTimelineEntryWrite | dict[str, Any]] | None = None
    images: list[str] | None = None
    createdAt: str | None = None
    updatedAt: str | None = None


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


class ConflictFollowUpRead(ReadSchema):
    code: str
    label: str
    detail: str


class ConflictContextRead(ReadSchema):
    relatedPeople: list[PersonRead] = Field(default_factory=list)
    relatedHouse: HouseRead | None = None
    recentVisits: list[VisitRecordRead] = Field(default_factory=list)
    followUpStatus: ConflictFollowUpRead
    suggestedActions: list[str] = Field(default_factory=list)
