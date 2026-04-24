from typing import Literal

from app.services.ai.llm_gateway import AITrialKind, LLMGateway, LLMRequestError
from app.services.ai.observability import log_ai_event

SUPPORTED_AGENT_TYPES = ("data_agent", "dispatch_agent", "assistant")
TRIAL_AI_KINDS = ("query", "policy", "writing")


def get_ai_capabilities() -> dict[str, object]:
    gateway = LLMGateway()
    description = gateway.describe()
    return {
        "status": description["status"],
        "backend": "ready",
        "ai_enabled": description["enabled"],
        "llm_configured": description["configured"],
        "default_model": description["model"],
        "fallback_model": description["fallback_model"],
        "base_url": description["base_url"],
        "supported_agents": SUPPORTED_AGENT_TYPES,
        "trial_kinds": TRIAL_AI_KINDS,
        "phase": "phase6-public-trial",
        "notes": [
            "Policy and official writing pages may call the real LLM path when configured.",
            "Phase 9 agent action endpoints return deterministic demo-data context even when the LLM path is unavailable.",
            "If the provider is unavailable, the API degrades to a sample-safe response instead of surfacing raw upstream errors.",
        ],
    }


def build_placeholder_response(
    agent_type: str | None,
    context_id: str | None,
    request_message: str | None = None,
    kind: AITrialKind = "query",
    status: Literal["placeholder", "disabled", "unconfigured", "degraded"] = "placeholder",
    model: str | None = None,
    used_fallback_model: bool = False,
    error: str | None = None,
) -> dict[str, object]:
    return {
        "status": status,
        "agent_type": agent_type or "assistant",
        "kind": kind,
        "context_id": context_id,
        "request": {
            "message": request_message,
        },
        "model": model,
        "used_fallback_model": used_fallback_model,
        "content": _build_sample_content(kind=kind, request_message=request_message),
        "summary": _build_sample_summary(kind=kind),
        "items": [],
        "context_cards": [],
        "error": error,
        "supported_agents": list(SUPPORTED_AGENT_TYPES),
    }


def build_ai_chat_response(
    *,
    kind: AITrialKind,
    agent_type: str | None,
    context_id: str | None,
    request_message: str | None,
) -> dict[str, object]:
    gateway = LLMGateway()
    capability = gateway.describe()
    requested_agent = agent_type or "assistant"

    if not capability["enabled"]:
        log_ai_event(
            "ai_disabled",
            status="disabled",
            kind=kind,
            agent_type=requested_agent,
            error="AI service disabled by environment flag.",
        )
        return build_placeholder_response(
            agent_type=agent_type,
            context_id=context_id,
            request_message=request_message,
            kind=kind,
            status="disabled",
            error="AI service disabled by environment flag.",
        )

    if not capability["configured"]:
        log_ai_event(
            "ai_unconfigured",
            status="unconfigured",
            kind=kind,
            agent_type=requested_agent,
            error="LLM environment variables are incomplete.",
        )
        return build_placeholder_response(
            agent_type=agent_type,
            context_id=context_id,
            request_message=request_message,
            kind=kind,
            status="unconfigured",
            error="LLM environment variables are incomplete.",
        )

    try:
        result = gateway.generate_with_fallback(kind=kind, prompt=request_message or "")
    except LLMRequestError as exc:
        log_ai_event(
            "ai_degraded",
            status="degraded",
            kind=kind,
            agent_type=requested_agent,
            upstream_status_code=exc.status_code,
            error=exc.message,
        )
        return build_placeholder_response(
            agent_type=agent_type,
            context_id=context_id,
            request_message=request_message,
            kind=kind,
            status="degraded",
            error=exc.message,
        )
    except Exception as exc:
        log_ai_event(
            "ai_unexpected_failure",
            status="degraded",
            kind=kind,
            agent_type=requested_agent,
            error=str(exc),
        )
        return build_placeholder_response(
            agent_type=agent_type,
            context_id=context_id,
            request_message=request_message,
            kind=kind,
            status="degraded",
            error=f"Unexpected LLM gateway failure: {exc}",
        )

    if result.used_fallback_model:
        log_ai_event(
            "ai_fallback_model_used",
            status="live",
            kind=kind,
            agent_type=requested_agent,
            model=result.model,
            used_fallback_model=True,
            error="Primary model failed; fallback model returned content.",
        )

    return {
        "status": "live",
        "agent_type": requested_agent,
        "kind": kind,
        "context_id": context_id,
        "request": {
            "message": request_message,
        },
        "model": result.model,
        "used_fallback_model": result.used_fallback_model,
        "content": result.content,
        "summary": "LLM response generated successfully.",
        "items": [],
        "context_cards": [],
        "error": None,
        "supported_agents": list(SUPPORTED_AGENT_TYPES),
    }


def _build_sample_summary(kind: AITrialKind) -> str:
    if kind == "policy":
        return "Policy interpretation is using a sample-safe fallback structure."
    if kind == "writing":
        return "Official writing is using a sample-safe fallback structure."
    return "Smart query is using a sample-safe fallback structure."


def _build_sample_content(kind: AITrialKind, request_message: str | None) -> str:
    prompt = (request_message or "未提供具体问题").strip()
    if kind == "policy":
        return "\n".join(
            [
                f"已记录问题：{prompt}",
                "",
                "当前返回的是降级样例答复，优先保持结构稳定，不直接承诺本地政策细则已经实时核验。",
                "建议答复结构：",
                "1. 适用对象与办理条件",
                "2. 需要补齐的材料与字段",
                "3. 办理部门、办理方式与下一步建议",
            ]
        )
    if kind == "writing":
        return "\n".join(
            [
                f"已记录需求：{prompt}",
                "",
                "当前返回的是降级样例文稿，重点保证结构和表达方式稳定。",
                "建议成稿结构：",
                "一、事项背景与目标",
                "二、当前工作进展或现场情况",
                "三、后续安排、责任分工与时间节点",
            ]
        )
    return "\n".join(
        [
            f"已记录问题：{prompt}",
            "",
            "当前返回的是降级样例结果，不直接伪造实时统计值。",
            "建议输出结构：",
            "1. 查询范围与对象口径",
            "2. 建议核验的统计维度",
            "3. 回到驾驶舱或对象详情页继续核验的路径",
        ]
    )
