from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.models.person import Person
from app.schemas.person import PersonRead
from sqlmodel import SQLModel

router = APIRouter(prefix="/people", tags=["people"])


class PeopleListResponse(SQLModel):
    items: list[PersonRead]
    total: int


@router.get("", response_model=PeopleListResponse)
def list_people(
    session: Session = Depends(get_session),
    q: str | None = Query(default=None),
    search: str | None = Query(default=None, alias="search"),
    grid_id: str | None = Query(default=None, alias="gridId"),
    house_id: str | None = Query(default=None, alias="houseId"),
    person_type: str | None = Query(default=None, alias="type"),
    risk: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> PeopleListResponse:
    people = list(session.exec(select(Person)))

    keyword_source = q or search
    if keyword_source:
        keyword = keyword_source.strip().lower()
        people = [
            person
            for person in people
            if keyword in person.name.lower()
            or keyword in person.address.lower()
            or keyword in person.idCard.lower()
            or (person.phone and keyword in person.phone.lower())
            or any(keyword in current_tag.lower() for current_tag in person.tags)
        ]
    if grid_id:
        people = [person for person in people if person.gridId == grid_id]
    if house_id:
        people = [person for person in people if person.houseId == house_id]
    if person_type:
        people = [person for person in people if person.type == person_type]
    if risk:
        people = [person for person in people if person.risk == risk]
    if tag:
        people = [person for person in people if tag in person.tags or tag in (person.careLabels or [])]

    people.sort(key=lambda person: (person.updatedAt, person.id), reverse=True)
    total = len(people)
    items = [PersonRead.model_validate(person) for person in people[offset : offset + limit]]
    return PeopleListResponse(items=items, total=total)


@router.get("/{person_id}", response_model=PersonRead)
def get_person(person_id: str, session: Session = Depends(get_session)) -> PersonRead:
    person = session.get(Person, person_id)
    if person is None:
        raise HTTPException(status_code=404, detail=f"Person '{person_id}' not found")
    return PersonRead.model_validate(person)


@router.patch("/{person_id}", response_model=PersonRead)
def update_person(
    person_id: str,
    payload: dict[str, Any] = Body(...),
    session: Session = Depends(get_session),
) -> PersonRead:
    person = session.get(Person, person_id)
    if person is None:
        raise HTTPException(status_code=404, detail=f"Person '{person_id}' not found")

    allowed_fields = set(Person.model_fields.keys()) - {"id"}
    unknown_fields = sorted(set(payload.keys()) - allowed_fields)
    if unknown_fields:
        raise HTTPException(status_code=400, detail=f"Unsupported fields: {', '.join(unknown_fields)}")

    for field, value in payload.items():
        setattr(person, field, value)

    session.add(person)
    session.commit()
    session.refresh(person)
    return PersonRead.model_validate(person)
