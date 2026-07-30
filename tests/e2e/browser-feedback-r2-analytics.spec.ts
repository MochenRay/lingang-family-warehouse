import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

function trackRuntimeFailures(page: Page) {
  const failures = { consoleErrors: [] as string[], pageErrors: [] as string[], requestFailures: [] as string[], responseFailures: [] as string[] };
  page.on('console', (message) => {
    if (message.type() === 'error') failures.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => failures.pageErrors.push(String(error)));
  page.on('requestfailed', (request) => failures.requestFailures.push(`${request.method()} ${request.url()}`));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.responseFailures.push(`${response.status()} ${response.url()}`);
  });
  return () => {
    expect(failures.consoleErrors).toEqual([]);
    expect(failures.pageErrors).toEqual([]);
    expect(failures.requestFailures).toEqual([]);
    expect(failures.responseFailures).toEqual([]);
  };
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('反馈01：人口流动页无区县筛选、仅一个带文字导出按钮，导出全区域完整快照且无溢出', async ({ page }) => {
  await page.setViewportSize({ width: 1608, height: 1324 });
  const assertRuntimeClean = trackRuntimeFailures(page);
  await dismissJourneyOverlay(page);
  await page.goto('/analysis/migration-trends');
  await expect(page.getByRole('heading', { name: '人口流动趋势' })).toBeVisible();

  await expect(page.getByRole('combobox')).toHaveCount(0);
  await expect(page.locator('[aria-label="导出数据"]')).toHaveCount(0);

  const exportButton = page.getByRole('button', { name: '导出', exact: true });
  await expect(exportButton).toHaveCount(1);
  await expect(exportButton).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportButton.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^migration-trends-\d{4}-\d{2}-\d{2}\.json$/);
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const payload = JSON.parse(readFileSync(downloadPath!, 'utf-8')) as {
    generatedAt?: string;
    migration?: {
      totalIn: number;
      totalOut: number;
      net: number;
      inboundHotspots: Array<{ name: string; value: number }>;
      outboundHotspots: Array<{ name: string; value: number }>;
    };
    monthly?: Array<{ month: string; moveIns: number; moveOuts: number }>;
  };
  expect(payload.monthly?.length).toBe(6);
  for (const item of payload.monthly ?? []) {
    expect(typeof item.month).toBe('string');
    expect(item.month.length).toBeGreaterThan(0);
    expect(typeof item.moveIns).toBe('number');
    expect(typeof item.moveOuts).toBe('number');
  }
  expect(payload.migration?.totalIn).toBeGreaterThan(0);
  expect(payload.migration?.totalOut).toBeGreaterThan(0);
  expect(payload.migration?.inboundHotspots.length).toBeGreaterThan(0);
  expect(payload.migration?.outboundHotspots.length).toBeGreaterThan(0);

  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: '/tmp/lingang-browser-r2/screenshots/K1-migration-1608x1324.png', fullPage: true });
  assertRuntimeClean();
});

test('反馈01：人口流动页 1024x768 视口无水平溢出', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const assertRuntimeClean = trackRuntimeFailures(page);
  await dismissJourneyOverlay(page);
  await page.goto('/analysis/migration-trends');
  await expect(page.getByRole('heading', { name: '人口流动趋势' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  assertRuntimeClean();
});

test('反馈16：影响因子环图无外部标签与连接线，外置图例含名称与百分比，深色 tooltip 可读', async ({ page }) => {
  await page.setViewportSize({ width: 1608, height: 1324 });
  const assertRuntimeClean = trackRuntimeFailures(page);
  await dismissJourneyOverlay(page);
  await page.goto('/attribution/factors');
  await expect(page.locator('[data-page-title]')).toHaveText('影响因子识别');

  const categoryChart = page.getByTestId('factor-category-chart');
  const sectors = categoryChart.locator('path.recharts-sector');
  await expect(sectors).not.toHaveCount(0);
  const sectorCount = await sectors.count();

  await expect(categoryChart.locator('.recharts-pie-label-line')).toHaveCount(0);
  await expect(categoryChart.locator('.recharts-pie-label-text')).toHaveCount(0);
  await expect(categoryChart.locator('.recharts-default-legend')).toHaveCount(0);

  const legend = page.locator('[aria-label="分类贡献图例"]');
  await expect(legend).toBeVisible();
  const legendItems = legend.locator('[data-testid="factor-category-legend-item"]');
  await expect(legendItems).toHaveCount(sectorCount);
  const legendData = await legendItems.evaluateAll((items) => items.map((item) => ({
    name: item.textContent?.trim().replace(/\s+\d+(\.\d)?%$/, '') ?? '',
    text: item.textContent?.trim() ?? '',
    color: item.getAttribute('data-color') ?? '',
  })));
  const sectorColors = await sectors.evaluateAll((items) => items.map((item) => item.getAttribute('fill') ?? ''));
  for (const [index, item] of legendData.entries()) {
    expect(item.name).not.toBe('');
    expect(item.text).toMatch(/\d+(\.\d)?%$/);
    expect(item.color).toBe(sectorColors[index]);
  }

  const hoverPoint = await sectors.first().evaluate((path) => {
    const sector = path as SVGPathElement;
    const svgRect = sector.ownerSVGElement!.getBoundingClientRect();
    const pieCenter = { x: svgRect.x + svgRect.width / 2, y: svgRect.y + svgRect.height / 2 };
    const point = sector.getPointAtLength(sector.getTotalLength() * 0.2);
    const matrix = sector.getScreenCTM()!;
    const onArc = { x: matrix.a * point.x + matrix.c * point.y + matrix.e, y: matrix.b * point.x + matrix.d * point.y + matrix.f };
    const direction = Math.hypot(onArc.x - pieCenter.x, onArc.y - pieCenter.y) || 1;
    return {
      x: onArc.x - ((onArc.x - pieCenter.x) / direction) * 4,
      y: onArc.y - ((onArc.y - pieCenter.y) / direction) * 4,
    };
  });
  await page.mouse.move(hoverPoint.x, hoverPoint.y, { steps: 5 });
  const tooltip = categoryChart.locator('.recharts-tooltip-wrapper');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText(legendData[0].name);
  const tooltipCard = tooltip.locator('div').first();
  const backgroundColor = await tooltipCard.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(backgroundColor).toBe('rgb(44, 51, 77)');

  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: '/tmp/lingang-browser-r2/screenshots/K1-factor-1608x1324.png', fullPage: true });
  assertRuntimeClean();
});
