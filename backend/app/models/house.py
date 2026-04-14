from sqlalchemy import Column, JSON, Text
from sqlmodel import Field, SQLModel


class HouseBase(SQLModel):
    id: str
    gridId: str = Field(foreign_key="grids.id", index=True, max_length=64)
    address: str = Field(sa_column=Column(Text, nullable=False))
    communityName: str = Field(index=True, max_length=80)
    building: str = Field(index=True, max_length=32)
    unit: str = Field(max_length=32)
    room: str = Field(max_length=32)
    ownerName: str = Field(max_length=80)
    area: str = Field(max_length=32)
    type: str = Field(max_length=16)
    memberCount: int = Field(default=0, ge=0)
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    updatedAt: str = Field(max_length=32)
    houseType: str | None = Field(default=None, max_length=32)
    ownerPhone: str | None = Field(default=None, max_length=32)
    ownerAddress: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    occupancyStatus: str | None = Field(default=None, max_length=32)
    residenceType: str | None = Field(default=None, max_length=16)


class House(HouseBase, table=True):
    __tablename__ = "houses"

    id: str = Field(primary_key=True, max_length=64)


class HousingHistoryBase(SQLModel):
    id: str
    houseId: str = Field(foreign_key="houses.id", index=True, max_length=64)
    personName: str = Field(max_length=80)
    type: str = Field(max_length=16)
    period: str = Field(max_length=64)
    moveOutReason: str | None = Field(default=None, sa_column=Column(Text, nullable=True))


class HousingHistory(HousingHistoryBase, table=True):
    __tablename__ = "housing_histories"

    id: str = Field(primary_key=True, max_length=64)
