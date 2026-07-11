# Phase 13 Agent Task Plan

> 日期：2026-07-11
> 来源：`docs/phase13-resume-hardening-plan.md`

## T130 测试与执行基线

- 增加前端 Vitest、后端 pytest 与可复用测试命令。
- 测试依赖与生产依赖分离。
- 先确认旧行为可被失败测试稳定复现。

完成条件：`npm run test` 与 backend pytest 命令可运行，且后续任务能记录 RED -> GREEN。

## T131 数据一致性与 N+1

归属：data agent。

行为测试：

1. 多页 API 读取返回全部 items，并保留 total。
2. 人口、房屋页面不再停在 500。
3. 人房关系历史通过聚合读取完成，不按房屋调用历史接口。

主要文件：

- `src/app/services/api.ts`
- `src/app/services/repositories/personRepository.ts`
- `src/app/services/repositories/houseRepository.ts`
- `src/app/services/repositories/visitRepository.ts`
- `src/app/components/pages/PopulationManagement.tsx`
- `src/app/components/pages/HousingManagement.tsx`
- `src/app/components/pages/RelationshipManagement.tsx`
- `src/**/*.test.ts(x)`

完成条件：单元测试与浏览器计数 smoke 通过；人房关系初开业务 API 请求不超过 10。

## T132 公网写保护与 Gemini 可信主链

归属：security-ai agent。

行为测试：

1. `readonly` 拒绝写操作，`enabled` 允许本地完整写操作，`token` 校验请求头。
2. AI prompt 超限返回 422；超频返回 429；请求包含输出 token 上限。
3. 指定人物 `context_id` 时，走访辅助 prompt 含安全裁剪后的人物上下文。
4. LLM 失败返回显式 degraded，不伪造 live。

主要文件：

- `backend/app/config.py`
- `backend/app/api/*.py`
- `backend/app/services/ai/*`
- `src/app/services/repositories/secondaryAiRepository.ts`
- `src/app/components/mobile/MobileVisitForm.tsx`
- `backend/tests/*`

完成条件：pytest 全绿；本地真实 Gemini smoke 返回 `status=live` 或明确的 provider fallback model。

## T133 可复验预览与证据层

归属：quality-docs agent。

- 增加 CI workflow、Playwright smoke 与本地预览脚本。
- Railway 仅注入 LLM 凭据；本地预览覆盖独立 SQLite 数据库，不写云端数据库。
- README 写清定位、架构、运行、测试、演示边界与 Gemini 验证。
- 更新 Phase 13 verification 模板。

完成条件：新克隆按 README 可启动；预览脚本不打印 secret；核心 smoke 可复跑。

## T134 集成、复审与本地交付

归属：主线程。

- 依序合并三个子分支。
- 运行 typecheck、build、frontend tests、backend tests、Playwright smoke、依赖审计与 secret scan。
- 启动本地前后端，验证读写、主链和真实 Gemini。
- 邀请独立 subagent 复审；修复 P0/P1。
- 不 push，不同步发布仓；把本地 URL 与分支交给用户预览。

