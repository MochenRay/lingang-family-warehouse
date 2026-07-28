import { expect, test, type Locator, type Page } from '@playwright/test';

const EVIDENCE_DIR = '/tmp/lingang-browser-feedback-b01-b18';

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

async function goto(page: Page, path: string, title: string) {
  await dismissJourneyOverlay(page);
  await page.goto(path);
  await expect(page.locator('[data-page-title]')).toHaveText(title);
}

function cardFor(page: Page, heading: string) {
  return page.getByRole('heading', { name: heading, exact: true }).locator('xpath=ancestor::*[@data-slot="card"][1]');
}

function boxesOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
) {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y;
}

async function expectAboveAndRight(chart: Locator, line: Locator, label: Locator) {
  const [chartBox, lineBox, labelBox] = await Promise.all([
    chart.boundingBox(),
    line.boundingBox(),
    label.boundingBox(),
  ]);
  expect(chartBox).not.toBeNull();
  expect(lineBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect(labelBox!.x + labelBox!.width / 2).toBeGreaterThan(chartBox!.x + chartBox!.width / 2);
  expect(labelBox!.y + labelBox!.height).toBeLessThanOrEqual(lineBox!.y + 2);
}

test.describe('B01-B09 / B12 分析与报表集中修复', () => {
  test('B01 房屋用途图例为居中紧凑 flex，窄屏可换行', async ({ page }) => {
    await page.setViewportSize({ width: 1573, height: 1324 });
    await goto(page, '/analysis/housing', '房屋网格画像');
    const usageCard = cardFor(page, '房屋用途分布');
    const legend = usageCard.locator('[aria-label="房屋用途图例"]');
    await expect(legend).toBeVisible();
    const legendStyle = await legend.evaluate((element) => {
      const style = getComputedStyle(element);
      return { display: style.display, justifyContent: style.justifyContent, flexWrap: style.flexWrap };
    });
    expect(legendStyle).toEqual({ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' });
    await page.setViewportSize({ width: 480, height: 900 });
    const legendOverflow = await legend.evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(legendOverflow).toBeLessThanOrEqual(1);
    await expect.poll(
      () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(1);
  });

  test('B02 房屋用途分布标题使用 ChartPie icon', async ({ page }) => {
    await goto(page, '/analysis/housing', '房屋网格画像');
    await expect(cardFor(page, '房屋用途分布').locator('[data-slot="card-title"] svg.lucide-chart-pie')).toHaveCount(1);
  });

  test('B05 重点区县标题固定且全部十一项可由键盘 End 到达', async ({ page }) => {
    await page.setViewportSize({ width: 1573, height: 1324 });
    await goto(page, '/analysis/housing', '房屋网格画像');
    await page.waitForLoadState('networkidle');
    await page.locator('.page-enter').evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)));
    const title = page.getByRole('heading', { name: '重点区县清单', exact: true });
    const titleBefore = await title.boundingBox();
    const scroller = page.getByTestId('district-priority-scroll');
    const cards = page.getByTestId('district-priority-card');
    await expect(cards).toHaveCount(11);
    await scroller.focus();
    await scroller.press('End');
    await expect(cards.last()).toBeInViewport();
    const titleAfter = await title.boundingBox();
    expect(Math.abs(titleAfter!.y - titleBefore!.y)).toBeLessThanOrEqual(1);
  });

  for (const viewport of [
    { width: 1573, height: 1324 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 480, height: 900 },
  ]) {
    test('B03 ' + viewport.width + 'x' + viewport.height + ' 两参考线标签均在图表右侧、虚线上方且不重叠', async ({ page }) => {
      await page.setViewportSize(viewport);
      await goto(page, '/analysis/comparison', '数据对比分析');
      const chart = page.locator('.recharts-wrapper').first();
      const averageGroup = page.locator('.recharts-reference-line').filter({ hasText: /^片区均值 [\d,.]+$/ });
      const targetGroup = page.locator('.recharts-reference-line').filter({ hasText: /^治理目标 [\d,.]+$/ });
      const averageLabel = averageGroup.locator('text');
      const targetLabel = targetGroup.locator('text');
      await expectAboveAndRight(chart, averageGroup.locator('line'), averageLabel);
      await expectAboveAndRight(chart, targetGroup.locator('line'), targetLabel);
      const [averageBox, targetBox] = await Promise.all([averageLabel.boundingBox(), targetLabel.boundingBox()]);
      expect(boxesOverlap(averageBox!, targetBox!)).toBe(false);
    });
  }

  test('B06 预警清单仅在 xl 宽屏两列，1024 回落单列', async ({ page }) => {
    await page.setViewportSize({ width: 1573, height: 1324 });
    await goto(page, '/analysis/warning-map', '预警热区');
    const items = page.getByTestId('warning-list-item');
    await expect(items.first()).toBeVisible({ timeout: 20_000 });
    expect(await items.count()).toBeGreaterThan(1);
    const [wideFirst, wideSecond] = await Promise.all([items.nth(0).boundingBox(), items.nth(1).boundingBox()]);
    expect(Math.abs(wideFirst!.y - wideSecond!.y)).toBeLessThanOrEqual(2);

    await page.setViewportSize({ width: 1024, height: 768 });
    const [narrowFirst, narrowSecond] = await Promise.all([items.nth(0).boundingBox(), items.nth(1).boundingBox()]);
    expect(narrowSecond!.y).toBeGreaterThan(narrowFirst!.y + narrowFirst!.height - 2);
  });

  test('B07 报表空态在记录卡内容区双轴居中', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, '/analysis/reports', '报表中心');
    const content = page.getByTestId('report-records-card').locator('[data-slot="card-content"]');
    const state = content.locator('[data-page-state="empty"]');
    await expect(state).toBeVisible();
    const contentStyle = await content.evaluate((element) => {
      const style = getComputedStyle(element);
      return { alignItems: style.alignItems, justifyContent: style.justifyContent };
    });
    expect(contentStyle).toEqual({ alignItems: 'center', justifyContent: 'center' });
    const [contentBox, stateBox] = await Promise.all([content.boundingBox(), state.boundingBox()]);
    expect(Math.abs((stateBox!.x + stateBox!.width / 2) - (contentBox!.x + contentBox!.width / 2))).toBeLessThanOrEqual(2);
    expect(Math.abs((stateBox!.y + stateBox!.height / 2) - (contentBox!.y + contentBox!.height / 2))).toBeLessThanOrEqual(2);
  });

  test('B08 删除生成导出包的冗余说明', async ({ page }) => {
    await goto(page, '/analysis/reports', '报表中心');
    await expect(page.getByTestId('report-config-card').getByText('根据真实治理快照生成一个新的导出文件。')).toHaveCount(0);
  });

  test('B09 生成导出包标题使用 Archive icon', async ({ page }) => {
    await goto(page, '/analysis/reports', '报表中心');
    await expect(page.getByTestId('report-config-card').locator('[data-slot="card-title"] svg.lucide-archive')).toHaveCount(1);
  });

  test('B12 首次加载为中央状态，首次失败可重试', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let fail = false;
    await page.route('**/api/stats/grids**', async (route) => {
      if (fail) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'planned B12 failure' }) });
        return;
      }
      await gate;
      await route.continue();
    });

    await dismissJourneyOverlay(page);
    await page.goto('/analysis/comparison');
    await expect(page.locator('[data-page-title]')).toHaveText('数据对比分析');
    await expect(page.locator('[data-page-state="loading"]')).toContainText('正在加载数据对比');
    await expect(page.getByRole('heading', { name: /趋势直方图$/ })).toHaveCount(0);
    release();
    await expect(page.getByRole('heading', { name: /趋势直方图$/ })).toBeVisible();

    fail = true;
    await page.reload();
    const error = page.locator('[data-page-state="error"]');
    await expect(error).toContainText('数据对比加载失败');
    await expect(error.getByRole('button', { name: '重试' })).toBeVisible();
  });

  test('B12 重新查询保留旧结果，仅按钮显示查询中', async ({ page }) => {
    let queryStarted = false;
    let releaseQuery!: () => void;
    const queryGate = new Promise<void>((resolve) => { releaseQuery = resolve; });
    await page.route('**/api/stats/grids**', async (route) => {
      if (queryStarted) await queryGate;
      await route.continue();
    });
    await goto(page, '/analysis/comparison', '数据对比分析');
    const chartTitle = page.getByRole('heading', { name: /趋势直方图$/ });
    await expect(chartTitle).toHaveText('区县趋势直方图');
    await page.getByTestId('comparison-filter-level').click();
    await page.getByRole('option', { name: '街镇' }).click();
    queryStarted = true;
    const queryButton = page.getByTestId('comparison-query');
    await queryButton.click();
    await expect(queryButton).toContainText('查询中');
    await expect(chartTitle).toHaveText('区县趋势直方图');
    await expect(page.locator('[data-page-state="loading"]')).toHaveCount(0);
    releaseQuery();
    await expect(chartTitle).toHaveText('街镇趋势直方图');
  });

  test('四视口页面无横溢并生成分析证据截图', async ({ page }) => {
    test.setTimeout(120_000);
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const requestFailures: string[] = [];
    page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => requestFailures.push(request.method() + ' ' + request.url() + ' ' + (request.failure()?.errorText ?? '')));

    for (const viewport of [
      { width: 1573, height: 1324 },
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 480, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await goto(page, '/analysis/housing', '房屋网格画像');
      await page.waitForLoadState('networkidle');
      const usageSector = cardFor(page, '房屋用途分布').locator('.recharts-sector').first();
      await expect.poll(() => usageSector.evaluate((element) => (element as SVGGraphicsElement).getBBox().width)).toBeGreaterThan(20);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: EVIDENCE_DIR + '/analysis-housing-' + viewport.width + 'x' + viewport.height + '.png',
        fullPage: true,
        animations: 'disabled',
      });
      await cardFor(page, '房屋用途分布').screenshot({
        path: EVIDENCE_DIR + '/analysis-house-usage-' + viewport.width + 'x' + viewport.height + '.png',
        animations: 'disabled',
      });
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(requestFailures).toEqual([]);
  });
});
