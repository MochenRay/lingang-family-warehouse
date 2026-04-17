# Phase 3 Verification

> 验证日期：2026-04-17
> 验证分支：`task/t36-phase3-verification`
> 验证基线：`edd40b9`

## 结论

`Phase 3` 已完成，项目可以进入 `Phase 4`。

当前结论的边界是：

- 第二圈页面已经挂到第一圈验证过的真对象和真聚合骨架上。
- 第二圈目标页中的显式 `db` 直连、散落 `localStorage` 真相、独立 `mock` 标签目录、静态绩效 seed 和本地公告真相已清零。
- `RuleConfig` 已形成“轻量配置 -> 任务投影/摘要响应”的真实链路，但仍不是通用规则引擎。
- `Notice / Knowledge / Search / Mobile Housing` 已形成真实读链或最小读写链，数据库重置后仍有默认演示数据。
- 仍存在受控演示态和浏览器自动化受限，见本文末尾“已知限制”。

## 本轮覆盖范围

本轮按第二圈页面与支撑链路做集成验证：

- 标签管理 / 标签画像 / 人口特征分析
- 房屋网格画像 / 移动辖区概况
- 待办规则
- 行为督导 / 移动统计
- 公告管理 / 发布通知 / 移动通知
- 知识沉淀 / 移动搜索 / 移动房屋支持页

## 代码级回扫

### 第二圈显式穿帮点清理结果

对第二圈目标页执行静态扫描后，确认以下指标为 `0`：

- `import { db }`
- 页面内 `db.` 直接读写
- `mockTags`
- `initialRules`
- `SEED_GRID_WORKER_SCORES`
- `published_notices`
- `notice_drafts`
- 目标页中的散落 `localStorage`
- 直接暴露“mock / 模拟”语义的文案

本轮保留的唯一“移动端用户/网格上下文” `localStorage` 入口是：

- `src/app/services/repositories/mobileContextRepository.ts`

它只负责集中维护当前网格和移动端用户上下文，不再作为业务真相来源。`MobileGridOverview.tsx`、`MobileStats.tsx`、`taskRepository.ts` 的散落读取已全部收敛到该 repository。

### 第二圈对象与跳转约束

本轮静态抽查确认：

- Web 搜索命中人/房/公告时，统一回到 `population / housing / notice-management`
- 移动搜索命中人/房/通知时，统一回到 `person-detail / house-detail / notice-detail`
- 移动壳保留 `/mobile/tasks`、`/mobile/visit-form/:id`、`/mobile/conflict/:id`、`/mobile/housing` 等关键深链恢复

这一步确认的是第二圈入口不会把用户带回第一圈之外的悬空壳页。

## 实际执行的验证

### 1. 代码一致性

执行结果：

- `git diff --check`：通过
- `npm run typecheck`：通过
- `npm run build -- --outDir /tmp/lingang-t36-dist`：通过

补充说明：

- 前端打包仍有既有的大包体警告，但不阻塞 `Phase 3` 结论。

### 2. 容器状态与本地运行验证

执行结果：

- `docker compose ps`：`api` 运行中，`db` 健康
- `docker compose exec -T api python seed.py`：通过
- 使用 Python 3.12 本地虚拟环境 + `sqlite` 重跑 `backend/seed.py`：通过
- 使用 `uvicorn` 本地启动 `app.main:app`：通过

这一步的重点不是重复声明“Docker 新镜像已重建”，而是确认：

- 第二圈新增的数据表和接口在干净数据库里可正常 seed
- 不依赖旧容器内存状态即可启动 API

### 3. 默认演示数据 Seed 验证

本轮对本地 `sqlite` 数据库执行 seed 后，得到：

```json
{
  "grids": 2,
  "houses": 188,
  "housing_histories": 89,
  "people": 471,
  "visits": 672,
  "conflicts": 16,
  "knowledge_records": 5,
  "notices": 5,
  "task_rules": 3
}
```

补充抽查结果：

- `knowledge_records`、`notices`、`task_rules` 在重置数据库后均不为空
- 英雄案例覆盖仍在：独居老人、群租房、重点关注对象、长期未走访对象、矛盾纠纷对象、低保困难家庭

这一步确认的是第二圈页面不会因为重置数据库而整体空白。

### 4. 第二圈核心 API Smoke

本轮实测过的接口包括：

- `GET /api/health`
- `GET /api/task-rules`
- `GET /api/task-rules/projection`
- `GET /api/stats/performance`
- `GET /api/notices`
- `GET /api/knowledge`
- `GET /api/houses?limit=2`
- `GET /api/people?limit=2`

验证摘要：

```json
{
  "health": {
    "status": "ok",
    "database": "ok"
  },
  "taskRules": [
    "rule_risk_watch",
    "rule_visit_followup",
    "rule_conflict_followup"
  ],
  "projectionSummary": {
    "pending": 20,
    "overdue": 20,
    "completed": 18,
    "completionRate": 47
  },
  "performanceTopWorker": {
    "id": "g2",
    "name": "王海燕",
    "totalScore": 84.8
  },
  "notices": {
    "total": 5,
    "firstId": "notice_005"
  },
  "knowledge": {
    "total": 5,
    "firstId": "knowledge_001"
  },
  "sampleObjects": {
    "houseIds": [
      "h_hero_008",
      "h_hero_006"
    ],
    "personIds": [
      "p_hero_061",
      "p_hero_060"
    ]
  }
}
```

这一步确认的是：

- 第二圈新增实体已经进入统一后端骨架
- 督导、规则、公告、知识这几类页面不再靠独立假源存活

### 5. 第二圈关键口径回扫

本轮重点确认了三条容易穿帮的链路：

1. 规则链：
   `RuleConfig -> /api/task-rules -> /api/task-rules/projection -> MobileTasks / 首页摘要`
2. 督导链：
   `BehaviorSupervision / MobileStats -> /api/stats/performance -> 真实走访 / 待办 / 信息完整度派生`
3. 内容链：
   `NoticeManagement / MobileNotices / KnowledgeAccumulation / MobileSearch / MobileHousing`
   共用真实公告、知识、房屋和人物对象

当前结论是：

- 第二圈已经从“各自演示页”进入“共享骨架上的延展页”
- 页面间口径虽然仍有演示化摘要，但可以回到同一组对象源核对

## 已知限制

以下问题不会阻塞 `Phase 3` 收口，但需要诚实记录：

1. `RuleConfig` 当前是“轻量阈值 / 配置表 + 投影响应”，不是通用规则引擎，也不支持复杂表达式。
2. `KnowledgeAccumulation` 仍是最小知识条目骨架，不是完整 RAG 后台或文档处理流水线。
3. 搜索当前是统一结果聚合与正确跳转，不是全文检索引擎。
4. 浏览器自动化随机点击仍未在当前 Codex 沙箱中完成，原因与 `Phase 2` 一致，Chromium 启动权限受限。
5. 当前 Docker 运行态已通过重跑 `seed.py` 修复知识数据空表问题，`GET /api/knowledge` 当前返回 `total=5`；但本轮仍没有把“最新知识接口已在 Docker 新镜像内重建复验”写成既成事实，新增知识链路的启动验证主证据仍来自本地 Python 3.12 虚拟环境 + `sqlite + uvicorn`。
6. `SmartAgentPages` 仍保留 placeholder 形态，它不阻塞第二圈接骨结论，但属于 `Phase 4/5` 继续收口的对象。

## 进入 Phase 4 的判断

当前可以进入 `Phase 4`，理由是：

- 第二圈页面已经不再依赖各自独立的假源存活。
- 第一圈与第二圈之间的对象、统计和内容源已经形成可追溯关系。
- 重置数据库后，规则、公告、知识等第二圈关键页面仍有默认演示数据。
- 当前剩余问题更多是“全站随机点击防穿帮”和“演示态边界收口”，而不是第二圈骨架未接通。

后续 `Phase 4` 不应回头重做 `Phase 3` 的主要接骨，而应优先处理：

- 全站随机点击防穿帮回扫
- 剩余边缘页的口径统一和死按钮清理
- 二级 AI 入口、知识/规则/内容页里的演示痕迹进一步收敛
