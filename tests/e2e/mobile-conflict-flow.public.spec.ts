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
  return /^\/api\/(people|houses|visits|conflicts)(?:\/|$)/.test(pathname);
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

test('public：health 确认为 readonly，sandbox notice 可见', async ({ page, request }) => {
  const health = await request.get(`${apiBaseUrl}/health`);
  expect(health.status()).toBe(200);
  expect(health.headers()['cache-control']).toBe('no-store');
  await expect(health.json()).resolves.toMatchObject({ status: 'ok', demo_write_mode: 'readonly' });

  const mutations = trackBusinessMutations(page);
  await page.goto('/mobile/conflict');
  await expect(page.getByTestId('conflict-list')).toBeVisible();
  await expect(page.getByText('仅本次浏览会话可见，不写入服务器。')).toBeVisible();
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

  // 居民行触控目标
  const residents = await readGridResidents(request, g1.id, 1);
  const residentRow = page.getByTestId(`conflict-party-resident-${residents[0].id}`);
  await expect(residentRow).toBeVisible();
  const residentRowBox = await residentRow.boundingBox();
  expect(residentRowBox!.height).toBeGreaterThanOrEqual(44);

  await page.keyboard.press('Escape');
  await expect(partyDrawer).toHaveCount(0);
  await expect(page.getByTestId('conflict-party-add')).toBeFocused();

  // 网格 Drawer 与 options
  await page.getByTestId('conflict-grid-trigger').click();
  const gridOption = page.getByTestId(`conflict-grid-option-${g1.id}`);
  await expect(gridOption).toBeVisible();
  const optionBox = await gridOption.boundingBox();
  expect(optionBox!.height).toBeGreaterThanOrEqual(44);
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
