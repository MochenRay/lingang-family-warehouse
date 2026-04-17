"""Demo data package reserved for T13."""
from dataclasses import dataclass, field

from app.models.conflict import ConflictRecord
from app.models.grid import Grid
from app.models.house import House, HousingHistory
from app.models.notice import NoticeRecord
from app.models.person import Person
from app.models.task_rule import TaskRule
from app.models.visit import VisitRecord


@dataclass
class DemoSeedBundle:
    grids: list[Grid] = field(default_factory=list)
    houses: list[House] = field(default_factory=list)
    housing_histories: list[HousingHistory] = field(default_factory=list)
    people: list[Person] = field(default_factory=list)
    visits: list[VisitRecord] = field(default_factory=list)
    conflicts: list[ConflictRecord] = field(default_factory=list)
    notices: list[NoticeRecord] = field(default_factory=list)
    task_rules: list[TaskRule] = field(default_factory=list)

    def extend(self, other: "DemoSeedBundle") -> "DemoSeedBundle":
        self.grids.extend(other.grids)
        self.houses.extend(other.houses)
        self.housing_histories.extend(other.housing_histories)
        self.people.extend(other.people)
        self.visits.extend(other.visits)
        self.conflicts.extend(other.conflicts)
        self.notices.extend(other.notices)
        self.task_rules.extend(other.task_rules)
        return self

    def counts(self) -> dict[str, int]:
        return {
            "grids": len(self.grids),
            "houses": len(self.houses),
            "housing_histories": len(self.housing_histories),
            "people": len(self.people),
            "visits": len(self.visits),
            "conflicts": len(self.conflicts),
            "notices": len(self.notices),
            "task_rules": len(self.task_rules),
        }
