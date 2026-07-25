import { expect, test, type Page } from '@playwright/test';

const CURRENT_USER_ROLE_KEY = 'homedata.permission-management.current-user-role';
const PERMISSIONS_STORAGE_KEY = 'homedata.permission-management.permissions';

test.use({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});

async function preparePage(page: Page, currentUserRole: 'admin' | 'viewer') {
  await page.addInitScript(({ roleKey, permissionsKey, currentUserRole }) => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
    window.localStorage.setItem(roleKey, currentUserRole);
    if (window.sessionStorage.getItem('homedata.permission-management.test-prepared') !== '1') {
      window.localStorage.removeItem(permissionsKey);
      window.sessionStorage.setItem('homedata.permission-management.test-prepared', '1');
    }
  }, { roleKey: CURRENT_USER_ROLE_KEY, permissionsKey: PERMISSIONS_STORAGE_KEY, currentUserRole });
}

test.describe('R55 permission boundary', () => {
  test('read-only current role has no edit entry and cannot focus permission controls', async ({ page }) => {
    await preparePage(page, 'viewer');
    await page.goto('/settings/permissions');

    await expect(page.getByRole('heading', { name: '权限管理' })).toBeVisible();
    await expect(page.getByText('当前登录角色：访客')).toBeVisible();
    await expect(page.getByRole('button', { name: '编辑权限' })).toHaveCount(0);

    const checkboxes = page.getByRole('checkbox');
    await expect(checkboxes.first()).toBeDisabled();
    expect(await checkboxes.count()).toBeGreaterThan(0);
    expect(await checkboxes.evaluateAll((nodes) => nodes.every((node) => (node as HTMLButtonElement).disabled))).toBe(true);
    await expect(page.locator('.page-enter')).toHaveCSS('opacity', '1');
    await page.screenshot({
      path: '/tmp/lingang-browser-recheck-t05-permissions/readonly-viewer.png',
      fullPage: true,
    });

    for (let step = 0; step < 24; step += 1) {
      await page.keyboard.press('Tab');
      const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'));
      expect(focusedRole).not.toBe('checkbox');
    }
  });

  test('editable current role saves persistently and Escape cancels to the entry snapshot', async ({ page }) => {
    await preparePage(page, 'admin');
    await page.goto('/settings/permissions');

    const editButton = page.getByRole('button', { name: '编辑权限' });
    const target = page.getByRole('checkbox', { name: '区域管理员-人口信息管理-删除' });

    await expect(page.getByText('当前登录角色：系统管理员')).toBeVisible();
    await expect(editButton).toBeVisible();
    await expect(target).toBeDisabled();
    await editButton.focus();
    await expect(editButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
    await expect(target).toBeEnabled();
    await target.focus();
    await expect(target).toBeFocused();
    await page.keyboard.press('Space');
    await expect(target).not.toBeChecked();
    await page.locator('main').evaluate((element) => { element.scrollTop = 0; });
    await page.screenshot({
      path: '/tmp/lingang-browser-recheck-t05-permissions/edit-admin.png',
      fullPage: true,
    });
    await page.getByRole('button', { name: '保存' }).click();

    await expect(editButton).toBeVisible();
    await expect(target).toBeDisabled();
    await page.reload();
    await expect(target).not.toBeChecked();

    await editButton.focus();
    await page.keyboard.press('Enter');
    await target.focus();
    await page.keyboard.press('Space');
    await expect(target).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(editButton).toBeVisible();
    await expect(target).not.toBeChecked();
  });

  test('unsaved changes require confirmation before role or route changes', async ({ page }) => {
    await preparePage(page, 'admin');
    await page.goto('/settings/permissions');

    await page.getByRole('button', { name: '编辑权限' }).click();
    const target = page.getByRole('checkbox', { name: '区域管理员-人口信息管理-删除' });
    await target.click();

    page.once('dialog', async (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: '数据分析员', exact: true }).click();
    await expect(page.getByText('当前角色：区域管理员')).toBeVisible();
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();

    page.once('dialog', async (dialog) => dialog.accept());
    await page.getByRole('button', { name: '数据分析员', exact: true }).click();
    await expect(page.getByText('当前角色：数据分析员')).toBeVisible();
    await expect(page.getByRole('button', { name: '编辑权限' })).toBeVisible();

    await page.getByRole('button', { name: '编辑权限' }).click();
    const analystTarget = page.getByRole('checkbox', { name: '数据分析员-人口信息管理-删除' });
    await analystTarget.click();
    await page.getByRole('button', { name: '系统配置' }).click();

    page.once('dialog', async (dialog) => dialog.dismiss());
    await page.locator('[data-route-id="role-management"]').click();
    await expect(page).toHaveURL('/settings/permissions');

    page.once('dialog', async (dialog) => dialog.accept());
    await page.locator('[data-route-id="role-management"]').click();
    await expect(page).toHaveURL('/settings/roles');
  });

  test('three desktop viewports have no document overflow or browser errors', async ({ browser }) => {
    const viewports = [
      { width: 1507, height: 1324, label: '1507x1324' },
      { width: 1440, height: 900, label: '1440x900' },
      { width: 1024, height: 768, label: '1024x768' },
    ];

    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));

      await preparePage(page, 'admin');
      await page.goto('/settings/permissions');
      await expect(page.getByRole('heading', { name: '权限管理' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
      await page.screenshot({
        path: `/tmp/lingang-browser-recheck-t05-permissions/${viewport.label}.png`,
        fullPage: true,
      });

      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests).toEqual([]);
      await context.close();
    }
  });
});
