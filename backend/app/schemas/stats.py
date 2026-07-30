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


class StatsCountItemRead(ReadSchema):
    name: str
    value: int


class StatsAgeGenderItemRead(ReadSchema):
    name: str
    male: int
    female: int


class StatsDemographicsRead(ReadSchema):
    totalPopulation: int
    elderlyCount: int
    elderlyRate: float
    ageGenderData: list[StatsAgeGenderItemRead] = Field(default_factory=list)
    typeData: list[StatsCountItemRead] = Field(default_factory=list)
    educationData: list[StatsCountItemRead] = Field(default_factory=list)
    nationData: list[StatsCountItemRead] = Field(default_factory=list)


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
    districtName: str
    streetName: str
    communityName: str
    gridLabel: str
    peopleCount: int
    houseCount: int
    visitCount: int
    visitedPersonCount: int
    conflictCount: int


class StatsMetadataRead(ReadSchema):
    generatedAt: str
    totalGrids: int
    totalPeople: int
    totalHouses: int
    totalVisits: int
    totalConflicts: int


class StatsRegionSummaryRead(ReadSchema):
    id: str
    level: str
    name: str
    parentName: str | None = None
    peopleCount: int
    houseCount: int
    visitCount: int
    conflictCount: int
    floatingCount: int
    activeConflictCount: int
    riskCount: int
    rentalCount: int = 0
    vacantCount: int = 0
    warningCount: int = 0
    score: float


class StatsActionItemRead(ReadSchema):
    id: str
    title: str
    description: str
    area: str
    priority: str
    metric: str
    route: str


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
    regionSummaries: list[StatsRegionSummaryRead] = Field(default_factory=list)
    actionItems: list[StatsActionItemRead] = Field(default_factory=list)


class StatsGridListRead(ReadSchema):
    metadata: StatsMetadataRead
    grids: list[StatsGridItemRead] = Field(default_factory=list)


class StatsPerformanceScoreRead(ReadSchema):
    visitFreq: float
    visitQuality: float
    infoComplete: float
    taskCount: float
    taskSpeed: float


class StatsPerformanceItemRead(ReadSchema):
    id: str
    name: str
    gridId: str
    gridName: str
    communityName: str
    streetName: str
    districtName: str
    workerCount: int
    visitCount: int
    visitQuality: float
    infoCompleteness: float
    taskCompleted: int
    pendingCount: int
    overdueCount: int
    scores: StatsPerformanceScoreRead
    totalScore: float


class StatsPerformanceSummaryRead(ReadSchema):
    workerCount: int
    avgScore: float
    bestCommunity: str
    needImproveCount: int


class StatsQualityAlertRead(ReadSchema):
    id: str
    type: str
    desc: str
    count: int
    area: str


class StatsPerformanceRead(ReadSchema):
    metadata: StatsMetadataRead
    weights: StatsPerformanceScoreRead
    workers: list[StatsPerformanceItemRead] = Field(default_factory=list)
    summary: StatsPerformanceSummaryRead
    qualityAlerts: list[StatsQualityAlertRead] = Field(default_factory=list)
