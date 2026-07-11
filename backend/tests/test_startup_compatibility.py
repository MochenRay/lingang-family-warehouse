import os
import subprocess
import sys


def test_backend_starts_with_a_fresh_sqlmodel_database(tmp_path) -> None:
    env = {
        **os.environ,
        "DATABASE_URL": f"sqlite:///{tmp_path / 'startup.db'}",
        "PYTHONPATH": "backend",
    }

    script = "\n".join(
        [
            "from fastapi.testclient import TestClient",
            "from app.main import app",
            "with TestClient(app) as client:",
            "    print(client.get('/api/health').status_code)",
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
    assert completed.stdout.strip() == "200"
