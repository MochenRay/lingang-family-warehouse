from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.ai import (
    SUPPORTED_AGENT_TYPES,
    TRIAL_AI_KINDS,
    build_ai_chat_response,
    build_placeholder_response,
    get_ai_capabilities,
)

router = APIRouter(prefix="/ai", tags=["ai"])


class AIChatRequest(BaseModel):
    agent_type: Literal["data_agent", "dispatch_agent", "assistant"] | None = Field(
        default=None,
        description="AI agent selector. Phase 6 trials use assistant by default.",
    )
    kind: Literal["query", "policy", "writing"] = Field(
        default="query",
        description="Secondary AI trial kind. Phase 6 only enables query/policy/writing shaped prompts.",
    )
    message: str | None = Field(default=None, description="User prompt.")
    context_id: str | None = Field(default=None, description="Optional person/grid context id.")


class AIActionRequest(BaseModel):
    context_id: str | None = Field(default=None, description="Future person/grid context id.")


@router.get("/capabilities")
def read_ai_capabilities() -> dict[str, object]:
    return get_ai_capabilities()


@router.post("/chat")
def post_ai_chat(payload: AIChatRequest) -> dict[str, object]:
    return build_ai_chat_response(
        kind=payload.kind,
        agent_type=payload.agent_type,
        context_id=payload.context_id,
        request_message=payload.message,
    )


@router.get("/agents")
def read_agents() -> dict[str, tuple[str, ...]]:
    return {"agents": SUPPORTED_AGENT_TYPES, "trial_kinds": TRIAL_AI_KINDS}


@router.post("/data-agent/suggest-tags")
def post_data_agent_suggest_tags(payload: AIActionRequest) -> dict[str, object]:
    return build_placeholder_response(
        agent_type="data_agent",
        context_id=payload.context_id,
        kind="query",
        request_message="suggest-tags",
    )


@router.post("/dispatch-agent/risk-scan")
def post_dispatch_agent_risk_scan(payload: AIActionRequest) -> dict[str, object]:
    return build_placeholder_response(
        agent_type="dispatch_agent",
        context_id=payload.context_id,
        kind="query",
        request_message="risk-scan",
    )


@router.post("/assistant/visit-outline")
def post_assistant_visit_outline(payload: AIActionRequest) -> dict[str, object]:
    return build_placeholder_response(
        agent_type="assistant",
        context_id=payload.context_id,
        kind="writing",
        request_message="visit-outline",
    )
