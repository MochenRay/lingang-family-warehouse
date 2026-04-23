#!/usr/bin/env bash

set -euo pipefail

SOURCE_OWNER="${SOURCE_OWNER:-MochenRay}"
SOURCE_REPO="${SOURCE_REPO:-lingang-family-warehouse}"
PROJECTION_OWNER="${PROJECTION_OWNER:-MochenRay}"
PROJECTION_REPO="${PROJECTION_REPO:-homedata-web}"
SOURCE_REF="${SOURCE_REF:-main}"
PROJECTION_REF="${PROJECTION_REF:-main}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI is required." >&2
  exit 2
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh CLI is not authenticated." >&2
  exit 2
fi

REMOTE_SOURCE_SHA="$(gh api "repos/${SOURCE_OWNER}/${SOURCE_REPO}/commits/${SOURCE_REF}" --jq '.sha')"
LOCAL_SOURCE_SHA="$(git -C "${SOURCE_ROOT}" rev-parse HEAD)"

if [[ "${SOURCE_REF}" == "main" && "${LOCAL_SOURCE_SHA}" != "${REMOTE_SOURCE_SHA}" ]]; then
  echo "WARNING: local source HEAD ${LOCAL_SOURCE_SHA} differs from remote ${SOURCE_REF} ${REMOTE_SOURCE_SHA}." >&2
fi

PROJECTION_SOURCE_SHA="$(gh api "repos/${PROJECTION_OWNER}/${PROJECTION_REPO}/contents/SYNC_SOURCE.json?ref=${PROJECTION_REF}" --jq '.content' \
  | python3 -c 'import base64, json, sys; print(json.loads(base64.b64decode(sys.stdin.read()).decode()).get("source_commit_sha", ""))')"

if [[ "${REMOTE_SOURCE_SHA}" != "${PROJECTION_SOURCE_SHA}" ]]; then
  echo "STALE: ${PROJECTION_OWNER}/${PROJECTION_REPO}@${PROJECTION_REF} points at ${PROJECTION_SOURCE_SHA}, ${SOURCE_OWNER}/${SOURCE_REPO}@${SOURCE_REF} is ${REMOTE_SOURCE_SHA}" >&2
  exit 1
fi

echo "OK: ${PROJECTION_OWNER}/${PROJECTION_REPO}@${PROJECTION_REF} is synced to ${REMOTE_SOURCE_SHA}"
