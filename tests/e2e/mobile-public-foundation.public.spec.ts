import { expect, test, type Page } from '@playwright/test';

const backendPort = Number(process.env.BACKEND_PORT ?? '18001');
const apiBaseUrl = `http://127.0.0.1:${backendPort}/api`;
const frontendPort = Number(process.env.FRONTEND_PORT ?? '15174');
const appBaseUrl = `http://127.0.0.1:${frontendPort}`;

function isBusinessMutation(url: string, method: string): boolean {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;
  const pathname = new URL(url).pathname;
  return /^\/api\/(people|houses|visits|conflicts)(?:\/|$)/.test(pathname);
}

async function expectSessionMode(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(async () => {
    const modulePath = '/src/app/services/mobileSandbox/mode.ts';
    const { getActiveMobileSandboxMode } = await import(/* @vite-ignore */ modulePath);
    return (await getActiveMobileSandboxMode()).mode;
  })).toBe('session');
}

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
  });
});

test('public mobile resolves readonly mode before exposing session controls', async ({ page, request }) => {
  const health = await request.get(`${apiBaseUrl}/health`);
  expect(health.status()).toBe(200);
  expect(health.headers()['cache-control']).toBe('no-store');
  await expect(health.json()).resolves.toMatchObject({
    status: 'ok',
    demo_write_mode: 'readonly',
  });

  await page.goto('/mobile');

  await expectSessionMode(page);
  await expect(page.getByText('仅本次浏览会话可见，不写入服务器。', { exact: true })).toHaveCount(0);
  await expect(page.getByText('正在确认当前演示环境的数据模式…', { exact: true })).toHaveCount(0);
});

test('provider-to-mutation gate selects session without a business API request', async ({ page }) => {
  const businessMutations: string[] = [];
  page.on('request', (request) => {
    if (isBusinessMutation(request.url(), request.method())) {
      businessMutations.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });

  await page.goto('/mobile');
  await expectSessionMode(page);

  const result = await page.evaluate(async ({ endpoint }) => {
    const modulePath = '/src/app/services/mobileSandbox/mutation.ts';
    const { executeMobileMutation } = await import(/* @vite-ignore */ modulePath);
    return executeMobileMutation({
      api: async () => {
        await fetch(`${endpoint}/houses`, { method: 'POST', body: '{}' });
        return 'api';
      },
      session: () => 'session',
    });
  }, { endpoint: apiBaseUrl });

  expect(result).toBe('session');
  expect(businessMutations).toEqual([]);
});

test('checking and readonly keep an unmigrated API-only form disabled with zero business requests', async ({ page }) => {
  const businessMutations: string[] = [];
  page.on('request', (request) => {
    if (isBusinessMutation(request.url(), request.method())) {
      businessMutations.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });
  await page.route('**/api/health', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ demo_write_mode: 'readonly' }),
      headers: { 'Cache-Control': 'no-store' },
    });
  });

  await page.goto('/mobile/collect-house');
  const submit = page.getByRole('button', { name: '提交审核' });
  await expect(page.getByText('正在确认当前演示环境的数据模式…', { exact: true })).toBeVisible();
  await expect(submit).toBeDisabled();
  await expectSessionMode(page);
  await expect(page.getByText('仅本次浏览会话可见，不写入服务器。', { exact: true })).toHaveCount(0);
  await expect(submit).toBeDisabled();

  await page.getByPlaceholder('请输入或生成建议编号').fill('TEST-001');
  await page.getByPlaceholder('请输入社区名称').fill('测试社区');
  await page.getByPlaceholder('1号楼').fill('1号楼');
  await submit.evaluate((element: HTMLButtonElement) => element.click());

  expect(businessMutations).toEqual([]);
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem('lingang:mobile-sandbox:v1'))).toBeNull();
  await expect(page.getByText('提交失败，请稍后重试', { exact: true })).toHaveCount(0);
});

test('readonly disables the remaining legacy create entry points until their facades migrate', async ({ page }) => {
  for (const entry of [
    { path: '/mobile/collect-person', button: '提交采集' },
    { path: '/mobile/patrol', button: '提交上报' },
    { path: '/mobile/conflict/new', button: '提交上报' },
  ]) {
    await page.goto(entry.path);
    await expectSessionMode(page);
    await expect(page.getByRole('button', { name: entry.button, exact: true })).toBeDisabled();
  }
});

for (const scenario of [
  { name: 'token mode', status: 200, payload: { demo_write_mode: 'token' } },
  { name: 'invalid mode', status: 200, payload: { demo_write_mode: 'unexpected' } },
  { name: 'health 503', status: 503, payload: { status: 'error' } },
] as const) {
  test(`${scenario.name} keeps mutation controls blocked`, async ({ page }) => {
    await page.route('**/api/health', (route) => route.fulfill({
      status: scenario.status,
      contentType: 'application/json',
      body: JSON.stringify(scenario.payload),
      headers: { 'Cache-Control': 'no-store' },
    }));

    await page.goto('/mobile/collect-house');
    await expect(page.getByRole('alert')).toContainText('提交功能已停用');
    await expect(page.getByRole('button', { name: '提交审核' })).toBeDisabled();
  });
}

test('health network failure keeps mutation controls blocked', async ({ page }) => {
  await page.route('**/api/health', (route) => route.abort('failed'));
  await page.goto('/mobile/collect-house');
  await expect(page.getByRole('alert')).toContainText('提交功能已停用');
  await expect(page.getByRole('button', { name: '提交审核' })).toBeDisabled();
});

test('health timeout keeps mutation controls blocked', async ({ page }) => {
  await page.route('**/api/health', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 5_500));
    await route.abort('timedout').catch(() => undefined);
  });
  await page.goto('/mobile/collect-house');
  await expect(page.getByRole('alert')).toContainText('提交功能已停用', { timeout: 7_000 });
  await expect(page.getByRole('button', { name: '提交审核' })).toBeDisabled();
});

test('public reset removes only the versioned mobile session key', async ({ page }) => {
  await page.goto('/mobile/profile');
  await expectSessionMode(page);
  const reset = page.getByTestId('mobile-session-reset');
  await expect(reset).toBeVisible();

  await page.evaluate(() => {
    window.sessionStorage.setItem('lingang:mobile-sandbox:v1', JSON.stringify({ version: 1, events: [] }));
    window.sessionStorage.setItem('unrelated-session-value', 'preserve-me');
  });
  await reset.click();

  await expect.poll(() => page.evaluate(() => ({
    mobile: window.sessionStorage.getItem('lingang:mobile-sandbox:v1'),
    unrelated: window.sessionStorage.getItem('unrelated-session-value'),
  }))).toEqual({ mobile: null, unrelated: 'preserve-me' });
});

test('corrupt session data fails closed and remains resettable without a success toast', async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('lingang:mobile-sandbox:v1', '{broken-json');
  });
  await page.goto('/mobile/profile');
  await expectSessionMode(page);
  const reset = page.getByTestId('mobile-session-reset');
  await expect(reset).toBeVisible();

  const errorName = await page.evaluate(async () => {
    const modulePath = '/src/app/services/mobileSandbox/store.ts';
    const { readMobileSessionEnvelope } = await import(/* @vite-ignore */ modulePath);
    try {
      readMobileSessionEnvelope();
      return 'none';
    } catch (error) {
      return error instanceof Error ? error.name : 'unknown';
    }
  });
  expect(errorName).toBe('MobileSessionStoreError');
  await expect(page.getByText('已清除本次浏览会话数据', { exact: true })).toHaveCount(0);

  await reset.click();
  await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem('lingang:mobile-sandbox:v1'))).toBeNull();
});

test('a new browser context starts with an independent mobile session', async ({ browser }) => {
  const firstContext = await browser.newContext();
  const firstPage = await firstContext.newPage();
  await firstPage.goto(`${appBaseUrl}/mobile`);
  await firstPage.evaluate(() => {
    window.sessionStorage.setItem('lingang:mobile-sandbox:v1', JSON.stringify({ version: 1, events: [] }));
  });
  await expect.poll(() => firstPage.evaluate(() => window.sessionStorage.getItem('lingang:mobile-sandbox:v1'))).not.toBeNull();
  await firstContext.close();

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  await secondPage.goto(`${appBaseUrl}/mobile`);
  await expect.poll(() => secondPage.evaluate(() => window.sessionStorage.getItem('lingang:mobile-sandbox:v1'))).toBeNull();
  await secondContext.close();
});

test('readonly backend remains the exact defense and does not change server data', async ({ request }) => {
  const before = await request.get(`${apiBaseUrl}/people?limit=1`);
  expect(before.ok()).toBe(true);
  const beforePayload = await before.json() as { total: number };

  const blocked = await request.post(`${apiBaseUrl}/people`, { data: {} });
  expect(blocked.status()).toBe(403);
  await expect(blocked.json()).resolves.toEqual({
    detail: 'Business writes are disabled for this deployment.',
  });

  const after = await request.get(`${apiBaseUrl}/people?limit=1`);
  expect(after.ok()).toBe(true);
  await expect(after.json()).resolves.toMatchObject({ total: beforePayload.total });
});
