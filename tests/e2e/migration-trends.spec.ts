import { expect, test, type Page } from '@playwright/test';

const backendPort = Number(process.env.BACKEND_PORT ?? '8000');
const apiBaseUrl = `http://127.0.0.1:${backendPort}/api`;

function statCardValue(page: Page, label: string) {
  return page
    .locator('div.text-sm')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .first()
    .locator('xpath=following-sibling::div[1]');
}

function recentMonthKeys(histories: Array<{ period: string }>): Set<string> {
  const dates = histories.flatMap((history) => history.period.split('~', 2))
    .map((value) => new Date(value.trim().replace(/\//g, '-')))
    .filter((value) => Number.isFinite(value.getTime()));
  const anchor = new Date(Math.max(...dates.map((value) => value.getTime())));
  return new Set(Array.from({ length: 6 }, (_item, index) => {
    const current = new Date(anchor.getFullYear(), anchor.getMonth() - (5 - index), 1);
    return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
  }));
}

test('人口流动页由近六月住房历史驱动，卡片与原始记录守恒且均非零', async ({ page, request }) => {
  const response = await request.get(`${apiBaseUrl}/houses/history-records?limit=2000`);
  expect(response.ok()).toBe(true);
  const histories = await response.json() as Array<{ period: string }>;
  const monthKeys = recentMonthKeys(histories);
  const totalIn = histories.filter((history) => monthKeys.has(history.period.split('~', 1)[0].trim().slice(0, 7))).length;
  const totalOut = histories.filter((history) => {
    const end = history.period.split('~', 2)[1]?.trim();
    return Boolean(end && monthKeys.has(end.slice(0, 7)));
  }).length;

  expect(totalIn).toBeGreaterThan(0);
  expect(totalOut).toBeGreaterThan(0);
  expect(totalIn - totalOut).not.toBe(0);

  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
  await page.goto('/analysis/migration-trends');

  await expect(page.getByRole('heading', { name: '人口流动趋势' })).toBeVisible();
  await expect(statCardValue(page, '近六月总迁入')).toHaveText(String(totalIn));
  await expect(statCardValue(page, '近六月总迁出')).toHaveText(String(totalOut));
  await expect(statCardValue(page, '净流入')).toHaveText(`${totalIn - totalOut > 0 ? '+' : ''}${totalIn - totalOut}`);
  await expect(page.getByText('暂无匹配区县')).toHaveCount(0);
});
