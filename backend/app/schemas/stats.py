from sqlmodel import Field

from app.schemas.base import ReadSchema


class StatsGenderItemRead(ReadSchema):
    name: str
    value: int
    color: str


class StatsAgeItemRead(ReadSchema):
    name: str
    value: int
    fill: str


class StatsRiskTagItemRead(ReadSchema):
    name: str
    count: int
    level: str
    delta: str


class StatsTrendItemRead(ReadSchema):
    month: str
    value: int


class StatsHousingStatsRead(ReadSchema):
    total: int
    selfOccupied: int
    rental: int
    vacant: int
    commercial: int
    buildings: int
    avgArea: int
    avgMembers: float
    completionRate: int


class StatsConflictStatsRead(ReadSchema):
    total: int
    today: int
    resolved: int
    active: int
    rate: int


class StatsMobilePeopleStatsRead(ReadSchema):
    total: int
    registered: int
    floating: int
    highRisk: int
    mediumRisk: int
    lowRisk: int


class StatsGridItemRead(ReadSchema):
    id: str
    name: str
    parentId: str | None = None
    managerName: str | None = None
    peopleCount: int
    houseCount: int
    visitCount: int
    conflictCount: int


class StatsMetadataRead(ReadSchema):
    generatedAt: str
    totalGrids: int
    totalPeople: int
    totalHouses: int
    totalVisits: int
    totalConflicts: int


class StatsDashboardRead(ReadSchema):
    metadata: StatsMetadataRead
    totalPopulation: int
    totalHouses: int
    genderData: list[StatsGenderItemRead] = Field(default_factory=list)
    ageData: list[StatsAgeItemRead] = Field(default_factory=list)
    riskTagsSummary: list[StatsRiskTagItemRead] = Field(default_factory=list)
    trendData: list[StatsTrendItemRead] = Field(default_factory=list)
    housingStats: StatsHousingStatsRead
    conflictStats: StatsConflictStatsRead
    mobilePeopleStats: StatsMobilePeopleStatsRead
    grids: list[StatsGridItemRead] = Field(default_factory=list)


class StatsGridListRead(ReadSchema):
    metadata: StatsMetadataRead
    grids: list[StatsGridItemRead] = Field(default_factory=list)
