# Phase 11 T114/T115 收口验证记录

## 当前基线

- 真相仓：`lingang-family-warehouse`
- 分支：`codex/phase11-closeout`
- 基线 commit：`4b86a40`
- 范围：Phase 11 Web 样式统一收口验证、路由入口回归、发布前投影准备。

## T114 路由与入口回归

Playwright 覆盖 29 个侧栏 Web 菜单路径：

- 统计分析 7 页
- 数据管理 4 页
- 标签管理 1 页
- 数仓智能体 4 页
- 网格事务 5 页
- 归因分析 4 页
- 系统配置 4 页

验证项：

- 每个路径可直接进入，并显示对应页面主标题。
- 每个 Web 页面仍只保留侧栏左下 `体验移动端工作台` 入口。
- 核心路径刷新后 pathname 不回退。
- 浏览器前进 / 后退在 `/analysis/demographics` 与 `/housing` 之间正常恢复。
- `/mobile` 可直达，并显示移动端 `家庭数仓 / 治理总览 / 待办清单` 壳层。

结果文件：

- `docs/artifacts/phase11-closeout/t114-route-smoke-results.json`
- `docs/artifacts/phase11-closeout/mobile-direct-390.png`

结论：T114 通过。

## T115 整体验证

命令验证：

- `npm run typecheck`
- `npm run build`
- `npm audit --json`：0 vulnerabilities
- `git diff --check`

静态扫描：

- `src/app/components/pages/**` 中 `bg-white` 命中数：0
- Recharts 默认裸 `<Tooltip />`：0
- 浅灰 Recharts hover cursor：0

Claude 成果审核后补充的扫描边界：

- 原 closeout 的 `bg-white` 扫描范围只覆盖 `src/app/components/pages/**`，不足以证明子层组件无浅色残留。
- `Phase 11` patch 已将扫描范围扩为：
  - `src/app/components/pages/**`
  - `src/app/components/housing/**`
  - `src/app/components/notices/**`
  - `src/app/components/rules/**`
  - `src/app/components/statistics/**`
- 扩展范围内 `bg-white` 命中数：0。
- 扩展范围内浅灰 Recharts hover cursor 命中数：0。
- 扩展范围内仍可出现 shadcn UI 信息提示 `<Tooltip>`，例如 `ChartCard` 和 `PopulationManagement`；这不是 Recharts 默认浅色 tooltip。Recharts 图表 tooltip 已接入 `DarkChartTooltip`。

全局浅色类扫描曾有命中，当前记录例外为：

- `OverviewDashboard.tsx`：计划内无菜单入口文件，不在样式 PR 删除或改造。
- `PublishNotice.tsx`：无侧栏入口，公告发布已由 `NoticeManagement` 内的深色弹窗承接。
- `WarningMap.tsx`：路由存在但无侧栏入口，本阶段菜单范围不含此页。
- `HouseDetailPanel.tsx / FinderColumn.tsx`：Claude 审核发现曾遗漏在 `housing/**` 子层，已在 `codex/phase11-housing-dark-patch` 补齐深色 token，不再作为例外。

浏览器布局：

- 29 个侧栏 Web 菜单路径。
- 1366x768 与 1024x768 两个视口。
- 共 58 次检查。
- 自动检测 `overflow=false`、`vertical=false`。

结果文件：

- `docs/artifacts/phase11-closeout/t115-layout-results.json`
- `docs/artifacts/phase11-closeout/t114-final-route-smoke.png`

结论：T115 本地验证通过，可以进入 `homedata-web` 投影同步和公网 smoke。

## 边界

- 本收口不改业务代码。
- 不改 DB schema、公开 API、权限模型或移动端实现。
- 不调整侧栏菜单结构、分组或图标。
- `homedata-web` 投影同步、公网 Vercel smoke 与 AI-Shared closeout 需在本文件合并后继续执行。
