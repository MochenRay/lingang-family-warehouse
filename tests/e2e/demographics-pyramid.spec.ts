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

/** 后端年龄桶合同（顶→底）；页面仅将顶档轴文案压缩为 81+。 */
const BACKEND_BUCKETS = [
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
const EXPECTED_BUCKETS = BACKEND_BUCKETS.map((bucket) => ({
  ...bucket,
  name: bucket.name === '81岁及以上' ? '81+' : bucket.name,
}));

const ELDERLY_RATE = '25.0%';
/** fixture 最大单桶单性别人数 = 2 → axisMax = 10，对称刻度取绝对值后。 */
const EXPECTED_X_TICKS = ['10', '5', '0', '5', '10'];
const MALE_FILL = '#2761CB';
const FEMALE_FILL = '#E845B1';

const DEMOGRAPHICS_FIXTURE = {
  totalPopulation: 24,
  elderlyCount: 6,
  elderlyRate: 25,
  ageGenderData: BACKEND_BUCKETS,
  typeData: [
    { name: '户籍', value: 16 },
    { name: '流动', value: 5 },
    { name: '留守', value: 2 },
    { name: '境外', value: 1 },
  ],
  educationData: [{ name: '本科', value: 24 }],
  // 故意不按数值排序，确保页面排序行为可致红，而非沿用 fixture 顺序假绿。
  nationData: [
    { name: '汉族', value: 9 },
    { name: '朝鲜族', value: 1 },
    { name: '满族', value: 4 },
    { name: '回族', value: 2 },
    { name: '其他民族', value: 5 },
    { name: '未记录', value: 3 },
  ],
};

const EXPECTED_SORTED_NATIONS = ['汉族', '其他民族', '满族', '未记录', '回族', '朝鲜族'];

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

async function axisTickTexts(page: Page, chartTestId: string, axisClass: 'recharts-xAxis' | 'recharts-yAxis') {
  return (await page
    .getByTestId(chartTestId)
    .locator(`.${axisClass} .recharts-cartesian-axis-tick text`)
    .allTextContents())
    .map((text) => text.trim());
}

function observeBrowserFailures(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()}`));
  return { consoleErrors, pageErrors, requestFailures };
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

  test('R01 镜像正确：同档男/女 SVG y 与 height 严格相同，男条仅外侧圆角，顶档轴为 81+', async ({ page }) => {
    const males = maleBars(page);
    const females = femaleBars(page);
    for (let index = 0; index < 9; index += 1) {
      // 比较 SVG y 属性（同一类别行必然完全相等）；不用 boundingBox——
      // 渲染层 bounding box 有亚像素噪声（实测差 0.09px 的假性失败）
      const maleY = await males.nth(index).getAttribute('y');
      const femaleY = await females.nth(index).getAttribute('y');
      const maleHeight = await males.nth(index).getAttribute('height');
      const femaleHeight = await females.nth(index).getAttribute('height');
      expect(maleY, `第 ${index} 段男条无 y 属性`).not.toBeNull();
      expect(maleY, `第 ${index} 段男/女条 y 不一致`).toBe(femaleY);
      expect(maleHeight, `第 ${index} 段男条无 height 属性`).not.toBeNull();
      expect(maleHeight, `第 ${index} 段男/女条 height 不一致`).toBe(femaleHeight);
    }
    const firstMalePath = ((await males.first().getAttribute('d')) ?? '').replace(/\s+/g, '');
    const leftCorner = firstMalePath.match(/^M([\d.]+),[\d.]+L([\d.]+),[\d.]+A6,6,0,0,0,([\d.]+),/);
    expect(leftCorner, '男性柱应从中轴直角端向左延伸，并在外侧以圆角收口').not.toBeNull();
    expect(firstMalePath.match(/A6,6/g), '男性柱只应在左侧外端形成上下两个圆角').toHaveLength(2);
    const [, centerX, arcStartX, outerX] = leftCorner!;
    expect(Number(centerX)).toBeGreaterThan(Number(arcStartX));
    expect(Number(arcStartX)).toBeGreaterThan(Number(outerX));
    expect(await axisTickTexts(page, 'population-pyramid', 'recharts-xAxis')).toEqual(EXPECTED_X_TICKS);
    expect(await axisTickTexts(page, 'population-pyramid', 'recharts-yAxis')).toEqual(EXPECTED_BUCKETS.map(({ name }) => name));
  });

  test('B04 自定义 shape 整数化同档 SVG 与真实 bounding box，并关闭两侧动画', async ({ page }) => {
    const males = maleBars(page);
    const females = femaleBars(page);
    expect(await males.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-pyramid-gender'))))
      .toEqual(Array(9).fill('male'));
    expect(await females.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-pyramid-gender'))))
      .toEqual(Array(9).fill('female'));
    expect(await males.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-animation-enabled'))))
      .toEqual(Array(9).fill('false'));
    expect(await females.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-animation-enabled'))))
      .toEqual(Array(9).fill('false'));

    for (let index = 0; index < 9; index += 1) {
      const maleY = Number(await males.nth(index).getAttribute('y'));
      const femaleY = Number(await females.nth(index).getAttribute('y'));
      const maleHeight = Number(await males.nth(index).getAttribute('height'));
      const femaleHeight = Number(await females.nth(index).getAttribute('height'));
      expect(Number.isInteger(maleY), 'male y bucket ' + index).toBe(true);
      expect(Number.isInteger(femaleY), 'female y bucket ' + index).toBe(true);
      expect(Number.isInteger(maleHeight), 'male height bucket ' + index).toBe(true);
      expect(Number.isInteger(femaleHeight), 'female height bucket ' + index).toBe(true);
      expect(maleY).toBe(femaleY);
      expect(maleHeight).toBe(femaleHeight);

      const [maleBox, femaleBox] = await Promise.all([
        males.nth(index).boundingBox(),
        females.nth(index).boundingBox(),
      ]);
      expect(maleBox).not.toBeNull();
      expect(femaleBox).not.toBeNull();
      expect(Math.abs(maleBox!.y - femaleBox!.y), 'real y bucket ' + index).toBeLessThanOrEqual(0.01);
      expect(Math.abs(maleBox!.height - femaleBox!.height), 'real height bucket ' + index).toBeLessThanOrEqual(0.01);
    }
  });

  test('tooltip 显示正人数（无负号）', async ({ page }) => {
    // hover 首行（UI 轴文案 81+：男 1 / 女 1）女条
    await femaleBars(page).first().hover();
    const tooltip = page.getByTestId('population-pyramid').locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('81+');
    const tooltipText = (await tooltip.textContent()) ?? '';
    expect(tooltipText).toMatch(/男\s*1/);
    expect(tooltipText).toMatch(/女\s*1/);
    expect(tooltipText).not.toMatch(/[男女]\s*-\d/);
  });

  test('R03 民族分布无条件按当前值降序，保留六柱六标签且总数不变', async ({ page }) => {
    const chart = page.getByTestId('nation-distribution');
    await expect(chart.locator('path.recharts-rectangle')).toHaveCount(6);
    expect(await axisTickTexts(page, 'nation-distribution', 'recharts-xAxis')).toEqual(EXPECTED_SORTED_NATIONS);
    const table = page.getByRole('table', { name: '民族分布数据（单位：人）' });
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(6);
    const values = (await rows.locator('td').allTextContents()).map((value) => Number(value));
    expect(values).toEqual([9, 5, 4, 3, 2, 1]);
    expect(values.every((value) => value > 0)).toBe(true);
    expect(values.reduce((sum, value) => sum + value, 0)).toBe(24);
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

  test('R03 真实种子民族六项均非零、合计 1917，DOM 顺序与当前值降序一致', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/analysis/demographics');
    const chart = page.getByTestId('nation-distribution');
    await expect(chart.locator('path.recharts-rectangle')).toHaveCount(6);
    const response = await page.request.get(`http://127.0.0.1:${backendPort}/api/stats/demographics`);
    expect(response.ok()).toBe(true);
    const { nationData } = (await response.json()) as { nationData: Array<{ name: string; value: number }> };
    expect(nationData).toHaveLength(6);
    expect(nationData.map(({ name }) => name)).toEqual(expect.arrayContaining([
      '汉族',
      '朝鲜族',
      '满族',
      '回族',
      '其他民族',
      '未记录',
    ]));
    expect(nationData.every(({ value }) => value > 0)).toBe(true);
    expect(nationData.reduce((sum, { value }) => sum + value, 0)).toBe(1917);
    const expectedOrder = nationData.slice().sort((left, right) => right.value - left.value).map(({ name }) => name);
    expect(await axisTickTexts(page, 'nation-distribution', 'recharts-xAxis')).toEqual(expectedOrder);
  });
});

for (const viewport of [
  { width: 1507, height: 1324 },
  { width: 1440, height: 900 },
]) {
  test(`R39 ${viewport.width}x${viewport.height} 三张分布卡及图表等高，标签不裁切`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const failures = observeBrowserFailures(page);
    await dismissJourneyOverlay(page);
    await mockDemographicsStats(page);
    await page.goto('/analysis/demographics');

    const cards = ['type-distribution', 'education-distribution', 'nation-distribution'].map((testId) => page.getByTestId(testId));
    await Promise.all(cards.map((card) => expect(card).toBeVisible()));
    const boxes = await Promise.all(cards.map((card) => card.boundingBox()));
    expect(boxes.every(Boolean)).toBe(true);
    const cardBottoms = boxes.map((box) => Math.round(box!.y + box!.height));
    expect(new Set(cardBottoms).size, `卡片底边不齐：${cardBottoms.join(', ')}`).toBe(1);

    const chartBoxes = await Promise.all(
      ['type-distribution-chart', 'education-distribution-chart', 'nation-distribution-chart']
        .map((testId) => page.getByTestId(testId).boundingBox()),
    );
    const chartHeights = chartBoxes.map((box) => Math.round(box?.height ?? 0));
    expect(new Set(chartHeights).size, `图表容器高度不齐：${chartHeights.join(', ')}`).toBe(1);
    expect(chartHeights[0]).toBeGreaterThanOrEqual(330);

    for (const card of cards) {
      const svgBox = await card.locator('svg.recharts-surface').boundingBox();
      expect(svgBox).not.toBeNull();
      for (const tick of await card.locator('svg.recharts-surface text').all()) {
        const tickBox = await tick.boundingBox();
        if (!tickBox) continue;
        expect(tickBox.x).toBeGreaterThanOrEqual(svgBox!.x - 1);
        expect(tickBox.y).toBeGreaterThanOrEqual(svgBox!.y - 1);
        expect(tickBox.x + tickBox.width).toBeLessThanOrEqual(svgBox!.x + svgBox!.width + 1);
        expect(tickBox.y + tickBox.height).toBeLessThanOrEqual(svgBox!.y + svgBox!.height + 1);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(failures).toEqual({ consoleErrors: [], pageErrors: [], requestFailures: [] });
  });
}

test('R39 1024x768 纵向布局不以桌面高度强撑，且无横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const failures = observeBrowserFailures(page);
  await dismissJourneyOverlay(page);
  await mockDemographicsStats(page);
  await page.goto('/analysis/demographics');

  const cards = ['type-distribution', 'education-distribution', 'nation-distribution'].map((testId) => page.getByTestId(testId));
  const boxes = await Promise.all(cards.map((card) => card.boundingBox()));
  expect(boxes.every(Boolean)).toBe(true);
  expect(boxes[0]!.y).toBeLessThan(boxes[1]!.y);
  expect(boxes[1]!.y).toBeLessThan(boxes[2]!.y);
  for (const box of boxes) expect(box!.height).toBeLessThan(400);

  const chartBoxes = await Promise.all(
    ['type-distribution-chart', 'education-distribution-chart', 'nation-distribution-chart']
      .map((testId) => page.getByTestId(testId).boundingBox()),
  );
  for (const box of chartBoxes) expect(box!.height).toBeLessThanOrEqual(290);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(failures).toEqual({ consoleErrors: [], pageErrors: [], requestFailures: [] });
});
