from sqlmodel import Field
from pydantic import ConfigDict

from app.schemas.base import ReadSchema


class HouseCreate(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    gridId: str
    address: str
    communityName: str
    building: str
    unit: str
    room: str
    ownerName: str
    area: str
    type: str
    memberCount: int = 0
    tags: list[str] = Field(default_factory=list)
    updatedAt: str
    houseType: str | None = None
    ownerPhone: str | None = None
    ownerAddress: str | None = None
    occupancyStatus: str | None = None
    residenceType: str | None = None


class HouseUpdate(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    gridId: str | None = None
    address: str | None = None
    communityName: str | None = None
    building: str | None = None
    unit: str | None = None
    room: str | None = None
    ownerName: str | None = None
    area: str | None = None
    type: str | None = None
    memberCount: int | None = None
    tags: list[str] | None = None
    updatedAt: str | None = None
    houseType: str | None = None
    ownerPhone: str | None = None
    ownerAddress: str | None = None
    occupancyStatus: str | None = None
    residenceType: str | None = None


class HouseRead(ReadSchema):
    id: str
    gridId: str
    address: str
    communityName: str
    building: str
    unit: str
    room: str
    ownerName: str
    area: str
    type: str
    memberCount: int
    tags: list[str] = Field(default_factory=list)
    updatedAt: str
    houseType: str | None = None
    ownerPhone: str | None = None
    ownerAddress: str | None = None
    occupancyStatus: str | None = None
    residenceType: str | None = None


class HousingHistoryRead(ReadSchema):
    id: str
    houseId: str
    personName: str
    type: str
    period: str
    moveOutReason: str | None = None
