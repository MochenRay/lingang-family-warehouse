# Typography 字体排版规范

## 来源
SENSORO 设计规范 / Lins 4.0

## 设计理念
用户通过文本来理解内容和完成工作，科学的字体系统将大大提升用户的阅读体验及工作效率。

---

## 一、字体家族（Font Family）

### 1.1 系统默认字体

**优先使用系统默认的界面字体**

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 
             'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 
             'Noto Color Emoji';
```

**说明**：
- 该字体栈确保在不同操作系统上获得最佳的字体渲染效果
- macOS/iOS：使用 `-apple-system` (San Francisco)
- Windows：使用 `Segoe UI`
- Android：使用 `Roboto`
- Linux：使用 `Noto Sans`

---

### 1.2 中文字体

**主要中文字体**：PingFang SC（苹方-简体中文）

- **macOS/iOS**：PingFang SC
- **Windows**：Microsoft YaHei（微软雅黑）
- **Fallback**：sans-serif

---

### 1.3 特殊数字字体

**DIN 字体**：用于特殊数字显示

**应用场景**：
- 数据大屏
- 统计数字
- 仪表盘数据
- 金融数字
- 技术参数

**示例**：
```css
font-family: 'DIN', 'Arial', sans-serif;
```

---

## 二、字号系统（Font Size）

### 2.1 字号定义

决定不同层级文本的大小：
- **12px** - 小文本字号
- **14px** - 常规文本字号（正文）
- **16px 及以上** - 标题文字

---

### 2.2 字号与行高对照表

| 字号 | 行高 | 用途 |
|------|------|------|
| **12px** | 20px | 辅助文字、备注、说明 |
| **14px** | 22px | 正文、常规文本 |
| **16px** | 24px | 小标题、强调文本 |
| **20px** | 28px | 次级标题 |
| **24px** | 32px | 一级标题、页面标题 |
| **30px** | 38px | 大标题 |
| **38px** | 46px | 特大标题 |
| **46px** | 54px | 超大标题 |

**规律**：
- **12-14px**：行高 = 字号 + 8px
- **16-24px**：行高 = 字号 + 8px
- **30px 以上**：行高 = 字号 + 8px

---

### 2.3 常用字号分类

#### 文本字号（12-16px）
- **12px**：小字、备注、辅助说明
- **14px**：正文、常规内容
- **16px**：小标题、强调内容

#### 标题字号（20px+）
- **20px**：三级标题（H3）
- **24px**：一级标题（H1）
- **30px+**：特大标题、页面主标题

---

## 三、标题系统（Headings）

### 3.1 标题层级定义

定义不同标题文本的大小、字号、字重、行高。

| 层级 | 样式名称 | 字号 | 字重 | 行高 | 颜色 |
|------|---------|------|------|------|------|
| **H1** | 一级标题 | 24px | 500 (Medium) | 32px | `#0A1B39` |
| **H2** | 二级标题 | 16px | 500 (Medium) | 24px | `#0A1B39` |
| **H3** | 三级标题 | 14px | 500 (Medium) | 22px | `#0A1B39` |

**注意**：字体颜色为 `#0A1B39`（深色，接近黑色）

---

### 3.2 标题使用规范

#### H1 - 一级标题
```css
font-size: 24px;
font-weight: 500; /* Medium */
line-height: 32px;
color: #0A1B39;
font-family: 'PingFang SC', sans-serif;
```

**用途**：
- 页面主标题
- 模块标题
- 面板标题

---

#### H2 - 二级标题
```css
font-size: 16px;
font-weight: 500; /* Medium */
line-height: 24px;
color: #0A1B39;
font-family: 'PingFang SC', sans-serif;
```

**用途**：
- 卡片标题
- 区块标题
- 侧边栏标题

---

#### H3 - 三级标题
```css
font-size: 14px;
font-weight: 500; /* Medium */
line-height: 22px;
color: #0A1B39;
font-family: 'PingFang SC', sans-serif;
```

**用途**：
- 列表标题
- 小区块标题
- 表单分组标题

---

## 四、字重系统（Font Weight）

### 4.1 字重定义

决定不同层级文本的粗细。多数情况下，只出现 **Regular** 以及 **Medium** 的两种字体重量，分别对应代码中的 **400** 和 **500**。在英文字体加粗的情况下会采用 **Semibold** 的字体重量，对应代码中的 **600**。

---

### 4.2 字重对照表

| 字重名称 | 数值 | 用途 |
|---------|------|------|
| **Light** | 300 | 极少使用，特殊场景 |
| **Regular** | 400 | 正文、常规文本 |
| **Medium** | 500 | 标题、强调文本 ⭐ **常用** |
| **Bold** | 600 | 英文加粗、特殊强调 |

**常用字重**：Regular (400) 和 Medium (500)

---

### 4.3 字重使用规范

#### Regular (400)
**使用场景**：
- 正文内容
- 描述性文字
- 辅助说明
- 列表项

```css
font-weight: 400; /* Regular */
```

---

#### Medium (500) ⭐
**使用场景**：
- 所有标题（H1, H2, H3）
- 按钮文字
- Tab 标签
- 强调文字
- 菜单项

```css
font-weight: 500; /* Medium */
```

---

#### Bold (600)
**使用场景**：
- 英文标题加粗
- 特殊数据强调
- 警告/错误信息
- 数据大屏标题

```css
font-weight: 600; /* Bold */
```

---

## 五、字体颜色（Text Color）

### 5.1 颜色层级系统

四个不同层级的文本/图标颜色，依次代表产品界面中**最主要**、**次主要**、**稍次要**和**最次要**的内容。

| 名称 | 对应色盘 | 色值 | 透明度 | 用法 |
|------|---------|------|--------|------|
| **Text 1** | Grey10 | `#0A1B39` | 100% | 文本/图标颜色 - 最主要 |
| **Text 2** | Grey10 | `#0A1B39` | 80% | 文本/图标颜色 - 稍次要 |
| **Text 3** | Grey10 | `#0A1B39` | 60% | 文本/图标颜色 - 次要 |
| **Text 4** | Grey10 | `#0A1B39` | 35% | 文本/图标颜色 - 最次要 |

**注意**：这套颜色系统基于浅色背景，与深色模式的中性色系统不同。

---

### 5.2 颜色使用场景

#### Text 1 - 最主要 (100%)
```css
color: #0A1B39;
opacity: 1;
/* 或者 */
color: rgba(10, 27, 57, 1);
```

**使用场景**：
- 标题文字
- 重要正文
- 主要图标
- 按钮文字

---

#### Text 2 - 稍次要 (80%)
```css
color: rgba(10, 27, 57, 0.8);
```

**使用场景**：
- 正文内容
- 列表项
- 表单标签
- 次要图标

---

#### Text 3 - 次要 (60%)
```css
color: rgba(10, 27, 57, 0.6);
```

**使用场景**：
- 辅助说明
- 时间戳
- 标签文字
- 占位符

---

#### Text 4 - 最次要 (35%)
```css
color: rgba(10, 27, 57, 0.35);
```

**使用场景**：
- 禁用文字
- 次要图标
- 分隔线文字
- Placeholder

---

## 六、链接颜色（Link Color）

### 6.1 链接颜色系统

用于产品中超链接的文本。

| 名称 | 对应色盘 | 色值 | 用法 |
|------|---------|------|------|
| **Link-regular** | Blue 06 | `#2B6DE5` | 链接颜色（默认） |
| **Link-hover** | Blue 05 | `#5591F2` | 链接颜色 - 悬浮 |
| **Link-active** | Blue 07 | `#1B4FBF` | 链接颜色 - 点击 |
| **Link-disabled** | Blue 03 | `#ABD1FF` | 链接颜色 - 禁用 |

**注意**：这里的颜色值与深色模式的 Blue 色系略有不同，请以此为准。

---

### 6.2 链接状态样式

#### Regular - 默认状态
```css
color: #2B6DE5;
text-decoration: none; /* 或 underline */
cursor: pointer;
```

---

#### Hover - 悬浮状态
```css
color: #5591F2;
text-decoration: underline; /* 可选 */
```

---

#### Active - 点击状态
```css
color: #1B4FBF;
```

---

#### Disabled - 禁用状态
```css
color: #ABD1FF;
cursor: not-allowed;
text-decoration: none;
```

---

## 七、段落间距（Paragraph Spacing）

### 7.1 段落间距规则

一般需要用到段落间距的地方为**正文（14px）**及**备注（12px）**。

**规则**：**段间距 = 字号**

---

### 7.2 正文段落（14px）

**字号**：14px  
**段间距**：14px  
**行高**：22px

```css
font-size: 14px;
line-height: 22px;
margin-bottom: 14px; /* 段间距 */
```

**示例文本**：
```html
<p style="margin-bottom: 14px;">
  行距和段间距是最常用的段落格式之一，以Microsoft Word2010软件为例介绍Word中设���行距和段间距的方法：
</p>
<p style="margin-bottom: 14px;">
  第1步，打开Word2010文档窗口，选中需要设置行距的段落或全部文档。
</p>
<p>
  第2步，在"开始"功能区的"段落"分组中单击"行距"按钮，并在打开的行距列表中选中合适的行距。
</p>
```

---

### 7.3 备注段落（12px）

**字号**：12px  
**段间距**：12px  
**行高**：20px

```css
font-size: 12px;
line-height: 20px;
margin-bottom: 12px; /* 段间距 */
```

**示例文本**：
```html
<p style="margin-bottom: 12px;">
  行距和段间距是最常用的段落格式之一，以Microsoft Word2010软件为例介绍Word中设置行距和段间距的方法：
</p>
<p style="margin-bottom: 12px;">
  第1步，打开Word2010文档窗口，选中需要设置行距的段落或全部文档。
</p>
<p>
  第2步，在"开始"功能区的"段落"分组中单击"行距"按钮，并在打开的行距列表中选中合适的行距。
</p>
```

---

## 八、完整的字体规范速查表

### 8.1 标题规范

| 层级 | 字号 | 字重 | 行高 | 颜色 | Tailwind 类 |
|------|------|------|------|------|------------|
| **H1** | 24px | 500 | 32px | `#0A1B39` | `text-2xl font-medium leading-8` |
| **H2** | 16px | 500 | 24px | `#0A1B39` | `text-base font-medium leading-6` |
| **H3** | 14px | 500 | 22px | `#0A1B39` | `text-sm font-medium` |

---

### 8.2 正文规范

| 用途 | 字号 | 字重 | 行高 | 颜色 | Tailwind 类 |
|------|------|------|------|------|------------|
| **正文** | 14px | 400 | 22px | `rgba(10,27,57,0.8)` | `text-sm leading-[22px]` |
| **备注** | 12px | 400 | 20px | `rgba(10,27,57,0.6)` | `text-xs leading-5` |

---

### 8.3 字体颜色规范

| 层级 | 色值 | Tailwind 类（自定义） |
|------|------|--------------------|
| **Text 1** | `rgba(10,27,57,1)` | `text-gray-900` |
| **Text 2** | `rgba(10,27,57,0.8)` | `text-gray-800` |
| **Text 3** | `rgba(10,27,57,0.6)` | `text-gray-600` |
| **Text 4** | `rgba(10,27,57,0.35)` | `text-gray-400` |

---

### 8.4 链接颜色规范

| 状态 | 色值 | Tailwind 类 |
|------|------|------------|
| **Regular** | `#2B6DE5` | `text-blue-600` |
| **Hover** | `#5591F2` | `hover:text-blue-500` |
| **Active** | `#1B4FBF` | `active:text-blue-700` |
| **Disabled** | `#ABD1FF` | `text-blue-300` |

---

## 九、Tailwind CSS 配置建议

### 9.1 字体家族配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        'pingfang': ['PingFang SC', 'sans-serif'],
        'din': ['DIN', 'Arial', 'sans-serif'],
      },
    },
  },
};
```

---

### 9.2 字号和行高配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontSize: {
        'xs': ['12px', { lineHeight: '20px' }],    // 备注
        'sm': ['14px', { lineHeight: '22px' }],    // 正文
        'base': ['16px', { lineHeight: '24px' }],  // H2
        'lg': ['20px', { lineHeight: '28px' }],    // 次级标题
        'xl': ['24px', { lineHeight: '32px' }],    // H1
        '2xl': ['30px', { lineHeight: '38px' }],   // 大标题
        '3xl': ['38px', { lineHeight: '46px' }],   // 特大标题
        '4xl': ['46px', { lineHeight: '54px' }],   // 超大标题
      },
    },
  },
};
```

---

### 9.3 字重配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontWeight: {
        light: 300,
        normal: 400,   // Regular - 正文
        medium: 500,   // Medium - 标题 ⭐
        semibold: 600, // Bold - 加粗
      },
    },
  },
};
```

---

### 9.4 文字颜色配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        text: {
          primary: 'rgba(10, 27, 57, 1)',      // Text 1 - 最主要
          secondary: 'rgba(10, 27, 57, 0.8)',  // Text 2 - 稍次要
          tertiary: 'rgba(10, 27, 57, 0.6)',   // Text 3 - 次要
          disabled: 'rgba(10, 27, 57, 0.35)',  // Text 4 - 最次要
        },
        link: {
          DEFAULT: '#2B6DE5',  // Regular
          hover: '#5591F2',     // Hover
          active: '#1B4FBF',    // Active
          disabled: '#ABD1FF',  // Disabled
        },
      },
    },
  },
};
```

---

## 十、React 组件示例

### 10.1 标题组件

```tsx
import React from 'react';
import clsx from 'clsx';

interface HeadingProps {
  level?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({ 
  level = 1, 
  children, 
  className 
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const headingStyles = {
    1: 'text-2xl font-medium leading-8',      // 24px, 500, 32px
    2: 'text-base font-medium leading-6',     // 16px, 500, 24px
    3: 'text-sm font-medium leading-[22px]',  // 14px, 500, 22px
  };
  
  return (
    <Tag className={clsx('text-[#0A1B39]', headingStyles[level], className)}>
      {children}
    </Tag>
  );
};

// 使用示例
<Heading level={1}>一级标题</Heading>
<Heading level={2}>二级标题</Heading>
<Heading level={3}>三级标题</Heading>
```

---

### 10.2 文本组件

```tsx
import React from 'react';
import clsx from 'clsx';

interface TextProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'disabled';
  size?: 'sm' | 'base';
  children: React.ReactNode;
  className?: string;
}

export const Text: React.FC<TextProps> = ({ 
  variant = 'primary', 
  size = 'sm',
  children, 
  className 
}) => {
  const variantStyles = {
    primary: 'text-[rgba(10,27,57,1)]',      // 100%
    secondary: 'text-[rgba(10,27,57,0.8)]',  // 80%
    tertiary: 'text-[rgba(10,27,57,0.6)]',   // 60%
    disabled: 'text-[rgba(10,27,57,0.35)]',  // 35%
  };
  
  const sizeStyles = {
    sm: 'text-sm leading-[22px]',  // 14px, 22px
    base: 'text-xs leading-5',     // 12px, 20px
  };
  
  return (
    <p className={clsx(variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </p>
  );
};

// 使用示例
<Text variant="primary">主要文本</Text>
<Text variant="secondary">次要文本</Text>
<Text variant="tertiary" size="base">辅助说明</Text>
```

---

### 10.3 链接组件

```tsx
import React from 'react';
import clsx from 'clsx';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const Link: React.FC<LinkProps> = ({ 
  href, 
  children, 
  disabled = false,
  className 
}) => {
  return (
    <a
      href={disabled ? undefined : href}
      className={clsx(
        'text-sm transition-colors',
        {
          'text-[#2B6DE5] hover:text-[#5591F2] active:text-[#1B4FBF] cursor-pointer': !disabled,
          'text-[#ABD1FF] cursor-not-allowed': disabled,
        },
        className
      )}
      onClick={disabled ? (e) => e.preventDefault() : undefined}
    >
      {children}
    </a>
  );
};

// 使用示例
<Link href="/path">普通链接</Link>
<Link href="/path" disabled>禁用链接</Link>
```

---

## 十一、最佳实践

### 11.1 标题使用原则

✅ **推荐做法**：
- 每个页面只有一个 H1
- 标题层级连续（不要跳级：H1 → H3）
- 标题简洁明了（建议不超过 15 个字符）
- 使用 Medium (500) 字重

❌ **避免做法**：
- 一个页面多个 H1
- 标题层级跳跃
- 标题过长换行
- 标题使用 Bold (600) 字重（除非特殊场景）

---

### 11.2 正文使用原则

✅ **推荐做法**：
- 正文使用 14px，行高 22px
- 段落间距 = 字号（14px）
- 使用 Regular (400) 字重
- 颜色使用 Text 2 (80%)

❌ **避免做法**：
- 正文字号过小（< 12px）
- 行高过密（< 字号 + 6px）
- 段落间距不统一
- 颜色对比度不足

---

### 11.3 字体颜色原则

✅ **推荐做法**：
- 标题使用 Text 1 (100%)
- 正文使用 Text 2 (80%)
- 辅助说明使用 Text 3 (60%)
- 禁用文字使用 Text 4 (35%)

❌ **避免做法**：
- 主要内容使用低透明度颜色
- 禁用文字使用高透明度颜色
- 文字与背景对比度不足

---

### 11.4 链接使用原则

✅ **推荐做法**：
- 链接文字清晰表达目标
- 提供 Hover 和 Active 状态反馈
- 禁用链接使用禁用颜色和光标

❌ **避免做法**：
- 链接文字模糊（如"点击这里"）
- 缺少状态反馈
- 禁用链接仍可点击

---

## 十二、可访问性（Accessibility）

### 12.1 颜色对比度

**WCAG 2.1 标准**：
- 正文文字（< 18px）：对比度 ≥ 4.5:1
- 大文字（≥ 18px 或 14px Bold）：对比度 ≥ 3:1

**当前规范检查**：
- Text 1 (100%) vs 白色背景：✅ 通过
- Text 2 (80%) vs 白色背景：✅ 通过
- Text 3 (60%) vs 白色背景：⚠️ 谨慎使用，仅用于辅助信息
- Text 4 (35%) vs 白色背景：❌ 不适用于重要信息

---

### 12.2 语义化标签

✅ **推荐做法**：
```html
<h1>页面主标题</h1>
<h2>区块标题</h2>
<p>正文内容</p>
<a href="/path">链接文字</a>
```

❌ **避免做法**：
```html
<div class="heading1">页面主标题</div>
<span class="link">链接文字</span>
```

---

### 12.3 字体大小可调整

确保用户可以通过浏览器缩放调整字体大小：
- 使用相对单位（rem, em）或绝对单位（px）
- 避免禁用用户缩放
- 测试 200% 缩放下的显示效果

---

## 十三、跨平台一致性

### 13.1 Web 端

- 使用 `-apple-system` 字体栈
- 支持高清屏（Retina）显示
- 确保不同浏览器一致性

---

### 13.2 移动端

- iOS：使用 San Francisco 或 PingFang SC
- Android：使用 Roboto 或 Noto Sans
- 最小字号：12px（避免小于 12px）
- 最小触摸区域：44px × 44px

---

## 附录：字体规范检查清单

### 设计阶段

- [ ] 字号符合规范（12, 14, 16, 20, 24, 30, 38, 46）
- [ ] 行高符合规范（字号 + 8px）
- [ ] 字重正确（标题 500，正文 400）
- [ ] 颜色对比度足够
- [ ] 标题层级连续

### 开发阶段

- [ ] 使用正确的字体栈
- [ ] 字号和行高一致
- [ ] 段落间距 = 字号
- [ ] 链接状态完整（Regular, Hover, Active, Disabled）
- [ ] 语义化标签正确

### 测试阶段

- [ ] 不同浏览器显示一致
- [ ] 移动端显示正常
- [ ] 200% 缩放可用
- [ ] 颜色对比度通过 WCAG 检查
- [ ] 屏幕阅读器可读

---

**提供日期**：2024-12-20  
**状态**：✅ 已完整创建（基于 Figma 导入数据）  
**来源**：SENSORO 设计规范 / Lins 4.0

---

**设计出处**：SENSORO 设计规范 / Lins 4.0  
**设计理念**："有一天，所有人所有事所有物都会发出一个信号"
