# Project Guidelines

## Functional Checklist Management
The file `/docs/FUNCTIONAL_CHECKLIST.md` acts as the authoritative source of truth for the project's progress.

**Rule:**
When making any page modifications, adjustments, or implementing new features, you must:
1.  **Review**: Check `/docs/FUNCTIONAL_CHECKLIST.md` to see which items are being addressed.
2.  **Verify**: Determine if the changes satisfy a previously incomplete item or regress a completed item.
3.  **Update**:
    -   Mark items as completed (`[x]`) if the feature is fully implemented.
    -   Mark items as incomplete (`[ ]`) if a change breaks previously working functionality.
    -   Update the file immediately after the code changes are applied.

## Reference Documentation Priority
以后如果我让你调整或者新增某部分内容，若背景信息不全或具体需求不明，优先在 `docs/brainmap.md` 中进行匹配，若依然不全，再查找 `docs/ppt.md`，若依然不全，则 `docs/Proposal_Ori.md` 作为最终参考。

---

## Design Specification Compliance

**所有UI组件开发和调整必须严格遵循 `/reference/` 目录下的设计规范文档。**

### 规范检查清单

每次进行组件开发或UI调整前，AI 必须：

1. **查阅相关规范文档**
   - **快速查询**：先查看 `/reference/QUICK_VALUES.md` 获取常用数值
   - **详细规范**：查阅 `/reference/design-files/specs/[组件名].md` 获取完整规范
   - **组件对照表**：查看 `/reference/03_COMPONENT_MAPPING.md` 了解现有组件与规范的映射关系
   - **主规范索引**：查看 `/reference/02_DESIGN_SPECS.md` 获取规范总览

2. **确认具体数值**（禁止使用"大概"、"差不多"的数值）
   - **主色调**：Blue-06 = `#2761CB`
   - **Hover 色**：Blue-07 = `#4E86DF`
   - **Click 色**：Blue-05 = `#2251A8`
   - **圆角**：按钮/输入框 `2px`，卡片 `4px`，对话框 `8px`
   - **高度**：按钮 `32px`（中号），输入框 `32px`
   - **间距**：`4px`/`8px`/`12px`/`16px`/`24px`（遵循 8n 原则）

3. **记录调整内容**
   - 更新 `/reference/05_CHANGELOG.md`（如正在执行调整计划）
   - 注明引用的规范文档章节

### 迭代开发规范

每次新增或修改组件时：

1. **先查规范，后写代码**
   - 在 `/reference/design-files/specs/` 中查找对应组件规范
   - 如无规范，先与用户确认设计，再创建规范文档

2. **使用规范中的精确数值**
   - 所有颜色、尺寸、间距必须从规范文档中引用
   - 禁止硬编码或自定义数值
   - 优先使用 CSS 变量或 Tailwind 配置（见下文）

3. **保持规范文档与代码同步**
   - 代码调整后，检查规范文档是否需要更新
   - 如有新发现，及时补充到规范文档

### 技术实现要求

**使用 CSS 变量或 Tailwind 配置**

确保所有设计规范都定义在配置文件中，避免在代码中硬编码数值：

```css
/* /src/styles/theme.css */
:root {
  /* 主色调 - 来自 /reference/design-files/specs/color-palette.md */
  --color-primary: #2761CB;         /* Blue-06 */
  --color-primary-hover: #4E86DF;   /* Blue-07 */
  --color-primary-active: #2251A8;  /* Blue-05 */
  
  /* 功能色 */
  --color-success: #19B172;  /* Green-06 */
  --color-warning: #D6730D;  /* Orange-06 */
  --color-error: #D52132;    /* Red-06 */
  --color-info: #2AA3CF;     /* Light-blue-06 */
  
  /* 圆角 - 来自 /reference/design-files/specs/border-radius.md */
  --radius-sm: 2px;   /* 按钮、输入框、Tag */
  --radius-md: 4px;   /* 卡片、菜单、Tooltip */
  --radius-lg: 8px;   /* 对话框、工具栏容器 */
  --radius-full: 50%; /* 头像 */
  --radius-pill: 9999px; /* Badge、Switch */
  
  /* 间距 - 来自 /reference/design-files/specs/spacing.md */
  --spacing-xs: 4px;   /* 图标与文字 */
  --spacing-sm: 8px;   /* 组件间距 */
  --spacing-md: 12px;  /* 按钮内边距小 */
  --spacing-lg: 16px;  /* 卡片内边距 */
  --spacing-xl: 24px;  /* 区块间距、页面边距 */
}
```

**Tailwind 配置示例**（如使用 Tailwind CSS）：

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2761CB', // Blue-06
          hover: '#4E86DF',   // Blue-07
          active: '#2251A8',  // Blue-05
        },
        success: '#19B172',
        warning: '#D6730D',
        error: '#D52132',
        info: '#2AA3CF',
      },
      borderRadius: {
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
      },
    },
  },
};
```

### 常见错误示例

❌ **错误做法**：
```tsx
// 硬编码颜色值
<button className="bg-[#3366FF]">按钮</button>

// 使用非标准间距
<div className="p-[10px]">卡片</div>

// 不确定的数值
<button style={{ height: '30px' }}>按钮</button> // 应该是 32px
```

✅ **正确做法**：
```tsx
// 使用 CSS 变量
<button className="bg-primary hover:bg-primary-hover">按钮</button>

// 使用标准间距
<div className="p-4">卡片</div> // 16px，符合规范

// 使用规范尺寸
<button className="h-8">按钮</button> // 32px，符合规范
```

### 规范文档快速链接

| 需求 | 查阅文档 |
|------|---------|
| 常用数值（颜色、尺寸、间距） | `/reference/QUICK_VALUES.md` ⭐ 优先查阅 |
| 完整色彩系统 | `/reference/design-files/specs/color-palette.md` |
| 按钮组件 | `/reference/design-files/specs/button-component.md` |
| 输入框 | `/reference/design-files/specs/input.md` |
| 表单组件 | `/reference/design-files/specs/data-entry-index.md` |
| 导航组件（Tabs等） | `/reference/design-files/specs/navigation.md` |
| 反馈组件（Modal等） | `/reference/design-files/specs/feedback.md` |
| 图表规范 | `/reference/design-files/specs/charts.md` |
| 组件对照表 | `/reference/03_COMPONENT_MAPPING.md` |

### 违规处理

如发现以下情况：
- 使用了非规范的颜色值（如 `#3366FF` 应为 `#2761CB`）
- 使用了非标准间距（如 `10px` 应为 `8px` 或 `12px`）
- 组件样式与规范不符

**立即停止开发**，先查阅规范文档，确认正确数值后再继续。