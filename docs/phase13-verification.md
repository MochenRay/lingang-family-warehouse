# Phase 13 Verification

> 日期：2026-07-11
>
> 状态：待集成分支完成最终复验
>
> 范围：简历主项目可信度加固（数据口径、N+1、演示写保护、Gemini 主链、自动化证据）

本文件是复验清单，不是完成声明。只有在集成分支上实际运行并记录结果后，才能把对应项改为通过。

## 1. 版本与环境

- 集成分支：`codex/phase13-resume-hardening`
- 基线：`main @ bc4f1f4495793e047b7d4f625e1ef672853207ab`
- 前端：Node.js 22
- 后端：Python 3.12 / 3.13
- 本地数据库：独立 SQLite，禁止复用 Railway `DATABASE_URL`

最终复验时记录：

```text
commit: <待填写>
node: <待填写>
python: <待填写>
browser: <待填写>
database path: <仅记录本地路径，不记录 secret>
```

## 2. TDD 证据

### RED（已复现）

在没有本地服务时运行：

```bash
PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test \
  --grep 'reports a healthy' --project=chromium
```

可稳定失败于 `connect ECONNREFUSED 127.0.0.1:8000`。这证明 smoke 依赖真实 API，而非前端 fallback 或伪造响应。

### GREEN（待集成后填写）

```text
frontend Vitest: <待填写>
backend pytest: <待填写>
Playwright: <待填写>
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

- [ ] TypeScript typecheck 通过
- [ ] Vitest 通过
- [ ] Vite production build 通过
- [ ] pytest 通过
- [ ] Playwright API + UI + CRUD smoke 通过
- [ ] GitHub Actions workflow 语法和本地等价命令通过
- [ ] 无已提交 `.env`、API key、token 或真实居民信息

## 4. 数据一致性与请求预算

- [ ] `GET /api/stats/dashboard` 的 `totalPopulation` 与人口台账总量一致
- [ ] `GET /api/stats/dashboard` 的 `totalHouses` 与房屋台账总量一致
- [ ] 人口、房屋页能跨过旧的 500 条截断
- [ ] 人房关系首次打开的业务 API 请求数不超过 10
- [ ] 页面不按每套房屋逐条读取历史

记录实测值：

```text
dashboard totalPopulation: <待填写>
people total: <待填写>
dashboard totalHouses: <待填写>
houses total: <待填写>
relationship business requests: <待填写>
```

## 5. 写保护与本地 CRUD

- [ ] `enabled` 允许 create / patch / delete
- [ ] `readonly` 对写请求返回 403
- [ ] `token` 缺少或使用错误 `X-Demo-Write-Token` 时返回 403
- [ ] `token` 使用正确令牌时允许写请求
- [ ] `npm run preview:local` 强制 SQLite、development、enabled
- [ ] `Ctrl+C` 后前后端端口均释放
- [ ] 重启预览默认保留本地修改，`RESET_PREVIEW_DB=1` 可恢复 seed

## 6. Gemini 可信主链

不得在证据中记录 `LLM_API_KEY` 或完整环境变量输出。

- [ ] prompt 超限返回 422
- [ ] 速率超限返回 429
- [ ] provider 请求含输出 token 上限
- [ ] `context_id=<person id>` 时返回 `context_applied=true`
- [ ] Railway 仅注入 LLM 变量，同一命令覆盖本地 SQLite 与开发写模式
- [ ] 真实请求返回 `status=live`，并记录 provider/model（不记录 key）
- [ ] provider 不可用时返回 `status=degraded`，不伪造 live

脱敏证据：

```json
{
  "status": "<live|degraded>",
  "provider": "<待填写>",
  "model": "<待填写>",
  "used_fallback_model": "<待填写>",
  "context_applied": "<待填写>"
}
```

## 7. 手工浏览

- [ ] 驾驶舱显示真实 API 总量，无 fallback 标识
- [ ] 人口台账可浏览、搜索、创建、修改、删除本地测试对象
- [ ] 房屋台账可浏览与修改
- [ ] 人房关系页加载完整且请求预算达标
- [ ] 移动走访入口可选人物并请求真实 LLM 主链
- [ ] LLM 降级时 UI 有明确状态，不展示为真实生成成功
- [ ] 控制台无 uncaught exception、CORS 或 API 500

## 8. 仍然存在的边界

Phase 13 完成后仍不能把本项目描述为：

- 已上线或已接真实居民数据的生产政务系统；
- 具备正式身份认证、组织同步、辖区 RBAC、等保与完整审计；
- 完整数据湖仓、主数据、血缘、质量治理或实时计算平台；
- 所有页面均后端真化、所有“智能体”均由 LLM 自主编排；
- 已接入真实 GIS、12345、山东通或城市大脑。

可信表述应保持为：可本地复验的全栈治理场景 Demo；主数据链真实持久化；一条人物上下文到 Gemini 的路径真实接通；其余 AI 动作为确定性规则型辅助；管理与外部集成页面仍含原型边界。
