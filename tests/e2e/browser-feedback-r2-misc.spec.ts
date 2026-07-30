import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('批量导入从历史记录直接下载错误报告，不再打开中间详情弹窗', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
  await page.goto('/batch-import');
  await page.getByRole('button', { name: '导入历史', exact: true }).click();

  const historyDialog = page.getByRole('dialog');
  await expect(historyDialog.getByRole('heading', { name: '导入历史记录' })).toBeVisible();
  await expect(historyDialog.getByText('查看错误', { exact: true })).toHaveCount(0);
  const downloadButtons = historyDialog.getByRole('button', { name: '下载错误报告' });
  await expect(downloadButtons).toHaveCount(2);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    downloadButtons.first().click(),
  ]);
  expect(download.suggestedFilename()).toBe('导入错误报告_1.csv');
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const report = readFileSync(downloadPath!, 'utf-8');
  expect(report).toContain('行号,字段,错误值,错误原因');
  expect(report).toContain('身份证号格式错误，应为18位');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: /错误详情|错误明细/ })).toHaveCount(0);
});
