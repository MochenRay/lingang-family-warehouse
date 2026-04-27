# Phase 11b T112a 数据管理验证记录

> 日期：2026-04-27
> 状态：数据管理 4 页改造完成，待 PR review / merge

## 本切片范围

- `src/app/components/pages/PopulationManagement.tsx`
- `src/app/components/pages/HousingManagement.tsx`
- `src/app/components/pages/RelationshipManagement.tsx`
- `src/app/components/pages/BatchImport.tsx`

本切片只收口数据管理组 4 页，保持既有路由、菜单、数据逻辑、筛选逻辑、编辑/删除/详情/导入行为，不改后端 API、DB schema、权限、移动端和投影仓。

## 实施来源

- `codex/t112a-population`: 人口管理。
- `codex/t112a-housing`: 房屋管理。
- `codex/t112a-relationship-batch`: 人房关系、批量导入。

三组 worktree 结果已 cherry-pick 到集成分支 `codex/phase11b-data-management`。

## 本地验证

- `git diff --check`
- `npm run typecheck`
- `npm run build`
- `npm audit --json`
- 静态扫描：4 个页面无 `bg-white / border-gray / text-gray / bg-slate / text-slate / hover:bg-gray / hover:bg-slate / bg-blue-50 / text-blue-600 / border-blue-200`
- 静态扫描：4 个页面无默认 `<Tooltip />`
- 静态扫描：4 个页面无浅灰 Recharts hover cursor

## 截图证据

截图目录：`docs/artifacts/phase11b-t112a-screenshots/`

- `population-1366.png` / `population-1024.png`
- `housing-1366.png` / `housing-1024.png`
- `relationship-1366.png` / `relationship-1024.png`
- `batch-import-1366.png` / `batch-import-1024.png`

所有截图均由 `http://127.0.0.1:5177` 本地 Vite 服务生成，尺寸已校验为 `1366x768` 或 `1024x768`。

## 已知边界

- `FinderColumn` / `HouseDetailPanel` 仍由房屋页通过页面层 class override 收口，未在本切片改共享组件。
- 未纳入网格事务 5 页，留给 `T112b`。
- 未做生产站点 smoke 与投影发布。
