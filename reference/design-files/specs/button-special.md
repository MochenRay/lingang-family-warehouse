# Button 特殊按钮

## 来源
SENSORO 设计系统 / 深色模式 / 特殊按钮

## 设计理念
用户使用按钮来触发一个操作或者进行跳转。特殊按钮是针对特定业务场景（如地图应用、全景地图）设计的功能性按钮组件。

## 图片引用
```tsx
import specialButtonSpecs from 'figma:asset/ebaf6a08072cef5276507a0ae7e5f55b721f3b3d.png';
```

---

## 一、按钮类型（5种）

### 1. 功能入口按钮（带右箭头）
**用途**：导航到功能页面、跳转链接  
**示例**：人员流动分析 →

### 2. 双操作按钮（分隔式）
**用途**：相关联的两个操作  
**示例**：应急调度 | 历史影像

### 3. 图标+文字按钮
**用途**：带图标的功能操作  
**示例**：📊 要素识别

### 4. 退出按钮（带图标）
**用途**：退出操作、关闭功能  
**示例**：🚪 退出

### 5. 切换按钮组（纯图标）
**用途**：视图切换、模式切换  
**示例**：👁️ | 🗺️ | 👁️🗺️

---

## 二、按钮状态（4种）

| 状态 | 说明 | 视觉变化 | 交互 |
|------|------|---------|------|
| **Default** | 默认状态 | 标准配色 | 可点击 |
| **Hover** | 鼠标悬停 | 文字变亮 + 光标显示 | 可点击 |
| **Click/Selected** | 选中状态 | 特殊高亮（部分按钮） | 激活 |
| **Disable** | 禁用状态 | 灰色系 | 不可点击 |

---

## 三、通用规范

### 尺寸
| 尺寸 | 高度 | 内边距（横向） | 字号 | 图标大小 |
|------|------|---------------|------|---------|
| **中** | 32px | 16px | 14px | 16px |

**圆角**：2px（与基础按钮保持一致）  
**字体**：PingFang SC Regular  
**行高**：22px

---

### 颜色系统

| 元素 | Default | Hover | Selected |
|------|---------|-------|----------|
| **背景色** | `#0D121B`（Neutral-00，页面背景） | `#0D121B` | - |
| **文字色** | `#AEC0DE`（Neutral-10，主要文字） | `#F6F9FE`（Neutral-11，标题文字） | `#F6F9FE` |
| **图标色** | `#AEC0DE` | `#F6F9FE` | `#F6F9FE` |
| **分隔线** | `#293449`（Neutral-03，3阶卡片） | `#293449` | - |

**说明**：  
- 这些按钮通常在深色背景上使用
- 背景色为页面背景色 `#0D121B`（Neutral-00）
- Hover 状态主要通过文字/图标颜色变化来体现（从 Neutral-10 变为 Neutral-11）

---

## 四、功能入口按钮（带右箭头）

### Default（默认状态）

**外观**
- **背景色**：`#0D121B`（Neutral-00，页面背景色）
- **文字色**：`#AEC0DE`（Neutral-10，主要文字）
- **图标**：
  - 内容：右箭头 →
  - 颜色：`#AEC0DE`（与文字一致）
  - 大小：16px × 16px
  - 位置：文字右侧，右边距 16px
- **尺寸**：高度 32px，宽度自适应
- **内边距**：0 16px
- **圆角**：2px

**示例**
```
┌──────────────────┐
│ 人员流动分析  →  │  ← 深色背景 + 浅色文字 + 右箭头
└──────────────────┘
```

---

### Hover（悬停状态）

**外观**
- **背景色**：`#0D121B`（保持不变）
- **文字色**：`#F6F9FE`（Neutral-11，标题文字，更亮）
- **图标色**：`#F6F9FE`（更亮）
- **光标**：pointer 手型光标（图中可见）

**示例**
```
┌──────────────────┐
│ 人员流动分析  →  │  ← 文字和图标变亮 + 手型光标
└──────────────────┘
       ☝️
```

---

### 应用场景
- ✅ 导航到详情页
- ✅ 跳转到功能页面
- ✅ 查看更多信息
- ✅ 全景地图中的功能入口

---

## 五、双操作按钮（分隔式）

### Default（默认状态）

**外观**
- **背景色**：`#0D121B`（Neutral-00，页面背景色）
- **文字色**：`#AEC0DE`（Neutral-10，两个按钮都是）
- **分隔线**：
  - 颜色：`#293449`（Neutral-03，3阶卡片）
  - 宽度：1px
  - 位置：两个按钮中间
- **尺寸**：
  - 高度：32px
  - 每个按钮宽度：约 88px
  - 总宽度：177px（含分隔线）
- **内边距**：每个按钮 0 16px
- **圆角**：2px

**示例**
```
┌────────────┬────────────┐
│ 应急调度   │ 历史影像   │  ← 两个按钮 + 中间分隔线
└────────────┴────────────┘
```

---

### Hover（悬停状态 - 单个按钮）

**外观**
- **背景色**：`#0D121B`（保持不变）
- **悬停按钮文字色**：`#F6F9FE`（Neutral-11，更亮）
- **另一个按钮文字色**：`#AEC0DE`（保持默认）
- **分隔线**：`#293449`（保持不变）
- **光标**：pointer 手型光标
- **Tooltip**：可能显示（见下方"Tooltip"章节）

**示例**
```
┌────────────┬────────────┐
│ 应急调度   │ 历史影像   │  ← 右侧按钮悬停，文字变亮
└────────────┴────────────┘
                 ☝️
```

---

### Tooltip 显示（Hover 时可选）

**外观**
- **背景色**：`#314059`（Neutral-04，4阶卡片）
- **文字色**：`#F6F9FE`（Neutral-11，标题文字）
- **字号**：14px
- **行高**：22px
- **内边距**：8px 12px
- **圆角**：2px
- **阴影**：
  - `0 4px 8px rgba(18, 18, 18, 0.32)`（较深阴影）
  - `0 0 2px rgba(18, 18, 18, 0.16)`（边缘阴影）
- **箭头**：
  - 位置：底部中间，指向按钮
  - 大小：6px × 6px（预估）
  - 颜色：与 Tooltip 背景色一致

**示例**
```
    ┌──────────┐
    │ 历史影像 │  ← Tooltip
    └─────▼────┘
┌────────────┬────────────┐
│ 应急调度   │ 历史影像   │
└────────────┴────────────┘
```

---

### 应用场景
- ✅ 相关联的两个操作（如：调度和影像查看）
- ✅ 功能切换（如：实时视图和历史视图）
- ✅ 快捷操作栏
- ✅ 地图工具栏

---

## 六、图标+文字按钮

### Default（默认状态）

**外观**
- **背景色**：`#0D121B`（Neutral-00，页面背景色）
- **文字色**：`#AEC0DE`（Neutral-10，主要文字）
- **图标**：
  - 颜色：`#AEC0DE`（与文字一致）
  - 大小：16px × 16px
  - 位置：文字左侧，左边距 16px
  - 与文字间距：4px
- **尺寸**：高度 32px，宽度 108px
- **内边距**：0 16px
- **圆角**：2px

**示例**
```
┌────────────────┐
│ 📊 要素识别    │  ← 左侧图标 + 文字
└────────────────┘
```

---

### Hover（悬停状态）

**外观**
- **背景色**：`#0D121B`（保持不变）
- **文字色**：`#F6F9FE`（Neutral-11，更亮）
- **图标色**：`#F6F9FE`（更亮）
- **光标**：pointer 手型光标

**示例**
```
┌────────────────┐
│ 📊 要素识别    │  ← 文字和图标变亮
└────────────────┘
      ☝️
```

---

### 应用场景
- ✅ 带图标的功能操作
- ✅ 工具栏按钮
- ✅ 地图功能按钮
- ✅ 识别、分析等操作

---

## 七、退出按钮（带图标）

### Default（默认状态）

**外观**
- **背景色**：`#0D121B`（Neutral-00，页面背景色）
- **文字色**：`#AEC0DE`（Neutral-10，主要文字）
- **图标**：
  - 内容：退出图标（门 + 箭头）
  - 颜色：白色（从代码中看到 `fill="white"`）
  - 大小：16px × 16px
  - 位置：文字左侧，左边距约 20%（从 `inset-[30%_61.11%_30%_16.67%]` 推算）
  - 与文字间距：4px
- **尺寸**：高度 32px，宽度 72px
- **内边距**：0 16px（文字居中）
- **圆角**：2px

**示例**
```
┌──────────┐
│ 🚪 退出  │  ← 左侧退出图标 + 文字
└──────────┘
```

---

### Hover（悬停状态）

**外观**
- **背景色**：`#0D121B`（保持不变）
- **文字色**：`#F6F9FE`（Neutral-11，更亮）
- **图标色**：`#AEC0DE`（Neutral-10，从代码中看到 `fill="#AEC0DE"`）
- **光标**：pointer 手型光标

**示例**
```
┌──────────┐
│ 🚪 退出  │  ← 文字变亮，图标颜色调整
└──────────┘
    ☝️
```

---

### 应用场景
- ✅ 退出全屏模式
- ✅ 退出编辑模式
- ✅ 关闭功能面板
- ✅ 退出特定视图

---

## 八、切换按钮组（纯图标）

这是一组用于视图切换的图标按钮，通常有2-3个选项。

### Default（默认状态）

**外观**
- **背景色**：`#0D121B`（Neutral-00，每个按钮）
- **图标色**：不详（需从 Figma 确认，预估为 Neutral-10）
- **分隔线**：
  - 颜色：`#293449`（Neutral-03）
  - 宽度：1px
  - 位置：按钮之间
- **尺寸**：
  - 高度：32px
  - 每个按钮宽度：32px（正方形）或自适应
  - 按钮间分隔线：1px
- **圆角**：2px

**示例**
```
┌────┬────┬────┐
│ 👁️ │ 🗺️ │👁️🗺️│  ← 三个图标按钮 + 分隔线
└────┴────┴────┘
```

---

### Hover（悬停状态 - 单个按钮）

**外观**
- **背景色**：`#0D121B`（保持不变）
- **悬停按钮图标色**：可能变亮（需确认）
- **其他按钮**：保持默认
- **光标**：pointer 手型光标

---

### Selected（选中状态）

**外观**
- **背景色**：可能保持 `#0D121B` 或变为 `#293449`（需确认）
- **图标色**：可能使用主色 `#2761CB`（Blue-06）或 `#F6F9FE`（Neutral-11）
- **视觉反馈**：明显区别于未选中状态

**说明**：从截图底部可以看到"选中"标注，但具体样式需要从 Figma 确认。

---

### 应用场景
- ✅ 视图切换（如：列表视图、地图视图、混合视图）
- ✅ 模式切换（如：可见/不可见、查看/编辑）
- ✅ 工具栏快捷操作

---

## 九、颜色规范总结

### 所有特殊按钮的颜色系统

| 元素 | 状态 | 颜色 | 色值 | 说明 |
|------|------|------|------|------|
| **背景色** | Default | Neutral-00 | `#0D121B` | 页面背景色 |
| | Hover | Neutral-00 | `#0D121B` | 保持不变 |
| **文字色** | Default | Neutral-10 | `#AEC0DE` | 主要文字 |
| | Hover | Neutral-11 | `#F6F9FE` | 标题文字，更亮 |
| **图标色** | Default | Neutral-10 | `#AEC0DE` | 与文字一致 |
| | Hover | Neutral-11 | `#F6F9FE` | 与文字一致 |
| **分隔线** | 所有状态 | Neutral-03 | `#293449` | 3阶卡片色 |
| **Tooltip 背景** | Hover | Neutral-04 | `#314059` | 4阶卡片色 |
| **Tooltip 文字** | Hover | Neutral-11 | `#F6F9FE` | 标题文字 |

---

### 特殊说明

#### 退出按钮图标颜色
- **Default**：`white`（#FFFFFF）
- **Hover**：`#AEC0DE`（Neutral-10）

这是唯一一个 Default 状态使用白色图标的按钮。

---

## 十、完整规范速查表

### 功能入口按钮

| 项目 | 数值 |
|------|------|
| **高度** | 32px |
| **内边距** | 0 16px |
| **圆角** | 2px |
| **字号** | 14px |
| **行高** | 22px |
| **图标大小** | 16px × 16px |
| **图标位置** | 右侧 |
| **背景色（Default）** | `#0D121B` |
| **文字色（Default）** | `#AEC0DE` |
| **文字色（Hover）** | `#F6F9FE` |

---

### 双操作按钮

| 项目 | 数值 |
|------|------|
| **高度** | 32px |
| **单个按钮宽度** | 约 88px |
| **总宽度** | 177px |
| **内边距** | 每个 0 16px |
| **圆角** | 2px |
| **字号** | 14px |
| **行高** | 22px |
| **分隔线颜色** | `#293449` |
| **分隔线宽度** | 1px |
| **背景色（Default）** | `#0D121B` |
| **文字色（Default）** | `#AEC0DE` |
| **文字色（Hover）** | `#F6F9FE` |

---

### 图标+文字按钮

| 项目 | 数值 |
|------|------|
| **高度** | 32px |
| **宽度** | 108px |
| **内边距** | 0 16px |
| **圆角** | 2px |
| **字号** | 14px |
| **行高** | 22px |
| **图标大小** | 16px × 16px |
| **图标位置** | 左侧 |
| **图标与文字间距** | 4px |
| **背景色（Default）** | `#0D121B` |
| **文字色（Default）** | `#AEC0DE` |
| **文字色（Hover）** | `#F6F9FE` |

---

### 退出按钮

| 项目 | 数值 |
|------|------|
| **高度** | 32px |
| **宽度** | 72px |
| **内边距** | 0 16px |
| **圆角** | 2px |
| **字号** | 14px |
| **行高** | 22px |
| **图标大小** | 16px × 16px |
| **图标位置** | 左侧 |
| **背景色（Default）** | `#0D121B` |
| **图标色（Default）** | `#FFFFFF` |
| **图标色（Hover）** | `#AEC0DE` |
| **文字色（Default）** | `#AEC0DE` |
| **文字色（Hover）** | `#F6F9FE` |

---

### Tooltip

| 项目 | 数值 |
|------|------|
| **背景色** | `#314059`（Neutral-04） |
| **文字色** | `#F6F9FE`（Neutral-11） |
| **字号** | 14px |
| **行高** | 22px |
| **内边距** | 8px 12px |
| **圆角** | 2px |
| **箭头大小** | 6px × 6px（预估） |
| **阴影** | `0 4px 8px rgba(18,18,18,0.32)` |
| **阴影** | `0 0 2px rgba(18,18,18,0.16)` |

---

## 十一、实现代码（React + Tailwind）

### 1. 功能入口按钮

```tsx
interface FunctionEntryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const FunctionEntryButton: React.FC<FunctionEntryButtonProps> = ({
  children,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className="
        h-[32px] px-4
        bg-[#0D121B]
        text-[#AEC0DE] hover:text-[#F6F9FE]
        rounded-sm
        flex items-center justify-between
        font-['PingFang_SC'] text-sm leading-[22px]
        transition-colors
        disabled:cursor-not-allowed disabled:opacity-50
      "
      onClick={onClick}
      disabled={disabled}
    >
      <span>{children}</span>
      <svg className="w-4 h-4 ml-2" viewBox="0 0 16 16" fill="none">
        <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );
};

// 使用示例
<FunctionEntryButton onClick={() => console.log('clicked')}>
  人员流动分析
</FunctionEntryButton>
```

---

### 2. 双操作按钮

```tsx
interface DualActionButtonProps {
  leftText: string;
  rightText: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  showTooltip?: boolean;
  tooltipText?: string;
}

export const DualActionButton: React.FC<DualActionButtonProps> = ({
  leftText,
  rightText,
  onLeftClick,
  onRightClick,
  showTooltip = false,
  tooltipText = '',
}) => {
  const [hoveredSide, setHoveredSide] = React.useState<'left' | 'right' | null>(null);

  return (
    <div className="relative flex h-[32px] rounded-sm overflow-hidden">
      {/* 左侧按钮 */}
      <button
        className={`
          flex-1 px-4 bg-[#0D121B]
          ${hoveredSide === 'left' ? 'text-[#F6F9FE]' : 'text-[#AEC0DE]'}
          font-['PingFang_SC'] text-sm leading-[22px]
          transition-colors
        `}
        onMouseEnter={() => setHoveredSide('left')}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={onLeftClick}
      >
        {leftText}
      </button>

      {/* 分隔线 */}
      <div className="w-px bg-[#293449]" />

      {/* 右侧按钮 */}
      <button
        className={`
          flex-1 px-4 bg-[#0D121B]
          ${hoveredSide === 'right' ? 'text-[#F6F9FE]' : 'text-[#AEC0DE]'}
          font-['PingFang_SC'] text-sm leading-[22px]
          transition-colors
        `}
        onMouseEnter={() => setHoveredSide('right')}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={onRightClick}
      >
        {rightText}
      </button>

      {/* Tooltip（可选） */}
      {showTooltip && hoveredSide === 'right' && (
        <div className="
          absolute top-[-40px] right-0
          px-3 py-2 bg-[#314059] text-[#F6F9FE]
          rounded-sm text-sm
          shadow-[0_4px_8px_rgba(18,18,18,0.32),0_0_2px_rgba(18,18,18,0.16)]
        ">
          {tooltipText}
          {/* 箭头 */}
          <div className="absolute bottom-[-4px] right-[20px] w-2 h-2 bg-[#314059] rotate-45" />
        </div>
      )}
    </div>
  );
};

// 使用示例
<DualActionButton
  leftText="应急调度"
  rightText="历史影像"
  onLeftClick={() => console.log('left')}
  onRightClick={() => console.log('right')}
  showTooltip={true}
  tooltipText="历史影像"
/>
```

---

### 3. 图标+文字按钮

```tsx
interface IconTextButtonProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const IconTextButton: React.FC<IconTextButtonProps> = ({
  icon,
  children,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className="
        h-[32px] px-4
        bg-[#0D121B]
        text-[#AEC0DE] hover:text-[#F6F9FE]
        rounded-sm
        flex items-center gap-1
        font-['PingFang_SC'] text-sm leading-[22px]
        transition-colors
        disabled:cursor-not-allowed disabled:opacity-50
      "
      onClick={onClick}
      disabled={disabled}
    >
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </button>
  );
};

// 使用示例
<IconTextButton
  icon={<svg>...</svg>}
  onClick={() => console.log('clicked')}
>
  要素识别
</IconTextButton>
```

---

### 4. 退出按钮

```tsx
interface ExitButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export const ExitButton: React.FC<ExitButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      className="
        h-[32px] px-4
        bg-[#0D121B]
        text-[#AEC0DE] hover:text-[#F6F9FE]
        rounded-sm
        flex items-center justify-center gap-1
        font-['PingFang_SC'] text-sm leading-[22px]
        transition-colors
        disabled:cursor-not-allowed disabled:opacity-50
      "
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 退出图标 */}
      <svg
        className="w-4 h-4"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M6 4L10 8L6 12"
          stroke={isHovered ? '#AEC0DE' : '#FFFFFF'}
          strokeWidth="1.5"
        />
      </svg>
      <span>退出</span>
    </button>
  );
};

// 使用示例
<ExitButton onClick={() => console.log('exit')} />
```

---

### 5. 切换按钮组

```tsx
interface ToggleButtonGroupProps {
  options: Array<{
    id: string;
    icon: React.ReactNode;
    label?: string;
  }>;
  value?: string;
  onChange?: (value: string) => void;
}

export const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <div className="flex h-[32px] rounded-sm overflow-hidden">
      {options.map((option, index) => (
        <React.Fragment key={option.id}>
          {index > 0 && <div className="w-px bg-[#293449]" />}
          <button
            className={`
              w-[32px] h-[32px] bg-[#0D121B]
              flex items-center justify-center
              transition-colors
              ${value === option.id ? 'text-[#F6F9FE]' : 'text-[#AEC0DE]'}
              hover:text-[#F6F9FE]
            `}
            onClick={() => onChange?.(option.id)}
          >
            {option.icon}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

// 使用示例
<ToggleButtonGroup
  options={[
    { id: 'view', icon: <EyeIcon /> },
    { id: 'map', icon: <MapIcon /> },
    { id: 'both', icon: <EyeMapIcon /> },
  ]}
  value="view"
  onChange={(val) => console.log(val)}
/>
```

---

## 十二、使用指南

### 何时使用特殊按钮

| 场景 | 推荐按钮类型 |
|------|-------------|
| 导航到功能页面 | 功能入口按钮（带右箭头） |
| 相关联的两个操作 | 双操作按钮（分隔式） |
| 带图标的功能操作 | 图标+文字按钮 |
| 退出功能或视图 | 退出按钮 |
| 视图/模式切换 | 切换按钮组 |

---

### 与基础按钮的区别

| 特性 | 基础按钮 | 特殊按钮 |
|------|---------|---------|
| **背景色变化** | ✅ 有 | ❌ 无（保持 #0D121B） |
| **交互反馈** | 背景色变化 | 文字/图标颜色变化 |
| **使用场景** | 通用场景 | 特定业务场景（地图、全景） |
| **视觉风格** | 明显的按钮感 | 轻量、扁平 |

---

### 设计原则

#### 1. 轻量化
- 背景色保持深色不变
- 仅通过文字/图标颜色变化提供反馈
- 适合深色界面或地图应用

#### 2. 一致性
- 遵循中性色系统（Neutral-00 至 Neutral-11）
- 圆角、字号与基础按钮保持一致
- 图标大小统一为 16px

#### 3. 可识别性
- Hover 状态有明确的视觉反馈（文字/图标变亮）
- 光标变化为 pointer 手型
- 可选的 Tooltip 提示

---

## 十三、可访问性（Accessibility）

### ARIA 属性

```html
<!-- 功能入口按钮 -->
<button
  type="button"
  aria-label="查看人员流动分析"
>
  人员流动分析 →
</button>

<!-- 双操作按钮 -->
<div role="group" aria-label="操作选项">
  <button aria-label="应急调度">应急调度</button>
  <button aria-label="历史影像">历史影像</button>
</div>

<!-- 切换按钮组 -->
<div role="radiogroup" aria-label="视图切换">
  <button role="radio" aria-checked="true" aria-label="查看视图">👁️</button>
  <button role="radio" aria-checked="false" aria-label="地图视图">🗺️</button>
</div>
```

---

### 键盘支持

| 按键 | 功能 |
|------|------|
| **Tab** | 移动焦点到下一个按钮 |
| **Shift + Tab** | 移动焦点到上一个按钮 |
| **Enter / Space** | 激活按钮 |
| **Arrow Left/Right** | 在按钮组中切换（切换按钮组） |

---

### 焦点样式

```css
.special-button:focus-visible {
  outline: 2px solid #2761CB; /* Blue-06 */
  outline-offset: 2px;
}
```

---

## 十四、常见问题

### 1. 特殊按钮什么时候使用？
- ✅ 地图应用、全景地图
- ✅ 工具栏、功能面板
- ✅ 需要轻量化交互的场景
- ❌ 表单提交、主要操作（使用基础按钮）

### 2. 为什么背景色不变化？
- 特殊按钮通常在深色背景（如地图）上使用
- 背景色变化可能干扰地图或其他内容的显示
- 文字/图标颜色变化足以提供交互反馈

### 3. Tooltip 什么时候显示？
- 仅在 Hover 状态时显示
- 用于提供额外信息或操作提示
- 非必需，可根据需要选择是否显示

### 4. 如何选择按钮类型？
- **单个操作** → 功能入口按钮或图标+文字按钮
- **两个相关操作** → 双操作按钮
- **多个视图切换** → 切换按钮组
- **退出操作** → 退出按钮

---

**提供日期**：2024-12-20  
**更新日期**：2024-12-20  
**状态**：✅ 已完整更新（含精确色值和 Figma 导入数据）

---

**设计出处**：SENSORO 设计规范 / 全景地图  
**设计理念**："有一天，所有人所有事所有物都会发出一个信号"
