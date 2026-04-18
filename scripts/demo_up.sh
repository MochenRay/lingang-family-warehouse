#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

VITE_API_URL="${WEB_VITE_API_URL:-/api}" \
VITE_DATA_MODE="${WEB_VITE_DATA_MODE:-api}" \
npm run build

docker compose up -d --build db api web
docker compose ps
