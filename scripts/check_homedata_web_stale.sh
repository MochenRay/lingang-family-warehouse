#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET_ROOT="${1:-/Users/rayli/Desktop/homedata-web}"
SYNC_FILE="${TARGET_ROOT}/SYNC_SOURCE.json"

if [[ ! -d "${TARGET_ROOT}/.git" ]]; then
  echo "ERROR: target is not a git repository: ${TARGET_ROOT}" >&2
  exit 2
fi

if [[ ! -f "${SYNC_FILE}" ]]; then
  echo "ERROR: missing SYNC_SOURCE.json in ${TARGET_ROOT}" >&2
  exit 2
fi

if [[ -n "$(git -C "${SOURCE_ROOT}" status --porcelain)" && "${ALLOW_DIRTY_SOURCE:-0}" != "1" ]]; then
  echo "ERROR: source repo has uncommitted changes; commit or set ALLOW_DIRTY_SOURCE=1 for an advisory check." >&2
  git -C "${SOURCE_ROOT}" status --short >&2
  exit 2
fi

SOURCE_SHA="$(git -C "${SOURCE_ROOT}" rev-parse HEAD)"
PROJECTION_SHA="$(python3 - "${SYNC_FILE}" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    print(json.load(handle).get("source_commit_sha", ""))
PY
)"

if [[ "${SOURCE_SHA}" != "${PROJECTION_SHA}" ]]; then
  echo "STALE: homedata-web points at ${PROJECTION_SHA}, source HEAD is ${SOURCE_SHA}" >&2
  exit 1
fi

if [[ -n "$(git -C "${TARGET_ROOT}" status --porcelain)" ]]; then
  echo "WARNING: target repo has uncommitted changes:" >&2
  git -C "${TARGET_ROOT}" status --short >&2
fi

echo "OK: homedata-web is synced to ${SOURCE_SHA}"
