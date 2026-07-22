import { expect, test } from '@playwright/test';

const backendPort = Number(process.env.BACKEND_PORT ?? '8000');
const apiBaseUrl = `http://127.0.0.1:${backendPort}/api`;

test('local API reports a healthy independent database', async ({ request }) => {
  const response = await request.get(`${apiBaseUrl}/health`);

  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({
    status: 'ok',
    backend: 'ready',
    database: 'ok',
  });
});

test('dashboard renders canonical totals from the API', async ({ page, request }) => {
  const dashboardResponse = await request.get(`${apiBaseUrl}/stats/dashboard?range=month`);
  expect(dashboardResponse.ok()).toBe(true);
  const dashboard = await dashboardResponse.json() as {
    totalPopulation: number;
    totalHouses: number;
  };

  expect(dashboard.totalPopulation).toBeGreaterThan(500);
  expect(dashboard.totalHouses).toBeGreaterThan(500);

  await page.goto('/');
  await page.evaluate(() => window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1'));
  await page.reload();

  await expect(page.getByRole('heading', { name: '综合统计驾驶舱' })).toBeVisible();
  await expect(page.getByText(dashboard.totalPopulation.toLocaleString('zh-CN'), { exact: true }).first()).toBeVisible();
  await expect(page.getByText(dashboard.totalHouses.toLocaleString('zh-CN'), { exact: true }).first()).toBeVisible();
});

test('legacy publish-notice URL is replaced by the dashboard', async ({ page }) => {
  // P5-T5：PublishNotice 整页下线后，旧 URL 不再是已知路径，
  // App 挂载时 replaceState 回落到默认路由（驾驶舱），而非白屏或 404。
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
  await page.goto('/grid/notices/publish');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: '综合统计驾驶舱' })).toBeVisible();
});

test('relationship ledger loads the full read model within ten business requests', async ({ page }) => {
  const businessRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() === 'GET' && url.pathname.startsWith('/api/')) {
      businessRequests.push(url.pathname);
    }
  });

  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
  await page.goto('/relationship');

  await expect(page.getByRole('heading', { name: '人房关系管理' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /现居关系 \([1-9]\d*\)/ })).toBeVisible();

  expect(businessRequests.length).toBeLessThanOrEqual(10);
  expect(businessRequests.filter((path) => path.endsWith('/houses/history-records'))).toHaveLength(1);
  expect(businessRequests.some((path) => /\/houses\/[^/]+\/history$/.test(path))).toBe(false);
});

test('local preview allows create, update, and delete without touching cloud data', async ({ request }) => {
  const peopleResponse = await request.get(`${apiBaseUrl}/people?limit=1`);
  expect(peopleResponse.ok()).toBe(true);
  const people = await peopleResponse.json() as {
    items: Array<{ gridId: string }>;
  };
  expect(people.items).not.toHaveLength(0);

  const marker = `${Date.now()}-${test.info().parallelIndex}`;
  const createResponse = await request.post(`${apiBaseUrl}/people`, {
    data: {
      gridId: people.items[0].gridId,
      name: `Phase13 Smoke ${marker}`,
      idCard: `E2E-${marker}`,
      gender: '男',
      age: 30,
      address: '仅用于本地自动化验证',
      type: '户籍',
      tags: ['自动化验证'],
      risk: '低',
      updatedAt: '2026-07-11',
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json() as { id: string; name: string };

  try {
    const updateResponse = await request.patch(`${apiBaseUrl}/people/${created.id}`, {
      data: { name: `${created.name} Updated` },
    });
    expect(updateResponse.ok()).toBe(true);
    await expect(updateResponse.json()).resolves.toMatchObject({
      id: created.id,
      name: `${created.name} Updated`,
    });
  } finally {
    const deleteResponse = await request.delete(`${apiBaseUrl}/people/${created.id}`);
    expect(deleteResponse.status()).toBe(204);
  }

  const afterDelete = await request.get(`${apiBaseUrl}/people/${created.id}`);
  expect(afterDelete.status()).toBe(404);
});
