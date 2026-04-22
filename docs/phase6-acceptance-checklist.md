# Phase 6 Acceptance Checklist

> 验证日期：2026-04-22
> 对应任务：`T64`
> 验证口径：**公网链接验收**
> 当前正式入口：`https://homedata.lilei.dev`

## 1. 结论

`T64` 当前结论是：**公网链接验收通过，可以进入 `T65`。**

本轮完成了三件事：

- 对公网 URL 重跑 `T44` 的随机点击验收
- 对公网 URL 重跑 `T54` 的自由浏览与定向演示主链验收
- 对公网环境执行一次“写脏 -> Railway CLI 恢复 -> 七项回读”的恢复闭环

本轮没有把“公网入口可用”夸大成“长期稳定运营”。当前更准确的说法是：

> 项目已经完成公网可访问、可自由浏览、可恢复的演示环境验收。

## 2. 验收范围

本轮只验三类事情：

1. 公网入口可达
2. 公网自由浏览与定向演示主链可通过
3. 公网数据写脏后可恢复到标准演示基线

本轮不处理：

- 自定义账号体系
- 长期运营 SLA
- 生产级监控与告警体系

## 3. 当前环境说明

- 正式入口：`https://homedata.lilei.dev`
- 当前后端上游：`https://lingang-family-warehouse-production.up.railway.app`
- `/api/*` 由 `Vercel rewrite` 转发到 Railway
- 当前前端部署仓：`homedata-web`

## 4. 公网健康检查

本轮实际检查：

```bash
curl 'https://homedata.lilei.dev/'
curl 'https://homedata.lilei.dev/api/health'
```

结果：

- 首页返回 `200`
- `/api/health` 返回：

```json
{"status":"ok","backend":"ready","database":"ok","ai":"placeholder","error":null}
```

补充说明：

- `ai=placeholder` 只是 health 口径，真实 AI 可用性已在 `T63` 通过单独的 `/api/ai/*` 探针确认

## 5. 公网随机点击验收（T44 复跑）

本轮使用公网基址重跑：

```bash
T44_BASE_URL='https://homedata.lilei.dev' python scripts/t44_random_click_check.py
```

结果：

- `desktop-home`：通过
- `desktop-sidebar-cross-nav`：通过
- `desktop-search-jump`：通过
- `desktop-search-target`：通过
- `desktop-notice-preview`：通过
- `desktop-analysis-export`：通过
- `mobile-home-browse`：通过
- `console_errors = []`
- `page_errors = []`

证据：

- [results.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/t44-random-click/results.json>)
- [desktop-home.png](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/t44-random-click/desktop-home.png>)
- [desktop-sidebar-cross-nav.png](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/t44-random-click/desktop-sidebar-cross-nav.png>)
- [desktop-search-target.png](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/t44-random-click/desktop-search-target.png>)
- [desktop-notice-preview.png](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/t44-random-click/desktop-notice-preview.png>)
- [desktop-analysis-export.png](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/t44-random-click/desktop-analysis-export.png>)
- [mobile-home-browse.png](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/t44-random-click/mobile-home-browse.png>)

## 6. 公网自由浏览与定向演示主链验收（T54 复跑）

本轮使用公网基址重跑：

```bash
T54_BASE_URL='https://homedata.lilei.dev' python scripts/t54_prelaunch_acceptance.py
```

结果：

- `free-browse-entry`：通过
- `directed-demo-mainline`：通过
- `console_errors = []`
- `page_errors = []`

证据：

- [results.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/t54-public-acceptance/results.json>)
- [free-browse-entry.png](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/t54-public-acceptance/free-browse-entry.png>)
- [directed-demo-mainline.png](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/t54-public-acceptance/directed-demo-mainline.png>)

## 7. 公网恢复链验收

本轮没有发明第二套初始化逻辑，而是复用既有真相源 `backend/seed.py`。

### 7.1 写入临时脏数据

先通过公网接口写入一条临时公告：

```bash
curl -X POST 'https://homedata.lilei.dev/api/notices' ...
```

写入后读回结果：

- 临时公告 `notice_1776872068394` 创建成功
- 写脏时 `GET /api/notices` 读回 `total = 6`

证据：

- [t64-notice-create.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/reset/t64-notice-create.json>)
- [t64-notice-public-read-before-restore.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/reset/t64-notice-public-read-before-restore.json>)
- [t64-notices-before-restore-public.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/reset/t64-notices-before-restore-public.json>)
- [t64-notices-before-restore-railway.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/reset/t64-notices-before-restore-railway.json>)

### 7.2 Railway CLI 恢复

恢复命令：

```bash
railway ssh --project=742fe870-68f0-4753-a8c7-86c87bc91dbf --environment=f2c20f38-d8bd-4d0e-854d-118f4979f219 --service=e6094f88-d376-461c-952b-a486f52f4ee8 "cd /app && python seed.py"
```

结果：

- `Seed completed.`
- `people = 471`
- `houses = 188`
- `visits = 672`
- `conflicts = 16`
- `knowledge_records = 5`
- `notices = 5`
- `task_rules = 3`

证据：

- [t64-seed-restore.log](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/reset/t64-seed-restore.log>)

### 7.3 恢复后公网回读

恢复后再次检查：

- `/api/stats/dashboard`
- `/api/notices`
- `/api/knowledge`
- `/api/task-rules`
- `/api/health`

结果：

- `people = 471`
- `houses = 188`
- `visits = 672`
- `conflicts = 16`
- `knowledge = 5`
- `notices = 5`
- `task_rules = 3`
- `health.status = ok`
- `health.database = ok`

证据：

- [t64-dashboard-after-restore.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/reset/t64-dashboard-after-restore.json>)
- [t64-notices-after-restore.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/reset/t64-notices-after-restore.json>)
- [t64-knowledge-after-restore.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/reset/t64-knowledge-after-restore.json>)
- [t64-task-rules-after-restore.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/reset/t64-task-rules-after-restore.json>)
- [t64-health-after-restore.json](</Users/rayli/Desktop/临港家庭数仓 /docs/artifacts/phase6-acceptance/reset/t64-health-after-restore.json>)

## 8. 当前边界

当前通过的是：

- 公网入口可达
- 常规自由浏览可达
- 主链演示可达
- 云端恢复链可复现

当前仍未宣称：

- 正式生产系统
- 长期稳定运营站点
- 完整监控与告警体系已建成

## 9. 最终判断

一句话总结：

> `Phase 6 / T64` 已通过，当前项目已经具备“公网可访问、可自由浏览、可恢复”的正式演示环境，可以进入 `T65` 做对外口径与物料更新。
