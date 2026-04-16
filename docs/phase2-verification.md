# Phase 2 Verification

> 验证日期：2026-04-16
> 验证分支：`task/t26-phase2-verification`
> 验证基线：`7117888`

## 结论

`Phase 2` 已完成，项目可以进入 `Phase 3`。

当前结论的边界是：

- 第一圈页面已经接入统一的 `repository / API` 主链。
- 第一圈页面中的显式 `db` 直连和 `window.location.href` 穿帮点已清零。
- 桌面端与移动端的核心对象链已经能围绕同一套人、房、走访、矛盾数据工作。
- 仍存在少量受控演示态能力和未开放写入口，见本文末尾“已知限制”。

## 本轮覆盖范围

本轮按第一圈页面与主链做集成验证：

- 综合统计驾驶舱
- 人口管理
- 房屋管理
- 人房关系
- 矛盾调解
- 移动端工作台簇
  - 首页
  - 人口列表
  - 人员详情
  - 走访记录
  - 待办
  - 矛盾调解链路

## 代码级回扫

### 第一圈显式穿帮点清理结果

对第一圈页面执行静态扫描后，确认以下指标为 `0`：

- `import { db }`
- 页面内 `db.` 直接读写
- `window.location.href`

本轮同时清理了两类直接穿帮点：

- `StatisticsOverview.tsx` 的“导出报表”按钮改为真实导出 JSON 快照，不再是死按钮。
- `MobileApp.tsx` 补齐 `/mobile/visit-form/:id` 深链恢复，避免移动端直达路径丢历史栈。

### 文案与演示态收敛

本轮把第一圈页面里过于直接的“模拟”文案降到更克制的表达：

- `MobileVisitForm.tsx` 的录音整理文案从“模拟 AI 分析”改为“生成走访记录草稿”。
- `MobileConflictForm.tsx` 保留附件入口，但明确提示当前版本暂不支持附件上传。

## 实际执行的验证

### 1. 代码一致性

执行结果：

- `git diff --check`：通过
- `npm run typecheck`：通过
- `npm run build -- --outDir /tmp/lingang-t26-dist`：通过

补充说明：

- 前端打包仍有既有的体积警告，当前主包仍偏大，但不阻塞 `Phase 2` 结论。

### 2. 容器与健康检查

执行结果：

- `docker compose ps`：`api` 运行中，`db` 健康
- `GET /api/health`：返回 `status=ok`、`database=ok`、`ai=placeholder`

### 3. 核心 API 对象链 Smoke

通过脚本复验了第一圈的关键对象链，确认桌面端和移动端依赖的核心数据能互相闭合。

验证摘要：

```json
{
  "health": {
    "status": "ok",
    "database": "ok",
    "ai": "placeholder"
  },
  "dashboard": {
    "totalPopulation": 471,
    "totalHouses": 188,
    "activeConflicts": 10,
    "resolvedConflicts": 6
  },
  "hero_chain": {
    "person": "p_hero_001",
    "personHouseId": "h_hero_001",
    "house": "h_hero_001",
    "residentCount": 1,
    "residentIds": [
      "p_hero_001"
    ],
    "visitCount": 2,
    "latestVisitId": "v_hero_002"
  },
  "conflict_chain": {
    "conflictId": "c_bg_005",
    "status": "已化解",
    "contextPeople": [
      "p_bg_085"
    ],
    "hasRelatedHouse": true,
    "recentVisitCount": 4,
    "samePersonQueryCount": 1
  }
}
```

本轮实测过的接口包括：

- `GET /api/health`
- `GET /api/stats/dashboard?range=month`
- `GET /api/people/p_hero_001`
- `GET /api/houses/h_hero_001`
- `GET /api/houses/h_hero_001/residents`
- `GET /api/visits?targetId=p_hero_001&targetType=person`
- `GET /api/conflicts?limit=5`
- `GET /api/conflicts/{id}/context`
- `GET /api/conflicts?personId={id}`

### 4. 前端路由启动 Smoke

在本地前端服务启动后，验证了以下入口都能返回应用壳：

- `/`
- `/mobile/tasks`
- `/mobile/conflict/c_bg_005`

这一步确认的是：

- 第一圈关键路径能正常进入前端应用
- 深链不会因为首屏路由失败直接返回错误页

### 5. 浏览器点击验证的真实边界

本轮尝试使用 Playwright 做第一圈随机点击验证，但在当前 Codex 沙箱环境下，Chromium 启动被系统权限拦截，报错为 `MachPortRendezvousServer Permission denied (1100)`。

因此，本轮没有宣称“真实浏览器自动点击全通过”。当前保留的真实证据是：

- 代码级静态回扫
- 容器与 API smoke
- 前端关键路径启动 smoke

如果需要补强“随机点击”证据，应在允许浏览器启动的环境下复跑 Playwright。

## 已知限制

以下问题不会阻塞 `Phase 2` 收口，但需要诚实记录：

1. `HousingManagement.tsx` 中街道 / 社区 / 网格层级的新增和编辑仍是占位提示，读侧已接真数据，写侧未开放。
2. `RelationshipManagement.tsx` 已完成真实读侧重构，但迁移类写操作仍未开放。
3. `MobileVisitForm.tsx` 的录音整理与待办建议仍是受控脚本逻辑，不是真实 ASR 或真实 LLM 工作流。
4. `MobileConflictForm.tsx` 当前版本仍不支持附件上传，只保留了入口与提示。
5. `MobileConflictDetail.tsx` 的政策依据 / 话术建议仍是基于上下文的确定性模板逻辑，不是知识库或大模型检索生成。
6. `MobilePersonDetail.tsx` 的“信息采集变更”仍未形成完整写回闭环。
7. 浏览器自动化随机点击未能在当前沙箱中完成，后续如要补证需换到允许 Playwright 起浏览器的环境。

## 进入 Phase 3 的判断

当前可以进入 `Phase 3`，理由是：

- 第一圈页面的真数据主链已经贯通。
- 核心对象在桌面端与移动端之间已经能互相印证。
- 直接暴露“原型态”的显式穿帮点已经明显收缩。

后续 `Phase 3` 不应回头重做 `Phase 2` 的主链，而应优先处理第二圈页面接骨、知识沉淀支撑层和剩余演示态能力的收口。
