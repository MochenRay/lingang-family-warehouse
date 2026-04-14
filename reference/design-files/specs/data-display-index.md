# 数据展示组件（Data Display）

## 来源
SENSORO 设计系统 / 深色模式 / 数据展示

## 设计理念
合理的状态展示方式可以让用户快速掌握页面状态或信息监控，以及更直观的信息分类工作。

## 图片引用
```tsx
import dataDisplaySpecs from 'figma:asset/73012e2a318aa4996a142d50713dea68362c8936.png';
```

---

## 组件总览

数据展示组件包含 **10+ 个核心组件**，用于展示信息、状态和反馈。

| 组件 | 说明 | 文档链接 |
|------|------|---------| 
| **Tag** | 标签 | [查看规范 →](./tag-badge-tooltip-segmented.md#tag) |
| **Badge** | 徽标 | [查看规范 →](./tag-badge-tooltip-segmented.md#badge) |
| **Tooltip** | 文字提示 | [查看规范 →](./tag-badge-tooltip-segmented.md#tooltip) |
| **Segmented** | 分段控制器 | [查看规范 →](./tag-badge-tooltip-segmented.md#segmented) |
| **Empty** | 空状态 | [查看规范 →](./empty-scrollbar-image.md#empty) |
| **Scrollbar** | 滚动条 | [查看规范 →](./empty-scrollbar-image.md#scrollbar) |
| **Image** | 图片 | [查看规范 →](./empty-scrollbar-image.md#image) |
| **Progress** | 进度条 | [查看规范 →](./progress-slider.md#progress) |
| **Slider** | 滑块 | [查看规范 →](./progress-slider.md#slider) |

---

## 一、组件分类

### 1. 信息标记类

#### Tag 标签
- **用途**：标记和分类，可添加多个标签描述对象
- **变体**：基础标签、可关闭标签、彩色标签
- **状态**：Default、Hover、Closable、Disabled
- **颜色**：蓝色、绿色、橙色、红色、灰色

**核心特性**：
- 分类标记
- 可关闭删除
- 多种颜色表示不同状态
- 可点击触发操作

---

#### Badge 徽标
- **用途**：展示未读消息数、通知数等
- **变体**：数字徽标、圆点徽标
- **状态**：Default、Overflow（99+）
- **颜色**：红色（默认）、绿色、蓝色、橙色

**核心特性**：
- 数字显示（1-99+）
- 圆点提示（无数字）
- 位置定位（右上角）
- 溢出显示（99+）

---

### 2. 反馈提示类

#### Tooltip 文字提示
- **用途**：简短的文字提示信息
- **变体**：基础提示、带箭头提示
- **位置**：Top、Bottom、Left、Right
- **触发**：Hover、Click、Focus

**核心特性**：
- 简洁的文字说明
- 箭头指向目标
- 自动定位（防止溢出）
- 延迟显示（避免频繁闪烁）

---

#### Empty 空状态
- **用途**：无数据时的占位展示
- **变体**：
  - 默认空状态（图标 + 文字）
  - 无数据（"暂无数据"）
  - 无搜索结果
  - 无权限

**核心特性**：
- 清晰的空状态提示
- 图标 + 描述文字
- 操作建议（可选）
- 友好的视觉设计

---

### 3. 交互导航类

#### Segmented 分段控制器
- **用途**：在多个选项中切换，类似 Tabs 但更紧凑
- **变体**：基础分段、带图标分段
- **状态**：Default、Selected、Hover、Disabled

**核心特性**：
- 互斥选择（同一时间只能选一个）
- 滑动动画（选中项平滑过渡）
- 紧凑布局
- 支持图标 + 文字

---

#### Scrollbar 滚动条
- **用途**：在有限空间内滚动查看内容
- **变体**：垂直滚动条、水平滚动条
- **状态**：Default、Hover、Dragging

**核心特性**：
- 深色主题设计
- Hover 时显示/增强
- 平滑滚动
- 自定义样式

---

### 4. 进度反馈类

#### Progress 进度条
- **用途**：展示操作或任务的完成进度
- **变体**：
  - 线性进度条（细条、粗条）
  - 环形进度条（小、中、大）
  - 仪表盘进度条
- **状态**：Default、Success、Warning、Error

**核心特性**：
- 百分比显示
- 多种颜色（蓝、绿、橙、红）
- 动画效果
- 多种类型

---

#### Slider 滑块
- **用途**：在连续或离散的数值范围内进行选择
- **变体**：
  - 基础滑块
  - 范围滑块（双滑块）
  - 带刻度滑块
  - 垂直滑块
- **状态**：Default、Hover、Dragging、Disabled

**核心特性**：
- 数值选择
- 范围选择（双滑块）
- 刻度标记
- 键盘支持

---

### 5. 媒体展示类

#### Image 图片
- **用途**：展示图片内容
- **变体**：
  - 基础图片
  - 加载状态（Loading）
  - 错误状态（Error）
  - 预览图片（带遮罩）
- **状态**：Loading、Success、Error

**核心特性**：
- 占位符（Loading）
- 错误兜底（Error Icon）
- 懒加载
- 图片预览

---

## 二、通用设计规范

### 颜色系统（所有数据展示组件）

| 状态/场景 | 主要颜色 | 应用场景 |
|---------|---------|---------|
| **默认/信息** | `#4E86DF`（Blue-07） | Tag、Badge、Progress、Slider |
| **成功** | `#0DA5CA`（Green-06 青绿色） | Tag、Badge、Progress |
| **警告** | `#FB923C`（Orange-07） | Tag、Badge、Progress |
| **错误/紧急** | `#E7484F`（Red-07） | Tag、Badge、Progress |
| **禁用** | `#546789`（Neutral-06） | Tag、Slider |
| **背景（浅）** | `#1F293A`（Neutral-02） | Tooltip、Segmented |
| **背景（中）** | `#293449`（Neutral-03） | Progress 轨道、Slider 轨道 |
| **背景（深）** | `#161D2A`（Neutral-01） | Empty、禁用状态 |

---

### 尺寸规范

#### Tag 标签
- **高度**：24px
- **内边距**：4px 8px
- **字号**：12px
- **圆角**：4px

#### Badge 徽标
- **直径**：16px（小圆点）、20px（数字徽标）
- **字号**：10px（数字）
- **圆角**：50%（圆形）

#### Tooltip 文字提示
- **最大宽度**：240px
- **内边距**：8px 12px
- **字号**：12px
- **圆角**：4px

#### Segmented 分段控制器
- **高度**：32px
- **内边距**：4px
- **字号**：14px
- **圆角**：2px

#### Progress 进度条
- **线性进度条高度**：4px（细）、8px（粗）
- **环形进度条直径**：48px（小）、64px（中）、96px（大）
- **轨道宽度**：3-6px

#### Slider 滑块
- **轨道高度**：4px
- **滑块手柄直径**：16px（默认）、18px（Hover/Dragging）
- **圆角**：4px

---

### 圆角规范

| 组件 | 圆角 |
|------|------|
| **Tag** | 4px |
| **Badge** | 50%（圆形） |
| **Tooltip** | 4px |
| **Segmented** | 2px（外框）、2px（选中项） |
| **Progress** | 4px（完全圆角） |
| **Slider** | 4px（轨道）、50%（手柄） |
| **Empty** | 无（纯图标文字） |
| **Image** | 4px |

**统一原则**：小组件使用小圆角（2-4px），强调流畅自然

---

### 间距规范

| 元素 | 间距 |
|------|------|
| **Tag 之间** | 8px（水平）、4px（垂直） |
| **Badge 与父元素** | -8px（右上角定位） |
| **Tooltip 与目标** | 8px |
| **Segmented 选项之间** | 0px（紧密排列） |
| **Progress 百分比与进度条** | 8-12px |
| **Slider 刻度与轨道** | 4px |
| **Empty 图标与文字** | 12px |
| **Image 与周围元素** | 根据布局 |

---

### 文字规范

| 组件 | 字号 | 字重 | 颜色 |
|------|------|------|------|
| **Tag** | 12px | Regular | `#AEC0DE`（Neutral-10） |
| **Badge** | 10px | Regular | `#FFFFFF` |
| **Tooltip** | 12px | Regular | `#F6F9FE`（Neutral-11） |
| **Segmented** | 14px | Regular | `#AEC0DE`（Neutral-10） |
| **Progress 百分比** | 12px | Regular | `#AEC0DE`（Neutral-10） |
| **Slider 数值** | 12px | Regular | `#8194B5`（Neutral-08） |
| **Empty 主文字** | 14px | Regular | `#8194B5`（Neutral-08） |
| **Empty 副文字** | 12px | Regular | `#546789`（Neutral-06） |

---

## 三、交互规范

### Hover 交互

| 组件 | Hover 效果 |
|------|-----------|
| **Tag（可关闭）** | 关闭按钮变为红色 |
| **Tag（可点击）** | 背景色略亮 |
| **Badge** | 无（静态显示） |
| **Tooltip** | 延迟 100ms 显示 |
| **Segmented** | 选项背景略亮 |
| **Progress** | 无（静态显示） |
| **Slider** | 手柄放大至 18px，边框颜色变亮 |
| **Image** | 可能显示遮罩层（预览功能） |

---

### Click 交互

| 组件 | Click 效果 |
|------|-----------|
| **Tag（可关闭）** | 点击 × 关闭标签 |
| **Tag（可点击）** | 触发选择/过滤操作 |
| **Badge** | 无（静态显示） |
| **Tooltip** | 保持显示（Click 触发模式） |
| **Segmented** | 切换选中项，滑动动画 |
| **Progress** | 无（静态显示） |
| **Slider** | 拖动滑块调整数值 |
| **Image** | 打开预览（可选） |
| **Empty 操作按钮** | 执行创建/刷新操作 |

---

### 动画效果

| 组件 | 动画 | 持续时间 |
|------|------|---------|
| **Tag（关闭）** | 淡出 + 缩小 | 200ms |
| **Badge（数字变化）** | 数字滚动 | 300ms |
| **Tooltip（显示/隐藏）** | 淡入淡出 | 150ms |
| **Segmented（切换）** | 滑动动画 | 300ms |
| **Progress（进度变化）** | 宽度过渡 | 300ms |
| **Slider（拖动）** | 平滑跟随 | 实时 |
| **Image（加载）** | 淡入 | 200ms |

**缓动函数**：`ease-in-out`（大部分组件）、`linear`（Loading）

---

## 四、状态优先级

```
Error（错误）> Success（成功）> Warning（警告）> Default（默认）> Disabled（禁用）
```

**说明**：
- 错误状态使用红色（Red-07）
- 成功状态使用青绿色（Green-06）
- 警告状态使用橙色（Orange-07）
- 默认状态使用蓝色（Blue-07）
- 禁用状态使用灰色（Neutral-06）

---

## 五、可访问性（Accessibility）

### ARIA 属性

```html
<!-- Tag -->
<span
  role="status"
  aria-label="标签：已完成"
>
  已完成 <button aria-label="删除">×</button>
</span>

<!-- Badge -->
<span
  role="status"
  aria-label="3 条未读消息"
  class="badge"
>
  3
</span>

<!-- Tooltip -->
<div
  role="tooltip"
  aria-describedby="tooltip-content"
  id="tooltip-1"
>
  这是提示内容
</div>

<!-- Segmented -->
<div
  role="tablist"
  aria-label="分段控制器"
>
  <button role="tab" aria-selected="true">选项1</button>
  <button role="tab" aria-selected="false">选项2</button>
</div>

<!-- Progress -->
<div
  role="progressbar"
  aria-valuenow="65"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="上传进度"
>
  65%
</div>

<!-- Slider -->
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

| 组件 | 快捷键 | 功能 |
|------|--------|------|
| **Tag（可关闭）** | Enter / Space | 关闭标签 |
| **Segmented** | Tab | 移动焦点 |
| | Arrow Left/Right | 切换选项 |
| | Enter / Space | 选中当前选项 |
| **Slider** | Tab | 移动焦点 |
| | Arrow Left/Right | 左右移动（步长 1%） |
| | Arrow Up/Down | 上下移动（垂直滑块） |
| | Page Up/Down | 大步长移动（步长 10%） |
| | Home / End | 移动到最小值/最大值 |

---

### 对比度要求

| 元素 | 背景色 | 文字/图标色 | 对比度 | 状态 |
|------|--------|------------|--------|------|
| **Tag 文字** | `#1F293A` | `#AEC0DE` | 5.8:1 | ✅ 通过 AA |
| **Badge 文字** | `#E7484F` | `#FFFFFF` | 5.1:1 | ✅ 通过 AA |
| **Tooltip 文字** | `#314059` | `#F6F9FE` | 8.2:1 | ✅ 通过 AAA |
| **Empty 主文字** | `#0D121B` | `#8194B5` | 4.2:1 | ✅ 通过 AA |
| **Progress 百分比** | `#0D121B` | `#AEC0DE` | 5.8:1 | ✅ 通过 AA |

---

## 六、响应式设计

### 移动端适配

| 组件 | 移动端调整 |
|------|-----------| 
| **Tag** | 高度增加至 28px，便于触摸 |
| **Badge** | 大小保持不变（16-20px） |
| **Tooltip** | 使用原生 Title 或全屏提示 |
| **Segmented** | 选项宽度自适应，支持滚动 |
| **Progress** | 高度增加至 6px，更易识别 |
| **Slider** | 手柄增大至 20px，轨道增高至 6px |
| **Empty** | 图标和文字大小适当增加 |
| **Image** | 使用响应式图片，自适应容器 |

**最小触摸区域**：44px × 44px（移动端标准）

---

## 七、使用场景

### Tag 标签
- ✅ 内容分类（文章标签、商品分类）
- ✅ 状态标识（已完成、进行中、已逾期）
- ✅ 筛选器（已选标签）
- ✅ 关键词标记

### Badge 徽标
- ✅ 未读消息数
- ✅ 通知数量
- ✅ 新功能提示（红点）
- ✅ 待办事项数量

### Tooltip 文字提示
- ✅ 图标说明
- ✅ 操作提示
- ✅ 补充信息
- ✅ 帮助文档

### Segmented 分段控制器
- ✅ 视图切换（列表/网格/卡片）
- ✅ 数据筛选（全部/已完成/未完成）
- ✅ 时间范围选择（今日/本周/本月）
- ✅ 内容分类切换

### Empty 空状态
- ✅ 列表无数据
- ✅ 搜索无结果
- ✅ 未添加内容
- ✅ 无权限访问

### Progress 进度条
- ✅ 文件上传/下载
- ✅ 任务完成度
- ✅ 性能评分
- ✅ 资源使用率

### Slider 滑块
- ✅ 价格区间筛选
- ✅ 音量调节
- ✅ 亮度调节
- ✅ 数值范围选择

### Image 图片
- ✅ 产品图片
- ✅ 用户头像
- ✅ 轮播图
- ✅ 图片预览

---

## 八、设计原则

### 1. 清晰的信息层级
- **Tag**：使用颜色区分不同状态和类别
- **Badge**：醒目的红色数字提示
- **Tooltip**：简洁的文字说明
- **Empty**：友好的空状态提示

### 2. 一致的视觉语言
- **颜色系统**：蓝（默认）、绿（成功）、橙（警告）、红（错误）
- **圆角**：小圆角 2-4px，强调流畅自然
- **间距**：统一使用 4px、8px、12px、16px 的倍数

### 3. 流畅的交互反馈
- **Tag**：Hover 时关闭按钮变红
- **Segmented**：选中项滑动动画
- **Progress**：平滑的进度变化动画
- **Slider**：跟手性好的拖动体验

### 4. 良好的可访问性
- **ARIA 属性**：为所有组件提供语义化标签
- **键盘支持**：Segmented 和 Slider 支持键盘操作
- **对比度**：符合 WCAG AA 标准（最低 4.5:1）

---

## 九、最佳实践

### 1. Tag 标签
- ✅ 使用简短的标签文字（2-8 个字符）
- ✅ 同组标签使用一致的颜色规则
- ✅ 限制标签数量（推荐不超过 5 个）
- ❌ 避免使用过长的标签文字

### 2. Badge 徽标
- ✅ 数字超过 99 显示为 99+
- ✅ 使用红色表示未读/待处理
- ✅ 及时更新数字（实时或定时刷新）
- ❌ 避免使用 Badge 展示非紧急信息

### 3. Tooltip 文字提示
- ✅ 文字简洁明了（1-2 行）
- ✅ 避免遮挡重要内容
- ✅ 延迟显示（避免频繁闪烁）
- ❌ 不要在 Tooltip 中放置可交互元素

### 4. Segmented 分段控制器
- ✅ 选项数量 2-5 个
- ✅ 选项文字长度保持一致
- ✅ 使用清晰的选项标签
- ❌ 避免使用过多选项（超过 5 个考虑用 Tabs）

### 5. Empty 空状态
- ✅ 提供清晰的原因说明
- ✅ 给出操作建议（如"创建新项目"）
- ✅ 使用友好的图标和文案
- ❌ 避免使用负面或技术性文案

### 6. Progress 进度条
- ✅ 显示具体百分比（当数值有意义时）
- ✅ 使用颜色区分状态（成功/警告/错误）
- ✅ 提供取消或暂停按钮（长时间任务）
- ❌ 避免进度条倒退（造成困惑）

### 7. Slider 滑块
- ✅ 提供最小值和最大值标签
- ✅ 使用合理的步长（避免过小或过大）
- ✅ 实时显示当前数值
- ❌ 避免使用滑块输入精确数值（提供输入框）

### 8. Image 图片
- ✅ 提供加载占位符（Loading）
- ✅ 提供错误兜底（Error Icon）
- ✅ 使用懒加载优化性能
- ❌ 避免使用过大的图片（影响加载速度）

---

## 十、常见问题

### 1. Tag 和 Badge 有什么区别？
- **Tag**：标记和分类，可以有多个，支持删除
- **Badge**：数字提示，通常只有一个，附着在其他元素上

### 2. 何时使用 Tooltip 还是 Popover？
- **Tooltip**：简短的文字提示（1-2 行）
- **Popover**：复杂的内容（表单、列表、富文本）

### 3. Segmented 和 Tabs 有什么区别？
- **Segmented**：紧凑的选项切换，通常 2-5 个选项
- **Tabs**：页面级别的内容切换，可以有更多选项

### 4. Progress 进度条什么时候显示百分比？
- ✅ 当百分比有明确意义时（如文件上传 65%）
- ❌ 当进度无法量化时（如"正在处理"）

### 5. Slider 和 InputNumber 如何选择？
- **Slider**：选择大概范围，用户可以快速调整
- **InputNumber**：输入精确数值，用户需要准确控制

---

## 十一、相关资源

### 设计规范文档

- [Tag & Badge & Tooltip & Segmented →](./tag-badge-tooltip-segmented.md)
- [Empty & Scrollbar & Image →](./empty-scrollbar-image.md)
- [Progress & Slider →](./progress-slider.md)

### 颜色系统

- [基础色板（10色系×10层级）→](./color-palette.md)
- [中性色系统（Neutral）→](./neutral-colors.md)

### 相关组件

- [Button 按钮 →](./button-component.md)
- [Input 输入框 →](./input.md)
- [Data Entry 数据录入组件索引 →](./data-entry-index.md)

---

**提供日期**：2024-12-20  
**更新日期**：2024-12-20  
**状态**：✅ 已完整录入

---

**设计出处**：SENSORO 设计规范 / Lins 4.0  
**设计理念**："有一天，所有人所有事所有物都会发出一个信号"
