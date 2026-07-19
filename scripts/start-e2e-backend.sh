#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/backend/.venv/bin/python}"
DB_PATH="${PLAYWRIGHT_DB_PATH:-${TMPDIR:-/tmp}/lingang-phase13-playwright-${PPID}.db}"

if [[ ! -x "$PYTHON_BIN" ]] && ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Playwright 后端解释器不可用：$PYTHON_BIN" >&2
  exit 1
fi

# 端口预检：e2e 需要独占端口，被占时快速失败并给出专用端口约定提示
port_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}
if port_in_use "$BACKEND_PORT" || port_in_use "$FRONTEND_PORT"; then
  echo "e2e 端口被占用（BACKEND_PORT=${BACKEND_PORT} / FRONTEND_PORT=${FRONTEND_PORT}）。" >&2
  echo "请先释放端口，或使用专用端口约定：BACKEND_PORT=18000 FRONTEND_PORT=15173 npm run test:e2e" >&2
  exit 1
fi

cleanup() {
  rm -f "$DB_PATH" "$DB_PATH-shm" "$DB_PATH-wal"
}
trap cleanup EXIT INT TERM

mkdir -p "$(dirname "$DB_PATH")"
rm -f "$DB_PATH" "$DB_PATH-shm" "$DB_PATH-wal"
export PYTHONPATH="$ROOT_DIR/backend"
export DATABASE_URL="sqlite:///$DB_PATH"
export APP_ENV="development"
export DEMO_WRITE_MODE="enabled"
export CORS_ORIGINS="http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT"
export AI_ENABLED="false"

"$PYTHON_BIN" "$ROOT_DIR/backend/seed.py"
"$PYTHON_BIN" -m uvicorn app.main:app --app-dir "$ROOT_DIR/backend" --host 127.0.0.1 --port "$BACKEND_PORT"
