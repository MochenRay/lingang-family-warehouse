import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const backendPort = Number(process.env.BACKEND_PORT ?? '8000');
const apiBaseUrl = `http://127.0.0.1:${backendPort}/api`;
const mobileSessionKey = 'lingang:mobile-sandbox:v1';

interface PendingPersonTask {
  id: string;
  title: string;
  sourceKind: 'person';
  status: 'pending';
  personId: string;
}

interface SeedPerson {
  id: string;
  gridId: string;
  name: string;
  updatedAt: string;
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

interface AiChatRequest {
  agent_type?: string;
  kind?: string;
  message?: string;
  context_id?: string;
}

interface BusinessMutationLog {
  requests: string[];
  responses: Array<{ request: string; status: number }>;
  failures: string[];
}

function isBusinessMutation(url: string, method: string): boolean {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;
  const pathname = new URL(url).pathname;
  return pathname.startsWith('/api/') && !pathname.startsWith('/api/ai/');
}

function trackBusinessMutations(page: Page): BusinessMutationLog {
  const log: BusinessMutationLog = { requests: [], responses: [], failures: [] };
  page.on('request', (apiRequest) => {
    if (isBusinessMutation(apiRequest.url(), apiRequest.method())) {
      log.requests.push(`${apiRequest.method()} ${new URL(apiRequest.url()).pathname}`);
    }
  });
  page.on('response', (response) => {
    const apiRequest = response.request();
    if (isBusinessMutation(apiRequest.url(), apiRequest.method())) {
      log.responses.push({
        request: `${apiRequest.method()} ${new URL(apiRequest.url()).pathname}`,
        status: response.status(),
      });
    }
  });
  page.on('requestfailed', (apiRequest) => {
    if (isBusinessMutation(apiRequest.url(), apiRequest.method())) {
      log.failures.push(`${apiRequest.method()} ${new URL(apiRequest.url()).pathname}`);
    }
  });
  return log;
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

async function readPerson(request: APIRequestContext, personId: string): Promise<SeedPerson> {
  const response = await request.get(`${apiBaseUrl}/people/${encodeURIComponent(personId)}`);
  expect(response.ok()).toBe(true);
  return response.json() as Promise<SeedPerson>;
}

test.use({ viewport: { width: 390, height: 844 } });
test.describe.configure({ retries: 0 });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
    window.localStorage.setItem('mobile_user', 'T1a 验收网格员');
  });
});

test('enabled visit failure stays on the form and never falls back to session data', async ({ page, request }) => {
  const { task, person } = await getPendingPersonTask(request);
  const marker = `T1A-ENABLED-FAIL-${Date.now()}`;
  const beforePerson = await readPerson(request, person.id);
  const beforeVisits = await readPersonVisits(request, person.id);
  const mutations = trackBusinessMutations(page);

  await page.route('**/api/people/*/visits', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(new URL(route.request().url()).pathname).toBe(`/api/people/${person.id}/visits`);
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'forced T1a visit failure' }),
    });
  });

  await openVisitFormFromTask(page, task, person);
  await page.getByTestId('visit-purpose').fill(marker);
  await expect(page.getByTestId('visit-submit')).toBeEnabled();
  await page.getByTestId('visit-submit').click();

  await expect(page.getByText('走访记录保存失败，请稍后重试', { exact: true })).toBeVisible();
  await expect(page.getByText('走访记录已保存', { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/mobile/visit-form/${person.id}$`));
  await expect.poll(() => page.evaluate((key) => window.sessionStorage.getItem(key), mobileSessionKey)).toBeNull();

  expect(await readPerson(request, person.id)).toEqual(beforePerson);
  const afterVisits = await readPersonVisits(request, person.id);
  expect(afterVisits).toEqual(beforeVisits);
  expect(afterVisits.items.some((currentVisit) => currentVisit.content.includes(marker))).toBe(false);
  const expectedRequest = `POST /api/people/${person.id}/visits`;
  expect(mutations).toEqual({
    requests: [expectedRequest],
    responses: [{ request: expectedRequest, status: 503 }],
    failures: [],
  });
});

test('enabled completes task to person to live AI to persisted visit history', async ({ page, request }) => {
  const { task, person } = await getPendingPersonTask(request);
  const marker = `T1A-ENABLED-${Date.now()}`;
  const outlineMarker = `${marker}-AI`;
  const mutations = trackBusinessMutations(page);

  await openVisitFormFromTask(page, task, person);
  await generateLiveVisitOutline(page, person.id, outlineMarker);
  await page.getByTestId('visit-purpose').fill(marker);
  const submittedFormUrl = page.url();
  await expect(page.getByTestId('visit-submit')).toBeEnabled();
  await page.getByTestId('visit-submit').click();

  await expect(page).toHaveURL(new RegExp(`/mobile/person/${person.id}$`));
  await expectSubmittedFormWasReplaced(page, person.id, submittedFormUrl);
  await page.getByTestId('person-visit-history').click();
  await expect(page.getByText(marker, { exact: false })).toBeVisible();
  await expect.poll(() => page.evaluate((key) => window.sessionStorage.getItem(key), mobileSessionKey)).toBeNull();

  await page.reload();
  await expect(page.getByTestId('person-visit-history')).toBeVisible();
  await page.getByTestId('person-visit-history').click();
  await expect(page.getByText(marker, { exact: false })).toBeVisible();

  const visits = await readPersonVisits(request, person.id);
  const matchingVisits = visits.items.filter((visit) => visit.content.includes(marker));
  expect(matchingVisits).toHaveLength(1);
  expect(matchingVisits[0]).toMatchObject({
    targetId: person.id,
    targetType: 'person',
    gridId: person.gridId,
  });

  const persistedPersonResponse = await request.get(
    `${apiBaseUrl}/people/${encodeURIComponent(person.id)}`,
  );
  expect(persistedPersonResponse.ok()).toBe(true);
  const persistedPerson = await persistedPersonResponse.json() as SeedPerson;
  expect(persistedPerson.updatedAt).toBe(matchingVisits[0].date);
  const expectedRequest = `POST /api/people/${person.id}/visits`;
  expect(mutations).toEqual({
    requests: [expectedRequest],
    responses: [{ request: expectedRequest, status: 201 }],
    failures: [],
  });
});
