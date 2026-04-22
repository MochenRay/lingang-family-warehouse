import json
import socket
from dataclasses import dataclass
from typing import Literal
from urllib import error, parse, request

from app.config import get_settings

AITrialKind = Literal["query", "policy", "writing"]


class LLMRequestError(RuntimeError):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass
class LLMResult:
    content: str
    model: str
    used_fallback_model: bool


class LLMGateway:
    """Provider-facing adapter for Gemini's OpenAI-compatible endpoint."""

    def __init__(self) -> None:
        settings = get_settings()
        self.enabled = settings.ai_enabled
        self.model = settings.llm_model.strip()
        self.fallback_model = settings.llm_fallback_model.strip()
        self.base_url = settings.llm_base_url.strip()
        self.api_key = settings.llm_api_key.strip()
        self.timeout_seconds = settings.llm_timeout_seconds
        self.configured = settings.llm_configured

    def describe(self) -> dict[str, object]:
        status = "ready"
        if not self.enabled:
            status = "disabled"
        elif not self.configured:
            status = "unconfigured"

        return {
            "status": status,
            "enabled": self.enabled,
            "configured": self.configured,
            "model": self.model or None,
            "fallback_model": self.fallback_model or None,
            "base_url": self.base_url or None,
            "timeout_seconds": self.timeout_seconds,
        }

    def generate(self, kind: AITrialKind, prompt: str) -> LLMResult:
        primary_model = self.model
        result = self._request_completion(model=primary_model, kind=kind, prompt=prompt)
        if result:
            return result
        raise RuntimeError("Primary LLM request returned no content.")

    def generate_with_fallback(self, kind: AITrialKind, prompt: str) -> LLMResult:
        try:
            return self.generate(kind=kind, prompt=prompt)
        except LLMRequestError as exc:
            if not self._should_retry_with_fallback(exc):
                raise

            fallback_result = self._request_completion(
                model=self.fallback_model,
                kind=kind,
                prompt=prompt,
            )
            if fallback_result:
                fallback_result.used_fallback_model = True
                return fallback_result
            raise

    def _request_completion(self, model: str, kind: AITrialKind, prompt: str) -> LLMResult:
        target_url = parse.urljoin(self.base_url.rstrip("/") + "/", "chat/completions")
        payload = {
            "model": model,
            "messages": self._build_messages(kind=kind, prompt=prompt),
            "temperature": 0.35 if kind == "policy" else 0.55,
        }
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        http_request = request.Request(
            target_url,
            data=encoded,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with request.urlopen(http_request, timeout=self.timeout_seconds) as response:
                data = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            message = detail or exc.reason or "LLM upstream returned an HTTP error."
            raise LLMRequestError(message=message, status_code=exc.code) from exc
        except error.URLError as exc:
            reason = getattr(exc, "reason", exc)
            raise LLMRequestError(message=f"LLM upstream unreachable: {reason}", status_code=None) from exc
        except socket.timeout as exc:
            raise LLMRequestError(message="LLM upstream timed out.", status_code=None) from exc
        except json.JSONDecodeError as exc:
            raise LLMRequestError(message="LLM upstream returned invalid JSON.", status_code=None) from exc

        try:
            message_content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMRequestError(message="LLM upstream returned no message content.", status_code=None) from exc

        content = self._normalize_content(message_content)
        if not content:
            raise LLMRequestError(message="LLM upstream returned empty content.", status_code=None)

        return LLMResult(
            content=content,
            model=model,
            used_fallback_model=False,
        )

    def _should_retry_with_fallback(self, exc: LLMRequestError) -> bool:
        if not self.fallback_model or self.fallback_model == self.model:
            return False

        lowered = exc.message.lower()
        if exc.status_code in {400, 404} and (
            "model" in lowered or "not found" in lowered or "unsupported" in lowered
        ):
            return True
        return False

    def _build_messages(self, kind: AITrialKind, prompt: str) -> list[dict[str, str]]:
        system_prompt = self._build_system_prompt(kind)
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt.strip()},
        ]

    @staticmethod
    def _build_system_prompt(kind: AITrialKind) -> str:
        if kind == "policy":
            return (
                "你是社区治理系统中的政策解读助手。请用简洁、稳妥的中文回答，"
                "不要捏造当地政策细则。优先按“适用对象、办理要点、所需材料、下一步建议”组织回答，"
                "若用户问题缺少关键信息，应明确说明还需补充哪些条件。"
            )
        if kind == "writing":
            return (
                "你是社区治理系统中的公文写作助手。请输出可直接继续润色的中文草稿，"
                "优先按正式工作文稿结构组织内容。涉及通知、总结、汇报时，尽量给出标题、正文结构和下一步建议，"
                "不要捏造真实人名、机构盖章或不存在的事实。"
            )
        return (
            "你是社区治理系统中的智能问数样例助手。由于当前页并不直接绑定实时数据库，"
            "回答时要强调建议的分析结构、核验路径和下一步动作，不要伪造精确统计结果。"
        )

    @staticmethod
    def _normalize_content(message_content: object) -> str:
        if isinstance(message_content, str):
            return message_content.strip()
        if isinstance(message_content, list):
            parts: list[str] = []
            for item in message_content:
                if isinstance(item, dict):
                    text = item.get("text")
                    if isinstance(text, str) and text.strip():
                        parts.append(text.strip())
            return "\n".join(parts).strip()
        return ""
