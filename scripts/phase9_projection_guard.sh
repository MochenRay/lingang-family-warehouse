#!/usr/bin/env bash

set -euo pipefail

SOURCE_OWNER="${SOURCE_OWNER:-MochenRay}"
SOURCE_REPO="${SOURCE_REPO:-lingang-family-warehouse}"
PROJECTION_OWNER="${PROJECTION_OWNER:-MochenRay}"
PROJECTION_REPO="${PROJECTION_REPO:-homedata-web}"
PROJECTION_REF="${PROJECTION_REF:-main}"
REQUIRE_BRANCH_PROTECTION="${REQUIRE_BRANCH_PROTECTION:-0}"
REQUIRE_PROJECTION_WORKFLOW="${REQUIRE_PROJECTION_WORKFLOW:-0}"
REQUIRE_WORKFLOW_SECRET="${REQUIRE_WORKFLOW_SECRET:-0}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_SLUG="${PROJECTION_OWNER}/${PROJECTION_REPO}"

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI is required." >&2
  exit 2
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh CLI is not authenticated." >&2
  exit 2
fi

echo "Phase 9 projection guard"
echo "source=${SOURCE_OWNER}/${SOURCE_REPO}"
echo "projection=${REPO_SLUG}@${PROJECTION_REF}"

"${SCRIPT_DIR}/check_homedata_web_remote_stale.sh"

if gh api "repos/${REPO_SLUG}/branches/${PROJECTION_REF}/protection" >/tmp/phase9-branch-protection.json 2>/tmp/phase9-branch-protection.err; then
  echo "OK: branch protection API is readable for ${REPO_SLUG}@${PROJECTION_REF}"
else
  protection_error="$(tr '\n' ' ' </tmp/phase9-branch-protection.err | sed 's/[[:space:]]\+/ /g')"
  if [[ "${REQUIRE_BRANCH_PROTECTION}" == "1" ]]; then
    echo "ERROR: branch protection is required but not available: ${protection_error}" >&2
    exit 1
  fi
  echo "WARN: branch protection not enforced or not readable: ${protection_error}" >&2
fi

workflow_path=".github/workflows/projection-stale-check.yml"
if gh api "repos/${REPO_SLUG}/contents/${workflow_path}?ref=${PROJECTION_REF}" >/tmp/phase9-workflow.json 2>/tmp/phase9-workflow.err; then
  echo "OK: projection stale workflow exists at ${workflow_path}"
else
  workflow_error="$(tr '\n' ' ' </tmp/phase9-workflow.err | sed 's/[[:space:]]\+/ /g')"
  if [[ "${REQUIRE_PROJECTION_WORKFLOW}" == "1" ]]; then
    echo "ERROR: projection workflow is required but missing: ${workflow_error}" >&2
    exit 1
  fi
  echo "WARN: projection workflow is not installed: ${workflow_error}" >&2
fi

if gh api "repos/${REPO_SLUG}/actions/secrets" --jq '.secrets[].name' >/tmp/phase9-secrets.txt 2>/tmp/phase9-secrets.err; then
  if grep -qx "SOURCE_REPO_READ_TOKEN" /tmp/phase9-secrets.txt; then
    echo "OK: SOURCE_REPO_READ_TOKEN secret is configured"
  else
    if [[ "${REQUIRE_WORKFLOW_SECRET}" == "1" ]]; then
      echo "ERROR: SOURCE_REPO_READ_TOKEN secret is required but missing." >&2
      exit 1
    fi
    echo "WARN: SOURCE_REPO_READ_TOKEN secret is not configured" >&2
  fi
else
  secrets_error="$(tr '\n' ' ' </tmp/phase9-secrets.err | sed 's/[[:space:]]\+/ /g')"
  if [[ "${REQUIRE_WORKFLOW_SECRET}" == "1" ]]; then
    echo "ERROR: cannot read projection secrets: ${secrets_error}" >&2
    exit 1
  fi
  echo "WARN: cannot read projection secrets: ${secrets_error}" >&2
fi

bash -n "${SCRIPT_DIR}/check_homedata_web_remote_stale.sh" "${SCRIPT_DIR}/sync_homedata_web_pr.sh" "${SCRIPT_DIR}/sync_homedata_web.sh"

echo "OK: projection guard completed"
