# Phase 9 Projection Guard

> Date: 2026-04-24
> Scope: publish-chain automation guardrail before broader Phase 9 work

## Purpose

`homedata-web` remains a Vercel projection repo. The source of truth remains `lingang-family-warehouse`.

Phase 9 does not claim private-repo branch protection is enabled. Instead, the enforceable guardrail is:

- source marker: `homedata-web/SYNC_SOURCE.json`
- remote stale check: `scripts/check_homedata_web_remote_stale.sh`
- PR sync path: `scripts/sync_homedata_web_pr.sh`
- projection guard probe: `scripts/phase9_projection_guard.sh`
- optional projection workflow once credentials are available

## Guard Command

```bash
bash scripts/phase9_projection_guard.sh
```

The command checks:

- `homedata-web@main` points to the current source `main` SHA
- branch protection API status for `homedata-web@main`
- whether `.github/workflows/projection-stale-check.yml` is installed in `homedata-web`
- whether `SOURCE_REPO_READ_TOKEN` is configured as a projection repo secret
- shell syntax for the projection sync scripts

## Strict Modes

Use these only when the required platform setup is expected to exist:

```bash
REQUIRE_BRANCH_PROTECTION=1 bash scripts/phase9_projection_guard.sh
REQUIRE_PROJECTION_WORKFLOW=1 bash scripts/phase9_projection_guard.sh
REQUIRE_WORKFLOW_SECRET=1 bash scripts/phase9_projection_guard.sh
```

## Current Boundary

If GitHub returns `HTTP 403` for private-repo branch protection, that is a known platform limitation, not a Phase 9 code failure.

If the workflow or `SOURCE_REPO_READ_TOKEN` is missing, scheduled cross-private-repo stale checking is not active. Manual and scriptable remote stale checking still remains active through `scripts/check_homedata_web_remote_stale.sh`.
