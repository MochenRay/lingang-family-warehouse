# 快速数值查询卡 - Quick Values Reference

> 创建时间：2024-12-20  
> 最近同步：2026-07-20（P1a-P4d UI 精修完成后全量对齐实现）  
> 用途：快速查询常用设计数值，无需打开详细规范文档  
> **正式来源：以 `src/styles/theme.css` 的实现值为准（图表色以 `src/app/config/chartConfig.ts` 为准）；本文档是速查副本，冲突时以代码为准。**

---

## 🎨 色彩速查

### 主色调
| 用途 | 颜色值 | 色系 |
|------|--------|------|
| **主色** | `#2761CB` | Blue-06 |
| **Hover** | `#4E86DF` | Blue-07 |
| **Click/Active** | `#2251A8` | Blue-05 |

**来源**：`src/styles/theme.css` → `--color-brand-primary` / `--color-brand-primary-hover` / `--color-brand-primary-active`

---

### 功能色
| 用途 | 颜色值 | 深底文字色（P1a 新增） | soft 软衬底（P1a 新增） |
|------|--------|------------------------|-------------------------|
| **成功** | `#19B172` | `#4AD3A0` (success-text) | `rgba(25,177,114,0.14)` |
| **警告** | `#D6730D` | `#F09640` (warning-text) | `rgba(214,115,13,0.16)` |
| **错误** | `#D52132` | `#EB636F` (error-text) | `rgba(213,33,50,0.16)` |
| **信息** | `#2AA3CF` | `#62C4E8` (info-text) | `rgba(42,163,207,0.16)` |

**来源**：`src/styles/theme.css` → `--color-status-*` / `--color-status-*-text` / `--color-status-*-soft`

---

### 强调紫（P4d 新增）
| 用途 | 颜色值 |
|------|--------|
| **accent-purple** | `#8B3BCC` |
| **accent-purple-text**（深底可读） | `#C9A5F2` |
| **accent-purple-soft** | `rgba(139,59,204,0.16)` |

**来源**：`src/styles/theme.css` → `--color-accent-purple*`

---

### 中性色（背景层级）
| 层级 | 颜色值 | 用途 |
|------|--------|------|
| **Neutral-00** | `#131623` | 侧边栏（极深蓝黑） |
| **Neutral-01** | `#1d2336` | 内容区背景（深蓝） |
| **Neutral-02** | `#2c334d` | 卡片背景（常用） |
| **Neutral-03** | `#3d4663` | 三阶卡片 / 边框 |
| **Neutral-04** | `#4e587a` | 四阶卡片（最亮层级） |

**来源**：`src/styles/theme.css` → `--color-neutral-00` ~ `--color-neutral-04`

---

### 中性色（文字层级）
| 层级 | 颜色值 | 用途 |
|------|--------|------|
| **Neutral-06** | `#6b7599` | 辅助文字、禁用 |
| **Neutral-08** | `#9ba8cc` | 次要文字、占位符 |
| **Neutral-10** | `#d0daf0` | 主要文字 |
| **Neutral-11** | `#ffffff` | 标题文字（最亮） |

**来源**：`src/styles/theme.css` → `--color-neutral-06` ~ `--color-neutral-11`

---

## 📐 圆角速查

| 档位 | 圆角值 | 适用组件 |
|------|--------|----------|
| **sm** | `2px` | 按钮、输入框、Tag |
| **md** | `4px` | 卡片、下拉菜单、Tooltip |
| **lg** | `8px` | 对话框（Modal）、工具栏容器 |
| **xl** | `12px` | 过渡档（特殊容器） |

**来源**：`src/styles/theme.css` → `@theme --radius-sm/md/lg/xl = 2px/4px/8px/12px`

**最常用**：按钮/输入框 `2px`，卡片 `4px`，对话框 `8px`

---

## 📏 尺寸速查

### 按钮高度
| 尺寸 | 高度 | 内边距 |
|------|------|--------|
| **大** | `40px` | `0 16px` |
| **中** | `32px` | `0 12px` |
| **小** | `24px` | `0 8px` |

**来源**：`src/app/components/ui/button.tsx`

---

### 表单组件高度
| 组件 | 高度 |
|------|------|
| **Input 输入框** | `32px` (中尺寸) |
| **Select 下拉框** | `32px` |
| **Radio/Checkbox** | `16px` (尺寸) |
| **Switch 开关** | `20px` (高度，中号) |

**来源**：`src/app/components/ui/input.tsx` 等

---

## 📦 间距速查（遵循 8n 原则）

| 档位 | 间距值 | 用途 |
|------|--------|------|
| **最小** | `4px` | 图标与文字、标签内边距 |
| **小** | `8px` | 按钮间距、列表项间距、Tag间距 |
| **中** | `12px` | 按钮内边距（小），面板内边距 |
| **标准** | `16px` | 卡片内边距、表单字段间距 |
| **大** | `24px` | 区块间距、页面边距、栅格 Gutter |

**优先使用**：4px、8px、12px、16px、24px（避免奇数或非标准值）

---

## 🌫️ 阴影速查

| 工具类 | 暗色模式值（.dark） | 用途 |
|--------|---------------------|------|
| **shadow-01** | `0px 2px 8px rgba(0,0,0,0.3)` | Dropdown、Tooltip（浮层） |
| **shadow-02** | `0px 4px 16px rgba(0,0,0,0.4)` | Card Hover（悬浮卡片） |
| **shadow-03** | `0px 6px 30px rgba(0,0,0,0.5)` | Modal、Drawer（模态窗） |

**来源**：`src/styles/theme.css` → `--shadow-01/02/03`（亮色主题为蓝色系 0.15/0.2/0.3，`.dark` 下覆盖为黑色系）

**使用原则**：层级越高，阴影越重；直接使用工具类 `shadow-01/02/03`，不要手写 box-shadow

---

## 🔤 字体排版速查

### 字号档位（8个）
| 档位 | 字号 | 行高 | 用途 |
|------|------|------|------|
| **xs** | `12px` | `20px` | 辅助文字、标签 |
| **sm** | `14px` | `22px` | 正文、表单 |
| **base** | `16px` | `24px` | 标题三级、重要文字 |
| **md**（自定义档） | `18px` | `26px` | 标题二级 |
| **lg** | `20px` | `28px` | 标题一级 |
| **xl** | `24px` | `32px` | 大标题 |
| **2xl** | `32px` | `40px` | 特大标题 |
| **3xl** | `46px` | `54px` | 数据大屏 |

**来源**：`src/styles/theme.css` → `@theme --text-*`（`text-md=18px` 为自定义档，工具类直接生效）

**行高公式**：行高 = 字号 + 8px

---

### 字重档位（4个）
| 字重 | 数值 | 用途 |
|------|------|------|
| **Light** | `300` | 辅助信息 |
| **Regular** | `400` | 正文（默认） |
| **Medium** | `500` | 小标题、强调 |
| **Bold** | `600` | 大标题、数字 |

---

## 📊 布局系统速查

### 页面布局
| 类型 | 侧边栏宽度 | 内容区宽度 | 说明 |
|------|-----------|-----------|------|
| **左右布局** | `256px`（实现 `w-64`；规范 240px 为 P5 待立项调整项） | `Auto` | Sider固定，Content自适应 |
| **上下布局** | - | `1200px` | 居中布局 |

### 栅格系统
| 项目 | 值 |
|------|-----|
| **列数** | `24` 栅格 |
| **Gutter** | `24px` |
| **页面边距** | `24px` |

---

## 🎨 图表配色速查

> **唯一来源：`src/app/config/chartConfig.ts`** — 页面图表一律从这里取色，不要手写 hex。

### 多色系（多系列图表）6色方案
| 序号 | 颜色值 | 色系 |
|------|--------|------|
| 1 | `#2761CB` | Blue-06 |
| 2 | `#413DD4` | Violet-06 |
| 3 | `#8B3BCC` | Purple-06 |
| 4 | `#2AA3CF` | Light-blue-06 |
| 5 | `#D6730D` | Orange-06 |
| 6 | `#19B172` | Green-06 |

**导出**：`CHART_COLORS`

### 图表辅助元素
| 元素 | 颜色值 | 导出 |
|------|--------|------|
| **坐标轴文字** | `#9ba8cc` (neutral-08) | `CHART_AXIS` / `CHART_TICK` |
| **网格线** | `#3d4663` (neutral-03) | `CHART_GRID` / `CHART_GRID_PROPS` |
| **数据标签** | `#d0daf0` (neutral-10) | `CHART_LABEL` |
| **图例文字** | `#9ba8cc` (neutral-08) | `CHART_LEGEND` |
| **Tooltip** | 底 `#2c334d` / 边 `#3d4663` / 文 `#d0daf0` | `CHART_TOOLTIP` |

### 单色系（数据大屏）
| 用途 | 颜色值 | 导出 |
|------|--------|------|
| **主色调** | `#4E86DF` (Blue-07) | `CHART_PRIMARY` |

---

## 🔍 快速参考索引

需要查看详细规范？请查阅：

| 规范类型 | 文档/代码路径 |
|---------|---------|
| **主题 token（正式来源）** | `src/styles/theme.css` |
| **图表主题（唯一来源）** | `src/app/config/chartConfig.ts` |
| **页面动画** | `src/styles/tailwind.css`（`@utility page-enter`） |
| **组件模式（P2 冻结）** | `src/app/components/patterns/` |
| **完整色彩系统** | `/reference/design-files/specs/color-palette.md` |
| **中性色系统** | `/reference/design-files/specs/neutral-colors.md` |
| **图表规范** | `/reference/design-files/specs/charts.md` |
| **组件对照表** | `/reference/03_COMPONENT_MAPPING.md` |

---

## 💡 使用建议

1. **代码开发时**：优先查阅本文档获取常用数值
2. **遇到冲突时**：以 `src/styles/theme.css` / `chartConfig.ts` 的实现值为准
3. **保持一致性**：优先使用 CSS 变量与语义工具类（`bg-primary`、`text-[var(--color-neutral-10)]` 等），避免手写 hex

---

## 📝 更新日志

| 日期 | 更新内容 |
|------|---------|
| 2024-12-20 | 初始版本，汇总27个规范文档的核心数值 |
| 2026-07-20 | P6 文档同步：全量对齐 P1a-P4d 精修后的实现值（中性色板换为 #131623 系、新增功能色 text/soft 扩展与 accent-purple、圆角/阴影/字号改为 @theme token 口径、图表色源指向 chartConfig.ts），注明 theme.css 为正式来源 |

---

**文档版本**：v2.0  
**创建日期**：2024-12-20  
**最后更新**：2026-07-20  
**维护人**：AI Assistant
