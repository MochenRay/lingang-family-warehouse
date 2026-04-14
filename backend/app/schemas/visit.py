from sqlmodel import Field

from app.schemas.base import ReadSchema


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
