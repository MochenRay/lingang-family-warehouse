# Spacing 间距规范

## 来源
SENSORO 设计规范 / Lins 4.0

## 设计理念
设置组件之间的间距。

---

## 一、间距系统概述

### 1.1 核心原则

**8n 原则**：所有间距都应该是 **8 的倍数**（8n，n 为自然数）

**推荐档位**：5 个标准间距  
- `4px` (0.5 × 8)
- `8px` (1 × 8)
- `12px` (1.5 × 8)
- `16px` (2 × 8)
- `24px` (3 × 8)

**注意**：虽然 4px 不是 8 的倍数，但作为最小间距单位，在实际应用中非常常见（如图标与文字间距）。

---

### 1.2 设计哲学

> "空间留白是设计语言的一部分，合理的间距能够提升内容的可读性和视觉层次感。"

**间距的作用**：
1. ✅ **建立层级**：不同间距表达不同的关联强度
2. ✅ **提升可读性**：适当留白让内容更易阅读
3. ✅ **统一风格**：标准间距保持设计一致性
4. ✅ **响应式友好**：基于 8n 原则易于缩放

---

## 二、间距档位详解

### 2.1 间距档位表（5个标准档位）

| 档位 | 数值 | Tailwind 类 | 用途 | 使用频率 |
|------|------|------------|------|---------|
| **XS** | `4px` | `gap-1`, `p-1`, `m-1` | 图标与文字、紧密元素 | ⭐⭐⭐ 常用 |
| **SM** | `8px` | `gap-2`, `p-2`, `m-2` | 标签间距、列表项内部 | ⭐⭐⭐⭐⭐ **最常用** |
| **MD** | `12px` | `gap-3`, `p-3`, `m-3` | 按钮内边距（小）、表单元素 | ⭐⭐⭐ 常用 |
| **LG** | `16px` | `gap-4`, `p-4`, `m-4` | 区块内边距、卡片内边距 | ⭐⭐⭐⭐ 很常用 |
| **XL** | `24px` | `gap-6`, `p-6`, `m-6` | 区块间距、栅格Gutter、页面边距 | ⭐⭐⭐⭐⭐ **最常用** |

**注意**：Tailwind 的间距单位是 `0.25rem` 的倍数（1 = 4px），因此：
- `gap-1` = 4px
- `gap-2` = 8px
- `gap-3` = 12px
- `gap-4` = 16px
- `gap-6` = 24px

---

### 2.2 扩展间距档位（可选）

如果需要更大的间距，可以使用以下档位（仍遵循 8n 原则）：

| 档位 | 数值 | Tailwind 类 | 用途 |
|------|------|------------|------|
| **2XL** | `32px` | `gap-8`, `p-8`, `m-8` | 大区块间距、卡片外边距 |
| **3XL** | `48px` | `gap-12`, `p-12`, `m-12` | 面包屑与标题、章节间距 |
| **4XL** | `64px` | `gap-16`, `p-16`, `m-16` | 大章节间距 |
| **5XL** | `100px` | `gap-25`, `p-25`, `m-25` | Footer 上方留白、特大间距 |

---

## 三、间距使用场景

### 3.1 水平间距（Horizontal Spacing）

**定义**：元素在横向排列时的间距

#### 场景 1：标签横向排列（8px）

```html
<!-- 标签水平间距：8px -->
<div class="flex gap-2">
  <span class="tag">标签1</span>
  <span class="tag">标签2</span>
  <span class="tag">标签3</span>
</div>
```

**CSS 示例**：
```css
.tag-container {
  display: flex;
  gap: 8px; /* 水平间距 */
}
```

---

#### 场景 2：按钮组横向排列（8px 或 16px）

```html
<!-- 按钮组间距：8px（紧密） -->
<div class="flex gap-2">
  <button>确定</button>
  <button>取消</button>
</div>

<!-- 按钮组间距：16px（宽松） -->
<div class="flex gap-4">
  <button>保存</button>
  <button>取消</button>
</div>
```

---

#### 场景 3：统计卡片横向排列（24px 或 32px）

```html
<!-- 卡片间距：24px -->
<div class="grid grid-cols-3 gap-6">
  <div class="card">卡片1</div>
  <div class="card">卡片2</div>
  <div class="card">卡片3</div>
</div>
```

---

### 3.2 垂直间距（Vertical Spacing）

**定义**：元素在纵向排列时的间距

#### 场景 1：列表项垂直间距（8px）

```html
<!-- 列表项间距：8px -->
<ul class="space-y-2">
  <li>列表项1</li>
  <li>列表项2</li>
  <li>列表项3</li>
</ul>
```

**CSS 示例**：
```css
.list-item + .list-item {
  margin-top: 8px; /* 垂直间距 */
}
```

---

#### 场景 2：表单字段垂直间距（16px 或 24px）

```html
<!-- 表单字段间距：16px -->
<form class="space-y-4">
  <div class="form-field">
    <label>用户名</label>
    <input type="text" />
  </div>
  <div class="form-field">
    <label>密码</label>
    <input type="password" />
  </div>
</form>
```

---

#### 场景 3：区块垂直间距（24px 或 48px）

```html
<!-- 区块间距：24px -->
<div class="space-y-6">
  <section class="section">区块1</section>
  <section class="section">区块2</section>
  <section class="section">区块3</section>
</div>
```

---

### 3.3 环绕间距（Wrap Spacing）

**定义**：元素在多行排列时，同时具有横向和纵向间距

#### 场景：标签云、标签墙（8px × 8px）

```html
<!-- 环绕间距：8px 横向 + 8px 纵向 -->
<div class="flex flex-wrap gap-2">
  <span class="tag">标签1</span>
  <span class="tag">标签2</span>
  <span class="tag">标签3</span>
  <span class="tag">标签4</span>
  <span class="tag">标签5</span>
  <span class="tag">标签6</span>
  <span class="tag">标签7</span>
  <span class="tag">标签8</span>
</div>
```

**CSS 示例**：
```css
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px; /* 同时设置横向和纵向间距 */
}
```

---

### 3.4 分隔符间距（Divider Spacing）

**定义**：在相邻元素之间设置分隔符时的间距

#### 场景：统计数字之间的分隔线（32px）

```html
<!-- 统计数字 + 分隔线 -->
<div class="flex items-center">
  <div class="stat-item">
    <div class="stat-value">1,995,245</div>
    <div class="stat-label">累计登记车辆</div>
  </div>
  
  <!-- 分隔线，左右各 16px 间距 -->
  <div class="divider mx-4"></div>
  
  <div class="stat-item">
    <div class="stat-value">351,669</div>
    <div class="stat-label">累计识别次数</div>
  </div>
  
  <div class="divider mx-4"></div>
  
  <div class="stat-item">
    <div class="stat-value">2,381,669</div>
    <div class="stat-label">累计识别车辆</div>
  </div>
</div>
```

**CSS 示例**：
```css
.divider {
  width: 1px;
  height: 40px;
  background: rgba(10, 27, 57, 0.08);
  margin: 0 16px; /* 左右各 16px */
}
```

---

## 四、组件内边距规范

### 4.1 按钮内边距

| 尺寸 | 高度 | 水平内边距 | 垂直内边距 |
|------|------|-----------|-----------|
| **小** | 24px | 8px | 计算得出 |
| **中** | 32px | 12px | 计算得出 |
| **大** | 40px | 16px | 计算得出 |

**示例**：
```html
<button class="px-2 py-1">小按钮</button>
<button class="px-3 py-2">中按钮</button>
<button class="px-4 py-2">大按钮</button>
```

---

### 4.2 卡片内边距

| 类型 | 内边距 | 说明 |
|------|--------|------|
| **紧凑卡片** | 12px | 信息密集型卡片 |
| **常规卡片** | 16px | 最常用 ⭐ |
| **宽松卡片** | 24px | 内容较少的卡片 |

**示例**：
```html
<div class="card p-3">紧凑卡片（12px）</div>
<div class="card p-4">常规卡片（16px）</div>
<div class="card p-6">宽松卡片（24px）</div>
```

---

### 4.3 输入框内边距

| 尺寸 | 高度 | 水平内边距 | 垂直内边距 |
|------|------|-----------|-----------|
| **小** | 24px | 8px | 计算得出 |
| **中** | 32px | 12px | 计算得出 |
| **大** | 40px | 16px | 计算得出 |

**示例**：
```html
<input class="px-2 py-1" placeholder="小输入框" />
<input class="px-3 py-2" placeholder="中输入框" />
<input class="px-4 py-2" placeholder="大输入框" />
```

---

### 4.4 面板内边距

| 类型 | 内边距 | 说明 |
|------|--------|------|
| **侧边栏** | 16px | 导航面板、工具栏 |
| **内容面板** | 24px | 主内容区域 |
| **对话框** | 24px | Modal、Drawer |

**示例**：
```html
<aside class="sidebar p-4">侧边栏（16px）</aside>
<main class="content p-6">内容面板（24px）</main>
<div class="modal p-6">对话框（24px）</div>
```

---

## 五、组件外边距规范

### 5.1 组件间距

| 关系 | 间距 | 说明 |
|------|------|------|
| **紧密关联** | 4px | 图标与文字、标签内部 |
| **相关元素** | 8px | 同组按钮、标签列表 |
| **松散关联** | 16px | 表单字段、列表项 |
| **区块间距** | 24px | 卡片、面板、区域 ⭐ **最常用** |

---

### 5.2 页面级间距

| 场景 | 间距 | 说明 |
|------|------|------|
| **页面左右边距** | 24px | 内容与屏幕边缘 |
| **面包屑 → 标题** | 48px | 页面顶部导航 |
| **标题 → 内容** | 24px | 标题与内容区 |
| **Footer 上方** | 100px | Footer 上方留白 |

---

## 六、间距速查表

### 6.1 按用途分类

| 用途 | 推荐间距 | 备选间距 |
|------|---------|---------|
| **图标 ↔ 文字** | 4px | - |
| **标签间距** | 8px | 12px |
| **按钮间距** | 8px | 16px |
| **列表项间距** | 8px | 16px |
| **表单字段间距** | 16px | 24px |
| **卡片间距** | 24px | 32px |
| **区块间距** | 24px | 32px |
| **页面边距** | 24px | - |
| **栅格Gutter** | 24px | - |
| **章节间距** | 48px | 64px |
| **Footer留白** | 100px | - |

---

### 6.2 按间距大小分类

| 间距 | 主要用途 | 次要用途 |
|------|---------|---------|
| **4px** | 图标与文字 | 紧密元素 |
| **8px** | 标签间距、按钮间距 ⭐ | 列表项内部 |
| **12px** | 按钮内边距（小） | 紧凑布局 |
| **16px** | 卡片内边距、表单字段 ⭐ | 列表项间距 |
| **24px** | 区块间距、栅格Gutter ⭐⭐ | 页面边距 |
| **32px** | 大卡片间距 | 分隔符间距 |
| **48px** | 面包屑与标题 | 大章节间距 |
| **64px** | 特大章节间距 | - |
| **100px** | Footer 上方留白 | 特殊场景 |

---

## 七、React 组件示例

### 7.1 水平间距组件

```tsx
import React from 'react';
import clsx from 'clsx';

interface HorizontalSpaceProps {
  children: React.ReactNode;
  gap?: 4 | 8 | 12 | 16 | 24 | 32;
  className?: string;
}

export const HorizontalSpace: React.FC<HorizontalSpaceProps> = ({ 
  children, 
  gap = 8,
  className 
}) => {
  const gapClass = {
    4: 'gap-1',
    8: 'gap-2',
    12: 'gap-3',
    16: 'gap-4',
    24: 'gap-6',
    32: 'gap-8',
  }[gap];

  return (
    <div className={clsx('flex', gapClass, className)}>
      {children}
    </div>
  );
};

// 使用示例
<HorizontalSpace gap={8}>
  <span className="tag">标签1</span>
  <span className="tag">标签2</span>
  <span className="tag">标签3</span>
</HorizontalSpace>
```

---

### 7.2 垂直间距组件

```tsx
import React from 'react';
import clsx from 'clsx';

interface VerticalSpaceProps {
  children: React.ReactNode;
  gap?: 4 | 8 | 12 | 16 | 24 | 32;
  className?: string;
}

export const VerticalSpace: React.FC<VerticalSpaceProps> = ({ 
  children, 
  gap = 8,
  className 
}) => {
  const gapClass = {
    4: 'space-y-1',
    8: 'space-y-2',
    12: 'space-y-3',
    16: 'space-y-4',
    24: 'space-y-6',
    32: 'space-y-8',
  }[gap];

  return (
    <div className={clsx(gapClass, className)}>
      {children}
    </div>
  );
};

// 使用示例
<VerticalSpace gap={16}>
  <div className="form-field">字段1</div>
  <div className="form-field">字段2</div>
  <div className="form-field">字段3</div>
</VerticalSpace>
```

---

### 7.3 环绕间距组件

```tsx
import React from 'react';
import clsx from 'clsx';

interface WrapSpaceProps {
  children: React.ReactNode;
  gap?: 4 | 8 | 12 | 16 | 24;
  className?: string;
}

export const WrapSpace: React.FC<WrapSpaceProps> = ({ 
  children, 
  gap = 8,
  className 
}) => {
  const gapClass = {
    4: 'gap-1',
    8: 'gap-2',
    12: 'gap-3',
    16: 'gap-4',
    24: 'gap-6',
  }[gap];

  return (
    <div className={clsx('flex flex-wrap', gapClass, className)}>
      {children}
    </div>
  );
};

// 使用示例
<WrapSpace gap={8}>
  <span className="tag">标签1</span>
  <span className="tag">标签2</span>
  <span className="tag">标签3</span>
  <span className="tag">标签4</span>
  <span className="tag">标签5</span>
  <span className="tag">标签6</span>
</WrapSpace>
```

---

### 7.4 分隔符组件

```tsx
import React from 'react';
import clsx from 'clsx';

interface DividerProps {
  direction?: 'horizontal' | 'vertical';
  spacing?: 8 | 16 | 24 | 32;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ 
  direction = 'vertical',
  spacing = 16,
  className 
}) => {
  const spacingClass = {
    8: direction === 'vertical' ? 'mx-2' : 'my-2',
    16: direction === 'vertical' ? 'mx-4' : 'my-4',
    24: direction === 'vertical' ? 'mx-6' : 'my-6',
    32: direction === 'vertical' ? 'mx-8' : 'my-8',
  }[spacing];

  return (
    <div
      className={clsx(
        'bg-[rgba(10,27,57,0.08)]',
        direction === 'vertical' ? 'w-px h-10' : 'h-px w-full',
        spacingClass,
        className
      )}
    />
  );
};

// 使用示例
<div className="flex items-center">
  <div className="stat">统计1</div>
  <Divider spacing={16} />
  <div className="stat">统计2</div>
  <Divider spacing={16} />
  <div className="stat">统计3</div>
</div>
```

---

## 八、Tailwind CSS 配置

### 8.1 默认间距配置（基本够用）

Tailwind 默认间距已经覆盖了我们需要的大部分档位：

```javascript
// Tailwind 默认间距（部分）
{
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  25: '6.25rem', // 100px
}
```

---

### 8.2 自定义间距配置（可选）

如果需要更语义化的命名：

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
        '5xl': '100px',
      },
      gap: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
    },
  },
};
```

**使用示例**：
```html
<div class="gap-sm">8px 间距</div>
<div class="gap-lg">16px 间距</div>
<div class="p-xl">24px 内边距</div>
```

---

## 九、响应式间距

### 9.1 断点间距调整

在不同屏幕尺寸下，可以调整间距大小：

```html
<!-- 移动端 8px，桌面端 16px -->
<div class="gap-2 md:gap-4">
  <div>内容1</div>
  <div>内容2</div>
</div>

<!-- 移动端 16px 内边距，桌面端 24px 内边距 -->
<div class="p-4 md:p-6">
  卡片内容
</div>
```

---

### 9.2 响应式间距建议

| 断点 | 屏幕宽度 | 间距调整建议 |
|------|---------|-------------|
| **Mobile** | < 768px | 使用较小间距（8px, 12px, 16px） |
| **Tablet** | 768px ~ 1279px | 使用中等间距（12px, 16px, 24px） |
| **Desktop** | ≥ 1280px | 使用较大间距（16px, 24px, 32px） |

---

## 十、设计检查清单

### 设计阶段

- [ ] 确认所有间距都符合 8n 原则（或使用 4px）
- [ ] 确认水平间距一致性
- [ ] 确认垂直间距一致性
- [ ] 确认组件内边距符合规范
- [ ] 确认页面级间距符合规范

### 开发阶段

- [ ] 使用 Tailwind 预定义间距类
- [ ] 避免自定义非规范间距值
- [ ] 使用 `gap` 而不是 `margin`（推荐）
- [ ] 检查响应式间距适配

### 测试阶段

- [ ] 检查各屏幕尺寸下的间距
- [ ] 验证内容溢出情况
- [ ] 确认视觉层次清晰
- [ ] 测试可读性和舒适度

---

## 十一、常见问题（FAQ）

### Q1：为什么使用 8n ��则？

**A**：
- ✅ 8 是 2 的三次方，便于缩放和响应式设计
- ✅ 8px 在大多数屏幕分辨率下都能精确渲染
- ✅ 8 的倍数可以整除常见的组件尺寸（16, 24, 32, 40, 48）
- ✅ 符合人眼对空间的感知习惯

---

### Q2：为什么 4px 不是 8 的倍数也被包含？

**A**：
- 4px 是最小的视觉可感知间距
- 图标与文字间距通常使用 4px（更紧凑）
- 4px = 0.5 × 8，仍然符合缩放规律
- 在实际应用中，4px 非常常见且必要

---

### Q3：什么时候使用 8px，什么时候使用 16px？

**A**：

**8px**：
- 标签之间的间距
- 按钮组之间的间距
- 列表项内部的间距
- 紧密关联的元素

**16px**：
- 卡片内边距
- 表单字段之间的间距
- 列表项之间的间距
- 松散关联的元素

**判断标准**：关联越强，间距越小

---

### Q4：组件间距应该用 `gap` 还是 `margin`？

**A**：

**推荐使用 `gap`**（Flexbox/Grid）：
```html
<div class="flex gap-4">
  <div>内容1</div>
  <div>内容2</div>
</div>
```

**优点**：
- ✅ 更简洁，不需要 `:not(:last-child)`
- ✅ 自动处理换行
- ✅ 更易维护

**使用 `margin`**（传统方式）：
```css
.item + .item {
  margin-left: 16px;
}
```

**缺点**：
- ❌ 需要选择器处理最后一个元素
- ❌ 换行需要额外处理
- ❌ 代码更冗长

---

### Q5：卡片内边距应该用 16px 还是 24px？

**A**：

**16px**（常规卡片）⭐ **推荐**：
- 信息密集型卡片
- 列表型卡片
- 小卡片

**24px**（宽松卡片）：
- 内容较少的卡片
- 强调型卡片
- 大卡片

**判断标准**：内容越多，内边距越小

---

### Q6：移动端间距应该如何调整？

**A**：

**原则**：移动端间距相对桌面端缩小 50%-75%

```html
<!-- 桌面端 24px，移动端 16px -->
<div class="gap-4 md:gap-6">
  <div>内容1</div>
  <div>内容2</div>
</div>

<!-- 桌面端 24px 内边距，移动端 16px 内边距 -->
<div class="p-4 md:p-6">
  卡片内容
</div>
```

---

## 十二、最佳实践总结

### 12.1 核心原则

1. **遵循 8n 原则**：所有间距都是 8 的倍数（或 4px）
2. **使用标准档位**：优先使用 4px, 8px, 12px, 16px, 24px
3. **保持一致性**：同类元素使用相同间距
4. **层级清晰**：关联越强，间距越小

---

### 12.2 快速决策指南

**图标 ↔ 文字** → **4px**  
**标签间距** → **8px**  
**按钮间距** → **8px** 或 **16px**  
**列表项间距** → **8px** 或 **16px**  
**表单字段间距** → **16px**  
**卡片内边距** → **16px**  
**区块间距** → **24px** ⭐ **最常用**  
**栅格Gutter** → **24px**  
**页面边距** → **24px**  
**面包屑 → 标题** → **48px**  
**Footer 上方** → **100px**

---

### 12.3 记忆口诀

```
图标文字 4px 近
标签按钮 8px 齐
表单卡片 16px 宜
区块栅格 24px 立
章节标题 48px 隔
页脚留白 100px 息
```

---

## 十三、与其他规范的配合

### 13.1 间距 + 圆角

```css
.card {
  padding: 16px;       /* 间距 */
  border-radius: 2px;  /* 圆角 */
}
```

**原则**：内边距应该 ≥ 圆角，避免内容贴边

---

### 13.2 间距 + 阴影

```css
.card {
  padding: 16px;       /* 间距 */
  box-shadow: ...;     /* 阴影 */
  margin: 24px;        /* 外边距，为阴影留空间 */
}
```

**原则**：有阴影的元素外边距应该适当增加

---

### 13.3 间距 + 栅格

```html
<div class="grid grid-cols-3 gap-6">
  <!-- gap-6 = 24px = Gutter -->
  <div class="p-4">卡片1（内边距 16px）</div>
  <div class="p-4">卡片2（内边距 16px）</div>
  <div class="p-4">卡片3（内边距 16px）</div>
</div>
```

**原则**：栅格 Gutter（24px）> 卡片内边距（16px）

---

## 十四、间距视觉示例

### 14.1 水平间距示例

```
标签1  ←8px→  标签2  ←8px→  标签3
```

### 14.2 垂直间距示例

```
列表项1
  ↓ 8px
列表项2
  ↓ 8px
列表项3
```

### 14.3 环绕间距示例

```
标签1  ←8px→  标签2  ←8px→  标签3
  ↓ 8px         ↓ 8px         ↓ 8px
标签4  ←8px→  标签5  ←8px→  标签6
```

### 14.4 分隔符间距示例

```
统计1  ←16px→ | ←16px→  统计2  ←16px→ | ←16px→  统计3
```

---

**提供日期**：2024-12-20  
**状态**：✅ 已完整创建（基于 Figma 导入数据）  
**来源**：SENSORO 设计规范 / Lins 4.0

---

**设计出处**：SENSORO 设计规范 / Lins 4.0  
**设计理念**："设置组件之间的间距，遵循 8n 原则，推荐使用 4px, 8px, 12px, 16px, 24px 五种标准档位"
