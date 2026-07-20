#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET_ROOT="${1:-/Users/rayli/Desktop/homedata-web}"
STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/homedata-web-sync.XXXXXX")"
PROJECTION_TEMPLATE_DIR="${SCRIPT_DIR}/templates/homedata-web"
README_TEMPLATE="${PROJECTION_TEMPLATE_DIR}/README.md"

cleanup() {
  rm -rf "${STAGING_DIR}"
}
trap cleanup EXIT

mkdir -p "${TARGET_ROOT}"

copy_path() {
  local rel_path="$1"
  local src_path="${SOURCE_ROOT}/${rel_path}"
  local dst_path="${STAGING_DIR}/${rel_path}"

  if [[ ! -e "${src_path}" ]]; then
    return 0
  fi

  if [[ -d "${src_path}" ]]; then
    mkdir -p "${dst_path}"
    rsync -a --exclude ".DS_Store" "${src_path}/" "${dst_path}/"
    return 0
  fi

  mkdir -p "$(dirname "${dst_path}")"
  rsync -a "${src_path}" "${dst_path}"
}

copy_path "index.html"
copy_path "package.json"
copy_path "package-lock.json"
copy_path "tsconfig.json"
copy_path "vite.config.ts"
copy_path "playwright.config.ts"
copy_path "postcss.config.mjs"
copy_path "vercel.json"
copy_path ".gitignore"
copy_path ".env.example"
copy_path "src"
copy_path "public"

mkdir -p "${STAGING_DIR}"
cp "${README_TEMPLATE}" "${STAGING_DIR}/README.md"
if [[ "${INCLUDE_GITHUB_WORKFLOWS:-0}" == "1" && -d "${PROJECTION_TEMPLATE_DIR}/.github" ]]; then
  mkdir -p "${STAGING_DIR}/.github"
  rsync -a "${PROJECTION_TEMPLATE_DIR}/.github/" "${STAGING_DIR}/.github/"
fi

SOURCE_COMMIT_SHA="$(git -C "${SOURCE_ROOT}" rev-parse HEAD)"
SOURCE_BRANCH="$(git -C "${SOURCE_ROOT}" rev-parse --abbrev-ref HEAD)"
SOURCE_REMOTE="$(git -C "${SOURCE_ROOT}" config --get remote.origin.url || true)"
SOURCE_DIRTY=false
if [[ -n "$(git -C "${SOURCE_ROOT}" status --porcelain)" ]]; then
  SOURCE_DIRTY=true
fi
SYNCED_AT_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

cat > "${STAGING_DIR}/SYNC_SOURCE.json" <<EOF
{
  "target_project": "homedata-web",
  "managed_by": "scripts/sync_homedata_web.sh",
  "source_repo_name": "lingang-family-warehouse",
  "source_repo_path": "${SOURCE_ROOT}",
  "source_remote": "${SOURCE_REMOTE}",
  "source_branch": "${SOURCE_BRANCH}",
  "source_commit_sha": "${SOURCE_COMMIT_SHA}",
  "source_dirty": ${SOURCE_DIRTY},
  "synced_at_utc": "${SYNCED_AT_UTC}",
  "sync_mode": "truth-to-projection-whitelist"
}
EOF

# ==========================================
# 投影产物门禁（P6）：同步前对暂存产物强制执行
# npm ci → typecheck → Vitest → build，任一失败即中止，
# 防止「源仓绿、投影红」带病发布（PR #68→#69 教训）。
# 逃逸口：PROJECTION_SKIP_VERIFY=1（仅限紧急热修，须在 PR 说明）。
# ==========================================
if [[ "${PROJECTION_SKIP_VERIFY:-0}" != "1" ]]; then
  echo "== 投影产物门禁：在暂存目录执行 npm ci → typecheck → vitest → build =="
  (
    cd "${STAGING_DIR}"
    npm ci --no-audit --no-fund
    npm run typecheck
    npm test
    npm run build
  )
  echo "== 投影产物门禁：通过 =="
else
  echo "WARNING: PROJECTION_SKIP_VERIFY=1，跳过投影产物门禁。" >&2
fi

rsync -a --delete --exclude ".git" "${STAGING_DIR}/" "${TARGET_ROOT}/"

echo "synced ${TARGET_ROOT}"
