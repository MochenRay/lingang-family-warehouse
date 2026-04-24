from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.database import get_session
from app.services.ai import (
    SUPPORTED_AGENT_TYPES,
    TRIAL_AI_KINDS,
    build_ai_chat_response,
    get_ai_capabilities,
)
from app.services.ai.assistant_agent import visit_outline
from app.services.ai.data_agent import profile_summary, suggest_tags, validate_profile
from app.services.ai.dispatch_agent import risk_scan

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
def post_data_agent_suggest_tags(
    payload: AIActionRequest,
    session: Session = Depends(get_session),
) -> dict[str, object]:
    return suggest_tags(session=session, context_id=payload.context_id)


@router.post("/data-agent/profile-summary")
def post_data_agent_profile_summary(
    payload: AIActionRequest,
    session: Session = Depends(get_session),
) -> dict[str, object]:
    return profile_summary(session=session, context_id=payload.context_id)


@router.post("/data-agent/validate")
def post_data_agent_validate(
    payload: AIActionRequest,
    session: Session = Depends(get_session),
) -> dict[str, object]:
    return validate_profile(session=session, context_id=payload.context_id)


@router.post("/dispatch-agent/risk-scan")
def post_dispatch_agent_risk_scan(
    payload: AIActionRequest,
    session: Session = Depends(get_session),
) -> dict[str, object]:
    return risk_scan(session=session, context_id=payload.context_id)


@router.post("/assistant/visit-outline")
def post_assistant_visit_outline(
    payload: AIActionRequest,
    session: Session = Depends(get_session),
) -> dict[str, object]:
    return visit_outline(session=session, context_id=payload.context_id)
