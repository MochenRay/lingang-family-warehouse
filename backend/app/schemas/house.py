from sqlmodel import Field

from app.schemas.base import ReadSchema


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
