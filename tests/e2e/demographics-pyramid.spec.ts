import { expect, test, type Page } from '@playwright/test';

const backendPort = Number(process.env.BACKEND_PORT ?? '8000');

/**
 * P5-T7c 人口金字塔 div → Recharts 验收。
 *
 * mock 用例：page.route() 拦截 `/api/stats/demographics` 注入确定性 12 人聚合 fixture
 * （各桶男女分布已知，含 1 名 60 岁——验证其归入 36-60岁 桶且不计入老龄化比例）。
 *
 * 真实种子用例：非 mock，验证全量 1917 人下金字塔渲染不崩。
 *
 * fixture 推算（12 人）：
 *   0-18岁   男2 女1 ｜ 19-35岁 男1 女2 ｜ 36-60岁 男2(含60岁) 女1 ｜ 60岁以上 男1 女2
 *   老龄化（>60，即 61 岁及以上）= 3 → 3/12 = 25.0%
 */

/** 各桶期望（与组件 AGE_BUCKETS 顺序一致：顶→底）。 */
const EXPECTED_BUCKETS = [
  { name: '60岁以上', male: 1, female: 2 },
  { name: '36-60岁', male: 2, female: 1 },
  { name: '19-35岁', male: 1, female: 2 },
  { name: '0-18岁', male: 2, female: 1 },
];

const ELDERLY_RATE = '25.0%';
/** fixture 最大单桶单性别人数 = 2 → axisMax = 10，对称刻度取绝对值后。 */
const EXPECTED_X_TICKS = ['10', '5', '0', '5', '10'];
const MALE_FILL = '#2761CB';
const FEMALE_FILL = '#E845B1';

const DEMOGRAPHICS_FIXTURE = {
  totalPopulation: 12,
  elderlyCount: 3,
  elderlyRate: 25,
  ageGenderData: EXPECTED_BUCKETS,
  typeData: [
    { name: '户籍', value: 12 },
    { name: '流动', value: 0 },
    { name: '留守', value: 0 },
    { name: '境外', value: 0 },
  ],
  educationData: [{ name: '本科', value: 12 }],
  nationData: [{ name: '汉族', value: 12 }],
};

async function mockDemographicsStats(page: Page): Promise<string[]> {
  const requestedPaths: string[] = [];
  await page.route('**/api/stats/demographics', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== 'GET') {
      return route.continue();
    }
    requestedPaths.push(url.pathname);
    return route.fulfill({ json: DEMOGRAPHICS_FIXTURE });
  });
  return requestedPaths;
}

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

/** StatCard 结构：label div 的下一个兄弟 div 为数值。 */
function statCardValue(page: Page, label: string) {
  return page
    .locator('div.text-sm')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .first()
    .locator('xpath=following-sibling::div[1]');
}

function maleBars(page: Page) {
  return page.getByTestId('population-pyramid').locator(`path.recharts-rectangle[fill="${MALE_FILL}"]`);
}

function femaleBars(page: Page) {
  return page.getByTestId('population-pyramid').locator(`path.recharts-rectangle[fill="${FEMALE_FILL}"]`);
}

test('人口特征使用聚合接口，且不再下载正 offset 的人口明细页', async ({ page }) => {
  const apiRequests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() === 'GET' && url.pathname.startsWith('/api/')) {
      apiRequests.push(url);
    }
  });
  await dismissJourneyOverlay(page);

  await page.goto('/analysis/demographics');
  await expect(page.getByTestId('population-pyramid')).toBeVisible();
  await page.waitForLoadState('networkidle');

  expect(apiRequests.filter((url) => url.pathname === '/api/stats/demographics')).toHaveLength(1);
  expect(
    apiRequests
      .filter((url) => url.pathname === '/api/people')
      .map((url) => Number(url.searchParams.get('offset') ?? 0))
      .filter((offset) => offset > 0),
  ).toEqual([]);
});

test.describe('P5-T7c 人口金字塔 Recharts（mock fixture）', () => {
  let requestedDemographicsPaths: string[];

  test.beforeEach(async ({ page }) => {
    await dismissJourneyOverlay(page);
    requestedDemographicsPaths = await mockDemographicsStats(page);
    await page.goto('/analysis/demographics');
    await expect(page.getByTestId('population-pyramid')).toBeVisible();
    await expect(maleBars(page)).toHaveCount(4);
    await expect(femaleBars(page)).toHaveCount(4);
  });

  test('人口特征聚合 fixture 经唯一 endpoint 注入', async () => {
    expect(requestedDemographicsPaths).toEqual(['/api/stats/demographics']);
  });

  test('各桶男/女人数与 fixture 推算一致；60 岁归入 36-60岁 且不计入老龄化比例', async ({ page }) => {
    // 隐藏数据表（可访问语义副本）逐行断言桶人数
    const table = page.getByRole('table', { name: '年龄性别人口金字塔数据（单位：人）' });
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(4);
    for (const [index, bucket] of EXPECTED_BUCKETS.entries()) {
      const cells = rows.nth(index).locator('th, td');
      await expect(cells.nth(0)).toHaveText(bucket.name);
      await expect(cells.nth(1)).toHaveText(String(bucket.male));
      await expect(cells.nth(2)).toHaveText(String(bucket.female));
    }
    // 36-60岁 男=2 含 60 岁者（若 60 岁错归 60岁以上，此处男=1 且 60岁以上男=2）
    // 老龄化比例 = 3/12 = 25.0%（若 60 岁被计入则为 4/12 = 33.3%）
    await expect(statCardValue(page, '老龄化比例')).toHaveText(ELDERLY_RATE);
  });

  test('StatCard 显示「61 岁及以上」语义', async ({ page }) => {
    await expect(statCardValue(page, '老龄化比例')).toHaveText(ELDERLY_RATE);
    await expect(page.getByText('61 岁及以上人口占比')).toBeVisible();
  });

  test('镜像正确：同一年龄段男/女条同一 y；X 轴刻度显示正人数', async ({ page }) => {
    const males = maleBars(page);
    const females = femaleBars(page);
    for (let index = 0; index < 4; index += 1) {
      // 比较 SVG y 属性（同一类别行必然完全相等）；不用 boundingBox——
      // 渲染层 bounding box 有亚像素噪声（实测差 0.09px 的假性失败）
      const maleY = await males.nth(index).getAttribute('y');
      const femaleY = await females.nth(index).getAttribute('y');
      expect(maleY, `第 ${index} 段男条无 y 属性`).not.toBeNull();
      expect(maleY, `第 ${index} 段男/女条 y 不一致`).toBe(femaleY);
    }
    const tickTexts = (await page
      .getByTestId('population-pyramid')
      .locator('.recharts-xAxis .recharts-cartesian-axis-tick text')
      .allTextContents())
      .map((text) => text.trim());
    expect(tickTexts).toEqual(EXPECTED_X_TICKS);
  });

  test('tooltip 显示正人数（无负号）', async ({ page }) => {
    // hover 首行（60岁以上：男 1 / 女 2）女条
    await femaleBars(page).first().hover();
    const tooltip = page.getByTestId('population-pyramid').locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('60岁以上');
    const tooltipText = (await tooltip.textContent()) ?? '';
    expect(tooltipText).toMatch(/男\s*1/);
    expect(tooltipText).toMatch(/女\s*2/);
    expect(tooltipText).not.toMatch(/[男女]\s*-\d/);
  });
});

test.describe('P5-T7c 人口金字塔 Recharts（真实种子库）', () => {
  test('全量数据下金字塔渲染不崩', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    await dismissJourneyOverlay(page);
    await page.goto('/analysis/demographics');
    await expect(page.getByText('人口特征分析').first()).toBeVisible();
    const pyramid = page.getByTestId('population-pyramid');
    await expect(pyramid).toBeVisible();
    // 4 桶 × 2 性别全部渲染（recharts 对零值条不渲染 path，全量种子各桶男女均非零）
    await expect(maleBars(page)).toHaveCount(4);
    await expect(femaleBars(page)).toHaveCount(4);
    // 隐藏数据表覆盖全部 4 个年龄段
    const table = page.getByRole('table', { name: '年龄性别人口金字塔数据（单位：人）' });
    await expect(table.locator('tbody tr')).toHaveCount(4);
    // sr-only 表八数求和 = 后端聚合 totalPopulation（锁全量统计，防 500 截断回退）
    const cells = await table.locator('tbody td').allTextContents();
    const sum = cells.map((text) => Number(text.trim())).reduce((acc, value) => acc + value, 0);
    const demographicsResponse = await page.request.get(`http://127.0.0.1:${backendPort}/api/stats/demographics`);
    expect(demographicsResponse.ok()).toBe(true);
    const { totalPopulation } = (await demographicsResponse.json()) as { totalPopulation: number };
    expect(sum).toBe(totalPopulation);
    await expect(page.getByText('61 岁及以上人口占比')).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });
});
