import { expect, test, type Page } from '@playwright/test';

/**
 * P5-T3 客户端分页（矛盾调解 + 公告管理）验收。
 *
 * 分页行为用例：page.route() 拦截列表 GET 注入确定性 42 条 fixture
 * （21 条 + 21 条两类别，全部/单类别分别 3 页/2 页，便于非平凡断言「改筛选回第 1 页」）；
 * 只 mock GET 列表，不增造/修改真实数据，不为测试加后端端点。
 *
 * KPI 用例：非 mock 真实种子库，断言两页 8 张 KPI 卡数值与改造前量取值逐卡相等
 * （改造前量取值：公告 4/1/1/0，矛盾 16件/0件/3件/19%；种子 rng 固定、时间戳永不落在当天，
 * 数值跨轮稳定）。与 mock 用例分开，避免注入数据改变 KPI。
 */

const NOTICE_TOTAL = 42;
const NOTICE_URGENT = 21;
const CONFLICT_TOTAL = 42;
const CONFLICT_RESOLVED = 21;

interface NoticeFixture {
  id: string;
  title: string;
  type: 'urgent' | 'info';
  content: string;
  scope: string[];
  grids: string[];
  status: 'published';
  publishedAt: string;
  publisher: string;
  department: string;
  readCount: number;
  attachments: never[];
}

interface ConflictFixture {
  id: string;
  source: '上级下派';
  title: string;
  type: '邻里纠纷' | '物业纠纷';
  description: string;
  involvedParties: never[];
  status: '调解中' | '已化解';
  gridId: string;
  location: string;
  timeline: never[];
  images: never[];
  createdAt: string;
  updatedAt: string;
}

function buildNoticeFixtures(): NoticeFixture[] {
  return Array.from({ length: NOTICE_TOTAL }, (_, index) => {
    const seq = index + 1;
    return {
      id: `e2e_notice_${String(seq).padStart(2, '0')}`,
      title: `分页注入公告 第${seq}条`,
      type: seq <= NOTICE_URGENT ? 'urgent' : 'info',
      content: `客户端分页行为注入数据 ${seq}`,
      scope: ['all'],
      grids: [],
      status: 'published',
      publishedAt: '2026-07-01 10:00',
      publisher: '自动化验证',
      department: '自动化验证',
      readCount: 0,
      attachments: [],
    };
  });
}

function buildConflictFixtures(): ConflictFixture[] {
  return Array.from({ length: CONFLICT_TOTAL }, (_, index) => {
    const seq = index + 1;
    return {
      id: `e2e_conflict_${String(seq).padStart(2, '0')}`,
      source: '上级下派',
      title: `分页注入纠纷 第${seq}条`,
      type: seq % 2 === 0 ? '邻里纠纷' : '物业纠纷',
      description: `客户端分页行为注入数据 ${seq}`,
      involvedParties: [],
      status: seq <= CONFLICT_TOTAL - CONFLICT_RESOLVED ? '调解中' : '已化解',
      gridId: 'g1',
      location: '自动化验证地址',
      timeline: [],
      images: [],
      createdAt: '2026-07-01 10:00:00',
      updatedAt: '2026-07-02 10:00:00',
    };
  });
}

/** 公告列表 GET 注入 42 条 fixture（仅 GET，其他请求放行）。 */
async function mockNoticeList(page: Page) {
  const fixtures = buildNoticeFixtures();
  await page.route('**/api/notices**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== 'GET' || url.pathname !== '/api/notices') {
      return route.continue();
    }
    return route.fulfill({ json: { items: fixtures, total: fixtures.length } });
  });
}

/** 矛盾列表 GET 注入 42 条 fixture；按 status/search 参数过滤，模拟服务端筛选语义。 */
async function mockConflictList(page: Page) {
  const fixtures = buildConflictFixtures();
  await page.route('**/api/conflicts**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== 'GET' || url.pathname !== '/api/conflicts') {
      return route.continue();
    }
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    let items = fixtures;
    if (status) {
      items = items.filter((item) => item.status === status);
    }
    if (search) {
      items = items.filter((item) => item.title.includes(search));
    }
    return route.fulfill({ json: { items, total: items.length } });
  });
}

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

/** StatCard 结构：label div 的下一个兄弟 div 为数值。 */
function kpiValue(page: Page, label: string) {
  return page
    .locator('div.text-sm')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .first()
    .locator('xpath=following-sibling::div[1]');
}

test.describe('P5-T3 客户端分页', () => {
  test('公告管理表格客户端分页：翻页可见第 21 条，改筛选回第 1 页', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await mockNoticeList(page);
    await page.goto('/grid/notices');

    // 第 1 页：1-20 条，第 21 条不可见
    await expect(page.getByText('共 42 条，当前显示 1-20 条')).toBeVisible();
    await expect(page.getByText('第 1 / 3 页')).toBeVisible();
    await expect(page.getByText('分页注入公告 第1条')).toBeVisible();
    await expect(page.getByText('分页注入公告 第21条')).not.toBeVisible();

    // 翻到第 2 页：可见第 21 条
    await page.getByRole('button', { name: '下一页' }).click();
    await expect(page.getByText('共 42 条，当前显示 21-40 条')).toBeVisible();
    await expect(page.getByText('第 2 / 3 页')).toBeVisible();
    await expect(page.getByText('分页注入公告 第21条')).toBeVisible();
    await expect(page.getByText('分页注入公告 第1条')).not.toBeVisible();

    // 改筛选（紧急，21 条 → 2 页）回第 1 页
    await page.getByRole('button', { name: '紧急', exact: true }).click();
    await expect(page.getByText('共 21 条，当前显示 1-20 条')).toBeVisible();
    await expect(page.getByText('第 1 / 2 页')).toBeVisible();
  });

  test('矛盾调解表格客户端分页：翻页可见第 21 条，改筛选回第 1 页', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await mockConflictList(page);
    await page.goto('/grid/conflicts');

    // 第 1 页：1-20 条，第 21 条不可见
    await expect(page.getByText('分页注入纠纷 第1条')).toBeVisible();
    await expect(page.getByText('共 42 条，当前显示 1-20 条')).toBeVisible();
    await expect(page.getByText('第 1 / 3 页')).toBeVisible();
    await expect(page.getByText('分页注入纠纷 第21条')).not.toBeVisible();

    // 翻到第 2 页：可见第 21 条
    await page.getByRole('button', { name: '下一页' }).click();
    await expect(page.getByText('共 42 条，当前显示 21-40 条')).toBeVisible();
    await expect(page.getByText('第 2 / 3 页')).toBeVisible();
    await expect(page.getByText('分页注入纠纷 第21条')).toBeVisible();
    await expect(page.getByText('分页注入纠纷 第1条')).not.toBeVisible();

    // 改状态筛选（已化解，21 条 → 2 页）回第 1 页
    await page.getByRole('combobox').filter({ hasText: '状态' }).click();
    await page.getByRole('option', { name: '已化解' }).click();
    await expect(page.getByText('共 21 条，当前显示 1-20 条')).toBeVisible();
    await expect(page.getByText('第 1 / 2 页')).toBeVisible();
  });

  test('公告管理 KPI 四卡数值与改造前冻结值一致（真实种子库）', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/grid/notices');
    await expect(page.getByText('共 5 条，当前显示 1-5 条')).toBeVisible();

    await expect(kpiValue(page, '总公告数')).toHaveText('4');
    await expect(kpiValue(page, '紧急通知')).toHaveText('1');
    await expect(kpiValue(page, '工作任务')).toHaveText('1');
    await expect(kpiValue(page, '今日发布')).toHaveText('0');
  });

  test('矛盾调解 KPI 四卡数值与改造前冻结值一致（真实种子库）', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/grid/conflicts');
    await expect(page.getByText('共 16 条，当前显示 1-16 条')).toBeVisible();

    await expect(kpiValue(page, '纠纷总数')).toHaveText('16件');
    await expect(kpiValue(page, '今日新增')).toHaveText('0件');
    await expect(kpiValue(page, '累计化解')).toHaveText('3件');
    await expect(kpiValue(page, '化解率')).toHaveText('19%');
  });
});
