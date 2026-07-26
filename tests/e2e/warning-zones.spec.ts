import { expect, test, type Locator, type Page } from '@playwright/test';

const backendPort = Number(process.env.BACKEND_PORT ?? '8000');

/**
 * P5-T7 方案一 WarningMap 整页重做 →「预警热区」验收（冻结稿 docs/ui-p5-t7-proposals.md V3）。
 *
 * 覆盖口径：
 *  1. 命名统一：页面标题「预警热区」+ eyebrow「WARNING ZONES」可见（a11y readyText
 *     已同步，由 a11y-audit 套件在扫描路由内复验「阻断为零」）。
 *  2. 热区矩阵（真实种子）：板数 = snapshot.grids.length（合同断言 + 当前种子 12）、
 *     组内 heatScore 降序、同名社区（海梦苑第一/第二网格）板面 gridLabel 可区分。
 *  3. R07 摘要（mock fixture）：严格按高风险对象、超期待办、走访覆盖三项生成；
 *     零值字段省略、整行全零不占位、摘要单行且不溢出。
 *  4. 预警清单四级确定性排序（mock fixture）：severityRank 降序 → grid.heatScore 降序
 *     → gridName zh-CN 升序 → warning.id 升序，排序后 .slice(0, 12)。
 *     fixture 构造 14 条预警：1 high（丁，heat 60）+ 2 medium（丙，heat 98，同网格
 *     验证 id 升序）+ 11 medium（heat 68，甲/乙验证 gridName zh-CN 升序，综合 01-09
 *     验证截断）。期望序见 EXPECTED_WARNING_IDS。
 *  5. 行为回归（mock fixture）：类型筛选生效、点击热区板弹出预警详情 Dialog。
 *
 * mock 面（仅 GET，驱动 analysisRepository.getGovernanceSnapshot 的最小集合）：
 *  /api/stats/grids、/api/people、/api/houses（含 history-records）、/api/visits、
 *  /api/conflicts、/api/task-rules/projection。
 */

const OVERDUE_DEADLINE = '2026-01-01 09:00:00';

interface MockGrid {
  id: string;
  name: string;
  parentId: null;
  managerName: string;
}

interface MockTask {
  id: string;
  title: string;
  type: string;
  sourceKind: string;
  sourceId: string;
  gridId: string;
  route: string;
  priority: string;
  urgent: boolean;
  description: string;
  assignedBy: string;
  deadline: string;
  status: string;
  statusLabel: string;
}

function makeGrid(id: string, name: string): MockGrid {
  return { id, name, parentId: null, managerName: '自动化验证员' };
}

function makeOverdueTask(id: string, gridId: string): MockTask {
  return {
    id,
    title: `${id} 超期回访`,
    type: '回访',
    sourceKind: 'rule',
    sourceId: `rule_${id}`,
    gridId,
    route: '/mobile/tasks',
    priority: 'medium',
    urgent: false,
    description: '自动化验证用超期待办',
    assignedBy: '系统',
    deadline: OVERDUE_DEADLINE,
    status: 'pending',
    statusLabel: '待处理',
  };
}

/** 排序 fixture 网格清单（id 故意与名称拼音序错位，防「按 id 排」假绿）。 */
const FIXTURE_GRIDS: MockGrid[] = [
  makeGrid('g_high', '登州街道丁社区第一网格'), // 1 高风险 + 2 超期 + 100% 走访 → high 预警
  makeGrid('g_tie_c', '登州街道丙社区第一网格'), // 1 超期 + 2 调解中 → 2 条 medium，heat 98
  makeGrid('g_tie_b', '登州街道甲社区第一网格'), // 1 超期 → medium，heat 68（甲 jiǎ，名称序最前）
  makeGrid('g_tie_a', '登州街道乙社区第一网格'), // 1 超期 → medium，heat 68（乙 yǐ）
  ...Array.from({ length: 9 }, (_, index) =>
    makeGrid(`g_fill_${String(index + 1).padStart(2, '0')}`, `登州街道综合社区${String(index + 1).padStart(2, '0')}第一网格`)),
  makeGrid('g_zero', '登州街道零值社区第一网格'),
];

const FIXTURE_PEOPLE = [
  {
    id: 'person_high_1',
    gridId: 'g_high',
    name: '摘要验证对象',
    idCard: '370684199001010001',
    gender: '男',
    age: 36,
    address: '丁社区第一网格',
    type: '户籍',
    tags: [],
    risk: 'High',
    updatedAt: '2026-07-25 09:00:00',
  },
];

const FIXTURE_VISITS = [
  {
    id: 'visit_high_1',
    targetId: 'person_high_1',
    targetType: 'person',
    gridId: 'g_high',
    visitorName: '自动化验证员',
    date: '2026-07-25 10:00:00',
    content: '摘要走访覆盖验证',
  },
];

const FIXTURE_TASKS: MockTask[] = [
  makeOverdueTask('task_high_1', 'g_high'),
  makeOverdueTask('task_high_2', 'g_high'),
  makeOverdueTask('task_tie_c', 'g_tie_c'),
  makeOverdueTask('task_tie_b', 'g_tie_b'),
  makeOverdueTask('task_tie_a', 'g_tie_a'),
  ...FIXTURE_GRIDS.filter((grid) => grid.id.startsWith('g_fill_')).map((grid) =>
    makeOverdueTask(`task_${grid.id}`, grid.id)),
];

const FIXTURE_CONFLICTS = [
  {
    id: 'conflict_tie_c_1',
    source: '自行发现',
    title: '丙社区邻里纠纷一',
    type: '邻里纠纷',
    description: '自动化验证用纠纷一',
    involvedParties: [],
    status: '调解中',
    gridId: 'g_tie_c',
    location: '丙社区',
    timeline: [],
    images: [],
    createdAt: '2026-06-01 10:00:00',
    updatedAt: '2026-06-02 10:00:00',
  },
  {
    id: 'conflict_tie_c_2',
    source: '自行发现',
    title: '丙社区邻里纠纷二',
    type: '邻里纠纷',
    description: '自动化验证用纠纷二',
    involvedParties: [],
    status: '调解中',
    gridId: 'g_tie_c',
    location: '丙社区',
    timeline: [],
    images: [],
    createdAt: '2026-06-03 10:00:00',
    updatedAt: '2026-06-04 10:00:00',
  },
];

/**
 * 期望清单序（四级确定性键推算）：
 *  1. g_high-overdue（唯一 high，severity 主键压过 heat 98 的丙网格）
 *  2-3. g_tie_c-conflict / g_tie_c-overdue（同 severity、同 heatScore 98、同 gridName → id 升序）
 *  4-5. g_tie_b / g_tie_a（heat 68，gridName zh-CN 升序：甲 jiǎ < 乙 yǐ）
 *  6-14. g_fill_01..09（heat 68，综合 zōng 在乙之后；slice(0,12) 截掉 08/09）
 */
const EXPECTED_WARNING_IDS = [
  'g_high-overdue',
  'g_tie_c-conflict',
  'g_tie_c-overdue',
  'g_tie_b-overdue',
  'g_tie_a-overdue',
  'g_fill_01-overdue',
  'g_fill_02-overdue',
  'g_fill_03-overdue',
  'g_fill_04-overdue',
  'g_fill_05-overdue',
  'g_fill_06-overdue',
  'g_fill_07-overdue',
];

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

function trackRuntimeFailures(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`.trim());
  });

  return () => {
    expect(consoleErrors, 'console errors').toEqual([]);
    expect(pageErrors, 'page errors').toEqual([]);
    expect(requestFailures, 'request failures').toEqual([]);
  };
}

/** 最小 mock 面：驱动 getGovernanceSnapshot 的全部 GET 端点（buildAnomalies 的数据依赖）。 */
async function mockGovernanceSnapshot(page: Page) {
  await page.route('**/api/stats/grids**', (route) =>
    route.fulfill({ json: { grids: FIXTURE_GRIDS } }));
  await page.route('**/api/people**', (route) =>
    route.fulfill({ json: { items: FIXTURE_PEOPLE, total: FIXTURE_PEOPLE.length } }));
  // /api/houses 与 /api/houses/history-records 共用一个 handler，按 pathname 分流，避免路由顺序陷阱
  await page.route('**/api/houses**', (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/api/houses/history-records') {
      return route.fulfill({ json: [] });
    }
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.route('**/api/visits**', (route) =>
    route.fulfill({ json: { items: FIXTURE_VISITS, total: FIXTURE_VISITS.length } }));
  await page.route('**/api/conflicts**', (route) =>
    route.fulfill({ json: { items: FIXTURE_CONFLICTS, total: FIXTURE_CONFLICTS.length } }));
  await page.route('**/api/task-rules/projection**', (route) =>
    route.fulfill({
      json: {
        pending: FIXTURE_TASKS,
        completed: [],
        summary: {
          pending: FIXTURE_TASKS.length,
          overdue: FIXTURE_TASKS.length,
          completed: 0,
          completionRate: 0,
        },
      },
    }));
}

async function gotoWarningZones(page: Page) {
  await page.goto('/analysis/warning-map');
  await expect(page.locator('[data-page-title]')).toHaveText('预警热区');
}

/** 读取分组内各热区板的热度分（板面「热度分」行的可见数值）。 */
async function groupHeatScores(group: Locator): Promise<number[]> {
  const boards = await group.getByTestId('zone-board').all();
  const scores: number[] = [];
  for (const board of boards) {
    const text = await board
      .locator('span:text-is("热度分")')
      .locator('xpath=following-sibling::span[1]')
      .textContent();
    scores.push(Number((text ?? '').trim()));
  }
  return scores;
}

test.describe('P5-T7 方案一 预警热区（真实种子）', () => {
  test.beforeEach(async ({ page }) => {
    await dismissJourneyOverlay(page);
  });

  test('命名统一：页面标题「预警热区」+ eyebrow「WARNING ZONES」，旧名不再出现', async ({ page }) => {
    await gotoWarningZones(page);
    await expect(page.locator('[data-page-eyebrow]')).toHaveText('WARNING ZONES');
    await expect(page.getByRole('heading', { name: '预警热区' })).toBeVisible();
    await expect(page.getByText('预警地图', { exact: true })).toHaveCount(0);
  });

  test('热区矩阵：板数 = snapshot.grids.length（合同）= 12（当前种子），区—街道分组可见', async ({ page }) => {
    await gotoWarningZones(page);
    const gridsResponse = await page.request.get(`http://127.0.0.1:${backendPort}/api/stats/grids`);
    expect(gridsResponse.ok()).toBe(true);
    const { grids } = (await gridsResponse.json()) as { grids: Array<{ id: string }> };
    // 合同断言：板数 = snapshot.grids.length；当前种子值断言：12
    await expect(page.getByTestId('zone-board')).toHaveCount(grids.length);
    expect(grids.length).toBe(12);
    // 当前种子 12 网格分布在 11 个 区—街道 组（登州街道含海梦苑 2 网格）
    await expect(page.getByTestId('zone-group')).toHaveCount(11);
    await expect(page.getByRole('region', { name: '蓬莱区 登州街道', exact: true })).toBeVisible();
  });

  test('热区矩阵：全部分组组内 heatScore 降序', async ({ page }) => {
    await gotoWarningZones(page);
    await expect(page.getByTestId('zone-board')).toHaveCount(12);
    const groups = await page.getByTestId('zone-group').all();
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      const scores = await groupHeatScores(group);
      const sortedDesc = [...scores].sort((left, right) => right - left);
      expect(scores, `分组「${await group.getAttribute('aria-label')}」组内热度分未降序`).toEqual(sortedDesc);
    }
  });

  test('热区矩阵：同名社区（海梦苑）板面 gridLabel 可区分', async ({ page }) => {
    await gotoWarningZones(page);
    const dengzhou = page.getByRole('region', { name: '蓬莱区 登州街道', exact: true });
    const haimengBoards = dengzhou.getByTestId('zone-board').filter({ hasText: '海梦苑社区' });
    await expect(haimengBoards).toHaveCount(2);
    const texts = await haimengBoards.allTextContents();
    expect(texts.some((text) => text.includes('第一网格'))).toBe(true);
    expect(texts.some((text) => text.includes('第二网格'))).toBe(true);
    // 两块同名社区板的完整文案必须不同（靠 gridLabel 区分）
    expect(texts[0]).not.toBe(texts[1]);
  });

  for (const viewport of [
    { width: 1507, height: 1324, columns: 3 },
    { width: 1440, height: 900, columns: 3 },
    { width: 1024, height: 768, columns: 2 },
  ]) {
    test(`R07 ${viewport.width}x${viewport.height}：多列铺开且无横向溢出`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const assertRuntimeClean = trackRuntimeFailures(page);
      await gotoWarningZones(page);
      await expect(page.getByTestId('zone-board')).toHaveCount(12);

      const groupXs = await page.getByTestId('zone-group').evaluateAll((elements) =>
        elements.map((element) => Math.round(element.getBoundingClientRect().x)));
      expect(new Set(groupXs).size).toBe(viewport.columns);

      const summaryMetrics = await page.getByTestId('zone-summary').evaluateAll((elements) =>
        elements.map((element) => ({
          whiteSpace: getComputedStyle(element).whiteSpace,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        })));
      for (const summary of summaryMetrics) {
        expect(summary.whiteSpace).toBe('nowrap');
        expect(summary.scrollWidth).toBeLessThanOrEqual(summary.clientWidth + 1);
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: `/tmp/lingang-t03-warning-${viewport.width}x${viewport.height}.png`,
        fullPage: true,
      });
      assertRuntimeClean();
    });
  }
});

test.describe('P5-T7 方案一 预警清单排序与行为回归（mock fixture）', () => {
  test.beforeEach(async ({ page }) => {
    await dismissJourneyOverlay(page);
    await mockGovernanceSnapshot(page);
    await gotoWarningZones(page);
    await expect(page.getByTestId('warning-list-item').first()).toBeVisible();
  });

  test('四级确定性排序：severity 降序 → heatScore 降序 → gridName zh-CN 升序 → warning.id 升序，slice(0,12)', async ({ page }) => {
    const ids = await page
      .getByTestId('warning-list-item')
      .evaluateAll((elements) => elements.map((element) => String(element.getAttribute('data-warning-id'))));
    // 一条断言锁全序：14 条 fixture 截断为 12 条，两个 tie-break 与截断全部蕴含在期望序中
    expect(ids).toEqual(EXPECTED_WARNING_IDS);
    // 首条为唯一 high（丁社区热度低于丙网格 → 验证 severity 主键优先）
    const first = page.getByTestId('warning-list-item').first();
    await expect(first).toContainText('丁社区');
    await expect(first).toContainText('严重');
    // 截断佐证：综合社区08/09 被切掉
    await expect(page.getByTestId('warning-list-item').filter({ hasText: '综合社区08' })).toHaveCount(0);
    await expect(page.getByTestId('warning-list-item').filter({ hasText: '综合社区09' })).toHaveCount(0);
  });

  test('R07：摘要严格使用三项口径，零值字段与整行全零均省略', async ({ page }) => {
    const highBoard = page.getByTestId('zone-board').filter({ hasText: '丁社区' });
    await expect(highBoard.getByTestId('zone-summary')).toHaveText(
      '高风险对象 1 人；超期待办 2 条；走访覆盖 100%',
    );

    const overdueOnlyBoard = page.getByTestId('zone-board').filter({ hasText: '甲社区' });
    await expect(overdueOnlyBoard.getByTestId('zone-summary')).toHaveText('超期待办 1 条');
    await expect(overdueOnlyBoard.getByTestId('zone-summary')).not.toContainText('高风险对象');
    await expect(overdueOnlyBoard.getByTestId('zone-summary')).not.toContainText('走访覆盖');

    const zeroBoard = page.getByTestId('zone-board').filter({ hasText: '零值社区' });
    await expect(zeroBoard.getByTestId('zone-summary')).toHaveCount(0);
    await expect(zeroBoard).not.toContainText('当前没有额外重点信号');

    const summaryMetrics = await highBoard.getByTestId('zone-summary').evaluate((element) => ({
      whiteSpace: getComputedStyle(element).whiteSpace,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(summaryMetrics.whiteSpace).toBe('nowrap');
    expect(summaryMetrics.scrollWidth).toBeLessThanOrEqual(summaryMetrics.clientWidth + 1);
  });

  test('R07：街道卡最高热度下方无分隔线', async ({ page }) => {
    const header = page.getByTestId('zone-group-header').first();
    await expect(header).toBeVisible();
    expect(await header.evaluate((element) => getComputedStyle(element).borderBottomWidth)).toBe('0px');
  });

  test('回归：类型筛选生效（跟进超期）', async ({ page }) => {
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: '跟进超期' }).click();
    // 截断后 12 条中仅 g_tie_c-conflict 为「矛盾压力集中」，筛出 11 条「跟进超期」
    const items = page.getByTestId('warning-list-item');
    await expect(items).toHaveCount(11);
    for (const item of await items.all()) {
      await expect(item).toContainText('跟进超期');
    }
    // 筛选后仍保持四级序（filter 保序）
    const ids = await items.evaluateAll((elements) =>
      elements.map((element) => String(element.getAttribute('data-warning-id'))));
    expect(ids).toEqual(EXPECTED_WARNING_IDS.filter((id) => id !== 'g_tie_c-conflict'));
  });

  test('回归：点击热区板弹出预警详情 Dialog，Esc 关闭', async ({ page }) => {
    // mock fixture 单分组（蓬莱示范片区/登州街道），首板 = 热度最高的丙社区
    const firstBoard = page.getByTestId('zone-board').first();
    await expect(firstBoard).toContainText('丙社区');
    await firstBoard.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // 丙网格首条预警 = g_tie_c-conflict（矛盾压力集中）
    await expect(dialog).toContainText('矛盾压力集中');
    await expect(dialog).toContainText('登州街道丙社区第一网格');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
