# Phase 11b T112b 网格事务验证记录

## 范围

- `BehaviorSupervision.tsx`：行为督导中心深色化、绩效与数据质量信息收口。
- `ActivityManagement.tsx`：活动审批与历史活动台账深色化。
- `ConflictManagement.tsx`：矛盾调解台账深色化，窄屏表格改为横向承载，避免中文竖排。
- `NoticeManagement.tsx`：公告管理深色化，窄屏表格改为横向承载，避免中文竖排。
- `RuleConfig.tsx`：待办规则配置深色化，保留轻量阈值配置边界。

## 来源

- `t112b-supervision-activity`：行为督导、活动综合管理。
- `t112b-conflict`：矛盾调解。
- `t112b-notice-rules`：公告管理、待办规则配置。

集成分支：`codex/phase11b-grid-affairs`

## 验证

- `npm run typecheck`
- `npm run build`
- `npm audit --json`：0 vulnerabilities
- `git diff --check`
- 静态扫描：5 个 T112b 页面无浅色残留、默认浅色 Tooltip、浅灰 hover cursor 命中。

静态扫描命令：

```bash
rg -n "bg-white|border-gray|text-gray|bg-slate|text-slate|hover:bg-gray|hover:bg-slate|bg-blue-50|text-blue-600|border-blue-200|bg-green-50|text-green-700|bg-red-50|text-red-700|bg-yellow-50|text-yellow-700|<Tooltip\s*/>|cursor=\{\{[^\n]*(fill|#f5f5f5)" src/app/components/pages/BehaviorSupervision.tsx src/app/components/pages/ActivityManagement.tsx src/app/components/pages/ConflictManagement.tsx src/app/components/pages/NoticeManagement.tsx src/app/components/pages/RuleConfig.tsx
```

## 截图

目录：`docs/artifacts/phase11b-t112b-screenshots/`

- `behavior-1366.png`
- `behavior-1024.png`
- `activity-1366.png`
- `activity-1024.png`
- `conflict-1366.png`
- `conflict-1024.png`
- `notice-1366.png`
- `notice-1024.png`
- `rules-1366.png`
- `rules-1024.png`

## 边界

- 不改 DB schema。
- 不新增公开 API。
- 不改移动端 `/mobile`。
- 不调整侧栏菜单结构、路由结构或权限产品化行为。
- 不同步投影仓、不做公网发布；本阶段只收真相仓页面样式。
- Phase 11c 的标签、智能体、归因、系统配置仍后续处理。
