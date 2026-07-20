import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * T1b 键盘可达性断言：真实 Tab 路径、Dialog 焦点进入、Esc 关闭、可见 focus 环。
 */

test.use({
  viewport: { width: 1440, height: 900 },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
});

/** 用真实 Tab 键走到目标按钮（返回步数；-1 表示未到达）。初始焦点不在目标上，故返回值必须 > 0。 */
async function tabUntilFocused(dialog: Locator, page: Page, targetName: string, maxSteps = 12) {
  const target = dialog.getByRole('button', { name: targetName, exact: true });
  for (let step = 0; step <= maxSteps; step++) {
    if (await target.evaluate((el) => document.activeElement === el).catch(() => false)) {
      return step;
    }
    await page.keyboard.press('Tab');
  }
  return -1;
}

test('ConfirmDialog 打开后焦点进入弹窗，Tab 可达删除按钮且 focus 环可见', async ({ page }) => {
  await page.goto('/grid/notices');
  await expect(page.getByRole('heading', { name: '公告管理' })).toBeVisible();

  await page.getByRole('button', { name: '删除公告' }).first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('确定要删除这条公告吗？')).toBeVisible();

  // 焦点初始应在弹窗内
  const focusInside = await page.evaluate(() => {
    const active = document.activeElement;
    const dlg = document.querySelector('[role="dialog"]');
    return dlg !== null && active !== null && dlg.contains(active);
  });
  expect(focusInside).toBe(true);

  // 真实 Tab 路径走到「删除」按钮；步数必须 > 0（证明键盘路径真实可走，而非初始巧合命中）
  const steps = await tabUntilFocused(dialog, page, '删除');
  expect(steps).toBeGreaterThan(0);

  // 聚焦的「删除」按钮应有可见 focus 环（outline 或 box-shadow）
  await expect(dialog.getByRole('button', { name: '删除', exact: true })).toBeFocused();
  const hasVisibleRing = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return false;
    const style = getComputedStyle(active);
    const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
    const hasRing = style.boxShadow !== 'none' && style.boxShadow !== '';
    return hasOutline || hasRing;
  });
  expect(hasVisibleRing).toBe(true);

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
