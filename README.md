# 临港家庭数仓

一个面向基层治理场景的全栈作品集项目：以合成居民、房屋、走访、矛盾、公告和规则数据，演示从对象台账、关系读取到辅助处置的业务链。项目的重点是可追问的工程闭环，不是把界面原型包装成已上线的政务系统。

## 能力边界

| 能力 | 当前实现 | 可以怎么描述 | 不应怎么描述 |
| --- | --- | --- | --- |
| 业务数据主链 | FastAPI + SQLModel，支持 SQLite / PostgreSQL；人口、房屋、走访、矛盾、公告、知识与规则等实体真实持久化 | “实现可持久化的全栈演示主链” | “已接入真实居民数据” |
| Gemini 文本调用 | 配置 `LLM_API_KEY` 后，`POST /api/ai/chat` 真实请求 Gemini-compatible provider；返回 `live / degraded`、provider 与 model 信息 | “接入真实 Gemini 文本生成，并有显式降级” | “所有智能体均由大模型自主编排” |
| 上下文走访辅助 | 走访辅助仅把指定合成人物的非直接标识字段与固定分类信号带入 `/api/ai/chat` | “打通人物上下文到 LLM 的一条可复验链路” | “具备完整 RAG / 多智能体平台” |
| 数据、派单、助手动作 | 标签建议、画像摘要、数据校验、风险扫描、走访提纲是基于当前演示库的确定性规则输出 | “规则型辅助能力” | “五个独立大模型 Agent” |
| 管理与分析页面 | 一部分页面消费真实后端统计；用户、角色、权限、日志、外部 GIS / 批量接入等仍主要用于交互与信息架构展示 | “高保真业务原型与部分真实统计” | “完整权限、审计、数据集成平台” |

所有居民、地址、身份证样式字段均为合成演示数据。项目不是生产政务系统，未实现正式身份认证、组织同步、辖区 RBAC、等保体系、真实数据交换、数据湖仓治理或生产级可观测性。

## 架构

```text
React + Vite
     │ REST / JSON
     ▼
FastAPI ── SQLModel ── SQLite（本地默认）/ PostgreSQL（部署可选）
     │
     ├── 确定性规则型能力
     └── Gemini-compatible LLM Adapter（可选，失败显式降级）
```

业务数据库是主真相层。浏览器 localStorage 仅是显式降级路径，不承诺与后端双向同步。公网演示的写保护由后端 `enabled / readonly / token` 策略执行；前端提示不构成安全控制。

## 本地完整预览

建议环境：Node.js 22、Python 3.12。本轮亦在 Node.js 24 / Python 3.14 复验通过；CI 与 Docker 仍以 22 / 3.12 为基准。

```bash
npm run setup:local
npm run preview:local
```

打开 [http://127.0.0.1:5173](http://127.0.0.1:5173)，API 位于 [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)。该命令会：

- 强制使用仓库内 `.runtime/lingang-preview.db`，不会连接云端数据库；
- 强制 `APP_ENV=development` 与 `DEMO_WRITE_MODE=enabled`，本地新增、修改、删除均可用；
- 首次创建数据库时写入合成 seed，后续重启保留本地修改；
- `Ctrl+C` 同时清理前后端进程，但保留 SQLite 文件。

需要恢复标准演示数据时：

```bash
RESET_PREVIEW_DB=1 npm run preview:local
```

端口可通过 `FRONTEND_PORT`、`BACKEND_PORT` 覆盖；Python 解释器可通过 `PYTHON_BIN` 覆盖。

## 本地真实 Gemini 调用

当前主模型固定为 Google 官方 stable ID [`gemini-3.5-flash`](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash)；可用 `PREVIEW_LLM_MODEL` 临时覆盖本地预览，不改 Railway 云端变量。

### 已有 Railway 凭据

先安装并登录 Railway CLI，并确保当前仓库已链接到有 LLM 变量的服务；也可以设置 `RAILWAY_PROJECT_ID`、`RAILWAY_ENVIRONMENT`、`RAILWAY_SERVICE`。

```bash
npm run preview:gemini
```

`railway run` 会注入所选 service 的整套变量；本脚本只使用其中的 LLM 配置，并在同一命令中强制覆盖：

- `DATABASE_URL=sqlite:///...`
- `APP_ENV=development`
- `DEMO_WRITE_MODE=enabled`
- 仅允许本地端口的 `CORS_ORIGINS`

脚本不会打印任何密钥。它还会再次拒绝非 SQLite 的 `LOCAL_DATABASE_URL`，避免误写 Railway / PostgreSQL 数据库。

### 不使用 Railway

在未提交的 `.env` 中设置 `LLM_API_KEY`、`LLM_MODEL`、`LLM_FALLBACK_MODEL` 与 `LLM_BASE_URL`，再运行 `npm run preview:local`。不配置 LLM 时，CRUD、统计和确定性规则能力仍可使用；模型路径会明确显示未配置或降级，不伪造 live 响应。

真实调用的最小复验：

```bash
PERSON_ID=$(curl -fsS 'http://127.0.0.1:8000/api/people?limit=1' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["items"][0]["id"])')

curl -fsS 'http://127.0.0.1:8000/api/ai/chat' \
  -H 'Content-Type: application/json' \
  -d "{\"kind\":\"query\",\"agent_type\":\"assistant\",\"message\":\"请给出本次入户走访的三个重点问题\",\"context_id\":\"$PERSON_ID\"}"
```

验收时检查 `status`、`provider`、`model`、`used_fallback_model` 与 `context_applied`，不要把 `degraded` 记成真实 Gemini 成功。

## 写保护配置

- `DEMO_WRITE_MODE=enabled`：允许写入，供本地完整预览使用。
- `DEMO_WRITE_MODE=readonly`：后端拒绝写请求。
- `DEMO_WRITE_MODE=token`：写请求必须携带 `X-Demo-Write-Token`，值与 `DEMO_WRITE_TOKEN` 一致。

公网演示应选 `readonly` 或 `token`。这些护栏降低公开 Demo 的误写和 LLM 滥用风险，但不替代正式认证授权系统。

## 测试

```bash
npm run typecheck
npm test
npm run build
backend/.venv/bin/python -m pytest backend/tests
npx playwright install chromium   # 首次运行 E2E 时
npm run test:e2e
```

Playwright 会使用临时 SQLite seed，验证 API 健康、驾驶舱总量及本地 CRUD，并在结束时删除测试库。CI 在 GitHub Actions 中执行 typecheck、build、Vitest、pytest 与 Chromium smoke。

Phase 13 的复验证据与未决边界见 [docs/phase13-verification.md](docs/phase13-verification.md)。

## 目录

- `src/`：React 前端与 repository adapter
- `backend/app/`：FastAPI API、模型、规则能力与 LLM adapter
- `backend/seed.py`：确定性合成演示数据入口
- `tests/e2e/`：本地全栈核心 smoke
- `scripts/`：本地初始化、预览与复验脚本
- `docs/`：阶段验证、架构边界与证据说明
