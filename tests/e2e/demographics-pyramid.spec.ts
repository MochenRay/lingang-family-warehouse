import { expect, test, type Page } from '@playwright/test';

const backendPort = Number(process.env.BACKEND_PORT ?? '8000');

/**
 * P5-T7c 人口金字塔 div → Recharts 验收。
 *
 * mock 用例：page.route() 拦截 `/api/stats/demographics` 注入确定性 24 人聚合 fixture。
 *
 * 真实种子用例：非 mock，验证全量 1917 人下金字塔渲染不崩。
 *
 * fixture 推算（24 人）：九个十岁档逐行给定，61 岁及以上共 6 人，老龄化率 25.0%。
 */

/** 各桶期望（与组件 AGE_BUCKETS 顺序一致：顶→底）。 */
const EXPECTED_BUCKETS = [
  { name: '81岁及以上', male: 1, female: 1 },
  { name: '71-80', male: 1, female: 1 },
  { name: '61-70', male: 1, female: 1 },
  { name: '51-60', male: 2, female: 1 },
  { name: '41-50', male: 1, female: 2 },
  { name: '31-40', male: 2, female: 1 },
  { name: '21-30', male: 1, female: 2 },
  { name: '11-20', male: 2, female: 1 },
  { name: '0-10', male: 1, female: 2 },
];

const ELDERLY_RATE = '25.0%';
/** fixture 最大单桶单性别人数 = 2 → axisMax = 10，对称刻度取绝对值后。 */
const EXPECTED_X_TICKS = ['10', '5', '0', '5', '10'];
const MALE_FILL = '#2761CB';
const FEMALE_FILL = '#E845B1';

const DEMOGRAPHICS_FIXTURE = {
  totalPopulation: 24,
  elderlyCount: 6,
  elderlyRate: 25,
  ageGenderData: EXPECTED_BUCKETS,
  typeData: [
    { name: '户籍', value: 16 },
    { name: '流动', value: 5 },
    { name: '留守', value: 2 },
    { name: '境外', value: 1 },
  ],
  educationData: [{ name: '本科', value: 24 }],
  nationData: [{ name: '汉族', value: 24 }],
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
    await expect(maleBars(page)).toHaveCount(9);
    await expect(femaleBars(page)).toHaveCount(9);
  });

  test('人口特征聚合 fixture 经唯一 endpoint 注入', async () => {
    expect(requestedDemographicsPaths).toEqual(['/api/stats/demographics']);
  });

  test('九个年龄档男/女人数与 fixture 一致，且老龄化比例沿用 61 岁及以上口径', async ({ page }) => {
    // 隐藏数据表（可访问语义副本）逐行断言桶人数
    const table = page.getByRole('table', { name: '年龄性别人口金字塔数据（单位：人）' });
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(9);
    for (const [index, bucket] of EXPECTED_BUCKETS.entries()) {
      const cells = rows.nth(index).locator('th, td');
      await expect(cells.nth(0)).toHaveText(bucket.name);
      await expect(cells.nth(1)).toHaveText(String(bucket.male));
      await expect(cells.nth(2)).toHaveText(String(bucket.female));
    }
    await expect(statCardValue(page, '老龄化比例')).toHaveText(ELDERLY_RATE);
  });

  test('StatCard 显示「61 岁及以上」语义', async ({ page }) => {
    await expect(statCardValue(page, '老龄化比例')).toHaveText(ELDERLY_RATE);
    await expect(page.getByText('61 岁及以上人口占比')).toBeVisible();
  });

  test('镜像正确：同一年龄段男/女条同一 y；X 轴刻度显示正人数', async ({ page }) => {
    const males = maleBars(page);
    const females = femaleBars(page);
    for (let index = 0; index < 9; index += 1) {
      // 比较 SVG y 属性（同一类别行必然完全相等）；不用 boundingBox——
      // 渲染层 bounding box 有亚像素噪声（实测差 0.09px 的假性失败）
      const maleY = await males.nth(index).getAttribute('y');
      const femaleY = await females.nth(index).getAttribute('y');
      expect(maleY, `第 ${index} 段男条无 y 属性`).not.toBeNull();
      expect(maleY, `第 ${index} 段男/女条 y 不一致`).toBe(femaleY);
    }
    const firstMalePath = ((await males.first().getAttribute('d')) ?? '').replace(/\s+/g, '');
    const leftCorner = firstMalePath.match(/^M([\d.]+),[\d.]+L([\d.]+),[\d.]+A6,6,0,0,0,([\d.]+),/);
    expect(leftCorner, '男性柱应从中轴直角端向左延伸，并在外侧以圆角收口').not.toBeNull();
    const [, centerX, arcStartX, outerX] = leftCorner!;
    expect(Number(centerX)).toBeGreaterThan(Number(arcStartX));
    expect(Number(arcStartX)).toBeGreaterThan(Number(outerX));
    const tickTexts = (await page
      .getByTestId('population-pyramid')
      .locator('.recharts-xAxis .recharts-cartesian-axis-tick text')
      .allTextContents())
      .map((text) => text.trim());
    expect(tickTexts).toEqual(EXPECTED_X_TICKS);
  });

  test('tooltip 显示正人数（无负号）', async ({ page }) => {
    // hover 首行（81岁及以上：男 1 / 女 1）女条
    await femaleBars(page).first().hover();
    const tooltip = page.getByTestId('population-pyramid').locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('81岁及以上');
    const tooltipText = (await tooltip.textContent()) ?? '';
    expect(tooltipText).toMatch(/男\s*1/);
    expect(tooltipText).toMatch(/女\s*1/);
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
    // 9 桶 × 2 性别全部渲染（recharts 对零值条不渲染 path，全量种子各桶男女均非零）
    await expect(maleBars(page)).toHaveCount(9);
    await expect(femaleBars(page)).toHaveCount(9);
    // 隐藏数据表覆盖全部 9 个年龄段
    const table = page.getByRole('table', { name: '年龄性别人口金字塔数据（单位：人）' });
    await expect(table.locator('tbody tr')).toHaveCount(9);
    // sr-only 表十八数求和 = 后端聚合 totalPopulation（锁全量统计，防 500 截断回退）
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
