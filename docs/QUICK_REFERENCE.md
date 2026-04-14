# 快速参考手册

> 创建时间：2025-01-13  
> 用途：开发时的快速参考，涵盖最常用的代码片段和规范  
> 目标：5分钟内找到你需要的任何信息

---

## 🎯 目录

- [间距规范](#间距规范)
- [颜色系统](#颜色系统)
- [动画效果](#动画效果)
- [响应式布局](#响应式布局)
- [常用组件](#常用组件)
- [代码片段](#代码片段)

---

## 📏 间距规范

### 快速查询表
| 用途 | 像素值 | Tailwind | 常量 |
|------|--------|----------|------|
| 图标与文字 | 4px | `gap-1` | `SPACING.xs` |
| 按钮间距 | 8px | `gap-2` | `SPACING.sm` |
| 表单字段间距 | 16px | `gap-4` | `SPACING.lg` |
| **页面边距** | **24px** | **`p-6`** | **`SPACING.xl`** |
| **区块间距** | **24px** | **`space-y-6`** | **`SPACING.xl`** |
| **卡片内边距** | **16px** | **`p-4`** | **`SPACING.lg`** |

### 使用示例
```tsx
import { SPACING_CLASSES } from '@/app/config/ui-constants';

// 页面容器
<main className={SPACING_CLASSES.page}> {/* 24px */}
  
  {/* 区块间距 */}
  <div className={SPACING_CLASSES.section}> {/* 24px */}
    
    {/* 卡片 */}
    <Card className={SPACING_CLASSES.card}> {/* 16px */}
      内容
    </Card>
    
  </div>
</main>
```

---

## 🎨 颜色系统

### 主色调
```tsx
// Tailwind 类名
<Button className="bg-[#2761CB]">主按钮</Button> // Blue-06

// CSS 变量
style={{ color: 'var(--color-brand-primary)' }}

// Hex 值（仅供参考，优先使用 Tailwind 或 CSS 变量）
#2761CB  // Blue-06 主色
#4E86DF  // Blue-07 Hover
#2251A8  // Blue-05 Click
```

### 功能色
```tsx
成功: #19B172  // Green-06
警告: #D6730D  // Orange-06
错误: #D52132  // Red-06
信息: #2AA3CF  // Light-blue-06
```

### 中性色（暗色模式）
```tsx
背景: #0D121B  // Neutral-00
卡片: #1F293A  // Neutral-02
边框: #293449  // Neutral-03
文字: #AEC0DE  // Neutral-10
标题: #F6F9FE  // Neutral-11
```

---

## ✨ 动画效果

### 过渡类名
```tsx
import { TRANSITION_CLASSES } from '@/app/config/ui-constants';

<div className={TRANSITION_CLASSES.default}>      // 标准 200ms
<div className={TRANSITION_CLASSES.fast}>         // 快速 150ms
<div className={TRANSITION_CLASSES.slow}>         // 慢速 300ms
<div className={TRANSITION_CLASSES.colors}>       // 仅颜色
<div className={TRANSITION_CLASSES.transform}>    // 仅变换
```

### 动画类名
```tsx
// 淡入淡出
<div className="fade-in">淡入</div>
<div className="fade-out">淡出</div>

// 滑入
<div className="slide-in-top">从上滑入</div>
<div className="slide-in-bottom">从下滑入</div>
<div className="slide-in-left">从左滑入</div>
<div className="slide-in-right">从右滑入</div>

// 缩放
<div className="scale-in">放大进入</div>
<div className="scale-out">缩小退出</div>

// 页面加载
<div className="page-load">页面内容</div>

// 卡片 Hover
<Card className="card-hover">卡片</Card>

// 骨架屏
<div className="skeleton">加载中...</div>
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
// 响应式栅格（自动适应）
<div className="responsive-grid">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
  <Card>4</Card>
</div>

// Tailwind 响应式
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 移动端1列，平板端2列，桌面端4列 */}
</div>

// 条件显示
<div className="mobile-only">仅移动端</div>
<div className="tablet-up">平板及以上</div>
<div className="desktop-only">仅桌面端</div>
```

### 响应式间距
```tsx
// 自动适应的边距
<div className="responsive-page-padding">
  {/* 移动端16px，平板/桌面24px */}
</div>

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

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
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

## 💻 代码片段

### 完整页面模板
```tsx
import { SPACING_CLASSES, TRANSITION_CLASSES } from '@/app/config/ui-constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

export function PageTemplate() {
  return (
    <div className={`page-load ${SPACING_CLASSES.section}`}>
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">页面标题</h1>
        <p className="text-sm text-gray-600 mt-1">页面描述</p>
      </div>

      {/* 响应式栅格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`card-hover ${TRANSITION_CLASSES.default}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              卡片标题
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">数据</p>
            <p className="text-xs text-gray-500 mt-1">说明</p>
          </CardContent>
        </Card>
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
import { Badge } from '@/app/components/ui/badge';

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
              className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm">{item.name}</span>
              <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                {item.status === 'active' ? '活跃' : '非活跃'}
              </Badge>
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

**文档版本**：v1.0  
**创建日期**：2025-01-13  
**最后更新**：2025-01-13  
**维护人**：AI Assistant
