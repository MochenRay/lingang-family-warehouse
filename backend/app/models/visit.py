from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel


class VisitRecordBase(SQLModel):
    id: str
    targetId: str = Field(index=True, max_length=64)
    targetType: str = Field(index=True, max_length=16)
    gridId: str = Field(foreign_key="grids.id", index=True, max_length=64)
    visitorName: str = Field(max_length=80)
    date: str = Field(max_length=32)
    content: str = Field(sa_column=Column(Text, nullable=False))
    images: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    tags: list[str] | None = Field(default=None, sa_column=Column(JSON, nullable=True))


class VisitRecord(VisitRecordBase, table=True):
    __tablename__ = "visit_records"

    id: str = Field(primary_key=True, max_length=64)
