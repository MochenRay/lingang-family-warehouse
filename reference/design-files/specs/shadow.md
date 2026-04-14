# Shadow 阴影规范

## 来源
SENSORO 设计规范 / Lins 4.0

## 设计理念
阴影通常用来表达界面元素的层级，**阴影越重的元素距离用户越近**。

---

## 一、阴影分类（4个层级）

| 层级 | 名称 | 用途 | 阴影强度 |
|------|------|------|---------|
| **BG-00** | 无阴影 | 背景、警告、表单输入 | 无 |
| **Shadow-01** | 一级阴影 | 时间选择器、级联选择、表单选择 | ⭐ 轻 |
| **Shadow-02** | 二级阴影 | 卡片 Hover | ⭐⭐ 中 |
| **Shadow-03** | 三级阴影 | 对话框、抽屉 | ⭐⭐⭐ 重 |

**注意**：所有阴影默认向下投射（Y轴正方向）

---

## 二、详细规范

### 2.1 BG-00 - 无阴影

**数值**：`none`  
**适用范围**：平面元素、不需要层级区分的组件

**使用场景**：
- ✅ **背景**：页面主背景、区域背景
- ✅ **警告框**：Alert、Banner（平铺式）
- ✅ **表单输入**：Input、TextArea（默认状态）
- ✅ **按钮**：主要按钮、次要按钮（非悬浮状态）
- ✅ **标签**：Tag、Badge

**CSS 示例**：
```css
.no-shadow {
  box-shadow: none;
}
```

**Tailwind CSS**：
```html
<div class="shadow-none">无阴影组件</div>
```

---

### 2.2 Shadow-01 - 一级阴影（轻） ⭐

**数值**：3层叠加阴影  
**适用范围**：下拉类、选择类、浮层类组件

**使用场景**：
- ✅ **时间选择器**：DatePicker、TimePicker 下拉面板
- ✅ **级联选择**：Cascader 下拉菜单
- ✅ **表单选择**：Select 下拉选项
- ✅ **下拉菜单**：Dropdown 菜单
- ✅ **Tooltip**：文字提示框
- ✅ **Popover**：气泡卡片

---

#### 阴影参数（3层）

| 层 | X偏移 | Y偏移 | 模糊半径 | 扩展半径 | 颜色 | 透明度 |
|----|------|------|---------|---------|------|--------|
| **第1层** | 0px | 1px | 2px | -2px | `#0A1B39` | 0.12 (12%) |
| **第2层** | 0px | 3px | 6px | 0px | `#0A1B39` | 0.08 (8%) |
| **第3层** | 0px | 5px | 12px | 4px | `#0A1B39` | 0.06 (6%) |

**完整值**：
```
0px 1px 2px -2px rgba(10, 27, 57, 0.12),
0px 3px 6px 0px rgba(10, 27, 57, 0.08),
0px 5px 12px 4px rgba(10, 27, 57, 0.06)
```

---

#### CSS 示例

```css
.shadow-01 {
  box-shadow: 
    0px 1px 2px -2px rgba(10, 27, 57, 0.12),
    0px 3px 6px 0px rgba(10, 27, 57, 0.08),
    0px 5px 12px 4px rgba(10, 27, 57, 0.06);
}
```

---

#### Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        '01': '0px 1px 2px -2px rgba(10, 27, 57, 0.12), 0px 3px 6px 0px rgba(10, 27, 57, 0.08), 0px 5px 12px 4px rgba(10, 27, 57, 0.06)',
      },
    },
  },
};
```

```html
<div class="shadow-01">一级阴影组件</div>
```

---

### 2.3 Shadow-02 - 二级阴影（中） ⭐⭐

**数值**：3层叠加阴影  
**适用范围**：悬浮卡片、交互反馈

**使用场景**：
- ✅ **卡片 Hover**：Card 悬浮状态
- ✅ **按钮 Hover**：Button 悬浮状态（可选）
- ✅ **表格行 Hover**：Table Row 悬浮状态（可选）
- ✅ **列表项 Hover**：List Item 悬浮状态（可选）

---

#### 阴影参数（3层）

| 层 | X偏移 | Y偏移 | 模糊半径 | 扩展半径 | 颜色 | 透明度 |
|----|------|------|---------|---------|------|--------|
| **第1层** | 0px | 3px | 6px | -4px | `#0A1B39` | 0.08 (8%) |
| **第2层** | 0px | 6px | 16px | 0px | `#0A1B39` | 0.06 (6%) |
| **第3层** | 0px | 9px | 28px | 8px | `#0A1B39` | 0.04 (4%) |

**完整值**：
```
0px 3px 6px -4px rgba(10, 27, 57, 0.08),
0px 6px 16px 0px rgba(10, 27, 57, 0.06),
0px 9px 28px 8px rgba(10, 27, 57, 0.04)
```

---

#### CSS 示例

```css
.shadow-02 {
  box-shadow: 
    0px 3px 6px -4px rgba(10, 27, 57, 0.08),
    0px 6px 16px 0px rgba(10, 27, 57, 0.06),
    0px 9px 28px 8px rgba(10, 27, 57, 0.04);
}

/* 卡片悬浮效果 */
.card {
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 
    0px 3px 6px -4px rgba(10, 27, 57, 0.08),
    0px 6px 16px 0px rgba(10, 27, 57, 0.06),
    0px 9px 28px 8px rgba(10, 27, 57, 0.04);
}
```

---

#### Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        '02': '0px 3px 6px -4px rgba(10, 27, 57, 0.08), 0px 6px 16px 0px rgba(10, 27, 57, 0.06), 0px 9px 28px 8px rgba(10, 27, 57, 0.04)',
      },
    },
  },
};
```

```html
<div class="shadow-02 hover:shadow-02 transition-shadow">
  二级阴影组件（悬浮）
</div>
```

---

### 2.4 Shadow-03 - 三级阴影（重） ⭐⭐⭐

**数值**：3层叠加阴影  
**适用范围**：模态窗、抽屉、高层级弹窗

**使用场景**：
- ✅ **对话框**：Modal 模态窗
- ✅ **抽屉**：Drawer 侧边抽屉
- ✅ **通知**：Notification 通知框（浮层）
- ✅ **确认框**：Confirm 确认对话框
- ✅ **大型浮层**：大面积浮层组件

---

#### 阴影参数（3层）

| 层 | X偏移 | Y偏移 | 模糊半径 | 扩展半径 | 颜色 | 透明度 |
|----|------|------|---------|---------|------|--------|
| **第1层** | 0px | 6px | 16px | -8px | `#0A1B39` | 0.08 (8%) |
| **第2层** | 0px | 9px | 28px | 0px | `#0A1B39` | 0.04 (4%) |
| **第3层** | 0px | 12px | 48px | 16px | `#0A1B39` | 0.02 (2%) |

**完整值**：
```
0px 6px 16px -8px rgba(10, 27, 57, 0.08),
0px 9px 28px 0px rgba(10, 27, 57, 0.04),
0px 12px 48px 16px rgba(10, 27, 57, 0.02)
```

---

#### CSS 示例

```css
.shadow-03 {
  box-shadow: 
    0px 6px 16px -8px rgba(10, 27, 57, 0.08),
    0px 9px 28px 0px rgba(10, 27, 57, 0.04),
    0px 12px 48px 16px rgba(10, 27, 57, 0.02);
}
```

---

#### Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        '03': '0px 6px 16px -8px rgba(10, 27, 57, 0.08), 0px 9px 28px 0px rgba(10, 27, 57, 0.04), 0px 12px 48px 16px rgba(10, 27, 57, 0.02)',
      },
    },
  },
};
```

```html
<div class="shadow-03">三级阴影组件（对话框）</div>
```

---

## 三、组件阴影速查表

### 3.1 基础组件

| 组件 | 阴影 | 说明 |
|------|------|------|
| **Button** | BG-00 | 默认无阴影 |
| **Button (Hover)** | Shadow-02 | 悬浮时可选 |
| **Input** | BG-00 | 默认无阴影 |
| **Input (Focus)** | Shadow-01 | Focus 时可选 |
| **Card** | BG-00 | 默认无阴影 |
| **Card (Hover)** | Shadow-02 | 悬浮时使用 ⭐ |
| **Tag** | BG-00 | 无阴影 |
| **Badge** | BG-00 | 无阴影 |

---

### 3.2 浮层组件

| 组件 | 阴影 | 说明 |
|------|------|------|
| **Dropdown** | Shadow-01 | 一级阴影 ⭐ |
| **Select (下拉面板)** | Shadow-01 | 一级阴影 ⭐ |
| **DatePicker (面板)** | Shadow-01 | 一级阴影 ⭐ |
| **TimePicker (面板)** | Shadow-01 | 一级阴影 ⭐ |
| **Cascader (面板)** | Shadow-01 | 一级阴影 ⭐ |
| **Tooltip** | Shadow-01 | 一级阴影 |
| **Popover** | Shadow-01 | 一级阴影 |

---

### 3.3 反馈组件

| 组件 | 阴影 | 说明 |
|------|------|------|
| **Modal** | Shadow-03 | 三级阴影 ⭐ |
| **Drawer** | Shadow-03 | 三级阴影 ⭐ |
| **Confirm** | Shadow-03 | 三级阴影 |
| **Notification** | Shadow-03 | 三级阴影 |
| **Message** | Shadow-01 | 一级阴影 |
| **Alert** | BG-00 | 无阴影 |

---

### 3.4 表格组件

| 组件 | 阴影 | 说明 |
|------|------|------|
| **Table** | BG-00 | 默认无阴影 |
| **Table Row (Hover)** | Shadow-02 | 悬浮时可选 |
| **Table (Fixed Header)** | Shadow-01 | 固定表头下方阴影 |

---

## 四、使用原则

### 4.1 层级原则

**阴影强度 = 元素层级**

```
页面背景        → BG-00 (无阴影)
↓
基础卡片        → BG-00 (无阴影)
↓
悬浮卡片        → Shadow-02 (二级阴影) ← 距离用户更近
↓
下拉菜单        → Shadow-01 (一级阴影)
↓
对话框/抽屉    → Shadow-03 (三级阴影) ← 距离用户最近
```

**注意**：这里的阴影强度与视觉感知有关，Shadow-03 虽然是"三级"，但实际透明度更低，视觉上更柔和，但范围更大。

---

### 4.2 一致性原则

✅ **推荐做法**：
- 同类组件使用相同阴影
- 保持阴影方向一致（向下）
- 遵循规范定义的 4 个层级

❌ **避免做法**：
- 同一个组件使用多种阴影
- 自定义非规范阴影值
- 阴影方向不一致

---

### 4.3 性能原则

**阴影对性能的影响**：
- 多层阴影 > 单层阴影
- 大模糊半径 > 小模糊半径
- 大面积阴影 > 小面积阴影

**优化建议**：
1. ✅ **仅在必要时使用阴影**（不要给所有元素加阴影）
2. ✅ **使用 CSS 变量或 Tailwind 类**（避免重复定义）
3. ✅ **悬浮状态添加过渡**（`transition: box-shadow 0.3s ease`）
4. ✅ **避免在列表中大量使用高层级阴影**

---

### 4.4 交互原则

**悬浮反馈**：
```css
/* 从无阴影到二级阴影 */
.card {
  box-shadow: none;
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 
    0px 3px 6px -4px rgba(10, 27, 57, 0.08),
    0px 6px 16px 0px rgba(10, 27, 57, 0.06),
    0px 9px 28px 8px rgba(10, 27, 57, 0.04);
}
```

**点击反馈**：
```css
/* 从二级阴影到一级阴影（按下感） */
.button {
  box-shadow: 
    0px 3px 6px -4px rgba(10, 27, 57, 0.08),
    0px 6px 16px 0px rgba(10, 27, 57, 0.06),
    0px 9px 28px 8px rgba(10, 27, 57, 0.04);
  transition: box-shadow 0.2s ease;
}

.button:active {
  box-shadow: 
    0px 1px 2px -2px rgba(10, 27, 57, 0.12),
    0px 3px 6px 0px rgba(10, 27, 57, 0.08),
    0px 5px 12px 4px rgba(10, 27, 57, 0.06);
}
```

---

## 五、Tailwind CSS 完整配置

### 5.1 自定义阴影配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        // 无阴影
        'none': 'none',
        
        // 一级阴影（轻）
        '01': '0px 1px 2px -2px rgba(10, 27, 57, 0.12), 0px 3px 6px 0px rgba(10, 27, 57, 0.08), 0px 5px 12px 4px rgba(10, 27, 57, 0.06)',
        
        // 二级阴影（中）
        '02': '0px 3px 6px -4px rgba(10, 27, 57, 0.08), 0px 6px 16px 0px rgba(10, 27, 57, 0.06), 0px 9px 28px 8px rgba(10, 27, 57, 0.04)',
        
        // 三级阴影（重）
        '03': '0px 6px 16px -8px rgba(10, 27, 57, 0.08), 0px 9px 28px 0px rgba(10, 27, 57, 0.04), 0px 12px 48px 16px rgba(10, 27, 57, 0.02)',
        
        // 语义化别名（可选）
        'dropdown': '0px 1px 2px -2px rgba(10, 27, 57, 0.12), 0px 3px 6px 0px rgba(10, 27, 57, 0.08), 0px 5px 12px 4px rgba(10, 27, 57, 0.06)',
        'hover': '0px 3px 6px -4px rgba(10, 27, 57, 0.08), 0px 6px 16px 0px rgba(10, 27, 57, 0.06), 0px 9px 28px 8px rgba(10, 27, 57, 0.04)',
        'modal': '0px 6px 16px -8px rgba(10, 27, 57, 0.08), 0px 9px 28px 0px rgba(10, 27, 57, 0.04), 0px 12px 48px 16px rgba(10, 27, 57, 0.02)',
      },
    },
  },
};
```

---

### 5.2 使用示例

```html
<!-- 无阴影 -->
<button class="shadow-none">按钮</button>

<!-- 一级阴影 -->
<div class="shadow-01">下拉菜单</div>

<!-- 二级阴影（悬浮） -->
<div class="shadow-none hover:shadow-02 transition-shadow">
  卡片（悬浮时显示阴影）
</div>

<!-- 三级阴影 -->
<div class="shadow-03">对话框</div>

<!-- 语义化别名 -->
<div class="shadow-dropdown">下拉菜单</div>
<div class="shadow-hover">悬浮卡片</div>
<div class="shadow-modal">模态窗</div>
```

---

## 六、React 组件示例

### 6.1 卡片组件（悬浮阴影）

```tsx
import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  hoverable = true,
  className 
}) => {
  return (
    <div
      className={clsx(
        'rounded-sm bg-white p-4',
        {
          'shadow-none hover:shadow-02 transition-shadow duration-300': hoverable,
          'shadow-none': !hoverable,
        },
        className
      )}
    >
      {children}
    </div>
  );
};

// 使用示例
<Card hoverable>
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</Card>
```

---

### 6.2 下拉菜单组件（一级阴影）

```tsx
import React from 'react';
import clsx from 'clsx';

interface DropdownProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  isOpen, 
  children, 
  className 
}) => {
  if (!isOpen) return null;
  
  return (
    <div
      className={clsx(
        'absolute rounded bg-white shadow-01 z-10', // 一级阴影
        className
      )}
    >
      {children}
    </div>
  );
};
```

---

### 6.3 模态窗组件（三级阴影）

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
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div
        className={clsx(
          'rounded-lg bg-white p-6 shadow-03', // 三级阴影
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

### 6.4 按钮组件（悬浮阴影 - 可选）

```tsx
import React from 'react';
import clsx from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  shadowOnHover?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary',
  shadowOnHover = false,
  className 
}) => {
  return (
    <button
      className={clsx(
        'rounded-sm px-4 py-2 transition-all duration-300',
        {
          'bg-blue-600 text-white': variant === 'primary',
          'bg-gray-200 text-gray-800': variant === 'secondary',
          'hover:shadow-02': shadowOnHover,
        },
        className
      )}
    >
      {children}
    </button>
  );
};

// 使用示例
<Button shadowOnHover>悬浮时显示阴影</Button>
```

---

## 七、特殊场景处理

### 7.1 暗色模式下的阴影

在暗色模式下，阴影应该更重（透明度更高）才能显示层级：

```css
/* 浅色模式 */
.card-light {
  box-shadow: 
    0px 1px 2px -2px rgba(10, 27, 57, 0.12),
    0px 3px 6px 0px rgba(10, 27, 57, 0.08),
    0px 5px 12px 4px rgba(10, 27, 57, 0.06);
}

/* 暗色模式（透明度加倍） */
.card-dark {
  box-shadow: 
    0px 1px 2px -2px rgba(0, 0, 0, 0.24),
    0px 3px 6px 0px rgba(0, 0, 0, 0.16),
    0px 5px 12px 4px rgba(0, 0, 0, 0.12);
}
```

**Tailwind CSS（暗色模式）**：
```html
<div class="shadow-01 dark:shadow-[0px_1px_2px_-2px_rgba(0,0,0,0.24),0px_3px_6px_0px_rgba(0,0,0,0.16),0px_5px_12px_4px_rgba(0,0,0,0.12)]">
  暗色模式下的阴影
</div>
```

---

### 7.2 内阴影（Input Focus）

```css
/* Input Focus 内阴影（可选） */
.input:focus {
  box-shadow: inset 0 0 0 1px rgba(39, 97, 203, 0.5); /* Blue-06 */
}

/* 或者使用边框 + 外阴影 */
.input:focus {
  border: 1px solid #2761CB;
  box-shadow: 0 0 0 3px rgba(39, 97, 203, 0.1);
}
```

---

### 7.3 阴影 + 边框

```css
/* 卡片：边框 + 阴影 */
.card-bordered {
  border: 1px solid #e0e0e0;
  box-shadow: 
    0px 1px 2px -2px rgba(10, 27, 57, 0.12),
    0px 3px 6px 0px rgba(10, 27, 57, 0.08),
    0px 5px 12px 4px rgba(10, 27, 57, 0.06);
}
```

---

### 7.4 响应式阴影

```html
<!-- 移动端无阴影，桌面端有阴影 -->
<div class="shadow-none md:shadow-01">
  响应式阴影
</div>

<!-- 移动端一级阴影，桌面端二级阴影 -->
<div class="shadow-01 md:shadow-02">
  响应式阴影（渐进增强）
</div>
```

---

## 八、阴影与其他属性的配合

### 8.1 阴影 + 圆角

```css
.card {
  border-radius: 2px; /* 小圆角 */
  box-shadow: 
    0px 3px 6px -4px rgba(10, 27, 57, 0.08),
    0px 6px 16px 0px rgba(10, 27, 57, 0.06),
    0px 9px 28px 8px rgba(10, 27, 57, 0.04);
}
```

---

### 8.2 阴影 + 背景色

```css
/* 白色背景 + 阴影（清晰） */
.card-white {
  background: #FFFFFF;
  box-shadow: 
    0px 1px 2px -2px rgba(10, 27, 57, 0.12),
    0px 3px 6px 0px rgba(10, 27, 57, 0.08),
    0px 5px 12px 4px rgba(10, 27, 57, 0.06);
}

/* 灰色背景 + 阴影（弱化） */
.card-gray {
  background: #F6F7F8;
  box-shadow: 
    0px 1px 2px -2px rgba(10, 27, 57, 0.08),
    0px 3px 6px 0px rgba(10, 27, 57, 0.06),
    0px 5px 12px 4px rgba(10, 27, 57, 0.04);
}
```

---

### 8.3 阴影 + 动画

```css
/* 悬浮放大 + 阴影增强 */
.card {
  transition: 
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-4px); /* 上移 4px */
  box-shadow: 
    0px 6px 16px -8px rgba(10, 27, 57, 0.08),
    0px 9px 28px 0px rgba(10, 27, 57, 0.04),
    0px 12px 48px 16px rgba(10, 27, 57, 0.02);
}
```

---

## 九、设计检查清单

### 设计阶段

- [ ] 确认组件层级（浮层/卡片/对话框）
- [ ] 选择对应的阴影层级（01/02/03）
- [ ] 检查同类组件阴影一致性
- [ ] 确认阴影方向（默认向下）

### 开发阶段

- [ ] 使用 Tailwind 预定义阴影类
- [ ] 避免自定义非规范阴影值
- [ ] 添加阴影过渡动画（0.3s ease）
- [ ] 检查暗色模式下的阴影效果

### 测试阶段

- [ ] 检查各浏览器阴影渲染一致性
- [ ] 验证移动端阴影显示效果
- [ ] 确认阴影不影响性能
- [ ] 测试响应式场景下的阴影

---

## 十、常见问题（FAQ）

### Q1：为什么只有3个阴影层级？

**A**：为了保持设计系统的简洁性和一致性，3个阴影层级已经覆盖了绝大多数使用场景：
- Shadow-01：下拉菜单、浮层（最常用）
- Shadow-02：悬浮反馈（次常用）
- Shadow-03：模态窗、抽屉（特定场景）

过多的阴影层级会增加设计和开发的复杂度。

---

### Q2：什么时候使用 Shadow-01，什么时候使用 Shadow-02？

**A**：
- **Shadow-01**：用于下拉类、选择类组件（Dropdown、Select、DatePicker）
- **Shadow-02**：用于悬浮反馈（Card Hover、Button Hover）

**判断标准**：
- 如果是**静态浮层**（一直显示） → Shadow-01
- 如果是**交互反馈**（悬浮时显示） → Shadow-02

---

### Q3：卡片应该用哪个阴影？

**A**：
- **默认状态**：无阴影（BG-00）
- **悬浮状态**：二级阴影（Shadow-02）

```html
<div class="shadow-none hover:shadow-02 transition-shadow">
  卡片
</div>
```

---

### Q4：模态窗应该用哪个阴影？

**A**：三级阴影（Shadow-03）

模态窗是最高层级的UI元素，需要最强的视觉层级感。

```html
<div class="shadow-03">模态窗</div>
```

---

### Q5：可以混用不同阴影吗？

**A**：
✅ **可以**：不同类型的组件使用不同阴影
```html
<div class="shadow-01">下拉菜单</div>
<div class="shadow-02">悬浮卡片</div>
<div class="shadow-03">对话框</div>
```

❌ **不可以**：同一个组件内部混用阴影
```html
<!-- 避免这样 -->
<div class="shadow-01">
  <div class="shadow-03">混用阴影</div>
</div>
```

---

### Q6：为什么阴影是3层叠加？

**A**：3层阴影叠加可以创造更自然、柔和的阴影效果：
- **第1层**：近距离硬阴影（模糊半径小）
- **第2层**：中距离过渡阴影（模糊半径中等）
- **第3层**：远距离柔和阴影（模糊半径大）

这种层叠方式模拟了真实世界中的光线散射效果。

---

### Q7：阴影对性能有影响吗？

**A**：有，但在合理范围内：
- ✅ **轻量**：单个元素的阴影（即使3层）
- ⚠️ **中等**：100个元素同时有阴影
- ❌ **重量**：1000个元素同时有阴影 + 频繁动画

**优化建议**：
1. 只在必要的元素上使用阴影
2. 避免在长列表中给每一项加阴影
3. 使用 `will-change: box-shadow` 优化动画（谨慎使用）

---

## 十一、最佳实践总结

### 11.1 核心原则

1. **层级清晰**：阴影越重，距离用户越近
2. **遵循规范**：只使用 4 个标准层级
3. **一致性优先**：同类组件使用相同阴影
4. **性能优先**：避免滥用阴影

---

### 11.2 快速决策指南

**无阴影（BG-00）** → **平面元素**
- 按钮、输入框、标签、警告框

**一级阴影（Shadow-01）** → **浮层元素**
- 下拉菜单、Tooltip、Popover

**二级阴影（Shadow-02）** → **悬浮反馈**
- 卡片 Hover、按钮 Hover

**三级阴影（Shadow-03）** → **模态窗**
- Modal、Drawer、Notification

---

### 11.3 记忆口诀

```
无阴影 BG-00 - 按钮输入平又平
一级阴影 Shadow-01 - 下拉菜单浮又浮
二级阴影 Shadow-02 - 悬浮反馈动又动
三级阴影 Shadow-03 - 模态窗口高又高
```

---

## 十二、阴影颜色说明

**阴影基准色**：`#0A1B39`（深蓝灰色）

**为什么不用纯黑色？**
- ❌ 纯黑色（#000000）：过于生硬、不自然
- ✅ 深蓝灰色（#0A1B39）：更柔和、更符合自然光线

**透明度范围**：
- Shadow-01：0.12, 0.08, 0.06（总体约 10%）
- Shadow-02：0.08, 0.06, 0.04（总体约 7%）
- Shadow-03：0.08, 0.04, 0.02（总体约 5%，但范围最大）

**注意**：虽然 Shadow-03 的透明度最低，但由于模糊半径和扩展半径最大，视觉上仍然是最强的层级感。

---

## 附录：CSS 变量配置（可选）

如果希望使用 CSS 变量管理阴影：

```css
:root {
  /* 阴影基准色 */
  --shadow-color: 10, 27, 57;
  
  /* 一级阴影 */
  --shadow-01: 
    0px 1px 2px -2px rgba(var(--shadow-color), 0.12),
    0px 3px 6px 0px rgba(var(--shadow-color), 0.08),
    0px 5px 12px 4px rgba(var(--shadow-color), 0.06);
  
  /* 二级阴影 */
  --shadow-02: 
    0px 3px 6px -4px rgba(var(--shadow-color), 0.08),
    0px 6px 16px 0px rgba(var(--shadow-color), 0.06),
    0px 9px 28px 8px rgba(var(--shadow-color), 0.04);
  
  /* 三级阴影 */
  --shadow-03: 
    0px 6px 16px -8px rgba(var(--shadow-color), 0.08),
    0px 9px 28px 0px rgba(var(--shadow-color), 0.04),
    0px 12px 48px 16px rgba(var(--shadow-color), 0.02);
}

/* 使用 */
.dropdown {
  box-shadow: var(--shadow-01);
}

.card:hover {
  box-shadow: var(--shadow-02);
}

.modal {
  box-shadow: var(--shadow-03);
}
```

---

**提供日期**：2024-12-20  
**状态**：✅ 已完整创建（基于 Figma 导入数据）  
**来源**：SENSORO 设计规范 / Lins 4.0

---

**设计出处**：SENSORO 设计规范 / Lins 4.0  
**设计理念**："阴影通常用来表达界面元素的层级，阴影越重的元素距离用户越近"
