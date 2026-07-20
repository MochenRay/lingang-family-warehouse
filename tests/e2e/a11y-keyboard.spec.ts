import { expect, test, type Page } from '@playwright/test';

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

/** 用真实 Tab 键走到目标元素（最多 maxSteps 步），返回是否到达 */
async function tabUntilFocused(page: Page, targetName: string | RegExp, maxSteps = 12) {
  for (let step = 0; step < maxSteps; step++) {
    const reached = await page.evaluate((name) => {
      const active = document.activeElement;
      if (!active) return false;
      const label = active.getAttribute('aria-label') || active.textContent?.trim() || '';
      return label.includes(name);
    }, typeof targetName === 'string' ? targetName : String(targetName));
    if (reached) return true;
    await page.keyboard.press('Tab');
  }
  return false;
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

  // 真实 Tab 路径走到「删除」按钮
  const reached = await tabUntilFocused(page, '删除');
  expect(reached).toBe(true);

  // 当前聚焦的「删除」按钮应有可见 focus 环（outline 或 box-shadow）
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
