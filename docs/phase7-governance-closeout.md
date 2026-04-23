# Phase 7 Governance Closeout

> Date: 2026-04-23
> Scope: close the remaining Phase 7 projection-governance gaps after Phase 7 v2 first slice

## Conclusion

Phase 7 governance closeout passed.

This closeout finishes the remaining Phase 7 operational gaps that were not part of the front-end v2 slice:

- Remote stale detection no longer requires a local `homedata-web` checkout.
- Future projection sync can be opened as a `homedata-web` pull request instead of relying on direct `main` pushes.
- The generated projection repo now includes a scheduled stale-check workflow template.
- The projection README explicitly records the no-direct-edit boundary, PR sync path, stale marker, and private-repo branch-protection limitation.

This closeout still does not include Phase 8 work:

- Housing Finder-style redesign.
- Location wording/data replacement.
- Real URL routing.
- Data/schema changes.

## Added Guardrails

### Remote Stale Check

Added:

```text
scripts/check_homedata_web_remote_stale.sh
```

This script compares:

- `MochenRay/lingang-family-warehouse@main`
- `MochenRay/homedata-web@main` root `SYNC_SOURCE.json`

It uses `gh api`, so it can check the real GitHub remote state without opening the local projection checkout.

Current result:

```text
OK: MochenRay/homedata-web@main is synced to 34a6f6e0ce880f15d51fe4442db5e6da9e000228
```

### PR-Based Projection Sync

Added:

```text
scripts/sync_homedata_web_pr.sh
```

This script:

- verifies source and projection checkouts are clean
- creates a `sync/source-<sha>` branch in `homedata-web`
- runs the existing whitelist sync
- commits projection changes
- pushes the sync branch
- opens a `homedata-web` pull request

The older direct sync script remains available because current GitHub private-repo branch protection is unavailable on this account/plan, but the preferred path is now PR sync.

### Projection Stale Workflow Template

Added template:

```text
scripts/templates/homedata-web/.github/workflows/projection-stale-check.yml
```

`scripts/sync_homedata_web.sh` now copies `.github/` from the projection template into `homedata-web`.

Because both repositories are private, GitHub Actions cannot read the source repo with the projection repo's default `GITHUB_TOKEN`. The workflow therefore expects this optional secret:

```text
SOURCE_REPO_READ_TOKEN
```

If the secret is missing, the workflow emits a warning and exits successfully. This avoids false red deployments while still making the required hardening step visible.

### Branch Protection Limitation

Attempting to read or configure classic branch protection on `MochenRay/homedata-web@main` currently returns:

```text
HTTP 403: Upgrade to GitHub Pro or make this repository public to enable this feature.
```

So Phase 7 cannot honestly claim platform-enforced branch protection for the private projection repo.

Current enforceable guardrails are:

- projection README no-direct-edit contract
- `SYNC_SOURCE.json` source marker
- local and remote stale-check scripts
- PR-based sync script
- optional scheduled stale-check workflow once `SOURCE_REPO_READ_TOKEN` is configured

## Verification

Commands:

```bash
bash -n scripts/check_homedata_web_remote_stale.sh scripts/sync_homedata_web_pr.sh scripts/sync_homedata_web.sh
bash scripts/check_homedata_web_remote_stale.sh
tmpdir=$(mktemp -d /tmp/homedata-web-sync-test.XXXXXX)
bash scripts/sync_homedata_web.sh "$tmpdir"
test -f "$tmpdir/.github/workflows/projection-stale-check.yml"
test -f "$tmpdir/README.md"
test -f "$tmpdir/SYNC_SOURCE.json"
python3 -m json.tool "$tmpdir/SYNC_SOURCE.json" >/dev/null
rm -rf "$tmpdir"
```

Observed result:

```text
OK: MochenRay/homedata-web@main is synced to 34a6f6e0ce880f15d51fe4442db5e6da9e000228
```

## Operational Boundary

Phase 7 is now closed for the current scope.

Remaining follow-up is not a code blocker:

- If Ray wants fully automatic private cross-repo stale checking, add a fine-grained GitHub token with read access to `lingang-family-warehouse` as `SOURCE_REPO_READ_TOKEN` in `homedata-web` repository secrets.
- If GitHub plan/repo visibility changes, revisit branch protection and require PR-based sync at the platform level.
