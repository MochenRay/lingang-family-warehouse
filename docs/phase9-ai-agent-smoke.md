# Phase 9 AI Agent Smoke

> Date: 2026-04-24
> Scope: T92 minimum agent expansion

## Implemented

The following endpoints now return deterministic context-aware demo output instead of naked placeholder responses:

- `POST /api/ai/data-agent/suggest-tags`
- `POST /api/ai/data-agent/profile-summary`
- `POST /api/ai/data-agent/validate`
- `POST /api/ai/dispatch-agent/risk-scan`
- `POST /api/ai/assistant/visit-outline`

The implementation uses current demo database context:

- `build_person_context(...)`
- `build_grid_context(...)`

If no `context_id` is supplied, the service chooses a default high-risk person or the first grid so the demo path remains runnable.

## Verification

Command:

```bash
PYTHONPATH=backend DATABASE_URL=sqlite:////tmp/lingang-phase9-ai-smoke.db /tmp/lingang-phase9-py312-venv/bin/python <inline smoke>
```

Observed output:

```text
data_agent suggest-tags ready 已为冯建国生成 1 条标签建议。
data_agent profile-summary ready 冯建国画像摘要已基于当前演示数据生成。
data_agent validate ready 冯建国数据质量检查完成。
dispatch_agent risk-scan ready 网格风险扫描已基于当前演示数据生成。
assistant visit-outline ready 冯建国走访提纲已基于当前演示数据生成。
```

Also passed:

```bash
/tmp/lingang-phase9-py312-venv/bin/python -m py_compile backend/app/api/ai.py backend/app/services/ai/context_builder.py backend/app/services/ai/data_agent.py backend/app/services/ai/dispatch_agent.py backend/app/services/ai/assistant_agent.py
npm run typecheck
```

## Boundary

This is not a full streaming agent framework. `POST /api/ai/chat` still owns the live LLM trial path. T92 only closes the most visible agent placeholder endpoints with deterministic demo-data context.
