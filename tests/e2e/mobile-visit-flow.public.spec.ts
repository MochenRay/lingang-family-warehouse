import { expect, test, type APIRequestContext, type Browser, type Locator, type Page } from '@playwright/test';

const backendPort = Number(process.env.BACKEND_PORT ?? '18001');
const apiBaseUrl = `http://127.0.0.1:${backendPort}/api`;
const frontendPort = Number(process.env.FRONTEND_PORT ?? '15174');
const appBaseUrl = `http://127.0.0.1:${frontendPort}`;
const mobileSessionKey = 'lingang:mobile-sandbox:v1';

interface PendingPersonTask {
  id: string;
  title: string;
  sourceKind: 'person';
  status: 'pending';
  personId: string;
}

interface PendingConflictTask {
  id: string;
  title: string;
  sourceKind: 'conflict';
  status: 'pending';
  conflictId: string;
}

interface SeedPerson {
  id: string;
  gridId: string;
  name: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface VisitRecord {
  id: string;
  targetId: string;
  targetType: 'person' | 'house';
  gridId: string;
  visitorName: string;
  date: string;
  content: string;
  images?: string[];
  tags?: string[];
}

interface VisitsResponse {
  items: VisitRecord[];
  total: number;
}

interface PersonWithRelations extends SeedPerson {
  familyRelations?: Array<{ relatedPersonId: string; relationType: string }>;
}

interface AiChatRequest {
  agent_type?: string;
  kind?: string;
  message?: string;
  context_id?: string;
}

interface MobileSessionEvent {
  id: string;
  entity: string;
  action: string;
  targetId: string;
  tempId?: string;
  payload: unknown;
  createdAt: string;
}

interface MobileSessionEnvelope {
  version: number;
  events: MobileSessionEvent[];
}

function isBusinessMutation(url: string, method: string): boolean {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;
  const pathname = new URL(url).pathname;
  return pathname.startsWith('/api/') && !pathname.startsWith('/api/ai/');
}

async function getPendingPersonTask(
  request: APIRequestContext,
): Promise<{ task: PendingPersonTask; person: SeedPerson }> {
  const projectionResponse = await request.get(`${apiBaseUrl}/task-rules/projection`);
  expect(projectionResponse.ok()).toBe(true);
  const projection = await projectionResponse.json() as { pending: Array<Partial<PendingPersonTask>> };
  const candidate = projection.pending.find((item) => (
    item.status === 'pending'
    && item.sourceKind === 'person'
    && typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.personId === 'string'
  ));
  expect(candidate, 'the seeded backend must expose a real pending person task').toBeTruthy();

  const task = candidate as PendingPersonTask;
  const personResponse = await request.get(`${apiBaseUrl}/people/${encodeURIComponent(task.personId)}`);
  expect(personResponse.ok()).toBe(true);
  const person = await personResponse.json() as SeedPerson;
  expect(person.id).toBe(task.personId);
  expect(person.gridId).toBeTruthy();

  return { task, person };
}

async function getPendingConflictTask(request: APIRequestContext): Promise<PendingConflictTask> {
  const projectionResponse = await request.get(`${apiBaseUrl}/task-rules/projection`);
  expect(projectionResponse.ok()).toBe(true);
  const projection = await projectionResponse.json() as { pending: Array<Partial<PendingConflictTask>> };
  const candidate = projection.pending.find((item) => (
    item.status === 'pending'
    && item.sourceKind === 'conflict'
    && typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.conflictId === 'string'
  ));
  expect(candidate, 'the seeded backend must expose a real pending conflict task').toBeTruthy();
  return candidate as PendingConflictTask;
}

async function getPersonWithRelations(request: APIRequestContext): Promise<PersonWithRelations> {
  const response = await request.get(`${apiBaseUrl}/people?limit=500`);
  expect(response.ok()).toBe(true);
  const payload = await response.json() as { items: PersonWithRelations[] };
  const candidate = payload.items.find((person) => (person.familyRelations?.length ?? 0) > 0);
  expect(candidate, 'the seeded backend must expose a person with family relations').toBeTruthy();
  return candidate!;
}

async function expectMinimumTouchTarget(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

async function openVisitFormFromTask(
  page: Page,
  task: PendingPersonTask,
  person: SeedPerson,
): Promise<void> {
  await page.goto('/mobile/tasks?mode=all');

  const taskCard = page.getByTestId('task-card-pending').filter({ hasText: task.title }).first();
  await expect(taskCard).toBeVisible({ timeout: 20_000 });
  await taskCard.click();
  await expect(page.getByText('任务详情', { exact: true })).toBeVisible({ timeout: 20_000 });

  const personLink = page.getByTestId('task-person-link');
  await expect(personLink).toBeVisible();
  await personLink.click();
  await expect(page).toHaveURL(new RegExp(`/mobile/person/${person.id}$`));
  await expect(page.getByText(person.name, { exact: true }).first()).toBeVisible();

  await page.getByTestId('person-add-visit').click();
  await expect(page).toHaveURL(new RegExp(`/mobile/visit-form/${person.id}$`));
  await expect(page.getByTestId('visit-purpose')).toBeVisible();
}

async function generateLiveVisitOutline(
  page: Page,
  personId: string,
  outlineMarker: string,
): Promise<void> {
  const requests: AiChatRequest[] = [];
  await page.route('**/api/ai/chat', async (route) => {
    expect(route.request().method()).toBe('POST');
    requests.push(route.request().postDataJSON() as AiChatRequest);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'live',
        agent_type: 'assistant',
        kind: 'writing',
        content: `对象化走访提纲 ${outlineMarker}`,
        summary: '已基于当前居民的安全上下文生成走访提纲。',
        model: 'gemini-3.6-flash',
        provider: 'gemini',
        context_applied: true,
        used_fallback_model: false,
      }),
    });
  });

  await page.getByTestId('visit-ai-generate').click();
  await expect.poll(() => requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    agent_type: 'assistant',
    kind: 'writing',
    context_id: personId,
  });
  await expect(page.getByTestId('visit-ai-status')).toContainText(/Gemini/i);
  await expect(page.getByTestId('visit-ai-status')).toContainText(/live/i);
  await expect(page.getByTestId('visit-ai-result')).toContainText(outlineMarker);
}

async function expectSubmittedFormWasReplaced(
  page: Page,
  personId: string,
  submittedFormUrl: string,
): Promise<void> {
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/mobile/person/${personId}$`));
  expect(page.url()).not.toBe(submittedFormUrl);
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/mobile/person/${personId}$`));
  expect(page.url()).not.toBe(submittedFormUrl);
}

async function readPerson(
  request: APIRequestContext,
  personId: string,
): Promise<SeedPerson> {
  const response = await request.get(`${apiBaseUrl}/people/${encodeURIComponent(personId)}`);
  expect(response.ok()).toBe(true);
  return response.json() as Promise<SeedPerson>;
}

async function readPersonVisits(
  request: APIRequestContext,
  personId: string,
): Promise<VisitsResponse> {
  const response = await request.get(
    `${apiBaseUrl}/visits?targetId=${encodeURIComponent(personId)}&targetType=person&limit=500`,
  );
  expect(response.ok()).toBe(true);
  return response.json() as Promise<VisitsResponse>;
}

async function expectMarkerAbsentInNewContext(
  browser: Browser,
  personId: string,
  marker: string,
): Promise<string[]> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
  });
  const page = await context.newPage();
  const businessMutations: string[] = [];
  page.on('request', (apiRequest) => {
    if (isBusinessMutation(apiRequest.url(), apiRequest.method())) {
      businessMutations.push(`${apiRequest.method()} ${new URL(apiRequest.url()).pathname}`);
    }
  });
  try {
    await page.goto(`${appBaseUrl}/mobile/person/${personId}`);
    await expect(page.getByTestId('person-visit-history')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('person-visit-history').click();
    await expect(page.getByText(marker, { exact: false })).toHaveCount(0);
    expect(await page.evaluate((key) => window.sessionStorage.getItem(key), mobileSessionKey)).toBeNull();
  } finally {
    await context.close();
  }
  return businessMutations;
}

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ storageKey }) => {
    window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
    window.localStorage.setItem('mobile_user', 'T1a 验收网格员');

    const writes: string[] = [];
    (window as unknown as { __t1aMobileSessionWrites: string[] }).__t1aMobileSessionWrites = writes;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string): void {
      if (this === window.sessionStorage && key === storageKey) {
        writes.push(value);
      }
      originalSetItem.call(this, key, value);
    };
  }, { storageKey: mobileSessionKey });
});

test('public task view controls expose their selected state', async ({ page }) => {
  await page.goto('/mobile/tasks?mode=today');
  await expect(page.getByTestId('task-card-pending').first()).toBeVisible({ timeout: 20_000 });

  const today = page.getByRole('button', { name: '今日待办', exact: true });
  const month = page.getByRole('button', { name: '本月工作', exact: true });
  const all = page.getByRole('button', { name: '全部清单', exact: true });
  await expect(today).toHaveAttribute('aria-pressed', 'true');
  await expect(month).toHaveAttribute('aria-pressed', 'false');
  await expect(all).toHaveAttribute('aria-pressed', 'false');

  await month.click();
  await expect(today).toHaveAttribute('aria-pressed', 'false');
  await expect(month).toHaveAttribute('aria-pressed', 'true');
  await expect(all).toHaveAttribute('aria-pressed', 'false');
});

test('public K01 exceptional and expanded states keep 44px touch targets', async ({ page, request }) => {
  test.setTimeout(60_000);
  const notFoundRoutes = [
    { path: '/mobile/tasks/no-such-task', text: '未找到任务详情' },
    { path: '/mobile/person/no-such-person', text: '未找到该人员信息' },
    { path: '/mobile/person/no-such-person/edit', text: '未找到该人员信息' },
    { path: '/mobile/visit-form/no-such-person', text: '未找到人员信息' },
  ];

  for (const route of notFoundRoutes) {
    await page.goto(route.path);
    await expect(page.getByText(route.text, { exact: true })).toBeVisible({ timeout: 20_000 });
    await expectMinimumTouchTarget(page.getByRole('button', { name: '返回', exact: true }));
  }

  const relationPerson = await getPersonWithRelations(request);
  await page.goto(`/mobile/person/${relationPerson.id}`);
  await expect(page.getByText('人员详情', { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('tab', { name: '关系图谱', exact: true }).click();
  const viewButtons = page.getByRole('button', { name: '查看', exact: true });
  await expect(viewButtons.first()).toBeVisible();
  for (const button of await viewButtons.all()) {
    await expectMinimumTouchTarget(button);
  }

  await page.goto(`/mobile/person/${relationPerson.id}/edit`);
  await expect(page.getByText('编辑人员信息', { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: '详细信息', exact: true }).click();
  await page.getByRole('button', { name: '健康档案', exact: true }).click();
  const checkboxes = page.getByRole('checkbox');
  await expect(checkboxes).toHaveCount(6);
  for (const checkbox of await checkboxes.all()) {
    await expectMinimumTouchTarget(checkbox);
  }
});

test('public conflict task keeps legacy completion disabled and emits zero business mutations', async ({ page, request }) => {
  const task = await getPendingConflictTask(request);
  const businessMutations: string[] = [];
  page.on('request', (apiRequest) => {
    if (isBusinessMutation(apiRequest.url(), apiRequest.method())) {
      businessMutations.push(`${apiRequest.method()} ${new URL(apiRequest.url()).pathname}`);
    }
  });

  await page.goto(`/mobile/tasks/${task.id}`);
  await expect(page.getByText('任务详情', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('仅本次浏览会话可见，不写入服务器。', { exact: true })).toBeVisible();
  await page.getByPlaceholder('请输入本次处理结果、发现的问题或后续安排...').fill('public readonly gate');

  const submit = page.getByRole('button', { name: '记录处置并完成', exact: true });
  await expect(submit).toBeDisabled();
  expect(businessMutations).toEqual([]);
  await expect.poll(() => page.evaluate((key) => window.sessionStorage.getItem(key), mobileSessionKey)).toBeNull();
});

test('public session failure is visible and cannot create fake visit history', async ({ page, request }) => {
  const health = await request.get(`${apiBaseUrl}/health`);
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toMatchObject({ status: 'ok', demo_write_mode: 'readonly' });

  const { task, person } = await getPendingPersonTask(request);
  const marker = `T1A-PUBLIC-FAIL-${Date.now()}`;
  const businessMutations: string[] = [];
  page.on('request', (apiRequest) => {
    if (isBusinessMutation(apiRequest.url(), apiRequest.method())) {
      businessMutations.push(`${apiRequest.method()} ${new URL(apiRequest.url()).pathname}`);
    }
  });

  await openVisitFormFromTask(page, task, person);
  await page.getByTestId('visit-purpose').fill(marker);
  await page.evaluate((storageKey) => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string): void {
      if (this === window.sessionStorage && key === storageKey) {
        throw new DOMException('forced T1a session write failure', 'QuotaExceededError');
      }
      originalSetItem.call(this, key, value);
    };
  }, mobileSessionKey);

  await expect(page.getByTestId('visit-submit')).toBeEnabled();
  await page.getByTestId('visit-submit').click();

  await expect(page.getByText('走访记录保存失败，请稍后重试', { exact: true })).toBeVisible();
  await expect(page.getByText('走访记录已保存', { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/mobile/visit-form/${person.id}$`));
  await expect.poll(() => page.evaluate((key) => window.sessionStorage.getItem(key), mobileSessionKey)).toBeNull();

  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/mobile/person/${person.id}$`));
  await page.getByTestId('person-visit-history').click();
  await expect(page.getByText(marker, { exact: false })).toHaveCount(0);
  expect(businessMutations).toEqual([]);
});

test('public completes the real visit chain in one isolated session transaction', async ({ page, request, browser }) => {
  const health = await request.get(`${apiBaseUrl}/health`);
  expect(health.status()).toBe(200);
  expect(health.headers()['cache-control']).toBe('no-store');
  await expect(health.json()).resolves.toMatchObject({ status: 'ok', demo_write_mode: 'readonly' });

  const { task, person } = await getPendingPersonTask(request);
  const beforePerson = await readPerson(request, person.id);
  const beforeVisits = await readPersonVisits(request, person.id);
  const marker = `T1A-PUBLIC-${Date.now()}`;
  const outlineMarker = `${marker}-AI`;
  const businessMutations: string[] = [];
  page.on('request', (apiRequest) => {
    if (isBusinessMutation(apiRequest.url(), apiRequest.method())) {
      businessMutations.push(`${apiRequest.method()} ${new URL(apiRequest.url()).pathname}`);
    }
  });

  await openVisitFormFromTask(page, task, person);
  await generateLiveVisitOutline(page, person.id, outlineMarker);
  await page.getByTestId('visit-purpose').fill(marker);
  const submittedFormUrl = page.url();
  await page.evaluate(() => {
    (window as unknown as { __t1aMobileSessionWrites: string[] }).__t1aMobileSessionWrites.length = 0;
  });
  await expect(page.getByTestId('visit-submit')).toBeEnabled();
  await page.getByTestId('visit-submit').click();

  await expect(page).toHaveURL(new RegExp(`/mobile/person/${person.id}$`));
  await expectSubmittedFormWasReplaced(page, person.id, submittedFormUrl);
  await page.getByTestId('person-visit-history').click();
  await expect(page.getByText(marker, { exact: false })).toBeVisible();

  const storageState = await page.evaluate((storageKey) => ({
    raw: window.sessionStorage.getItem(storageKey),
    writes: [...(window as unknown as { __t1aMobileSessionWrites: string[] }).__t1aMobileSessionWrites],
  }), mobileSessionKey);
  expect(storageState.raw).not.toBeNull();
  expect(storageState.writes).toHaveLength(1);

  const envelope = JSON.parse(storageState.raw!) as MobileSessionEnvelope;
  const transaction = JSON.parse(storageState.writes[0]) as MobileSessionEnvelope;
  expect(transaction).toEqual(envelope);
  expect(envelope.version).toBe(1);
  expect(envelope.events).toHaveLength(2);

  const visitEvent = envelope.events.find((event) => event.entity === 'visit' && event.action === 'create');
  const personEvent = envelope.events.find((event) => event.entity === 'person' && event.action === 'update');
  expect(visitEvent).toBeTruthy();
  expect(personEvent).toBeTruthy();
  expect(visitEvent).toMatchObject({
    targetId: expect.stringMatching(/^session:visit:[0-9a-f-]{36}$/i),
    tempId: expect.stringMatching(/^session:visit:[0-9a-f-]{36}$/i),
    payload: {
      targetId: person.id,
      targetType: 'person',
      gridId: person.gridId,
      content: expect.stringContaining(marker),
    },
  });
  expect(visitEvent!.tempId).toBe(visitEvent!.targetId);
  expect(personEvent).toMatchObject({
    targetId: person.id,
    payload: { updatedAt: expect.any(String) },
  });
  expect(Object.prototype.hasOwnProperty.call(personEvent!, 'tempId')).toBe(false);
  expect((personEvent!.payload as { updatedAt: string }).updatedAt).toBe(
    (visitEvent!.payload as VisitRecord).date,
  );

  await page.reload();
  await expect(page.getByTestId('person-visit-history')).toBeVisible();
  await page.getByTestId('person-visit-history').click();
  await expect(page.getByText(marker, { exact: false })).toBeVisible();

  const newContextMutations = await expectMarkerAbsentInNewContext(browser, person.id, marker);
  expect(await readPerson(request, person.id)).toEqual(beforePerson);
  expect(await readPersonVisits(request, person.id)).toEqual(beforeVisits);
  expect(businessMutations).toEqual([]);
  expect(newContextMutations).toEqual([]);
});
