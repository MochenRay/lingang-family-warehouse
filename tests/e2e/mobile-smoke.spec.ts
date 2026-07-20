import { expect, test } from '@playwright/test';

/**
 * 移动端冒烟（characterization）：锁定现状渲染行为，作为 UI 精修（P4）的回归网。
 * 视口 390×844（iPhone 12/13/14 逻辑分辨率），此视口下 MobileApp 不渲染桌面手机框。
 */

const backendPort = Number(process.env.BACKEND_PORT ?? '8000');
const apiBaseUrl = `http://127.0.0.1:${backendPort}/api`;

test.use({
  viewport: { width: 390, height: 844 },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
    window.localStorage.setItem('mobile_user', '终验网格员');
  });
});

test('mobile home renders workbench shell and quick actions', async ({ page }) => {
  await page.goto('/mobile');

  await expect(page.getByText('家庭数仓', { exact: true })).toBeVisible();
  await expect(page.getByText('快捷功能', { exact: true })).toBeVisible();
});

test('mobile people list renders count and entries from the API', async ({ page }) => {
  await page.goto('/mobile/people');

  await expect(page.getByText(/共 \d+ 条人员/)).toBeVisible();
});

test('mobile person detail renders for a seeded person', async ({ page, request }) => {
  const peopleResponse = await request.get(`${apiBaseUrl}/people?limit=1`);
  expect(peopleResponse.ok()).toBe(true);
  const people = await peopleResponse.json() as { items: Array<{ id: string }> };
  expect(people.items).not.toHaveLength(0);

  await page.goto(`/mobile/person/${people.items[0].id}`);

  await expect(page.getByText('人员详情', { exact: true })).toBeVisible();
});

test('mobile conflict form renders its fields', async ({ page }) => {
  await page.goto('/mobile/conflict/new');

  await expect(page.getByRole('heading', { name: '上报矛盾纠纷' })).toBeVisible();
  await expect(page.getByText('纠纷描述').first()).toBeVisible();
});

test('mobile profile only exposes implemented menu destinations', async ({ page }) => {
  await page.goto('/mobile/profile');

  await expect(page.getByText('终验网格员', { exact: true })).toBeVisible();
  await expect(page.getByText('系统设置', { exact: true })).toHaveCount(0);
});

test('mobile logout uses one confirmation and cancel preserves identity', async ({ page }) => {
  await page.goto('/mobile/profile');

  await page.getByRole('button', { name: '退出登录' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByText('确定要退出登录并返回电脑端吗？', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '取消' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('终验网格员', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('mobile_user'))).toBe('终验网格员');

  await page.getByRole('button', { name: '退出登录' }).click();
  await page.getByRole('button', { name: '退出', exact: true }).click();

  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => window.localStorage.getItem('mobile_user'))).toBeNull();
});
