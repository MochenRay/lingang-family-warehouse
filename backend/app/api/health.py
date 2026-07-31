from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import check_database
from app.services.ai import get_ai_capabilities

router = APIRouter(tags=["system"])


@router.get("/health")
def read_health() -> JSONResponse:
    database_ok, database_error = check_database()
    ai_status = get_ai_capabilities()["status"]
    payload = {
        "status": "ok" if database_ok else "degraded",
        "backend": "ready",
        "database": "ok" if database_ok else "error",
        "ai": ai_status,
        "error": database_error,
        "demo_write_mode": get_settings().effective_demo_write_mode,
    }
    status_code = status.HTTP_200_OK if database_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        status_code=status_code,
        content=payload,
        headers={"Cache-Control": "no-store"},
    )
