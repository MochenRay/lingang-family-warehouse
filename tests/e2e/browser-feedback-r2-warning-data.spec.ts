import { expect, test } from '@playwright/test';

test('预警真实种子的热度与等级遵循统一阈值且三档均有样本', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
  await page.setViewportSize({ width: 1507, height: 1324 });
  await page.goto('/analysis/warning-map');
  await expect(page.locator('[data-page-title]')).toHaveText('预警热区');
  await expect(page.getByTestId('zone-board')).toHaveCount(12);

  const boards = await page.getByTestId('zone-board').evaluateAll((elements) => elements.map((element) => {
    const text = element.textContent ?? '';
    return {
      text,
      level: text.match(/严重|中等|轻微/)?.[0] ?? '',
      overdue: Number(text.match(/超期待办\s*(\d+)\s*条/)?.[1] ?? 0),
      heat: Number(text.match(/热度分\s*([\d.]+)/)?.[1] ?? 0),
    };
  }));

  expect(new Set(boards.map((board) => board.heat)).size).toBeGreaterThanOrEqual(5);
  expect(boards.every((board) => board.heat >= 0 && board.heat <= 100)).toBe(true);
  const boardLevelCounts = boards.reduce<Record<string, number>>((counts, board) => ({
    ...counts,
    [board.level]: (counts[board.level] ?? 0) + 1,
  }), {});
  expect(boardLevelCounts['严重'] ?? 0).toBeGreaterThanOrEqual(2);
  expect(boardLevelCounts['中等'] ?? 0).toBeGreaterThanOrEqual(2);
  expect(boardLevelCounts['轻微'] ?? 0).toBeGreaterThanOrEqual(2);
  for (const board of boards) {
    if (board.overdue >= 2) expect(board.level, board.text).toBe('严重');
    if (board.overdue === 1) expect(['严重', '中等'], board.text).toContain(board.level);
  }

  const warningLevels = await page.getByTestId('warning-list-item').evaluateAll((elements) =>
    elements.map((element) => element.textContent?.match(/严重|中等|轻微/)?.[0] ?? ''),
  );
  expect(new Set(warningLevels)).toEqual(new Set(['严重', '中等', '轻微']));
  await page.screenshot({
    path: '/tmp/lingang-browser-r2/screenshots/C1-warning-balanced-1507x1324.png',
    fullPage: true,
  });

  // 用真实平衡种子复核 K5 的 2fr/1fr 桌面布局，避免只依赖确定性 mock 截图。
  await page.setViewportSize({ width: 1608, height: 1324 });
  const firstGroup = page.getByTestId('zone-group').first();
  const rail = page.getByTestId('warning-rail-scroll');
  const railCard = rail.locator('xpath=..');
  await expect(rail).toBeVisible();
  await expect.poll(() => railCard.evaluate((element) => getComputedStyle(element).position)).toBe('sticky');
  const groupBox = (await firstGroup.boundingBox())!;
  const railBox = (await rail.boundingBox())!;
  expect(railBox.x).toBeGreaterThan(groupBox.x + groupBox.width / 2);
  expect(railBox.width).toBeGreaterThanOrEqual(320);
  const firstMetric = page.getByTestId('warning-list-metric').first();
  await expect(firstMetric).toHaveCSS('white-space', 'nowrap');
  expect((await firstMetric.boundingBox())!.height).toBeLessThanOrEqual(48);
  await page.screenshot({
    path: '/tmp/lingang-browser-r2/screenshots/C1-K5-warning-balanced-1608x1324.png',
  });
});
