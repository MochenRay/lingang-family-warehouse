# P5-T7 · C 组设计类方案稿（先评审后立项）

> 状态：2026-07-22 **V2 修订稿**（按 Codex 评审 CHANGES_REQUESTED 定点修订）提交复审。本稿只产方案、不含实现；通过项另立实施 PR（各带 e2e/截图验收，实施环境 T2 golden 已就位）。
> 事实依据：main `10195ff` 代码实读，关键事实附文件:行号。
> V2 修订记录（对应 Codex 五项阻断 + 三项非阻断）：
> ① 方案一权限映射纠错——本页只对应 `RoleManagement.tsx:132`（code `warning_map`）与 `PermissionManagement.tsx:68`（「预警地图」）；`RoleManagement.tsx:113`（「热力图分析」）与 `PermissionManagement.tsx:49`（「全域人口热力图」）是统计分析域另一套人口热力图权限概念，**不属于本页、不动**。eyebrow 原值更正为 `WARNING MAP`。
> ② 方案一矩阵冻结数据单位与覆盖范围（网格级板 + 全部网格 + 清单平铺排序规则）。
> ③ 方案二目标与 e2e 防假绿改写。
> ④ 方案三 Recharts 镜像机制冻结（共享 stackId + stackOffset="sign" + 对称 domain + tooltip 绝对值包装）。
> ⑤ 方案三否决「不改 StatCard」——金字塔与老龄化比例统一 `age > 60`。
> ⑥ 无坐标结论的 grep 措辞修正为字段名边界搜索（裸 `lat` 会误命中 `latest`/`related` 等子串，结论不变：四模型字段清单无坐标字段——Grid: id/name/parentId/managerName；House: 仅文本 address；Person: 无坐标字段；ConflictRecord: location 为自由文本）。
> ⑦ 方案三全量通道明确为 `getPeople()` 无参版本。
> ⑧ 方案三补可访问语义要求。

---

## 方案一：WarningMap 整页重做

### 问题陈述

现页（`WarningMap.tsx`，309 行）结构为 KPI 行 + 8 块网格热区板 + 预警清单 + 详情 Dialog，与「地图」名实不符——页面自述「用网格热区板替代空地图视图」（`:192`）。经字段名边界搜索核实，**全系统无任何地理坐标数据**：Grid（id/name/parentId/managerName）、House（仅文本 address）、Person（无坐标字段）、ConflictRecord（location 为自由文本）四模型与 seed 均无坐标字段，前端无地图库（`package.json` 仅 recharts 2.15.2），唯一空间锚点是「区→街道→社区→网格」文本层级（`regions.ts` + Grid 树）。按冻结裁决：**无坐标不做真地图**。

附加问题：

- **命名分裂**：本页相关称谓——路由 id `heatmap`（`routes.ts:17`）、页面标题「预警地图」（`WarningMap.tsx:135`）、eyebrow `WARNING MAP`（`:133-169`）、角色权限 code `warning_map`「预警地图」（`RoleManagement.tsx:132`）、权限管理「预警地图」（`PermissionManagement.tsx:68`）。注意：`RoleManagement.tsx:113`「热力图分析」与 `PermissionManagement.tsx:49`「全域人口热力图」属统计分析域的另一套权限概念，与本页无关。
- **导航隐藏**：该页不在 Sidebar 任何分组（`Sidebar.tsx:46-122`），只能直接输 URL 到达。
- 信息层级平铺：热区板取全局 Top 8（`WarningMap.tsx:95` `grids.slice(0, 8)`）后与预警清单（≤12 条）并列堆砌，区/街道层级与 heatScore 优先级没有被视觉结构化。

### 结论：结构重做（非视觉再设计）

视觉再设计解决不了「名实不符 + 层级缺失 + 命名分裂」；真地图无数据支撑。方案为「热区矩阵化」的结构重做。

### 目标用户与阅读效率目标

- 一线网格员/网格长：10 秒内回答「我辖区哪个网格最烫、烫在哪类信号」。
- 管理者：30 秒内完成「等级分布 → 热区定位 → 具体预警 → 详情」的下钻路径。

### 结构草图

```
┌ PageHeader：预警热区（已定名） eyebrow WARNING ZONES ────┐
│ 筛选：类型 Select / 等级 Select / 导出 JSON（保持现状）      │
├ KPI 行（6 卡，保持现状口径）─────────────────────────────┤
├ 热区矩阵（新，数据单位与覆盖范围已冻结）─────────────────────┤
│ 按 区→街道 分组（regions.ts 层级）；组内为**网格级板**         │
│ （AnalysisGridMetric 一条记录一个网格，analysisRepository.   │
│  ts:11）——板面显示 社区名 + gridLabel（g1/g2 同属海梦苑社     │
│  区，regions.ts:52/61，同名社区板靠 gridLabel 区分）；        │
│  覆盖**全部 12 个网格**（取代现 Top 8 截断），组内 heatScore   │
│  降序；板面其余元素=现状（信号数/等级 Badge/热度分/待处理/     │
│  已闭环/主信号），点击选中行为保持                             │
├ 预警清单（保持平铺；排序冻结：severity 等级降序 →             │
│  heatScore 降序 → 更新时间降序）───────────────────────────┤
├ 详情 Dialog（保持现状）──────────────────────────────────┤
```

### 决策裁定（Codex 一轮）

- 定名「预警热区」：**通过**（eyebrow 同步 `WARNING ZONES`；页面标题、`RoleManagement.tsx:132`、`PermissionManagement.tsx:68` 三处统一，另一套人口热力图权限不动）
- 补导航入口（落「统计分析」组，与方案二联动）：**通过**
- 区/街道分组：**通过**，但板必须明确为网格级（已冻结如上）
- 覆盖范围与清单形态：按本稿冻结执行（全部 12 网格；清单平铺 + 三级排序）

### 验收标准（实施 PR）

- 称谓统一：页面标题/eyebrow、`RoleManagement.tsx:132`、`PermissionManagement.tsx:68` 同名「预警热区」；人口热力图两处权限配置原样保留；a11y 扫描该路由 readyText 同步更新且「阻断为零」硬断言通过
- 热区矩阵：区/街道分组渲染，组内网格级板，覆盖全部 12 网格、组内 heatScore 降序；筛选/点击/Dialog 行为与现状一致
- e2e 锁定：网格板数量（=12）、组内顺序、同名社区（海梦苑第一/第二网格）下 gridLabel 可区分；清单三级排序
- 1024×768 与 1440×900 截图无溢出；golden 机制不在试点页，无需基线

### 工作量估计

中（2–3 天）：页面结构重构 1 天、命名统一 + 权限配置同步 0.5 天、e2e + 截图 + a11y 复扫 0.5–1 天。

---

## 方案二：导航重组

### 问题陈述

桌面 Sidebar 为 7 组 29 项（`Sidebar.tsx:46-122`），隐藏第 30 项 `heatmap`（见方案一）。三处语义问题（冻结稿点名，代码证据已核）：

1. **「归因分析（示例）」名不副实**（`Sidebar.tsx:102`）：组内 4 页自身均为正式命名（异常结果分析/时序分析/影响因子识别/贡献程度排名），「示例」只存在于组名一层，与页面实际形态不一致。
2. **「标签管理」孤立项**（`Sidebar.tsx:72-76`）：7 组中唯一无 children 的顶层项；同族页「标签分析画像」却在「统计分析」组（`:56`），标签域 2 页被拆在 2 处。
3. **智能体/网格事务边界**：「待办规则」（rule-config，`:97`）语义偏配置却在事务组；`Routes.tsx` 分区注释（行为督导/规则引擎被视为独立域）与 Sidebar 分组不同步。

边界（冻结）：**不增删页面、不改路由 path**；移动端导航完全独立（`MobileLayout.tsx:14-19` 硬编码 4 tab），不在本方案范围。

### 目标（V2 改写，消除与结构的冲突）

- **URL path 与核心执行页位置不变**（数据管理/网格事务执行类页的肌肉记忆不受影响）；待办规则按已裁定方案迁移至系统配置。
- 新用户凭组名直觉猜中目标页所在组，一次展开命中。

### 改动前后对照表（已按一轮裁定收敛）

| 分组 | 改动前 | 改动后 | 理由 |
|---|---|---|---|
| 统计分析 | 7 项（含标签分析画像） | 7 项：−标签分析画像，+预警热区（已裁定补入） | 标签域归并；隐藏页补入口 |
| 数据管理 | 4 项 | 不变 | 高频域不动 |
| 标签管理（孤立） | 1 项（自身即叶子） | **标签**（组改名，已裁定）2 项：标签管理、标签分析画像（自统计分析移入） | 消除唯一单层组，标签域聚合 |
| 数仓智能体 | 4 项 | 不变 | 边界干净 |
| 网格事务 | 5 项（含待办规则） | 4 项：−待办规则 | 事务组保留执行类 |
| 归因分析（示例） | 4 项 | **归因分析**（组改名），4 项不变 | 去除与实态不符的「示例」 |
| 系统配置 | 4 项 | 5 项：+待办规则（已裁定自网格事务移入） | 规则配置归配置域 |

默认展开组保持 `statistics` + `data-management` 不变；「体验移动端工作台」底部入口不变。

### 决策裁定（Codex 一轮）

- 待办规则移系统配置：**通过**；补预警热区入口：**通过**；组名采用「标签」：**通过**。

### 验收标准（V2 防假绿改写，实施 PR）

- 对照表逐组落地；路由 path 零改动（grep 证明）；移动端零改动
- e2e（替代原「每组首项点击」的弱口径）：**断言完整父子树**——7 个分组 label 与各自 children 全量比对、30 个页面 ID 无缺失无重复；并至少点击验证「标签分析画像」「待办规则」「预警热区」三项的所在分组及最终 URL
- 菜单 label 程序化测量零溢出零换行（复用 T6 测量方法）；1024×768/1440×900/折叠态截图
- a11y 扫描「阻断为零」

### 工作量估计

小（0.5–1 天）：Sidebar menuItems 重排 + e2e + 截图。

---

## 方案三：人口金字塔 div → Recharts

### 问题陈述

现金字塔（`DemographicsAnalysis.tsx:90-154` 内部组件 `PopulationPyramid`）为 div 实现，存在四类不一致与一个数据失真：

- **数据失真（最重）**：数据源 `personRepository.getPeople({ limit: 500 })`（`:172`）——显式 limit 走单页拉取（`personRepository.ts:94-96`），全库 1917 人金字塔只统计前 500 条，比例结构失真。
- **主题不一致**：男用 `brand-primary-hover`、女用 `status-warning`（语义为「警告橙」），未用 chartConfig 的性别专用色 `CHART_GENDER_COLORS`（`chartConfig.ts:91-94`）。
- **交互不一致**：hover 仅原生 `title` 属性，无 `DarkChartTooltip`/cursor；无空数据态（空数据渲染全 0 条而非 EmptyState）。
- **口径分裂**：前端桶边界 60岁以上 min=60（`:27-28`），后端 `_build_age_data` 为 61（`stats.py:48-53`）；且同页 StatCard 老龄化比例基于同一 500 截断列表 `people.filter(age >= 60)`（`:230-234`），与金字塔共用失真数据。
- 技术缺口：双向/负值条形全站无 Recharts 先例（grep `stackId` 零命中），本项为首例。

### 目标用户与阅读效率目标

- 分析用户：hover 任一性别段即见精确人数（与全站图表 tooltip 体验一致）；空数据时有明确空态而非「全 0 假象」。
- 数据可信：金字塔与老龄化比例均覆盖全量 1917 人、同一口径。

### 结构草图

```
┌ Card：年龄性别人口金字塔 ─────────────────────────────┐
│ Recharts BarChart layout="vertical"（机制已冻结）         │
│  男负女正：male 取负值、female 正值，**相同 stackId +      │
│  stackOffset="sign" + 对称 domain**（两性同一年龄行）      │
│  XAxis：镜像刻度（tickFormatter 取绝对值）                 │
│  YAxis：4 年龄段（桶边界对齐后端，见裁定）                  │
│  Tooltip：本地包装 DarkChartTooltip（展示值取绝对值——      │
│  原组件直出 item.value，DarkChartTooltip.tsx:38）+         │
│  DARK_TOOLTIP_CURSOR                                     │
│  配色：CHART_GENDER_COLORS（male #2761CB / female #E845B1）│
│  可访问语义：视觉隐藏数据表或逐段完整 aria-label             │
│  （仅 axe「阻断为零」不足证明图表数据可被辅助技术读取）        │
│  空数据：页面级 EmptyState（patterns/states）              │
│  加载：LoadingState（保持现状）                            │
```

### 数据层方案（已冻结）

- 全量通道：`personRepository.getPeople()` **无参调用**（`personRepository.ts:117-121`）——无 limit/offset 时内部走 `fetchAllListPages` 分页拉全量（`:98-102`），金字塔与老龄化比例共用该全量列表；**不改后端、不加聚合接口**。
- 桶边界：对齐后端（60岁以上 = 61 起，见裁定）。

### 决策裁定（Codex 一轮）

- 负值法：**通过**，但必须共享 `stackId` + `stackOffset="sign"` + 对称 domain（不 stack 会成上下两行而非同行镜像，Recharts 2.15.2 实测）。
- 桶边界对齐后端 61 起：**通过**；同步否决「不改同页 StatCard」——金字塔与老龄化比例**统一 `age > 60`**，StatCard 标签/说明明确「61 岁及以上」。
- tooltip 展示值：本地包装取绝对值（负数仅用于镜像布局，不对用户展示）。

### 验收标准（实施 PR）

- 镜像正确：两性同一年龄行（e2e 断言同一 y）；X 轴刻度与 tooltip 均显示正人数
- 交互一致性：DarkChartTooltip（包装版）+ cursor hover 生效；空数据 EmptyState；加载 LoadingState；可访问语义（隐藏表或 aria-label）覆盖全部年龄段
- 数据正确：金字塔与老龄化比例 = 全量人口同一口径（e2e 断言各桶男女数与 API 全量推算一致）；**e2e 含至少一名 60 岁 fixture**，验证其归入 36–60岁 且不计入老龄化比例
- 1024×768 不溢出截图 + 1440×900 截图；a11y 扫描「阻断为零」
- recharts JS 动画与 reduced-motion 的关系记录为已知项（全站一致，不单独立项）

### 工作量估计

小-中（1–1.5 天）：组件重写 + tooltip 包装 0.5 天、e2e（含 60 岁 fixture）+ 截图 0.5–1 天。

---

## 评审与立项

- 三项独立评审、独立立项；通过项各立实施 PR（每任务完整发布链）。
- 方案一↔方案二联动（定名与导航入口）已按一轮裁定收敛；实施排期建议：方案二（小）→ 方案三（小-中）→ 方案一（中）。
- 全部实施项环境前提已满足：T2 golden 回归网、投影产物门禁、a11y 扫描器均在线。
