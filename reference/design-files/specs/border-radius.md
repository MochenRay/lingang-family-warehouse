# Border Radius 圆角规范

## 来源
SENSORO 设计规范 / Lins 4.0

## 设计理念
使用圆角来描述容器与界面元素的轮廓，从一定程度决定产品的视觉调性。

---

## 一、圆角分类（5种）

| 类型 | 默认值 | 用法 |
|------|--------|------|
| **小圆角** | `2px` | 用于 checkbox 内圆角、button、tag、tabs 等大多数组件 |
| **中圆角** | `4px` | 用于下拉框、穿梭框等菜单类组件 |
| **大圆角** | `8px` | 用于模态窗 |
| **全圆角** | `50%` | 用于头像，徽标等 |
| **全尺寸** | `9999px` | 用于创建全尺寸圆角，如胶囊标签等 |

---

## 二、详细规范

### 2.1 小圆角 - 2px ⭐ **最常用**

**数值**：`2px`  
**适用范围**：系统中大部分基础组件

**使用场景**：
- ✅ **按钮**：主要按钮、次要按钮、虚线按钮等
- ✅ **标签**：Tag 标签、Badge 徽标
- ✅ **标签页**：Tabs 标签页
- ✅ **输入框**：Input、TextArea、Select（选择框）
- ✅ **单选/多选框**：Checkbox 内圆角、Radio 按钮
- ✅ **卡片**：基础卡片、面板卡片
- ✅ **开关**：Switch 开关（容器）
- ✅ **进度条**：Progress 进度条
- ✅ **滑块**：Slider 滑块轨道

**CSS 示例**：
```css
.button,
.tag,
.input,
.checkbox,
.card {
  border-radius: 2px;
}
```

**Tailwind CSS**：
```html
<div class="rounded-[2px]">小圆角组件</div>
```

---

### 2.2 中圆角 - 4px

**数值**：`4px`  
**适用范围**：菜单类、下拉类、浮层类组件

**使用场景**：
- ✅ **下拉框**：Select 下拉菜单、Cascader 级联选择器菜单
- ✅ **穿梭框**：Transfer 穿梭框
- ✅ **菜单**：Dropdown 下拉菜单、Menu 菜单项
- ✅ **日期选择器**：DatePicker、TimePicker 弹出面板
- ✅ **Tooltip**：文字提示框
- ✅ **Popover**：气泡卡片
- ✅ **表格**：Table 表格容器
- ✅ **列表**：List 列表容器

**CSS 示例**：
```css
.dropdown-menu,
.cascader-menu,
.tooltip,
.popover,
.table {
  border-radius: 4px;
}
```

**Tailwind CSS**：
```html
<div class="rounded">中圆角组件（Tailwind默认4px）</div>
```

---

### 2.3 大圆角 - 8px

**数值**：`8px`  
**适用范围**：模态窗、对话框、大型容器

**使用场景**：
- ✅ **模态窗**：Modal 对话框
- ✅ **抽屉**：Drawer 抽屉
- ✅ **确认框**：Confirm 确认对话框
- ✅ **通知**：Notification 通知框
- ✅ **消息**：Message 全局提示
- ✅ **工具栏**：Toolbar 工具栏容器
- ✅ **大型面板**：大型数据展示面板

**CSS 示例**：
```css
.modal,
.drawer,
.notification,
.toolbar {
  border-radius: 8px;
}
```

**Tailwind CSS**：
```html
<div class="rounded-lg">大圆角组件（Tailwind lg = 8px）</div>
```

---

### 2.4 全圆角 - 50%

**数值**：`50%`  
**适用范围**：圆形元素

**使用场景**：
- ✅ **头像**：Avatar 头像
- ✅ **徽标**：Badge 数字徽标（圆形）
- ✅ **图标按钮**：圆形图标按钮
- ✅ **单选按钮**：Radio 单选框外圆
- ✅ **进度环**：圆形进度条
- ✅ **标记点**：地图标记点、时间轴节点

**CSS 示例**：
```css
.avatar,
.badge-circle,
.radio-outer,
.icon-button-circle {
  border-radius: 50%;
}
```

**Tailwind CSS**：
```html
<div class="rounded-full">全圆角组件</div>
```

---

### 2.5 全尺寸圆角 - 9999px

**数值**：`9999px`（或 `9999rem`）  
**适用范围**：胶囊形状元素

**使用场景**：
- ✅ **胶囊标签**：Pill 胶囊式标签
- ✅ **胶囊按钮**：Pill Button 胶囊按钮
- ✅ **状态标签**：Status Tag 状态胶囊
- ✅ **开关**：Switch 开关（整体形状）
- ✅ **搜索框**：Search Input 搜索输入框（可选）

**CSS 示例**：
```css
.pill,
.switch,
.capsule-button {
  border-radius: 9999px;
}
```

**Tailwind CSS**：
```html
<div class="rounded-full">胶囊组件（Tailwind full = 9999px）</div>
```

**注意**：`9999px` 和 `50%` 的区别：
- `50%`：创建正圆（宽高相等时）
- `9999px`：创建胶囊（宽高不等时，长边两端为半圆）

---

## 三、组件圆角速查表

### 3.1 基础组件

| 组件 | 圆角 | 说明 |
|------|------|------|
| **Button** | 2px | 所有类型按钮 |
| **Input** | 2px | 输入框 |
| **Select** | 2px | 选择框本身 |
| **Checkbox** | 2px | 复选框内圆角 |
| **Radio** | 50% | 单选框外圆 |
| **Switch** | 9999px | 开关整体 |
| **Tag** | 2px | 标签 |
| **Badge** | 2px / 50% | 方形徽标 / 圆形徽标 |

---

### 3.2 容器组件

| 组件 | 圆角 | 说明 |
|------|------|------|
| **Card** | 2px | 基础卡片 |
| **Panel** | 2px / 4px | 面板（根据层级） |
| **Modal** | 8px | 模态窗 |
| **Drawer** | 8px | 抽屉 |
| **Tooltip** | 4px | 文字提示 |
| **Popover** | 4px | 气泡卡片 |
| **Table** | 4px | 表格容器 |

---

### 3.3 菜单类组件

| 组件 | 圆角 | 说明 |
|------|------|------|
| **Dropdown** | 4px | 下拉菜单 |
| **Cascader** | 4px | 级联选择器菜单 |
| **DatePicker Panel** | 4px | 日期选择器面板 |
| **TimePicker Panel** | 4px | 时间选择器面板 |
| **Menu** | 4px | 菜单 |

---

### 3.4 反馈组件

| 组件 | 圆角 | 说明 |
|------|------|------|
| **Alert** | 2px | 警告提示 |
| **Message** | 8px | 全局消息 |
| **Notification** | 8px | 通知框 |
| **Confirm** | 8px | 确认对话框 |

---

### 3.5 导航组件

| 组件 | 圆角 | 说明 |
|------|------|------|
| **Tabs** | 2px | 标签页 |
| **Breadcrumb** | 2px | 面包屑项 |
| **Steps** | 50% | 步骤条节点 |
| **Menu** | 2px / 4px | 菜单项 / 菜单容器 |

---

### 3.6 数据展示组件

| 组件 | 圆角 | 说明 |
|------|------|------|
| **Avatar** | 50% | 头像 |
| **Progress** | 2px / 50% | 进度条 / 圆形进度 |
| **Slider** | 2px | 滑块轨道 |
| **Image** | 2px / 4px | 图片容器（可选） |

---

### 3.7 特殊组件

| 组件 | 圆角 | 说明 |
|------|------|------|
| **Pill Tag** | 9999px | 胶囊标签 |
| **Pill Button** | 9999px | 胶囊按钮 |
| **Search Input** | 9999px | 搜索框（可选） |
| **Toolbar** | 8px | 工具栏容器 |

---

## 四、使用原则

### 4.1 一致性原则

✅ **推荐做法**：
- 同类组件使用相同圆角
- 保持视觉层级一致
- 遵循规范定义的 5 个档位

❌ **避免做法**：
- 同一个组件使用多种圆角
- 自定义非规范圆角值（如 3px, 6px, 10px）
- 混用不同圆角档位

---

### 4.2 层级原则

**基础组件**（小圆角 2px）：
- 按钮、输入框、标签等最常用组件
- 视觉权重较低

**菜单类组件**（中圆角 4px）：
- 浮层、下拉菜单、提示框
- 视觉权重中等

**模态窗**（大圆角 8px）：
- 对话框、抽屉、通知
- 视觉权重最高

---

### 4.3 特殊形状原则

**圆形元素**（50%）：
- 头像、徽标、单选框
- 明确的圆形需求

**胶囊元素**（9999px）：
- 开关、胶囊标签、胶囊按钮
- 明确的胶囊形状需求

---

## 五、Tailwind CSS 配置

### 5.1 默认配置（基本够用）

Tailwind CSS 默认圆角配置：

```javascript
// Tailwind 默认圆角
{
  none: '0',
  sm: '0.125rem',  // 2px
  DEFAULT: '0.25rem',  // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',  // 8px
  xl: '0.75rem',  // 12px
  '2xl': '1rem',  // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',  // 全圆角
}
```

**映射关系**：
- 小圆角 2px → `rounded-sm` 或 `rounded-[2px]`
- 中圆角 4px → `rounded`
- 大圆角 8px → `rounded-lg`
- 全圆角 50% → `rounded-full`
- 全尺寸 9999px → `rounded-full`

---

### 5.2 自定义配置（可选）

如果希望使用更语义化的命名：

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      borderRadius: {
        'xs': '2px',      // 小圆角（别名）
        'base': '4px',    // 中圆角（别名）
        'modal': '8px',   // 大圆角（别名）
        'pill': '9999px', // 胶囊（别名）
      },
    },
  },
};
```

**使用示例**：
```html
<!-- 使用默认配置 -->
<button class="rounded-sm">按钮</button>
<div class="rounded">下拉菜单</div>
<div class="rounded-lg">模态窗</div>
<img class="rounded-full" src="avatar.jpg" />

<!-- 使用自定义配置 -->
<button class="rounded-xs">按钮</button>
<div class="rounded-base">下拉菜单</div>
<div class="rounded-modal">模态窗</div>
<span class="rounded-pill">胶囊标签</span>
```

---

## 六、React 组件示例

### 6.1 按钮组件（2px）

```tsx
import React from 'react';
import clsx from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary',
  className 
}) => {
  return (
    <button
      className={clsx(
        'rounded-sm px-4 py-2', // 圆角 2px
        {
          'bg-blue-600 text-white': variant === 'primary',
          'bg-gray-200 text-gray-800': variant === 'secondary',
        },
        className
      )}
    >
      {children}
    </button>
  );
};
```

---

### 6.2 卡片组件（2px）

```tsx
import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        'rounded-sm bg-white p-4 shadow', // 圆角 2px
        className
      )}
    >
      {children}
    </div>
  );
};
```

---

### 6.3 模态窗组件（8px）

```tsx
import React from 'react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  className 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div
        className={clsx(
          'rounded-lg bg-white p-6 shadow-xl', // 圆角 8px
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};
```

---

### 6.4 头像组件（50%）

```tsx
import React from 'react';
import clsx from 'clsx';

interface AvatarProps {
  src: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt = 'Avatar',
  size = 'md',
  className 
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  return (
    <img
      src={src}
      alt={alt}
      className={clsx(
        'rounded-full object-cover', // 圆角 50%
        sizeStyles[size],
        className
      )}
    />
  );
};
```

---

### 6.5 胶囊标签组件（9999px）

```tsx
import React from 'react';
import clsx from 'clsx';

interface PillProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Pill: React.FC<PillProps> = ({ 
  children, 
  variant = 'default',
  className 
}) => {
  const variantStyles = {
    default: 'bg-gray-200 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    error: 'bg-red-100 text-red-800',
  };
  
  return (
    <span
      className={clsx(
        'rounded-full px-3 py-1 text-sm', // 圆角 9999px
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
```

---

## 七、特殊场景处理

### 7.1 不同边独立圆角

某些组件可能需要不同边使用不同圆角：

**场景 1**：Input 组件带附加元素
```html
<!-- Input 左侧有图标 -->
<div class="flex">
  <span class="rounded-l-sm">图标</span>
  <input class="rounded-r-sm" />
</div>

<!-- Input 右侧有按钮 -->
<div class="flex">
  <input class="rounded-l-sm" />
  <button class="rounded-r-sm">搜索</button>
</div>
```

**场景 2**：Tabs 标签页
```html
<!-- 顶部标签页（底部无圆角） -->
<div class="rounded-t-sm">Tab 1</div>

<!-- 侧边标签页（右侧无圆角） -->
<div class="rounded-l-sm">Tab 1</div>
```

---

### 7.2 嵌套圆角

**原则**：外层圆角 ≥ 内层圆角

```html
<!-- ✅ 推荐：外层 8px，内层 4px -->
<div class="rounded-lg p-4">
  <div class="rounded">内容</div>
</div>

<!-- ❌ 避免：外层 2px，内层 8px -->
<div class="rounded-sm p-4">
  <div class="rounded-lg">内容</div>
</div>
```

---

### 7.3 响应式圆角

某些组件在不同屏幕尺寸下可以使用不同圆角：

```html
<!-- 移动端小圆角，桌面端大圆角 -->
<div class="rounded-sm md:rounded-lg">
  响应式圆角容器
</div>
```

---

## 八、设计检查清单

### 设计阶段

- [ ] 确认组件类型（基础/菜单/模态/特殊）
- [ ] 选择对应的圆角档位（2px/4px/8px/50%/9999px）
- [ ] 检查同类组件圆角一致性
- [ ] 确认嵌套圆角的层级关系

### 开发阶段

- [ ] 使用 Tailwind 预定义圆角类
- [ ] 避免自定义非规范圆角值
- [ ] 检查不同状态下的圆角一致性
- [ ] 验证响应式场景下的圆角

### 测试阶段

- [ ] 检查各浏览器圆角渲染一致性
- [ ] 验证移动端圆角显示效果
- [ ] 确认圆角与边框、阴影的配合

---

## 九、常见问题（FAQ）

### Q1：为什么没有 6px 或 10px 圆角？

**A**：为了保持设计系统的一致性和简洁性，我们只定义了 5 个圆角档位（2px, 4px, 8px, 50%, 9999px），覆盖了绝大多数使用场景。过多的圆角档位会增加设计和开发的复杂度。

---

### Q2：什么时候使用 50%，什么时候使用 9999px？

**A**：
- **50%**：用于正圆形元素（宽高相等），如头像、徽标、单选框
- **9999px**：用于胶囊形元素（宽高不等），如开关、胶囊标签、胶囊按钮

---

### Q3：卡片应该用 2px 还是 4px？

**A**：
- **基础卡片**：2px（常规数据展示卡片）
- **浮层卡片**：4px（Popover、Tooltip 等浮层）
- **大型面板**：4px（数据面板、仪表盘）

---

### Q4：输入框的下拉菜单应该用什么圆角？

**A**：
- **输入框本身**：2px
- **下拉菜单面板**：4px

```html
<input class="rounded-sm" />
<!-- 下拉菜单 -->
<div class="rounded">
  <div>选项 1</div>
  <div>选项 2</div>
</div>
```

---

### Q5：可以混用不同圆角吗？

**A**：
✅ **可以**：不同类型的组件使用不同圆角
```html
<button class="rounded-sm">按钮 (2px)</button>
<div class="rounded">下拉菜单 (4px)</div>
<div class="rounded-lg">模态窗 (8px)</div>
```

❌ **不可以**：同一个组件内部混用圆角
```html
<!-- 避免这样 -->
<div class="rounded-sm">
  <div class="rounded-lg">混用圆角</div>
</div>
```

---

## 十、最佳实践总结

### 10.1 核心原则

1. **一致性优先**：同类组件使用相同圆角
2. **遵循规范**：只使用 5 个标准档位
3. **层级清晰**：外层圆角 ≥ 内层圆角
4. **语义明确**：根据组件类型选择圆角

---

### 10.2 快速决策指南

**基础组件（最常见）** → **2px**
- 按钮、输入框、标签、卡片

**菜单类（浮层）** → **4px**
- 下拉菜单、Tooltip、Popover

**模态窗（对话框）** → **8px**
- Modal、Drawer、Notification

**圆形（头像等）** → **50%**
- Avatar、Badge（圆形）

**胶囊（开关等���** → **9999px**
- Switch、Pill Tag、Pill Button

---

### 10.3 记忆口诀

```
小圆角 2px - 按钮输入最常见
中圆角 4px - 菜单浮层用得欢
大圆角 8px - 模态对话显庄严
全圆角 50% - 头像徽标圆又圆
胶囊型 9999 - 开关标签像药丸
```

---

## 附录：圆角与其他属性的配合

### A1. 圆角 + 边框

```css
/* 圆角与边框配合 */
.card {
  border-radius: 2px;
  border: 1px solid #e0e0e0;
}

/* 圆角与 Focus 边框 */
.input:focus {
  border-radius: 2px;
  border: 2px solid #2761CB; /* Blue-06 */
}
```

---

### A2. 圆角 + 阴影

```css
/* 小圆角 + 浅阴影 */
.button {
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 大圆角 + 深阴影 */
.modal {
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

---

### A3. 圆角 + 渐变背景

```css
/* 胶囊按钮 + 渐变 */
.pill-button {
  border-radius: 9999px;
  background: linear-gradient(135deg, #2761CB, #4E86DF);
}
```

---

**提供日期**：2024-12-20  
**状态**：✅ 已完整创建（基于 Figma 导入数据）  
**来源**：SENSORO 设计规范 / Lins 4.0

---

**设计出处**：SENSORO 设计规范 / Lins 4.0  
**设计理念**："使用圆角来描述容器与界面元素的轮廓，从一定程度决定产品的视觉调性"
