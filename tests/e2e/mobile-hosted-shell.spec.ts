import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
    window.localStorage.setItem('mobile_user', '终验网格员');
  });
});

test('desktop host keeps the mobile dialog and focus inside 375x812', async ({ page }) => {
  await page.goto('/mobile/profile');

  const viewport = page.locator('#mobile-viewport');
  await expect(viewport).toBeVisible();
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  expect(viewportBox!.width).toBeCloseTo(375, 0);
  expect(viewportBox!.height).toBeCloseTo(812, 0);

  const logout = page.getByRole('button', { name: '退出登录' });
  await logout.click();

  const dialog = viewport.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((element) => element.parentElement?.id)).toBe('mobile-viewport');
  const overlay = viewport.locator('[data-state="open"].fixed.inset-0');
  await expect(overlay).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  const overlayBox = await overlay.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(overlayBox).not.toBeNull();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(viewportBox!.x);
  expect(dialogBox!.y).toBeGreaterThanOrEqual(viewportBox!.y);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewportBox!.x + viewportBox!.width);
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(viewportBox!.y + viewportBox!.height);
  expect(overlayBox!.x).toBeGreaterThanOrEqual(viewportBox!.x);
  expect(overlayBox!.y).toBeGreaterThanOrEqual(viewportBox!.y);
  expect(overlayBox!.x + overlayBox!.width).toBeLessThanOrEqual(viewportBox!.x + viewportBox!.width);
  expect(overlayBox!.y + overlayBox!.height).toBeLessThanOrEqual(viewportBox!.y + viewportBox!.height);

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(logout).toBeFocused();
});

test('desktop dialogs keep the document body as their default portal host', async ({ page }) => {
  await page.goto('/grid/notices');
  await expect(page.getByRole('heading', { name: '公告管理' })).toBeVisible();

  await page.getByRole('button', { name: '删除公告' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((element) => element.parentElement?.tagName)).toBe('BODY');
});

test('enabled mode uses only the API branch and never creates sandbox data', async ({ page }) => {
  await page.goto('/mobile');
  await expect(page.getByText('仅本次浏览会话可见，不写入服务器。', { exact: true })).toHaveCount(0);

  await expect.poll(() => page.evaluate(async () => {
    const modulePath = '/src/app/services/mobileSandbox/mode.ts';
    const { getActiveMobileSandboxMode } = await import(/* @vite-ignore */ modulePath);
    return (await getActiveMobileSandboxMode()).mode;
  })).toBe('api');

  const result = await page.evaluate(async () => {
    const modulePath = '/src/app/services/mobileSandbox/mutation.ts';
    const { executeMobileMutation } = await import(/* @vite-ignore */ modulePath);
    return executeMobileMutation({
      api: () => 'api',
      session: () => {
        window.sessionStorage.setItem('lingang:mobile-sandbox:v1', 'unexpected');
        return 'session';
      },
    });
  });

  expect(result).toBe('api');
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem('lingang:mobile-sandbox:v1'))).toBeNull();
});

test('browser back and forward preserve the task source stack for person detail', async ({ page }) => {
  await page.goto('/mobile/tasks?mode=all');
  const taskCard = page.getByTestId('task-card-pending').first();
  await expect(taskCard).toBeVisible({ timeout: 20_000 });
  await taskCard.click();
  await expect(page.getByText('任务详情', { exact: true })).toBeVisible({ timeout: 20_000 });
  const taskUrl = page.url();

  const relatedPerson = page.locator('button.rounded-full:not([aria-label])').first();
  await expect(relatedPerson).toBeVisible();
  await relatedPerson.click();
  await expect(page).toHaveURL(/\/mobile\/person\/[^/?]+$/);
  await expect(page.getByText('人员详情', { exact: true })).toBeVisible({ timeout: 20_000 });
  const personUrl = page.url();

  await page.goBack();
  await expect(page).toHaveURL(taskUrl);
  await expect(page.getByText('任务详情', { exact: true })).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(personUrl);
  await expect(page.getByText('人员详情', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '返回' }).click();
  await expect(page).toHaveURL(taskUrl);
  await expect(page.getByText('任务详情', { exact: true })).toBeVisible();
});
