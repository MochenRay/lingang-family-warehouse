from pydantic import ConfigDict
from sqlmodel import Field

from app.schemas.base import ReadSchema


class VisitRecordCreate(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    targetId: str
    targetType: str
    gridId: str
    visitorName: str
    date: str
    content: str
    images: list[str] = Field(default_factory=list)
    tags: list[str] | None = None


class PersonVisitCreate(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    gridId: str
    visitorName: str
    date: str
    content: str
    images: list[str] = Field(default_factory=list)
    tags: list[str] | None = None


class VisitRecordUpdate(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    targetId: str | None = None
    targetType: str | None = None
    gridId: str | None = None
    visitorName: str | None = None
    date: str | None = None
    content: str | None = None
    images: list[str] | None = None
    tags: list[str] | None = None


class VisitRecordRead(ReadSchema):
    id: str
    targetId: str
    targetType: str
    gridId: str
    visitorName: str
    date: str
    content: str
    images: list[str] = Field(default_factory=list)
    tags: list[str] | None = None
