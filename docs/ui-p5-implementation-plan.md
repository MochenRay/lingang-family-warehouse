# UI 精修 P5 实施计划（V3 定点修订稿，待冻结）

> 状态：V1 五项缺口、V2 一项阻断 + 两项合同修正均已按 Codex 复审定点补齐；用户冻结后执行。
> V2→V3 定点修订：① T3 e2e 改 `page.route()` fixture 注入（conflicts API 无 DELETE，不可测后清理，亦不得为测试加后端端点）；KPI 改精确数值断言。② T1a 页面数改 31 项路由 ID 清单，流程门明确「用户评审冻结后才进 T1b」。③ T2 冻结 @visual 三脚本机制（test:e2e 非视觉 / test:e2e:ci 全量 / test:e2e:visual:update 更新基线，CI 改调 test:e2e:ci）；Playwright 版本以 package-lock.json 为准。
> 依据：P1–P4 与 P6 已发布（main `605959a`）。

## 全局纪律

1. **每任务 = 一条分支 = 一个 PR**，不设合并批次（T4 亦独立小 PR）。
2. **每任务完整发布链**：项目仓 PR/merge → Railway → `homedata-web` 投影 PR/merge（经投影产物门禁）→ Vercel → stale-check → 公网 smoke → AI-Shared closeout（closeout 永远最后执行，「已上线」表述以 merge commit + smoke 为凭）。
3. 每批验收：typecheck + build + Vitest + e2e（专用端口 `BACKEND_PORT=18000 FRONTEND_PORT=15173`）+ 机械统计不回升。
4. 不动后端逻辑、API 契约、数据流；不改变未提及页面的既有行为。
5. 设计类改动（T6 及 T7 实施项）须等 T2 golden diff 回归网就位。

## T1a · a11y 审计（只出报告，不含修复）

**审计范围（冻结）**：
- 页面（桌面路由 ID 清单，共 31 项；T5 执行后为 30 项）：statistics-overview、demographics-analysis、housing-statistics、migration-trends、population-tags、data-comparison、data-reports、heatmap、population、housing、relationship、batch-import、tag-overview、knowledge-accumulation、policy-interpretation、document-writing、smart-query、behavior-supervision、activity-management、conflict-management、notice-management、publish-notice、rule-config、anomaly-analysis、time-series、factor-identification、contribution-ranking、user-management、role-management、permission-management、log-management；另加移动端 4 条 smoke 路径（home/people/person-detail/conflict-form）。
- 视口：桌面 1440×900、1024×768；移动 390×844。
- 流程：键盘 Tab 全路径（每页首屏）、Dialog/ConfirmDialog/Drawer 打开-焦点-关闭循环、表单提交路径。
- 严重度规则：**阻断** = 键盘不可达/focus 不可见/icon-only 按钮无可访问名称/正文 computed 对比度 <4.5:1/触控目标 <44px；**建议** = 4.5–7:1 之间、aria 冗余、reduced-motion 未覆盖的自定义动画。
- 对比度方法：对实际 computed style 取色（含透明度叠加、hover/focus/disabled 态），不是只对 token 对底色做理论计算；P1a status-text 四色必须在 neutral-01/02/03 三种底上分别测。

**产出**：`docs/ui-p5-a11y-audit.md`（问题清单 + 证据 + 分级）。

**流程门**：T1a 报告完成后**须经用户评审并冻结问题清单，才允许进入 T1b**；T1b 范围不得超出冻结清单。

**验收**：报告覆盖上述范围；每条问题附元素定位与 computed 证据。**风险：中**（审计结果不可预知，icon-only 按钮与 36–40px 触控目标已见多处，工作量以冻结清单为准）。

## T1b · a11y 修复

**范围**：严格限于 T1a 冻结清单的阻断项；建议项另列 backlog 不在本任务。
**产出**：修复 + e2e 键盘路径断言 2–3 条（Dialog 焦点进入/Esc 关闭/ConfirmDialog 确认键可达）。
**验收**：阻断清零（按 T1a 方法复测）；四件套 + e2e 全绿。

## T2 · golden diff 视觉回归

**Canonical 环境（冻结）**：
- 基线生成与比对**只在 GitHub Actions `ubuntu-latest` + chromium（Playwright 版本以 package-lock.json 锁定为准；package.json 当前为 `^1.61.1` 非精确锁定，故以 lockfile 为准）**；本机 macOS 仅调试，不作为比对环境（字体/抗锯齿差异）。
- `playwright.config.ts` 增加 `snapshotPathTemplate`（如 `tests/e2e/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}`），基线 PNG 入仓。
- `--update-snapshots` 仅限：基线建立/变更时由当次任务负责人在 CI 产出或以 CI artifact 下载更新，PR 中必须说明变更原因；红色演练（故意改色验证变红）后**必须还原并以最终全绿 + clean diff 收口**。
- **可执行机制（冻结）**：视觉用例统一打 `@visual` 标签；package.json scripts 设为——`test:e2e`＝非视觉（本机默认，`--grep-invert @visual`）、`test:e2e:ci`＝全量（CI 调用，CI workflow 相应改为调 `test:e2e:ci`）、`test:e2e:visual:update`＝CI Ubuntu 更新基线（`--grep @visual --update-snapshots`）。
- 阈值**不预设**：先以 3 页试点（驾驶舱、公告、移动 home）在 CI 环境量测自然抖动，按量测结果定 `maxDiffPixelRatio`（初估 0.002–0.005，以量测为准）；1440×900 下 1% 放过 12,960px 的教训已记录。
- 动态区域 mask：移动「最近同步时间」、所有 `toLocaleString` 时间戳；e2e 种子库每轮重建保证数据稳定。

**验收**：CI 视觉用例全绿；红色演练记录（变红→还原→全绿）写入 PR；本机 `npm run test:e2e` 默认不含 golden 用例，CI `test:e2e:ci` 全量。

**风险**：中。跨环境渲染差异是主要不确定项，试点量测结果可能要求收窄页面集。

## T3 · 客户端分页补齐（矛盾调解 + 公告管理）+ KPI 语义冻结

**语义冻结（评审裁决后明确）**：
- 两页 KPI 卡（总公告数/紧急通知/工作任务/今日发布、纠纷总数/今日新增/累计化解/化解率）语义为**全局统计**，维持基于全量数据计算的现状。
- 公告/矛盾为策划类业务记录，数据量级有界（当前种子 5/17，实际量级数百内），**维持全量拉取**，不做 server-side 分页——「KPI 全局 + 表格 server-side 且不拉全量」在现有 API（无聚合接口）下不可兼得，真 server-side 依赖后端聚合接口，记入 backlog（届时新增 repository paged 方法，保留现有 list contract 不动）。
- 本任务实际产品变更：两页表格**补齐客户端分页**（复用 `TablePagination`，PAGE_SIZE=20），公告/矛盾页当前无分页。

**e2e（复审裁决：fixture 注入）**：两页均用 Playwright `page.route()` 拦截列表接口，注入确定性的 21+ 条列表 fixture——本任务只测客户端分页行为，mock 正合边界，且无任何清理问题；**不得**为测试在 conflicts API 新增 DELETE（违反「不改后端」），也不得中途增造真实数据污染后续 KPI/golden 用例（globalTeardown 只在套件结束才清库）。断言：第二页可见第 21 条；分页条总数正确；改筛选回第一页。

**验收**：e2e 新增 2 条（每页 1 条）全绿；**KPI 数值改造前后精确断言**（改造前记录两页 8 张 KPI 卡数值，改造后逐卡比对相等；golden 矩阵不含矛盾页，截图不能替代数值断言）；四件套绿。

**风险**：低-中。仅两页 + repository 零改动。

## T4 · 日志页标注演示数据（独立小 PR）

`LogManagement.tsx` 页头加「演示数据」标注（说明文字或 Badge），不做分页、不接后端。
**验收**：标注可见；其余行为不变。

## T5 · PublishNotice 整页下线（决策已冻结：不需要独立 URL）

**改动清单（完整）**：
1. 保留 `notices/PublishNoticeDialog.tsx` 为唯一实现。
2. 删除 `pages/PublishNotice.tsx`。
3. 删除 `components/Routes.tsx` 中该页的 **lazy import 与 switch case**（V1 遗漏项）。
4. 删除 `navigation/routes.ts` 的 `publish-notice` 路由定义（含 aliases）。
5. 「生产路由/组件引用零残留」：grep `publish-notice`、`/grid/notices/publish`、`PublishNotice`（排除 PublishNoticeDialog）于 src 生产代码零命中（测试与本计划文档除外）。

**e2e**：断言访问旧 URL `/grid/notices/publish` 被 replace 为 `/`，且驾驶舱标题「综合统计驾驶舱」可见（非仅「不白屏」）。

**风险**：低。属路由废弃，PR 描述显式说明旧 URL 回落行为（用户已接受）。

## T6 · Sidebar 256→240

`Sidebar.tsx` `w-64` → `w-60`（240px）；核查最长菜单项不截断。
**验收**（Codex 指定）：1024×768 与 1440×900 展开态截图、折叠态（w-16）截图，无文字溢出、无布局抖动；T2 golden 基线同步更新。
**风险**：极低。须排在 T2 之后。

## T7 · C 组设计类方案稿（先评审后立项）

本任务**只产出方案稿**，不含实现。每项含：问题陈述、目标用户与阅读效率目标、结构草图、验收标准、工作量估计。

1. **WarningMap 整页重做**：现结构（KPI + 热区列表 + 预警清单平铺）与「地图」名实不符；明确是视觉再设计还是结构重做；先核实有无地理坐标数据支撑，无则不做真地图。
2. **导航重组**：7 组 30 项的分组语义问题（「归因分析（示例）」命名、标签管理孤立项、智能体/网格事务边界）；产出改动前后对照表；边界：不增删页面、不改路由。
3. **人口金字塔 div → Recharts**：目标是交互一致性（DarkChartTooltip/hover/空数据态）；验收含 1024px 不溢出。

**验收**：三份方案稿经用户评审；通过项另立实施 PR（各带 e2e/截图验收），实施须在 T2 之后。

## 顺序与依赖

```
T1a → 用户评审并冻结 audit 清单 → T1b
T2（golden，试点量测后定阈值；@visual 标签 + test:e2e/test:e2e:ci/test:e2e:visual:update 三脚本）
T3 → T4 → T5（互相独立，按序单 PR）
T6 须 T2 之后
T7 方案稿评审 →（冻结后）实施项须 T2 之后
```

建议执行序：T1a → 评审冻结 → T1b → T2 → T3 → T4 → T5 → T6 → T7 方案稿 →（评审后）T7 实施项。

## 非目标

- 不做 WarningMap/导航/金字塔的代码实现（T7 仅方案稿）
- 不做 server-side 分页（依赖后端聚合接口，记 backlog）
- 不改后端、不加 API、不动日志真相源（选项 a/c 记 backlog）
- 不做 PopulationManagement 的 server-side 化（当前客户端分页可用）
- 不引入新依赖（golden diff 用 Playwright 内置 toHaveScreenshot）
- 不合并任务批次：每任务独立 PR，完整发布链走完后才进下一任务

## V1 → V2 修订对照（Codex 五项缺口）

1. **T3 验收不可达 + KPI 语义**：种子公告 5 条/矛盾 17 条无第二页 → e2e 改为 API 增造 21+ 条；KPI 冻结为全局语义并承认全量拉取，放弃「纯前端 server-side」表述；不改共享 `getConflicts/getNotices` 返回型（未来做 server-side 时新增 paged 方法）。
2. **T2 canonical 环境**：冻结为 CI ubuntu-latest + chromium；补 `snapshotPathTemplate`；`--update-snapshots` 权限与红色演练还原收口；阈值改试点量测后定，不预设 1%。
3. **T1 拆 T1a/T1b**：审计范围（页面/视口/流程/严重度规则）冻结；对比度测 computed 全状态；风险由「低」改「中」。
4. **T5 补 Routes.tsx lazy import + switch case**；「零残留」改为「生产路由/组件引用零残留」；e2e 断言旧 URL replace 为 `/` 且驾驶舱标题可见。
5. **流程冲突**：T3+T4 拆为独立 PR；删除 T6/T8 编号误植；每任务挂完整发布链（项目仓 PR → Railway → 投影 PR → Vercel → stale-check → 公网 smoke → AI-Shared closeout）。
