from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.ai import (
    SUPPORTED_AGENT_TYPES,
    build_placeholder_response,
    get_ai_capabilities,
)

router = APIRouter(prefix="/ai", tags=["ai"])


class AIChatRequest(BaseModel):
    agent_type: Literal["data_agent", "dispatch_agent", "assistant"] | None = Field(
        default=None,
        description="Future agent selector. Phase 1 keeps this as a placeholder only.",
    )
    message: str | None = Field(default=None, description="User prompt placeholder.")
    context_id: str | None = Field(default=None, description="Future person/grid context id.")


class AIActionRequest(BaseModel):
    context_id: str | None = Field(default=None, description="Future person/grid context id.")


@router.get("/capabilities")
def read_ai_capabilities() -> dict[str, object]:
    return get_ai_capabilities()


@router.post("/chat")
def post_ai_chat(payload: AIChatRequest) -> dict[str, object]:
    return build_placeholder_response(
        agent_type=payload.agent_type,
        context_id=payload.context_id,
        request_message=payload.message,
    )


@router.get("/agents")
def read_agents() -> dict[str, tuple[str, ...]]:
    return {"agents": SUPPORTED_AGENT_TYPES}


@router.post("/data-agent/suggest-tags")
def post_data_agent_suggest_tags(payload: AIActionRequest) -> dict[str, object]:
    return build_placeholder_response(
        agent_type="data_agent",
        context_id=payload.context_id,
        request_message="suggest-tags",
    )


@router.post("/dispatch-agent/risk-scan")
def post_dispatch_agent_risk_scan(payload: AIActionRequest) -> dict[str, object]:
    return build_placeholder_response(
        agent_type="dispatch_agent",
        context_id=payload.context_id,
        request_message="risk-scan",
    )


@router.post("/assistant/visit-outline")
def post_assistant_visit_outline(payload: AIActionRequest) -> dict[str, object]:
    return build_placeholder_response(
        agent_type="assistant",
        context_id=payload.context_id,
        request_message="visit-outline",
    )
