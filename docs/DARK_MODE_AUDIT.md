# 暗色模式组件审计与优化计划

> 创建时间：2026-01-14
> 目标：统一组件为设计规范，优化暗色模式适配

---

## 一、审计范围

### 1.1 组件类型检查
- [ ] UI基础组件（按钮、输入框、卡片等）
- [ ] 页面组件（Dashboard、统计页面等）
- [ ] 移动端组件（MobileHome、MobileProfile等）
- [ ] 图表组件（Recharts配置）

### 1.2 暗色适配检查
- [ ] 背景色（bg-white, bg-gray-50 等亮色）
- [ ] 文字色（text-gray-900, text-gray-800 等深色）
- [ ] 边框色（border-gray-200 等浅色）
- [ ] 功能色（蓝色、绿色等是否使用规范色）

---

## 二、发现的问题

### 2.1 ❌ 移动端组件大量使用亮色（未适配暗色）

**问题文件**：
- `/src/app/components/mobile/MobileApp.tsx`
- `/src/app/components/mobile/MobileHome.tsx`
- `/src/app/components/mobile/MobileGridOverview.tsx`
- `/src/app/components/mobile/MobileProfile.tsx`
- `/src/app/components/mobile/MobileStats.tsx`
- `/src/app/components/mobile/HouseCollect.tsx`
- `/src/app/components/mobile/MobileHouseDetail.tsx`

**具体问题**：
```tsx
// ❌ 错误：使用亮色背景，未适配暗色
<div className="bg-white">
<div className="bg-gray-50">
<div className="bg-blue-50">

// ❌ 错误：使用深色文字，暗色模式下不可见
<div className="text-gray-900">
<div className="text-gray-800">

// ❌ 错误：使用浅色边框，暗色模式下对比度不足
<div className="border-gray-200">
<div className="border-gray-100">

// ❌ 错误：使用Tailwind默认蓝色，未使用规范色
<div className="bg-blue-500">
<div className="bg-blue-600">
```

**正确做法**：
```tsx
// ✅ 正确：使用规范变量，自动适配暗色
<div className="bg-card">
<div className="bg-background">
<div className="bg-[var(--color-neutral-02)]">

// ✅ 正确：使用规范文字色
<div className="text-foreground">
<div className="text-[var(--color-neutral-10)]">

// ✅ 正确：使用规范边框色
<div className="border-border">
<div className="border-[var(--color-neutral-03)]">

// ✅ 正确：使用规范主色
<div className="bg-primary">
<div className="bg-[var(--color-brand-primary)]">
```

---

### 2.2 ❌ 图表组件使用非规范颜色

**问题文件**：
- `/src/app/components/pages/DashboardPage.tsx`
- `/src/app/components/pages/StatisticsOverview.tsx`
- `/src/app/components/pages/DemographicsAnalysis.tsx`

**具体问题**：
```tsx
// ❌ 错误：硬编码颜色，未使用规范色板
<Bar fill="#8884d8" />
<Area fill="#3b82f6" />
<Pie fill="#0088FE" />

// ❌ 错误：图表容器背景未适配暗色
<Card className="bg-white">
```

**正确做法**：
```tsx
// ✅ 正确：使用规范图表配色
<Bar fill="var(--chart-1)" />
<Area fill="var(--color-brand-primary)" />
<Pie fill="var(--chart-2)" />

// ✅ 正确：使用规范卡片背景
<Card className="bg-card">
```

---

### 2.3 ❌ 按钮组件未统一使用规范

**问题文件**：
- `/src/app/components/mobile/HouseCollect.tsx`
- `/src/app/components/pages/*`

**具体问题**：
```tsx
// ❌ 错误：使用Tailwind默认蓝色
<Button className="bg-blue-600 hover:bg-blue-700">

// ❌ 错误：未使用规范圆角
<Button className="rounded-lg">  // 应该是 rounded-sm (2px)
```

**正确做法**：
```tsx
// ✅ 正确：使用 variant="default" 会自动应用规范色
<Button variant="default">

// ✅ 正确：手动指定规范色
<Button className="bg-primary hover:bg-[var(--color-brand-primary-hover)]">
```

---

### 2.4 ❌ Badge/Tag 组件颜色不统一

**问题**：
```tsx
// ❌ 错误：各种背景色不统一
<Badge className="bg-blue-50 text-blue-700">
<Badge className="bg-green-50 text-green-700">
<Badge className="bg-gray-50 text-gray-700">
```

**正确做法**：
```tsx
// ✅ 使用统一的 variant
<Badge variant="default">   // 使用主色
<Badge variant="success">   // 使用成功色
<Badge variant="secondary"> // 使用次要色
```

---

## 三、优化计划

### 阶段 1：移动端组件暗色适配（优先级最高）

**目标**：确保所有移动端组件完全适配暗色模式

**文件清单**：
1. ✅ `/src/app/components/mobile/MobileStatusBar.tsx` - 已优化
2. ✅ `/src/app/components/mobile/MobileHome.tsx` - 已优化（2026-01-14）
3. ✅ `/src/app/components/mobile/MobileGridOverview.tsx` - 已优化（2026-01-14）
4. ✅ `/src/app/components/mobile/MobileProfile.tsx` - 已优化（2026-01-14）
5. ✅ `/src/app/components/mobile/MobileStats.tsx` - 已优化（2026-01-14）
6. ✅ `/src/app/components/mobile/HouseCollect.tsx` - 已优化（2026-01-14）
7. ⏳ `/src/app/components/mobile/MobileApp.tsx`
8. ⏳ `/src/app/components/mobile/MobileHouseDetail.tsx`
9. ⏳ `/src/app/components/mobile/MobileTasks.tsx`
10. ⏳ `/src/app/components/mobile/PersonCollect.tsx`

**调整内容**：
- [x] 所有 `bg-white` → `bg-card` 或 `bg-[var(--color-neutral-02)]`
- [x] 所有 `bg-gray-50` → `bg-background` 或 `bg-[var(--color-neutral-01)]`
- [x] 所有 `bg-gray-100` → `bg-[var(--color-neutral-02)]`
- [x] 所有 `text-gray-900` → `text-foreground` 或 `text-[var(--color-neutral-11)]`
- [x] 所有 `text-gray-800` → `text-[var(--color-neutral-10)]`
- [x] 所有 `text-gray-600/500` → `text-muted-foreground` 或 `text-[var(--color-neutral-08)]`
- [x] 所有 `border-gray-200/100` → `border-border` 或 `border-[var(--color-neutral-03)]`
- [x] 所有 `bg-blue-600` → `bg-primary` 或 `bg-[var(--color-brand-primary)]`
- [x] 功能色统一使用规范色变量（success/warning/error/info）
- [x] 图表颜色使用规范图表色（--chart-1 到 --chart-6）
- [x] 排名奖牌使用真实金银铜色（#FFD700/#C0C0C0/#CD7F32）

---

### 阶段 2：Web端页面组件优化

**目标**：统一使用设计规范组件和颜色

**文件清单**：
1. ⏳ `/src/app/components/pages/DashboardPage.tsx`
2. ⏳ `/src/app/components/pages/StatisticsOverview.tsx`
3. ⏳ `/src/app/components/pages/DemographicsAnalysis.tsx`
4. ⏳ `/src/app/components/pages/BehaviorSupervision.tsx`
5. ⏳ `/src/app/components/pages/DataComparison.tsx`
6. ⏳ `/src/app/components/pages/FactorIdentification.tsx`

**调整内容**：
- [ ] 统一图表配色为规范6色方案
- [ ] 统一卡片背景、文字颜色
- [ ] 统一按钮样式和圆角
- [ ] 统一Tag/Badge样式

---

### 阶段 3：UI基础组件检查

**目标**：确保 `/src/app/components/ui/` 下所有组件符合规范

**文件清单**（需检查的重点组件）：
1. ⏳ `button.tsx` - 检查颜色、圆角、尺寸
2. ⏳ `card.tsx` - 检查圆角、背景色
3. ⏳ `input.tsx` - 检查圆角、边框色
4. ⏳ `badge.tsx` - 检查配色方案
5. ⏳ `tabs.tsx` - 检查选中状态样式
6. ⏳ `select.tsx` - 检查下拉样式
7. ⏳ `dialog.tsx` - 检查圆角、阴影

---

## 四、规范速查表

### 4.1 背景色映射

| 旧样式 | 新样式（推荐） | 说明 |
|--------|---------------|------|
| `bg-white` | `bg-card` 或 `bg-[var(--color-neutral-02)]` | 卡片背景 |
| `bg-gray-50` | `bg-background` 或 `bg-[var(--color-neutral-01)]` | 页面背景 |
| `bg-gray-100` | `bg-[var(--color-neutral-02)]` | 次要容器 |
| `bg-blue-50` | `bg-[var(--color-neutral-03)]` | 强调背景 |
| `bg-blue-600` | `bg-primary` 或 `bg-[var(--color-brand-primary)]` | 主色按钮 |

### 4.2 文字色映射

| 旧样式 | 新样式（推荐） | 说明 |
|--------|---------------|------|
| `text-gray-900` | `text-foreground` 或 `text-[var(--color-neutral-11)]` | 标题文字 |
| `text-gray-800` | `text-[var(--color-neutral-11)]` | 标题文字 |
| `text-gray-700` | `text-[var(--color-neutral-10)]` | 主要文字 |
| `text-gray-600` | `text-[var(--color-neutral-10)]` | 主要文字 |
| `text-gray-500` | `text-muted-foreground` 或 `text-[var(--color-neutral-08)]` | 次要文字 |
| `text-gray-400` | `text-[var(--color-neutral-06)]` | 辅助文字/禁用 |

### 4.3 边框色映射

| 旧样式 | 新样式（推荐） | 说明 |
|--------|---------------|------|
| `border-gray-100` | `border-border` 或 `border-[var(--color-neutral-03)]` | 分隔线 |
| `border-gray-200` | `border-border` 或 `border-[var(--color-neutral-03)]` | 卡片边框 |
| `border-gray-300` | `border-[var(--color-neutral-03)]` | 强调边框 |

### 4.4 功能色映射

| 功能 | 旧样式 | 新样式（推荐） |
|------|--------|---------------|
| 成功 | `bg-green-600` | `bg-[var(--color-status-success)]` |
| 警告 | `bg-yellow-600` | `bg-[var(--color-status-warning)]` |
| 错误 | `bg-red-600` | `bg-destructive` 或 `bg-[var(--color-status-error)]` |
| 信息 | `bg-blue-500` | `bg-[var(--color-status-info)]` |

### 4.5 圆角映射

| 旧样式 | 新样式 | 说明 |
|--------|--------|------|
| `rounded-md` (6px) | `rounded-sm` | 按钮、输入框 (2px) |
| `rounded-lg` (8px) | `rounded` | 卡片 (4px) |
| `rounded-xl` (12px) | `rounded-lg` | 对话框 (8px) |

---

## 五、执行检查清单

### 检查步骤

对每个组件文件执行以下检查：

1. **背景色检查**
   - [ ] 搜索 `bg-white`
   - [ ] 搜索 `bg-gray-50`
   - [ ] 搜索 `bg-gray-100`
   - [ ] 搜索 `bg-blue-50`
   - [ ] 替换为规范颜色变量

2. **文字色检查**
   - [ ] 搜索 `text-gray-900`
   - [ ] 搜索 `text-gray-800`
   - [ ] 搜索 `text-gray-700`
   - [ ] 搜索 `text-gray-600`
   - [ ] 搜索 `text-gray-500`
   - [ ] 替换为规范颜色变量

3. **边框色检查**
   - [ ] 搜索 `border-gray-100`
   - [ ] 搜索 `border-gray-200`
   - [ ] 搜索 `border-gray-300`
   - [ ] 替换为规范颜色变量

4. **主色检查**
   - [ ] 搜索 `bg-blue-500`
   - [ ] 搜索 `bg-blue-600`
   - [ ] 搜索 `text-blue-600`
   - [ ] 替换为规范主色变量

5. **圆角检查**
   - [ ] 搜索 `rounded-md`
   - [ ] 搜索 `rounded-lg`
   - [ ] 搜索 `rounded-xl`
   - [ ] 根据组件类型调整

---

## 六、自动化替换规则

可以使用以下正则表达式批量替换（需谨慎）：

```bash
# 背景色
bg-white → bg-card
bg-gray-50 → bg-[var(--color-neutral-01)]
bg-gray-100 → bg-[var(--color-neutral-02)]

# 文字色
text-gray-900 → text-[var(--color-neutral-11)]
text-gray-800 → text-[var(--color-neutral-11)]
text-gray-700 → text-[var(--color-neutral-10)]
text-gray-500 → text-[var(--color-neutral-08)]

# 边框色
border-gray-200 → border-[var(--color-neutral-03)]
border-gray-100 → border-[var(--color-neutral-03)]

# 主色
bg-blue-600 → bg-primary
bg-blue-500 → bg-primary
text-blue-600 → text-primary
```

⚠️ **注意**：某些特殊场景可能需要保留原始颜色（如图表、品牌色等），需要人工审核。

---

## 七、验收标准

### 7.1 视觉标准
- [ ] 所有页面在暗色模式下文字清晰可读
- [ ] 背景色层次分明（Neutral-00/01/02/03/04）
- [ ] 主色统一为 #2761CB（Blue-06）
- [ ] 功能色符合规范（成功/警告/错误/信息）
- [ ] 图表配色使用6色方案

### 7.2 交互标准
- [ ] 按钮 hover 状态使用 Blue-07 (#4E86DF)
- [ ] 按钮 active 状态使用 Blue-05 (#2251A8)
- [ ] 输入框 focus 边框使用 Blue-06
- [ ] 卡片 hover 使用 Shadow-02

### 7.3 代码标准
- [ ] 不使用硬编码颜色值（除非特殊需求）
- [ ] 优先使用 CSS 变量（如 `var(--color-brand-primary)`）
- [ ] 其次使用 Tailwind 语义类（如 `bg-primary`）
- [ ] 避免使用 Tailwind 默认色板（如 `blue-600`）

---

## 八、已知问题记录

### 8.1 移动端模拟器容器
**问题**：`MobileApp.tsx` 中的移动端模拟器边框使用 `border-gray-900`，在暗色模式下太亮。

**位置**：`/src/app/components/mobile/MobileApp.tsx:153`

**建议**：
```tsx
// 当前
md:border-gray-900

// 建议改为（使用中性色）
md:border-[var(--color-neutral-04)]
```

### 8.2 图表颜色数组
**问题**：多个页面定义了自己的 `COLORS` 数组，未使用规范色板。

**位置**：
- `/src/app/components/pages/DemographicsAnalysis.tsx:14`
- `/src/app/components/pages/FactorIdentification.tsx` 等

**建议**：创建统一的图表配色常量。

---

## 九、下一步行动

1. **立即执行**（AI）：
   - [ ] 开始阶段1：优化移动端组件
   - [ ] 逐个文件替换颜色类名
   - [ ] 测试暗色模式显示效果

2. **等待确认**（用户）：
   - [ ] 审核优化后的视觉效果
   - [ ] 确认是否需要保留某些特殊颜色
   - [ ] 决定是否继续阶段2和3

---

**文档版本**：v1.0  
**创建日期**：2026-01-14  
**状态**：审计中 ⏳