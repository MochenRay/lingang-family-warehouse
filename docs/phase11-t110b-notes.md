# Phase 11 T110B 处置记录

> 日期：2026-04-27
> 状态：共享模式二轮抽取完成，待 PR review / merge

## 本切片范围

- 新增 `src/app/components/statistics/HorizontalBarList.tsx`
- 新增 `src/app/components/statistics/SortableHeader.tsx`
- 接入 `MigrationTrends.tsx` 的迁入/迁出活跃区县列表
- 接入 `DataComparison.tsx` 的排序表头
- 接入 `StatisticsOverview.tsx` 的重点标签人员与区县概览排序表头

## 抽取判断

- `HorizontalBarList` 已在首页重点标签人员与人口流动活跃区县中重复出现，抽取后只承载深色横向条列表，不扩大为通用图表容器。
- `SortableHeader` 已在驾驶舱区县概览与数据对比明细中重复出现，抽取后只承载排序表头交互、图标、对齐与无障碍属性。

## 未抽取

- `DarkPanel`
- `MetricCard`
- `DenseTable`

上述模式暂未达到“重复使用两次以上且 API 稳定”的收敛条件，继续留在页面内。

## 本地验证

- `npm run typecheck`
- `npm run build`
- `git diff --check`
- 静态扫描：首页、数据对比、人口流动中无旧 `renderSortableHeader / renderSortIcon`
- 静态扫描：首页、数据对比、人口流动中无默认 `<Tooltip />` 或浅灰 Recharts hover cursor

## 截图证据

截图目录：`docs/artifacts/phase11-t110b-screenshots/`

- `overview-1366.png` / `overview-1024.png`
- `migration-1366.png` / `migration-1024.png`
- `comparison-1366.png` / `comparison-1024.png`

所有截图均由 `http://127.0.0.1:5176` 本地 Vite 服务生成，尺寸已校验为 `1366x768` 或 `1024x768`。
