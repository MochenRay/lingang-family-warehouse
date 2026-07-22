import { expect, test, type Page } from '@playwright/test';
import { ROUTE_DEFINITIONS } from '../../src/app/navigation/routes';

/**
 * P5-T7b 桌面 Sidebar 导航重组（方案二）验收。
 *
 * 口径（冻结稿 docs/ui-p5-t7-proposals.md 方案二 V2/V3）：
 *  - 完整父子树断言：展开全部分组后读真实 DOM（叶子按钮带 data-route-id，
 *    不只看 ROUTE_DEFINITIONS），7 个分组 label 与各自 children 全量比对、
 *    30 个桌面叶子 route ID（不含 7 个分组 ID 与 mobile）无缺失无重复。
 *  - 点击验证：标签分析画像（标签组）、待办规则（系统配置组）、预警热区
 *    （统计分析组）的所在分组及最终 URL；预警热区页标题尚未改名（方案一），
 *    只断言 URL。
 *  - 菜单 label 程序化测量（复用 T6 方法）：span.scrollWidth ≤ clientWidth
 *    零横向溢出、按钮高 40px 零换行，覆盖全部 30 项（含默认折叠分组展开后）。
 */

// 冻结父子树（对照表落点）：分组顺序、组内顺序、叶子 id 与 label 逐项锁定。
const EXPECTED_TREE: Array<{ group: string; leaves: Array<{ id: string; label: string }> }> = [
  {
    group: '统计分析',
    leaves: [
      { id: 'statistics-overview', label: '综合统计驾驶舱' },
      { id: 'demographics-analysis', label: '人口特征分析' },
      { id: 'housing-statistics', label: '房屋网格画像' },
      { id: 'migration-trends', label: '人口流动趋势' },
      { id: 'heatmap', label: '预警热区' },
      { id: 'data-comparison', label: '数据对比分析' },
      { id: 'data-reports', label: '数据报表中心' },
    ],
  },
  {
    group: '数据管理',
    leaves: [
      { id: 'population', label: '人口管理' },
      { id: 'housing', label: '房屋管理' },
      { id: 'relationship', label: '人房关系' },
      { id: 'batch-import', label: '批量导入' },
    ],
  },
  {
    group: '标签',
    leaves: [
      { id: 'tag-overview', label: '标签管理' },
      { id: 'population-tags', label: '标签分析画像' },
    ],
  },
  {
    group: '数仓智能体',
    leaves: [
      { id: 'knowledge-accumulation', label: '知识沉淀' },
      { id: 'policy-interpretation', label: '政策解读' },
      { id: 'document-writing', label: '公文写作' },
      { id: 'smart-query', label: '智能问数' },
    ],
  },
  {
    group: '网格事务',
    leaves: [
      { id: 'behavior-supervision', label: '行为督导' },
      { id: 'activity-management', label: '活动管理' },
      { id: 'conflict-management', label: '矛盾调解' },
      { id: 'notice-management', label: '公告管理' },
    ],
  },
  {
    group: '归因分析',
    leaves: [
      { id: 'anomaly-analysis', label: '异常结果分析' },
      { id: 'time-series', label: '时序分析' },
      { id: 'factor-identification', label: '影响因子识别' },
      { id: 'contribution-ranking', label: '贡献程度排名' },
    ],
  },
  {
    group: '系统配置',
    leaves: [
      { id: 'user-management', label: '用户管理' },
      { id: 'role-management', label: '角色管理' },
      { id: 'permission-management', label: '权限管理' },
      { id: 'log-management', label: '日志管理' },
      { id: 'rule-config', label: '待办规则' },
    ],
  },
];

const EXPECTED_LEAF_COUNT = 30;

async function gotoDashboard(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '综合统计驾驶舱' })).toBeVisible();
}

/** 分组默认折叠时其子项不渲染；按首叶子是否存在判断并展开，直到叶子可见。 */
async function ensureGroupExpanded(page: Page, groupLabel: string, firstLeafRouteId: string) {
  const leaf = page.locator(`aside [data-route-id="${firstLeafRouteId}"]`);
  if ((await leaf.count()) === 0) {
    await page.locator('aside').getByRole('button', { name: groupLabel, exact: true }).click();
  }
  await expect(leaf.first()).toBeVisible();
}

async function expandAllGroups(page: Page) {
  for (const { group, leaves } of EXPECTED_TREE) {
    await ensureGroupExpanded(page, group, leaves[0].id);
  }
  await expect(page.locator('aside [data-route-id]')).toHaveCount(EXPECTED_LEAF_COUNT);
}

/** 从真实 DOM 读侧边导航父子树（nav 顶层 div = 分组，div 内 [data-route-id] = 叶子）。 */
async function readSidebarTree(page: Page) {
  return page.evaluate(() => {
    const nav = document.querySelector('aside nav');
    if (!nav) return [];
    return Array.from(nav.children).map((item) => {
      const groupLabel = item.querySelector(':scope > button span')?.textContent?.trim() ?? '';
      const leaves = Array.from(item.querySelectorAll('[data-route-id]')).map((el) => ({
        id: el.getAttribute('data-route-id') ?? '',
        label: el.querySelector('span')?.textContent?.trim() ?? '',
      }));
      return { group: groupLabel, leaves };
    });
  });
}

/** 叶子所在分组的 label（沿 DOM 向上找 nav 直属顶层项的分组按钮文本）。 */
async function groupLabelOfLeaf(page: Page, routeId: string) {
  return page.evaluate((id) => {
    const leaf = document.querySelector(`aside [data-route-id="${id}"]`);
    const topItem = leaf?.closest('nav > div');
    return topItem?.querySelector(':scope > button span')?.textContent?.trim() ?? null;
  }, routeId);
}

test.describe('P5-T7b 桌面 Sidebar 导航重组', () => {
  test('完整父子树：7 分组 label 与 children 全量比对，30 叶子 route ID 无缺失无重复', async ({ page }) => {
    await gotoDashboard(page);
    await expandAllGroups(page);

    const tree = await readSidebarTree(page);
    expect(tree).toEqual(EXPECTED_TREE);

    const leafIds = tree.flatMap((group) => group.leaves.map((leaf) => leaf.id));
    expect(leafIds).toHaveLength(EXPECTED_LEAF_COUNT);
    expect(new Set(leafIds).size).toBe(EXPECTED_LEAF_COUNT);

    // 与路由表交叉核对：30 叶子 = ROUTE_DEFINITIONS 去掉 mobile（底部「体验移动端工作台」不在 nav 内）
    const desktopRouteIds = ROUTE_DEFINITIONS.map((route) => route.id)
      .filter((id) => id !== 'mobile')
      .sort();
    expect([...leafIds].sort()).toEqual(desktopRouteIds);
  });

  test('点击验证：标签分析画像在标签组，到达 /analysis/tags', async ({ page }) => {
    await gotoDashboard(page);
    // 标签组默认折叠，叶子初始不渲染——展开后可见即证明其挂在该组下
    await ensureGroupExpanded(page, '标签', 'tag-overview');
    await expect.poll(() => groupLabelOfLeaf(page, 'population-tags')).toBe('标签');

    await page.locator('aside [data-route-id="population-tags"]').click();
    await expect(page).toHaveURL(/\/analysis\/tags$/);
  });

  test('点击验证：待办规则在系统配置组，到达 /grid/rules', async ({ page }) => {
    await gotoDashboard(page);
    await ensureGroupExpanded(page, '系统配置', 'user-management');
    await expect.poll(() => groupLabelOfLeaf(page, 'rule-config')).toBe('系统配置');

    await page.locator('aside [data-route-id="rule-config"]').click();
    await expect(page).toHaveURL(/\/grid\/rules$/);
  });

  test('点击验证：预警热区在统计分析组，到达 /analysis/warning-map', async ({ page }) => {
    await gotoDashboard(page);
    await ensureGroupExpanded(page, '统计分析', 'statistics-overview');
    await expect.poll(() => groupLabelOfLeaf(page, 'heatmap')).toBe('统计分析');

    await page.locator('aside [data-route-id="heatmap"]').click();
    // 页面标题「预警地图」尚未改名（属方案一范围），此处只断言最终 URL
    await expect(page).toHaveURL(/\/analysis\/warning-map$/);
  });

  test('菜单 label 测量：30 项零横向溢出、零换行、按钮高 40px（含默认折叠分组展开后）', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoDashboard(page);
    await expandAllGroups(page);

    const measurements = await page.evaluate(() =>
      Array.from(document.querySelectorAll('aside [data-route-id]')).map((el) => {
        const button = el as HTMLElement;
        const span = button.querySelector('span') as HTMLElement | null;
        return {
          id: button.getAttribute('data-route-id') ?? '',
          label: span?.textContent?.trim() ?? '',
          buttonHeight: button.offsetHeight,
          spanScrollWidth: span?.scrollWidth ?? -1,
          spanClientWidth: span?.clientWidth ?? -1,
          spanHeight: span?.offsetHeight ?? -1,
        };
      }),
    );
    expect(measurements).toHaveLength(EXPECTED_LEAF_COUNT);

    // T6 口径：scrollWidth ≤ clientWidth（零横向溢出）、按钮高 40px；
    // 零换行以单行高度上限判定——text-sm 单行约 20px，两行约 40px+，阈值 30px 双向可靠
    const violations = measurements.filter(
      (m) => m.buttonHeight !== 40 || m.spanScrollWidth > m.spanClientWidth || m.spanHeight > 30,
    );
    expect(violations, `存在溢出/换行/高度异常：\n${JSON.stringify(violations, null, 2)}`).toEqual([]);
  });
});
