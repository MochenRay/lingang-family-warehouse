# Button 基础按钮

## 来源
SENSCIO 设计系统 / 深色模式 / 基础按钮

## 设计理念
按钮是用户完成任务的一个形态简单但有用的门路。

## 图片引用
```tsx
import buttonSpecs from 'figma:asset/2d59b36c22063465dacc1f0873dae74416c8f9ce.png';
```

---

## 一、按钮类型（4种）

### 1. 主要按钮（Primary Button）
- **用途**：页面主要操作、强调操作
- **视觉**：蓝色填充背景，白色文字
- **优先级**：最高
- **建议**：每个区域最多1-2个主要按钮

### 2. 次要按钮（Secondary Button）
- **用途**：次要操作、辅助操作
- **视觉**：深色填充背景，白色文字
- **优先级**：中等
- **建议**：可搭配主要按钮使用

### 3. 虚线+文字（Dashed Button）
- **用途**：添加操作、创建操作
- **视觉**：虚线边框，蓝色文字，带图标
- **优先级**：低
- **建议**：用于引导用户添加内容

### 4. 链接按钮（Link Button）
- **用途**：轻量级操作、跳转链接
- **视觉**：纯文字，无背景，蓝色或红色文字
- **优先级**：最低
- **建议**：用于次要链接或危险操作提示

---

## 二、按钮状态（4种）

每种按钮类型都有以下 4 种状态：

| 状态 | 说明 | 视觉变化 | 交互 |
|------|------|---------|------|
| **Default** | 默认状态 | 标准配色 | 可点击 |
| **Hover** | 鼠标悬停 | 背景色略微变化 | 可点击 |
| **Click** | 点击/激活 | 背景色更深或更亮 | 执行操作 |
| **Disable** | 禁用状态 | 灰色系，降低对比度 | 不可点击 |

---

## 三、按钮尺寸（3种）

| 尺寸 | 代号 | 高度 | 内边距（横向） | 字号 | 图标大小 |
|------|------|------|---------------|------|---------|
| **大** | A | 40px | 16px | 16px | 16px |
| **中** | B | 32px | 12px | 14px | 14px |
| **小** | C | 24px | 8px | 12px | 12px |

**圆角**：所有尺寸统一使用 `2px` 圆角（小圆角）

---

## 四、主要按钮（Primary Button）

### Default（默认状态）

**外观**
- **背景色**：`#2761CB`（Blue-06，主色）
- **文字色**：`rgba(255, 255, 255, 0.85)`（白色 85% 不透明度）
- **边框**：无
- **圆角**：2px
- **阴影**：无

**示例**
```
┌──────────┐
│ 主要按钮 │  ← 蓝色背景 #2761CB
└──────────┘
```

---

### Hover（悬停状态）

**外观**
- **背景色**：`#4E86DF`（Blue-07，更亮）
- **文字色**：`rgba(255, 255, 255, 0.85)`
- **边框**：无
- **光标**：pointer 手型光标

**示例**
```
┌──────────┐
│ 主要按钮 │  ← 更亮的蓝色 #4E86DF
└──────────┘
```

---

### Click（点击/激活状态）

**外观**
- **背景色**：`#2251A8`（Blue-05，更深）
- **文字色**：`rgba(255, 255, 255, 0.85)`
- **边框**：无
- **反馈**：可能有轻微缩放或阴影

**示例**
```
┌──────────┐
│ 主要按钮 │  ← 更深的蓝色 #2251A8
└──────────┘
```

---

### Disable（禁用状态）

**外观**
- **背景色**：`#293449`（Neutral-03，深灰色）
- **文字色**：`#546789`（Neutral-06，灰色）
- **边框**：无
- **光标**：not-allowed 禁止光标
- **透明度**：可能降低整体透明度

**示例**
```
┌──────────┐
│ 主要按钮 │  ← 灰色暗淡，不可点击
└──────────┘
```

---

## 五、次要按钮（Secondary Button）

### Default（默认状态）

**外观**
- **背景色**：`#1F293A`（Neutral-02，2阶卡片）
- **文字色**：`rgba(255, 255, 255, 0.85)`
- **边框**：无
- **圆角**：2px

**示例**
```
┌──────────┐
│ 次要按钮 │  ← 深色背景 #1F293A
└──────────┘
```

---

### Hover（悬停状态）

**外观**
- **背景色**：`#293449`（Neutral-03，3阶卡片，更亮）
- **文字色**：`rgba(255, 255, 255, 0.85)`
- **边框**：无

**示例**
```
┌──────────┐
│ 次要按钮 │  ← 略亮的背景 #293449
└──────────┘
```

---

### Click（点击/激活状态）

**外观**
- **背景色**：`#314059`（Neutral-04，4阶卡片，最亮）
- **文字色**：`rgba(255, 255, 255, 0.85)`
- **边框**：无

**示例**
```
┌──────────┐
│ 次要按钮 │  ← 更亮的背景 #314059
└──────────┘
```

---

### Disable（禁用状态）

**外观**
- **背景色**：`#161D2A`（Neutral-01，1阶卡片，最暗）
- **文字色**：`#546789`（Neutral-06，灰色）
- **边框**：无

**示例**
```
┌──────────┐
│ 次要按钮 │  ← 暗灰色，不可点击
└──────────┘
```

---

## 六、虚线+文字按钮（Dashed Button）

### Default（默认状态）

**外观**
- **背景色**：`#1F293A`（Neutral-02，深色背景）或 `#161D2A`（Neutral-01）
- **边框**：1px dashed `#314059`（Neutral-04，虚线边框）
- **文字色**：`#4E86DF`（Blue-07，蓝色）
- **图标**：
  - 内容：加号 "+" 或其他图标
  - 颜色：`#4E86DF`（Blue-07）
  - 大小：12px（小）、14px（中）、16px（大）
  - 位置：文字左侧，间距 4px
- **圆角**：2px

**示例**
```
┌─ ─ ─ ─ ─ ─┐
│ + 虚线按钮 │  ← 虚线边框 + 蓝色文字
└─ ─ ─ ─ ─ ─┘
```

---

### Hover（悬停状态）

**外观**
- **背景色**：`#293449`（Neutral-03，略亮）
- **边框**：1px dashed `#314059`（Neutral-04）
- **文字色**：`#7CAEF5`（Blue-08，更亮的蓝色）
- **图标**：`#7CAEF5`（Blue-08）

**示例**
```
┌─ ─ ─ ─ ─ ─┐
│ + 虚线按钮 │  ← 略亮的背景 + 更亮的蓝色
└─ ─ ─ ─ ─ ─┘
```

---

### Click（点击/激活状态）

**外观**
- **背景色**：`#314059`（Neutral-04，更亮）
- **边框**：1px dashed `#2761CB`（Blue-06，实色边框或更明显）
- **文字色**：`#2761CB`（Blue-06，主色）
- **图标**：`#2761CB`（Blue-06）

**示例**
```
┌─ ─ ─ ─ ─ ─┐
│ + 虚线按钮 │  ← 更亮的背景 + 主色蓝
└─ ─ ─ ─ ─ ─┘
```

---

### Disable（禁用状态）

**外观**
- **背景色**：`#161D2A`（Neutral-01，最暗）
- **边框**：1px dashed `#293449`（Neutral-03，灰色虚线）
- **文字色**：`#546789`（Neutral-06，灰色）
- **图标**：`#546789`（Neutral-06）

**示例**
```
┌─ ─ ─ ─ ─ ─┐
│ + 虚线按钮 │  ← 灰色暗淡，不可点击
└─ ─ ─ ─ ─ ─┘
```

---

## 七、链接按钮（Link Button）

### 主文字按钮（Primary Link）

#### Default（默认状态）

**外观**
- **背景色**：透明
- **文字色**：`#4E86DF`（Blue-07，蓝色）
- **边框**：无
- **下划线**：无（Hover 时可选）

**示例**
```
主文字按钮  ← 蓝色文字，无背景
```

---

#### Hover（悬停状态）

**外观**
- **背景色**：透明或 `rgba(78, 134, 223, 0.1)`（浅蓝背景，可选）
- **文字色**：`#7CAEF5`（Blue-08，更亮）
- **下划线**：可选显示下划线

**示例**
```
主文字按钮  ← 更亮的蓝色
```

---

#### Click（点击状态）

**外观**
- **背景色**：透明或 `rgba(78, 134, 223, 0.2)`（更深的浅蓝背景）
- **文字色**：`#2761CB`（Blue-06，主色）

**示例**
```
主文字按钮  ← 主色蓝
```

---

#### Disable（禁用状态）

**外观**
- **背景色**：透明
- **文字色**：`#546789`（Neutral-06，灰色）
- **光标**：not-allowed

**示例**
```
主文字按钮  ← 灰色暗淡
```

---

### 危险文字按钮（Danger Link）

#### Default（默认状态）

**外观**
- **背景色**：透明
- **文字色**：`#E7484F`（Red-07，红色）
- **边框**：无

**示例**
```
危险按钮  ← 红色文字
```

---

#### Hover（悬停状态）

**外观**
- **背景色**：透明或 `rgba(231, 72, 79, 0.1)`（浅红背景，可选）
- **文字色**：`#F37172`（Red-08，更亮的红色）

**示例**
```
危险按钮  ← 更亮的红色
```

---

#### Click（点击状态）

**外观**
- **背景色**：透明或 `rgba(231, 72, 79, 0.2)`
- **文字色**：`#D52132`（Red-06，深红色）

**示例**
```
危险按钮  ← 深红色
```

---

#### Disable（禁用状态）

**外观**
- **背景色**：透明
- **文字色**：`#546789`（Neutral-06，灰色）

**示例**
```
危险按钮  ← 灰色暗淡
```

---

## 八、按钮规范总结

### 颜色速查表

| 按钮类型 | 状态 | 背景色 | 文字色 | 边框色 |
|---------|------|--------|--------|--------|
| **主要按钮** | Default | `#2761CB` | `rgba(255,255,255,0.85)` | - |
| | Hover | `#4E86DF` | `rgba(255,255,255,0.85)` | - |
| | Click | `#2251A8` | `rgba(255,255,255,0.85)` | - |
| | Disable | `#293449` | `#546789` | - |
| **次要按钮** | Default | `#1F293A` | `rgba(255,255,255,0.85)` | - |
| | Hover | `#293449` | `rgba(255,255,255,0.85)` | - |
| | Click | `#314059` | `rgba(255,255,255,0.85)` | - |
| | Disable | `#161D2A` | `#546789` | - |
| **虚线按钮** | Default | `#1F293A` | `#4E86DF` | `#314059` dashed |
| | Hover | `#293449` | `#7CAEF5` | `#314059` dashed |
| | Click | `#314059` | `#2761CB` | `#2761CB` dashed |
| | Disable | `#161D2A` | `#546789` | `#293449` dashed |
| **主文字按钮** | Default | transparent | `#4E86DF` | - |
| | Hover | transparent | `#7CAEF5` | - |
| | Click | transparent | `#2761CB` | - |
| | Disable | transparent | `#546789` | - |
| **危险文字按钮** | Default | transparent | `#E7484F` | - |
| | Hover | transparent | `#F37172` | - |
| | Click | transparent | `#D52132` | - |
| | Disable | transparent | `#546789` | - |

---

### 尺寸规范

| 尺寸 | 高度 | 内边距 | 字号 | 行高 | 圆角 |
|------|------|--------|------|------|------|
| **大** | 40px | 16px (横向) | 16px | 24px | 2px |
| **中** | 32px | 12px (横向) | 14px | 22px | 2px |
| **小** | 24px | 8px (横向) | 12px | 20px | 2px |

**字体**：PingFang SC Regular

---

### 图标规范

| 尺寸 | 图标大小 | 与文字间距 |
|------|---------|-----------|
| **大** | 16px × 16px | 4px |
| **中** | 14px × 14px | 4px |
| **小** | 12px × 12px | 4px |

**图标位置**：文字左侧或右侧  
**图标颜色**：与文字颜色一致

---

## 九、使用指南

### 按钮组合建议

#### 1. 主次搭配
```
┌──────────┐  ┌──────────┐
│ 确定     │  │ 取消     │
└──────────┘  └──────────┘
  主要按钮      次要按钮
```

#### 2. 危险操作
```
┌──────────┐  ┌──────────┐
│ 删除     │  │ 取消     │
└──────────┘  └──────────┘
 危险文字按钮   次要按钮
```

#### 3. 添加操作
```
┌─ ─ ─ ─ ─ ─┐
│ + 添加内容 │
└─ ─ ─ ─ ─ ─┘
   虚线按钮
```

---

### 禁用状态使用场景

- ✅ 表单未填写完整
- ✅ 操作权限不足
- ✅ 系统处理中（Loading）
- ✅ 数据校验未通过

---

### 按钮文字规范

#### 长度建议
- **主要按钮**：2-6 个字
- **次要按钮**：2-6 个字
- **虚线按钮**：2-8 个字（含图标）
- **文字按钮**：2-8 个字

#### 动词优先
- ✅ 推荐：提交、保存、删除、取消、添加
- ❌ 避免：确定、好的、点击这里

---

## 十、实现代码（CSS/React）

### CSS 类定义

```css
/* 主要按钮 */
.btn-primary {
  height: 32px;
  padding: 0 12px;
  background: #2761CB;
  color: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 2px;
  font-size: 14px;
  line-height: 22px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #4E86DF;
}

.btn-primary:active {
  background: #2251A8;
}

.btn-primary:disabled {
  background: #293449;
  color: #546789;
  cursor: not-allowed;
}

/* 次要按钮 */
.btn-secondary {
  height: 32px;
  padding: 0 12px;
  background: #1F293A;
  color: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 2px;
  font-size: 14px;
  line-height: 22px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #293449;
}

.btn-secondary:active {
  background: #314059;
}

.btn-secondary:disabled {
  background: #161D2A;
  color: #546789;
  cursor: not-allowed;
}

/* 虚线按钮 */
.btn-dashed {
  height: 32px;
  padding: 0 12px;
  background: #1F293A;
  color: #4E86DF;
  border: 1px dashed #314059;
  border-radius: 2px;
  font-size: 14px;
  line-height: 22px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-dashed:hover {
  background: #293449;
  color: #7CAEF5;
}

.btn-dashed:active {
  background: #314059;
  color: #2761CB;
  border-color: #2761CB;
}

.btn-dashed:disabled {
  background: #161D2A;
  color: #546789;
  border-color: #293449;
  cursor: not-allowed;
}

/* 主文字按钮 */
.btn-link-primary {
  padding: 0 4px;
  background: transparent;
  color: #4E86DF;
  border: none;
  font-size: 14px;
  line-height: 22px;
  cursor: pointer;
  transition: color 0.3s;
}

.btn-link-primary:hover {
  color: #7CAEF5;
}

.btn-link-primary:active {
  color: #2761CB;
}

.btn-link-primary:disabled {
  color: #546789;
  cursor: not-allowed;
}

/* 危险文字按钮 */
.btn-link-danger {
  padding: 0 4px;
  background: transparent;
  color: #E7484F;
  border: none;
  font-size: 14px;
  line-height: 22px;
  cursor: pointer;
  transition: color 0.3s;
}

.btn-link-danger:hover {
  color: #F37172;
}

.btn-link-danger:active {
  color: #D52132;
}

.btn-link-danger:disabled {
  color: #546789;
  cursor: not-allowed;
}
```

---

### React 组件示例

```tsx
import React from 'react';

interface ButtonProps {
  type?: 'primary' | 'secondary' | 'dashed' | 'link-primary' | 'link-danger';
  size?: 'large' | 'medium' | 'small';
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  type = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  children,
  onClick,
}) => {
  const sizeClasses = {
    large: 'h-[40px] px-4 text-base',
    medium: 'h-[32px] px-3 text-sm',
    small: 'h-[24px] px-2 text-xs',
  };

  const typeClasses = {
    'primary': 'bg-[#2761CB] text-white hover:bg-[#4E86DF] active:bg-[#2251A8] disabled:bg-[#293449] disabled:text-[#546789]',
    'secondary': 'bg-[#1F293A] text-white hover:bg-[#293449] active:bg-[#314059] disabled:bg-[#161D2A] disabled:text-[#546789]',
    'dashed': 'bg-[#1F293A] text-[#4E86DF] border border-dashed border-[#314059] hover:bg-[#293449] hover:text-[#7CAEF5] active:bg-[#314059] active:text-[#2761CB] disabled:bg-[#161D2A] disabled:text-[#546789] disabled:border-[#293449]',
    'link-primary': 'bg-transparent text-[#4E86DF] hover:text-[#7CAEF5] active:text-[#2761CB] disabled:text-[#546789]',
    'link-danger': 'bg-transparent text-[#E7484F] hover:text-[#F37172] active:text-[#D52132] disabled:text-[#546789]',
  };

  return (
    <button
      className={`
        flex items-center justify-center gap-1
        rounded-sm font-['PingFang_SC'] transition-all
        ${sizeClasses[size]}
        ${typeClasses[type]}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

// 使用示例
export default function Example() {
  return (
    <div className="flex gap-4">
      <Button type="primary">主要按钮</Button>
      <Button type="secondary">次要按钮</Button>
      <Button type="dashed" icon={<span>+</span>}>虚线按钮</Button>
      <Button type="link-primary">主文字按钮</Button>
      <Button type="link-danger">危险按钮</Button>
    </div>
  );
}
```

---

## 十一、可访问性（Accessibility）

### ARIA 属性

```html
<button
  type="button"
  aria-label="确认提交"
  aria-disabled="false"
>
  确定
</button>
```

### 键盘支持

| 按键 | 功能 |
|------|------|
| **Tab** | 移动焦点到下一个按钮 |
| **Shift + Tab** | 移动焦点到上一个按钮 |
| **Enter / Space** | 激活按钮 |
| **Esc** | 取消操作（可选） |

### 焦点样式

```css
.btn:focus-visible {
  outline: 2px solid #2761CB;
  outline-offset: 2px;
}
```

---

## 十二、常见问题

### 1. 一个页面可以有多个主要按钮吗？
- ❌ 不推荐：每个区域最多 1-2 个主要按钮
- ✅ 推荐：一个主要按钮 + 多个次要按钮

### 2. 虚线按钮什么时候使用？
- ✅ 添加内容（添加成员、添加标签）
- ✅ 创建操作（创建项目、创建文件夹）
- ✅ 上传操作（上传文件）

### 3. 危险操作应该使用什么按钮？
- ✅ 推荐：危险文字按钮（红色文字）
- ✅ 可选：主要按钮 + 确认弹窗
- ❌ 避免：直接使用红色主要按钮（太醒目）

### 4. 按钮文字可以换行吗？
- ❌ 不推荐：按钮文字应该简洁，避免换行
- ✅ 推荐：控制在 2-8 个字以内

---

**提供日期**：2024-12-20  
**更新日期**：2024-12-20  
**状态**：✅ 已完整更新（含精确色值和 Figma 导入数据）

---

**设计出处**：SENSCIO 设计规范  
**设计师**：Lins 4.0
