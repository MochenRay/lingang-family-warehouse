#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-https://homedata.lilei.dev}"
STAMP="$(TZ=Asia/Shanghai date +"%Y-%m-%d %H:%M:%S %Z")"

probe() {
  local label="$1"
  local path="$2"
  local tmp
  tmp="$(mktemp "${TMPDIR:-/tmp}/phase7-probe.XXXXXX")"
  local metrics
  metrics="$(curl -sS -o "${tmp}" -w "http_code=%{http_code} time_total=%{time_total} time_starttransfer=%{time_starttransfer}" "${BASE_URL}${path}")"
  local bytes
  bytes="$(wc -c < "${tmp}" | tr -d ' ')"
  rm -f "${tmp}"
  printf '%s path=%s bytes=%s %s\n' "${label}" "${path}" "${bytes}" "${metrics}"
}

echo "Phase 7 runtime probe"
echo "timestamp=${STAMP}"
echo "base_url=${BASE_URL}"
probe "home" "/"
probe "health" "/api/health"
probe "dashboard" "/api/stats/dashboard"
probe "knowledge" "/api/knowledge?limit=5"
