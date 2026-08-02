import { expect, test, type APIRequestContext, type Browser, type Locator, type Page } from '@playwright/test';

/**
 * K02 矛盾与网格选择 UI — public readonly/session 模式验收。
 *
 * 覆盖：业务 mutation 网络请求为 0、session create/list/temp detail/context/reload 同源可见、
 * 新 browser context 无痕、服务端 seed 创建前后不变、纯机构与居民路径、
 * 切网格往返不残留旧居民、session 写失败 fail closed、
 * health 401/403/404/409/422/429/5xx/network 全部 blocked 且不产生 session success。
 *
 * 只使用本文件内的局部 helper 与精确 allowlist，不改动任何 fixture/config。
 */

const backendPort = Number(process.env.BACKEND_PORT ?? '18001');
const frontendPort = Number(process.env.FRONTEND_PORT ?? '15174');
const apiBaseUrl = `http://127.0.0.1:${backendPort}/api`;
const appBaseUrl = `http://127.0.0.1:${frontendPort}`;
const mobileSessionKey = 'lingang:mobile-sandbox:v1';

function isBusinessMutation(url: string, method: string): boolean {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return false;
  }
  const pathname = new URL(url).pathname;
  if (pathname !== '/api' && !pathname.startsWith('/api/')) {
    return false;
  }
  // /api 下所有非安全方法都计入 spy；仅真正的 AI 端点除外
  return pathname !== '/api/ai' && !pathname.startsWith('/api/ai/');
}

interface MutationLog {
  requests: string[];
  responses: { request: string; status: number }[];
}

function trackBusinessMutations(page: Page): MutationLog {
  const log: MutationLog = { requests: [], responses: [] };
  page.on('request', (request) => {
    if (isBusinessMutation(request.url(), request.method())) {
      log.requests.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });
  page.on('response', (response) => {
    if (isBusinessMutation(response.url(), response.request().method())) {
      log.responses.push({
        request: `${response.request().method()} ${new URL(response.url()).pathname}`,
        status: response.status(),
      });
    }
  });
  return log;
}

// ---- 精确、局部 allowlist：仅负向测试中人为 mock 的 endpoint+status 可豁免 ----

interface AllowRule {
  path: RegExp;
  statuses?: number[];
  failure?: boolean;
}

interface ConsoleAllowRule {
  text: RegExp;
  url?: RegExp;
}

const allowlist: AllowRule[] = [];
const consoleAllowlist: ConsoleAllowRule[] = [];
const issues: string[] = [];

function allowResponse(path: RegExp, statuses: number[]): void {
  allowlist.push({ path, statuses });
}

function allowFailure(path: RegExp): void {
  allowlist.push({ path, failure: true });
}

// 负向测试中有意注入的失败必然产生浏览器/组件 console error；
// 只允许文本精确匹配（必要时连同来源 URL）的本测试局部条目豁免。
function allowConsoleError(text: RegExp, url?: RegExp): void {
  consoleAllowlist.push({ text, url });
}

function attachIssueWatchers(page: Page): void {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      const url = message.location()?.url ?? '';
      const allowed = consoleAllowlist.some((rule) => rule.text.test(text) && (!rule.url || rule.url.test(url)));
      if (!allowed) {
        issues.push(`console-error: ${text}`);
      }
    }
  });
  page.on('pageerror', (error) => {
    issues.push(`pageerror: ${error.message}`);
  });
  page.on('requestfailed', (request) => {
    const pathname = new URL(request.url()).pathname;
    const allowed = allowlist.some((rule) => rule.failure && rule.path.test(pathname));
    if (!allowed) {
      issues.push(`requestfailed: ${request.method()} ${pathname} ${request.failure()?.errorText ?? ''}`);
    }
  });
  page.on('response', (response) => {
    const status = response.status();
    if (status < 400) {
      return;
    }
    const pathname = new URL(response.url()).pathname;
    const allowed = allowlist.some((rule) => rule.statuses?.includes(status) && rule.path.test(pathname));
    if (!allowed) {
      issues.push(`response-${status}: ${response.request().method()} ${pathname}`);
    }
  });
}

// ---- seed accessors（只读 API） ----

interface SeedConflict {
  id: string;
  title: string;
  status: string;
  gridId: string;
}

interface SeedConflictList {
  items: SeedConflict[];
  total: number;
}

async function readConflicts(request: APIRequestContext): Promise<SeedConflictList> {
  const response = await request.get(`${apiBaseUrl}/conflicts?limit=500`);
  expect(response.ok(), '读取矛盾种子列表必须成功').toBe(true);
  return response.json() as Promise<SeedConflictList>;
}

interface SeedGrid {
  id: string;
  name: string;
}

async function readGrids(request: APIRequestContext): Promise<SeedGrid[]> {
  const response = await request.get(`${apiBaseUrl}/stats/grids`);
  expect(response.ok(), '读取网格种子列表必须成功').toBe(true);
  const payload = await response.json() as { grids: SeedGrid[] };
  expect(payload.grids.length, 'seed 必须提供真实网格 options').toBeGreaterThan(0);
  return payload.grids;
}

interface SeedResident {
  id: string;
  name: string;
  address: string;
  gridId: string;
}

async function readGridResidents(request: APIRequestContext, gridId: string, limit = 5): Promise<SeedResident[]> {
  const response = await request.get(`${apiBaseUrl}/people?gridId=${encodeURIComponent(gridId)}&limit=${limit}`);
  expect(response.ok(), `读取网格 ${gridId} 居民必须成功`).toBe(true);
  const payload = await response.json() as { items: SeedResident[]; total: number };
  expect(payload.items.length, `seed 网格 ${gridId} 必须有真实居民`).toBeGreaterThan(0);
  return payload.items;
}

interface SessionEnvelope {
  version: number;
  events: {
    id: string;
    entity: string;
    action: string;
    targetId: string;
    tempId?: string;
    payload: Record<string, unknown>;
    createdAt: string;
  }[];
}

interface SessionStorageSnapshot {
  raw: string | null;
  writes: string[];
}

async function readSessionSnapshot(page: Page): Promise<SessionStorageSnapshot> {
  return page.evaluate((key) => ({
    raw: window.sessionStorage.getItem(key),
    writes: [...(window as unknown as { __k02MobileSessionWrites: string[] }).__k02MobileSessionWrites],
  }), mobileSessionKey);
}

async function pushConflictDetail(page: Page, targetId: string): Promise<void> {
  await page.evaluate((id) => {
    const mobileRoute = `conflict-detail/${id}`;
    const state = {
      route: 'mobile',
      mobileRoute,
      mobileHistory: ['home', 'conflict', mobileRoute],
      mobileDepth: 0,
    };
    window.history.pushState(state, '', `/mobile/conflict/${id}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  }, targetId);
}

// vaul Drawer 打开有位移动画：边界量测须等位移稳定（连续两次采样一致），不用固定 timeout
async function settledBox(locator: Locator, label: string) {
  let previous: { x: number; y: number; width: number; height: number } | null = null;
  await expect.poll(async () => {
    const box = await locator.boundingBox();
    if (!box) {
      previous = null;
      return false;
    }
    const stable = previous !== null
      && Math.abs(box.x - previous.x) < 0.5
      && Math.abs(box.y - previous.y) < 0.5
      && Math.abs(box.width - previous.width) < 0.5
      && Math.abs(box.height - previous.height) < 0.5;
    previous = box;
    return stable;
  }, { message: `${label} 位移动画未稳定` }).toBe(true);
  return previous!;
}

test.use({ viewport: { width: 390, height: 844 } });
test.describe.configure({ retries: 0 });

test.beforeEach(async ({ page }) => {
  issues.length = 0;
  allowlist.length = 0;
  consoleAllowlist.length = 0;
  attachIssueWatchers(page);
  await page.addInitScript(({ storageKey }) => {
    window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
    window.localStorage.setItem('mobile_user', 'K02 验收网格员');

    const writes: string[] = [];
    (window as unknown as { __k02MobileSessionWrites: string[] }).__k02MobileSessionWrites = writes;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string): void {
      if (this === window.sessionStorage && key === storageKey) {
        writes.push(value);
      }
      originalSetItem.call(this, key, value);
    };
  }, { storageKey: mobileSessionKey });
});

test.afterEach(() => {
  expect(issues, '不得出现 console error / pageerror / 意外请求失败或 4xx/5xx').toEqual([]);
});

test('public：health 确认为 readonly，常态 sandbox notice 隐藏', async ({ page, request }) => {
  const health = await request.get(`${apiBaseUrl}/health`);
  expect(health.status()).toBe(200);
  expect(health.headers()['cache-control']).toBe('no-store');
  await expect(health.json()).resolves.toMatchObject({ status: 'ok', demo_write_mode: 'readonly' });

  const mutations = trackBusinessMutations(page);
  await page.goto('/mobile/conflict');
  await expect(page.getByTestId('conflict-list')).toBeVisible();
  await expect(page.getByText('仅本次浏览会话可见，不写入服务器。')).toHaveCount(0);
  expect(mutations).toEqual({ requests: [], responses: [] });
});

test('session 纯机构创建：0 业务 mutation，list/temp detail/context/reload 同源可见，新 context 无痕，seed 不变', async ({ page, request, browser }) => {
  const before = await readConflicts(request);
  const grids = await readGrids(request);
  const g1 = grids.find((item) => item.id === 'g1') ?? grids[0];
  const marker = `K02-PUB-ORG-${Date.now()}`;
  const mutations = trackBusinessMutations(page);

  await page.addInitScript((selection) => {
    window.localStorage.setItem('current_grid', JSON.stringify(selection));
  }, { id: g1.id, name: g1.name });

  // 从列表进入表单，建立真实 history 链：list → form →(replace) temp detail
  await page.goto('/mobile/conflict');
  await expect(page.getByTestId('conflict-list')).toBeVisible();
  await page.getByTestId('conflict-create-button').click();
  await expect(page).toHaveURL(/\/mobile\/conflict\/new$/);
  await expect(page.getByTestId('conflict-form')).toBeVisible();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText(g1.name);
  await page.getByTestId('conflict-description').fill(`${marker}：公共区域堆物引发争议，需协调。`);
  await page.getByTestId('conflict-title').click();
  await page.getByTestId('conflict-title').fill(`${marker} 标题`);
  await page.getByTestId('conflict-type-物业纠纷').click();
  await page.getByTestId('conflict-location').fill('海梦苑中心广场');
  await page.getByTestId('conflict-party-add').click();
  await page.getByTestId('conflict-party-org-org_wy').click();
  await page.getByTestId('conflict-party-confirm').click();
  await expect(page.getByTestId('conflict-submit')).toBeEnabled();
  await page.getByTestId('conflict-submit').click();

  // session temp id 详情；绝不请求 temp-ID API
  await expect(page).toHaveURL(/\/mobile\/conflict\/session:conflict:[0-9a-f-]{36}$/);
  const tempId = page.url().split('/').pop()!;
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(`${marker} 标题`);
  await expect(page.getByTestId('conflict-timeline')).toContainText('网格员上报纠纷');
  await expect(page.getByTestId('conflict-timeline')).toContainText('K02 验收网格员');
  // context 同源：纯机构无关联人员/房屋，案件推导仍由 facade 真实返回
  await expect(page.locator('[data-testid^="conflict-related-person-"]')).toHaveCount(0);
  await expect(page.getByTestId('conflict-related-house')).toHaveCount(0);
  await expect(page.getByText('案件推导')).toBeVisible();

  // 业务 mutation 网络请求为 0；恰好一次原子 session 写入
  expect(mutations).toEqual({ requests: [], responses: [] });
  const snapshot = await readSessionSnapshot(page);
  expect(snapshot.writes).toHaveLength(1);
  expect(snapshot.raw).not.toBeNull();
  const envelope = JSON.parse(snapshot.raw!) as SessionEnvelope;
  expect(envelope.version).toBe(1);
  expect(envelope.events).toHaveLength(1);
  expect(envelope.events[0]).toMatchObject({
    entity: 'conflict',
    action: 'create',
    targetId: tempId,
    tempId,
    payload: {
      title: `${marker} 标题`,
      type: '物业纠纷',
      status: '调解中',
      gridId: g1.id,
      location: '海梦苑中心广场',
      source: '自行发现',
      images: [],
      involvedParties: [{ type: 'organization', id: 'org_wy', name: '物业公司' }],
    },
  });

  // 同一 browser context reload 后仍可见
  await page.reload();
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(`${marker} 标题`);

  // 创建后 list 同源可见（replace：back 回列表而非表单）
  await page.goBack();
  await expect(page).toHaveURL(/\/mobile\/conflict$/);
  expect(page.url()).not.toContain('/mobile/conflict/new');
  await page.getByTestId('conflict-search-input').fill(marker);
  await expect(page.getByTestId(`conflict-card-${tempId}`)).toBeVisible();
  await expect(page.getByTestId('conflict-tab-processing')).toContainText(String(before.items.filter((item) => item.status === '调解中').length + 1));

  // 新 browser context 无痕
  const freshContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await freshContext.addInitScript(() => {
    window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
  });
  const freshPage = await freshContext.newPage();
  // fresh page 与主 page 共用同一 issues 集合与精确 allowlist：goto 前挂全量 watcher，
  // console error / pageerror / requestfailed / 意外 4xx/5xx 均进入 afterEach 断言
  attachIssueWatchers(freshPage);
  const freshMutations = trackBusinessMutations(freshPage);
  try {
    await freshPage.goto(`${appBaseUrl}/mobile/conflict`);
    await expect(freshPage.getByTestId('conflict-list')).toBeVisible();
    await freshPage.getByTestId('conflict-search-input').fill(marker);
    await expect(freshPage.getByTestId('conflict-list-empty')).toBeVisible();
    expect(await freshPage.evaluate((key) => window.sessionStorage.getItem(key), mobileSessionKey)).toBeNull();
  } finally {
    await freshContext.close();
  }
  expect(freshMutations).toEqual({ requests: [], responses: [] });

  // 服务端 seed 创建前后不变
  expect(await readConflicts(request)).toEqual(before);
  expect(mutations).toEqual({ requests: [], responses: [] });
});

test('session 居民路径：切网格往返不残留旧居民，context 关联人员真实跳转', async ({ page, request }) => {
  const grids = await readGrids(request);
  const g1 = grids.find((item) => item.id === 'g1') ?? grids[0];
  const g2 = grids.find((item) => item.id === 'g2') ?? grids[1];
  const resident = (await readGridResidents(request, g1.id, 3))[0];
  const marker = `K02-PUB-RES-${Date.now()}`;
  const mutations = trackBusinessMutations(page);

  // 无 current_grid：不预选，必须显式选择
  await page.goto('/mobile/conflict/new');
  await expect(page.getByTestId('conflict-form')).toBeVisible();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText('请选择所属网格');

  await page.getByTestId('conflict-grid-trigger').click();
  await page.getByTestId(`conflict-grid-option-${g1.id}`).click();
  await page.getByTestId('conflict-party-add').click();
  await expect(page.getByTestId(`conflict-party-resident-${resident.id}`)).toBeVisible();
  await page.getByTestId(`conflict-party-resident-${resident.id}`).click();
  await page.getByTestId('conflict-party-org-org_jwh').click();
  await page.getByTestId('conflict-party-confirm').click();
  await expect(page.getByTestId(`conflict-party-chip-resident-${resident.id}`)).toBeVisible();
  await expect(page.getByTestId('conflict-party-chip-organization-org_jwh')).toBeVisible();

  // 切到 g2：居民 party 立即清除、机构保留；再切回 g1：无残留
  await page.getByTestId('conflict-grid-trigger').click();
  await page.getByTestId(`conflict-grid-option-${g2.id}`).click();
  await expect(page.getByTestId(`conflict-party-chip-resident-${resident.id}`)).toHaveCount(0);
  await expect(page.getByTestId('conflict-party-chip-organization-org_jwh')).toBeVisible();
  await page.getByTestId('conflict-grid-trigger').click();
  await page.getByTestId(`conflict-grid-option-${g1.id}`).click();
  await expect(page.getByTestId('conflict-party-chips').locator('[data-testid^="conflict-party-chip-resident-"]')).toHaveCount(0);

  // 切回后居民重新加载并可再次显式选择
  await page.getByTestId('conflict-party-add').click();
  await expect(page.getByTestId(`conflict-party-resident-${resident.id}`)).toBeVisible();
  await page.getByTestId(`conflict-party-resident-${resident.id}`).click();
  await page.getByTestId('conflict-party-confirm').click();
  await expect(page.getByTestId(`conflict-party-chip-resident-${resident.id}`)).toBeVisible();

  await page.getByTestId('conflict-description').fill(`${marker}：邻里通行争议，需现场协调。`);
  await page.getByTestId('conflict-title').click();
  await page.getByTestId('conflict-title').fill(`${marker} 标题`);
  await page.getByTestId('conflict-type-邻里纠纷').click();
  await page.getByTestId('conflict-location').fill('海梦苑 5 号楼 1 单元');
  await expect(page.getByTestId('conflict-submit')).toBeEnabled();
  await page.getByTestId('conflict-submit').click();

  await expect(page).toHaveURL(/\/mobile\/conflict\/session:conflict:[0-9a-f-]{36}$/);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(`${marker} 标题`);

  // session context 同源：关联人员来自 facade 投影，可真实跳转到人员详情
  const relatedPerson = page.getByTestId(`conflict-related-person-${resident.id}`);
  await expect(relatedPerson).toBeVisible();
  await relatedPerson.click();
  await expect(page).toHaveURL(new RegExp(`/mobile/person/${resident.id}$`));
  await expect(page.getByText('未找到该人员信息')).toHaveCount(0);

  expect(mutations).toEqual({ requests: [], responses: [] });
});

test('public：session 写成功但显式读回失败——锁定 mutation、保留旧详情与 Dialog，重新读取后收束', async ({ page, request }) => {
  const all = await readConflicts(request);
  const target = all.items.find((item) => item.status === '调解中');
  expect(target, 'seed 必须包含调解中纠纷').toBeTruthy();
  const targetId = target!.id;
  const mutations = trackBusinessMutations(page);

  // 精确布置：仅针对显式读回的 conflict list GET 注入一次 500。
  // session mutation 内部（requireSessionConflict）也要先读 seed list，该 GET 必须放行——
  // 只有“session 写入已完成之后”的 GET 才是显式读回，不得泛化拦截
  let armed = false;
  let failReadback = false;
  let readFailureGets = 0;
  let listGetsAfterArm = 0;
  await page.route(/\/api\/conflicts\?/, async (route) => {
    if (route.request().method() !== 'GET' || !armed) {
      await route.continue();
      return;
    }
    listGetsAfterArm += 1;
    const sessionWrites = (await readSessionSnapshot(page)).writes.length;
    if (failReadback && sessionWrites > 0) {
      readFailureGets += 1;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'forced K02 readback failure' }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto(`/mobile/conflict/${targetId}`);
  await expect(page.getByTestId('conflict-detail')).toBeVisible();
  await expect(page.getByTestId('conflict-detail-status')).toHaveText('调解中');
  const timelineBefore = await page.getByTestId('conflict-timeline').innerText();
  expect((await readSessionSnapshot(page)).writes).toEqual([]);

  // 武装读回失败 + 精确 endpoint+status+文本 allowlist
  armed = true;
  failReadback = true;
  allowResponse(/\/api\/conflicts$/, [500]);
  allowConsoleError(/^Failed to load resource: the server responded with a status of 500/, /\/api\/conflicts\?/);
  allowConsoleError(/^Failed to reload conflict detail after mutation/);

  await page.getByTestId('conflict-mark-resolved').click();
  const dialog = page.getByTestId('conflict-resolve-dialog');
  await expect(dialog).toBeVisible();
  await page.getByTestId('conflict-resolve-confirm').click();

  // session mutation 成功：一次 setItem 内原子新增 status+update 两个 event
  await expect.poll(async () => (await readSessionSnapshot(page)).writes.length).toBe(1);
  const snapshot = await readSessionSnapshot(page);
  const envelope = JSON.parse(snapshot.writes[0]) as SessionEnvelope;
  expect(envelope.events.map((event) => event.action)).toEqual(['status', 'update']);
  expect(envelope.events[0]).toMatchObject({ entity: 'conflict', action: 'status', targetId, payload: { status: '已化解' } });
  expect(envelope.events[1]).toMatchObject({ entity: 'conflict', action: 'update', targetId });

  // 显式读回 conflict GET 恰为一次：mutation 内部 seed 读 1 次 + 显式读回 1 次，
  // 自身 subscribe 没有触发第二次 reload（否则此处会是 3）
  await expect(dialog.getByRole('alert')).toContainText('写入成功，但最新详情读取失败');
  expect(readFailureGets).toBe(1);
  expect(listGetsAfterArm).toBe(2);

  // Dialog 保持打开、旧状态与 timeline 原样保留、不得显示普通 mutation 成功
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('conflict-detail-status')).toHaveText('调解中');
  expect(await page.getByTestId('conflict-timeline').innerText()).toBe(timelineBefore);
  await expect(page.getByText('状态已更新')).toHaveCount(0);

  // mutation 被锁定：confirm 禁用；再次交互不得增加 session write、timeline event 或读回 GET
  await expect(page.getByTestId('conflict-resolve-confirm')).toBeDisabled();
  await page.getByTestId('conflict-resolve-confirm').click({ force: true });
  expect((await readSessionSnapshot(page)).writes).toHaveLength(1);
  expect(await page.getByTestId('conflict-timeline').innerText()).toBe(timelineBefore);
  expect(listGetsAfterArm).toBe(2);

  // 关闭再打开 Dialog 也不得清除锁
  await page.getByTestId('conflict-resolve-dialog-close').click();
  await expect(dialog).toHaveCount(0);
  await page.getByTestId('conflict-mark-resolved').click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toContainText('写入成功，但最新详情读取失败');
  await expect(page.getByTestId('conflict-resolve-confirm')).toBeDisabled();

  // 恢复 GET 后点击“重新读取”：只发生读取，无第二次 mutation、无第二次 session write
  failReadback = false;
  await page.getByTestId('conflict-resolve-reread').click();
  await expect(dialog).toHaveCount(0);
  // Dialog 收束并显示真实新状态与 timeline
  await expect(page.getByTestId('conflict-detail-status')).toHaveText('已化解');
  await expect(page.getByTestId('conflict-timeline')).toContainText('网格员标记该纠纷已化解');
  expect(listGetsAfterArm).toBe(3);
  expect(readFailureGets).toBe(1);
  expect((await readSessionSnapshot(page)).writes).toHaveLength(1);

  // public 网络 mutation 仍为 0
  expect(mutations).toEqual({ requests: [], responses: [] });
});

test('public：A session mutation 延迟到切换 B 后才 emit，B 不得额外 reload、报错或继承 A 锁', async ({ page, request }) => {
  const all = await readConflicts(request);
  const processing = all.items.filter((item) => item.status === '调解中');
  expect(processing.length, 'seed 必须至少提供两个调解中纠纷').toBeGreaterThanOrEqual(2);
  const [conflictA, conflictB] = processing;
  const mutations = trackBusinessMutations(page);

  await page.goto(`/mobile/conflict/${conflictA.id}`);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);
  expect((await readSessionSnapshot(page)).writes).toEqual([]);

  // 初始 A 已稳定后才安装 route：计数从 A mutation 的 seed read 开始。
  let releaseMutationSeedRead!: () => void;
  const mutationSeedGate = new Promise<void>((resolve) => {
    releaseMutationSeedRead = resolve;
  });
  let markMutationSeedReadStarted!: () => void;
  const mutationSeedReadStarted = new Promise<void>((resolve) => {
    markMutationSeedReadStarted = resolve;
  });
  let conflictSeedGets = 0;
  await page.route(/\/api\/conflicts\?/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    conflictSeedGets += 1;
    if (conflictSeedGets === 1) {
      markMutationSeedReadStarted();
      await mutationSeedGate;
      await route.continue();
      return;
    }
    if (conflictSeedGets === 2) {
      // B 自身路由变化的正常详情读取。
      await route.continue();
      return;
    }
    // 第三个 GET 只能是 A append event 错误刷新 B；精确失败使全页 error 可证伪。
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'forced K02 stale session event B reload' }),
    });
  });
  allowResponse(/\/api\/conflicts$/, [500]);
  allowConsoleError(/^Failed to load resource: the server responded with a status of 500/, /\/api\/conflicts\?/);
  allowConsoleError(/^Failed to load conflict detail Error: API 500/);

  await page.getByTestId('conflict-mark-resolved').click();
  await page.getByTestId('conflict-resolve-confirm').click();
  await mutationSeedReadStarted;
  expect(conflictSeedGets).toBe(1);

  await page.evaluate((targetId) => {
    const mobileRoute = `conflict-detail/${targetId}`;
    const state = {
      route: 'mobile',
      mobileRoute,
      mobileHistory: ['home', 'conflict', mobileRoute],
      mobileDepth: 0,
    };
    window.history.pushState(state, '', `/mobile/conflict/${targetId}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  }, conflictB.id);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictB.title);
  expect(conflictSeedGets).toBe(2);

  // A 仍 pending 时，B 的当前页面 UI mutation 锁已独立，可正常操作自己的 Dialog。
  await page.getByTestId('conflict-mark-resolved').click();
  const dialogB = page.getByTestId('conflict-resolve-dialog');
  await expect(dialogB).toBeVisible();
  await expect(page.getByTestId('conflict-resolve-confirm')).toBeEnabled();
  await page.getByTestId('conflict-resolve-cancel').click();

  // A 此时才完成 session transaction 并同步 emit mobile-session-change。
  releaseMutationSeedRead();
  await expect.poll(async () => (await readSessionSnapshot(page)).writes.length).toBe(1);
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));

  expect(conflictSeedGets, 'A 的自身 session event 不得触发 B 的第三次 conflict seed GET').toBe(2);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictB.title);
  await expect(page.getByTestId('conflict-detail-loading')).toHaveCount(0);
  await expect(page.getByTestId('conflict-detail-error')).toHaveCount(0);
  await expect(page.getByText('状态已更新')).toHaveCount(0);
  await expect(page.getByTestId('conflict-resolve-read-failure')).toHaveCount(0);
  await expect(page.getByTestId('conflict-resolve-dialog')).toHaveCount(0);

  const snapshot = await readSessionSnapshot(page);
  expect(snapshot.writes).toHaveLength(1);
  const envelope = JSON.parse(snapshot.writes[0]) as SessionEnvelope;
  expect(envelope.events.map((event) => ({ action: event.action, targetId: event.targetId }))).toEqual([
    { action: 'status', targetId: conflictA.id },
    { action: 'update', targetId: conflictA.id },
  ]);
  expect(mutations).toEqual({ requests: [], responses: [] });
});

test('public：A session mutation 在 A→B→A 后完成，当前 A 必须补一次同源读回', async ({ page, request }) => {
  const all = await readConflicts(request);
  const processing = all.items.filter((item) => item.status === '调解中');
  expect(processing.length, 'seed 必须至少提供两个调解中纠纷').toBeGreaterThanOrEqual(2);
  const [conflictA, conflictB] = processing;
  const mutations = trackBusinessMutations(page);

  await page.goto(`/mobile/conflict/${conflictA.id}`);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);
  await expect(page.getByTestId('conflict-detail-status')).toHaveText('调解中');
  expect((await readSessionSnapshot(page)).writes).toEqual([]);

  let releaseMutationSeedRead!: () => void;
  const mutationSeedGate = new Promise<void>((resolve) => {
    releaseMutationSeedRead = resolve;
  });
  let markMutationSeedReadStarted!: () => void;
  const mutationSeedReadStarted = new Promise<void>((resolve) => {
    markMutationSeedReadStarted = resolve;
  });
  let gateReleased = false;
  let conflictSeedGets = 0;
  let postSettleAReads = 0;
  await page.route(/\/api\/conflicts\?/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    conflictSeedGets += 1;
    if (gateReleased) {
      postSettleAReads += 1;
    }
    if (conflictSeedGets === 1) {
      markMutationSeedReadStarted();
      await mutationSeedGate;
    }
    await route.continue();
  });

  await page.getByTestId('conflict-mark-resolved').click();
  await page.getByTestId('conflict-resolve-confirm').click();
  await mutationSeedReadStarted;
  expect(conflictSeedGets, '第一个 GET 必须是暂停中的 A mutation seed read').toBe(1);

  await page.evaluate((targetId) => {
    const mobileRoute = `conflict-detail/${targetId}`;
    const state = {
      route: 'mobile',
      mobileRoute,
      mobileHistory: ['home', 'conflict', mobileRoute],
      mobileDepth: 0,
    };
    window.history.pushState(state, '', `/mobile/conflict/${targetId}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  }, conflictB.id);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictB.title);
  expect(conflictSeedGets, '第二个 GET 必须是 B 的 baseline detail read').toBe(2);

  await page.evaluate((targetId) => {
    const mobileRoute = `conflict-detail/${targetId}`;
    const state = {
      route: 'mobile',
      mobileRoute,
      mobileHistory: ['home', 'conflict', mobileRoute],
      mobileDepth: 0,
    };
    window.history.pushState(state, '', `/mobile/conflict/${targetId}`);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  }, conflictA.id);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);
  await expect(page.getByTestId('conflict-detail-status')).toHaveText('调解中');
  await expect(page.getByTestId('conflict-timeline')).not.toContainText('网格员标记该纠纷已化解');
  expect(conflictSeedGets, '第三个 GET 必须是返回 A 的 baseline detail read').toBe(3);

  // 旧 A 此时才写入单次 session transaction；subscribe emit 会被 pending token 吞掉，
  // stale-success 分支必须在精确 settle 后为当前 A 主动补一次 generation-guarded read。
  gateReleased = true;
  releaseMutationSeedRead();
  await expect.poll(async () => (await readSessionSnapshot(page)).writes.length).toBe(1);
  await expect.poll(() => postSettleAReads, {
    message: 'A→B→A 后旧 A 成功 settle 必须恰好启动一次当前 A 读回',
  }).toBe(1);

  await expect(page.getByTestId('conflict-detail-status')).toHaveText('已化解');
  await expect(page.getByTestId('conflict-timeline')).toContainText('网格员标记该纠纷已化解');
  await expect(page.getByRole('heading', { name: '已化解，转入观察', exact: true })).toBeVisible();
  expect(conflictSeedGets, '总计应为 mutation seed + B baseline + A baseline + post-settle A read').toBe(4);
  expect(postSettleAReads).toBe(1);

  const snapshot = await readSessionSnapshot(page);
  expect(snapshot.writes).toHaveLength(1);
  const envelope = JSON.parse(snapshot.writes[0]) as SessionEnvelope;
  expect(envelope.events.map((event) => ({ action: event.action, targetId: event.targetId }))).toEqual([
    { action: 'status', targetId: conflictA.id },
    { action: 'update', targetId: conflictA.id },
  ]);
  await expect(page.getByTestId('conflict-detail-loading')).toHaveCount(0);
  await expect(page.getByTestId('conflict-detail-error')).toHaveCount(0);
  await expect(page.getByTestId('conflict-resolve-read-failure')).toHaveCount(0);
  await expect(page.getByTestId('conflict-resolve-dialog')).toHaveCount(0);
  await expect(page.getByText('状态已更新')).toHaveCount(0);
  expect(mutations).toEqual({ requests: [], responses: [] });
});

test('public：A2 显式读回 pending 时 A1 success，不得取消 A2 收束语义', async ({ page, request }) => {
  const all = await readConflicts(request);
  const processing = all.items.filter((item) => item.status === '调解中');
  expect(processing.length, 'seed 必须至少提供两个调解中纠纷').toBeGreaterThanOrEqual(2);
  const [conflictA, conflictB] = processing;
  const mutations = trackBusinessMutations(page);

  await page.goto(`/mobile/conflict/${conflictA.id}`);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);
  await expect(page.getByTestId('conflict-detail-status')).toHaveText('调解中');

  let releaseA1Seed: () => void = () => undefined;
  const a1SeedGate = new Promise<void>((resolve) => {
    releaseA1Seed = resolve;
  });
  let releaseA2Readback: () => void = () => undefined;
  const a2ReadbackGate = new Promise<void>((resolve) => {
    releaseA2Readback = resolve;
  });
  let markA1SeedStarted!: () => void;
  const a1SeedStarted = new Promise<void>((resolve) => {
    markA1SeedStarted = resolve;
  });
  let markA2ReadbackStarted!: () => void;
  const a2ReadbackStarted = new Promise<void>((resolve) => {
    markA2ReadbackStarted = resolve;
  });
  let conflictSeedGets = 0;
  await page.route(/\/api\/conflicts\?/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    conflictSeedGets += 1;
    if (conflictSeedGets === 1) {
      markA1SeedStarted();
      await a1SeedGate;
    } else if (conflictSeedGets === 5) {
      markA2ReadbackStarted();
      await a2ReadbackGate;
    }
    await route.continue();
  });

  try {
    // A1：暂停 session mutation 的 seed read。
    await page.getByTestId('conflict-mark-resolved').click();
    await page.getByTestId('conflict-resolve-confirm').click();
    await a1SeedStarted;
    expect(conflictSeedGets).toBe(1);

    await pushConflictDetail(page, conflictB.id);
    await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictB.title);
    expect(conflictSeedGets, '第二个 GET 必须是 B baseline').toBe(2);

    await pushConflictDetail(page, conflictA.id);
    await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);
    await expect(page.getByTestId('conflict-detail-status')).toHaveText('调解中');
    expect(conflictSeedGets, '第三个 GET 必须是返回 A baseline').toBe(3);

    // A2：先成功写入第一笔 transaction，再暂停其显式读回。
    await page.getByTestId('conflict-mark-resolved').click();
    const a2Dialog = page.getByTestId('conflict-resolve-dialog');
    await expect(a2Dialog).toBeVisible();
    await page.getByTestId('conflict-resolve-confirm').click();
    await a2ReadbackStarted;
    expect(conflictSeedGets, '第四个 GET 为 A2 mutation seed，第五个为 A2 显式读回').toBe(5);
    await expect.poll(async () => (await readSessionSnapshot(page)).writes.length).toBe(1);

    // A1 此时才写入第二笔 transaction。旧 A1 catch-up 不得抢占 A2 readback generation。
    releaseA1Seed();
    await expect.poll(async () => (await readSessionSnapshot(page)).writes.length).toBe(2);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    releaseA2Readback();

    await expect(a2Dialog).toHaveCount(0);
    await expect(page.getByText('状态已更新')).toBeVisible();
    await expect(page.getByTestId('conflict-detail-status')).toHaveText('已化解');
    await expect(page.getByTestId('conflict-timeline')).toContainText('网格员标记该纠纷已化解');
    await expect(page.getByRole('heading', { name: '已化解，转入观察', exact: true })).toBeVisible();
    await expect.poll(() => conflictSeedGets, {
      message: 'GET 必须精确为 A1 seed、B/A baseline、A2 seed/readback 与一次有序 dirty flush',
    }).toBe(6);

    const snapshot = await readSessionSnapshot(page);
    expect(snapshot.writes).toHaveLength(2);
    const firstEnvelope = JSON.parse(snapshot.writes[0]) as SessionEnvelope;
    const finalEnvelope = JSON.parse(snapshot.writes[1]) as SessionEnvelope;
    expect(firstEnvelope.events.map((event) => event.action)).toEqual(['status', 'update']);
    expect(finalEnvelope.events.map((event) => ({ action: event.action, targetId: event.targetId }))).toEqual([
      { action: 'status', targetId: conflictA.id },
      { action: 'update', targetId: conflictA.id },
      { action: 'status', targetId: conflictA.id },
      { action: 'update', targetId: conflictA.id },
    ]);
    await expect(page.getByTestId('conflict-detail-error')).toHaveCount(0);
    await expect(page.getByTestId('conflict-resolve-read-failure')).toHaveCount(0);
    expect(mutations).toEqual({ requests: [], responses: [] });
  } finally {
    releaseA1Seed();
    releaseA2Readback();
  }
});

test('public：A2 mutation 失败后 A1 success，保留 A2 错误并自动收束 A1 truth', async ({ page, request }) => {
  const all = await readConflicts(request);
  const processing = all.items.filter((item) => item.status === '调解中');
  expect(processing.length, 'seed 必须至少提供两个调解中纠纷').toBeGreaterThanOrEqual(2);
  const [conflictA, conflictB] = processing;
  const mutations = trackBusinessMutations(page);

  await page.goto(`/mobile/conflict/${conflictA.id}`);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);

  let releaseA1Seed: () => void = () => undefined;
  const a1SeedGate = new Promise<void>((resolve) => {
    releaseA1Seed = resolve;
  });
  let markA1SeedStarted!: () => void;
  const a1SeedStarted = new Promise<void>((resolve) => {
    markA1SeedStarted = resolve;
  });
  let conflictSeedGets = 0;
  await page.route(/\/api\/conflicts\?/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    conflictSeedGets += 1;
    if (conflictSeedGets === 1) {
      markA1SeedStarted();
      await a1SeedGate;
    }
    await route.continue();
  });

  try {
    await page.getByTestId('conflict-mark-resolved').click();
    await page.getByTestId('conflict-resolve-confirm').click();
    await a1SeedStarted;

    await pushConflictDetail(page, conflictB.id);
    await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictB.title);
    await pushConflictDetail(page, conflictA.id);
    await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);
    await expect(page.getByTestId('conflict-detail-status')).toHaveText('调解中');
    expect(conflictSeedGets, 'A1 seed + B baseline + A baseline').toBe(3);

    // 只让 A2 的下一次 session transaction 持久化失败；A1 随后仍可正常写入。
    await page.evaluate((storageKey) => {
      const originalSetItem = Storage.prototype.setItem;
      let failNextTransaction = true;
      Storage.prototype.setItem = function setItem(key: string, value: string): void {
        if (this === window.sessionStorage && key === storageKey && failNextTransaction) {
          failNextTransaction = false;
          throw new DOMException('forced K02 A2 session failure', 'QuotaExceededError');
        }
        originalSetItem.call(this, key, value);
      };
    }, mobileSessionKey);
    allowConsoleError(/^Failed to mark conflict resolved (MobileSessionStoreError|Error): Unable to persist mobile session data/);

    await page.getByTestId('conflict-mark-resolved').click();
    const a2Dialog = page.getByTestId('conflict-resolve-dialog');
    await page.getByTestId('conflict-resolve-confirm').click();
    await expect(a2Dialog.getByTestId('conflict-resolve-error')).toContainText('Unable to persist mobile session data');
    await expect(page.getByText('状态更新失败')).toBeVisible();
    expect(conflictSeedGets, '第四个 GET 必须是失败的 A2 mutation seed').toBe(4);
    expect((await readSessionSnapshot(page)).writes).toEqual([]);

    // A1 成功后，详情自动收束到 A1 的 session truth；已化解页面会卸载操作区，
    // 但 A2 的真实失败 toast 仍须可见，不得被误报为成功。
    releaseA1Seed();
    await expect.poll(async () => (await readSessionSnapshot(page)).writes.length).toBe(1);
    await expect(page.getByTestId('conflict-detail-status')).toHaveText('已化解');
    await expect(page.getByTestId('conflict-timeline')).toContainText('网格员标记该纠纷已化解');
    await expect(page.getByRole('heading', { name: '已化解，转入观察', exact: true })).toBeVisible();
    await expect(page.getByText('状态更新失败')).toBeVisible();
    await expect(a2Dialog).toHaveCount(0);
    expect(conflictSeedGets, '第五个 GET 必须是 A1 success 的有序 dirty flush').toBe(5);

    const snapshot = await readSessionSnapshot(page);
    expect(snapshot.writes).toHaveLength(1);
    const envelope = JSON.parse(snapshot.writes[0]) as SessionEnvelope;
    expect(envelope.events.map((event) => ({ action: event.action, targetId: event.targetId }))).toEqual([
      { action: 'status', targetId: conflictA.id },
      { action: 'update', targetId: conflictA.id },
    ]);
    await expect(page.getByTestId('conflict-detail-error')).toHaveCount(0);
    await expect(page.getByTestId('conflict-resolve-read-failure')).toHaveCount(0);
    await expect(page.getByText('状态已更新')).toHaveCount(0);
    expect(mutations).toEqual({ requests: [], responses: [] });
  } finally {
    releaseA1Seed();
  }
});

test('public：manual reread pending 时 A1 success，dirty flush 必须等待并由 reread 正常清锁', async ({ page, request }) => {
  const all = await readConflicts(request);
  const processing = all.items.filter((item) => item.status === '调解中');
  expect(processing.length, 'seed 必须至少提供两个调解中纠纷').toBeGreaterThanOrEqual(2);
  const [conflictA, conflictB] = processing;
  const mutations = trackBusinessMutations(page);

  await page.goto(`/mobile/conflict/${conflictA.id}`);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);

  let releaseA1Seed: () => void = () => undefined;
  const a1SeedGate = new Promise<void>((resolve) => {
    releaseA1Seed = resolve;
  });
  let releaseManualRead: () => void = () => undefined;
  const manualReadGate = new Promise<void>((resolve) => {
    releaseManualRead = resolve;
  });
  let markA1SeedStarted!: () => void;
  const a1SeedStarted = new Promise<void>((resolve) => {
    markA1SeedStarted = resolve;
  });
  let markManualReadStarted!: () => void;
  const manualReadStarted = new Promise<void>((resolve) => {
    markManualReadStarted = resolve;
  });
  let conflictSeedGets = 0;
  await page.route(/\/api\/conflicts\?/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    conflictSeedGets += 1;
    if (conflictSeedGets === 1) {
      markA1SeedStarted();
      await a1SeedGate;
      await route.continue();
      return;
    }
    if (conflictSeedGets === 5) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'forced K02 A2 explicit readback failure before manual reread' }),
      });
      return;
    }
    if (conflictSeedGets === 6) {
      markManualReadStarted();
      await manualReadGate;
    }
    await route.continue();
  });
  allowResponse(/\/api\/conflicts$/, [500]);
  allowConsoleError(/^Failed to load resource: the server responded with a status of 500/, /\/api\/conflicts\?/);
  allowConsoleError(/^Failed to reload conflict detail after mutation/);

  try {
    // A1 pending → B → A。
    await page.getByTestId('conflict-mark-resolved').click();
    await page.getByTestId('conflict-resolve-confirm').click();
    await a1SeedStarted;
    await pushConflictDetail(page, conflictB.id);
    await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictB.title);
    await pushConflictDetail(page, conflictA.id);
    await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);
    expect(conflictSeedGets, 'A1 seed + B baseline + A baseline').toBe(3);

    // A2 写成功，但第 5 个 GET 的显式读回精确失败，形成诚实 readFailure 锁。
    await page.getByTestId('conflict-mark-resolved').click();
    const dialog = page.getByTestId('conflict-resolve-dialog');
    await page.getByTestId('conflict-resolve-confirm').click();
    await expect(dialog.getByTestId('conflict-resolve-read-failure')).toBeVisible();
    expect(conflictSeedGets, 'A2 mutation seed + 显式失败读回').toBe(5);
    expect((await readSessionSnapshot(page)).writes).toHaveLength(1);

    // 第 6 个 GET 为用户 manual reread，并保持 pending。
    await page.getByTestId('conflict-resolve-reread').click();
    await manualReadStarted;
    await expect(page.getByTestId('conflict-resolve-reread')).toBeDisabled();
    expect(conflictSeedGets).toBe(6);

    // A1 此时成功并标脏；dirty flush 不得发第 7 个 GET 去取消 manual reread。
    releaseA1Seed();
    await expect.poll(async () => (await readSessionSnapshot(page)).writes.length).toBe(2);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    expect(conflictSeedGets, 'manual reread 占用期间 dirty flush 必须等待').toBe(6);

    releaseManualRead();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('conflict-resolve-read-failure')).toHaveCount(0);
    await expect(page.getByTestId('conflict-detail-status')).toHaveText('已化解');
    await expect(page.getByTestId('conflict-timeline')).toContainText('网格员标记该纠纷已化解');
    await expect(page.getByRole('heading', { name: '已化解，转入观察', exact: true })).toBeVisible();
    await expect.poll(() => conflictSeedGets, {
      message: 'manual reread 收束后只允许一次有序 dirty flush',
    }).toBe(7);

    const snapshot = await readSessionSnapshot(page);
    expect(snapshot.writes).toHaveLength(2);
    const finalEnvelope = JSON.parse(snapshot.writes[1]) as SessionEnvelope;
    expect(finalEnvelope.events.map((event) => ({ action: event.action, targetId: event.targetId }))).toEqual([
      { action: 'status', targetId: conflictA.id },
      { action: 'update', targetId: conflictA.id },
      { action: 'status', targetId: conflictA.id },
      { action: 'update', targetId: conflictA.id },
    ]);
    await expect(page.getByTestId('conflict-detail-error')).toHaveCount(0);
    await expect(page.getByText('状态已更新')).toHaveCount(0);
    expect(mutations).toEqual({ requests: [], responses: [] });
  } finally {
    releaseA1Seed();
    releaseManualRead();
  }
});

test('public：A2 mutation pending 时 A1 old finally 不得提前解除提交态', async ({ page, request }) => {
  const all = await readConflicts(request);
  const processing = all.items.filter((item) => item.status === '调解中');
  expect(processing.length, 'seed 必须至少提供两个调解中纠纷').toBeGreaterThanOrEqual(2);
  const [conflictA, conflictB] = processing;
  const mutations = trackBusinessMutations(page);

  await page.goto(`/mobile/conflict/${conflictA.id}`);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);

  let releaseA1Seed: () => void = () => undefined;
  const a1SeedGate = new Promise<void>((resolve) => {
    releaseA1Seed = resolve;
  });
  let releaseA2Seed: () => void = () => undefined;
  const a2SeedGate = new Promise<void>((resolve) => {
    releaseA2Seed = resolve;
  });
  let markA1SeedStarted!: () => void;
  const a1SeedStarted = new Promise<void>((resolve) => {
    markA1SeedStarted = resolve;
  });
  let markA2SeedStarted!: () => void;
  const a2SeedStarted = new Promise<void>((resolve) => {
    markA2SeedStarted = resolve;
  });
  let conflictSeedGets = 0;
  await page.route(/\/api\/conflicts\?/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    conflictSeedGets += 1;
    if (conflictSeedGets === 1) {
      markA1SeedStarted();
      await a1SeedGate;
    } else if (conflictSeedGets === 4) {
      markA2SeedStarted();
      await a2SeedGate;
    }
    await route.continue();
  });

  try {
    await page.getByTestId('conflict-mark-resolved').click();
    await page.getByTestId('conflict-resolve-confirm').click();
    await a1SeedStarted;
    await pushConflictDetail(page, conflictB.id);
    await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictB.title);
    await pushConflictDetail(page, conflictA.id);
    await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);
    expect(conflictSeedGets).toBe(3);

    // A2 占用新的 UI operation token，mutation seed 保持 pending。
    await page.getByTestId('conflict-mark-resolved').click();
    const a2Dialog = page.getByTestId('conflict-resolve-dialog');
    await page.getByTestId('conflict-resolve-confirm').click();
    await a2SeedStarted;
    const markResolved = page.getByTestId('conflict-mark-resolved');
    await expect(markResolved).toBeDisabled();
    await expect(markResolved).toContainText('提交中...');

    // A1 old handler 完成时，只能清自己的旧 UI token；A2 仍必须保持真实提交态。
    releaseA1Seed();
    await expect.poll(async () => (await readSessionSnapshot(page)).writes.length).toBe(1);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    await expect(markResolved).toBeDisabled();
    await expect(markResolved).toContainText('提交中...');
    await expect(a2Dialog).toBeVisible();

    releaseA2Seed();
    await expect.poll(async () => (await readSessionSnapshot(page)).writes.length).toBe(2);
    await expect(a2Dialog).toHaveCount(0);
    await expect(page.getByText('状态已更新')).toBeVisible();
    await expect(page.getByTestId('conflict-detail-status')).toHaveText('已化解');
    await expect(page.getByTestId('conflict-timeline')).toContainText('网格员标记该纠纷已化解');
    await expect(page.getByRole('heading', { name: '已化解，转入观察', exact: true })).toBeVisible();
    expect(conflictSeedGets, 'A1/A2 seed、B/A baseline 与 A2 显式读回').toBe(5);

    const snapshot = await readSessionSnapshot(page);
    expect(snapshot.writes).toHaveLength(2);
    const finalEnvelope = JSON.parse(snapshot.writes[1]) as SessionEnvelope;
    expect(finalEnvelope.events.map((event) => ({ action: event.action, targetId: event.targetId }))).toEqual([
      { action: 'status', targetId: conflictA.id },
      { action: 'update', targetId: conflictA.id },
      { action: 'status', targetId: conflictA.id },
      { action: 'update', targetId: conflictA.id },
    ]);
    await expect(page.getByTestId('conflict-detail-error')).toHaveCount(0);
    await expect(page.getByTestId('conflict-resolve-read-failure')).toHaveCount(0);
    expect(mutations).toEqual({ requests: [], responses: [] });
  } finally {
    releaseA1Seed();
    releaseA2Seed();
  }
});

test('session 存储写失败时 fail closed：不显示成功、不产生 temp conflict', async ({ page, request }) => {
  const before = await readConflicts(request);
  const grids = await readGrids(request);
  const g1 = grids.find((item) => item.id === 'g1') ?? grids[0];
  const marker = `K02-PUB-QUOTA-${Date.now()}`;
  const mutations = trackBusinessMutations(page);

  await page.addInitScript((selection) => {
    window.localStorage.setItem('current_grid', JSON.stringify(selection));
    // sessionStorage 写入强制失败（quota/隐私模式）
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string): void {
      if (this === window.sessionStorage) {
        throw new DOMException('forced K02 quota failure', 'QuotaExceededError');
      }
      originalSetItem.call(this, key, value);
    };
  }, { id: g1.id, name: g1.name });

  await page.goto('/mobile/conflict/new');
  await expect(page.getByTestId('conflict-form')).toBeVisible();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText(g1.name);

  await page.getByTestId('conflict-description').fill(`${marker}：存储写失败用例。`);
  await page.getByTestId('conflict-title').click();
  await page.getByTestId('conflict-title').fill(`${marker} 标题`);
  await page.getByTestId('conflict-type-其他').click();
  await page.getByTestId('conflict-location').fill('海梦苑配额失败地点');
  await page.getByTestId('conflict-party-add').click();
  await page.getByTestId('conflict-party-org-org_mj').click();
  await page.getByTestId('conflict-party-confirm').click();
  await expect(page.getByTestId('conflict-submit')).toBeEnabled();
  // quota 失败时组件只记录这一条真实错误日志；仍须断言下方失败 UI 才算通过
  allowConsoleError(/^Failed to submit conflict (MobileSessionStoreError|Error): Unable to persist mobile session data/);
  await page.getByTestId('conflict-submit').click();

  // 真实失败 UI；不得显示成功、不得离开表单
  await expect(page.getByTestId('conflict-submit-error')).toBeVisible();
  await expect(page.getByText('上报成功')).toHaveCount(0);
  await expect(page).toHaveURL(/\/mobile\/conflict\/new$/);
  expect(mutations).toEqual({ requests: [], responses: [] });

  // 列表无 temp conflict；服务端 seed 不变
  await page.goto('/mobile/conflict');
  await expect(page.getByTestId('conflict-list')).toBeVisible();
  await page.getByTestId('conflict-search-input').fill(marker);
  await expect(page.getByTestId('conflict-list-empty')).toBeVisible();
  expect(await readConflicts(request)).toEqual(before);
});

test('health 失败矩阵：401/403/404/409/422/429/5xx/network 全部 blocked 且不产生 session success', async ({ page }) => {
  const scenarios: (number | 'network')[] = [401, 403, 404, 409, 422, 429, 500, 'network'];
  let currentScenario: number | 'network' = 401;
  const mutations = trackBusinessMutations(page);

  await page.route(/\/api\/health$/, async (route) => {
    if (currentScenario === 'network') {
      await route.abort('failed');
      return;
    }
    await route.fulfill({
      status: currentScenario,
      contentType: 'application/json',
      body: JSON.stringify({ detail: `forced K02 health ${currentScenario}` }),
    });
  });

  // 首个场景（401）在初始 goto 即触发 health 请求，allow 必须在 goto 前注册；
  // 后续每次 reload 会中断在途 health 请求（ERR_ABORTED），与 network 场景的 abort 一并按端点精确豁免
  allowResponse(/\/api\/health$/, [401]);
  allowConsoleError(/^Failed to load resource: the server responded with a status of 401/, /\/api\/health$/);
  allowFailure(/\/api\/health$/);

  await page.goto('/mobile/conflict/new');
  await expect(page.getByTestId('conflict-form')).toBeVisible();

  for (const scenario of scenarios) {
    currentScenario = scenario;
    if (scenario === 'network') {
      allowConsoleError(/^Failed to load resource: net::ERR_FAILED$/, /\/api\/health$/);
    } else {
      allowResponse(/\/api\/health$/, [scenario]);
      allowConsoleError(
        new RegExp(`^Failed to load resource: the server responded with a status of ${scenario}`),
        /\/api\/health$/,
      );
    }

    await page.reload();
    // blocked：sandbox notice 与表单双重 fail-closed 提示
    await expect(page.getByRole('alert').filter({ hasText: '提交功能已停用' })).toBeVisible();
    await expect(page.getByTestId('conflict-submit-blocked')).toBeVisible();
    await expect(page.getByTestId('conflict-submit')).toBeDisabled();
    // 不产生任何 session 写入与业务 mutation
    const snapshot = await readSessionSnapshot(page);
    expect(snapshot.writes).toEqual([]);
    expect(snapshot.raw).toBeNull();
    expect(mutations).toEqual({ requests: [], responses: [] });
  }
});

test('390×844：表单 Drawer 不越界、触控目标 ≥44、Escape 与焦点恢复、中文 IME 正常', async ({ page, request }) => {
  const grids = await readGrids(request);
  const g1 = grids.find((item) => item.id === 'g1') ?? grids[0];
  await page.addInitScript((selection) => {
    window.localStorage.setItem('current_grid', JSON.stringify(selection));
  }, { id: g1.id, name: g1.name });

  await page.goto('/mobile/conflict/new');
  await expect(page.getByTestId('conflict-form')).toBeVisible();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText(g1.name);

  // 无横向 overflow
  const overflow = await page.evaluate(() => {
    const frame = document.getElementById('mobile-viewport');
    return {
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      frame: frame ? frame.scrollWidth - frame.clientWidth : 0,
    };
  });
  expect(overflow.page).toBeLessThanOrEqual(0);
  expect(overflow.frame).toBeLessThanOrEqual(0);

  // 当事人 Drawer 在 390×844 内
  await page.getByTestId('conflict-party-add').click();
  const partyDrawer = page.getByTestId('conflict-party-drawer');
  await expect(partyDrawer).toBeVisible();
  const drawerBox = await settledBox(partyDrawer, 'party-drawer');
  expect(drawerBox.x).toBeGreaterThanOrEqual(0);
  expect(drawerBox.y).toBeGreaterThanOrEqual(0);
  expect(drawerBox.x + drawerBox.width).toBeLessThanOrEqual(390);
  expect(drawerBox.y + drawerBox.height).toBeLessThanOrEqual(844);

  // 中文 IME 组合态
  await page.getByTestId('conflict-party-search').click();
  await page.getByTestId('conflict-party-search').evaluate((element) => {
    const input = element as HTMLInputElement;
    input.focus();
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    input.value = '张';
    input.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: '张' }));
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '张', isComposing: true }));
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '张' }));
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '张', isComposing: false }));
  });
  await expect(page.getByTestId('conflict-party-search')).toHaveValue('张');
  await expect(page.getByTestId('conflict-party-confirm')).toContainText('确认关联 (0)');
  await page.getByTestId('conflict-party-search').fill('');

  // 居民行触控目标（宽、高均 ≥44）
  const residents = await readGridResidents(request, g1.id, 1);
  const residentRow = page.getByTestId(`conflict-party-resident-${residents[0].id}`);
  await expect(residentRow).toBeVisible();
  const residentRowBox = await residentRow.boundingBox();
  expect(residentRowBox!.width).toBeGreaterThanOrEqual(44);
  expect(residentRowBox!.height).toBeGreaterThanOrEqual(44);

  await page.keyboard.press('Escape');
  await expect(partyDrawer).toHaveCount(0);
  await expect(page.getByTestId('conflict-party-add')).toBeFocused();

  // 网格 Drawer 与 options
  await page.getByTestId('conflict-grid-trigger').click();
  const gridOption = page.getByTestId(`conflict-grid-option-${g1.id}`);
  await expect(gridOption).toBeVisible();
  const optionBox = await gridOption.boundingBox();
  expect(optionBox!.width).toBeGreaterThanOrEqual(44);
  expect(optionBox!.height).toBeGreaterThanOrEqual(44);
  // 网格 options 为原生 radio：role/name 可定位，预选 g1 为 checked
  await expect(page.getByRole('radio', { name: g1.name, exact: true })).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('conflict-grid-trigger')).toBeFocused();

  await page.screenshot({ path: '/tmp/lingang-k02-public-390-form.png' });
});

test.describe('hosted 桌面宿主', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('375×812 手机框内 Drawer 不越界、无横向 overflow', async ({ page, request }) => {
    const grids = await readGrids(request);
    const g1 = grids.find((item) => item.id === 'g1') ?? grids[0];
    await page.addInitScript((selection) => {
      window.localStorage.setItem('current_grid', JSON.stringify(selection));
    }, { id: g1.id, name: g1.name });

    await page.goto('/mobile/conflict/new');
    await expect(page.getByTestId('conflict-form')).toBeVisible();

    const frame = page.locator('#mobile-viewport');
    const frameBox = await frame.boundingBox();
    expect(frameBox).toBeTruthy();
    expect(frameBox!.width).toBeCloseTo(375, 0);
    expect(frameBox!.height).toBeCloseTo(812, 0);

    await page.getByTestId('conflict-party-add').click();
    const partyDrawer = page.getByTestId('conflict-party-drawer');
    await expect(partyDrawer).toBeVisible();
    const drawerBox = await settledBox(partyDrawer, 'party-drawer');
    expect(drawerBox.x).toBeGreaterThanOrEqual(frameBox!.x - 1);
    expect(drawerBox.y).toBeGreaterThanOrEqual(frameBox!.y - 1);
    expect(drawerBox.x + drawerBox.width).toBeLessThanOrEqual(frameBox!.x + frameBox!.width + 1);
    expect(drawerBox.y + drawerBox.height).toBeLessThanOrEqual(frameBox!.y + frameBox!.height + 1);

    const frameOverflow = await frame.evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(frameOverflow).toBeLessThanOrEqual(0);

    await page.keyboard.press('Escape');
    await expect(partyDrawer).toHaveCount(0);
    await page.screenshot({ path: '/tmp/lingang-k02-public-hosted-form.png' });
  });
});
