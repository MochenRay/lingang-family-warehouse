# Phase 11a T111 验证记录

> 日期：2026-04-27
> 状态：统计分析组改造完成，待 PR review / merge

## 本切片范围

- `src/app/components/pages/DemographicsAnalysis.tsx`
- `src/app/components/pages/HousingStatistics.tsx`
- `src/app/components/pages/MigrationTrends.tsx`
- `src/app/components/pages/PopulationTags.tsx`
- `src/app/components/pages/DataComparison.tsx`
- `src/app/components/pages/DataReports.tsx`

本切片只收口统计分析组 6 页，保持既有路由、菜单、数据口径和页面层级，不改后端 API、DB schema、权限、移动端和投影仓。

## 实施来源

- `codex/phase11a-demographics-housing`: 人口特征分析、房屋网格画像。
- `codex/phase11a-migration-comparison`: 人口流动趋势、数据对比分析。
- `codex/phase11a-tags-reports`: 标签分析画像、数据报表中心。

三组 worktree 结果已 cherry-pick 到集成分支 `codex/phase11a-statistics`。

## 本地验证

- `git diff --check`
- `npm run typecheck`
- `npm run build`
- `npm audit --json`
- 静态扫描：6 个页面无 `bg-white / bg-slate-50 / hover:bg-slate / border-gray / text-gray / text-muted-foreground`
- 静态扫描：6 个页面无默认 `<Tooltip />`
- 静态扫描：6 个页面无浅灰 Recharts hover cursor

## 截图证据

截图目录：`docs/artifacts/phase11a-screenshots/`

- `demographics-1366.png` / `demographics-1024.png`
- `housing-1366.png` / `housing-1024.png`
- `migration-1366.png` / `migration-1024.png`
- `tags-1366.png` / `tags-1024.png`
- `comparison-1366.png` / `comparison-1024.png`
- `reports-1366.png` / `reports-1024.png`

所有截图均由 `http://127.0.0.1:5175` 本地 Vite 服务生成，尺寸已校验为 `1366x768` 或 `1024x768`。

## 未纳入

- `T110b` 共享组件二轮抽取。
- `T112 / T113` 其他侧栏页面改造。
- 生产站点 smoke 与投影发布。
