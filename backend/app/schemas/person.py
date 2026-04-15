from typing import Any

from sqlmodel import Field
from pydantic import ConfigDict

from app.schemas.base import ReadSchema


class FamilyRelationRead(ReadSchema):
    relatedPersonId: str
    relationType: str


class PersonCategoryLabelsRead(ReadSchema):
    isFloorLeader: bool | None = None
    isUnitLeader: bool | None = None
    isAssistant: bool | None = None
    focusType: list[str] | None = None


class PersonActivityParticipationRead(ReadSchema):
    activities: str | None = None
    needs: str | None = None


class PersonHealthRecordRead(ReadSchema):
    hasChronic: bool | None = None
    chronicDetails: str | None = None
    needsRegularMedicine: bool | None = None
    medicineFrequency: str | None = None
    medicalVisitFrequency: str | None = None
    isSeverePatient: bool | None = None
    isPregnant: bool | None = None
    specialNotes: str | None = None


class FamilyRelationWrite(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    relatedPersonId: str
    relationType: str


class PersonCategoryLabelsWrite(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    isFloorLeader: bool | None = None
    isUnitLeader: bool | None = None
    isAssistant: bool | None = None
    focusType: list[str] | None = None


class PersonActivityParticipationWrite(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    activities: str | None = None
    needs: str | None = None


class PersonHealthRecordWrite(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    hasChronic: bool | None = None
    chronicDetails: str | None = None
    needsRegularMedicine: bool | None = None
    medicineFrequency: str | None = None
    medicalVisitFrequency: str | None = None
    isSeverePatient: bool | None = None
    isPregnant: bool | None = None
    specialNotes: str | None = None


class PersonCreate(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    gridId: str
    name: str
    idCard: str
    gender: str
    age: int = 0
    phone: str | None = None
    address: str
    houseId: str | None = None
    type: str
    tags: list[str] = Field(default_factory=list)
    risk: str
    updatedAt: str
    nation: str | None = None
    education: str | None = None
    familyRelations: list[FamilyRelationWrite] | None = None
    birthDate: str | None = None
    birthplace: str | None = None
    maritalStatus: str | None = None
    religion: str | None = None
    politicalStatus: str | None = None
    militaryService: bool | None = None
    graduationInfo: str | None = None
    workplace: str | None = None
    communityVolunteer: bool | None = None
    skills: str | None = None
    pets: str | None = None
    careLabels: list[str] | None = None
    categoryLabels: PersonCategoryLabelsWrite | dict[str, Any] | None = None
    biography: str | None = None
    activityParticipation: PersonActivityParticipationWrite | dict[str, Any] | None = None
    healthRecord: PersonHealthRecordWrite | dict[str, Any] | None = None
    importantEvents: str | None = None


class PersonUpdate(ReadSchema):
    model_config = ConfigDict(from_attributes=False)

    gridId: str | None = None
    name: str | None = None
    idCard: str | None = None
    gender: str | None = None
    age: int | None = None
    phone: str | None = None
    address: str | None = None
    houseId: str | None = None
    type: str | None = None
    tags: list[str] | None = None
    risk: str | None = None
    updatedAt: str | None = None
    nation: str | None = None
    education: str | None = None
    familyRelations: list[FamilyRelationWrite] | None = None
    birthDate: str | None = None
    birthplace: str | None = None
    maritalStatus: str | None = None
    religion: str | None = None
    politicalStatus: str | None = None
    militaryService: bool | None = None
    graduationInfo: str | None = None
    workplace: str | None = None
    communityVolunteer: bool | None = None
    skills: str | None = None
    pets: str | None = None
    careLabels: list[str] | None = None
    categoryLabels: PersonCategoryLabelsWrite | dict[str, Any] | None = None
    biography: str | None = None
    activityParticipation: PersonActivityParticipationWrite | dict[str, Any] | None = None
    healthRecord: PersonHealthRecordWrite | dict[str, Any] | None = None
    importantEvents: str | None = None


class PersonRead(ReadSchema):
    id: str
    gridId: str
    name: str
    idCard: str
    gender: str
    age: int
    phone: str | None = None
    address: str
    houseId: str | None = None
    type: str
    tags: list[str] = Field(default_factory=list)
    risk: str
    updatedAt: str
    nation: str | None = None
    education: str | None = None
    familyRelations: list[FamilyRelationRead] | None = None
    birthDate: str | None = None
    birthplace: str | None = None
    maritalStatus: str | None = None
    religion: str | None = None
    politicalStatus: str | None = None
    militaryService: bool | None = None
    graduationInfo: str | None = None
    workplace: str | None = None
    communityVolunteer: bool | None = None
    skills: str | None = None
    pets: str | None = None
    careLabels: list[str] | None = None
    categoryLabels: PersonCategoryLabelsRead | dict[str, Any] | None = None
    biography: str | None = None
    activityParticipation: PersonActivityParticipationRead | dict[str, Any] | None = None
    healthRecord: PersonHealthRecordRead | dict[str, Any] | None = None
    importantEvents: str | None = None
