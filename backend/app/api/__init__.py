from fastapi import APIRouter

from app.api.ai import router as ai_router
from app.api.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(ai_router)
