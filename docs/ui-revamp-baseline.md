# UI 精修基线文档（P0 冻结）

> 冻结日期：2026-07-19
> 基线分支：`kimi/ui-p0-baseline`，基线 SHA：`96f4eac`（main）
> 用途：UI 精修（P1–P4）每批验收的对照基准。统计口径以此文档冻结的命令为准，不凭印象估算。

## 1. 四件套基线

| 检查 | 命令 | 基线结果 |
| --- | --- | --- |
| 类型检查 | `npm run typecheck` | 通过，无输出 |
| 构建 | `npm run build` | 通过（vite build，约 2s） |
| 单元测试 | `npm run test` | 8 文件 13/13 通过 |
| E2E | `BACKEND_PORT=18000 FRONTEND_PORT=15173 npm run test:e2e` | 10/10 通过 |

## 2. e2e 端口约定

- 本机 8000/5173 常被预览环境占用，e2e 统一使用专用端口：`BACKEND_PORT=18000 FRONTEND_PORT=15173 npm run test:e2e`。
- `scripts/start-e2e-backend.sh` 已加端口预检：端口被占时快速失败并提示上述约定（P0 新增，已验证占用/空闲两种路径）。

## 3. 机械统计口径与基线读数

> 在项目根目录执行；统计对象除特别说明外为 `src/`。**allowlist（语义映射层，不计入 raw hex）**：`src/styles/theme.css`、`src/app/config/chartConfig.ts`。

| 指标 | 命令 | 基线 |
| --- | --- | --- |
| raw hex（allowlist 之外） | 计数：`grep -rEo '#[0-9A-Fa-f]{6}\b' src --include='*.tsx' --include='*.ts' --include='*.css' \| grep -v 'src/styles/theme.css' \| grep -v 'src/app/config/chartConfig.ts' \| wc -l`；文件数：`grep -rEl '#[0-9A-Fa-f]{6}\b' src --include='*.tsx' --include='*.ts' --include='*.css' \| grep -v 'src/styles/theme.css' \| grep -v 'src/app/config/chartConfig.ts' \| wc -l` | 993（64 文件） |
| 灰阶 utility | `grep -rEo '\b(bg\|text\|border\|divide\|ring\|from\|to\|via)-(gray\|slate\|zinc\|neutral\|stone)-[0-9]{2,3}\b' src/app --include='*.tsx' \| wc -l` | 721 |
| 浅色阶色 utility | `grep -rEo '\b(bg\|text\|border)-(red\|blue\|green\|amber\|emerald\|orange\|yellow\|purple\|pink\|indigo\|sky\|cyan\|teal\|fuchsia\|rose\|violet\|lime)-[1-6]00\b' src/app --include='*.tsx' \| wc -l` | 594 |
| bg-white / text-white | `grep -rEo '\b(bg\|text)-white\b' src/app --include='*.tsx' \| wc -l` | 348 |
| rounded-lg/xl/2xl | `grep -rEo 'rounded-(lg\|xl\|2xl)' src/app --include='*.tsx' \| wc -l` | 259 |
| 原生 confirm() | `grep -rn '\bconfirm(' src/app --include='*.tsx' \| grep -v 'ConfirmDialog' \| wc -l` | 9（桌面 5 + 移动 4） |
| theme.css `!important` | `grep -c '!important' src/styles/theme.css` | 29 |
| chartConfig 消费者 | `grep -rl 'chartConfig' src/app --include='*.tsx' --include='*.ts' \| grep -v 'config/chartConfig' \| wc -l` | 0 |

**终态口径**：allowlist 之外 raw hex = 0；灰阶/浅色阶/白色 utility 清零（移动端补丁表随之删除）；原生 confirm() = 0；`!important` 补丁表删除。rounded 类以规范档（2/4/8px）落地后的实际口径在 P1a 补充。

## 4. 移动端 smoke 回归网（P0 新增）

`tests/e2e/mobile-smoke.spec.ts`，视口 390×844，4 条 characterization 测试：

1. `/mobile` 工作台外壳 + 快捷功能
2. `/mobile/people` 列表计数渲染
3. `/mobile/person/{id}` 人员详情（id 取自种子数据）
4. `/mobile/conflict/new` 表单渲染

基线结果：4/4 通过（专用端口）。**P4 各批必须保持全绿。**

## 5. 截图基准

- 截图工具：`tests/e2e/ui-screenshots.spec.ts`（P0 新增，输出 `test-results/ui-screenshots/`，gitignored）。
- 矩阵：桌面 1440×900 / 1024×768，移动 390×844。
- 改造前基准存档：`tmp/ui-baseline/`（gitignored，按 SHA 标记）。

## 6. 旧 hex → token 映射表（P1a 冻结，P1b/P3/P4 迁移依据）

> 迁移纪律：**先迁移消费者、后删旧值**；同构替换，不改布局与行为。

### 旧规范色板（phase14 前值）→ 现行 token

| 旧 hex | 语义 | 迁移目标 |
| --- | --- | --- |
| `#0D121B` | Neutral-00 侧边栏 | `var(--color-neutral-00)` |
| `#161D2A` | Neutral-01 内容区背景 | `var(--color-neutral-01)` |
| `#1F293A` | Neutral-02 卡片背景 | `var(--color-neutral-02)` |
| `#293449` | Neutral-03 三阶/边框 | `var(--color-neutral-03)` |
| `#314059` | Neutral-04 四阶 | `var(--color-neutral-04)` |
| `#546789` | Neutral-06 辅助文字 | `var(--color-neutral-06)` |
| `#8194B5` | Neutral-08 次要文字 | `var(--color-neutral-08)` |
| `#AEC0DE` | Neutral-10 主要文字 | `var(--color-neutral-10)` |
| `#F6F9FE` | Neutral-11 标题文字 | `var(--color-neutral-11)` |

### 品牌/功能色（值未变，直接引用 token）

`#2761CB`→`--color-brand-primary`、`#4E86DF`→`--color-brand-primary-hover`、`#2251A8`→`--color-brand-primary-active`、`#19B172/#D6730D/#D52132/#2AA3CF`→`--color-status-*`。

### Ad-hoc 色 → P1a 新增状态扩展 token

| 散落的 ad-hoc 色 | 迁移目标 |
| --- | --- |
| `#6EE7B7`/`#A5F3C6` 等浅绿 | `text-success` 系（`--color-status-success-text` + `--color-status-success-soft`） |
| `#FDBA74`/`#FFD2A3` 等浅橙 | `text-warning` 系 |
| `#FCA5A5`/`#FF7A85`/`#FFB4B4` 等浅红 | `text-error` 系 |
| `#93C5FD`/`#B8D0FF` 等浅蓝 | `text-info` 系或品牌色 |
| `#8B5CF6`/`#EC4899` 等紫粉 | 图表统一走 chart adapter（P1c），语义色走 status 系 |

### 阴影

`rgba(10, 27, 57, 0.15/0.2/0.3)` 写死阴影 → `shadow-01/02/03` 工具类（.dark 下解析为黑色系阴影）。

## 7. P1a 变更留痕

- theme.css：`:root` 死定义清理（--font-size/--radius/--input-background/--switch-background/--font-weight-*/--line-*/--spacing-*/--text-md，全仓 0 引用已核实）；新增状态扩展 token（*-text 深底可读 + *-soft 软衬底）。
- @theme：接入规范圆角档（sm 2 / md 4 / lg 8 / xl 12 过渡）、字号档位（12/14/16/18/20/24/32/46，行高=字号+8）、中文字体栈、chart-6、状态扩展色、阴影工具类（shadow-01/02/03）。
- 新增 `@layer base` border 缺省色 → `var(--border)`（修复裸 border = currentColor 陷阱）。
- index.html FOUC 预设底色 `#0D121B` → `#131623`（与 neutral-00 一致）。
- 冗余 `dark:` 前缀清理 36 → 0（App.tsx 3、Header.tsx 25、button.tsx 7、dropdown-menu.tsx 1，均保留原 .dark 渲染值，行为不变）。
- 预期内的视觉变化：按钮/输入圆角 8→2px 档、卡片圆角 →4px 档、text-lg 18→20px、小字行高按规范变宽。
