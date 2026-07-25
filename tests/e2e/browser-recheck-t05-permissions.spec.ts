import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const LOCAL_PREVIEW_ROLE_KEY = 'homedata.permission-management.local-preview-role';
const PERMISSIONS_STORAGE_KEY = 'homedata.permission-management.permissions';

test.use({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});

async function preparePage(page: Page, currentUserRole: 'admin' | 'viewer', persistedPermissions?: unknown) {
  await page.addInitScript(({ roleKey, permissionsKey, currentUserRole }) => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
    window.localStorage.setItem(roleKey, currentUserRole);
    if (window.sessionStorage.getItem('homedata.permission-management.test-prepared') !== '1') {
      window.localStorage.removeItem(permissionsKey);
      window.sessionStorage.setItem('homedata.permission-management.test-prepared', '1');
    }
  }, { roleKey: LOCAL_PREVIEW_ROLE_KEY, permissionsKey: PERMISSIONS_STORAGE_KEY, currentUserRole });

  if (persistedPermissions !== undefined) {
    await page.addInitScript(({ permissionsKey, persistedPermissions }) => {
      if (window.sessionStorage.getItem('homedata.permission-management.test-persisted-prepared') !== '1') {
        window.localStorage.setItem(permissionsKey, JSON.stringify(persistedPermissions));
        window.sessionStorage.setItem('homedata.permission-management.test-persisted-prepared', '1');
      }
    }, { permissionsKey: PERMISSIONS_STORAGE_KEY, persistedPermissions });
  }
}

test.describe('R55 permission boundary', () => {
  test('public build branch is fail-closed before any local-preview role seam is read', async () => {
    const source = await readFile(resolve(process.cwd(), 'src/app/components/pages/PermissionManagement.tsx'), 'utf8');

    expect(source).not.toContain('homedata.permission-management.current-user-role');
    expect(source).toContain('homedata.permission-management.local-preview-role');
    expect(source).toMatch(/const isLocalPreviewRoleSeam = import\.meta\.env\.DEV && LOCAL_PREVIEW_HOSTS\.has\(window\.location\.hostname\);/);
    expect(source).toMatch(/if \(!isLocalPreviewRoleSeam\) return 'viewer';/);
    expect(source.indexOf("if (!isLocalPreviewRoleSeam) return 'viewer';"))
      .toBeLessThan(source.indexOf('window.localStorage.getItem(LOCAL_PREVIEW_ROLE_KEY)'));
  });

  test('read-only current role has no edit entry and cannot focus permission controls', async ({ page }) => {
    await preparePage(page, 'viewer');
    await page.goto('/settings/permissions');

    await expect(page.getByRole('heading', { name: '权限管理' })).toBeVisible();
    await expect(page.getByText('本地预览角色：访客')).toBeVisible();
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

    await expect(page.getByText('本地预览角色：系统管理员')).toBeVisible();
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
    await expect(editButton).toBeFocused();
    await expect(target).not.toBeChecked();

    await page.keyboard.press('Enter');
    await target.focus();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: '取消' }).focus();
    await page.keyboard.press('Enter');
    await expect(editButton).toBeFocused();
    await expect(target).not.toBeChecked();
  });

  test('hydrate, toggle, save, and reload preserve parent-child permission invariants', async ({ page }) => {
    await preparePage(page, 'admin', {
      district_admin: {
        function: [{
          permissions: [{ view: false, create: true, edit: true, delete: true, export: true }],
        }],
        data: [{ canView: false, canEdit: true }],
      },
    });
    await page.goto('/settings/permissions');

    const view = page.getByRole('checkbox', { name: '区域管理员-人口信息管理-查看' });
    const children = [
      page.getByRole('checkbox', { name: '区域管理员-人口信息管理-新建' }),
      page.getByRole('checkbox', { name: '区域管理员-人口信息管理-编辑' }),
      page.getByRole('checkbox', { name: '区域管理员-人口信息管理-删除' }),
      page.getByRole('checkbox', { name: '区域管理员-人口信息管理-导出' }),
    ];
    await expect(view).not.toBeChecked();
    for (const child of children) await expect(child).not.toBeChecked();

    await page.getByRole('button', { name: '编辑权限' }).click();
    await view.click();
    for (const child of children) await child.click();
    await view.click();
    for (const child of children) {
      await expect(child).not.toBeChecked();
      await expect(child).toBeDisabled();
    }

    await page.getByRole('tab', { name: '数据权限' }).click();
    const areaView = page.getByRole('checkbox', { name: '区域管理员-A区-可查看' });
    const areaEdit = page.getByRole('checkbox', { name: '区域管理员-A区-可编辑' });
    await expect(areaEdit).toBeChecked();
    await areaView.click();
    await expect(areaEdit).not.toBeChecked();
    await expect(areaEdit).toBeDisabled();
    await page.getByRole('button', { name: '保存' }).click();

    const stored = await page.evaluate((storageKey) => JSON.parse(window.localStorage.getItem(storageKey) ?? '{}'), PERMISSIONS_STORAGE_KEY);
    expect(stored.district_admin.function[0].permissions[0]).toEqual({
      view: false,
      create: false,
      edit: false,
      delete: false,
      export: false,
    });
    expect(stored.district_admin.data[1]).toEqual({ canView: false, canEdit: false });

    await page.reload();
    await page.getByRole('tab', { name: '数据权限' }).click();
    await expect(areaView).not.toBeChecked();
    await expect(areaEdit).not.toBeChecked();
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

  test('browser Back dismiss restores the permissions route and accept leaves it', async ({ page }) => {
    await preparePage(page, 'admin');
    await page.goto('/settings/roles');
    await page.getByRole('button', { name: '系统配置' }).click();
    await page.locator('[data-route-id="permission-management"]').click();
    await expect(page).toHaveURL('/settings/permissions');

    await page.getByRole('button', { name: '编辑权限' }).click();
    const target = page.getByRole('checkbox', { name: '区域管理员-人口信息管理-删除' });
    await target.click();
    await expect(target).not.toBeChecked();

    page.once('dialog', async (dialog) => dialog.dismiss());
    await page.goBack();
    await expect(page).toHaveURL('/settings/permissions');
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
    await expect(target).not.toBeChecked();

    page.once('dialog', async (dialog) => dialog.accept());
    await page.goBack();
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
