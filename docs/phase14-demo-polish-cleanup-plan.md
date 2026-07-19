# Phase 14 演示穿帮修复与前端残留清理计划

> 日期：2026-07-19
> 状态：已冻结（2026-07-19，经 Codex 评审订正后定稿）
> 基线：`main @ bbe2c0edc62d39bef0ed8a3c30dce35dfb3a49d8`
> 输入材料：2026-07-19 前端样式集中审查（六维并行审查 + 残留盘点 + 历史决策挖掘 + 死代码复核）+ Codex 评审反馈（全部经二次核验属实）

## 目标

在不改变信息架构、业务路由、数据合同与后端行为的前提下：

1. 修复公网演示直接可见的穿帮问题（面试官视角）。
2. 修复 toast 反馈从未渲染的功能 bug。
3. 集中清理 Figma Make / shadcn 模板残留与死代码，降低后续维护噪音。

本阶段是作品集 Demo 的表现力与卫生收口，不追求长期工程完备性。

## 成功标准

1. `index.html` 为 `lang="zh-CN"`、`viewport` 含 `viewport-fit=cover`、有 meta description；本地 build 预览暗色首帧无白闪（FOUC 消除）。
2. iPhone 全面屏下移动端底部操作栏不被 Home 指示条遮挡：`safe-area-bottom` / `scrollbar-hide` 工具类有定义且为叠加式实现（保留原 padding 再叠加 inset），`env(safe-area-inset-*)` 使用次数 > 0。
3. `MobileSmartQuery`、`MobilePolicyInterpretation`、`MobileOfficialWriting` 三页在桌面 375×812 手机框预览内不溢出窗口（三处 `fixed inset-0` 已改）。
4. 任意一处 `toast()` 触发后气泡真实渲染（`<Toaster/>` 已挂载，25 个文件 92 次调用恢复可用），e2e 或手动留证。
5. `ui/tabs` 键盘焦点可见（focus-visible 环补齐）；`navigation-menu` 组件已删除且全库无引用。
6. `src/app` 内项目自有色彩变量零未定义引用（以 grep 清单为证；Radix/Tailwind runtime 变量另列白名单豁免）。
7. `OverviewDashboard.tsx`、`DataOverview.tsx` 及 A 级残留移除后：`npm run typecheck`、`npm run build`、`npm run test` 全绿；记录构建产物体积前后对比。
8. `src/imports/`（34 个 Figma 参考稿）迁移至 `reference/figma-make-imports/` 归档，构建与类型检查不受影响。
9. 每个 PR 附变更前后对照证据（截图或计数），无证据不合并；合并条件为 GitHub CI Frontend / Backend / Local SQLite smoke 全绿。

## 环境前置（门禁先决）

当前 `node_modules` 不完整，门禁执行前必须先做干净安装：

- `npm run typecheck` 现 exit 2（缺 `@playwright/test`、`vitest`）；`npm run test` 现 exit 127（vitest 未安装）。
- `npm ls vite` 显示实装 `6.4.2`，与 `package.json` 要求 `^6.4.3` 不符。
- 执行 `npm ci` 后复核 `npm ls vite` 无 invalid，再进入各 PR 门禁。

## 垂直切片

### T1 演示穿帮修复

- `index.html`：`lang="zh-CN"`、`viewport-fit=cover`、meta description、`<html class="dark">`（或内联脚本）预设暗色，消除 FOUC；`color-scheme: dark` 提前到首帧生效。
- `src/styles/tailwind.css`：定义 `safe-area-bottom` 与 `scrollbar-hide` 工具类。`safe-area-bottom` 必须为叠加式：默认 `padding-bottom: calc(1rem + env(safe-area-inset-bottom))`，并逐调用点核对既有 padding（避免无刘海机型上 padding 归零）；覆盖现有 11 处调用点。
- 补齐 11 个未定义的项目色彩变量（已在 `src/app` 引用但 `theme.css` 未定义，二次核验属实）：`--color-bg-primary`、`--color-bg-secondary`、`--color-bg-tertiary`、`--color-border-primary`、`--color-border-secondary`、`--color-brand-hover`、`--color-neutral-05`、`--color-neutral-07`、`--color-neutral-09`、`--color-text-tertiary`、`--color-text-quaternary`。处置原则：优先在 `theme.css` 补齐为现有 token 的别名映射（映射表随 PR 附证据），不逐调用点改写。
- `MobileSmartQuery.tsx:64`、`MobilePolicyInterpretation.tsx:80`、`MobileOfficialWriting.tsx:80`：`fixed inset-0` 改为与全站一致的 `h-full` 布局模型。顺带复核 `MobilePersonEdit.tsx:364` 的 Modal 级 `fixed inset-0`（底部弹层遮罩，语义不同，评估是否随布局模型一并修正）。
- `ui/tabs.tsx:45`：补齐 `focus-visible` 焦点环。

### T2 toast 挂载修复

- 在 `src/main.tsx` 根部挂载一次 `ui/sonner.tsx` 的 `<Toaster/>`，固定 `theme="dark"`（项目已明确不做双主题，不留二择一）。
- 删除 `next-themes` 依赖（sonner 改用固定暗色后无消费方），同步 `package.json` 与 `package-lock.json`。
- 留证：一处触发路径的截图或 e2e 断言。

### T3 A 级死代码清理

- 删除 `src/app/components/pages/OverviewDashboard.tsx`、`src/app/components/DataOverview.tsx`（零引用、无级联，已复核）。
- 删除 11 个零导入依赖：`@mui/material`、`@mui/icons-material`、`@emotion/react`、`@emotion/styled`、`@popperjs/core`、`react-popper`、`react-dnd`、`react-dnd-html5-backend`、`react-responsive-masonry`、`react-slick`、`motion`；同步删除 `vite.config.ts` 的 vendor-mui 分包配置，同步 `package.json` 与 `package-lock.json`。
- `src/styles/responsive.css` **不整删**：保留 `@media print` 全局打印段（生效中），删除其余 19 个零引用具名类，清理 `index.css` 对应 `@import` 的保留方式随裁剪结果定。
- 删除 `src/styles/fonts.css`（0 字节），清理 `index.css:1` 的 `@import`。
- 删除 `src/app/components/figma/ImageWithFallback.tsx`（figma/ 唯一文件，零引用）。
- 删除 21 个业务零导入的 ui 组件：`accordion`、`alert-dialog`、`aspect-ratio`、`breadcrumb`、`calendar`、`carousel`、`chart`、`collapsible`、`command`、`context-menu`、`form`、`hover-card`、`input-otp`、`menubar`、`navigation-menu`、`pagination`、`popover`、`radio-group`、`resizable`、`toggle`、`toggle-group`。
- `src/imports/` 整目录迁移至 `reference/figma-make-imports/`；因 `tsconfig.json` 只 include `src`，迁出后**删除** `exclude: ["src/imports"]` 一行，不改指向。
- 文档对齐：更新 `docs/phase11-t110a-notes.md:21-22` 的立项记述；订正 Phase 11 例外清单——`PublishNotice.tsx`、`WarningMap.tsx` 已复核为活跃路由页面（`Routes.tsx:19,31,69,145`），不移除，仅更新记述。

### T4 B 级精简

- 删除死组件簇 `sidebar.tsx` + `sheet.tsx` + `skeleton.tsx` + `separator.tsx` + `use-mobile.ts`（仅彼此引用）。
- 随死组件/死 ui 删除牵连依赖（逐项复核后执行，同步 `package.json` 与 `package-lock.json`）：`cmdk`、`embla-carousel-react`、`input-otp`、`react-day-picker`、`react-resizable-panels`，及 13 个 radix 包：`@radix-ui/react-accordion`、`react-alert-dialog`、`react-aspect-ratio`、`react-collapsible`、`react-context-menu`、`react-hover-card`、`react-menubar`、`react-navigation-menu`、`react-popover`、`react-radio-group`、`react-separator`、`react-toggle`、`react-toggle-group`。
- `src/app/config/ui-constants.ts`（162 行）裁剪至仅保留在用的 `SPACING_CLASSES.page`、`TRANSITION_CLASSES.default`。
- `src/styles/animations.css`（340 行）**按三重核验裁剪**：保留全局 transition/hover 规则（`:11` 起）、`prefers-reduced-motion` 无障碍保护（`:275` 起）、`MobileVisitForm` 在用的 visit-recording 两类，以及与 tw-animate-css 类名重名、实际可能生效的 selector（如 `.fade-in`，tsx 中 `animate-in fade-in` 为 tw-animate-css 用法，需确认样式来源后处置）；只删除确证未生效的部分。
- `src/styles/theme.css` 亮色 `:root` token 精简，**必须保留** `--radius`、`--input-background`、`--switch-background`（被 `@theme inline` 引用）。

## 明确不做

- 移动端样式统一（Phase 11 遗留的 4 个 ⏳ 文件：MobileApp / MobileHouseDetail / MobileTasks / PersonCollect），另立阶段。
- 双主题 / 亮色模式产品化；暗色为既定唯一基准。
- `theme.css:219-412` 的 `.dark` 兜底映射块不拆除（仍是移动端与残留浅色类的实际渲染机制）。
- 后端、API、DB schema 任何改动。
- `PublishNotice.tsx`、`WarningMap.tsx` 不删除（已复核为活跃路由）。
- `ATTRIBUTIONS.md` 不删（Unsplash 图片真实在用）。
- 视觉风格创新或重新探索。

## 并行边界与集成顺序

0. 环境前置：干净 `npm ci`，复核 `npm ls vite` 无 invalid。
1. PR-1：T1 + T2（穿帮修复 + toast），同一分支，均为用户可感知修复。
2. PR-2：T3（死代码清理），含 `src/imports/` 归档迁移与文档对齐。
3. PR-3：T4（依赖与样式文件精简），依赖 T3 的死组件删除结论。
4. 每个 PR 独立执行门禁：`typecheck` → `build` → `vitest` → Playwright smoke；合并遵循项目纪律：项目仓 PR/merge → Railway → `homedata-web` 投影 PR/merge → Vercel → 公网 smoke → AI-Shared closeout。

## 风险与回滚

- 删除依赖前以 grep 零导入证据为准；radix 包逐项复核，避免误删被存活 ui 组件牵着的包。
- `animations.css` 裁剪前对每个具名类做「定义 / 使用 / 与 tw-animate-css 重名」三重核验，防止误删实际生效样式。
- `src/imports/` 仅迁移不删除，git 历史与归档双保险。
- 每 PR 粒度独立可 revert；公网只读边界与 Gemini 主链不在本阶段触碰面内。
