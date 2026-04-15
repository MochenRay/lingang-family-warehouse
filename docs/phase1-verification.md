# Phase 1 集成验证

> 验证日期：2026-04-15
> 验证分支：`task/t16-phase1-verification`
> 验证基线提交：`cdce74c`
> 目标：证明 `Phase 1` 的“统一数据骨架”已经成立，而不是只有目录和占位文件

## 1. 结论

`Phase 1` 已达到“可以进入 Phase 2”的最低门槛。

已经成立的事实：

- 后端骨架、数据库模型、演示数据集、核心 API、前端 repository 层都已落地
- 容器启动、seed、health、核心实体列表和驾驶舱统计接口都可用
- 前端已经有两处页面改为走 repository，而不是直接读 `db.ts`

仍然未成立的事实：

- 这不是“全站已打通”
- 第一圈页面只有 `综合统计驾驶舱` 和 `移动端人口列表` 完成了 repository 示范接入
- 仍有 `23` 个前端文件直接 `import { db }`
- AI 仍然是 placeholder 能力，不是 Phase 2 之后要做的真实业务 AI

## 2. 实际执行命令

### 2.1 容器启动

```bash
DOCKER_CONFIG=/tmp/codex-docker-config docker compose up -d --build api
```

结果摘要：

- `db` 容器持续健康
- `api` 容器重建并正常启动

### 2.2 演示数据 seed

```bash
DOCKER_CONFIG=/tmp/codex-docker-config docker compose exec api python seed.py
```

结果摘要：

```text
Seed completed.
Counts: {'grids': 2, 'houses': 188, 'housing_histories': 89, 'people': 471, 'visits': 672, 'conflicts': 16}
Hero coverage: {'独居老人': 9, '群租房': 1, '重点关注对象': 1, '长期未走访对象': 1, '矛盾纠纷对象': 16, '低保困难家庭': 2}
```

### 2.3 健康检查

```bash
curl -s http://127.0.0.1:8000/api/health
```

结果摘要：

```json
{"status":"ok","backend":"ready","database":"ok","ai":"placeholder","error":null}
```

### 2.4 接口 smoke test

执行脚本：

```bash
python3 /tmp/lingang_t16_smoke.py
```

脚本校验了 4 个最小接口：

- `/api/health`
- `/api/people?limit=2`
- `/api/houses?limit=2`
- `/api/stats/dashboard?range=month`

结果摘要：

- `health`: `200`，返回 `status=ok`
- `people`: `200`，返回 `items + total`，当前总人数 `471`
- `houses`: `200`，返回 `items + total`，当前总房屋数 `188`
- `dashboard`: `200`，返回驾驶舱核心统计，`totalPopulation=471`、`totalHouses=188`

### 2.5 前端 typecheck

```bash
npm run typecheck
```

结果摘要：

- 通过，无 TypeScript 报错

### 2.6 前端 build

```bash
npm run build -- --outDir /tmp/lingang-t16-dist
```

说明：

- 因当前 worktree 沙箱下不能稳定写本地 `dist/`，这里把产物输出到 `/tmp/lingang-t16-dist`
- 这是验证环境约束，不是项目构建逻辑错误

结果摘要：

```text
✓ built in 2.63s
```

构建仍有既有包体警告：

- `index.js` 产物约 `1.82 MB`
- 后续 `Phase 2+` 仍需继续做切包和页面拆分

## 3. Repository 接入证据

当前至少已有两处页面不再直接 import `db`：

```text
src/app/components/mobile/MobilePeople.tsx:29:import { personRepository } from '../../services/repositories/personRepository';
src/app/components/pages/StatisticsOverview.tsx:11:import { statsRepository } from '../../services/repositories/statsRepository';
```

这证明 `Phase 1` 不只是后端 API 已存在，也不只是前端 repository 目录已创建，而是前端已经开始通过中间层读数据。

## 4. 当前未完成项

以下内容明确还没有完成，不应对外表述成“已打通”：

- 第一圈页面尚未全面切到 repository / API
- 仍有 `23` 个前端文件直接 `import { db }`
- 第一圈中仍直接读 `db` 的关键页面包括：
  - `PopulationManagement.tsx`
  - `HousingManagement.tsx`
  - `ConflictManagement.tsx`
  - `MobilePersonDetail.tsx`
  - `MobileVisitForm.tsx`
  - `MobileGridOverview.tsx`
  - `mobile/conflict/*`
- `SmartAgentPages` 仍不是主链真实 AI 接入页
- AI 后端目前仍是 placeholder，不应表述成已接入真实大模型推理
- 规则引擎、权限、认证、全站防穿帮回扫均不在 `Phase 1` 范围内

## 5. 对 Phase 2 的意义

`Phase 2` 所需的关键前置条件已经满足：

- 已有稳定的后端骨架
- 已有确定性的演示数据入口
- 已有核心实体 API 和驾驶舱统计接口
- 已有前端 repository 层和 API / fallback 双模式
- 已有至少两个真实示范页面，证明接入路径可行

因此可以进入 `Phase 2`，按第一圈页面继续做真实接入。

推荐的 `Phase 2` 优先级：

1. `PopulationManagement`
2. `HousingManagement`
3. `ConflictManagement`
4. `MobilePersonDetail + MobileVisitForm`
5. `MobileConflict*`

## 6. 当前最准确的项目状态

截至本次验证，项目最准确的表述是：

> 已完成 `Phase 1` 统一数据骨架，具备后端、数据库、演示数据、核心 API 和前端 repository 入口；但第一圈页面尚未全量切换，当前仍处于进入 `Phase 2` 的集成前夜，而不是“整站已真实打通”。
