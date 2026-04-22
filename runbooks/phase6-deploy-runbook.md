# Phase 6 公网部署 Runbook

## 目标拓扑

- 前端：`Vercel` 消费前端发布仓 `homedata-web`
- 后端：`Railway`
- 数据库：`Railway Postgres`
- 域名：`Cloudflare` 管理的 `homedata.lilei.dev`
- 单入口语义：浏览器始终访问同一站点，前端通过 `Vercel rewrite` 把 `/api/*` 转发到 Railway 后端
- 真相层：全栈仓库 `lingang-family-warehouse`
- 投影层：前端发布仓 `homedata-web`

## 当前固定上游

- Railway 后端域名：`https://lingang-family-warehouse-production.up.railway.app`
- Railway 监听端口：`8000`

## 前端发布仓基线

### 仓库角色

- 仓库名：`homedata-web`
- 角色：只给 `Vercel` 部署前端的投影层
- 真相层：`lingang-family-warehouse`

### 初始化方式

在全栈真相层仓库里执行：

```bash
bash scripts/sync_homedata_web.sh /Users/rayli/Desktop/homedata-web
```

### 同步规则

- 只允许从真相层仓库主动推送到发布仓
- 发布仓禁止人工直改页面逻辑
- 发布仓根目录必须保留 `SYNC_SOURCE.json`
- 发布仓 `README.md` 为独立模板，不从真相层根 `README.md` 镜像

### 白名单

- `index.html`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `postcss.config.mjs`
- `vercel.json`
- `.gitignore`
- `.env.example`
- `src/`
- `public/`（如存在）

### 禁运清单

- `backend/`
- `docs/`
- `runbooks/`
- `scripts/`
- `docker-compose.yml`
- `Dockerfile.frontend`
- `.env`
- 任何真实密钥或 token 文件

注意：

- `.env.example` 虽然名字匹配 `.env*`，但它是显式白名单项，允许进入发布仓
- 发布仓 `README.md` 必须保持“不要直接编辑”的独立说明，不参与根 `README.md` 同步

## Railway 服务基线

### Source

- Source Repo：`MochenRay/lingang-family-warehouse`
- Branch：`main`
- Root Directory：`backend`

### Variables

- `APP_ENV=demo`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `PORT=8000`
- `AI_ENABLED=true`
- `LLM_MODEL=gemini-3.1-flash-lite`
- `LLM_FALLBACK_MODEL=gemini-2.5-flash-lite`
- `LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/`
- `LLM_API_KEY=<Gemini key>`
- `LLM_TIMEOUT_SECONDS=25`

当前仓库代码会在启动时自动把 Railway 提供的 `postgresql://...` 转成 `postgresql+psycopg://...`，不需要手工改 secret 值。

AI kill switch 约定：

- 需要一键关闭 AI 时，把 `AI_ENABLED=false`
- 关闭后前端试点页仍可用，但会回到样例安全答复，不再请求真实模型

### Deploy

- Custom Start Command：

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Networking

- Public Domain：`https://lingang-family-warehouse-production.up.railway.app`
- Target Port：`8000`

### 通过标准

- `/` 返回 `{"status":"running"...}`
- `/api/health` 返回 `{"status":"ok","database":"ok"...}`

## Vercel 项目基线

### 项目创建

- 导入仓库：前端发布仓 `homedata-web`
- Framework Preset：`Vite`
- Root Directory：仓库根目录

### Build

- Install Command：默认
- Build Command：`npm run build`
- Output Directory：`dist`

### Environment Variables

- `VITE_API_URL=/api`
- `VITE_DATA_MODE=api`

说明：

- 发布仓里的 `vercel.json` 来自真相层白名单同步
- 即使漏配 `VITE_API_URL`，前端在非 localhost 环境也会默认走同源 `/api`
- 但 `VITE_DATA_MODE=api` 仍建议显式设置，避免公网环境静默退回 fallback 数据源

## Vercel Rewrite

仓库根目录的 `vercel.json` 已固定两条规则：

1. `/api/:path*` -> Railway 后端 `/api/:path*`
2. 其余路径 -> `/index.html`

这两条规则分别负责：

- 保持单入口 `/api` 语义
- 让 Vite SPA 的深链接在刷新时不 404

## Cloudflare 域名接入

### Vercel

- 先在 Vercel 项目里添加域名：`homedata.lilei.dev`
- 按 Vercel 提示拿到 DNS 记录

### Cloudflare

- 在 `lilei.dev` 对应 zone 中添加或更新 `homedata` 记录
- 按 Vercel 提示完成校验

## 部署后验收

### 公网入口

- `https://homedata.lilei.dev`

### 必测

- 首页能打开
- 首屏引导能显示
- `https://homedata.lilei.dev/api/health` 返回健康 JSON
- `PopulationManagement / HousingManagement / ConflictManagement` 可进入
- 移动端入口可进入

## 云端数据恢复

当前唯一真相源仍是 `backend/seed.py`，不再发明第二套初始化逻辑。

### Railway CLI 准备

如果本机还没有 `railway` CLI：

```bash
brew install railway
railway login
```

### Railway 容器内恢复命令

推荐直接使用一条命令恢复，不必先手动进入交互 shell：

```bash
railway ssh --project=742fe870-68f0-4753-a8c7-86c87bc91dbf --environment=f2c20f38-d8bd-4d0e-854d-118f4979f219 --service=e6094f88-d376-461c-952b-a486f52f4ee8 "cd /app && python seed.py"
```

成功时应看到：

- `Seed completed.`
- `people=471`
- `houses=188`
- `visits=672`
- `conflicts=16`
- `knowledge_records=5`
- `notices=5`
- `task_rules=3`

如果需要交互式进入容器，也可以先执行：

```bash
railway ssh --project=742fe870-68f0-4753-a8c7-86c87bc91dbf --environment=f2c20f38-d8bd-4d0e-854d-118f4979f219 --service=e6094f88-d376-461c-952b-a486f52f4ee8
```

然后在容器内执行：

```bash
cd /app
python seed.py
```

### 恢复后公网验收

```bash
curl 'https://homedata.lilei.dev/api/people?limit=1'
curl 'https://homedata.lilei.dev/api/stats/dashboard'
curl 'https://homedata.lilei.dev/api/knowledge?limit=5'
curl 'https://homedata.lilei.dev/api/notices?limit=5'
curl 'https://homedata.lilei.dev/api/task-rules'
```

如果这些接口重新返回标准演示基线，则说明公网恢复已完成。

## 故障排查

### Railway 返回 502

优先检查：

1. Deploy Logs 是否出现启动错误
2. `PORT=8000` 是否存在
3. Custom Start Command 是否仍为：

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

4. `DATABASE_URL` 是否仍为 `${{Postgres.DATABASE_URL}}`

### Vercel 页面能开，但 API 404 / 500

优先检查：

1. 发布仓最近一次同步是否包含最新 `vercel.json`
2. Vercel 环境变量里是否设置了：
   - `VITE_API_URL=/api`
   - `VITE_DATA_MODE=api`
3. Railway 后端域名是否仍可直接访问 `/api/health`
4. 发布仓根目录 `SYNC_SOURCE.json` 里的 SHA 是否落后于真相层主仓
