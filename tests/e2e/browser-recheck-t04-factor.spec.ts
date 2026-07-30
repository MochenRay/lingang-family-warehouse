import { expect, test, type Page } from '@playwright/test';

const EXPECTED_CATEGORIES = ['重点对象', '矛盾调处', '任务闭环', '走访质量', '信息质量'];

const GRIDS = [
  { id: 'factor_grid_a', name: '登州街道甲社区第一网格', parentId: null, managerName: '甲网格员' },
  { id: 'factor_grid_b', name: '登州街道乙社区第一网格', parentId: null, managerName: '乙网格员' },
  { id: 'factor_grid_c', name: '登州街道丙社区第一网格', parentId: null, managerName: '丙网格员' },
];

const PEOPLE = GRIDS.flatMap((grid, gridIndex) =>
  Array.from({ length: 10 }, (_, personIndex) => ({
    id: `${grid.id}_person_${personIndex}`,
    gridId: grid.id,
    name: `${grid.name}居民${personIndex + 1}`,
    idCard: `R51-${gridIndex}-${personIndex}`,
    gender: personIndex % 2 === 0 ? '男' : '女',
    age: 30 + personIndex,
    phone: `1380000${gridIndex}${String(personIndex).padStart(2, '0')}`,
    address: `${grid.name}测试地址`,
    type: '户籍',
    tags: [],
    risk: personIndex < [1, 2, 4][gridIndex] ? 'High' : 'Low',
    updatedAt: '2026-07-20',
  })),
);

const VISITS = GRIDS.flatMap((grid, gridIndex) =>
  PEOPLE.filter((person) => person.gridId === grid.id)
    .slice(0, [7, 8, 9][gridIndex])
    .map((person, visitIndex) => ({
      id: `${grid.id}_visit_${visitIndex}`,
      targetId: person.id,
      targetType: 'person',
      gridId: grid.id,
      visitorName: 'R51 验证员',
      date: '2026-07-20',
      content: 'R51 坐标域验证走访',
    })),
);

const CONFLICTS = GRIDS.flatMap((grid, gridIndex) =>
  Array.from({ length: gridIndex }, (_, conflictIndex) => ({
    id: `${grid.id}_conflict_${conflictIndex}`,
    source: '自行发现',
    title: `${grid.name}测试纠纷${conflictIndex + 1}`,
    type: '邻里纠纷',
    description: 'R51 坐标域验证纠纷',
    involvedParties: [],
    status: '调解中',
    gridId: grid.id,
    location: grid.name,
    timeline: [],
    images: [],
    createdAt: '2026-07-20 10:00:00',
    updatedAt: '2026-07-20 11:00:00',
  })),
);

const PENDING_TASKS = GRIDS.map((grid) => ({
  id: `${grid.id}_task`,
  title: `${grid.name}超期回访`,
  type: '回访',
  sourceKind: 'person',
  sourceId: PEOPLE.find((person) => person.gridId === grid.id)!.id,
  personId: PEOPLE.find((person) => person.gridId === grid.id)!.id,
  gridId: grid.id,
  route: '/mobile/tasks',
  priority: 'high',
  urgent: true,
  description: 'R51 坐标域验证任务',
  assignedBy: '系统研判',
  deadline: '2026-01-01 09:00:00',
  status: 'pending',
  statusLabel: '待回访',
}));

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

async function mockFactorSnapshot(page: Page) {
  await page.route('**/api/stats/grids**', (route) => route.fulfill({ json: { grids: GRIDS } }));
  await page.route('**/api/people**', (route) => route.fulfill({ json: { items: PEOPLE, total: PEOPLE.length } }));
  await page.route('**/api/houses**', (route) => {
    const { pathname } = new URL(route.request().url());
    return pathname === '/api/houses/history-records'
      ? route.fulfill({ json: [] })
      : route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.route('**/api/visits**', (route) => route.fulfill({ json: { items: VISITS, total: VISITS.length } }));
  await page.route('**/api/conflicts**', (route) => route.fulfill({ json: { items: CONFLICTS, total: CONFLICTS.length } }));
  await page.route('**/api/task-rules/projection**', (route) => route.fulfill({
    json: {
      pending: PENDING_TASKS,
      completed: [],
      summary: { pending: PENDING_TASKS.length, overdue: PENDING_TASKS.length, completed: 0, completionRate: 0 },
    },
  }));
}

async function gotoFactorPage(page: Page) {
  await dismissJourneyOverlay(page);
  await mockFactorSnapshot(page);
  await page.goto('/attribution/factors');
  await expect(page.locator('[data-page-title]')).toHaveText('影响因子识别');
  await expect(page.getByTestId('factor-scatter-chart').locator('path.recharts-symbols[name]')).toHaveCount(3);
}

function numericTicks(values: string[]) {
  return values.map((value) => Number(value.replace('%', '').trim())).filter(Number.isFinite);
}

test('R51：环图外置图例与扇区颜色一一对应，散点坐标域由样本驱动且 tooltip 可读', async ({ page }) => {
  await gotoFactorPage(page);

  const categoryChart = page.getByTestId('factor-category-chart');
  const legendItems = await categoryChart.locator('[data-testid="factor-category-legend-item"]').evaluateAll((items) =>
    items.map((item) => ({
      name: item.textContent?.trim().replace(/\s+\d+(\.\d)?%$/, '') ?? '',
      color: item.getAttribute('data-color') ?? '',
    })),
  );
  const sectors = await categoryChart.locator('path.recharts-sector').evaluateAll((items) =>
    items.map((item) => item.getAttribute('fill') ?? ''),
  );

  await expect(categoryChart.locator('.recharts-pie-label-text')).toHaveCount(0);
  await expect(categoryChart.locator('.recharts-pie-label-line')).toHaveCount(0);
  expect(new Set(legendItems.map((item) => item.name))).toEqual(new Set(EXPECTED_CATEGORIES));
  expect(legendItems).toHaveLength(sectors.length);
  for (const [index, legendItem] of legendItems.entries()) {
    expect(legendItem.color).toBe(sectors[index]);
  }

  const scatterChart = page.getByTestId('factor-scatter-chart');
  const xTicks = numericTicks(await scatterChart.locator('.recharts-xAxis .recharts-cartesian-axis-tick text').allTextContents());
  const yTicks = numericTicks(await scatterChart.locator('.recharts-yAxis .recharts-cartesian-axis-tick text').allTextContents());
  expect(Math.min(...xTicks)).toBeGreaterThan(0);
  expect(Math.min(...xTicks)).toBeLessThanOrEqual(70);
  expect(Math.max(...xTicks)).toBeGreaterThanOrEqual(90);
  expect(Math.min(...yTicks)).toBeGreaterThan(0);
  expect(Math.min(...yTicks)).toBeLessThanOrEqual(36);
  expect(Math.max(...yTicks)).toBeGreaterThanOrEqual(42);

  await scatterChart.locator('path.recharts-symbols[name*="丙社区"]').hover();
  const tooltip = scatterChart.locator('.recharts-tooltip-wrapper');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('丙社区');
  await expect(tooltip).toContainText('走访覆盖率');
  await expect(tooltip).toContainText('90%');
  await expect(tooltip).toContainText('热度');
  await expect(tooltip).toContainText('42');
});

test('R51：当前 12 个网格样本均保留，边界气泡不被绘图区裁切', async ({ page }) => {
  await dismissJourneyOverlay(page);
  await page.goto('/attribution/factors');
  await expect(page.locator('[data-page-title]')).toHaveText('影响因子识别');
  const scatterChart = page.getByTestId('factor-scatter-chart');
  const symbols = scatterChart.locator('path.recharts-symbols[name]');
  await expect(symbols).toHaveCount(12);

  const plot = await scatterChart.locator('clipPath rect').first().evaluate((element) => ({
    x: Number(element.getAttribute('x')),
    y: Number(element.getAttribute('y')),
    width: Number(element.getAttribute('width')),
    height: Number(element.getAttribute('height')),
  }));
  const bubbles = await symbols.evaluateAll((elements) => elements.map((element) => ({
    name: element.getAttribute('name'),
    cx: Number(element.getAttribute('cx')),
    cy: Number(element.getAttribute('cy')),
    width: Number(element.getAttribute('width')),
    height: Number(element.getAttribute('height')),
  })));
  for (const bubble of bubbles) {
    expect(bubble.cx - bubble.width / 2, `${bubble.name} 左侧被裁切`).toBeGreaterThanOrEqual(plot.x - 0.5);
    expect(bubble.cx + bubble.width / 2, `${bubble.name} 右侧被裁切`).toBeLessThanOrEqual(plot.x + plot.width + 0.5);
    expect(bubble.cy - bubble.height / 2, `${bubble.name} 顶部被裁切`).toBeGreaterThanOrEqual(plot.y - 0.5);
    expect(bubble.cy + bubble.height / 2, `${bubble.name} 底部被裁切`).toBeLessThanOrEqual(plot.y + plot.height + 0.5);
  }
  await scatterChart.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/lingang-browser-recheck-t04-factor-actual-seed.png' });
});

for (const viewport of [
  { width: 1507, height: 1324 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
]) {
  test(`R51：${viewport.width}x${viewport.height} 无溢出、运行错误或键盘回退`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const requestFailures: string[] = [];
    const responseFailures: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()}`));
    page.on('response', (response) => {
      if (response.status() >= 400) responseFailures.push(`${response.status()} ${response.url()}`);
    });
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoFactorPage(page);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const targetSelect = page.getByRole('combobox').first();
    await targetSelect.focus();
    await expect(targetSelect).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(targetSelect).toBeFocused();
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(requestFailures).toEqual([]);
    expect(responseFailures).toEqual([]);
    await page.screenshot({
      path: `/tmp/lingang-browser-recheck-t04-factor-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });
    await page.getByTestId('factor-category-chart').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/lingang-browser-recheck-t04-factor-${viewport.width}x${viewport.height}-charts.png`,
    });
  });
}
