"""API schemas land here in T12."""
from app.schemas.conflict import ConflictContextRead, ConflictCreate, ConflictRecordRead, ConflictUpdate
from app.schemas.grid import GridRead
from app.schemas.house import HouseCreate, HouseRead, HouseUpdate, HousingHistoryRead
from app.schemas.person import PersonCreate, PersonRead, PersonUpdate
from app.schemas.stats import StatsDashboardRead, StatsGridListRead
from app.schemas.task_rule import (
    TaskProjectionRead,
    TaskProjectionSummaryRead,
    TaskRuleCreate,
    TaskRuleListRead,
    TaskRuleRead,
    TaskRuleUpdate,
)
from app.schemas.visit import PersonVisitCreate, VisitRecordCreate, VisitRecordRead, VisitRecordUpdate

__all__ = [
    "ConflictRecordRead",
    "ConflictContextRead",
    "ConflictCreate",
    "ConflictUpdate",
    "StatsDashboardRead",
    "StatsGridListRead",
    "TaskProjectionRead",
    "TaskProjectionSummaryRead",
    "TaskRuleCreate",
    "TaskRuleListRead",
    "TaskRuleRead",
    "TaskRuleUpdate",
    "GridRead",
    "HouseCreate",
    "HouseRead",
    "HouseUpdate",
    "HousingHistoryRead",
    "PersonCreate",
    "PersonRead",
    "PersonUpdate",
    "PersonVisitCreate",
    "VisitRecordCreate",
    "VisitRecordRead",
    "VisitRecordUpdate",
]
