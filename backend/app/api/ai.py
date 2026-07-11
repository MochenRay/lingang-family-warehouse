from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.config import get_settings
from app.database import get_session
from app.services.ai import (
    SUPPORTED_AGENT_TYPES,
    TRIAL_AI_KINDS,
    build_ai_chat_response,
    get_ai_capabilities,
)
from app.services.ai.assistant_agent import visit_outline
from app.services.ai.context_builder import build_safe_person_ai_context
from app.services.ai.data_agent import profile_summary, suggest_tags, validate_profile
from app.services.ai.dispatch_agent import risk_scan
from app.services.ai.rate_limit import enforce_ai_rate_limit

router = APIRouter(prefix="/ai", tags=["ai"])
settings = get_settings()


class AIChatRequest(BaseModel):
    agent_type: Literal["data_agent", "dispatch_agent", "assistant"] | None = Field(
        default=None,
        description="AI agent selector; assistant is used by default.",
    )
    kind: Literal["query", "policy", "writing"] = Field(
        default="query",
        description="Requested response shape for the Gemini-backed assistant.",
    )
    message: str | None = Field(
        default=None,
        max_length=settings.ai_max_prompt_chars,
        description="User prompt.",
    )
    context_id: str | None = Field(default=None, description="Optional person/grid context id.")


class AIActionRequest(BaseModel):
    context_id: str | None = Field(default=None, description="Optional person/grid context id.")


@router.get("/capabilities")
def read_ai_capabilities() -> dict[str, object]:
    return get_ai_capabilities()


@router.post("/chat", dependencies=[Depends(enforce_ai_rate_limit)])
def post_ai_chat(
    payload: AIChatRequest,
    session: Session = Depends(get_session),
) -> dict[str, object]:
    person_context = None
    if payload.context_id:
        person_context = build_safe_person_ai_context(session, payload.context_id)
        if person_context is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Person context was not found.",
            )
    return build_ai_chat_response(
        kind=payload.kind,
        agent_type=payload.agent_type,
        context_id=payload.context_id,
        request_message=payload.message,
        person_context=person_context,
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
