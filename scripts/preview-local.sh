#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
RUNTIME_DIR="${RUNTIME_DIR:-$ROOT_DIR/.runtime}"
DB_PATH="${PREVIEW_DB_PATH:-$RUNTIME_DIR/lingang-preview.db}"
EXPECTED_LOCAL_DATABASE_URL="sqlite:///$DB_PATH"
LOCAL_DATABASE_URL="${LOCAL_DATABASE_URL:-$EXPECTED_LOCAL_DATABASE_URL}"
PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/backend/.venv/bin/python}"
BACKEND_PID=""
FRONTEND_PID=""

if [[ "$LOCAL_DATABASE_URL" != "$EXPECTED_LOCAL_DATABASE_URL" ]]; then
  echo "拒绝启动：LOCAL_DATABASE_URL 必须与 PREVIEW_DB_PATH 对应的本地 SQLite 一致。" >&2
  echo "如需更换位置，请只设置 PREVIEW_DB_PATH。" >&2
  exit 1
fi

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "未找到本地 Python 环境：$PYTHON_BIN" >&2
  echo "请先运行 npm run setup:local，或通过 PYTHON_BIN 指定解释器。" >&2
  exit 1
fi

if [[ ! -x "$ROOT_DIR/node_modules/.bin/vite" ]]; then
  echo "未找到前端依赖，请先运行 npm run setup:local（或 npm ci）。" >&2
  exit 1
fi

for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "端口 $port 已被占用；请先结束旧进程，或覆盖 BACKEND_PORT/FRONTEND_PORT。" >&2
    exit 1
  fi
done

mkdir -p "$RUNTIME_DIR"

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
    wait "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
    wait "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

# These values are forced here. Even under `railway run`, the preview cannot inherit
# a cloud DATABASE_URL or a readonly public-demo mode.
export DATABASE_URL="$LOCAL_DATABASE_URL"
export APP_ENV="development"
export DEMO_WRITE_MODE="enabled"
export CORS_ORIGINS="http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT"
export PYTHONPATH="$ROOT_DIR/backend"
export VITE_API_URL="http://127.0.0.1:$BACKEND_PORT/api"
export VITE_DATA_MODE="api"

"$PYTHON_BIN" -c "import fastapi, sqlmodel, uvicorn" >/dev/null

if [[ "${RESET_PREVIEW_DB:-0}" == "1" ]]; then
  rm -f "$DB_PATH" "$DB_PATH-shm" "$DB_PATH-wal"
fi

if [[ ! -f "$DB_PATH" || "${RESET_PREVIEW_DB:-0}" == "1" ]]; then
  "$PYTHON_BIN" "$ROOT_DIR/backend/seed.py"
fi

echo "本地预览将使用独立 SQLite：$DB_PATH"
echo "写入模式：enabled（新增/修改/删除均可用）"
if [[ -n "${LLM_API_KEY:-}" ]]; then
  echo "LLM 凭据：已由当前进程注入（值不输出）"
else
  echo "LLM 凭据：当前进程未注入；后端仍可能从未提交的 .env 读取，请以 /api/ai/capabilities 为准"
fi

"$PYTHON_BIN" -m uvicorn app.main:app --app-dir "$ROOT_DIR/backend" --host 127.0.0.1 --port "$BACKEND_PORT" &
BACKEND_PID=$!

backend_ready=0
for _ in $(seq 1 60); do
  if "$PYTHON_BIN" -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:$BACKEND_PORT/api/health', timeout=1).read()" >/dev/null 2>&1; then
    backend_ready=1
    break
  fi
  if ! kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    echo "后端启动失败。" >&2
    exit 1
  fi
  sleep 0.5
done

if [[ "$backend_ready" != "1" ]]; then
  echo "后端健康检查超时。" >&2
  exit 1
fi

"$ROOT_DIR/node_modules/.bin/vite" --host 127.0.0.1 --port "$FRONTEND_PORT" &
FRONTEND_PID=$!

frontend_ready=0
for _ in $(seq 1 60); do
  if "$PYTHON_BIN" -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:$FRONTEND_PORT', timeout=1).read()" >/dev/null 2>&1; then
    frontend_ready=1
    break
  fi
  if ! kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    echo "前端启动失败。" >&2
    exit 1
  fi
  sleep 0.5
done

if [[ "$frontend_ready" != "1" ]]; then
  echo "前端健康检查超时。" >&2
  exit 1
fi

echo "前端：http://127.0.0.1:$FRONTEND_PORT"
echo "API：http://127.0.0.1:$BACKEND_PORT/api"
echo "按 Ctrl+C 可同时关闭前后端；SQLite 数据默认保留。"

if [[ "${OPEN_BROWSER:-0}" == "1" ]] && command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:$FRONTEND_PORT"
fi

while kill -0 "$BACKEND_PID" >/dev/null 2>&1 && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; do
  sleep 1
done

echo "预览进程意外退出，请检查上方日志。" >&2
exit 1
