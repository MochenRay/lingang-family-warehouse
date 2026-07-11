#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${RUNTIME_DIR:-$ROOT_DIR/.runtime}"
DB_PATH="${PREVIEW_DB_PATH:-$RUNTIME_DIR/lingang-preview-gemini.db}"
LOCAL_DATABASE_URL="sqlite:///$DB_PATH"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
PREVIEW_LLM_MODEL="${PREVIEW_LLM_MODEL:-gemini-3.5-flash}"

if ! command -v railway >/dev/null 2>&1; then
  echo "未找到 Railway CLI。可先用 npm run preview:local；Gemini 模式需安装并登录 Railway CLI。" >&2
  exit 1
fi

railway_args=(run --no-local)
if [[ -n "${RAILWAY_PROJECT_ID:-}" ]]; then
  railway_args+=(--project "$RAILWAY_PROJECT_ID")
fi
if [[ -n "${RAILWAY_ENVIRONMENT:-}" ]]; then
  railway_args+=(--environment "$RAILWAY_ENVIRONMENT")
fi
if [[ -n "${RAILWAY_SERVICE:-}" ]]; then
  railway_args+=(--service "$RAILWAY_SERVICE")
fi

mkdir -p "$RUNTIME_DIR"

echo "将从 Railway 当前环境注入 LLM 变量；不会读取或打印变量值。"
echo "数据库仍强制覆盖为本地 SQLite：$DB_PATH"
echo "Gemini model：$PREVIEW_LLM_MODEL"

cd "$ROOT_DIR"
railway "${railway_args[@]}" -- env \
  "PREVIEW_DB_PATH=$DB_PATH" \
  "DATABASE_URL=$LOCAL_DATABASE_URL" \
  "LOCAL_DATABASE_URL=$LOCAL_DATABASE_URL" \
  "APP_ENV=development" \
  "DEMO_WRITE_MODE=enabled" \
  "LLM_MODEL=$PREVIEW_LLM_MODEL" \
  "CORS_ORIGINS=http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT" \
  "$ROOT_DIR/scripts/preview-local.sh"
