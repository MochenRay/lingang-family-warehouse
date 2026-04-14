/**
 * UI 常量配置
 * 来源: /reference/QUICK_VALUES.md
 * 用途: 统一管理页面级间距、动画、响应式断点等配置
 */

// ========================================
// 间距系统 (遵循 8n 原则)
// ========================================
export const SPACING = {
  xs: 4,   // 图标与文字
  sm: 8,   // 按钮间距、列表项间距
  md: 12,  // 按钮内边距（小）
  lg: 16,  // 卡片内边距
  xl: 24,  // 区块间距、页面边距
} as const;

// Tailwind 类名映射
export const SPACING_CLASSES = {
  xs: 'p-1',      // 4px
  sm: 'p-2',      // 8px
  md: 'p-3',      // 12px
  lg: 'p-4',      // 16px
  xl: 'p-6',      // 24px
  
  // 页面级间距
  page: 'p-6',         // 24px - 页面容器边距
  section: 'space-y-6', // 24px - 区块间距
  card: 'p-4',         // 16px - 卡片内边距
} as const;

// ========================================
// 动画系统
// ========================================
export const ANIMATION = {
  // 过渡时长
  duration: {
    fast: '150ms',     // 快速交互（按钮点击）
    normal: '200ms',   // 标准过渡（Hover）
    slow: '300ms',     // 慢速过渡（Modal 展开）
  },
  
  // 缓动函数
  easing: {
    default: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    linear: 'linear',
  },
} as const;

// Tailwind 过渡类名
export const TRANSITION_CLASSES = {
  default: 'transition-all duration-200 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',
  opacity: 'transition-opacity duration-200 ease-in-out',
} as const;

// ========================================
// 响应式断点系统
// ========================================
export const BREAKPOINTS = {
  mobile: 768,    // < 768px
  tablet: 1024,   // 768px - 1024px
  desktop: 1024,  // > 1024px
} as const;

// Tailwind 响应式类名
export const RESPONSIVE_CLASSES = {
  // 容器宽度
  container: 'w-full max-w-screen-2xl mx-auto',
  
  // 栅格布局
  grid: {
    mobile: 'grid-cols-1',
    tablet: 'md:grid-cols-2',
    desktop: 'lg:grid-cols-4',
  },
  
  // 间距调整
  padding: {
    mobile: 'p-4',       // 16px
    tablet: 'md:p-6',    // 24px
    desktop: 'lg:p-6',   // 24px
  },
} as const;

// ========================================
// 圆角系统
// ========================================
export const BORDER_RADIUS = {
  xs: '2px',   // 按钮、输入框
  sm: '4px',   // 卡片、菜单
  md: '8px',   // 对话框
  full: '50%', // 头像
  pill: '9999px', // Badge
} as const;

// ========================================
// 阴影系统
// ========================================
export const SHADOW = {
  sm: '0px 2px 8px rgba(10, 27, 57, 0.15)',   // Dropdown、Tooltip
  md: '0px 4px 16px rgba(10, 27, 57, 0.2)',   // Card Hover
  lg: '0px 6px 30px rgba(10, 27, 57, 0.3)',   // Modal、Drawer
} as const;

// ========================================
// Z-Index 层级系统
// ========================================
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ========================================
// 辅助函数
// ========================================

/**
 * 获取间距类名
 */
export function getSpacingClass(size: keyof typeof SPACING_CLASSES): string {
  return SPACING_CLASSES[size];
}

/**
 * 获取过渡类名
 */
export function getTransitionClass(type: keyof typeof TRANSITION_CLASSES = 'default'): string {
  return TRANSITION_CLASSES[type];
}

/**
 * 检查是否为移动端
 */
export function isMobile(): boolean {
  return window.innerWidth < BREAKPOINTS.mobile;
}

/**
 * 检查是否为平板端
 */
export function isTablet(): boolean {
  return window.innerWidth >= BREAKPOINTS.mobile && window.innerWidth < BREAKPOINTS.desktop;
}

/**
 * 检查是否为桌面端
 */
export function isDesktop(): boolean {
  return window.innerWidth >= BREAKPOINTS.desktop;
}
