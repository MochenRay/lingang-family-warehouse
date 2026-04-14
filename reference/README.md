# Reference 文件夹说明

> 本文件夹用于存放威海市家庭数仓系统的设计规范、参考资料和调整记录

---

## 📁 文件结构

```
/reference/
├── README.md                      # 本文件
├── 01_SYSTEM_INVENTORY.md         # ✅ 系统现状梳理清单
├── 02_DESIGN_SPECS.md             # ✅ 设计规范整理（100% 完成）
├── QUICK_REFERENCE.md             # ✅ 快速参考 - 需要的设计资料清单
├── SUMMARY.md                     # ✅ 项目总结（100% 完成度）
├── design-files/                  # 📂 设计文件存放目录
│   └── specs/                     # ✅ 设计规范文档（27个文档，100+组件）
│       ├── color-palette.md       # ✅ 基础色板（10色系×10层级）
│       ├── neutral-colors.md      # ✅ 中性色系统（8个层级）
│       ├── typography.md          # ✅ 字体排版规范（8个字号档位）
│       ├── border-radius.md       # ✅ 圆角系统（5种分类）
│       ├── shadow.md              # ✅ 阴影系统（4个层级）
│       ├── spacing.md             # ✅ 间距系统（5个标准档位）
│       ├── layout.md              # ✅ 页面布局规范（24栅格）
│       ├── button-component.md    # ✅ 基础按钮（5种类型）
│       ├── button-special.md      # ✅ 特殊按钮
│       ├── data-entry-index.md    # ✅ 数据录入组件索引
│       ├── input.md               # ✅ 输入框
│       ├── input-radio-checkbox.md # ✅ 单选/多选框
│       ├── switch-select.md       # ✅ 开关/下拉选择
│       ├── datepicker-timepicker.md # ✅ 日期/时间选择器
│       ├── cascader.md            # ✅ 级联选择器
│       ├── data-display-index.md  # ✅ 数据展示组件索引
│       ├── tag-badge-tooltip-segmented.md # ✅ 标签/徽标/提示/分段控制器
│       ├── empty-scrollbar-image.md # ✅ 空状态/滚动条/图片
│       ├── progress-slider.md     # ✅ 进度条/滑块
│       ├── feedback-index.md      # ✅ 反馈组件索引
│       ├── feedback.md            # ✅ 反馈组件详细规范
│       ├── navigation-index.md    # ✅ 导航组件索引
│       ├── navigation.md          # ✅ 导航组件详细规范
│       ├── toolbar.md             # ✅ 工具栏组件
│       ├── panel.md               # ✅ 面板组件（11种）
│       ├── charts.md              # ✅ 图表类型（10种）
│       └── chart-components.md    # ✅ 图表组件构成（6大组件）
└── screenshots/                   # 📂 系统现状截图（可选）
```

---

## 🔄 工作流程

### 第一步：系统梳理 ✅ 已完成
- [x] 创建 `01_SYSTEM_INVENTORY.md` - 梳理系统现有内容
- [x] 创建 `QUICK_REFERENCE.md` - 明确需要的设计资料

### 第二步：资料收集 ✅ 已大部分完成
**由用户提供**：
- [x] 设计规范文档（色彩、字体、间距等）
- [x] 组件设计稿或参考（按钮、输入框、数据录入、数据展示等）
- [ ] 关键页面设计稿
- [ ] 对标平台截图

**存放位置**：`design-files/specs/` 目录

### 第三步：规范整理 ✅ 已完成
**由 AI 完成**：
- [x] 创建 `02_DESIGN_SPECS.md` - 整理成结构化的设计规范
- [x] 创建独立组件规范文档（**27个文档**，覆盖100+组件）
  - **基础规范**（7个）：color-palette.md、neutral-colors.md、typography.md、border-radius.md、shadow.md、spacing.md、layout.md
  - **按钮组件**（2个）：button-component.md、button-special.md
  - **数据录入**（6个）：data-entry-index.md、input.md、input-radio-checkbox.md、switch-select.md、datepicker-timepicker.md、cascader.md
  - **数据展示**（4个）：data-display-index.md、tag-badge-tooltip-segmented.md、empty-scrollbar-image.md、progress-slider.md
  - **反馈组件**（2个）：feedback-index.md、feedback.md
  - **导航组件**（2个）：navigation-index.md、navigation.md
  - **工具栏**（1个）：toolbar.md
  - **面板**（1个）：panel.md
  - **图表**（2个）：charts.md、chart-components.md
- [x] 创建 `CONFLICTS_FOUND.md` - 冲突检查和修复记录（已删除，所有冲突已修复）
- [ ] 创建 `03_COMPONENT_MAPPING.md` - 建立现有组件与新规范的对照表（待开始）
- [ ] 创建 `04_ADJUSTMENT_PLAN.md` - 制定详细的调整计划（待开始）

### 第四步：方案确认 ⏳ 待开始
**由用户审核**：
- [ ] 审核整理后的设计规范
- [ ] 确认调整范围和优先级
- [ ] 批准执行计划

### 第五步：统一执行 ⏳ 待开始
**由 AI 执行**：
- [ ] 按计划逐模块调整代码
- [ ] 每批调整后用户验收
- [ ] 记录到 `05_CHANGELOG.md`

---

## 📖 文档说明

### 01_SYSTEM_INVENTORY.md
**系统现状梳理清单**

内容包括：
- 技术栈和架构概览
- 所有页面/功能模块清单（Web + 移动端）
- UI 组件使用情况
- 现有设计元素分析（色彩、字体、间距等）
- 特殊交互模式
- 当前存在的不统一问题

**目的**：全面了解系统现状，为后续调整提供基础

---

### QUICK_REFERENCE.md
**快速参考 - 需要提供的设计资料清单**

内容包括：
- 必需的设计规范清单
- 组件设计稿需求
- 页面设计稿需求
- 数据可视化风格需求
- 对标平台参考建议
- 资料提交方式和模板

**目的**：帮助用户快速了解需要提供哪些资料

---

### 02_DESIGN_SPECS.md（待创建）
**设计规范整理**

将用户提供的设计资料整理成结构化的规范文档：
- 完整的色彩系统
- 字体排版系统
- 间距和栅格系统
- 圆角、阴影、边框规范
- 组件设计规范
- 页面布局规范
- 图表可视化规范

**创建时机**：用户提供设计资料后

---

### 03_COMPONENT_MAPPING.md（待创建）
**组件样式对照表**

建立现有组件与新设计规范的映射关系：

示例格式：
| 组件名 | 当前样式 | 目标样式 | 调整内容 | 优先级 |
|--------|---------|---------|---------|--------|
| Button | bg-blue-600 | bg-primary-600 | 替换色值 | P0 |
| Card | rounded-lg shadow | rounded-xl shadow-md | 调整圆角和阴影 | P1 |

**目的**：明确每个组件需要做哪些调整

---

### 04_ADJUSTMENT_PLAN.md（待创建）
**调整计划和优先级**

制定详细的执行计划：
- 调整范围确定
- 优先级划分（P0/P1/P2）
- 分批次计划
- 时间估算
- 风险评估

**目的**：确保有序、高效地完成调整

---

### 05_CHANGELOG.md（待创建）
**调整日志**

记录每次调整的详细内容：
- 调整日期
- 调整模块
- 调整内容
- 变更对比
- 验收状态

**目的**：可追溯的变更记录

---

## 🎯 关键原则

### 1. 先梳理，后调整
不急于动手，先全面了解现状和目标

### 2. 资料齐全，统一执行
确保设计参考完整后再开始大规模调整

### 3. 分批验收，逐步推进
每批调整后验收，确认无误再继续

### 4. 记录在案，可追溯
所有调整都有据可查

---

## 💡 使用建议

### 对于用户
1. **先阅读** `QUICK_REFERENCE.md` 了解需要准备什么
2. **参考** `01_SYSTEM_INVENTORY.md` 了解系统现状
3. **准备资料** 按清单准备设计规范和参考资料
4. **分批提供** 可以按优先级分批提供，不必一次性完成
5. **及时反馈** 审核整理后的规范文档，提出调整意见

### 对于 AI
1. **保持更新** 根据用户反馈持续更新这些文档
2. **结构化整理** 将用户提供的资料整理成规范文档
3. **详细记录** 每次调整都要记录到 Changelog
4. **主动确认** 有疑问的地方主动与用户确认

---

## 📅 当前状态

- ✅ **已完成**：系统现状梳理
- ✅ **已完成**：设计资料收集（色彩、字体、间距、圆角、阴影、布局、组件）
- ✅ **已完成**：规范文档整理（**27个详细规范文档**，100+组件，**100%完成度**）
- ✅ **已完成**：冲突检查和修复（所有冲突已修复）
- 📋 **待开始**：组件对照表、执行计划制定、代码调整

---

## 📞 下一步行动

**AI 侧（立即进行）**：
- 创建 `03_COMPONENT_MAPPING.md` 组件对照表
- 创建 `04_ADJUSTMENT_PLAN.md` 执行计划

**用户侧（可选）**：
- 审核设计规范文档
- 确认调整范围和优先级
- 批准执行计划后开始代码调整

---

**更新日期**：2024-12-20  
**版本**：v3.0（重大更新：规范体系100%完成，包含27个文档）