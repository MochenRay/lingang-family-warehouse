# Phase 11 T110a 处置记录

> 日期：2026-04-27
> 状态：本地实现完成，待 review / PR

## 本切片范围

- `ChartCard` 默认深色面板。
- `DarkChartTooltip` 与 `DARK_TOOLTIP_CURSOR` 作为后续图表统一基线。
- `Sidebar` 清理浅色硬编码，但不改变菜单结构、图标、分组或移动端入口。

## 不在本切片处理

- `Phase 11a / T111` 的统计分析 6 页改造。
- `DarkPanel / MetricCard / DenseTable / SortableHeader / HorizontalBarList` 共享组件抽取。
- `/mobile` 任意页面。
- 后端 API、DB schema、分页或排序合同。

## 无菜单入口文件处置

- `src/app/components/pages/OverviewDashboard.tsx`
- `src/app/components/DataOverview.tsx`

这两个文件当时未出现在 `Sidebar.tsx` 菜单入口中。本切片只记录 owner 状态，不删除、不改造，避免把 dead code 清理混进样式基线 PR。

> 订正（Phase 14 / T3，2026-07-19）：上述两个文件已复核为零引用死代码，并在 Phase 14 死代码清理中删除。另：`PublishNotice.tsx`、`WarningMap.tsx` 现为活跃路由页面（`Routes.tsx:19,31,69,145` 有 lazy 引用），维持现状不删。

## 本地验证

- `git diff --check`
- `npm run typecheck`
- `npm run build`
- `npm audit --json`
- `Sidebar.tsx` 浅色硬编码扫描：无 `bg-white / border-gray / text-gray / bg-blue-50 / text-blue-600 / border-blue-200 / hover:bg-blue` 命中

## 后续遗留

- 统计分析组中仍有默认 Recharts `<Tooltip />`，按计划留给 `Phase 11a / T111` 逐页收口。
