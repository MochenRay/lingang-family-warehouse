/**
 * 图表配色方案
 * 来源: /reference/design-files/specs/charts.md
 * 来源: /reference/QUICK_VALUES.md - 图表配色速查
 */

// ========================================
// 多系列配色方案（6色）
// ========================================
export const CHART_COLORS = [
  '#2761CB', // Blue-06 - 主色
  '#413DD4', // Violet-06 - 紫罗兰
  '#8B3BCC', // Purple-06 - 紫色
  '#2AA3CF', // Light-blue-06 - 浅蓝
  '#D6730D', // Orange-06 - 橙色
  '#19B172', // Green-06 - 绿色
];

// ========================================
// 单色系（数据大屏）
// ========================================
export const CHART_PRIMARY = '#4E86DF'; // Blue-07 - 主色亮色

// ========================================
// 功能色
// ========================================
export const CHART_SUCCESS = '#19B172'; // Green-06 - 成功
export const CHART_WARNING = '#D6730D'; // Orange-06 - 警告
export const CHART_ERROR = '#D52132';   // Red-06 - 错误
export const CHART_INFO = '#2AA3CF';    // Light-blue-06 - 信息

// ========================================
// 中性色（图表辅助元素）
// ========================================
export const CHART_GRID = '#293449';      // Neutral-03 - 网格线
export const CHART_AXIS = '#546789';      // Neutral-06 - 坐标轴文字
export const CHART_LABEL = '#AEC0DE';     // Neutral-10 - 数据标签

// ========================================
// 渐变色（面积图）
// ========================================
export const CHART_GRADIENT_BLUE = {
  start: 'rgba(39, 97, 203, 0.3)',   // Blue-06 30%
  end: 'rgba(39, 97, 203, 0.05)',    // Blue-06 5%
};

export const CHART_GRADIENT_GREEN = {
  start: 'rgba(25, 177, 114, 0.3)',  // Green-06 30%
  end: 'rgba(25, 177, 114, 0.05)',   // Green-06 5%
};

export const CHART_GRADIENT_ORANGE = {
  start: 'rgba(214, 115, 13, 0.3)',  // Orange-06 30%
  end: 'rgba(214, 115, 13, 0.05)',   // Orange-06 5%
};

// ========================================
// 常用组合（快速引用）
// ========================================
export const CHART_POPULATION_COLORS = {
  resident: '#2761CB',     // 常住人口 - 蓝色
  floating: '#8B3BCC',     // 流动人口 - 紫色
  elderly: '#D6730D',      // 老年人口 - 橙色
  children: '#19B172',     // 儿童人口 - 绿色
};

export const CHART_GENDER_COLORS = {
  male: '#2761CB',         // 男性 - 蓝色
  female: '#E845B1',       // 女性 - 粉色
};

export const CHART_RISK_COLORS = {
  high: '#D52132',         // 高风险 - 红色
  medium: '#D6730D',       // 中风险 - 橙色
  low: '#19B172',          // 低风险 - 绿色
};

// ========================================
// 导出默认配置（Recharts）
// ========================================
export const DEFAULT_CHART_CONFIG = {
  colors: CHART_COLORS,
  grid: {
    stroke: CHART_GRID,
    strokeDasharray: '3 3',
    vertical: false,
  },
  axis: {
    stroke: CHART_AXIS,
    fontSize: 12,
    fontWeight: 400,
  },
  tooltip: {
    backgroundColor: '#1F293A', // Neutral-02
    borderColor: '#293449',     // Neutral-03
    textColor: '#AEC0DE',       // Neutral-10
  },
};
