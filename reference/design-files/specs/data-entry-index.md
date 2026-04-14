# 数据录入组件（Data Entry）

## 来源
SENSORO 设计系统 / 深色模式 / 数据录入

## 设计理念
收集用户输入的信息，是产品和用户进行交互的基本方式。

## 图片引用
```tsx
import dataEntrySpecs from 'figma:asset/5667e51d7636fe37c00e820be653ee96a6e6df01.png';
```

---

## 组件总览

数据录入组件包含 **8 个核心组件**，用于收集用户输入信息。

| 组件 | 说明 | 文档链接 |
|------|------|---------|
| **Input** | 输入框 | [查看规范 →](./input.md) |
| **Radio** | 单选框 | [查看规范 →](./input-radio-checkbox.md#radio) |
| **Checkbox** | 多选框 | [查看规范 →](./input-radio-checkbox.md#checkbox) |
| **Switch** | 开关 | [查看规范 →](./switch-select.md#switch) |
| **Select** | 下拉选择 | [查看规范 →](./switch-select.md#select) |
| **DatePicker** | 日期选择器 | [查看规范 →](./datepicker-timepicker.md#datepicker) |
| **TimePicker** | 时间选择器 | [查看规范 →](./datepicker-timepicker.md#timepicker) |
| **Cascader** | 级联选择器 | [查看规范 →](./cascader.md) |

---

## 一、组件分类

### 1. 文本输入类

#### Input 输入框
- **用途**：用户输入文本信息
- **变体**：基础输入、带图标、带清除按钮、密码输入
- **状态**：Default、Hover、Focus、Error、Disabled
- **尺寸**：大（40px）、中（32px）、小（24px）

**核心特性**：
- 支持前缀/后缀图标
- 支持字符计数
- 支持错误提示
- 支持禁用状态

---

### 2. 选择类

#### Radio 单选框
- **用途**：从多个选项中选择一个
- **变体**：基础单选、带描述
- **状态**：Unchecked、Checked、Disabled

**核心特性**：
- 互斥选择（同组只能选一个）
- 支持垂直/水平布局
- 支持禁用状态

#### Checkbox 多选框
- **用途**：从多个选项中选择多个
- **变体**：基础多选、带描述、全选/半选
- **状态**：Unchecked、Checked、Indeterminate、Disabled

**核心特性**：
- 多选支持
- 支持全选/半选状态
- 支持禁用状态

#### Switch 开关
- **用途**：切换某个功能的开/关状态
- **变体**：基础开关、带文字
- **状态**：Off、On、Disabled

**核心特性**：
- 即时生效
- 支持开关文字标签
- 支持禁用状态

#### Select 下拉选择
- **用途**：从下拉列表中选择选项
- **变体**：单选、多选、搜索
- **状态**：Default、Hover、Focus、Disabled

**核心特性**：
- 支持单选/多选
- 支持搜索过滤
- 支持分组显示
- 支持禁用状态

---

### 3. 日期时间类

#### DatePicker 日期选择器
- **用途**：选择日期（年月日）
- **变体**：单日期、日期范围
- **状态**：Default、Hover、Focus、Disabled

**核心特性**：
- 日历面板选择
- 支持快捷选择（今天、本周、本月等）
- 支持日期范围选择
- 支持禁用日期

#### TimePicker 时间选择器
- **用途**：选择时间（时分秒）
- **变体**：单时间、时间范围
- **状态**：Default、Hover、Focus、Disabled

**核心特性**：
- 滚动选择时分秒
- 支持时间范围选择
- 支持禁用时间

---

### 4. 级联类

#### Cascader 级联选择器
- **用途**：选择多级关联数据（如省市区）
- **变体**：单列、多列
- **状态**：Default、Hover、Focus、Disabled

**核心特性**：
- 多级联动选择
- 支持搜索定位
- 支持懒加载
- 支持禁用选项

---

## 二、通用设计规范

### 颜色系统（所有数据录入组件）

| 状态 | 背景色 | 边框色 | 文字色 | 主色 |
|------|--------|--------|--------|------|
| **Default** | `#1F293A` (Neutral-02) | `#293449` (Neutral-03) | `#AEC0DE` (Neutral-10) | - |
| **Hover** | `#293449` (Neutral-03) | `#314059` (Neutral-04) | `#AEC0DE` (Neutral-10) | - |
| **Focus** | `#1F293A` (Neutral-02) | `#2761CB` (Blue-06) | `#AEC0DE` (Neutral-10) | `#2761CB` |
| **Error** | `#1F293A` (Neutral-02) | `#D52132` (Red-06) | `#AEC0DE` (Neutral-10) | `#D52132` |
| **Disabled** | `#161D2A` (Neutral-01) | `#293449` (Neutral-03) | `#546789` (Neutral-06) | - |

---

### 尺寸规范

| 尺寸 | 高度 | 内边距 | 字号 | 行高 |
|------|------|--------|------|------|
| **大** | 40px | 16px | 16px | 24px |
| **中** | 32px | 12px | 14px | 22px |
| **小** | 24px | 8px | 12px | 20px |

**圆角**：统一使用 `2px`（小圆角）  
**字体**：PingFang SC Regular

---

### 间距规范

| 元素 | 间距 |
|------|------|
| **Label 与组件** | 8px（垂直） |
| **组件之间** | 16px（垂直） |
| **表单项之间** | 24px（垂直） |
| **Radio/Checkbox 选项** | 16px（水平）、8px（垂直） |
| **图标与文字** | 4px |

---

### 状态优先级

```
Error（错误）> Focus（聚焦）> Hover（悬停）> Default（默认）> Disabled（禁用）
```

**说明**：
- 错误状态优先级最高，显示红色边框和错误提示
- 聚焦状态显示蓝色边框
- 禁用状态优先级最低，显示灰色样式

---

## 三、交互规范

### 键盘支持

| 组件 | 快捷键 | 功能 |
|------|--------|------|
| **Input** | Tab | 移动焦点 |
| | Enter | 提交表单（可选） |
| | Esc | 清空输入（可选） |
| **Radio** | Tab | 移动焦点到下一个组件 |
| | Arrow Up/Down | 在同组 Radio 中切换 |
| | Space | 选中当前 Radio |
| **Checkbox** | Tab | 移动焦点 |
| | Space | 切换选中状态 |
| **Switch** | Tab | 移动焦点 |
| | Space / Enter | 切换开关状态 |
| **Select** | Tab | 移动焦点 |
| | Enter / Space | 打开/关闭下拉 |
| | Arrow Up/Down | 在选项中移动 |
| | Esc | 关闭下拉 |
| **DatePicker** | Tab | 移动焦点 |
| | Enter / Space | 打开/关闭日期面板 |
| | Arrow Keys | 在日历中导航 |
| | Esc | 关闭日期面板 |
| **TimePicker** | Tab | 移动焦点 |
| | Enter / Space | 打开/关闭时间面板 |
| | Arrow Up/Down | 调整时分秒 |
| | Esc | 关闭时间面板 |
| **Cascader** | Tab | 移动焦点 |
| | Enter / Space | 打开/关闭级联面板 |
| | Arrow Right | 进入下一级 |
| | Arrow Left | 返回上一级 |
| | Esc | 关闭级联面板 |

---

### 鼠标交互

#### Hover（悬停）
- 背景色略微变亮（从 Neutral-02 变为 Neutral-03）
- 光标变为 pointer（选择类组件）
- 光标变为 text（输入类组件）

#### Focus（聚焦）
- 边框颜色变为 `#2761CB`（Blue-06）
- 边框宽度：1px（保持不变）
- 显示光标（输入类组件）

#### Click（点击）
- Radio/Checkbox：切换选中状态
- Switch：切换开关状态
- Select/DatePicker/TimePicker/Cascader：打开面板

---

## 四、错误处理

### 错误提示样式

| 元素 | 样式 |
|------|------|
| **边框颜色** | `#D52132`（Red-06） |
| **错误信息文字** | `#E7484F`（Red-07） |
| **错误信息字号** | 12px |
| **错误信息位置** | 组件下方 4px |

### 错误提示示例

```
┌──────────────────┐
│ [错误的输入内容] │  ← 红色边框
└──────────────────┘
  ⚠️ 请输入正确的格式  ← 红色错误文字
```

---

## 五、可访问性（Accessibility）

### ARIA 属性

```html
<!-- Input -->
<input
  type="text"
  aria-label="用户名"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="error-message"
/>

<!-- Radio -->
<input
  type="radio"
  name="option"
  aria-label="选项A"
  aria-checked="false"
/>

<!-- Checkbox -->
<input
  type="checkbox"
  aria-label="同意条款"
  aria-checked="false"
  aria-disabled="false"
/>

<!-- Switch -->
<button
  role="switch"
  aria-label="开启通知"
  aria-checked="false"
/>

<!-- Select -->
<select
  aria-label="选择城市"
  aria-required="true"
  aria-expanded="false"
>
  <option>选项1</option>
</select>
```

---

### 对比度要求

| 元素 | 背景色 | 文字色 | 对比度 | 状态 |
|------|--------|--------|--------|------|
| **正文** | `#1F293A` | `#AEC0DE` | 5.8:1 | ✅ 通过 |
| **标题** | `#1F293A` | `#F6F9FE` | 9.5:1 | ✅ 通过 |
| **辅助文字** | `#1F293A` | `#546789` | 3.2:1 | ⚠️ 仅辅助信息 |
| **错误文字** | `#0D121B` | `#E7484F` | 5.1:1 | ✅ 通过 |

---

## 六、响应式设计

### 移动端适配

| 组件 | 移动端调整 |
|------|-----------|
| **Input** | 高度增加至 40px，便于触摸 |
| **Radio/Checkbox** | 点击区域增大至 44px × 44px |
| **Switch** | 开关滑块增大，便于操作 |
| **Select** | 使用原生下拉或全屏面板 |
| **DatePicker** | 使用移动端日期选择器 |
| **TimePicker** | 使用移动端时间选择器 |
| **Cascader** | 使用全屏级联面板 |

---

## 七、表单布局

### 垂直布局（推荐）

```
Label 1
┌──────────────────┐
│ Input 1          │
└──────────────────┘

Label 2
┌──────────────────┐
│ Input 2          │
└──────────────────┘
```

**优点**：
- 易于阅读和填写
- 适合移动端
- Label 长度不受限制

---

### 水平布局

```
Label 1    ┌──────────────────┐
           │ Input 1          │
           └──────────────────┘

Label 2    ┌──────────────────┐
           │ Input 2          │
           └──────────────────┘
```

**优点**：
- 节省垂直空间
- 适合简短的表单

**要求**：
- Label 宽度保持一致
- Label 长度不宜过长

---

### 内联布局

```
┌─────────┐  ┌─────────┐  ┌────────┐
│ Input 1 │  │ Input 2 │  │ 提交   │
└─────────┘  └─────────┘  └────────┘
```

**用途**：
- 搜索栏
- 筛选条件
- 快捷操作

---

## 八、最佳实践

### 1. Label 标签
- ✅ 使用清晰、简洁的标签文字
- ✅ 标签文字与组件保持 8px 间距
- ✅ 必填项使用 `*` 标记
- ❌ 避免使用缩写或专业术语

### 2. Placeholder 占位符
- ✅ 提供示例或格式说明
- ✅ 使用浅色文字（Neutral-06）
- ❌ 不要用占位符代替 Label

### 3. 错误提示
- ✅ 及时显示错误信息
- ✅ 说明错误原因和解决方法
- ✅ 使用红色系统色（Red-06、Red-07）
- ❌ 避免使用技术术语

### 4. 禁用状态
- ✅ 使用灰色系（Neutral-01、Neutral-06）
- ✅ 光标显示 `not-allowed`
- ✅ 保持组件可见（不隐藏）
- ❌ 避免过度使用禁用状态

### 5. 默认值
- ✅ 提供合理的默认值
- ✅ 减少用户操作步骤
- ❌ 避免使用可能引起误解的默认值

---

## 九、常见问题

### 1. 何时使用 Radio 还是 Select？
- **Radio**：选项少（2-5个）且需要一眼看清所有选项
- **Select**：选项多（5个以上）或需要节省空间

### 2. 何时使用 Checkbox 还是 Switch？
- **Checkbox**：多选场景或需要提交才生效
- **Switch**：开关场景且即时生效

### 3. 如何处理必填项？
- Label 后添加红色 `*` 号
- 提交时验证并显示错误信息
- 可选使用 `aria-required="true"`

### 4. 输入框需要字符限制吗？
- ✅ 推荐显示字符计数（如：50/200）
- ✅ 达到上限时禁止输入
- ✅ 使用 `maxlength` 属性

---

## 十、相关资源

### 设计规范文档

- [Input 输入框 →](./input.md)
- [Radio & Checkbox 单选/多选 →](./input-radio-checkbox.md)
- [Switch & Select 开关/下拉 →](./switch-select.md)
- [DatePicker & TimePicker 日期/时间选择器 →](./datepicker-timepicker.md)
- [Cascader 级联选择器 →](./cascader.md)

### 颜色系统

- [基础色板（10色系×10层级）→](./color-palette.md)
- [中性色系统（Neutral）→](./neutral-colors.md)

### 相关组件

- [Button 按钮 →](./button-component.md)
- [Tag 标签 →](./tag-badge-tooltip-segmented.md)

---

**提供日期**：2024-12-20  
**更新日期**：2024-12-20  
**状态**：✅ 已完整录入

---

**设计出处**：SENSORO 设计规范 / Lins 4.0  
**设计理念**："有一天，所有人所有事所有物都会发出一个信号"
