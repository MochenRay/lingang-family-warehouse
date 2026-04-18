# 临港家庭数仓 Phase 5 部署运行手册

> 日期：2026-04-18
> 对应任务：`T51`
> 适用形态：单机 `Docker Compose` 演示环境

## 1. 目标

这份手册只负责一件事：

**让别人能把当前 Demo 环境启动起来、做健康检查、把数据重置回演示基线。**

它不试图覆盖：

- 正式生产运维
- 多环境发布矩阵
- CI/CD
- 权限、监控、日志平台接入

## 2. 当前环境形态

当前 `docker compose` 组成：

- `db`：PostgreSQL 16
- `api`：FastAPI + SQLModel 后端
- `web`：Vite 构建后的静态前端，由 Python 轻量静态服务提供并代理 `/api`

当前对外入口默认是：

- Web 演示入口：`http://127.0.0.1:4173`
- 直连 API 健康检查：`http://127.0.0.1:8000/api/health`

## 3. 前置条件

- 已安装 Docker Desktop 或兼容的 Docker Engine
- 已安装 Node.js 与 npm（用于本机执行前端 build）
- 当前机器允许启动 `docker compose`
- 当前目录位于项目根目录

推荐先确认：

```bash
docker --version
docker compose version
npm --version
```

## 4. 环境变量

默认环境变量样例在：

- `.env.example`

本轮新增和部署最相关的变量：

- `APP_ENV=demo`
- `WEB_PORT=4173`
- `WEB_VITE_API_URL=/api`
- `WEB_VITE_DATA_MODE=api`
- `DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/lingang_family_warehouse`
- `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173`

如果只是本机演示，通常不需要额外改动。

## 5. 首次启动

### 方式 A：直接使用脚本

```bash
bash scripts/demo_up.sh
```

脚本行为：

- 先以 `VITE_API_URL=/api`、`VITE_DATA_MODE=api` 本机构建前端 `dist`
- 再启动 `db / api / web` 三个容器

### 方式 B：手动启动

```bash
docker compose up -d --build db api web
docker compose ps
```

预期结果：

- `db` 为 `healthy`
- `api` 为 `healthy`
- `web` 为 `healthy`

## 6. 健康检查

### 方式 A：直接使用脚本

```bash
bash scripts/demo_health_check.sh
```

### 方式 B：手动执行

```bash
curl -fsS http://127.0.0.1:4173 >/dev/null
curl -fsS http://127.0.0.1:4173/api/health
curl -fsS http://127.0.0.1:8000/api/health
docker compose ps
```

预期结果：

- Web 首页可访问
- 通过 `web` 反向代理访问 `/api/health` 返回 `status=ok`
- 直连 `api` 访问 `/api/health` 返回 `status=ok`

## 7. 数据重置

当前演示数据的正式恢复方式统一围绕：

- `backend/seed.py`

### 方式 A：直接使用脚本

```bash
bash scripts/demo_reset.sh
```

### 方式 B：手动执行

```bash
docker compose exec -T api python seed.py
```

重置效果：

- 清空当前演示数据
- 重新写入英雄案例、背景样本、公告、知识、规则

适用场景：

- 页面被写脏
- 演示前需要回到标准基线
- 需要恢复公告、知识、规则等默认样例数据

## 8. 常用运维动作

### 查看容器状态

```bash
docker compose ps
```

### 查看日志

```bash
docker compose logs -f web
docker compose logs -f api
docker compose logs -f db
```

### 停止环境

```bash
docker compose down
```

### 重启环境

```bash
docker compose down
docker compose up -d --build db api web
```

## 9. 常见故障排查

### 1. `web` 起不来

优先检查：

- `docker compose logs web`
- 前端构建是否因为依赖安装或 Vite build 失败

### 2. Web 能打开，但 `/api` 不通

优先检查：

- `docker compose ps` 里 `api` 是否 `healthy`
- `curl -fsS http://127.0.0.1:8000/api/health`
- `docker compose logs api`

### 3. 页面数据看起来不对

优先动作：

```bash
bash scripts/demo_reset.sh
```

如果仍异常，再看：

```bash
docker compose logs api
docker compose logs db
```

### 4. 端口冲突

优先检查：

- `WEB_PORT`
- 本地是否已有服务占用 `4173` 或 `8000`

如需调整：

- 修改 `.env` 中的 `WEB_PORT`
- 重新执行 `docker compose up -d --build`

## 10. 当前边界

这份 runbook 当前只证明：

- 项目可以在单机 Docker Compose 环境中重复启动
- Web 与 API 可以通过统一入口协同运行
- 演示数据可以被稳定重置
- 本机有 Node.js 与 npm 时，可以重复生成最新前端静态包并放入 `web` 容器

这份 runbook 还不证明：

- 已完成公网域名发布
- 已完成正式监控和告警
- 已完成生产级安全和访问控制
- 已具备长期运营能力

## 11. 当前最短路径

如果只想做一次完整本机演示，最短流程是：

```bash
bash scripts/demo_up.sh
bash scripts/demo_reset.sh
bash scripts/demo_health_check.sh
```

然后打开：

- `http://127.0.0.1:4173`
