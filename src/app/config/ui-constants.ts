/**
 * UI 常量配置
 * 来源: /reference/QUICK_VALUES.md
 * 用途: 统一管理页面级间距、动画配置
 *
 * Phase 14 (T4) 裁剪：仅保留 App.tsx 在用的
 * SPACING_CLASSES.page 与 TRANSITION_CLASSES.default，
 * 其余导出（SPACING/ANIMATION/BREAKPOINTS/RESPONSIVE_CLASSES/
 * BORDER_RADIUS/SHADOW/Z_INDEX 及辅助函数）均已确认零引用并删除。
 */

// Tailwind 类名映射
export const SPACING_CLASSES = {
  page: 'p-6',         // 24px - 页面容器边距
} as const;

// Tailwind 过渡类名
export const TRANSITION_CLASSES = {
  default: 'transition-all duration-200 ease-in-out',
} as const;
