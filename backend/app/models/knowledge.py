from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel


class KnowledgeRecordBase(SQLModel):
    id: str
    title: str = Field(index=True, max_length=160)
    type: str = Field(index=True, max_length=32)
    category: str = Field(index=True, max_length=32)
    summary: str = Field(sa_column=Column(Text, nullable=False))
    content: str = Field(sa_column=Column(Text, nullable=False))
    size: str | None = Field(default=None, max_length=32)
    uploadDate: str = Field(max_length=32)
    author: str = Field(max_length=80)
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    relatedType: str | None = Field(default=None, max_length=24)
    relatedId: str | None = Field(default=None, max_length=64)
    source: str | None = Field(default=None, max_length=120)


class KnowledgeRecord(KnowledgeRecordBase, table=True):
    __tablename__ = "knowledge_records"

    id: str = Field(primary_key=True, max_length=64)
