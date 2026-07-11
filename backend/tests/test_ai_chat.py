import json
import os
import subprocess
import sys
from io import BytesIO
from types import SimpleNamespace
from urllib import error

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.database import get_session
from app.main import app
from app.models.grid import Grid
from app.models.person import Person
from app.models.visit import VisitRecord
from app.services.ai.llm_gateway import LLMGateway
from app.services.ai.rate_limit import ProcessRateLimiter


def test_ai_chat_rejects_prompts_over_the_configured_limit() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/ai/chat",
        json={"kind": "query", "message": "x" * 4001},
    )

    assert response.status_code == 422


def test_llm_provider_request_enforces_the_configured_output_token_limit(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args) -> None:
            return None

        def read(self) -> bytes:
            return json.dumps(
                {"choices": [{"message": {"content": "已生成走访提纲"}}]}
            ).encode("utf-8")

    def fake_urlopen(http_request, timeout):
        captured["payload"] = json.loads(http_request.data.decode("utf-8"))
        captured["timeout"] = timeout
        return FakeResponse()

    fake_settings = SimpleNamespace(
        ai_enabled=True,
        llm_model="gemini-primary",
        llm_fallback_model="gemini-fallback",
        llm_base_url="https://provider.invalid/v1beta/openai/",
        llm_api_key="test-only-key",
        llm_timeout_seconds=3.0,
        llm_configured=True,
        ai_max_output_tokens=640,
    )
    monkeypatch.setattr("app.services.ai.llm_gateway.get_settings", lambda: fake_settings)
    monkeypatch.setattr("app.services.ai.llm_gateway.request.urlopen", fake_urlopen)

    result = LLMGateway().generate(kind="query", prompt="生成走访提纲")

    assert result.content == "已生成走访提纲"
    assert captured["payload"]["max_tokens"] == 640


def test_ai_chat_rate_limit_rejects_requests_over_the_process_window(tmp_path) -> None:
    env = {
        **os.environ,
        "DATABASE_URL": f"sqlite:///{tmp_path / 'rate-limit.db'}",
        "AI_RATE_LIMIT_REQUESTS": "2",
        "AI_RATE_LIMIT_WINDOW_SECONDS": "60",
        "PYTHONPATH": "backend",
    }
    script = "\n".join(
        [
            "from fastapi.testclient import TestClient",
            "from app.main import app",
            "client = TestClient(app)",
            "responses = [client.post('/api/ai/chat', json={'message': '走访提纲'}) for _ in range(3)]",
            "print(' '.join(str(response.status_code) for response in responses))",
            "print(responses[-1].headers.get('retry-after', 'missing'))",
        ]
    )

    completed = subprocess.run(
        [sys.executable, "-c", script],
        cwd=os.getcwd(),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert completed.returncode == 0, completed.stderr
    assert completed.stdout.splitlines()[0] == "200 200 429"
    assert int(completed.stdout.splitlines()[1]) >= 1


def test_process_rate_limiter_supports_an_injected_clock_and_reset() -> None:
    now = [100.0]
    limiter = ProcessRateLimiter(
        limit=1,
        window_seconds=10,
        clock=lambda: now[0],
    )

    assert limiter.check("client").allowed is True
    denied = limiter.check("client")
    assert denied.allowed is False
    assert denied.retry_after_seconds == 10

    now[0] = 111.0
    assert limiter.check("client").allowed is True
    limiter.reset()
    assert limiter.check("client").allowed is True


def test_ai_chat_applies_a_real_person_context_without_forwarding_direct_pii(monkeypatch) -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Grid(id="grid-1", name="海湾网格", managerName="网格负责人"))
        session.add(
            Person(
                id="person-1",
                gridId="grid-1",
                name="王敏感",
                idCard="310000195001011234",
                gender="女",
                age=76,
                phone="13912345678",
                address="海港路 99 号 3 栋 201",
                type="重点人员",
                tags=["独居老人", "高血压"],
                risk="High",
                updatedAt="2026-07-10",
                careLabels=["定期服药"],
                biography="不得发送给模型的个人经历",
            )
        )
        session.add(
            VisitRecord(
                id="visit-1",
                targetId="person-1",
                targetType="person",
                gridId="grid-1",
                visitorName="李网格",
                date="2026-07-09",
                content="敏感走访原文，联系电话 13912345678",
                images=[],
                tags=["用药回访"],
            )
        )
        session.commit()

    def override_session():
        with Session(engine) as session:
            yield session

    captured: dict[str, object] = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args) -> None:
            return None

        def read(self) -> bytes:
            return json.dumps(
                {"choices": [{"message": {"content": "请核验用药与居家安全。"}}]}
            ).encode("utf-8")

    def fake_urlopen(http_request, timeout):
        captured["payload"] = json.loads(http_request.data.decode("utf-8"))
        return FakeResponse()

    fake_settings = SimpleNamespace(
        ai_enabled=True,
        llm_model="gemini-primary",
        llm_fallback_model="gemini-fallback",
        llm_base_url="https://provider.invalid/v1beta/openai/",
        llm_api_key="test-only-key",
        llm_timeout_seconds=3.0,
        llm_configured=True,
        ai_max_output_tokens=640,
    )
    monkeypatch.setattr("app.services.ai.llm_gateway.get_settings", lambda: fake_settings)
    monkeypatch.setattr("app.services.ai.llm_gateway.request.urlopen", fake_urlopen)
    app.dependency_overrides[get_session] = override_session

    try:
        response = TestClient(app).post(
            "/api/ai/chat",
            json={
                "kind": "query",
                "agent_type": "assistant",
                "message": "生成本次走访提纲",
                "context_id": "person-1",
            },
        )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "live"
    assert body["provider"] == "gemini"
    assert body["model"] == "gemini-primary"
    assert body["context_applied"] is True

    payload = captured["payload"]
    provider_prompt = payload["messages"][1]["content"]
    assert '"age": 76' in provider_prompt
    assert "独居老人" in provider_prompt
    assert "用药回访" in provider_prompt
    for direct_pii in (
        "王敏感",
        "310000195001011234",
        "13912345678",
        "海港路 99 号",
        "不得发送给模型的个人经历",
        "敏感走访原文",
    ):
        assert direct_pii not in provider_prompt


def test_ai_chat_rejects_an_unknown_person_context_before_calling_the_provider(monkeypatch) -> None:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def override_session():
        with Session(engine) as session:
            yield session

    provider_called = False

    def fail_if_called(*_args, **_kwargs):
        nonlocal provider_called
        provider_called = True
        raise AssertionError("provider must not run for an unknown context")

    fake_settings = SimpleNamespace(
        ai_enabled=True,
        llm_model="gemini-primary",
        llm_fallback_model="gemini-fallback",
        llm_base_url="https://provider.invalid/v1beta/openai/",
        llm_api_key="test-only-key",
        llm_timeout_seconds=3.0,
        llm_configured=True,
        ai_max_output_tokens=640,
    )
    monkeypatch.setattr("app.services.ai.llm_gateway.get_settings", lambda: fake_settings)
    monkeypatch.setattr("app.services.ai.llm_gateway.request.urlopen", fail_if_called)
    app.dependency_overrides[get_session] = override_session

    try:
        response = TestClient(app).post(
            "/api/ai/chat",
            json={"message": "生成走访提纲", "context_id": "missing-person"},
        )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert response.status_code == 404
    assert response.json()["detail"] == "Person context was not found."
    assert provider_called is False


def test_ai_chat_sanitizes_provider_quota_errors_for_response_and_logs(
    monkeypatch,
    caplog,
) -> None:
    raw_upstream_detail = (
        'RESOURCE_EXHAUSTED: monthly spending cap; '
        'billing_url=https://billing.invalid/project/private-id'
    )
    provider_calls = 0

    def quota_exhausted(http_request, timeout):
        nonlocal provider_calls
        provider_calls += 1
        raise error.HTTPError(
            http_request.full_url,
            429,
            "Too Many Requests",
            hdrs=None,
            fp=BytesIO(raw_upstream_detail.encode("utf-8")),
        )

    fake_settings = SimpleNamespace(
        ai_enabled=True,
        llm_model="gemini-primary",
        llm_fallback_model="gemini-fallback",
        llm_base_url="https://provider.invalid/v1beta/openai/",
        llm_api_key="test-only-key",
        llm_timeout_seconds=3.0,
        llm_configured=True,
        ai_max_output_tokens=640,
    )
    monkeypatch.setattr("app.services.ai.llm_gateway.get_settings", lambda: fake_settings)
    monkeypatch.setattr("app.services.ai.llm_gateway.request.urlopen", quota_exhausted)

    with caplog.at_level("WARNING", logger="homedata.ai"):
        response = TestClient(app).post(
            "/api/ai/chat",
            json={"message": "生成走访提纲"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "degraded"
    assert body["error_code"] == "AI_PROVIDER_QUOTA_EXCEEDED"
    assert body["error"] == "Gemini quota is currently unavailable; a safe fallback is shown."
    serialized_response = response.text
    assert raw_upstream_detail not in serialized_response
    assert "billing.invalid" not in serialized_response
    assert raw_upstream_detail not in caplog.text
    assert "billing.invalid" not in caplog.text
    assert provider_calls == 1
