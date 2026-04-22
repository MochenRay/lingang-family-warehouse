# Phase 6 公网部署 Runbook

## 目标拓扑

- 前端：`Vercel`
- 后端：`Railway`
- 数据库：`Railway Postgres`
- 域名：`Cloudflare` 管理的 `homedata.lilei.dev`
- 单入口语义：浏览器始终访问同一站点，前端通过 `Vercel rewrite` 把 `/api/*` 转发到 Railway 后端

## 当前固定上游

- Railway 后端域名：`https://lingang-family-warehouse-production.up.railway.app`
- Railway 监听端口：`8000`

## Railway 服务基线

### Source

- Source Repo：`MochenRay/lingang-family-warehouse`
- Branch：`main`
- Root Directory：`backend`

### Variables

- `APP_ENV=demo`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `PORT=8000`

当前仓库代码会在启动时自动把 Railway 提供的 `postgresql://...` 转成 `postgresql+psycopg://...`，不需要手工改 secret 值。

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

- 导入仓库：`MochenRay/lingang-family-warehouse`
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

- 仓库里已经补了 `vercel.json`
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
- `PopulationManagement / HousingManagement / ConflictManagement` 可进入
- 移动端入口可进入
- `https://homedata.lilei.dev/api/health` 返回健康 JSON

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

1. `vercel.json` 是否已生效
2. Vercel 环境变量里是否设置了：
   - `VITE_API_URL=/api`
   - `VITE_DATA_MODE=api`
3. Railway 后端域名是否仍可直接访问 `/api/health`
