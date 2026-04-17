from sqlmodel import Field

from app.schemas.base import ReadSchema


class KnowledgeEntryRead(ReadSchema):
    id: str
    title: str
    type: str
    category: str
    summary: str
    content: str
    size: str | None = None
    uploadDate: str
    author: str
    tags: list[str] = Field(default_factory=list)
    relatedType: str | None = None
    relatedId: str | None = None
    source: str | None = None


class KnowledgeEntryListRead(ReadSchema):
    items: list[KnowledgeEntryRead] = Field(default_factory=list)
    total: int
