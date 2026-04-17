"""SQLModel tables land here in T12."""
from app.models.conflict import ConflictRecord
from app.models.grid import Grid
from app.models.house import House, HousingHistory
from app.models.knowledge import KnowledgeRecord
from app.models.notice import NoticeRecord
from app.models.person import Person
from app.models.task_rule import TaskRule
from app.models.visit import VisitRecord

__all__ = [
    "ConflictRecord",
    "Grid",
    "House",
    "HousingHistory",
    "KnowledgeRecord",
    "NoticeRecord",
    "Person",
    "TaskRule",
    "VisitRecord",
]
