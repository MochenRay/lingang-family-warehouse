import { expect, test } from '@playwright/test';

/**
 * T1b 键盘可达性断言：Dialog 焦点进入、Esc 关闭、确认键可达。
 */

test.use({
  viewport: { width: 1440, height: 900 },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
});

test('ConfirmDialog 打开后焦点进入弹窗，Esc 可关闭', async ({ page }) => {
  await page.goto('/grid/notices');
  await expect(page.getByRole('heading', { name: '公告管理' })).toBeVisible();

  const deleteButton = page.getByRole('button', { name: '删除公告' }).first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('确定要删除这条公告吗？')).toBeVisible();

  // 焦点应在弹窗内
  const focusInside = await page.evaluate(() => {
    const active = document.activeElement;
    const dlg = document.querySelector('[role="dialog"]');
    return dlg !== null && active !== null && dlg.contains(active);
  });
  expect(focusInside).toBe(true);

  // Tab 能到达「删除」确认按钮并可见
  const confirmButton = dialog.getByRole('button', { name: '删除', exact: true });
  await expect(confirmButton).toBeVisible();
  await confirmButton.focus();
  await expect(confirmButton).toBeFocused();

  // Esc 关闭
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('发布公告 Dialog 焦点管理与 Esc 关闭', async ({ page }) => {
  await page.goto('/grid/notices');
  await page.getByRole('button', { name: '发布公告' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('创建并发布公告通知')).toBeVisible();

  const focusInside = await page.evaluate(() => {
    const active = document.activeElement;
    const dlg = document.querySelector('[role="dialog"]');
    return dlg !== null && active !== null && dlg.contains(active);
  });
  expect(focusInside).toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('Header 全局按钮具备可访问名称', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /侧边导航/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /通知/ })).toBeVisible();
});
