from typing import Literal

from pydantic import field_validator, model_validator
from sqlmodel import Field, SQLModel

from app.schemas.base import ReadSchema
TagType = Literal["ordinary", "smart"]
TagConditionField = Literal["age", "household_size", "person_type", "risk"]
TagConditionOperator = Literal["eq", "neq", "gt", "gte", "lt", "lte"]
RiskLevel = Literal["High", "Medium", "Low"]


class TagCondition(SQLModel):
    field: TagConditionField
    operator: TagConditionOperator
    value: int | str

    @model_validator(mode="after")
    def validate_field_operator(self) -> "TagCondition":
        if self.field in {"person_type", "risk"} and self.operator not in {"eq", "neq"}:
            raise ValueError("Enum conditions only support eq or neq")
        if self.field in {"age", "household_size"} and not isinstance(self.value, int):
            raise ValueError("Numeric conditions require an integer value")
        return self


class TagCreate(SQLModel):
    name: str = Field(min_length=1, max_length=40)
    type: TagType
    description: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=30)
    riskLevel: RiskLevel
    conditions: list[TagCondition] = Field(default_factory=list, max_length=8)

    @field_validator("name", "description", "category")
    @classmethod
    def trim_text(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Value cannot be blank")
        return trimmed

    @model_validator(mode="after")
    def validate_conditions(self) -> "TagCreate":
        if self.type == "ordinary" and self.conditions:
            raise ValueError("Ordinary tags cannot define smart conditions")
        if self.type == "smart" and not self.conditions:
            raise ValueError("Smart tags require at least one condition")
        return self


class TagDefinitionRead(ReadSchema):
    id: str
    name: str
    type: TagType
    description: str
    category: str
    riskLevel: RiskLevel
    status: str
    conditions: list[TagCondition] = Field(default_factory=list)
    isSystem: bool
    createdBy: str
    createdAt: str
    updatedAt: str
    coverageCount: int = 0


class TagListRead(ReadSchema):
    items: list[TagDefinitionRead] = Field(default_factory=list)
    total: int


class TagMatchRead(ReadSchema):
    tagId: str
    tagName: str
    reasons: list[str] = Field(default_factory=list)
    source: Literal["manual", "smart"]


class TaggedPersonSummaryRead(ReadSchema):
    id: str
    name: str
    gender: str
    age: int
    address: str
    type: str
    risk: RiskLevel


class TaggedHouseSummaryRead(ReadSchema):
    communityName: str
    building: str
    unit: str
    room: str


class TaggedPersonRead(ReadSchema):
    person: TaggedPersonSummaryRead
    house: TaggedHouseSummaryRead | None = None
    lastVisitAt: str | None = None
    totalConflictCount: int = 0
    activeConflictCount: int = 0
    matchedTags: list[TagMatchRead] = Field(default_factory=list)


class TagSnapshotRead(ReadSchema):
    generatedAt: str
    totalPeople: int
    tags: list[TagDefinitionRead] = Field(default_factory=list)
    people: list[TaggedPersonRead] = Field(default_factory=list)


class PersonTagAssignmentRead(ReadSchema):
    tagId: str
    personId: str
    createdBy: str
    createdAt: str
