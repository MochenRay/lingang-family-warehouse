from app.config import get_settings

SUPPORTED_AGENT_TYPES = ("data_agent", "dispatch_agent", "assistant")


def get_ai_capabilities() -> dict[str, object]:
    settings = get_settings()
    return {
        "status": "placeholder",
        "backend": "ready",
        "llm_configured": settings.llm_configured,
        "supported_agents": SUPPORTED_AGENT_TYPES,
        "phase": "phase1-skeleton",
        "notes": [
            "Phase 2 will replace this placeholder with business-context AI endpoints.",
            "Current scope is only to reserve route, config, and service boundaries.",
        ],
    }


def build_placeholder_response(
    agent_type: str | None,
    context_id: str | None,
    request_message: str | None = None,
) -> dict[str, object]:
    return {
        "status": "placeholder",
        "agent_type": agent_type or "assistant",
        "context_id": context_id,
        "request": {
            "message": request_message,
        },
        "summary": "AI service placeholder is ready. Real LLM orchestration starts in Phase 2.",
        "items": [],
        "context_cards": [],
        "error": None,
        "supported_agents": list(SUPPORTED_AGENT_TYPES),
    }
