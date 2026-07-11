import os
import subprocess
import sys

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.config import Settings
from app.security.write_policy import WriteProtectionMiddleware


def _build_app(*, mode: str, token: str = "") -> FastAPI:
    app = FastAPI()
    app.add_middleware(
        WriteProtectionMiddleware,
        mode=mode,
        token=token,
        header_name="X-Demo-Write-Token",
        api_prefix="/api",
    )

    @app.get("/api/people")
    def read_people() -> dict[str, bool]:
        return {"ok": True}

    @app.post("/api/people")
    def create_person() -> dict[str, bool]:
        return {"ok": True}

    @app.put("/api/people/person-1")
    def replace_person() -> dict[str, bool]:
        return {"ok": True}

    @app.patch("/api/people/person-1")
    def update_person() -> dict[str, bool]:
        return {"ok": True}

    @app.delete("/api/people/person-1")
    def delete_person() -> dict[str, bool]:
        return {"ok": True}

    @app.post("/api/ai/chat")
    def chat() -> dict[str, bool]:
        return {"ok": True}

    return app


def test_readonly_blocks_business_mutations_but_keeps_reads_and_ai_available() -> None:
    client = TestClient(_build_app(mode="readonly"))

    assert client.get("/api/people").status_code == 200
    response = client.post("/api/people")
    assert response.status_code == 403
    assert response.json()["detail"] == "Business writes are disabled for this deployment."
    assert client.post("/api/ai/chat").status_code == 200


def test_readonly_uses_the_routed_asgi_path_when_host_header_is_malicious() -> None:
    client = TestClient(_build_app(mode="readonly"))

    response = client.post(
        "/api/people",
        headers={"Host": "example.com/abc?bar="},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Business writes are disabled for this deployment."


def test_enabled_allows_local_business_mutations() -> None:
    client = TestClient(_build_app(mode="enabled"))

    response = client.post("/api/people")

    assert response.status_code == 200
    assert response.json() == {"ok": True}


@pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
def test_readonly_covers_every_business_mutation_method(method: str) -> None:
    client = TestClient(_build_app(mode="readonly"))
    path = "/api/people" if method == "post" else "/api/people/person-1"

    response = getattr(client, method)(path)

    assert response.status_code == 403


def test_token_mode_requires_the_configured_write_token() -> None:
    client = TestClient(_build_app(mode="token", token="local-preview-secret"))

    assert client.post("/api/people").status_code == 403
    assert client.post(
        "/api/people",
        headers={"X-Demo-Write-Token": "wrong"},
    ).status_code == 403
    accepted = client.post(
        "/api/people",
        headers={"X-Demo-Write-Token": "local-preview-secret"},
    )

    assert accepted.status_code == 200


def test_write_policy_configuration_defaults_local_development_to_enabled(monkeypatch) -> None:
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.delenv("DEMO_WRITE_MODE", raising=False)
    monkeypatch.delenv("DEMO_WRITE_TOKEN", raising=False)

    defaults = Settings(_env_file=None)
    token_mode = Settings(
        _env_file=None,
        DEMO_WRITE_MODE="token",
        DEMO_WRITE_TOKEN="configured-secret",
    )

    assert defaults.effective_demo_write_mode == "enabled"
    assert defaults.demo_write_token == ""
    assert token_mode.effective_demo_write_mode == "token"
    assert token_mode.demo_write_token == "configured-secret"


def test_write_policy_configuration_defaults_non_local_environments_to_readonly(
    monkeypatch,
) -> None:
    monkeypatch.delenv("DEMO_WRITE_MODE", raising=False)

    production = Settings(_env_file=None, APP_ENV="production")
    demo = Settings(_env_file=None, APP_ENV="demo")
    explicitly_enabled = Settings(
        _env_file=None,
        APP_ENV="production",
        DEMO_WRITE_MODE="enabled",
    )

    assert production.effective_demo_write_mode == "readonly"
    assert demo.effective_demo_write_mode == "readonly"
    assert explicitly_enabled.effective_demo_write_mode == "enabled"


def test_main_application_enforces_the_configured_write_policy(tmp_path) -> None:
    env = {
        **{key: value for key, value in os.environ.items() if key != "DEMO_WRITE_MODE"},
        "DATABASE_URL": f"sqlite:///{tmp_path / 'write-policy.db'}",
        "APP_ENV": "production",
        "PYTHONPATH": "backend",
    }
    script = "\n".join(
        [
            "from fastapi.testclient import TestClient",
            "from app.main import app",
            "response = TestClient(app).post(",
            "    '/api/people', json={}, headers={'Origin': 'http://localhost:5173'}",
            ")",
            "print(response.status_code)",
            "print(response.headers.get('access-control-allow-origin', 'missing'))",
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
    assert completed.stdout.splitlines() == ["403", "http://localhost:5173"]
