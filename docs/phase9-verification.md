# Phase 9 Verification

> Date: 2026-04-24
> Scope: selected iteration items from the Phase 9 freeze

## Completed Items

- T91: added `scripts/phase9_projection_guard.sh` and documented the projection guard in `docs/phase9-projection-guard.md`.
- T92: replaced the visible AI agent placeholder endpoints with deterministic demo-data context; smoke evidence is in `docs/phase9-ai-agent-smoke.md`.
- T93: moved demo region data into `src/app/config/regions.ts`; population management, user management, and `RegionFilter` now reuse the same source.
- T94: wired the housing detail `编辑` action to a controlled edit dialog backed by `houseRepository.updateHouse`.
- T95: made API fallback visible through `callWithFallback` data-source tracking and a header badge.
- T96: added mobile secondary URL mapping and browser `popstate` sync for mobile routes; `RegionFilter` now exposes district, street, community, and grid options from real demo config.

## Verification Commands

```bash
npm run typecheck
```

Passed on 2026-04-24.

```bash
npm run build -- --outDir /tmp/lingang-phase9-dist --emptyOutDir
```

Passed on 2026-04-24. Vite reported the existing large bundle warning.

```bash
git diff --check
```

Passed on 2026-04-24.

```bash
bash scripts/phase9_projection_guard.sh
```

Passed with expected warnings when platform setup is absent:

- branch protection was not enforced/readable under the current GitHub API permission.
- projection workflow was not installed.
- `SOURCE_REPO_READ_TOKEN` was not configured.

```bash
/tmp/lingang-phase9-py312-venv/bin/python -m py_compile backend/app/api/ai.py backend/app/services/ai/__init__.py backend/app/services/ai/context_builder.py backend/app/services/ai/data_agent.py backend/app/services/ai/dispatch_agent.py backend/app/services/ai/assistant_agent.py
PYTHONPATH=backend DATABASE_URL=sqlite:////tmp/lingang-phase9-ai-smoke.db /tmp/lingang-phase9-py312-venv/bin/python <inline smoke>
```

Passed for the five T92 agent endpoints. See `docs/phase9-ai-agent-smoke.md`.

## Remaining Boundary

The first “最优先” item, formal permission isolation and full demo write isolation, remains intentionally deferred per user selection. User/role/permission page productization also remains out of scope.
