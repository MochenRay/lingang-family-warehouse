# 快速参考手册

> 创建时间：2025-01-13  
> 最后更新：2026-07-20（P6 文档同步，对齐 P1a-P4d 精修后的实现）  
> 用途：开发时的快速参考，涵盖最常用的代码片段和规范  
> 目标：5分钟内找到你需要的任何信息  
> **数值正式来源：`src/styles/theme.css`（图表为 `src/app/config/chartConfig.ts`）**

---

## 🎯 目录

- [间距规范](#间距规范)
- [颜色系统](#颜色系统)
- [动画效果](#动画效果)
- [响应式布局](#响应式布局)
- [常用组件](#常用组件)
- [组件模式（patterns）](#组件模式patterns)
- [代码片段](#代码片段)

---

## 📏 间距规范

### 快速查询表
| 用途 | 像素值 | Tailwind |
|------|--------|----------|
| 图标与文字 | 4px | `gap-1` |
| 按钮间距 | 8px | `gap-2` |
| 表单字段间距 | 16px | `gap-4` |
| **页面边距** | **24px** | **`p-6`** |
| **区块间距** | **24px** | **`space-y-6`** |
| **卡片内边距** | **16px** | **`p-4`** |

### 使用示例
```tsx
import { SPACING_CLASSES } from '@/app/config/ui-constants';

// 页面容器（ui-constants 现仅保留 page 一项，其余间距直接写 Tailwind 类）
<main className={SPACING_CLASSES.page}> {/* 24px */}

  {/* 区块间距 */}
  <div className="space-y-6">

    {/* 卡片：标准面板样式统一用 patterns 的 PANEL_CLASS */}
    <div className={PANEL_CLASS}>内容</div>

  </div>
</main>
```

---

## 🎨 颜色系统

### 主色调
```tsx
// Tailwind 语义类（首选）
<Button className="bg-primary">主按钮</Button>

// CSS 变量
style={{ color: 'var(--color-brand-primary)' }}

// Hex 值（仅供查阅，代码中不要手写 hex）
#2761CB  // Blue-06 主色
#4E86DF  // Blue-07 Hover
#2251A8  // Blue-05 Click/Active
```

### 功能色（含 P1a 深底扩展）
```tsx
成功: #19B172  深底文字 #4AD3A0  soft rgba(25,177,114,0.14)
警告: #D6730D  深底文字 #F09640  soft rgba(214,115,13,0.16)
错误: #D52132  深底文字 #EB636F  soft rgba(213,33,50,0.16)
信息: #2AA3CF  深底文字 #62C4E8  soft rgba(42,163,207,0.16)

// 深底文字/软衬底使用语义类，如：
<span className="text-[var(--color-status-success-text)]">成功</span>
<span className="bg-[var(--color-status-success-soft)]">…</span>
```

### 强调紫（P4d 新增）
```tsx
#8B3BCC            // accent-purple
#C9A5F2            // accent-purple-text（深底可读）
rgba(139,59,204,0.16)  // accent-purple-soft
```

### 中性色（暗色模式，现行实现值）
```tsx
页面背景: #131623  // Neutral-00（侧边栏）
内容背景: #1d2336  // Neutral-01
卡片背景: #2c334d  // Neutral-02
边框/三阶: #3d4663 // Neutral-03
最亮层级: #4e587a  // Neutral-04
辅助文字: #6b7599  // Neutral-06
次要文字: #9ba8cc  // Neutral-08
主要文字: #d0daf0  // Neutral-10
标题文字: #ffffff  // Neutral-11
```

---

## ✨ 动画效果

> P1c 收敛后的现状：**全局 `transition-all` 与按钮 hover 位移已移除**（"hover 飘"观感来源），
> 交互动效由各组件 class 受控声明；旧的 `.fade-in / .slide-in-* / .scale-in / .page-load / .card-hover` 全局动画类均已删除。

### 页面进入动画（唯一统一入口）
```tsx
// tailwind.css 定义的 @utility page-enter（0.3s ease-out 淡入）
<div className="page-enter">页面内容</div>
```

### 过渡常量
```tsx
import { TRANSITION_CLASSES } from '@/app/config/ui-constants';

// 现仅保留 default 一项（App.tsx 在用）：
TRANSITION_CLASSES.default  // 'transition-all duration-200 ease-in-out'
```

### 其他
```tsx
// 骨架屏：使用基础组件
import { Skeleton } from '@/app/components/ui/skeleton';
<Skeleton className="h-4 w-32" />

// 录音脉冲动画（MobileVisitForm 专用）：.visit-recording-bar / .visit-recording-dot
// prefers-reduced-motion 已在 animations.css 全局兜底
```

---

## 📱 响应式布局

### 断点
```tsx
移动端: < 768px
平板端: 768px - 1024px
桌面端: > 1024px
```

### 响应式类名
```tsx
// Tailwind 响应式
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 移动端1列，平板端2列，桌面端4列 */}
</div>
```

### 响应式间距
```tsx
// Tailwind 方式
<div className="p-4 md:p-6">
  {/* 移动端16px，平板/桌面24px */}
</div>
```

---

## 🧩 常用组件

### Button
```tsx
import { Button } from '@/app/components/ui/button';

// 主按钮
<Button>确定</Button>

// 次要按钮
<Button variant="outline">取消</Button>

// 危险按钮
<Button variant="destructive">删除</Button>

// 幽灵按钮
<Button variant="ghost">更多</Button>

// 尺寸
<Button size="sm">小按钮</Button>
<Button size="default">中按钮</Button>
<Button size="lg">大按钮</Button>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>
    内容
  </CardContent>
</Card>
```

### Input
```tsx
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

<div>
  <Label htmlFor="name">姓名</Label>
  <Input id="name" placeholder="请输入姓名" />
</div>
```

### Tabs
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">选项1</TabsTrigger>
    <TabsTrigger value="tab2">选项2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">内容1</TabsContent>
  <TabsContent value="tab2">内容2</TabsContent>
</Tabs>
```

### Modal/Dialog
```tsx
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/app/components/ui/dialog';
import { DIALOG_CLASS } from '@/app/components/patterns/surfaces';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  {/* 弹窗标准底色统一使用 DIALOG_CLASS，不要手写深色类 */}
  <DialogContent className={DIALOG_CLASS}>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
    </DialogHeader>
    <div>内容</div>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>关闭</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🧱 组件模式（patterns）

> 位置：`src/app/components/patterns/`（P2 冻结，页面级重复模式统一收口于此）。
> 旧的各页手写 `PANEL_CLASS` / `DARK_CARD_CLASS` / `DARK_DIALOG_CLASS` 常量已全部收敛到这里。

| 组件/常量 | 一句话用法 |
|-----------|-----------|
| `StatCard` | 顶部指标卡：`<StatCard label value hint icon tone?>` |
| `StatusBadge` / `RiskBadge` | 状态/风险徽标，tone: `success \| warning \| error \| info \| neutral` |
| `EmptyState` / `ErrorState` / `LoadingState` | 空态/错误态/加载态占位，替代各页手写空列表提示 |
| `DataTableBody` / `TablePagination` | 表格主体（含 loading/empty 处理）与统一分页条 |
| `ConfirmDialog` | 确认对话框；**全项目原生 `confirm()` 已清零，一律用它** |
| `FilterBar` / `SearchInput` | 筛选条容器与搜索输入，页面筛选区统一组合 |
| `PANEL_CLASS` / `DIALOG_CLASS` | 标准卡片面板/弹窗底色 class，直接用，不要手写深色类 |
| `MobileDetailHeader`（mobile/） | 移动端详情页统一头部（返回 + 标题 + 操作） |

---

## 💻 代码片段

### 完整页面模板
```tsx
import { SPACING_CLASSES } from '@/app/config/ui-constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { StatCard } from '@/app/components/patterns/StatCard';

export function PageTemplate() {
  return (
    <div className={`page-enter ${SPACING_CLASSES.page} space-y-6`}>
      {/* 页面标题：使用语义文字色，不要写 text-gray-*（全项目灰阶 utility 已清零） */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">页面标题</h1>
        <p className="text-sm text-muted-foreground mt-1">页面描述</p>
      </div>

      {/* 响应式指标卡 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="卡片标题" value="1,234" hint="说明文字" />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button>主操作</Button>
        <Button variant="outline">次要操作</Button>
      </div>
    </div>
  );
}
```

### 表单模板
```tsx
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';

export function FormTemplate() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>表单标题</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div>
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入姓名"
            />
          </div>

          <div>
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="请输入邮箱"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">提交</Button>
            <Button type="button" variant="outline">取消</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 数据列表模板
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { StatusBadge } from '@/app/components/patterns/StatusBadge';

const items = [
  { id: 1, name: '项目1', status: 'active' },
  { id: 2, name: '项目2', status: 'inactive' },
];

export function ListTemplate() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>列表标题</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-md hover:bg-[var(--color-neutral-03)] transition-colors"
            >
              <span className="text-sm">{item.name}</span>
              <StatusBadge tone={item.status === 'active' ? 'success' : 'neutral'}>
                {item.status === 'active' ? '活跃' : '非活跃'}
              </StatusBadge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🔗 相关文档

- [UI 优化完成指南](/docs/UI_OPTIMIZATION_GUIDE.md) - 详细的优化说明
- [功能完成清单](/docs/FUNCTIONAL_CHECKLIST.md) - 项目进度追踪
- [快速数值查询卡](/reference/QUICK_VALUES.md) - 设计规范数值
- [组件对照表](/reference/03_COMPONENT_MAPPING.md) - 组件使用说明

---

## 💡 开发技巧

### 1. 使用 VS Code 代码片段
在 `.vscode/snippets.code-snippets` 中定义常用代码片段。

### 2. 使用 Tailwind IntelliSense
安装 "Tailwind CSS IntelliSense" 插件获得自动补全。

### 3. 使用 ESLint 和 Prettier
确保代码风格一致。

### 4. 使用浏览器开发者工具
- `F12` 打开开发者工具
- `Ctrl+Shift+M` 切换设备模拟
- `Ctrl+Shift+C` 选择元素

---

**文档版本**：v2.0  
**创建日期**：2025-01-13  
**最后更新**：2026-07-20  
**维护人**：AI Assistant
