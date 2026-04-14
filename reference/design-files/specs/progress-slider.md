# Progress 进度条 & Slider 滑块

## 来源
SENSORO 设计系统 / 深色模式 / 数据展示

## 设计理念
直观地展示操作进度或允许用户选择数值范围，通过视觉化的方式提升交互体验。

## 图片引用
```tsx
import progressSliderSpecs from 'figma:asset/73012e2a318aa4996a142d50713dea68362c8936.png';
```

---

## 一、进度条（Progress）

### 设计说明
用于展示操作或任务的完成进度，给用户明确的反馈。

### 组件特点
- **百分比显示**：支持显示具体百分比
- **多种颜色**：支持不同颜色表示不同状态
- **动画效果**：支持进度变化动画
- **多种类型**：线性、环形、仪表盘等

---

## 二、线性进度条（Line Progress）

### 1. 基本样式（普通进度条）

**外观规范**
- **容器高度**：4px（细条）
- **容器背景**：`#293449`（Neutral-03，3阶卡片）
- **圆角**：4px（完全圆角）
- **进度条颜色**：根据状态变化

**进度条规范**
- **高度**：4px（填满容器）
- **圆角**：4px（左侧圆角，右侧跟随进度）
- **动画**：宽度变化，过渡时间约 300ms

**示例**
```
┌────────────────────────────────┐
│████████────────────────────────│  ← 25% 进度
└────────────────────────────────┘
```

---

### 2. 颜色状态

#### 蓝色进度条（默认/进行中）

**用途**：默认状态、任务进行中

| 属性 | 值 |
|------|-----|
| **进度条颜色** | `#4E86DF`（Blue-07） |
| **容器背景** | `#293449`（Neutral-03） |
| **百分比文字** | `#AEC0DE`（Neutral-10）（可选） |

**示例**
```
┌────────────────────────────────┐
│████████████──────────────────── │  ← 40% 蓝色
└────────────────────────────────┘
```

---

#### 绿色进度条（成功/完成）

**用途**：成功状态、已完成任务

| 属性 | 值 |
|------|-----|
| **进度条颜色** | `#0DA5CA`（Green-06 青绿色） |
| **容器背景** | `#293449`（Neutral-03） |

**示例**
```
┌────────────────────────────────┐
│████████████████████████████████│  ← 100% 绿色
└────────────────────────────────┘
```

---

#### 橙色进度条（警告）

**用途**：警告状态、需要注意的任务

| 属性 | 值 |
|------|-----|
| **进度条颜色** | `#FB923C`（Orange-07） |
| **容器背景** | `#293449`（Neutral-03） |

---

#### 红色进度条（错误/紧急）

**用途**：错误状态、紧急任务、失败

| 属性 | 值 |
|------|-----|
| **进度条颜色** | `#E7484F`（Red-07） |
| **容器背景** | `#293449`（Neutral-03） |

---

### 3. 带百分比文字

**布局方式**

**方式一：右侧显示**
```
┌──────────────────────┐
│████████──────────────│  65%  ← 右侧显示百分比
└──────────────────────┘
```

**方式二：内部显示**
```
┌──────────────────────┐
│████ 32% ─────────────│  ← 内部显示百分比
└──────────────────────┘
```

**文字规范**
- **字号**：12px
- **颜色**：`#AEC0DE`（Neutral-10）
- **位置**：右侧或内部居中
- **间距**：与进度条间距 8-12px（右侧显示）

---

### 4. 粗进度条

**外观规范**
- **容器高度**：8px（粗条）
- **容器背景**：`#293449`（Neutral-03）
- **圆角**：4px
- **其他规范**：与细进度条一致

**用途**
- 需要更醒目的进度展示
- 仪表盘、主要任务进度

---

## 三、环形进度条（Circle Progress）

### 1. 基本样式

**外观规范**
- **直径**：48px、64px、96px（小、中、大）
- **轨道宽度**：4px
- **轨道颜色**：`#293449`（Neutral-03）
- **进度条宽度**：4px
- **进度条颜色**：根据状态变化
- **起始角度**：-90°（从顶部开始）
- **方向**：顺时针

**中心文字**
- **百分比**：大号字体（如 24px）
- **颜色**：`#F6F9FE`（Neutral-11，标题文字）
- **居中对齐**

**示例**（从图中观察）
```
      ╭─────╮
     ╱ 75%  ╲   ← 蓝色环形进度
    ▕       ▏
     ╲     ╱
      ╰─────╯
```

---

### 2. 颜色状态

| 状态 | 进度条颜色 | 用途 |
|------|-----------|------|
| **默认** | `#4E86DF`（Blue-07） | 进行中 |
| **成功** | `#0DA5CA`（Green-06） | 已完成 |
| **警告** | `#FB923C`（Orange-07） | 需要注意 |
| **错误** | `#E7484F`（Red-07） | 失败/错误 |

---

### 3. 尺寸规范

| 尺寸 | 直径 | 轨道宽度 | 百分比字号 | 用途 |
|------|------|---------|-----------|------|
| **小** | 48px | 3px | 14px | 小型组件、列表项 |
| **中** | 64px | 4px | 18px | 卡片、标准展示 |
| **大** | 96px | 6px | 24px | 仪表盘、重点展示 |

---

## 四、仪表盘进度条（Dashboard Progress）

### 1. 基本样式

**外观规范**
- **形状**：半圆形（180°）
- **直径**：96px、128px（中、大）
- **轨道宽度**：6-8px
- **轨道颜色**：`#293449`（Neutral-03）
- **进度条颜色**：渐变色或纯色
- **起始角度**：-180°（从左侧开始）
- **结束角度**：0°（到右侧）

**中心文字**
- **百分比**：大号字体（如 32px）
- **颜色**：`#F6F9FE`（Neutral-11）
- **标签**：小号字体（如 "完成度"）
- **标签颜色**：`#8194B5`（Neutral-08）

**示例**
```
   ╭───────────╮
  ╱             ╲
 ▕     85%       ▏  ← 仪表盘进度
  ╲   完成度   ╱
   ╰───────────╯
```

---

### 2. 渐变色进度条

**渐变配置**
- **起始色**：`#FB923C`（Orange-07，低值）
- **中间色**：`#4E86DF`（Blue-07，中值）
- **结束色**：`#0DA5CA`（Green-06，高值）
- **渐变方向**：沿着圆弧方向

**用途**
- 性能评分
- 健康度指标
- 质量评估

---

## 五、滑块（Slider）

### 设计说明
用于在连续或离散的数值范围内进行选择，提供直观的交互体验。

### 组件特点
- **数值选择**：支持拖动选择数值
- **范围选择**：支持选择数值范围（双滑块）
- **刻度标记**：支持显示刻度和标签
- **禁用状态**：支持禁用交互

---

## 六、基础滑块（Basic Slider）

### 1. 默认状态

**轨道规范**
- **容器高度**：4px
- **容器背景**：`#293449`（Neutral-03）
- **圆角**：4px
- **宽度**：100%（自适应）

**已选中部分**
- **背景色**：`#4E86DF`（Blue-07）
- **高度**：4px
- **圆角**：4px（左侧圆角）

**滑块手柄（Thumb）**
- **形状**：圆形
- **直径**：16px
- **背景色**：`#F6F9FE`（Neutral-11，白色）
- **边框**：2px solid `#4E86DF`（Blue-07）
- **阴影**：轻微阴影（可选）
  - `box-shadow: 0 2px 4px rgba(0,0,0,0.2)`

**示例**
```
━━━━━━━━○────────────────  ← 滑块在 40% 位置
```

---

### 2. Hover 状态

**滑块手柄**
- **直径**：18px（略微放大）
- **背景色**：`#F6F9FE`
- **边框**��2px solid `#7CAEF5`（Blue-08，更亮）
- **阴影**：加强
  - `box-shadow: 0 2px 8px rgba(78,134,223,0.3)`

**已选中部分**
- **背景色**：`#7CAEF5`（Blue-08，更亮）

---

### 3. Dragging 状态（拖动中）

**滑块手柄**
- **直径**：18px
- **背景色**：`#F6F9FE`
- **边框**：2px solid `#2761CB`（Blue-06，主色）
- **阴影**：更强阴影
  - `box-shadow: 0 4px 12px rgba(39,97,203,0.4)`

**已选中部分**
- **背景色**：`#2761CB`（Blue-06）

---

### 4. Disabled 状态（禁用）

**轨道**
- **容器背景**：`#161D2A`（Neutral-01，更暗）

**已选中部分**
- **背景色**：`#546789`（Neutral-06，灰色）

**滑块手柄**
- **背景色**：`#8194B5`（Neutral-08）
- **边框**：2px solid `#546789`（Neutral-06）
- **阴影**：无
- **光标**：`cursor: not-allowed`

---

## 七、带刻度的滑块（Slider with Marks）

### 1. 刻度标记

**刻度点**
- **大小**：6px × 6px（圆点）
- **颜色**：
  - 未选中：`#293449`（Neutral-03）
  - 已选中：`#4E86DF`（Blue-07）
- **位置**：轨道上方或下方
- **间距**：根据数值范围均匀分布

**刻度标签**
- **字号**：12px
- **颜色**：`#8194B5`（Neutral-08）
- **位置**：刻度点下方
- **间距**：与刻度点间距 4px

**示例**
```
━━━━●━━━━●━━━━●━━━━●━━━━
    25    50    75   100    ← 刻度标签
```

---

### 2. 带最小/最大标签

**布局**
```
0 ━━━━━━━━○──────────── 100
  ← 最小值              最大值 →
```

**标签规范**
- **字号**：12px
- **颜色**：`#8194B5`（Neutral-08）
- **位置**：轨道两端
- **对齐**：左对齐（最小值）、右对齐（最大值）

---

## 八、范围滑块（Range Slider）

### 1. 基本样式

**双滑块手柄**
- **左滑块**：选择最小值
- **右滑块**：选择最大值
- **样式**：与基础滑块手柄一致

**选中范围**
- **背景色**：`#4E86DF`（Blue-07）
- **高度**：4px
- **位置**：在两个滑块之间

**示例**
```
────○━━━━━━━━━○────────  ← 范围滑块（25%-75%）
```

---

### 2. 数值显示

**Tooltip 显示**
- **位置**：滑块手柄上方
- **背景色**：`#314059`（Neutral-04）
- **文字色**：`#F6F9FE`（Neutral-11）
- **字号**：12px
- **内边距**：4px 8px
- **圆角**：4px
- **箭头**：指向滑块手柄

**示例**
```
   ┌──┐
   │25│  ← Tooltip
   └▼─┘
    ○━━━━━━━━━
```

---

## 九、垂直滑块（Vertical Slider）

### 1. 基本样式

**轨道规范**
- **容器宽度**：4px
- **容器背景**：`#293449`（Neutral-03）
- **圆角**：4px
- **高度**：100%（自适应，建议最小 100px）

**已选中部分**
- **背景色**：`#4E86DF`（Blue-07）
- **宽度**：4px
- **圆角**：4px（底部圆角）
- **方向**：从底部向上

**滑块手柄**
- **样式**：与水平滑块一致
- **位置**：沿着垂直轨道移动

**示例**
```
 ┃
 ┃  ← 未选中
 ○  ← 滑块
 ┃
 ┃  ← 已选中（蓝色）
 ┃
```

---

### 2. 应用场景

- ✅ 音量控制
- ✅ 图层透明度
- ✅ 垂直范围选择
- ✅ 高度/深度调节

---

## 十、进度条完整规范表

### 线性进度条

| 属性 | 细条 | 粗条 |
|------|------|------|
| **容器高度** | 4px | 8px |
| **容器背景** | `#293449` | `#293449` |
| **圆角** | 4px | 4px |
| **进度条颜色（默认）** | `#4E86DF` | `#4E86DF` |
| **进度条颜色（成功）** | `#0DA5CA` | `#0DA5CA` |
| **进度条颜色（警告）** | `#FB923C` | `#FB923C` |
| **进度条颜色（错误）** | `#E7484F` | `#E7484F` |
| **动画时间** | 300ms | 300ms |

---

### 环形进度条

| 尺寸 | 直径 | 轨道宽度 | 进度条宽度 | 百分比字号 |
|------|------|---------|-----------|-----------|
| **小** | 48px | 3px | 3px | 14px |
| **中** | 64px | 4px | 4px | 18px |
| **大** | 96px | 6px | 6px | 24px |

**颜色配置**
- 轨道颜色：`#293449`（Neutral-03）
- 进度条颜色：根据状态使用 Blue-07 / Green-06 / Orange-07 / Red-07

---

### 滑块规范

| 属性 | 默认 | Hover | Dragging | Disabled |
|------|------|-------|----------|----------|
| **轨道背景** | `#293449` | `#293449` | `#293449` | `#161D2A` |
| **已选中背景** | `#4E86DF` | `#7CAEF5` | `#2761CB` | `#546789` |
| **手柄直径** | 16px | 18px | 18px | 16px |
| **手柄背景** | `#F6F9FE` | `#F6F9FE` | `#F6F9FE` | `#8194B5` |
| **手柄边框** | 2px `#4E86DF` | 2px `#7CAEF5` | 2px `#2761CB` | 2px `#546789` |
| **阴影** | 0 2px 4px | 0 2px 8px | 0 4px 12px | 无 |

---

## 十一、交互说明

### 进度条交互

**线性进度条**
1. **加载中**：进度条从 0% 开始逐渐增长
2. **完成**：进度条到达 100%，颜色可能变为绿色
3. **错误**：进度条停止，颜色变为红色

**环形进度条**
1. **动画**：从 0° 开始顺时针旋转
2. **过渡**：使用 ease-in-out 缓动函数
3. **持续时间**：根据进度变化量动态调整

---

### 滑块交互

**基础交互流程**
```
Default（默认状态）
    ↓ 鼠标悬停
Hover（手柄略微放大，颜色变亮）
    ↓ 点击手柄
Dragging（手柄锁定，可拖动）
    ↓ 拖动到目标位置
Dragging（实时更新数值）
    ↓ 释放鼠标
Default（手柄回到正常大小，保持新位置）
```

**键盘支持**
- **←/→**：水平滑块左右移动（步长 1%）
- **↑/↓**：垂直滑块上下移动（步长 1%）
- **Page Up/Down**：大步长移动（步长 10%）
- **Home**：移动到最小值
- **End**：移动到最大值

---

## 十二、使用场景

### 进度条

**线性进度条**
- ✅ 文件上传/下载进度
- ✅ 任务完成度
- ✅ 加载进度
- ✅ 多步骤流程

**环形进度条**
- ✅ 仪表盘数据展示
- ✅ 完成度百分比
- ✅ 性能评分
- ✅ 资源使用率

**仪表盘进度条**
- ✅ 综合评分
- ✅ 健康度指标
- ✅ 性能监控
- ✅ 质量评估

---

### 滑块

**基础滑块**
- ✅ 数值选择（价格、年龄、评分）
- ✅ 音量调节
- ✅ 亮度调节
- ✅ 缩放比例

**范围滑块**
- ✅ 价格区间筛选
- ✅ 日期范围选择
- ✅ 数据过滤

**带刻度滑块**
- ✅ 固定选项选择
- ✅ 评分系统
- ✅ 级别选择

---

## 十三、设计原则

### 1. 清晰的视觉反馈
- **进度条**：颜色区分状态（蓝色进行中、绿色完成、红色错误）
- **滑块**：Hover/Dragging 状态明确

### 2. 流畅的动画
- **进度变化**：使用 ease-in-out 过渡
- **滑块移动**：跟手性好，无延迟
- **过渡时间**：300ms（进度条）、100ms（滑块状态）

### 3. 一致的配色
- **主色**：`#4E86DF`（Blue-07）用于默认状态
- **成功**：`#0DA5CA`（Green-06）
- **警告**：`#FB923C`（Orange-07）
- **错误**：`#E7484F`（Red-07）

### 4. 良好的可访问性
- **滑块**：支持键盘操作
- **进度条**：提供 ARIA 属性
- **对比度**：符合 WCAG 标准

---

## 十四、可访问性（Accessibility）

### ARIA 属性

**进度条**
```html
<div
  role="progressbar"
  aria-valuenow="65"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="上传进度"
>
  <!-- 进度条内容 -->
</div>
```

**滑块**
```html
<div
  role="slider"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="音量"
  tabindex="0"
>
  <!-- 滑块内容 -->
</div>
```

---

### 键盘支持

| 按键 | 功能（滑块） |
|------|-------------|
| **←/→** | 左右移动（水平滑块） |
| **↑/↓** | 上下移动（垂直滑块） |
| **Page Up/Down** | 大步长移动 |
| **Home** | 移动到最小值 |
| **End** | 移动到最大值 |
| **Tab** | 移动焦点到下一个滑块 |

---

## 十五、实现代码（React + Tailwind）

### 线性进度条

```tsx
import React from 'react';

interface ProgressProps {
  value: number; // 0-100
  status?: 'default' | 'success' | 'warning' | 'error';
  showPercent?: boolean;
  size?: 'small' | 'large';
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  status = 'default',
  showPercent = false,
  size = 'small',
}) => {
  const statusColors = {
    default: 'bg-[#4E86DF]',
    success: 'bg-[#0DA5CA]',
    warning: 'bg-[#FB923C]',
    error: 'bg-[#E7484F]',
  };

  const height = size === 'small' ? 'h-1' : 'h-2';

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 bg-[#293449] rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-300 ease-in-out ${statusColors[status]}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showPercent && (
        <span className="text-xs text-[#AEC0DE] min-w-[40px]">
          {value}%
        </span>
      )}
    </div>
  );
};

// 使用示例
export default function Example() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-80 space-y-4">
      <Progress value={progress} showPercent />
      <Progress value={65} status="success" showPercent />
      <Progress value={80} status="warning" showPercent />
      <Progress value={45} status="error" showPercent />
    </div>
  );
}
```

---

### 滑块组件

```tsx
import React from 'react';

interface SliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  value = 50,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  onChange,
}) => {
  const [internalValue, setInternalValue] = React.useState(value);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const percentage = ((internalValue - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
    >
      {/* 轨道 */}
      <div className={`h-1 rounded-full ${disabled ? 'bg-[#161D2A]' : 'bg-[#293449]'}`}>
        {/* 已选中部分 */}
        <div
          className={`h-1 rounded-full transition-colors ${
            disabled
              ? 'bg-[#546789]'
              : isDragging
              ? 'bg-[#2761CB]'
              : isHovered
              ? 'bg-[#7CAEF5]'
              : 'bg-[#4E86DF]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* HTML5 Range Input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={internalValue}
        disabled={disabled}
        onChange={handleChange}
        onMouseDown={() => !disabled && setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        className={`
          absolute top-0 left-0 w-full h-1 opacity-0 cursor-pointer
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
      />

      {/* 滑块手柄 */}
      <div
        className={`
          absolute top-1/2 -translate-y-1/2
          rounded-full bg-[#F6F9FE]
          transition-all duration-100
          pointer-events-none
          ${
            disabled
              ? 'w-4 h-4 border-2 border-[#546789]'
              : isDragging || isHovered
              ? 'w-[18px] h-[18px] border-2'
              : 'w-4 h-4 border-2'
          }
          ${
            disabled
              ? ''
              : isDragging
              ? 'border-[#2761CB] shadow-[0_4px_12px_rgba(39,97,203,0.4)]'
              : isHovered
              ? 'border-[#7CAEF5] shadow-[0_2px_8px_rgba(78,134,223,0.3)]'
              : 'border-[#4E86DF] shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
          }
        `}
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  );
};

// 使用示例
export default function Example() {
  const [volume, setVolume] = React.useState(65);

  return (
    <div className="w-80 space-y-6">
      <div>
        <div className="flex justify-between mb-2 text-xs text-[#8194B5]">
          <span>音量</span>
          <span>{volume}%</span>
        </div>
        <Slider value={volume} onChange={setVolume} />
      </div>
      
      <div>
        <div className="mb-2 text-xs text-[#8194B5]">禁用状态</div>
        <Slider value={50} disabled />
      </div>
    </div>
  );
}
```

---

**提供日期**：2024-12-20  
**状态**：✅ 已完整创建（基于 Figma 导入数据）

---

**设计出处**：SENSORO 设计规范 / Lins 4.0  
**设计理念**："有一天，所有人所有事所有物都会发出一个信号"
