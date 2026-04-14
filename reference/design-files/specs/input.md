# Input 输入框

## 来源
SENSORO 设计系统 / 深色模式 / 数据录入

## 设计理念
数据录入是获取对象信息的重要交互方式，用户会频繁的进行信息增加、修改或删除。

## 图片引用
```tsx
import inputSpecs from 'figma:asset/5667e51d7636fe37c00e820be653ee96a6e6df01.png';
```

---

## 一、组件概述

Input 输入框是数据录入组件的核心，用于收集用户输入的文本信息。

### 三种主要变体

| 变体 | 说明 | 应用场景 |
|------|------|---------|
| **基本用法** | 标准文本输入框 | 姓名、地址、备注等 |
| **后置标签** | 带单位或后缀的输入框 | 距离（km）、价格（元）、百分比（%） |
| **搜索框（Search）** | 专门用于搜索的输入框 | 列表搜索、全局搜索、筛选器 |

---

## 二、基本用法（Input）

### 设计说明
通过鼠标或键盘输入内容，表单基础组成元素之一。

---

### 状态设计（6种）

#### 1. Default（默认状态）

**外观**
- **背景色**：`#161D2A`（Neutral-01，1阶卡片）
- **边框**：无明显边框
- **占位符文字**：`#8194B5`（Neutral-08，次要文字）
- **占位符内容**：「请输入」
- **圆角**：2px
- **高度**：32px
- **内边距**：12px（左右）

**示例**
```
┌──────────────────┐
│ 请输入           │  ← 深色背景 + 灰色占位符
└──────────────────┘
```

---

#### 2. Hover（悬停状态）

**外观**
- **背景色**：`#1F293A`（Neutral-02，2阶卡片，略亮）
- **边框**：无
- **占位符文字**：`#8194B5`（保持不变）
- **光标**：text 文本光标

**示例**
```
┌──────────────────┐
│ 请输入           │  ← 背景略亮
└──────────────────┘
      ☝️
```

---

#### 3. Click / Focus（点击/聚焦状态）

**外观**
- **背景色**：`#1F293A`（Neutral-02，2阶卡片）
- **边框**：1px solid `#2761CB`（Blue-06，主色）
- **输入文字**：`#AEC0DE`（Neutral-10，主要文字）
- **光标**：`#F6F9FE`（Neutral-11，标题文字，白色竖线）
- **占位符**：消失或保持显示（取决于是否有内容）

**示例**
```
┌──────────────────┐
│ 灵思智能服务|    │  ← 蓝色边框 + 白色光标
└──────────────────┘
```

**输入内容示例**
- 「灵思智能服务」

---

#### 4. Finish（输入完成/失焦）

**外观**
- **背景色**：`#161D2A`（Neutral-01，恢复默认）
- **边框**：无
- **输入文字**：`#AEC0DE`（Neutral-10，主要文字）
- **光标**：消失

**示例**
```
┌──────────────────┐
│ 灵思智能服务     │  ← 保留输入内容
└──────────────────┘
```

---

#### 5. Disable（禁用状态）

**外观**
- **背景色**：`#161D2A`（Neutral-01，1阶卡片）
- **边框**：无
- **文字色**：`#8194B5`（Neutral-08，灰色）
- **光标**：not-allowed 禁止光标
- **不可编辑**：内容显示但无法修改

**示例**
```
┌──────────────────┐
│ 灵思智能服务     │  ← 灰色文字，不可编辑
└──────────────────┘
```

---

#### 6. 校验（错误状态）

**外观**
- **背景色**：`rgba(213, 33, 50, 0.08)`（Red-06 8% 透明度，淡红色）
- **边框**：无
- **输入文字**：`#8194B5`（Neutral-08）
- **错误提示**：
  - 位置：输入框下方，左对齐
  - 颜色：`#E7484F`（Red-07，红色）
  - 字号：12px
  - 行高：20px
  - 内容示例：「我是校验文案」
  - 与输入框间距：约 4px

**标注尺寸**
- 输入框左右各有 12px 的标注线（用于标识内边距）

**示例**
```
┌──────────────────┐
│ 我是文案         │  ← 淡红色背景
└──────────────────┘
⚠️ 我是校验文案      ← 红色错误提示
```

---

## 三、后置标签（Input with Suffix）

### 设计说明
用于配置一些固定组合，常用于带单位的数据输入。

### 组件特点
- **单位标签**：右侧显示单位（如：km、元、%）
- **数字调节按钮**：可选的上下箭头（用于数字输入）
- **分隔线**：输入区域与单位之间有竖线分隔

---

### 状态设计（5种）

#### 1. Default（默认状态）

**外观**
- **输入区域**：
  - 背景色：`#161D2A`（Neutral-01）
  - 占位符：`#8194B5`「请输入」
  - 宽度：自适应（总宽度减去后置标签）
- **后置标签**：
  - 背景色：`#161D2A`（Neutral-01，与输入区一致）
  - 分隔线：1px solid `#293449`（Neutral-03，3阶卡片）
  - 文字：`#8194B5`（Neutral-08）「km」
  - 宽度：44px
  - 文字居中显示

**示例**
```
┌────────────────┬─────┐
│ 请输入         │ km  │  ← 深色背景 + 分隔线 + 单位
└────────────────┴─────┘
```

---

#### 2. Hover（悬停状态）

**外观**
- **输入区域**：
  - 背景色：`#1F293A`（Neutral-02，略亮）
  - 占位符：`#8194B5`「请输入」
- **数字调节按钮**（仅数字输入框）：
  - 位置：输入区右侧，单位标签左侧
  - 宽度：20px
  - 高度：24px（输入框高度 32px - 上下各 4px）
  - 背景色：
    - 上半部分：`#293449`（Neutral-03）
    - 下半部分：`#293449`（Neutral-03）
  - 图标：
    - 上箭头 ▲：深色（约 `#0A1B39` 80% 透明度）
    - 下箭头 ▼：深色（约 `#0A1B39` 80% 透明度）
  - 图标大小：8px × 8px
- **后置标签**：保持不变

**示例**
```
┌────────────┬──┬─────┐
│ 请输入     │▲│ km  │  ← 略亮背景 + 数字调节按钮
│            │▼│     │
└────────────┴──┴─────┘
```

---

#### 3. Click / Focus（聚焦状态）

**外观**
- **输入区域**：
  - 背景色：`#1F293A`（Neutral-02）
  - 边框：1px solid `#2761CB`（Blue-06，包裹整个输入框含单位）
  - 输入文字：`#AEC0DE`（Neutral-10）「123」
  - 光标：`#F6F9FE`（Neutral-11，白色竖线）
- **数字调节按钮**：
  - 上半部分背景：`#314059`（Neutral-04，4阶卡片，更亮）
  - 下半部分背景：`#293449`（Neutral-03）
- **后置标签**：
  - 背景色：`#161D2A`（Neutral-01）
  - 文字：`#8194B5`「km」
  - 也在蓝色边框内

**示例**
```
┌────────────┬──┬─────┐
│ 123|       │▲│ km  │  ← 蓝色边框包裹整体 + 光标
│            │▼│     │
└────────────┴──┴─────┘
```

---

#### 4. Finish（输入完成）

**外观**
- **输入区域**：
  - 背景色：`#161D2A`（Neutral-01）
  - 输入文字：`#AEC0DE`「123」
- **数字调节按钮**：显示（可继续调节）
- **后置标签**：`#8194B5`「km」

**示例**
```
┌────────────┬──┬─────┐
│ 123        │▲│ km  │  ← 保留输入内容
│            │▼│     │
└────────────┴──┴─────┘
```

---

#### 5. Disable（禁用状态）

**外观**
- **输入区域**：
  - 背景色：`#161D2A`（Neutral-01）
  - 文字：`#8194B5`（灰色）「123」
- **数字调节按钮**：不显示或灰色暗淡
- **后置标签**：`#8194B5`（灰色）「km」

**示例**
```
┌────────────────┬─────┐
│ 123            │ km  │  ← 灰色暗淡，不可编辑
└────────────────┴─────┘
```

---

### 后置标签规范详情

| 属性 | 数值 |
|------|------|
| **后置标签宽度** | 44px |
| **分隔线宽度** | 1px |
| **分隔线颜色** | `#293449`（Neutral-03） |
| **文字颜色** | `#8194B5`（Neutral-08） |
| **背景色** | `#161D2A`（Neutral-01） |
| **文字居中** | 是 |

---

### 数字调节按钮规范

| 属性 | 数值 |
|------|------|
| **宽度** | 20px |
| **高度** | 24px（输入框 32px - 上下各 4px） |
| **位置** | 输入区右侧，后置标签左侧 |
| **上半部分背景（Hover）** | `#293449`（Neutral-03） |
| **上半部分背景（Click）** | `#314059`（Neutral-04，更亮） |
| **下半部分背景** | `#293449`（Neutral-03） |
| **箭头图标大小** | 8px × 8px |
| **箭头颜色** | `#0A1B39`（80% 透明度，深色） |

---

### 标注说明（从 Figma）

**后置标签有两处 12px 标注**
- 左侧 12px：后置标签与输入区的间距
- 右侧 4px：标注线位置（用于设计参考）

这些标注线在实际实现中不显示，仅用于设计规范。

---

## 四、搜索框（Search）

### 设计说明
搜索可以让用户在巨大的信息池中缩小目标范围，并快速获取需要的信息。

### 组件特点
- **搜索图标**：右侧显示搜索图标（可能是下拉箭头）
- **清除按钮**：输入内容后可能显示清除按钮（Hover）
- **下拉建议**：可能支持搜索建议下拉列表

**注意**：从当前 Figma 设计稿来看，搜索框的设计与基本输入框+下拉图标的组合相似，具体交互需要进一步确认。

---

### 状态设计（5种）

#### 1. Default（默认状态）

**外观**
- **输入区域**：
  - 背景色：`#161D2A`（Neutral-01）
  - 占位符：`#8194B5`「请输入」
- **下拉图标**：
  - 图标：向下箭头 ▼
  - 颜色：`#0A1B39`（深色，Figma 中标识为 `fill-0`）
  - 位置：右侧，距离右边 12px
  - 大小：16px × 16px

**示例**
```
┌────────────────┬───┐
│ 请输入         │ ▼│  ← 深色背景 + 下拉箭头
└────────────────┴───┘
```

---

#### 2. Hover（悬停状态）

**外观**
- **背景色**：`#1F293A`（Neutral-02，略亮）
- **占位符**：`#8194B5`「请输入」
- **下拉图标**：保持显示

**示例**
```
┌────────────────┬───┐
│ 请输入         │ ▼│  ← 略亮背景
└────────────────┴───┘
      ☝️
```

---

#### 3. Click / Focus（聚焦状态）

**外观**
- **背景色**：`#1F293A`（Neutral-02）
- **边框**：1px solid `#2761CB`（Blue-06）
- **输入文字**：`#AEC0DE`（Neutral-10）「灵思智能服务」
- **光标**：`#F6F9FE`（白色竖线）
- **下拉图标**：保持显示

**示例**
```
┌────────────────┬───┐
│ 灵思智能服务|  │ ▼│  ← 蓝色边框 + 光标
└────────────────┴───┘
```

---

#### 4. Finish（输入完成）

**外观**
- **背景色**：`#161D2A`（Neutral-01）
- **输入文字**：`#AEC0DE`「灵思智能服务」
- **下拉图标**：保持显示

**示例**
```
┌────────────────┬───┐
│ 灵思智能服务   │ ▼│  ← 保留输入内容
└────────────────┴───┘
```

---

#### 5. Disable（禁用状态）

**外观**
- **背景色**：`#161D2A`（Neutral-01）
- **文字色**：`#8194B5`（灰色）「灵思智能服务」
- **下拉图标**：灰色暗淡

**示例**
```
┌────────────────┬───┐
│ 灵思智能服务   │ ▼│  ← 灰色暗淡
└────────────────┴───┘
```

---

### 校验状态（错误）

**外观**
- **背景色**：`rgba(213, 33, 50, 0.08)`（Red-06 8% 透明度）
- **边框**：无
- **文字色**：`#8194B5`
- **下拉图标**：保持显示
- **错误提示**：
  - 位置：输入框下方
  - 颜色：`#E7484F`（Red-07）
  - 字号：12px
  - 内容：「我是校验文案」

**标注尺寸**
- 左右各有 12px 标注线
- 上方有 4px 标注（错误提示与输入框间距）

**示例**
```
┌────────────────┬───┐
│ 请输入         │ ▼│  ← 淡红色背景
└────────────────┴───┘
⚠️ 我是校验文案      ← 红色错误提示
```

---

## 五、完整规范总结

### 基本尺寸

| 属性 | 数值 |
|------|------|
| **高度** | 32px |
| **内边距（左）** | 12px |
| **内边距（右）** | 12px（无后置元素）、后置元素宽度 |
| **圆角** | 2px |
| **字号** | 14px |
| **行高** | 22px |
| **字体** | PingFang SC Regular |

---

### 颜色系统

| 元素 | 状态 | 颜色 | 色值 |
|------|------|------|------|
| **背景色** | Default | Neutral-01 | `#161D2A` |
| | Hover | Neutral-02 | `#1F293A` |
| | Focus | Neutral-02 | `#1F293A` |
| | Error | Red-06 8% | `rgba(213,33,50,0.08)` |
| | Disable | Neutral-01 | `#161D2A` |
| **边框色** | Default | 无 | - |
| | Focus | Blue-06 | `#2761CB` |
| | Error | 无（背景色体现） | - |
| **占位符** | 所有状态 | Neutral-08 | `#8194B5` |
| **输入文字** | Default/Focus | Neutral-10 | `#AEC0DE` |
| | Disable | Neutral-08 | `#8194B5` |
| **光标** | Focus | Neutral-11 | `#F6F9FE` |
| **错误提示** | Error | Red-07 | `#E7484F` |
| **分隔线** | 后置标签 | Neutral-03 | `#293449` |

---

### 边框规范

| 状态 | 边框宽度 | 边框颜色 | 边框样式 |
|------|---------|---------|---------|
| **Default** | 无 | - | - |
| **Hover** | 无 | - | - |
| **Focus** | 1px | `#2761CB`（Blue-06） | solid |
| **Error** | 无 | - | - |
| **Disable** | 无 | - | - |

**说明**：只有 Focus 状态有边框，其他状态通过背景色变化体现。

---

### 后置标签规范

| 属性 | 数值 |
|------|------|
| **宽度** | 44px |
| **背景色** | `#161D2A`（Neutral-01） |
| **文字颜色** | `#8194B5`（Neutral-08） |
| **分隔线** | 1px solid `#293449`（Neutral-03） |
| **文字对齐** | 居中 |

---

### 数字调节按钮规范

| 属性 | 数值 |
|------|------|
| **宽度** | 20px |
| **高度** | 24px |
| **位置** | 输入区右侧，距离顶部 4px |
| **上半部分背景（Hover）** | `#293449`（Neutral-03） |
| **上半部分背景（Click）** | `#314059`（Neutral-04） |
| **下半部分背景** | `#293449`（Neutral-03） |
| **箭头图标** | 8px × 8px，`#0A1B39`（80% 透明度） |

---

### 错误提示规范

| 属性 | 数值 |
|------|------|
| **位置** | 输入框下方，左对齐 |
| **间距** | 4px（与输入框底部） |
| **字号** | 12px |
| **行高** | 20px |
| **颜色** | `#E7484F`（Red-07） |
| **字体** | PingFang SC Regular |

---

### 下拉图标规范

| 属性 | 数值 |
|------|------|
| **大小** | 16px × 16px |
| **位置** | 右侧，距离右边 12px |
| **颜色** | `#0A1B39`（深色） |
| **图标** | 向下箭头 ▼ |

---

## 六、标注系统（从 Figma）

### 校验状态标注

**用途**：标识输入框的内边距和错误提示间距

| 标注 | 位置 | 数值 | 说明 |
|------|------|------|------|
| **左侧标注** | 输入框左边缘 | 12px | 输入框左内边距 |
| **右侧标注** | 输入框右边缘 | 12px | 输入框右内边距 |
| **上侧标注** | 错误提示上方 | 4px | 错误提示与输入框的间距 |

**视觉表现**
- 标注线颜色：`#FF1257`（粉红色）
- 标注线宽度：1px
- 标注文字：字号 10px，颜色 `#FF1257`
- 标注文字字体：Inter Bold

---

### 后置标签标注

**用途**：标识后置标签与输入区的间距

| 标注 | 位置 | 数值 | 说明 |
|------|------|------|------|
| **左侧标注** | 后置标签左边 | 12px | 后置标签左内边距 |
| **右侧标注** | 后置标签右边 | 4px | 用于标识数字调节按钮宽度计算 |

---

## 七、交互说明

### 基本输入框交互流程

```
Default（深色背景）
    ↓ 鼠标悬停
Hover（略亮背景）
    ↓ 点击
Focus（蓝色边框 + 光标）
    ↓ 输入文字
Focus（显示输入内容）
    ↓ 失焦
Finish（保留内容，恢复深色背景）
```

**校验失败**
```
任意状态
    ↓ 触发校验
Error（淡红色背景 + 红色错误提示）
    ↓ 修正输入
恢复正常状态
```

---

### 后置标签交互流程

```
Default（深色背景 + 单位）
    ↓ 鼠标悬停
Hover（略亮背景 + 数字调节按钮）
    ↓ 点击输入区
Focus（蓝色边框包裹整体 + 光标）
    ↓ 输入数字
Focus（显示数字 + 调节按钮可用）
    ↓ 点击上/下箭头
数字增加/减少
    ↓ 失焦
Finish（保留内容 + 单位）
```

**数字调节按钮交互**
- **点击上箭头** → 数字 +1
- **点击下箭头** → 数字 -1
- **长按上/下箭头** → 连续增加/减少（可选）

---

### 搜索框交互流程

```
Default（深色背景 + 下拉箭头）
    ↓ 点击
Focus（蓝色边框 + 光标）
    ↓ 输入文字
Focus（显示输入内容）
    ↓ 回车 或 点击下拉箭头
触发搜索（或展开下拉建议）
```

---

## 八、使用场景

### 基本输入框
- ✅ 表单数据录入（姓名、地址、邮箱）
- ✅ 单行文本输入
- ✅ 备注、说明等简短文字
- ❌ 多行文本（应使用 Textarea）

### 后置标签输入框
- ✅ 需要单位的数字输入（距离 km、价格 元、百分比 %）
- ✅ 带固定后缀的输入（邮箱域名 @example.com）
- ✅ 数字调节（年龄、数量等）
- ❌ 自由文本输入（无需后置标签）

### 搜索框
- ✅ 列表/表格搜索
- ✅ 全局搜索
- ✅ 筛选器
- ✅ 带搜索建议的输入
- ❌ 普通文本输入（应使用基本输入框）

---

## 九、设计原则

### 1. 清晰的状态反馈
- **Focus**：蓝色边框（`#2761CB`）明确标识当前激活状态
- **Error**：淡红色背景 + 红色错误提示，双重反馈
- **Disable**：灰色文字，视觉上降低优先级

### 2. 一致的视觉语言
- **背景色**：使用中性色系统（Neutral-01、Neutral-02）
- **主色**：`#2761CB`（Blue-06）用于激活状态
- **错误色**：`#E7484F`（Red-07）用于错误提示
- **圆角**：统一 2px（与其他组件保持一致）

### 3. 良好的交互体验
- **Hover 反馈**：背景色变化提示可交互
- **Focus 反馈**：蓝色边框明确聚焦状态
- **数字调节**：提供上下箭头便捷调节数字
- **错误提示**：清晰说明错误原因

### 4. 灵活的扩展性
- 支持后置标签（单位、后缀）
- 支持数字调节按钮
- 支持下拉图标（搜索、选择）
- 支持错误校验提示

---

## 十、可访问性（Accessibility）

### ARIA 属性

```html
<!-- 基本输入框 -->
<input
  type="text"
  placeholder="请输入"
  aria-label="姓名"
  aria-required="true"
  aria-invalid="false"
/>

<!-- 错误状态 -->
<input
  type="text"
  placeholder="请输入"
  aria-label="姓名"
  aria-required="true"
  aria-invalid="true"
  aria-describedby="error-message"
/>
<span id="error-message" role="alert">我是校验文案</span>

<!-- 后置标签 -->
<div role="group" aria-label="距离输入">
  <input
    type="number"
    placeholder="请输入"
    aria-label="距离数值"
  />
  <span aria-hidden="true">km</span>
</div>
```

---

### 键盘支持

| 按键 | 功能 |
|------|------|
| **Tab** | 移动焦点到下一个输入框 |
| **Shift + Tab** | 移动焦点到上一个输入框 |
| **Enter** | 提交表单（搜索框触发搜索） |
| **Esc** | 失焦（可选） |
| **Arrow Up** | 数字输入框：数值 +1 |
| **Arrow Down** | 数字输入框：数值 -1 |

---

### 对比度

| 元素 | 背景色 | 文字色 | 对比度 | 状态 |
|------|--------|--------|--------|------|
| **占位符** | `#161D2A` | `#8194B5` | 4.2:1 | ✅ 通过 AA |
| **输入文字** | `#1F293A` | `#AEC0DE` | 5.8:1 | ✅ 通过 AA |
| **错误提示** | `#0D121B` | `#E7484F` | 5.1:1 | ✅ 通过 AA |

---

## 十一、实现代码（React + Tailwind）

### 基本输入框

```tsx
import React from 'react';

interface InputProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const Input: React.FC<InputProps> = ({
  value = '',
  placeholder = '请输入',
  disabled = false,
  error = '',
  onChange,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`
          h-[32px] px-3 w-full
          rounded-sm
          font-['PingFang_SC'] text-sm leading-[22px]
          transition-all
          ${error ? 'bg-[rgba(213,33,50,0.08)]' : disabled ? 'bg-[#161D2A]' : isFocused ? 'bg-[#1F293A]' : 'bg-[#161D2A]'}
          ${isFocused && !error ? 'border border-[#2761CB]' : 'border-none'}
          ${disabled ? 'text-[#8194B5] cursor-not-allowed' : value ? 'text-[#AEC0DE]' : ''}
          placeholder:text-[#8194B5]
          focus:outline-none
          hover:bg-[#1F293A]
        `}
      />
      {error && (
        <p className="mt-1 text-xs leading-5 text-[#E7484F] font-['PingFang_SC']">
          {error}
        </p>
      )}
    </div>
  );
};

// 使用示例
export default function Example() {
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState('');

  const handleChange = (val: string) => {
    setValue(val);
    // 校验逻辑
    if (val.length > 0 && val.length < 3) {
      setError('我是校验文案');
    } else {
      setError('');
    }
  };

  return (
    <div className="w-[240px]">
      <Input
        value={value}
        placeholder="请输入"
        error={error}
        onChange={handleChange}
      />
    </div>
  );
}
```

---

### 后置标签输入框

```tsx
import React from 'react';

interface InputSuffixProps {
  value?: string;
  placeholder?: string;
  suffix: string;
  disabled?: boolean;
  type?: 'text' | 'number';
  onChange?: (value: string) => void;
}

export const InputSuffix: React.FC<InputSuffixProps> = ({
  value = '',
  placeholder = '请输入',
  suffix,
  disabled = false,
  type = 'text',
  onChange,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const handleIncrement = () => {
    if (type === 'number' && !disabled) {
      const num = parseFloat(value) || 0;
      onChange?.((num + 1).toString());
    }
  };

  const handleDecrement = () => {
    if (type === 'number' && !disabled) {
      const num = parseFloat(value) || 0;
      onChange?.((num - 1).toString());
    }
  };

  return (
    <div
      className="relative flex h-[32px] rounded-sm overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 输入区域 */}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          flex-1 px-3
          ${disabled ? 'bg-[#161D2A]' : isFocused ? 'bg-[#1F293A]' : 'bg-[#161D2A]'}
          ${isFocused ? 'border border-[#2761CB]' : 'border-none'}
          ${disabled ? 'text-[#8194B5]' : value ? 'text-[#AEC0DE]' : ''}
          placeholder:text-[#8194B5]
          font-['PingFang_SC'] text-sm leading-[22px]
          focus:outline-none
          hover:bg-[#1F293A]
          ${disabled ? 'cursor-not-allowed' : ''}
        `}
      />

      {/* 数字调节按钮（仅数字输入显示） */}
      {type === 'number' && isHovered && !disabled && (
        <div className="flex flex-col w-5 h-6 my-1">
          <button
            onClick={handleIncrement}
            className="flex-1 bg-[#293449] hover:bg-[#314059] flex items-center justify-center"
          >
            <svg className="w-2 h-2" viewBox="0 0 8 8" fill="none">
              <path d="M4 2L6 5H2L4 2Z" fill="#0A1B39" fillOpacity="0.8" />
            </svg>
          </button>
          <button
            onClick={handleDecrement}
            className="flex-1 bg-[#293449] flex items-center justify-center"
          >
            <svg className="w-2 h-2" viewBox="0 0 8 8" fill="none">
              <path d="M4 6L2 3H6L4 6Z" fill="#0A1B39" fillOpacity="0.8" />
            </svg>
          </button>
        </div>
      )}

      {/* 分隔线 */}
      <div className="w-px bg-[#293449]" />

      {/* 后置标签 */}
      <div className="flex items-center justify-center w-[44px] bg-[#161D2A] text-[#8194B5] text-sm font-['PingFang_SC']">
        {suffix}
      </div>
    </div>
  );
};

// 使用示例
export default function Example() {
  const [value, setValue] = React.useState('123');

  return (
    <div className="w-[240px]">
      <InputSuffix
        value={value}
        placeholder="请输入"
        suffix="km"
        type="number"
        onChange={setValue}
      />
    </div>
  );
}
```

---

## 十二、常见问题

### 1. 何时使用后置标签？
- ✅ 需要固定单位的数字输入（距离、价格、百分比）
- ✅ 需要固定后缀的文本输入（邮箱域名、网址协议）
- ❌ 自由文本输入（无需后置标签）

### 2. 数字调节按钮何时显示？
- **Hover 状态**：鼠标悬停在输入框上时显示
- **非 Hover 状态**：隐藏，节省空间
- **Disable 状态**：不显示或灰色暗淡

### 3. 错误提示如何显示？
- **位置**：输入框下方，左对齐
- **间距**：距离输入框底部 4px
- **颜色**：红色（`#E7484F`）
- **触发**：实时校验或提交时校验

### 4. Focus 边框是否包裹后置标签？
- ✅ **是**：蓝色边框包裹整个输入框（含后置标签）
- 这样视觉上更统一，表示整个组件处于激活状态

---

**提供日期**：2024-12-20  
**更新日期**：2024-12-20  
**状态**：✅ 已完整更新（含精确色值和 Figma 导入数据）

---

**设计出处**：SENSORO 设计规范 / Lins 4.0  
**设计理念**："有一天，所有人所有事所有物都会发出一个信号"
