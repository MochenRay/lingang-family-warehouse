import { expect, test, type Page } from '@playwright/test';

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

async function expectNoPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe('R10 报表治理快照与导出记录布局', () => {
  test.beforeEach(async ({ page }) => {
    await dismissJourneyOverlay(page);
  });

  for (const viewport of [
    { width: 1507, height: 1324 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    test(`${viewport.width}x${viewport.height}：加载占位稳定，空态与生成卡等底`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const assertRuntimeClean = trackRuntimeFailures(page);
      let releaseSnapshot!: () => void;
      const snapshotGate = new Promise<void>((resolve) => {
        releaseSnapshot = resolve;
      });
      await page.route('**/api/stats/grids**', async (route) => {
        await snapshotGate;
        await route.continue();
      });

      await page.goto('/analysis/reports');
      await expect(page.locator('[data-page-title]')).toHaveText('报表中心');
      const snapshotGrid = page.getByTestId('report-snapshot-grid');
      const recordsCard = page.getByTestId('report-records-card');
      await expect(page.getByTestId('report-snapshot-skeleton')).toHaveCount(4);
      await expect(recordsCard.locator('[data-page-state="empty"]')).toBeVisible();
      await page.locator('.page-enter').evaluate((element) =>
        Promise.all(element.getAnimations().map((animation) => animation.finished)));
      await page.screenshot({
        path: `/tmp/lingang-t03-reports-loading-${viewport.width}x${viewport.height}.png`,
        fullPage: true,
      });

      const loadingGridBox = await snapshotGrid.boundingBox();
      const loadingRecordsBox = await recordsCard.boundingBox();
      expect(loadingGridBox).not.toBeNull();
      expect(loadingRecordsBox).not.toBeNull();

      releaseSnapshot();
      await expect(page.getByTestId('report-snapshot-skeleton')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /治理总览快照/ })).toBeVisible();

      const loadedGridBox = await snapshotGrid.boundingBox();
      const loadedRecordsBox = await recordsCard.boundingBox();
      expect(loadedGridBox).not.toBeNull();
      expect(loadedRecordsBox).not.toBeNull();
      expect(Math.abs((loadedGridBox?.height ?? 0) - (loadingGridBox?.height ?? 0))).toBeLessThanOrEqual(1);
      expect(Math.abs((loadedRecordsBox?.y ?? 0) - (loadingRecordsBox?.y ?? 0))).toBeLessThanOrEqual(1);

      const configBox = await page.getByTestId('report-config-card').boundingBox();
      const emptyRecordsBox = await recordsCard.boundingBox();
      expect(configBox).not.toBeNull();
      expect(emptyRecordsBox).not.toBeNull();
      const configBottom = (configBox?.y ?? 0) + (configBox?.height ?? 0);
      const recordsBottom = (emptyRecordsBox?.y ?? 0) + (emptyRecordsBox?.height ?? 0);
      expect(Math.abs(configBottom - recordsBottom)).toBeLessThanOrEqual(2);

      await expectNoPageOverflow(page);
      await page.screenshot({
        path: `/tmp/lingang-t03-reports-${viewport.width}x${viewport.height}.png`,
        fullPage: true,
      });
      assertRuntimeClean();
    });
  }

  test('有导出记录时记录卡按内容自适应', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const assertRuntimeClean = trackRuntimeFailures(page);
    await page.goto('/analysis/reports');
    await expect(page.locator('[data-page-title]')).toHaveText('报表中心');
    const generateButton = page.getByRole('button', { name: '立即导出' });
    await expect(generateButton).toBeEnabled();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      generateButton.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^report-monthly-\d{4}-\d{2}-\d{2}\.json$/);
    const recordsCard = page.getByTestId('report-records-card');
    await expect(recordsCard.locator('[data-page-state="empty"]')).toHaveCount(0);
    await expect(page.getByTestId('report-record-item')).toHaveCount(1);
    await expect(page.getByTestId('report-record-item')).toContainText('近六月治理快照');

    const configBox = await page.getByTestId('report-config-card').boundingBox();
    const recordsBox = await recordsCard.boundingBox();
    expect(configBox).not.toBeNull();
    expect(recordsBox).not.toBeNull();
    expect(recordsBox?.height ?? Number.POSITIVE_INFINITY).toBeLessThan(configBox?.height ?? 0);
    await expectNoPageOverflow(page);
    await page.screenshot({ path: '/tmp/lingang-t03-reports-with-record.png', fullPage: true });
    assertRuntimeClean();
  });
});
