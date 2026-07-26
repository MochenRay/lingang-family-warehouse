/**
 * 日志管理时间范围过滤（R56）。
 *
 * 页面数据为演示台账，不随真实时钟变化，因此「今天 / 近7天 / 近30天」
 * 一律以明确的参考时刻为锚点求值，而不是读取系统时间：
 * 页面的锚点取数据集内最新一条日志的时间，与统计卡「今日日志」口径一致。
 */

export type LogTimeRange = 'today' | 'week' | 'month' | 'all';

export const LOG_TIME_RANGE_DEFAULT: LogTimeRange = 'today';

/** 日志时间字符串（YYYY-MM-DD HH:mm:ss）解析为 Date */
export function parseLogTime(logTime: string): Date {
  return new Date(logTime.replace(' ', 'T'));
}

/**
 * 求时间范围的下界（含边界）；返回 null 表示不过滤。
 * - today：锚点当日 00:00 起
 * - week：锚点日起往前共 7 个自然日
 * - month：锚点日起往前共 30 个自然日
 */
export function resolveTimeRangeStart(timeRange: LogTimeRange, anchor: Date): Date | null {
  if (timeRange === 'all') {
    return null;
  }
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  if (timeRange === 'week') {
    start.setDate(start.getDate() - 6);
  } else if (timeRange === 'month') {
    start.setDate(start.getDate() - 29);
  }
  return start;
}

/** 日志时间是否落在 [范围下界, 锚点] 内；all 恒为 true */
export function isWithinTimeRange(logTime: string, timeRange: LogTimeRange, anchor: Date): boolean {
  const start = resolveTimeRangeStart(timeRange, anchor);
  if (start === null) {
    return true;
  }
  const time = parseLogTime(logTime);
  return time >= start && time <= anchor;
}
