# Layout 布局规范

## 来源
SENSORO 设计规范 / Lins 4.0

## 设计理念
协助进行页面级整体布局。

---

## 目录

1. [基本页面布局](#一基本页面布局)
2. [适配方案](#二适配方案)
3. [标题、面包屑位置说明](#三标题面包屑位置说明)
4. [栅格系统](#四栅格系统)
5. [信息区块划分](#五信息区块划分)

---

## 一、基本页面布局

分为**左右布局**和**上下布局**两种方式。

### 1.1 左右布局（Sider + Content）

**结构**：`Header` → `Sider + Content` → `Footer`

**特点**：
- ✅ 左侧导航栏（Sider）：**240px 固定宽度**
- ✅ 右侧内容区（Content）：**动态缩放（Auto）**
- ✅ 间距：**24px**

---

#### 布局参数

| 区域 | 宽度 | 说明 |
|------|------|------|
| **Sider（侧边栏）** | `240px` | 固定宽度 |
| **Sider 与 Content 间距** | `24px` | 固定间距 |
| **Content（内容区）** | `Auto` | 动态缩放，填充剩余空间 |
| **页面左右边距** | `24px` | 页面两侧留白 |

---

#### CSS 示例

```css
.layout-with-sider {
  display: flex;
  height: 100vh;
}

.layout-sider {
  width: 240px; /* 固定宽度 */
  background: #FFFFFF;
}

.layout-content {
  flex: 1; /* 动态缩放 */
  margin-left: 24px; /* 与 Sider 间距 */
  background: #F2F4F8;
}
```

---

#### Tailwind CSS 示例

```html
<div class="flex h-screen">
  <!-- Sider -->
  <aside class="w-[240px] bg-white">
    侧边栏
  </aside>
  
  <!-- Content -->
  <main class="flex-1 ml-6 bg-[#F2F4F8]">
    内容区（动态宽度）
  </main>
</div>
```

---

#### React 组件示例

```tsx
import React from 'react';

export const LayoutWithSider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Sider */}
      <aside className="w-[240px] bg-white">
        <nav>侧边导航</nav>
      </aside>
      
      {/* Content */}
      <main className="flex-1 ml-6 bg-[#F2F4F8]">
        {children}
      </main>
    </div>
  );
};
```

---

### 1.2 上下布局（Header + Content + Footer）

**结构**：`Header` → `Content` → `Footer`

**特点**：
- ✅ 内容区宽度：**1200px 固定**（最常用）
- ✅ 内容居中显示
- ✅ 响应式：内容宽度可调整为 `W1 ~ W2 px`（根据实际需求）

---

#### 布局参数（固定宽度方案）

| 区域 | 宽度 | 说明 |
|------|------|------|
| **Content（内容区）** | `1200px` | 固定宽度，居中显示 |
| **页面左右边距** | `Auto` | 自动居中 |

---

#### 布局参数（可变宽度方案）

| 区域 | 宽度 | 说明 |
|------|------|------|
| **Content（内容区）** | `W1 ~ W2 px` | 可变宽度，W1、W2 根据实际需求定义 |
| **页面左右边距** | `Auto` | 自动居中 |

---

#### CSS 示例（固定宽度）

```css
.layout-fixed {
  width: 1200px;
  margin: 0 auto; /* 居中 */
  background: #FFFFFF;
}
```

---

#### Tailwind CSS 示例（固定宽度）

```html
<div class="w-[1200px] mx-auto bg-white">
  <!-- Header -->
  <header class="h-16 bg-[#0A1B39]">顶部栏</header>
  
  <!-- Content -->
  <main class="min-h-screen bg-white">
    内容区（1200px 固定宽度）
  </main>
  
  <!-- Footer -->
  <footer class="h-16 bg-[#0A1B39]">底部栏</footer>
</div>
```

---

#### React 组件示例（响应式宽度）

```tsx
import React from 'react';
import clsx from 'clsx';

interface LayoutFixedProps {
  children: React.ReactNode;
  maxWidth?: number; // 默认 1200px
  className?: string;
}

export const LayoutFixed: React.FC<LayoutFixedProps> = ({ 
  children, 
  maxWidth = 1200,
  className 
}) => {
  return (
    <div 
      className={clsx('mx-auto bg-white', className)}
      style={{ maxWidth: `${maxWidth}px` }}
    >
      {children}
    </div>
  );
};

// 使用示例
<LayoutFixed maxWidth={1200}>
  <header>顶部栏</header>
  <main>内容区</main>
  <footer>底部栏</footer>
</LayoutFixed>
```

---

## 二、适配方案

### 2.1 三种适配方案

| 方案 | 说明 | 适用场景 |
|------|------|---------|
| **方案 1** | 左右布局：固定左侧导航栏宽度 **240px**，右边内容区域动态缩放 | 带侧边栏的管理后台 |
| **方案 2** | 上下布局：固定内容宽度 **1200px** | 常规页面、落地页 |
| **方案 3** | 上下布局：内容宽度 **W1 ~ W2 px**，W1、W2 的值以实际需求为准 | 特殊需求页面 |

---

### 2.2 方案选择建议

**推荐方案 1**（左右布局）：
- ✅ 适合后台管理系统
- ✅ 侧边栏固定，内容区响应式
- ✅ 用户体验好，导航始终可见

**推荐方案 2**（上下布局，1200px）：
- ✅ 适合内容展示型页面
- ✅ 内容宽度统一，视觉整洁
- ✅ 适配常见屏幕尺寸（1280px、1366px、1440px、1920px）

**方案 3**（可变宽度）：
- ⚠️ 仅在有特殊需求时使用
- ⚠️ 需要定义明确的 W1、W2 值
- ⚠️ 可能影响视觉一致性

---

### 2.3 响应式断点建议

| 断点 | 屏幕宽度 | 内容区宽度 | 说明 |
|------|---------|-----------|------|
| **Large Desktop** | ≥ 1920px | 1200px | 居中显示 |
| **Desktop** | 1280px ~ 1919px | 1200px | 居中显示 |
| **Tablet** | 768px ~ 1279px | 100% - 48px | 左右各 24px 边距 |
| **Mobile** | < 768px | 100% - 32px | 左右各 16px 边距 |

---

### 2.4 重要说明

> ⚠️ **注意**：此适配方案不需要写成组件，仅作为设计参考。

---

## 三、标题、面包屑位置说明

标题、面包屑在页面中的位置规范。

### 3.1 标题位置规范

#### 3.1.1 一级标题（页面主标题）

**位置**：内容区顶部  
**字号**：`24px`  
**字重**：`500 (Medium)`  
**颜色**：`#0A1B39`  
**上边距**：`48px`（距离页面顶部或面包屑）  
**下边距**：`24px`（距离内容区）

**示例**：
```html
<h1 class="text-2xl font-medium text-[#0A1B39] mt-12 mb-6">
  新建项目
</h1>
```

---

#### 3.1.2 二级标题（区域标题）

**位置**：内容区内部  
**字号**：`16px`  
**字重**：`500 (Medium)`  
**颜色**：`#0A1B39`  
**上边距**：`24px`（距离上一个区域）  
**下边距**：`16px`（距离内容）

**示例**：
```html
<h2 class="text-base font-medium text-[#0A1B39] mt-6 mb-4">
  这是标题文字
</h2>
```

---

### 3.2 面包屑位置规范

**位置**：内容区顶部，标题上方  
**字号**：`12px`  
**颜色**：`rgba(10, 27, 57, 0.8)`  
**上边距**：`24px`（距离页面顶部）  
**下边距**：`16px`（距离标题）

---

#### 面包屑样式

| 元素 | 样式 |
|------|------|
| **字号** | `12px` |
| **颜色** | `rgba(10, 27, 57, 0.8)` |
| **分隔符** | `/` 或 `>` |
| **分隔符颜色** | `rgba(10, 27, 57, 0.4)` |
| **悬浮颜色** | `#2761CB`（Blue-06） |

---

#### CSS 示例

```css
.breadcrumb {
  font-size: 12px;
  color: rgba(10, 27, 57, 0.8);
  margin-top: 24px;
  margin-bottom: 16px;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: rgba(10, 27, 57, 0.4);
}

.breadcrumb-link:hover {
  color: #2761CB;
}
```

---

#### React 组件示例

```tsx
import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="mt-6 mb-4 text-xs text-[rgba(10,27,57,0.8)]">
      {items.map((item, index) => (
        <span key={index}>
          {item.href ? (
            <a 
              href={item.href} 
              className="hover:text-[#2761CB] transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 && (
            <span className="mx-2 text-[rgba(10,27,57,0.4)]">/</span>
          )}
        </span>
      ))}
    </nav>
  );
};

// 使用示例
<Breadcrumb 
  items={[
    { label: '首页', href: '/' },
    { label: '项目管理', href: '/projects' },
    { label: '新建项目' },
  ]} 
/>
```

---

### 3.3 "返回上一级"链接

**位置**：面包屑上方或面包屑左侧  
**字号**：`12px`  
**颜色**：`rgba(10, 27, 57, 0.8)`  
**图标大小**：`12px × 12px`  
**图标位置**：文字左侧  
**图标与文字间距**：`4px`

---

#### CSS 示例

```css
.back-link {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: rgba(10, 27, 57, 0.8);
  cursor: pointer;
}

.back-link-icon {
  width: 12px;
  height: 12px;
  margin-right: 4px;
}

.back-link:hover {
  color: #2761CB;
}
```

---

#### React 组件示例

```tsx
import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface BackLinkProps {
  onClick: () => void;
  label?: string;
}

export const BackLink: React.FC<BackLinkProps> = ({ 
  onClick, 
  label = '返回上一级' 
}) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center text-xs text-[rgba(10,27,57,0.8)] hover:text-[#2761CB] transition-colors"
    >
      <ChevronLeft className="w-3 h-3 mr-1" />
      {label}
    </button>
  );
};
```

---

### 3.4 页面顶部间距规范

| 元素 | 上边距 | 说明 |
|------|--------|------|
| **面包屑** | `24px` | 距离页面顶部或 Header |
| **"返回上一级"** | `24px` | 距离页面顶部 |
| **标题（有面包屑）** | `48px` | 距离面包屑 |
| **标题（无面包屑）** | `48px` | 距离页面顶部 |

---

## 四、栅格系统

### 4.1 栅格系统概述

**使用 24 栅格系统**

| 参数 | 数值 | 说明 |
|------|------|------|
| **栅格数** | `24` | 总共 24 列 |
| **Gutter（槽宽）** | `24px` | 固定，列与列之间的间距 |
| **Column（列宽）** | `Auto` | 动态缩放 |

---

### 4.2 栅格计算公式

**基本公式**：
```
1 列 = 1 Gutter + 1 Column
```

**总宽度计算**：
```
总宽度 = 23 Gutter + 24 Column
总宽度 = 23 × 24px + 24 × Column
```

**当总宽度为 1200px 时**：
```
1200px = 23 × 24px + 24 × Column
1200px = 552px + 24 × Column
24 × Column = 648px
Column ≈ 27px
```

**验证**：
```
总宽度 = 23 × 24px + 24 × 27px
       = 552px + 648px
       = 1200px ✅
```

---

### 4.3 栅格使用规范

#### 4.3.1 单列宽度

```
1 列 = 1 Gutter (24px) + 1 Column (27px) = 51px
```

#### 4.3.2 多列宽度

| 列数 | 计算公式 | 宽度（1200px 总宽） |
|------|---------|---------------------|
| **1 列** | 1 Gutter + 1 Column | 51px |
| **2 列** | 2 Gutter + 2 Column | 102px |
| **4 列** | 4 Gutter + 4 Column | 204px |
| **6 列** | 6 Gutter + 6 Column | 306px |
| **8 列** | 8 Gutter + 8 Column | 408px |
| **12 列** | 12 Gutter + 12 Column | 612px |
| **16 列** | 16 Gutter + 16 Column | 816px |
| **24 列** | 23 Gutter + 24 Column | 1200px |

---

### 4.4 CSS Grid 实现

```css
.grid-24 {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 24px; /* Gutter */
  width: 1200px;
  margin: 0 auto;
}

/* 占用 6 列 */
.col-6 {
  grid-column: span 6;
}

/* 占用 12 列 */
.col-12 {
  grid-column: span 12;
}

/* 占用 24 列（全宽） */
.col-24 {
  grid-column: span 24;
}
```

---

### 4.5 Tailwind CSS 实现

```html
<!-- 24 栅格容器 -->
<div class="grid grid-cols-24 gap-6 w-[1200px] mx-auto">
  <!-- 占用 6 列 -->
  <div class="col-span-6">内容</div>
  
  <!-- 占用 12 列 -->
  <div class="col-span-12">内容</div>
  
  <!-- 占用 6 列 -->
  <div class="col-span-6">内容</div>
</div>
```

**注意**：Tailwind 默认最多支持 12 列，需要自定义配置支持 24 列：

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
      },
      gridColumn: {
        'span-13': 'span 13 / span 13',
        'span-14': 'span 14 / span 14',
        'span-15': 'span 15 / span 15',
        'span-16': 'span 16 / span 16',
        'span-17': 'span 17 / span 17',
        'span-18': 'span 18 / span 18',
        'span-19': 'span 19 / span 19',
        'span-20': 'span 20 / span 20',
        'span-21': 'span 21 / span 21',
        'span-22': 'span 22 / span 22',
        'span-23': 'span 23 / span 23',
        'span-24': 'span 24 / span 24',
      },
    },
  },
};
```

---

### 4.6 React 组件示例

```tsx
import React from 'react';
import clsx from 'clsx';

interface GridProps {
  children: React.ReactNode;
  columns?: number; // 默认 24
  gap?: number; // 默认 24px
  className?: string;
}

export const Grid: React.FC<GridProps> = ({ 
  children, 
  columns = 24,
  gap = 24,
  className 
}) => {
  return (
    <div
      className={clsx('grid w-[1200px] mx-auto', className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
};

interface ColProps {
  children: React.ReactNode;
  span: number; // 占用列数
  className?: string;
}

export const Col: React.FC<ColProps> = ({ children, span, className }) => {
  return (
    <div
      className={className}
      style={{ gridColumn: `span ${span}` }}
    >
      {children}
    </div>
  );
};

// 使用示例
<Grid>
  <Col span={6}>左侧内容（6列）</Col>
  <Col span={12}>中间内容（12列）</Col>
  <Col span={6}>右侧内容（6列）</Col>
</Grid>
```

---

### 4.7 响应式栅格

```tsx
import React from 'react';
import clsx from 'clsx';

interface ResponsiveColProps {
  children: React.ReactNode;
  xs?: number; // < 768px
  md?: number; // 768px ~ 1279px
  lg?: number; // ≥ 1280px
  className?: string;
}

export const ResponsiveCol: React.FC<ResponsiveColProps> = ({ 
  children, 
  xs = 24,
  md = 12,
  lg = 6,
  className 
}) => {
  return (
    <div
      className={clsx(
        `col-span-${xs}`,
        `md:col-span-${md}`,
        `lg:col-span-${lg}`,
        className
      )}
    >
      {children}
    </div>
  );
};

// 使用示例
<Grid>
  <ResponsiveCol xs={24} md={12} lg={6}>
    响应式列（移动端全宽，平板半宽，桌面 1/4 宽）
  </ResponsiveCol>
  <ResponsiveCol xs={24} md={12} lg={18}>
    响应式列（移动端全宽，平板半宽，桌面 3/4 宽）
  </ResponsiveCol>
</Grid>
```

---

## 五、信息区块划分

### 5.1 区块排列原则

**核心原则**：
- ✅ **横向排列的区块不超过 4 个**
- ✅ 横向排列的区块可以有 **1:1**、**1:2**、**1:3**、**1:1:1** 等多种比例

---

### 5.2 常用比例

#### 5.2.1 等分布局（1:1）

**适用场景**：两个同等重要的内容区

```html
<!-- 2 等分 -->
<div class="grid grid-cols-2 gap-6">
  <div>内容 A（12列）</div>
  <div>内容 B（12列）</div>
</div>
```

**栅格**：每个区块占 **12 列**

---

#### 5.2.2 主次布局（2:1 或 1:2）

**适用场景**：主内容区 + 侧边栏

```html
<!-- 2:1 布局 -->
<div class="grid grid-cols-3 gap-6">
  <div class="col-span-2">主内容（16列）</div>
  <div class="col-span-1">侧边栏（8列）</div>
</div>
```

**栅格**：
- 主内容：**16 列**
- 侧边栏：**8 列**

---

#### 5.2.3 主辅布局（3:1 或 1:3）

**适用场景**：内容 + 小工具栏

```html
<!-- 3:1 布局 -->
<div class="grid grid-cols-4 gap-6">
  <div class="col-span-3">主内容（18列）</div>
  <div class="col-span-1">辅助区（6列）</div>
</div>
```

**栅格**：
- 主内容：**18 列**
- 辅助区：**6 列**

---

#### 5.2.4 三等分布局（1:1:1）

**适用场景**：三个同等重要的内容区

```html
<!-- 3 等分 -->
<div class="grid grid-cols-3 gap-6">
  <div>内容 A（8列）</div>
  <div>内容 B（8列）</div>
  <div>内容 C（8列）</div>
</div>
```

**栅格**：每个区块占 **8 列**

---

#### 5.2.5 四等分布局（1:1:1:1）⭐ 最大推荐

**适用场景**：四个同等重要的内容区（卡片、统计面板）

```html
<!-- 4 等分 -->
<div class="grid grid-cols-4 gap-6">
  <div>内容 A（6列）</div>
  <div>内容 B（6列）</div>
  <div>内容 C（6列）</div>
  <div>内容 D（6列）</div>
</div>
```

**栅格**：每个区块占 **6 列**

---

### 5.3 区块间距规范

| 场景 | 间距 | 说明 |
|------|------|------|
| **横向区块间距** | `24px` | 使用 Gutter |
| **纵向区块间距** | `24px` | 与横向保持一致 |
| **区块内边距** | `16px` | 区块内部内容的边距 |

---

### 5.4 区块组合示例

#### 示例 1：仪表盘布局（1:1 + 1:2 + 1:1:1:1）

```html
<div class="grid grid-cols-24 gap-6 w-[1200px] mx-auto">
  <!-- 第一行：2 等分 -->
  <div class="col-span-12">统计卡片 A</div>
  <div class="col-span-12">统计卡片 B</div>
  
  <!-- 第二行：2:1 布局 -->
  <div class="col-span-16">主图表</div>
  <div class="col-span-8">辅助信息</div>
  
  <!-- 第三行：4 等分 -->
  <div class="col-span-6">卡片 A</div>
  <div class="col-span-6">卡片 B</div>
  <div class="col-span-6">卡片 C</div>
  <div class="col-span-6">卡片 D</div>
</div>
```

---

#### 示例 2：内容详情页（3:1 布局）

```html
<div class="grid grid-cols-4 gap-6 w-[1200px] mx-auto">
  <!-- 主内容区 -->
  <div class="col-span-3">
    <h1>文章标题</h1>
    <article>文章内容...</article>
  </div>
  
  <!-- 侧边栏 -->
  <aside class="col-span-1">
    <div>相关文章</div>
    <div>作者信息</div>
  </aside>
</div>
```

---

### 5.5 区块设计检查清单

设计阶段：
- [ ] 确认横向区块数量（不超过 4 个）
- [ ] 确认区块比例（1:1、1:2、1:3 等）
- [ ] 确认区块间距（24px）
- [ ] 确认区块内边距（16px）

开发阶段：
- [ ] 使用 24 栅格系统
- [ ] 使用统一的 Gutter（24px）
- [ ] 使用响应式布局（移动端堆叠）
- [ ] 验证区块在不同屏幕尺寸下的表现

---

## 六、页面间距规范

### 6.1 垂直间距

| 场景 | 间距 | 说明 |
|------|------|------|
| **页面顶部 → 面包屑** | `24px` | - |
| **面包屑 → 标题** | `48px` | 或面包屑下边距 16px + 标题上边距 32px |
| **标题 → 内容** | `24px` | - |
| **内容区 → Footer** | `100px` | Footer 上方留白 |

---

### 6.2 水平间距

| 场景 | 间距 | 说明 |
|------|------|------|
| **Sider → Content** | `24px` | 左右布局 |
| **页面左右边距** | `24px` | 固定宽度布局 |
| **区块间距（横向）** | `24px` | 使用 Gutter |

---

### 6.3 间距速查表

| 间距名称 | 数值 | 使用场景 |
|---------|------|---------|
| **XS** | `4px` | 图标与文字间距 |
| **SM** | `8px` | 列表项内部间距 |
| **MD** | `16px` | 区块内边距 |
| **LG** | `24px` | 区块间距、Gutter、页面边距 ⭐ **最常用** |
| **XL** | `48px` | 面包屑与标题间距 |
| **2XL** | `100px` | Footer 上方留白 |

---

## 七、完整页面示例

### 7.1 带侧边栏的管理后台页面

```tsx
import React from 'react';

export const AdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#F2F4F8]">
      {/* Sider - 240px 固定宽度 */}
      <aside className="w-[240px] bg-white">
        <div className="p-4">
          <h2 className="text-lg font-medium">导航菜单</h2>
          <nav className="mt-4 space-y-2">
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-100">
              首页
            </a>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-100">
              项目管理
            </a>
            <a href="#" className="block px-4 py-2 rounded hover:bg-gray-100">
              数据统计
            </a>
          </nav>
        </div>
      </aside>
      
      {/* Content - 动态宽度 */}
      <main className="flex-1 ml-6 p-6 overflow-auto">
        {/* 面包屑 */}
        <nav className="mb-4 text-xs text-[rgba(10,27,57,0.8)]">
          首页 / 项目管理 / 项目详情
        </nav>
        
        {/* 标题 */}
        <h1 className="text-2xl font-medium text-[#0A1B39] mt-12 mb-6">
          项目详情
        </h1>
        
        {/* 内容区 */}
        <div className="grid grid-cols-24 gap-6">
          <div className="col-span-16 bg-white p-4 rounded">
            主内容区
          </div>
          <div className="col-span-8 bg-white p-4 rounded">
            侧边栏
          </div>
        </div>
      </main>
    </div>
  );
};
```

---

### 7.2 固定宽度的内容页

```tsx
import React from 'react';

export const ContentLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F2F4F8]">
      {/* Header */}
      <header className="h-16 bg-[#0A1B39]">
        <div className="w-[1200px] mx-auto h-full flex items-center px-6">
          <h1 className="text-white text-lg">网站标题</h1>
        </div>
      </header>
      
      {/* Content - 1200px 固定宽度 */}
      <main className="w-[1200px] mx-auto p-6">
        {/* 面包屑 */}
        <nav className="mt-6 mb-4 text-xs text-[rgba(10,27,57,0.8)]">
          首页 / 文章列表 / 文章详情
        </nav>
        
        {/* 标题 */}
        <h1 className="text-2xl font-medium text-[#0A1B39] mt-12 mb-6">
          文章标题
        </h1>
        
        {/* 内容区 */}
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3 bg-white p-6 rounded">
            <article>文章内容...</article>
          </div>
          <aside className="col-span-1 bg-white p-6 rounded">
            相关推荐
          </aside>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="h-16 bg-[#0A1B39] mt-[100px]">
        <div className="w-[1200px] mx-auto h-full flex items-center justify-center px-6">
          <p className="text-white text-sm">© 2024 公司名称</p>
        </div>
      </footer>
    </div>
  );
};
```

---

## 八、设计检查清单

### 设计阶段

- [ ] 确定布局方式（左右布局/上下布局）
- [ ] 确定内容区宽度（240px Sider + Auto / 1200px 固定）
- [ ] 确定栅格系统（24 栅格，Gutter 24px）
- [ ] 确定区块数量（横向不超过 4 个）
- [ ] 确定区块比例（1:1、1:2、1:3 等）
- [ ] 确认面包屑位置和样式
- [ ] 确认标题层级和间距

### 开发阶段

- [ ] 使用统一的布局组件
- [ ] 使用 24 栅格系统
- [ ] 使用统一的间距（24px）
- [ ] 实现响应式适配
- [ ] 验证不同屏幕尺寸下的表现

### 测试阶段

- [ ] 测试 1280px 屏幕
- [ ] 测试 1366px 屏幕
- [ ] 测试 1440px 屏幕
- [ ] 测试 1920px 屏幕
- [ ] 测试移动端（< 768px）
- [ ] 验证间距一致性

---

## 九、常见问题（FAQ）

### Q1：为什么选择 1200px 作为内容宽度？

**A**：
- ✅ 1200px 是最常见的内容宽度，适配大多数屏幕尺寸
- ✅ 在 1280px、1366px、1440px 屏幕上居中显示，视觉舒适
- ✅ 便于使用 24 栅格系统（1200 ÷ 24 = 50）

---

### Q2：为什么 Sider 宽度是 240px？

**A**：
- ✅ 240px 足够容纳 2-3 级导航菜单
- ✅ 240px = 10 × 24px，与间距系统一致
- ✅ 在 1280px 屏幕上，240px Sider + 24px 间距 + 1016px Content = 1280px

---

### Q3：为什么使用 24 栅格而不是 12 栅格？

**A**：
- ✅ 24 栅格更灵活，可以实现更多比例（6列、8列、12列、16列等）
- ✅ 12 栅格只能实现有限的比例（3列、4列、6列）
- ✅ 24 栅格与 1200px 宽度配合良好（1200 ÷ 24 = 50）

---

### Q4：Gutter 为什么固定为 24px？

**A**：
- ✅ 24px 是常见的间距单位，视觉舒适
- ✅ 24px = 6 × 4px，与 Tailwind 默认间距系统一致
- ✅ 固定 Gutter 便于保持视觉一致性

---

### Q5：横向区块为什么不超过 4 个？

**A**：
- ✅ 4 个区块是人眼可以快速扫描的极限
- ✅ 超过 4 个区块会导致视觉拥挤，信息过载
- ✅ 移动端响应式时，4 个区块可以 2×2 排列

---

### Q6：如何在移动端适配栅格系统？

**A**：
```tsx
// 响应式栅格
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div>区块 1</div>
  <div>区块 2</div>
  <div>区块 3</div>
  <div>区块 4</div>
</div>
```

- 移动端（< 768px）：1 列（堆叠）
- 平板（768px ~ 1279px）：2 列
- 桌面（≥ 1280px）：4 列

---

## 十、最佳实践总结

### 10.1 核心原则

1. **布局统一**：使用统一的布局方式（左右/上下）
2. **宽度统一**：内容区宽度 1200px 或 Sider 240px
3. **栅格统一**：24 栅格系统，Gutter 24px
4. **间距统一**：页面边距、区块间距统一为 24px
5. **比例合理**：横向区块不超过 4 个，使用合理比例

---

### 10.2 快速决策指南

**需要侧边栏** → **左右布局**（Sider 240px + Content Auto）  
**内容展示页** → **上下布局**（Content 1200px 固定）  
**特殊需求** → **上下布局**（Content W1~W2 可变）

---

### 10.3 记忆口诀

```
左右布局 Sider 240 - 导航固定内容活
上下布局宽 1200 - 内容居中视觉好
栅格系统用 24 列 - Gutter 固定 Column 活
横向区块不超 4 - 比例合理不拥挤
间距统一都用 24 - 页面整洁又清爽
```

---

**提供日期**：2024-12-20  
**状态**：✅ 已完整创建（基于 Figma 导入数据）  
**来源**：SENSORO 设计规范 / Lins 4.0

---

**设计出处**：SENSORO 设计规范 / Lins 4.0  
**设计理念**："协助进行页面级整体布局"
