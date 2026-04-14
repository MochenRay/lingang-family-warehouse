from typing import Any

from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel


class PersonBase(SQLModel):
    id: str
    gridId: str = Field(foreign_key="grids.id", index=True, max_length=64)
    name: str = Field(index=True, max_length=80)
    idCard: str = Field(index=True, max_length=32)
    gender: str = Field(max_length=4)
    age: int = Field(default=0, ge=0)
    phone: str | None = Field(default=None, max_length=32)
    address: str = Field(sa_column=Column(Text, nullable=False))
    houseId: str | None = Field(default=None, foreign_key="houses.id", index=True)
    type: str = Field(max_length=16)
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    risk: str = Field(max_length=16)
    updatedAt: str = Field(max_length=32)
    nation: str | None = Field(default=None, max_length=32)
    education: str | None = Field(default=None, max_length=64)
    familyRelations: list[dict[str, Any]] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )
    birthDate: str | None = Field(default=None, max_length=32)
    birthplace: str | None = Field(default=None, max_length=64)
    maritalStatus: str | None = Field(default=None, max_length=16)
    religion: str | None = Field(default=None, max_length=64)
    politicalStatus: str | None = Field(default=None, max_length=64)
    militaryService: bool | None = Field(default=None)
    graduationInfo: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    workplace: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    communityVolunteer: bool | None = Field(default=None)
    skills: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    pets: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    careLabels: list[str] | None = Field(default=None, sa_column=Column(JSON, nullable=True))
    categoryLabels: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )
    biography: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    activityParticipation: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )
    healthRecord: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSON, nullable=True),
    )
    importantEvents: str | None = Field(default=None, sa_column=Column(Text, nullable=True))


class Person(PersonBase, table=True):
    __tablename__ = "people"

    id: str = Field(primary_key=True, max_length=64)
