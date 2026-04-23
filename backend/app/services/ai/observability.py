import json
import logging
from datetime import datetime, timezone
from typing import Literal

from app.services.ai.llm_gateway import AITrialKind

logger = logging.getLogger("homedata.ai")


def log_ai_event(
    event: str,
    *,
    status: Literal["live", "disabled", "unconfigured", "degraded"],
    kind: AITrialKind,
    agent_type: str,
    model: str | None = None,
    used_fallback_model: bool = False,
    upstream_status_code: int | None = None,
    error: str | None = None,
) -> None:
    """Emit Railway-searchable AI events without logging prompts or secrets."""

    payload = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "status": status,
        "kind": kind,
        "agent_type": agent_type,
        "model": model,
        "used_fallback_model": used_fallback_model,
        "upstream_status_code": upstream_status_code,
        "error": _truncate(error),
    }
    logger.warning("ai_event=%s", json.dumps(payload, ensure_ascii=False, sort_keys=True))


def _truncate(value: str | None, limit: int = 500) -> str | None:
    if value is None or len(value) <= limit:
        return value
    return f"{value[:limit]}..."
