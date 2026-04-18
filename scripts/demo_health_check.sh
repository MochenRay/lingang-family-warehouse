#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

WEB_PORT="${WEB_PORT:-4173}"
API_PORT="${API_PORT:-8000}"
WEB_URL="${WEB_URL:-http://127.0.0.1:${WEB_PORT}}"
API_URL="${API_URL:-http://127.0.0.1:${API_PORT}/api/health}"

echo "Checking web root: ${WEB_URL}"
curl -fsS "${WEB_URL}" >/dev/null

echo "Checking proxied API health: ${WEB_URL}/api/health"
curl -fsS "${WEB_URL}/api/health"
echo

echo "Checking direct API health: ${API_URL}"
curl -fsS "${API_URL}"
echo

docker compose ps
