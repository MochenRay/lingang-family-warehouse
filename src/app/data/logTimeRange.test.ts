import { describe, expect, it } from 'vitest';
import { isWithinTimeRange, resolveTimeRangeStart } from './logTimeRange';

/** 跨日期样本：覆盖当天 / 近 7 天边界 / 近 30 天边界 / 范围外 */
const ANCHOR = new Date('2026-01-20T16:00:00');
const SAMPLES = [
  { time: '2026-01-20 09:00:00', today: true, week: true, month: true }, // 当天
  { time: '2026-01-19 23:59:59', today: false, week: true, month: true }, // 昨天
  { time: '2026-01-14 00:00:00', today: false, week: true, month: true }, // 近 7 天最早边界
  { time: '2026-01-13 23:59:59', today: false, week: false, month: true }, // 超出近 7 天
  { time: '2025-12-22 00:00:00', today: false, week: false, month: true }, // 近 30 天最早边界
  { time: '2025-12-21 23:59:59', today: false, week: false, month: false }, // 超出近 30 天
] as const;

describe('logTimeRange 跨日期过滤', () => {
  it('today 只含锚点当日', () => {
    for (const sample of SAMPLES) {
      expect(isWithinTimeRange(sample.time, 'today', ANCHOR), sample.time).toBe(sample.today);
    }
  });

  it('week 含锚点日起共 7 个自然日（含边界）', () => {
    for (const sample of SAMPLES) {
      expect(isWithinTimeRange(sample.time, 'week', ANCHOR), sample.time).toBe(sample.week);
    }
  });

  it('month 含锚点日起共 30 个自然日（含边界）', () => {
    for (const sample of SAMPLES) {
      expect(isWithinTimeRange(sample.time, 'month', ANCHOR), sample.time).toBe(sample.month);
    }
  });

  it('all 不过滤，任何日期都通过', () => {
    for (const sample of SAMPLES) {
      expect(isWithinTimeRange(sample.time, 'all', ANCHOR)).toBe(true);
    }
  });

  it('晚于锚点时刻的当天记录不纳入（上界为锚点本身）', () => {
    expect(isWithinTimeRange('2026-01-20 18:00:00', 'today', ANCHOR)).toBe(false);
    expect(isWithinTimeRange('2026-01-20 18:00:00', 'week', ANCHOR)).toBe(false);
  });

  it('范围下界按自然日 00:00 对齐', () => {
    const weekStart = resolveTimeRangeStart('week', ANCHOR);
    // 用本地年月日断言（toISOString 是 UTC，会偏一天）
    const ymd = `${weekStart?.getFullYear()}-${String((weekStart?.getMonth() ?? 0) + 1).padStart(2, '0')}-${String(weekStart?.getDate()).padStart(2, '0')}`;
    expect(ymd).toBe('2026-01-14');
    expect(weekStart?.getHours()).toBe(0);
    expect(resolveTimeRangeStart('all', ANCHOR)).toBeNull();
  });
});
