import { describe, expect, it } from 'vitest';
import {
  CATEGORY_OPTIONS,
  MOCK_ACTIVITIES,
  getActivityTypePath,
  getCategoryLabel,
  type Activity,
} from './activities';

// R48：活动「类型 · 子分类」层级展示依赖演示数据的结构一致性
describe('activities 演示数据类型层级（R48）', () => {
  it('每条活动的类型都在 CATEGORY_OPTIONS 中登记', () => {
    for (const activity of MOCK_ACTIVITIES) {
      expect(CATEGORY_OPTIONS.some((option) => option.value === activity.category)).toBe(true);
    }
  });

  it('每条活动的子分类都是该类型下已登记的子分类', () => {
    for (const activity of MOCK_ACTIVITIES) {
      const category = CATEGORY_OPTIONS.find((option) => option.value === activity.category);
      expect(category?.subcategories.some((sub) => sub.label === activity.subcategory)).toBe(true);
    }
  });

  it('层级文案输出「类型 · 子分类」', () => {
    for (const activity of MOCK_ACTIVITIES) {
      const category = CATEGORY_OPTIONS.find((option) => option.value === activity.category);
      expect(getActivityTypePath(activity)).toBe(`${category?.label} · ${activity.subcategory}`);
    }
  });

  it('未登记的类型回退为原值，不中断展示', () => {
    expect(getCategoryLabel('unknown' as Activity['category'])).toBe('unknown');
    expect(getActivityTypePath({ category: 'unknown' as Activity['category'], subcategory: '其他' })).toBe('unknown · 其他');
  });
});
