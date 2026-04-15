from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlmodel import Session, select

from app.database import get_session
from app.models.house import House, HousingHistory
from app.models.person import Person
from app.schemas.house import HouseCreate, HouseRead, HouseUpdate, HousingHistoryRead
from app.schemas.person import PersonRead
from sqlmodel import SQLModel

router = APIRouter(prefix="/houses", tags=["houses"])


class HousesListResponse(SQLModel):
    items: list[HouseRead]
    total: int


@router.get("", response_model=HousesListResponse)
def list_houses(
    session: Session = Depends(get_session),
    q: str | None = Query(default=None),
    search: str | None = Query(default=None),
    grid_id: str | None = Query(default=None, alias="gridId"),
    community_name: str | None = Query(default=None, alias="communityName"),
    house_type: str | None = Query(default=None, alias="type"),
    tag: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> HousesListResponse:
    houses = list(session.exec(select(House)))

    keyword_source = q or search
    if keyword_source:
        keyword = keyword_source.strip().lower()
        houses = [
            house
            for house in houses
            if keyword in house.address.lower()
            or keyword in house.ownerName.lower()
            or keyword in house.building.lower()
            or keyword in house.communityName.lower()
        ]
    if grid_id:
        houses = [house for house in houses if house.gridId == grid_id]
    if community_name:
        houses = [house for house in houses if house.communityName == community_name]
    if house_type:
        houses = [house for house in houses if house.type == house_type]
    if tag:
        houses = [house for house in houses if tag in house.tags]

    houses.sort(key=lambda house: (house.updatedAt, house.id), reverse=True)
    total = len(houses)
    items = [HouseRead.model_validate(house) for house in houses[offset : offset + limit]]
    return HousesListResponse(items=items, total=total)


@router.get("/{house_id}", response_model=HouseRead)
def get_house(house_id: str, session: Session = Depends(get_session)) -> HouseRead:
    house = session.get(House, house_id)
    if house is None:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found")
    return HouseRead.model_validate(house)


@router.post("", response_model=HouseRead, status_code=status.HTTP_201_CREATED)
def create_house(payload: HouseCreate, session: Session = Depends(get_session)) -> HouseRead:
    house = House(
        id=f"house_{uuid4().hex[:12]}",
        **payload.model_dump(),
    )
    session.add(house)
    session.commit()
    session.refresh(house)
    return HouseRead.model_validate(house)


@router.get("/{house_id}/residents", response_model=list[PersonRead])
def get_house_residents(house_id: str, session: Session = Depends(get_session)) -> list[PersonRead]:
    house = session.get(House, house_id)
    if house is None:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found")

    people = list(session.exec(select(Person).where(Person.houseId == house_id)))
    people.sort(key=lambda person: (person.risk, person.updatedAt, person.id), reverse=True)
    return [PersonRead.model_validate(person) for person in people]


@router.get("/{house_id}/history", response_model=list[HousingHistoryRead])
def get_house_history(house_id: str, session: Session = Depends(get_session)) -> list[HousingHistoryRead]:
    house = session.get(House, house_id)
    if house is None:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found")

    records = list(session.exec(select(HousingHistory).where(HousingHistory.houseId == house_id)))
    return [HousingHistoryRead.model_validate(record) for record in records]


@router.patch("/{house_id}", response_model=HouseRead)
def update_house(
    house_id: str,
    payload: HouseUpdate,
    session: Session = Depends(get_session),
) -> HouseRead:
    house = session.get(House, house_id)
    if house is None:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(house, field, value)

    session.add(house)
    session.commit()
    session.refresh(house)
    return HouseRead.model_validate(house)


@router.delete("/{house_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_house(house_id: str, session: Session = Depends(get_session)) -> Response:
    house = session.get(House, house_id)
    if house is None:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found")

    residents = list(session.exec(select(Person).where(Person.houseId == house_id)))
    if residents:
        raise HTTPException(status_code=400, detail="House still has bound residents")

    history_records = list(session.exec(select(HousingHistory).where(HousingHistory.houseId == house_id)))
    if history_records:
        raise HTTPException(status_code=400, detail="House still has housing history records")

    session.delete(house)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
