# UI P5-T1a · a11y 审计报告

> 日期：2026-07-20
> 方法：`tests/e2e/a11y-audit.spec.ts` 自动扫描（Playwright，专用端口 18002/15176，真实 e2e 种子库）
> 范围：31 个桌面路由（1440×900）+ 4 条移动端路径（390×844，home/people/person-detail/conflict-form）
> 原始发现 3058 条 → 去重归纳为 **4 类 41 个独立问题模式**

## 已知局限（阅读结论前请注意）

1. 对比度为 resting state 近似计算（computed color + 最近不透明祖先背景合成）；hover/focus/disabled 态未逐一展开，但 hover 态普遍更亮，resting 已是最差情形。
2. focus 可见性按每页前 12 个可聚焦元素抽样。
3. icon 按钮判定基于「无文本且无 aria-label/aria-labelledby/title」，不评估 sr-only 文本（若组件已用 sr-only 则属误报，triage 已抽查排除）。

## 汇总

| 规则 | 原始条数 | 去重后独立问题 | 严重度 |
| --- | ---: | ---: | --- |
| icon-only 按钮无可访问名称 | 2183 | 8 组组件级问题 | 阻断 |
| 正文对比度 <4.5:1 | 301 | 4 个系统性问题 | 阻断 |
| 移动触控目标 <44px | 16 | 4 组 | 阻断 |
| focus 不可见 | 4 | 1 组 | 阻断 |
| 对比度 4.5–7:1（达 AA 未达 AAA） | 554 | 抽样说明，不逐项列 | 建议 |

## 阻断项 A：icon-only 按钮无可访问名称（2183 条 → 8 组）

| # | 位置 | 规模 | 证据 | 修复建议 |
| --- | --- | --- | --- | --- |
| A1 | `RelationshipManagement.tsx:317,370` 行内 Eye 按钮 | ×1917（每行 1 个） | `<Button variant="ghost" size="sm"><Eye /></Button>` 无 aria-label | 加 `aria-label="查看关系详情"` |
| A2 | `PermissionManagement.tsx` 权限矩阵 Checkbox | ×117 | Radix Checkbox（button role）无名称 | 每个 Checkbox 加 `aria-label={角色-权限点}` |
| A3 | `PopulationManagement.tsx:1322-1328` 行内 查看/编辑/删除 | ×63 | 三个 ghost 按钮均无 aria-label | 分别加 `aria-label="查看/编辑/删除"` |
| A4 | `NoticeManagement` 行内 Eye/Trash2 | ×12 | 同上 | 同上 |
| A5 | `UserManagement` 行内操作按钮 | ×10 | 同上 | 同上 |
| A6 | publish-notice/rule-config/housing-statistics/migration/population-tags 等 17 页零星 icon 按钮 | 各 ×2–7 | 页面级零星 | 逐一补 aria-label |
| A7 | **全局 chrome**：Header 通知 Bell 按钮（每页 ×1） | 全站每页 | `Header.tsx` Bell 按钮无 aria-label（HelpCircle 已有） | 加 `aria-label="通知"` |
| A8 | 移动端：mobile-home 扫一扫快捷按钮、mobile-people 行尾按钮 | ×2 | 全局性小控件 | 补 aria-label |

## 阻断项 B：正文对比度 <4.5:1（301 条 → 4 个系统性问题）

| # | 问题 | 实测 | 规模 | 修复方向 |
| --- | --- | --- | --- | --- |
| B1 | **brand-hover `#4E86DF` 直接作正文/小字**（链接、Badge、KPI 小数字、图例） | 3.44:1（neutral-02 底） | ×137，28+ 页 | 新增/改用更亮的 `brand-text` token（建议 ≥#86A9EC 档，T1b 定值并实测 ≥4.5）；文字场景不再直接用 brand-hover |
| B2 | **status 基色直接作正文**（`#D6730D` warning ×48、`#D52132` error ×27、`#19B172` success ×24） | 2.42–3.74:1 | ×99 | 文字场景统一换 P1a 已定义的 `-text` 变体（warning-text/success-text/info-text 实测均 >5.4:1，可直接用） |
| B3 | **P1a 新增 `error-text #EB636F` 自身不达标** | 4.0:1（neutral-02 底） | ×39 | 调亮 error-text token（建议 #F2787F~#F58A92 档，改 token 一处即全站生效；其余三个 -text token 实测达标） |
| B4 | **`neutral-08` 误用于 neutral-03 底**（三阶卡片/Badge/软衬底上的次要文字） | 4.06:1 | ×21 | 规则化：neutral-08 仅用于 01/02 底；03 底上次要文字升 neutral-10 |

颜色分布实证：rgb(78,134,223) ×137、rgb(214,115,13) ×48、rgb(235,99,111) ×39、rgb(213,33,50) ×27、rgb(25,177,114) ×24、rgb(155,168,204) ×21、chart 色 ×5。
页面热点：behavior-supervision ×68、mobile-people ×34、statistics-overview ×27、heatmap ×23、data-comparison ×17。

## 阻断项 C：移动触控目标 <44px（16 条 → 4 组）

| # | 位置 | 实测 | 修复建议 |
| --- | --- | --- | --- |
| C1 | mobile-people 搜索 Input（高 36px）、行尾 icon 按钮（36×36）、筛选按钮（28–32px 高） | 36px/28px | 高度统一 ≥44px（Input h-11、icon 按钮 44×44） |
| C2 | mobile-home 快捷功能按钮（42×42）、治理焦点文字按钮（52×20） | 42px/20px | 扩大点击热区（padding 或 min-h-[44px]） |
| C3 | mobile-person-detail 头部操作/编辑按钮（36×36）、文字链接按钮（28×22） | 36px/22px | 同上 |
| C4 | MobileDetailHeader 返回键命中区（现 36×36） | 36×36 | 扩至 44×44 |

## 阻断项 D：focus 不可见（4 条 → 1 组）

- `MobilePersonDetail` 关系图谱节点与链接（div.items-center、div.flex-1、a、button 各 1）：focus 时 outline=none 且无 box-shadow。修复：补 `focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/40`（与全站 focus 规范一致）。

## 建议项（554 条，不逐项列）

对比度 4.5–7:1：已达 WCAG AA 未达 AAA，集中在 neutral-08 正文（01/02 底）、status-text 系。不视为阻断；若后续追求 AAA 再统一处理。

## T1b 修复范围建议（按性价比排序）

1. **B3**：调亮 error-text token（1 处改动，39 条消解）——先做。
2. **B2**：status 基色文字 → `-text` 变体（约 99 条，机械替换）。
3. **A7**：Header Bell 加 aria-label（1 处，全站每页消解）。
4. **A1/A3/A4/A5**：四个页面行内操作按钮加 aria-label（4 处组件级改动，消解 ~2000 条）。
5. **B1**：brand-text token 定值 + 文字场景切换（137 条，需 Codex 复核色值）。
6. **B4**：neutral-08@03 底规则化替换（21 条）。
7. **C1–C4**：移动端触控目标（16 处，以 h-11/min-h-[44px] 为主）。
8. **A2/A6/A8**：checkbox 与零星 icon 按钮命名。
9. **D**：MobilePersonDetail 关系图 focus 环。

> 建议项（554 条）不进入 T1b；A6/A8 工作量小但与 A1–A5 同法，可并入。
