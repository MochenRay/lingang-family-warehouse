from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.database import check_database

router = APIRouter(tags=["system"])


@router.get("/health")
def read_health() -> JSONResponse:
    database_ok, database_error = check_database()
    payload = {
        "status": "ok" if database_ok else "degraded",
        "backend": "ready",
        "database": "ok" if database_ok else "error",
        "ai": "placeholder",
        "error": database_error,
    }
    status_code = status.HTTP_200_OK if database_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=payload)
