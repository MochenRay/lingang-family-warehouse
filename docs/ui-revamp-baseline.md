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
| raw hex（allowlist 之外） | `grep -rEo '#[0-9A-Fa-f]{6}\b' src --include='*.tsx' --include='*.ts' --include='*.css' \| grep -v 'src/styles/theme.css' \| grep -v 'src/app/config/chartConfig.ts' \| wc -l` | 993（64 文件） |
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
