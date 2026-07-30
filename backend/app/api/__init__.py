from fastapi import APIRouter

from app.api.ai import router as ai_router
from app.api.conflicts import router as conflicts_router
from app.api.health import router as health_router
from app.api.houses import router as houses_router
from app.api.knowledge import router as knowledge_router
from app.api.notices import router as notices_router
from app.api.people import router as people_router
from app.api.stats import router as stats_router
from app.api.task_rules import router as task_rules_router
from app.api.tags import router as tags_router
from app.api.visits import router as visits_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(ai_router)
api_router.include_router(people_router)
api_router.include_router(houses_router)
api_router.include_router(knowledge_router)
api_router.include_router(notices_router)
api_router.include_router(visits_router)
api_router.include_router(conflicts_router)
api_router.include_router(stats_router)
api_router.include_router(task_rules_router)
api_router.include_router(tags_router)
