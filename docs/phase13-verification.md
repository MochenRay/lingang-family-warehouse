# Phase 13 Verification

> 日期：2026-07-11
>
> 状态：集成复验通过；等待用户本地体验反馈，不代表已发布
>
> 范围：简历主项目可信度加固（数据口径、N+1、演示写保护、Gemini 主链、自动化证据）

本文件是复验清单，不是完成声明。只有在集成分支上实际运行并记录结果后，才能把对应项改为通过。

## 1. 版本与环境

- 集成分支：`codex/phase13-resume-hardening`
- 基线：`main @ bc4f1f4495793e047b7d4f625e1ef672853207ab`
- CI 前端：Node.js 22；本地复验：Node.js 24.12.0
- CI / Docker 后端：Python 3.12；本地复验：Python 3.14.4
- 本地数据库：独立 SQLite，禁止复用 Railway `DATABASE_URL`

最终复验时记录：

```text
verified implementation commit: 05bd98154f8cf58b46732ceb38956547f267df13
node: v24.12.0
python: 3.14.4
browser runner: Playwright 1.61.1 / Chromium
vite: 6.4.3
database path: .runtime/lingang-preview-gemini.db
```

## 2. TDD 证据

### RED（已复现）

在没有本地服务时运行：

```bash
PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test \
  --grep 'reports a healthy' --project=chromium
```

可稳定失败于 `connect ECONNREFUSED 127.0.0.1:8000`。这证明 smoke 依赖真实 API，而非前端 fallback 或伪造响应。

### GREEN（集成分支实测）

```text
frontend Vitest: 8 files / 13 tests passed
backend pytest: 19 passed
Playwright: 4 passed
typecheck: passed
production build: passed with Vite 6.4.3
npm audit: 0 vulnerabilities
setup:local: passed against the committed lockfile (pip install + clean npm ci)
```

### T133 分支预检（已运行，不替代集成复验）

在 `codex/phase13-quality-docs` 上使用独立 SQLite 运行：

```text
npm run typecheck: passed
npm run build: passed
PYTHON_BIN=/tmp/lingang-phase13-venv/bin/python npm run test:e2e: 3 passed
preview ports 8013/5183 after Ctrl+C: both released
preview SQLite after Ctrl+C: retained
LOCAL_DATABASE_URL=postgresql://... ./scripts/preview-local.sh: rejected, exit 1
```

此预检后端为合成 seed（1917 人、788 房），没有使用或修改云端数据库；最终仍须在三个子分支合并后，以正式本地虚拟环境重跑全部门禁。

## 3. 自动化门禁

```bash
npm run typecheck
npm test
npm run build
backend/.venv/bin/python -m pytest backend/tests
npm run test:e2e
git diff --check
```

- [x] TypeScript typecheck 通过
- [x] Vitest 通过
- [x] Vite production build 通过
- [x] pytest 通过
- [x] Playwright API + UI + CRUD smoke 通过
- [ ] GitHub Actions 尚未远端执行；因本轮按要求不 push，本地等价命令均通过
- [x] 无已提交 `.env`、API key、token 或真实居民信息
- [x] `npm audit --audit-level=low` 为 0 vulnerabilities

## 4. 数据一致性与请求预算

- [x] `GET /api/stats/dashboard` 的 `totalPopulation` 与人口台账总量一致
- [x] `GET /api/stats/dashboard` 的 `totalHouses` 与房屋台账总量一致
- [x] 人口、房屋页能跨过旧的 500 条截断
- [x] 人房关系首次打开的业务 API 请求数不超过 10
- [x] 页面不按每套房屋逐条读取历史

记录实测值：

```text
dashboard totalPopulation: 1917
people total: 1917
dashboard totalHouses: 788
houses total: 788
relationship business requests: 7
relationship request shape: people 4 pages + houses 2 pages + history 1 bulk request
```

## 5. 写保护与本地 CRUD

- [x] `enabled` 允许 create / patch / delete
- [x] `readonly` 对写请求返回 403
- [x] `token` 缺少或使用错误 `X-Demo-Write-Token` 时返回 403
- [x] `token` 使用正确令牌时允许写请求
- [x] `npm run preview:local` 强制 SQLite、development、enabled
- [x] `npm run preview:gemini` 亦把 `PREVIEW_DB_PATH` 与 `DATABASE_URL` 锁到同一本地 SQLite
- [x] `Ctrl+C` 后前后端端口均释放
- [x] 重启预览默认保留本地修改，`RESET_PREVIEW_DB=1` 可恢复 seed

最终预览库 CRUD smoke：`POST 201 -> PATCH 200 -> DELETE 204 -> GET 404`，测试记录已清理。

## 6. Gemini 可信主链

不得在证据中记录 `LLM_API_KEY` 或完整环境变量输出。

- [x] prompt 超限返回 422
- [x] 速率超限返回 429
- [x] provider 请求含输出 token 上限
- [x] `context_id=<person id>` 时返回 `context_applied=true`
- [x] `railway run` 虽注入整套 service 变量，脚本只使用 LLM 配置，并在同一命令覆盖本地 SQLite 与开发写模式
- [x] 真实请求返回 `status=live`，并记录 provider/model（不记录 key）
- [x] provider 不可用时返回 `status=degraded`，不伪造 live
- [x] Gemini quota 429 映射为稳定 `AI_PROVIDER_QUOTA_EXCEEDED`，raw upstream 不回显

脱敏证据：

```json
{
  "status": "live",
  "provider": "gemini",
  "model": "gemini-3.5-flash",
  "used_fallback_model": false,
  "context_applied": true,
  "content_nonempty": true,
  "error_code": null
}
```

## 7. 手工浏览

- [x] 驾驶舱显示真实 API 总量，无 fallback 标识
- [ ] 人口台账 UI 的完整新增/编辑/删除流程留给用户手工体验；同一 API 的 CRUD 自动化已通过
- [ ] 房屋台账 UI 修改流程留给用户手工体验；读取与总量自动化已通过
- [x] 人房关系页加载完整且请求预算为 7
- [x] 移动走访入口以人物 `context_id` 请求真实 Gemini 主链
- [x] UI 显示 `Gemini live` 与 `model: gemini-3.5-flash`，内容非空
- [x] LLM 降级时 UI 有明确状态，不展示为真实生成成功
- [x] 自动化浏览未见 uncaught exception、CORS 或 API 500

## 8. 仍然存在的边界

Phase 13 完成后仍不能把本项目描述为：

- 已上线或已接真实居民数据的生产政务系统；
- 具备正式身份认证、组织同步、辖区 RBAC、等保与完整审计；
- 完整数据湖仓、主数据、血缘、质量治理或实时计算平台；
- 所有页面均后端真化、所有“智能体”均由 LLM 自主编排；
- 已接入真实 GIS、12345、山东通或城市大脑。

可信表述应保持为：可本地复验的全栈治理场景 Demo；主数据链真实持久化；一条人物上下文到 Gemini 的路径真实接通；其余 AI 动作为确定性规则型辅助；管理与外部集成页面仍含原型边界。

其余已知非阻断项：AI rate limiter 为单进程内存实现，不是多实例全局配额；人房历史聚合接口当前固定上限 2000（本地 seed 为 382）；pytest 在本机 Python 3.14 下有 FastAPI asyncio deprecation warnings，另有 3 个既有 SQLModel `metadata` 字段 shadow warnings。
