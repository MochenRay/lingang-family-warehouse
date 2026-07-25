import { expect, test, type Locator, type Page } from '@playwright/test';

async function goto(page: Page, path: string, title: string) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
  await page.goto(path);
  await expect(page.locator('[data-page-title]')).toHaveText(title);
}

async function selectOption(page: Page, trigger: Locator, optionName: string) {
  await trigger.click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
}

test.describe('T02 房屋画像与数据对比', () => {
  test.use({ viewport: { width: 1507, height: 1324 } });

  test('R05 重点区县为稳定高度双列卡片并可内部滚动至第六项', async ({ page }) => {
    await goto(page, '/analysis/housing', '房屋网格画像');

    const scroller = page.getByTestId('district-priority-scroll');
    const cards = page.getByTestId('district-priority-card');
    await expect(cards).toHaveCount(6);
    await expect(scroller).toBeVisible();

    const [first, second, third] = await Promise.all([
      cards.nth(0).boundingBox(),
      cards.nth(1).boundingBox(),
      cards.nth(2).boundingBox(),
    ]);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(third).not.toBeNull();
    expect(Math.abs((first?.y ?? 0) - (second?.y ?? 0))).toBeLessThan(3);
    expect((third?.y ?? 0) - (first?.y ?? 0)).toBeGreaterThan(80);
    expect(Math.abs((first?.height ?? 0) - (third?.height ?? 0))).toBeLessThan(3);

    const before = await scroller.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      scrollTop: element.scrollTop,
    }));
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight + 1);
    expect(before.scrollTop).toBe(0);

    await scroller.focus();
    await expect(scroller).toBeFocused();
    await scroller.press('End');
    await expect(cards.nth(5)).toBeInViewport();
    const after = await scroller.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      scrollTop: element.scrollTop,
    }));
    expect(after.scrollTop).toBeGreaterThan(0);
    expect(after.scrollWidth).toBeLessThanOrEqual(after.clientWidth + 1);
  });

  test('R43 房屋用途分栏与上排一致且四类图例颜色对应', async ({ page }) => {
    await goto(page, '/analysis/housing', '房屋网格画像');

    const cardFor = (heading: string) => page.getByRole('heading', { name: heading }).locator('xpath=ancestor::*[@data-slot="card"][1]');
    const [topLeft, topRight, bottomLeft, bottomRight] = await Promise.all([
      cardFor('区县房屋治理对比').boundingBox(),
      cardFor('重点区县清单').boundingBox(),
      cardFor('房屋用途分布').boundingBox(),
      cardFor('出租房治理预警').boundingBox(),
    ]);
    expect(topLeft).not.toBeNull();
    expect(topRight).not.toBeNull();
    expect(bottomLeft).not.toBeNull();
    expect(bottomRight).not.toBeNull();
    expect(Math.abs((topLeft?.width ?? 0) - (bottomLeft?.width ?? 0))).toBeLessThan(3);
    expect(Math.abs((topRight?.x ?? 0) - (bottomRight?.x ?? 0))).toBeLessThan(3);

    const legendItems = page.getByTestId('house-usage-legend-item');
    await expect(legendItems).toHaveCount(4);
    await expect(legendItems).toHaveText(['自住', '出租', '经营', '空置']);

    const legendColors = await legendItems.evaluateAll((elements) =>
      elements
        .filter((element) => Number(element.getAttribute('data-value')) > 0)
        .map((element) => element.getAttribute('data-color')),
    );
    const sectors = page.locator('.recharts-sector');
    await expect(sectors).toHaveCount(legendColors.length);
    const sectorColors = await sectors.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('fill')),
    );
    expect(sectorColors).toEqual(legendColors);
  });

  test('R44 每区仅一根当前值柱并以两条具名数值参考线对比', async ({ page }) => {
    await goto(page, '/analysis/comparison', '数据对比分析');

    await expect(page.getByText('对比模式', { exact: true })).toHaveCount(0);
    await expect(page.locator('.recharts-bar')).toHaveCount(1);
    await expect(page.locator('.recharts-reference-line-line')).toHaveCount(2);

    const legendItems = page.getByTestId('comparison-legend-item');
    await expect(legendItems).toHaveCount(3);
    await expect(legendItems.nth(0)).toHaveText('当前值');
    await expect(legendItems.nth(1)).toHaveText(/^片区均值 [\d,.]+$/);
    await expect(legendItems.nth(2)).toHaveText(/^治理目标 [\d,.]+$/);
    await expect(page.locator('.recharts-reference-line').filter({ hasText: /^片区均值 [\d,.]+$/ })).toHaveCount(1);
    await expect(page.locator('.recharts-reference-line').filter({ hasText: /^治理目标 [\d,.]+$/ })).toHaveCount(1);

    await expect(page.getByRole('columnheader', { name: '片区均值' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '治理目标' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '参考值' })).toHaveCount(0);

    await page.locator('.recharts-bar-rectangle').first().hover();
    const chartTooltip = page.getByTestId('comparison-chart-tooltip');
    await expect(chartTooltip).toBeVisible();
    await expect(chartTooltip).toContainText('当前值');
    await expect(chartTooltip).toContainText('片区均值');
    await expect(chartTooltip).toContainText('治理目标');
  });

  test('R45 条件仅写入 draft，恢复原值禁用，查询后一次性 apply', async ({ page }) => {
    let snapshotReads = 0;
    await page.route('**/api/stats/grids**', async (route) => {
      if (route.request().method() === 'GET') {
        snapshotReads += 1;
      }
      await route.continue();
    });

    await goto(page, '/analysis/comparison', '数据对比分析');
    const queryButton = page.getByRole('button', { name: '查询', exact: true });
    const levelFilter = page.getByTestId('comparison-filter-level');
    const indicatorFilter = page.getByTestId('comparison-filter-indicator');
    const chartTitle = page.getByRole('heading', { name: /趋势直方图$/ });
    const firstRegionCell = page.locator('tbody tr').first().locator('td').nth(1);

    await expect(queryButton).toBeDisabled();
    await expect(chartTitle).toHaveText('区县趋势直方图');
    await expect(firstRegionCell).not.toContainText('/');
    expect(snapshotReads).toBe(1);

    await selectOption(page, levelFilter, '街镇');
    await expect(queryButton).toBeEnabled();
    await expect(chartTitle).toHaveText('区县趋势直方图');
    await expect(firstRegionCell).not.toContainText('/');
    expect(snapshotReads).toBe(1);

    await selectOption(page, levelFilter, '区县');
    await expect(queryButton).toBeDisabled();
    expect(snapshotReads).toBe(1);

    await selectOption(page, levelFilter, '街镇');
    await selectOption(page, indicatorFilter, '流动人口');
    await expect(queryButton).toBeEnabled();
    await expect(chartTitle).toHaveText('区县趋势直方图');
    expect(snapshotReads).toBe(1);

    await queryButton.click();
    await expect(chartTitle).toHaveText('街镇趋势直方图');
    await expect(firstRegionCell).toContainText('/');
    await expect(queryButton).toBeDisabled();
    expect(snapshotReads).toBe(2);
  });

  test('R45 查询失败保留已应用结果并允许重试', async ({ page }) => {
    let failNextSnapshot = false;
    await page.route('**/api/stats/grids**', async (route) => {
      if (failNextSnapshot && route.request().method() === 'GET') {
        failNextSnapshot = false;
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'planned R45 failure' }) });
        return;
      }
      await route.continue();
    });

    await goto(page, '/analysis/comparison', '数据对比分析');
    const queryButton = page.getByRole('button', { name: '查询', exact: true });
    const chartTitle = page.getByRole('heading', { name: /趋势直方图$/ });
    await expect(queryButton).toBeDisabled();
    await expect(chartTitle).toHaveText('区县趋势直方图');

    await selectOption(page, page.getByTestId('comparison-filter-level'), '街镇');
    failNextSnapshot = true;
    await queryButton.click();

    await expect(page.getByRole('alert')).toContainText('查询失败，已保留上次结果');
    await expect(chartTitle).toHaveText('区县趋势直方图');
    await expect(queryButton).toBeEnabled();
  });

  for (const viewport of [
    { width: 1507, height: 1324 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    test(`NFR ${viewport.width}x${viewport.height} 两页无横溢、运行错误且焦点路径可用`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const requestFailures: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('requestfailed', (request) => requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`));

      await goto(page, '/analysis/housing', '房屋网格画像');
      const housingOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(housingOverflow).toBeLessThanOrEqual(1);
      const districtScroller = page.getByTestId('district-priority-scroll');
      await expect(page.getByTestId('district-priority-card')).toHaveCount(6);
      await districtScroller.focus();
      await expect(districtScroller).toBeFocused();
      await districtScroller.press('End');
      await expect(page.getByTestId('district-priority-card').nth(5)).toBeInViewport();
      await expect(page.locator('.recharts-sector')).toHaveCount(4);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `/tmp/lingang-t02-housing-${viewport.width}x${viewport.height}.png`, fullPage: true });

      await goto(page, '/analysis/comparison', '数据对比分析');
      await expect(page.getByRole('button', { name: '查询', exact: true })).toBeDisabled();
      await expect(page.locator('.recharts-bar-rectangle')).toHaveCount(5);
      const comparisonOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(comparisonOverflow).toBeLessThanOrEqual(1);
      const levelFilter = page.getByTestId('comparison-filter-level');
      await levelFilter.focus();
      await expect(levelFilter).toBeFocused();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `/tmp/lingang-t02-comparison-${viewport.width}x${viewport.height}.png`, fullPage: true });

      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(requestFailures).toEqual([]);
    });
  }
});
