import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';

/**
 * K02 矛盾与网格选择 UI — enabled/api 模式验收。
 *
 * 覆盖：API 创建/列表/详情/context 真实读回、纯机构路径、当前网格居民路径、
 * 网格 loading/error/empty 与 retry、无 id/name/首项/默认地点静默兜底、
 * 切 grid 清旧居民并丢弃过期异步结果、失败矩阵不降级 session、
 * 标记化解 PATCH 失败时 dialog 内可见真实错误且状态/timeline 不变、
 * create 后 replace/back/forward 不回已提交表单、双 viewport 视觉/交互探针。
 *
 * 只使用本文件内的局部 helper 与精确 allowlist，不改动任何 fixture/config。
 */

const backendPort = Number(process.env.BACKEND_PORT ?? '8000');
const apiBaseUrl = `http://127.0.0.1:${backendPort}/api`;
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
const cleanupConflictMarkers: string[] = [];

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

// ---- seed accessors（只读 API，先断言 ok 再取数） ----

interface SeedConflict {
  id: string;
  title: string;
  status: string;
  type: string;
  gridId: string;
  location: string;
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

// enabled 创建测试共用同一 SQLite；无 DELETE API 时以 status=已化解恢复等价 active-conflict 基线。
// marker 查询放在 finally 内，即使创建后的任一断言失败，也能定位并收束已落库记录。
async function resolveActiveConflictsByMarker(request: APIRequestContext, marker: string): Promise<void> {
  const listResponse = await request.get(`${apiBaseUrl}/conflicts?limit=500`);
  if (!listResponse.ok()) {
    throw new Error(`K02 cleanup list failed: ${listResponse.status()}`);
  }
  const list = await listResponse.json() as SeedConflictList;
  const activeMatches = list.items.filter((item) => item.title.includes(marker) && item.status !== '已化解');
  for (const conflict of activeMatches) {
    const response = await request.patch(`${apiBaseUrl}/conflicts/${encodeURIComponent(conflict.id)}`, {
      data: { status: '已化解' },
    });
    if (!response.ok()) {
      throw new Error(`K02 cleanup PATCH ${conflict.id} failed: ${response.status()}`);
    }
  }
  const verifyResponse = await request.get(`${apiBaseUrl}/conflicts?limit=500`);
  if (!verifyResponse.ok()) {
    throw new Error(`K02 cleanup verify failed: ${verifyResponse.status()}`);
  }
  const verified = await verifyResponse.json() as SeedConflictList;
  const remaining = verified.items.filter((item) => item.title.includes(marker) && item.status !== '已化解');
  if (remaining.length > 0) {
    throw new Error(`K02 cleanup left active conflicts: ${remaining.map((item) => item.id).join(',')}`);
  }
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
  for (const resident of payload.items) {
    expect(resident.gridId, '居民必须属于所查网格').toBe(gridId);
  }
  return payload.items;
}

function readSessionRaw(page: Page): Promise<string | null> {
  return page.evaluate((key) => window.sessionStorage.getItem(key), mobileSessionKey);
}

test.use({ viewport: { width: 390, height: 844 } });
test.describe.configure({ retries: 0 });

// vaul Drawer / Radix Dialog 打开有位移动画：边界量测须等位移稳定（连续两次采样一致），不用固定 timeout
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

// 触控目标必须量实际可交互节点的宽和高，均 ≥44
async function expectTouchTarget(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox();
  expect(box, `${testId} 必须可量测`).toBeTruthy();
  expect(box!.width, `${testId} 宽度必须 ≥44`).toBeGreaterThanOrEqual(44);
  expect(box!.height, `${testId} 高度必须 ≥44`).toBeGreaterThanOrEqual(44);
  return box!;
}

test.beforeEach(async ({ page }) => {
  issues.length = 0;
  allowlist.length = 0;
  consoleAllowlist.length = 0;
  cleanupConflictMarkers.length = 0;
  attachIssueWatchers(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
    window.localStorage.setItem('mobile_user', 'K02 验收网格员');
  });
});

test.afterEach(async ({ request }) => {
  try {
    for (const marker of cleanupConflictMarkers) {
      await resolveActiveConflictsByMarker(request, marker);
    }
  } finally {
    expect(issues, '不得出现 console error / pageerror / 意外请求失败或 4xx/5xx').toEqual([]);
  }
});

test('api 模式：纯机构主体创建后经 API 真实读回，replace 后不回已提交表单', async ({ page, request }) => {
  const before = await readConflicts(request);
  const grids = await readGrids(request);
  const grid = grids.find((item) => item.id === 'g1') ?? grids[0];
  const marker = `K02-API-ORG-${Date.now()}`;
  cleanupConflictMarkers.push(marker);
  const mutations = trackBusinessMutations(page);

  // mobile context 提供精确 grid id：允许作为初始化预选候选
  await page.addInitScript((selection) => {
    window.localStorage.setItem('current_grid', JSON.stringify(selection));
  }, { id: grid.id, name: grid.name });

  await page.goto('/mobile/conflict');
  await expect(page.getByTestId('conflict-list')).toBeVisible();
  await expect(page.getByTestId('conflict-tab-all')).toContainText(String(before.total));

  await page.getByTestId('conflict-create-button').click();
  await expect(page).toHaveURL(/\/mobile\/conflict\/new$/);
  await expect(page.getByTestId('conflict-form')).toBeVisible();

  // 精确 id 真实存在于服务端 options → 预选当前网格
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText(grid.name);

  await page.getByTestId('conflict-description').fill(`物业巡查发现 ${marker}：地下车库杂物堆积引发邻里争议，需要现场协调。`);
  await page.getByTestId('conflict-title').click();
  await expect(page.getByTestId('conflict-title')).not.toHaveValue('');
  await page.getByTestId('conflict-title').fill(`${marker} 标题`);
  await page.getByTestId('conflict-type-物业纠纷').click();
  await page.getByTestId('conflict-location').fill('海梦苑地下车库 B2 区');

  await page.getByTestId('conflict-party-add').click();
  await expect(page.getByTestId('conflict-party-drawer')).toBeVisible();
  await page.getByTestId('conflict-party-org-org_wy').click();
  await page.getByTestId('conflict-party-confirm').click();
  await expect(page.getByTestId('conflict-party-chip-organization-org_wy')).toBeVisible();

  await expect(page.getByTestId('conflict-submit')).toBeEnabled();
  await page.getByTestId('conflict-submit').click();

  await expect(page).toHaveURL(/\/mobile\/conflict\/conflict_[0-9a-f]{12}$/);
  const createdId = page.url().split('/').pop()!;
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(`${marker} 标题`);
  await expect(page.getByTestId('conflict-timeline')).toContainText('网格员上报纠纷');
  await expect(page.getByTestId('conflict-timeline')).toContainText('K02 验收网格员');

  // 真实 API 创建且只有一次业务写
  expect(mutations).toEqual({
    requests: ['POST /api/conflicts'],
    responses: [{ request: 'POST /api/conflicts', status: 201 }],
  });
  // session store 不介入
  await expect.poll(() => readSessionRaw(page)).toBeNull();

  // API 详情真实读回
  const detailResponse = await request.get(`${apiBaseUrl}/conflicts/${createdId}`);
  expect(detailResponse.ok()).toBe(true);
  const created = await detailResponse.json() as Record<string, unknown>;
  expect(created).toMatchObject({
    id: createdId,
    title: `${marker} 标题`,
    type: '物业纠纷',
    status: '调解中',
    source: '自行发现',
    gridId: grid.id,
    location: '海梦苑地下车库 B2 区',
    images: [],
  });
  expect(created.involvedParties).toEqual([{ type: 'organization', id: 'org_wy', name: '物业公司' }]);
  expect(created.timeline).toHaveLength(1);

  // API context 真实读回
  const contextResponse = await request.get(`${apiBaseUrl}/conflicts/${createdId}/context`);
  expect(contextResponse.ok()).toBe(true);
  const contextPayload = await contextResponse.json() as {
    followUpStatus: { label: string };
    suggestedActions: string[];
    relatedPeople: unknown[];
  };
  expect(contextPayload.followUpStatus.label).toBeTruthy();
  expect(contextPayload.suggestedActions.length).toBeGreaterThan(0);
  expect(contextPayload.relatedPeople).toEqual([]);

  // 浏览器 back/forward 不得回到已提交表单
  await page.goBack();
  await expect(page).toHaveURL(/\/mobile\/conflict$/);
  expect(page.url()).not.toContain('/mobile/conflict/new');
  await page.goForward();
  await expect(page).toHaveURL(new RegExp(`/mobile/conflict/${createdId}$`));
  expect(page.url()).not.toContain('/mobile/conflict/new');

  // 列表读回：新卡片真实存在，全部计数 +1
  await page.goBack();
  await page.getByTestId('conflict-search-input').fill(marker);
  await expect(page.getByTestId(`conflict-card-${createdId}`)).toBeVisible();
  await expect(page.getByTestId('conflict-tab-all')).toContainText(String(before.total + 1));

  const after = await readConflicts(request);
  expect(after.total).toBe(before.total + 1);
});

test('api 模式：当前网格居民路径，无 id/name/首项/默认地点静默兜底', async ({ page, request }) => {
  const grids = await readGrids(request);
  const grid = grids.find((item) => item.id === 'g2') ?? grids[1] ?? grids[0];
  const residents = await readGridResidents(request, grid.id, 5);
  const resident = residents[0];
  const marker = `K02-API-RES-${Date.now()}`;
  cleanupConflictMarkers.push(marker);
  const mutations = trackBusinessMutations(page);

  // context 只有名称、没有精确 id：不得预选任何网格
  await page.addInitScript(() => {
    window.localStorage.setItem('current_grid', JSON.stringify({ name: '登州街道海梦苑社区第一网格' }));
  });

  await page.goto('/mobile/conflict/new');
  await expect(page.getByTestId('conflict-form')).toBeVisible();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText('请选择所属网格');
  // 未选择时可访问名称同时包含“所属网格”与当前值“未选择”
  await expect(page.getByRole('button', { name: '所属网格：未选择', exact: true })).toBeVisible();
  await expect(page.getByTestId('conflict-submit')).toBeDisabled();
  await expect(page.getByTestId('conflict-submit-hint')).toContainText('所属网格');

  // 显式选择网格后才加载居民
  await page.getByTestId('conflict-grid-trigger').click();
  await expect(page.getByTestId(`conflict-grid-option-${grid.id}`)).toBeVisible();
  // 网格 options 为原生 radio，可按 role/name 定位
  await expect(page.getByRole('radio', { name: grid.name, exact: true })).not.toBeChecked();
  await page.getByTestId(`conflict-grid-option-${grid.id}`).click();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText(grid.name);
  // 切换后可访问名称同步为真实网格名
  await expect(page.getByRole('button', { name: `所属网格：${grid.name}`, exact: true })).toBeVisible();

  // 选择居民前：发生地点不从居民地址/默认值静默补全
  await expect(page.getByTestId('conflict-location')).toHaveValue('');
  await page.getByTestId('conflict-party-add').click();
  await expect(page.getByTestId('conflict-party-drawer')).toBeVisible();
  await expect(page.getByTestId(`conflict-party-resident-${resident.id}`)).toBeVisible();
  await page.getByTestId(`conflict-party-resident-${resident.id}`).click();
  await page.getByTestId('conflict-party-confirm').click();

  // 只保留显式选择的居民：无首位居民补位、无自动加入
  await expect(page.getByTestId(`conflict-party-chip-resident-${resident.id}`)).toBeVisible();
  await expect(page.getByTestId('conflict-party-chips').locator('[data-testid^="conflict-party-chip-"]')).toHaveCount(1);
  await expect(page.getByTestId('conflict-location')).toHaveValue('');

  await page.getByTestId('conflict-description').fill(`${marker}：楼道堆放杂物引发通行争议。`);
  await page.getByTestId('conflict-title').click();
  await page.getByTestId('conflict-title').fill(`${marker} 标题`);
  await page.getByTestId('conflict-type-邻里纠纷').click();
  // 纠纷类型为原生 radio，可按 role/name 断言选中态
  await expect(page.getByRole('radio', { name: '邻里纠纷', exact: true })).toBeChecked();
  await page.getByTestId('conflict-location').fill('海梦苑 3 号楼 2 单元楼道');

  await expect(page.getByTestId('conflict-submit')).toBeEnabled();
  await page.getByTestId('conflict-submit').click();

  await expect(page).toHaveURL(/\/mobile\/conflict\/conflict_[0-9a-f]{12}$/);
  const createdId = page.url().split('/').pop()!;
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(`${marker} 标题`);

  const detailResponse = await request.get(`${apiBaseUrl}/conflicts/${createdId}`);
  expect(detailResponse.ok()).toBe(true);
  const created = await detailResponse.json() as Record<string, unknown>;
  expect(created.gridId).toBe(grid.id);
  expect(created.involvedParties).toEqual([{ type: 'resident', id: resident.id, name: resident.name }]);
  expect(created.location).toBe('海梦苑 3 号楼 2 单元楼道');

  expect(mutations).toEqual({
    requests: ['POST /api/conflicts'],
    responses: [{ request: 'POST /api/conflicts', status: 201 }],
  });
  await expect.poll(() => readSessionRaw(page)).toBeNull();
});

test('网格 options 的 loading/error/empty 状态禁提交并可真实重试恢复', async ({ page }) => {
  const mutations = trackBusinessMutations(page);
  let gridMode: 'error' | 'empty' | 'real' = 'error';
  // 可控 gate 暂停首个 grids 响应，制造真实 loading 窗口（不用固定 timeout 假等）
  let releaseGridGate!: () => void;
  const gridGate = new Promise<void>((resolve) => {
    releaseGridGate = resolve;
  });
  let gridGateOpen = false;
  await page.route(/\/api\/stats\/grids$/, async (route) => {
    if (!gridGateOpen) {
      await gridGate;
    }
    if (gridMode === 'error') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'forced K02 grid failure' }),
      });
      return;
    }
    if (gridMode === 'empty') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ grids: [] }),
      });
      return;
    }
    await route.continue();
  });
  allowResponse(/\/api\/stats\/grids$/, [500]);
  allowConsoleError(/^Failed to load resource: the server responded with a status of 500/, /\/api\/stats\/grids$/);

  await page.goto('/mobile/conflict/new');
  await expect(page.getByTestId('conflict-form')).toBeVisible();

  // loading：真实 loading UI 可见；禁提交；无 grid trigger、无 silent fallback、无业务 mutation
  await expect(page.getByTestId('conflict-grid-loading')).toBeVisible();
  await expect(page.getByTestId('conflict-submit')).toBeDisabled();
  await expect(page.getByTestId('conflict-grid-trigger')).toHaveCount(0);
  await expect(page.getByTestId('conflict-grid-error')).toHaveCount(0);
  await expect(page.getByTestId('conflict-grid-empty')).toHaveCount(0);
  await expect(page.getByTestId('conflict-location')).toHaveValue('');
  expect(mutations.requests).toEqual([]);

  // 释放 gate 后进入 error：明确错误态与重试，禁提交，不伪装为空、不回落首项
  gridMode = 'error';
  gridGateOpen = true;
  releaseGridGate();
  await expect(page.getByTestId('conflict-grid-error')).toBeVisible();
  await expect(page.getByTestId('conflict-grid-error').getByRole('alert')).toContainText('forced K02 grid failure');
  await expect(page.getByTestId('conflict-submit')).toBeDisabled();

  // empty：明确空态，同样禁提交
  gridMode = 'empty';
  await page.getByTestId('conflict-grid-retry').click();
  await expect(page.getByTestId('conflict-grid-empty')).toBeVisible();
  await expect(page.getByTestId('conflict-submit')).toBeDisabled();

  // 恢复后真实加载 options；无 context id → 不预选
  gridMode = 'real';
  await page.getByTestId('conflict-grid-retry').click();
  await expect(page.getByTestId('conflict-grid-trigger')).toBeVisible();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText('请选择所属网格');

  await page.getByTestId('conflict-grid-trigger').click();
  await expect(page.getByTestId('conflict-grid-option-g1')).toBeVisible();
  await page.getByTestId('conflict-grid-option-g1').click();
  await expect(page.getByTestId('conflict-grid-trigger')).not.toContainText('请选择所属网格');

  expect(mutations.requests).toEqual([]);
});

test('居民 g1→g2→g1 ABA：旧 g1 迟到响应不得覆盖第二次 g1 结果，切网格仍清居民保机构', async ({ page, request }) => {
  const grids = await readGrids(request);
  const g1 = grids.find((item) => item.id === 'g1') ?? grids[0];
  const g2 = grids.find((item) => item.id === 'g2') ?? grids[1];
  const g1Full = await readGridResidents(request, g1.id, 500);
  expect(g1Full.length, 'g1 必须有至少两名居民以区分新旧集合').toBeGreaterThan(1);
  const g1Old = g1Full[0];
  const g1New = g1Full.find((resident) => resident.id !== g1Old.id)!;

  await page.addInitScript((selection) => {
    window.localStorage.setItem('current_grid', JSON.stringify(selection));
  }, { id: g1.id, name: g1.name });

  // 真正的 ABA：第一次 g1 居民请求由 Promise gate 持有，释放后只返回“旧 g1”子集；
  // 第二次 g1 请求直通真实后端返回“新 g1”全集；g2 直通。全程无固定 timeout。
  let g1Requests = 0;
  let g1ResponsesDone = 0;
  let g2Requests = 0;
  let releaseFirstG1!: () => void;
  const firstG1Gate = new Promise<void>((resolve) => {
    releaseFirstG1 = resolve;
  });
  const g1PeoplePattern = /\/api\/people\?.*gridId=g1(?:&|$)/;
  const g2PeoplePattern = /\/api\/people\?.*gridId=g2(?:&|$)/;
  await page.route(g1PeoplePattern, async (route) => {
    g1Requests += 1;
    if (g1Requests === 1) {
      await firstG1Gate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [g1Old], total: 1 }),
      });
      g1ResponsesDone += 1;
      return;
    }
    await route.continue();
    g1ResponsesDone += 1;
  });
  await page.route(g2PeoplePattern, async (route) => {
    g2Requests += 1;
    await route.continue();
  });

  await page.goto('/mobile/conflict/new');
  await expect(page.getByTestId('conflict-form')).toBeVisible();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText(g1.name);

  // 第一次 g1 居民请求仍在 gate 中：居民保持 loading；机构可先行选择
  await page.getByTestId('conflict-party-add').click();
  await expect(page.getByTestId('conflict-residents-loading')).toBeVisible();
  await page.getByTestId('conflict-party-org-org_wy').click();
  await page.getByTestId('conflict-party-confirm').click();
  await expect(page.getByTestId('conflict-party-chip-organization-org_wy')).toBeVisible();

  // 切到 g2：立即进入新网格加载，机构保留、无跨网格居民残留
  const g2ResponseArrived = page.waitForResponse((response) => (
    g2PeoplePattern.test(response.url()) && response.request().method() === 'GET'
  ));
  await page.getByTestId('conflict-grid-trigger').click();
  await page.getByTestId(`conflict-grid-option-${g2.id}`).click();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText(g2.name);
  await expect(page.getByTestId('conflict-party-chip-organization-org_wy')).toBeVisible();
  await expect(page.getByTestId('conflict-party-chips').locator('[data-testid^="conflict-party-chip-resident-"]')).toHaveCount(0);
  await g2ResponseArrived;

  // 再切回 g1：第二次 g1 请求直通真实后端，先完成并显示“新 g1”全集
  await page.getByTestId('conflict-grid-trigger').click();
  await page.getByTestId(`conflict-grid-option-${g1.id}`).click();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText(g1.name);
  await page.getByTestId('conflict-party-add').click();
  await expect(page.getByTestId(`conflict-party-resident-${g1New.id}`)).toBeVisible();
  await expect(page.locator('[data-testid^="conflict-party-resident-"]')).toHaveCount(g1Full.length);

  // 释放第一次旧 g1：迟到响应不得覆盖“新 g1”全集
  releaseFirstG1();
  await expect.poll(() => g1ResponsesDone, '第一次旧 g1 响应必须已到达并被组件处理').toBe(2);
  await expect(page.getByTestId(`conflict-party-resident-${g1New.id}`)).toBeVisible();
  await expect(page.locator('[data-testid^="conflict-party-resident-"]')).toHaveCount(g1Full.length);
  expect(g1Requests, 'g1 居民请求必须恰为两次（ABA 各一次）').toBe(2);
  expect(g2Requests, 'g2 居民请求必须恰为一次').toBe(1);

  // 显式选择“新 g1”居民后再切 g2：立即清除居民、保留机构；确认后无残留
  await page.getByTestId(`conflict-party-resident-${g1New.id}`).click();
  await page.getByTestId('conflict-party-confirm').click();
  await expect(page.getByTestId(`conflict-party-chip-resident-${g1New.id}`)).toBeVisible();
  await expect(page.getByTestId('conflict-party-chip-organization-org_wy')).toBeVisible();

  await page.getByTestId('conflict-grid-trigger').click();
  await page.getByTestId(`conflict-grid-option-${g2.id}`).click();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText(g2.name);
  await expect(page.getByTestId(`conflict-party-chip-resident-${g1New.id}`)).toHaveCount(0);
  await expect(page.getByTestId('conflict-party-chip-organization-org_wy')).toBeVisible();
  await expect(page.getByTestId('conflict-party-chips').locator('[data-testid^="conflict-party-chip-"]')).toHaveCount(1);
});

test('mutation 失败矩阵：不降级 session、不产生 temp conflict、不显示成功', async ({ page, request }) => {
  const before = await readConflicts(request);
  const grids = await readGrids(request);
  const g1 = grids.find((item) => item.id === 'g1') ?? grids[0];
  const marker = `K02-API-FAIL-${Date.now()}`;

  await page.addInitScript((selection) => {
    window.localStorage.setItem('current_grid', JSON.stringify(selection));
  }, { id: g1.id, name: g1.name });

  const failures: { label: string; status?: number }[] = [
    { label: '401', status: 401 },
    { label: '403', status: 403 },
    { label: '404', status: 404 },
    { label: '409', status: 409 },
    { label: '422', status: 422 },
    { label: '429', status: 429 },
    { label: '500', status: 500 },
    { label: 'network' },
  ];
  let currentFailure: { status?: number } = {};
  await page.route(/\/api\/conflicts$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    if (currentFailure.status === undefined) {
      await route.abort('failed');
      return;
    }
    await route.fulfill({
      status: currentFailure.status,
      contentType: 'application/json',
      body: JSON.stringify({ detail: `forced K02 create failure ${currentFailure.status}` }),
    });
  });

  await page.goto('/mobile/conflict/new');
  await expect(page.getByTestId('conflict-form')).toBeVisible();
  await expect(page.getByTestId('conflict-grid-trigger')).toContainText(g1.name);

  await page.getByTestId('conflict-description').fill(`${marker}：失败矩阵用例描述。`);
  await page.getByTestId('conflict-title').click();
  await page.getByTestId('conflict-title').fill(`${marker} 标题`);
  await page.getByTestId('conflict-type-其他').click();
  await page.getByTestId('conflict-location').fill('海梦苑失败矩阵地点');
  await page.getByTestId('conflict-party-add').click();
  await page.getByTestId('conflict-party-org-org_jwh').click();
  await page.getByTestId('conflict-party-confirm').click();
  await expect(page.getByTestId('conflict-submit')).toBeEnabled();

  for (const failure of failures) {
    currentFailure = { status: failure.status };
    if (failure.status === undefined) {
      allowFailure(/\/api\/conflicts$/);
      allowConsoleError(/^Failed to load resource: net::ERR_FAILED$/, /\/api\/conflicts$/);
      allowConsoleError(/^Failed to submit conflict TypeError: Failed to fetch/);
    } else {
      allowResponse(/\/api\/conflicts$/, [failure.status]);
      allowConsoleError(
        new RegExp(`^Failed to load resource: the server responded with a status of ${failure.status}`),
        /\/api\/conflicts$/,
      );
      allowConsoleError(
        new RegExp(`^Failed to submit conflict Error: API ${failure.status}: \\{"detail":"forced K02 create failure ${failure.status}"\\}`),
      );
    }

    await page.getByTestId('conflict-submit').click();
    // 必须显示真实失败 UI
    await expect(page.getByTestId('conflict-submit-error')).toBeVisible();
    // inline role=alert 已完整承载错误；不得再堆叠会遮挡提交按钮的重复 toast。
    await expect(page.getByText('上报失败', { exact: true })).toHaveCount(0);
    if (failure.status !== undefined) {
      await expect(page.getByTestId('conflict-submit-error')).toContainText(`API ${failure.status}`);
    }
    // 不得显示成功、不得离开表单
    await expect(page.getByText('上报成功')).toHaveCount(0);
    await expect(page).toHaveURL(/\/mobile\/conflict\/new$/);
    // 不得转存 session
    await expect.poll(() => readSessionRaw(page)).toBeNull();
  }

  // 服务端没有任何新增
  const after = await readConflicts(request);
  expect(after.total).toBe(before.total);

  // 列表也不存在 temp/新增记录
  await page.goto('/mobile/conflict');
  await expect(page.getByTestId('conflict-list')).toBeVisible();
  await page.getByTestId('conflict-search-input').fill(marker);
  await expect(page.getByTestId('conflict-list-empty')).toBeVisible();
});

test('标记化解 PATCH 500：dialog 保持打开、dialog 内真实错误可见、状态与 timeline 不变', async ({ page, request }) => {
  const all = await readConflicts(request);
  const target = all.items.find((item) => item.status === '调解中');
  expect(target, 'seed 必须包含调解中纠纷').toBeTruthy();
  const targetId = target!.id;

  // 服务端基线：状态与 timeline 原样记录，用于事后比对
  const beforeResponse = await request.get(`${apiBaseUrl}/conflicts/${targetId}`);
  expect(beforeResponse.ok()).toBe(true);
  const beforeDetail = await beforeResponse.json() as { status: string; timeline: unknown[] };
  expect(beforeDetail.status).toBe('调解中');

  // 精确 intercept 该案件 PATCH 为 500；GET 详情/context 不受影响
  const patchPath = new RegExp(`/api/conflicts/${targetId}$`);
  await page.route(patchPath, async (route) => {
    if (route.request().method() !== 'PATCH') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'forced K02 resolve failure' }),
    });
  });
  // 精确 endpoint+status/console allowlist；仅豁免人为注入的失败，
  // 不据此判定通过——下方失败 UI 与不变状态才是断言主体
  allowResponse(patchPath, [500]);
  allowConsoleError(/^Failed to load resource: the server responded with a status of 500/, patchPath);
  allowConsoleError(/^Failed to mark conflict resolved Error: API 500: \{"detail":"forced K02 resolve failure"\}/);

  const mutations = trackBusinessMutations(page);

  await page.goto(`/mobile/conflict/${targetId}`);
  await expect(page.getByTestId('conflict-detail')).toBeVisible();
  await expect(page.getByTestId('conflict-detail-status')).toHaveText('调解中');
  const timelineBefore = await page.getByTestId('conflict-timeline').innerText();

  await page.getByTestId('conflict-mark-resolved').click();
  const dialog = page.getByTestId('conflict-resolve-dialog');
  await expect(dialog).toBeVisible();
  await page.getByTestId('conflict-resolve-confirm').click();

  // PATCH 500 后 dialog 保持打开，真实错误在 dialog 内以 role=alert 可见
  await expect(dialog).toBeVisible();
  const dialogError = dialog.getByTestId('conflict-resolve-error');
  await expect(dialogError).toBeVisible();
  await expect(dialog.getByRole('alert')).toContainText('API 500');

  // 无成功 toast；状态仍为调解中；timeline 未新增“已化解”记录
  await expect(page.getByText('状态已更新')).toHaveCount(0);
  await expect(page.getByTestId('conflict-detail-status')).toHaveText('调解中');
  await expect(page.getByTestId('conflict-timeline')).not.toContainText('已化解');
  expect(await page.getByTestId('conflict-timeline').innerText()).toBe(timelineBefore);

  // 不产生 session fallback
  await expect.poll(() => readSessionRaw(page)).toBeNull();

  // 取消关闭后清错误；重开 dialog 无残留
  await page.getByTestId('conflict-resolve-cancel').click();
  await expect(dialog).toHaveCount(0);
  await page.getByTestId('conflict-mark-resolved').click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('conflict-resolve-error')).toHaveCount(0);
  await page.getByTestId('conflict-resolve-cancel').click();

  // 服务端状态与 timeline 未变；唯一业务请求是被 mock 的失败 PATCH
  const afterResponse = await request.get(`${apiBaseUrl}/conflicts/${targetId}`);
  expect(afterResponse.ok()).toBe(true);
  const afterDetail = await afterResponse.json() as { status: string; timeline: unknown[] };
  expect(afterDetail.status).toBe(beforeDetail.status);
  expect(afterDetail.timeline).toEqual(beforeDetail.timeline);
  expect(mutations).toEqual({
    requests: [`PATCH /api/conflicts/${targetId}`],
    responses: [{ request: `PATCH /api/conflicts/${targetId}`, status: 500 }],
  });
});

test('mutation A 未完成时同组件切到 B：A 完成不得读取、落地、提示或锁定 B', async ({ page, request }) => {
  const all = await readConflicts(request);
  const processing = all.items.filter((item) => item.status === '调解中' && item.id !== 'c_hero_001');
  expect(processing.length, 'seed 必须至少提供两个非视觉探针案件的调解中纠纷').toBeGreaterThanOrEqual(2);
  const [conflictA, conflictB] = processing;

  let releaseMutationA!: () => void;
  const mutationAGate = new Promise<void>((resolve) => {
    releaseMutationA = resolve;
  });
  let markMutationAStarted!: () => void;
  const mutationAStarted = new Promise<void>((resolve) => {
    markMutationAStarted = resolve;
  });
  let mutationARequests = 0;
  let conflictAReadsAfterMutationStarted = 0;
  const conflictAPath = new RegExp(`/api/conflicts/${conflictA.id}$`);
  await page.route(conflictAPath, async (route) => {
    if (route.request().method() === 'GET') {
      if (mutationARequests > 0) {
        conflictAReadsAfterMutationStarted += 1;
      }
      await route.continue();
      return;
    }
    if (route.request().method() !== 'PATCH') {
      await route.continue();
      return;
    }
    mutationARequests += 1;
    markMutationAStarted();
    await mutationAGate;
    // mutation 返回成功即可复现组件代次；不写测试数据库，避免污染后续视觉探针。
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: conflictA.id, status: '已化解' }),
    });
  });

  let releaseFirstBRead!: () => void;
  const firstBReadGate = new Promise<void>((resolve) => {
    releaseFirstBRead = resolve;
  });
  let markFirstBReadStarted!: () => void;
  const firstBReadStarted = new Promise<void>((resolve) => {
    markFirstBReadStarted = resolve;
  });
  let conflictBReads = 0;
  const conflictBPath = new RegExp(`/api/conflicts/${conflictB.id}$`);
  await page.route(conflictBPath, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    conflictBReads += 1;
    if (conflictBReads === 1) {
      markFirstBReadStarted();
      await firstBReadGate;
      await route.continue();
      return;
    }
    // 任何第二个 B GET 都只能来自 A 完成后的错误读回；精确失败使错误锁可观察。
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'forced K02 stale mutation B read' }),
    });
  });
  allowResponse(conflictBPath, [500]);
  allowConsoleError(/^Failed to load resource: the server responded with a status of 500/, conflictBPath);
  allowConsoleError(/^Failed to reload conflict detail after mutation/);

  const mutations = trackBusinessMutations(page);
  await page.goto(`/mobile/conflict/${conflictA.id}`);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);
  await page.getByTestId('conflict-mark-resolved').click();
  await page.getByTestId('conflict-resolve-confirm').click();
  await mutationAStarted;

  // 构造真实 popstate；MobileApp 会在同一树位置复用 MobileConflictDetail，仅替换 id prop。
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
  await expect(page).toHaveURL(new RegExp(`/mobile/conflict/${conflictB.id}$`));
  await firstBReadStarted;
  expect(conflictBReads).toBe(1);

  const mutationAResponse = page.waitForResponse((response) => (
    conflictAPath.test(response.url()) && response.request().method() === 'PATCH'
  ));
  releaseMutationA();
  await expect((await mutationAResponse).status()).toBe(200);
  // 等两个渲染帧，让 A 的 async continuation 有机会完成；不用固定 timeout。
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
  releaseFirstBRead();

  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictB.title);
  await expect(page.getByTestId('conflict-mark-resolved')).toBeEnabled();
  expect(mutationARequests).toBe(1);
  expect(conflictAReadsAfterMutationStarted, 'PATCH 开始后不得再为旧案件 A 发详情 GET').toBe(0);
  expect(conflictBReads, 'B 只能有自身路由变化触发的一次正常详情读取').toBe(1);
  await expect(page.getByText('状态已更新')).toHaveCount(0);
  await expect(page.getByTestId('conflict-resolve-read-failure')).toHaveCount(0);
  await expect(page.getByTestId('conflict-resolve-dialog')).toHaveCount(0);
  expect(mutations).toEqual({
    requests: [`PATCH /api/conflicts/${conflictA.id}`],
    responses: [{ request: `PATCH /api/conflicts/${conflictA.id}`, status: 200 }],
  });
});

test('A 写成功读回失败后切到 B：A Dialog、disabled 与 readFailure 锁必须按 id 清除', async ({ page, request }) => {
  const all = await readConflicts(request);
  const processing = all.items.filter((item) => item.status === '调解中' && item.id !== 'c_hero_001');
  expect(processing.length, 'seed 必须至少提供两个非视觉探针案件的调解中纠纷').toBeGreaterThanOrEqual(2);
  const [conflictA, conflictB] = processing;
  const conflictAPath = new RegExp(`/api/conflicts/${conflictA.id}$`);
  let patchSucceeded = false;
  let failedReadbacks = 0;
  await page.route(conflictAPath, async (route) => {
    if (route.request().method() === 'PATCH') {
      patchSucceeded = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: conflictA.id, status: '已化解' }),
      });
      return;
    }
    if (route.request().method() === 'GET' && patchSucceeded) {
      failedReadbacks += 1;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'forced K02 A readback failure before route B' }),
      });
      return;
    }
    await route.continue();
  });
  allowResponse(conflictAPath, [500]);
  allowConsoleError(/^Failed to load resource: the server responded with a status of 500/, conflictAPath);
  allowConsoleError(/^Failed to reload conflict detail after mutation/);

  await page.goto(`/mobile/conflict/${conflictA.id}`);
  await expect(page.getByTestId('conflict-detail-title')).toHaveText(conflictA.title);
  await page.getByTestId('conflict-mark-resolved').click();
  const dialogA = page.getByTestId('conflict-resolve-dialog');
  await page.getByTestId('conflict-resolve-confirm').click();
  await expect(dialogA.getByTestId('conflict-resolve-read-failure')).toBeVisible();
  await expect(page.getByTestId('conflict-resolve-confirm')).toBeDisabled();
  expect(failedReadbacks).toBe(1);

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
  await expect(page.getByTestId('conflict-resolve-dialog')).toHaveCount(0);
  await expect(page.getByTestId('conflict-resolve-read-failure')).toHaveCount(0);
  await expect(page.getByText('状态已更新')).toHaveCount(0);

  // B 可独立打开并操作自己的 Dialog，不受 A 的 disabled/readFailure 锁影响。
  await page.getByTestId('conflict-mark-resolved').click();
  const dialogB = page.getByTestId('conflict-resolve-dialog');
  await expect(dialogB).toBeVisible();
  await expect(page.getByTestId('conflict-resolve-confirm')).toBeEnabled();
  await expect(dialogB.getByTestId('conflict-resolve-read-failure')).toHaveCount(0);
  await page.getByTestId('conflict-resolve-cancel').click();
  await expect(dialogB).toHaveCount(0);
});

test('列表 error 不伪装为空且可重试；详情往返后 tab/搜索状态保持', async ({ page, request }) => {
  const all = await readConflicts(request);
  const resolved = all.items.find((item) => item.status === '已化解');
  expect(resolved, 'seed 必须包含已化解纠纷').toBeTruthy();

  let failList = true;
  await page.route(/\/api\/conflicts\?/, async (route) => {
    if (failList) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'forced K02 list failure' }),
      });
      return;
    }
    await route.continue();
  });
  // 响应监听器按 pathname 匹配（不含 query），allow 规则同样按 pathname 书写
  allowResponse(/\/api\/conflicts$/, [500]);
  allowConsoleError(/^Failed to load resource: the server responded with a status of 500/, /\/api\/conflicts\?/);
  allowConsoleError(/^Failed to load conflicts Error: API 500: \{"detail":"forced K02 list failure"\}/);

  await page.goto('/mobile/conflict');
  // error 不得伪装为空列表
  await expect(page.getByTestId('conflict-list-error')).toBeVisible();
  await expect(page.getByTestId('conflict-list-error').getByRole('alert')).toContainText('forced K02 list failure');
  await expect(page.getByTestId('conflict-list-empty')).toHaveCount(0);

  failList = false;
  await page.getByTestId('conflict-list-retry').click();
  await expect(page.getByTestId('conflict-list')).toBeVisible();
  await expect(page.getByTestId('conflict-tab-all')).toContainText(String(all.total));

  // 进入详情并返回后，来源 tab 与搜索词保持
  const keyword = resolved!.title.slice(0, 6);
  await page.getByTestId('conflict-tab-resolved').click();
  await expect(page.getByTestId('conflict-tab-resolved')).toHaveAttribute('data-state', 'active');
  await page.getByTestId('conflict-search-input').fill(keyword);
  await expect(page.getByTestId(`conflict-card-${resolved!.id}`)).toBeVisible();

  await page.getByTestId(`conflict-card-${resolved!.id}`).click();
  await expect(page).toHaveURL(new RegExp(`/mobile/conflict/${resolved!.id}$`));
  await expect(page.getByTestId('conflict-detail')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/mobile\/conflict$/);
  await expect(page.getByTestId('conflict-tab-resolved')).toHaveAttribute('data-state', 'active');
  await expect(page.getByTestId('conflict-search-input')).toHaveValue(keyword);
  await expect(page.getByTestId(`conflict-card-${resolved!.id}`)).toBeVisible();
});

test('390×844 直接 viewport：列表/详情无横向 overflow，触控目标 ≥44，Dialog/Escape/焦点恢复完整', async ({ page }) => {
  await page.goto('/mobile/conflict');
  await expect(page.getByTestId('conflict-list')).toBeVisible();

  // 无横向 overflow（页面与手机容器两层）
  const overflow = await page.evaluate(() => {
    const frame = document.getElementById('mobile-viewport');
    return {
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      frame: frame ? frame.scrollWidth - frame.clientWidth : 0,
    };
  });
  expect(overflow.page).toBeLessThanOrEqual(0);
  expect(overflow.frame).toBeLessThanOrEqual(0);

  // 列表触控目标：量实际 focusable 节点，宽与高均 ≥44
  await expectTouchTarget(page, 'conflict-search-input');
  await expectTouchTarget(page, 'conflict-create-button');
  await expectTouchTarget(page, 'conflict-tab-all');
  await expectTouchTarget(page, 'conflict-card-c_hero_001');

  await page.screenshot({ path: '/tmp/lingang-k02-enabled-390-list.png' });

  // 详情 GET 由 Promise gate 持有：loading 的 role=status 必须有可宣布中文文字，不得只剩旋转图标
  let releaseDetailGate!: () => void;
  const detailGate = new Promise<void>((resolve) => {
    releaseDetailGate = resolve;
  });
  await page.route(/\/api\/conflicts\/c_hero_001$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await detailGate;
    await route.continue();
  });

  // 详情：动作按钮与关联对象触控目标
  await page.getByTestId('conflict-card-c_hero_001').click();
  const detailLoading = page.getByTestId('conflict-detail-loading');
  await expect(detailLoading).toBeVisible();
  // role=status 内必须有可宣布中文文字，不得只剩旋转图标
  await expect(detailLoading).toHaveAttribute('role', 'status');
  await expect(detailLoading).toContainText('正在加载矛盾详情');
  releaseDetailGate();
  await expect(page.getByTestId('conflict-detail')).toBeVisible();

  // 列表进入详情后，重新检测 document 与手机框横向 overflow
  const detailOverflow = await page.evaluate(() => {
    const frame = document.getElementById('mobile-viewport');
    return {
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      frame: frame ? frame.scrollWidth - frame.clientWidth : 0,
    };
  });
  expect(detailOverflow.page).toBeLessThanOrEqual(0);
  expect(detailOverflow.frame).toBeLessThanOrEqual(0);

  await expectTouchTarget(page, 'conflict-add-progress');
  await expectTouchTarget(page, 'conflict-mark-resolved');
  const relatedPerson = page.getByTestId('conflict-related-person-p_hero_010');
  await expect(relatedPerson).toBeVisible();
  const relatedBox = await relatedPerson.boundingBox();
  expect(relatedBox!.width).toBeGreaterThanOrEqual(44);
  expect(relatedBox!.height).toBeGreaterThanOrEqual(44);

  // Dialog：标题/说明/初始焦点/Escape/关闭后焦点恢复
  await page.getByTestId('conflict-add-progress').click();
  const dialog = page.getByTestId('conflict-progress-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: '添加调解进展' })).toBeVisible();
  await expect(dialog.getByText('记录最新的调解情况、走访结果或下一步安排，提交后将写入处理进度。')).toBeVisible();
  // Dialog 不越出 390×844
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).toBeTruthy();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(390);
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(844);
  // 初始焦点在 Dialog 内
  await expect.poll(() => page.evaluate(() => {
    const active = document.activeElement;
    const dialogEl = document.querySelector('[data-testid="conflict-progress-dialog"]');
    return Boolean(dialogEl && active && dialogEl.contains(active));
  })).toBe(true);

  // 中文关闭按钮：role/name 定位且宽、高均 ≥44；shared primitive 默认英文 Close 不得继续暴露
  const progressClose = dialog.getByRole('button', { name: '关闭添加调解进展对话框', exact: true });
  await expect(progressClose).toBeVisible();
  const progressCloseBox = await progressClose.boundingBox();
  expect(progressCloseBox!.width).toBeGreaterThanOrEqual(44);
  expect(progressCloseBox!.height).toBeGreaterThanOrEqual(44);
  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toHaveCount(0);

  await page.getByTestId('conflict-progress-input').fill('K02 探针进展记录');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  // Escape 关闭后焦点恢复触发按钮；输入未提交，timeline 不出现该内容
  await expect(page.getByTestId('conflict-add-progress')).toBeFocused();
  await expect(page.getByTestId('conflict-timeline')).not.toContainText('K02 探针进展记录');

  // 标记化解 Dialog：中文关闭按钮点击关闭，焦点恢复触发按钮
  await page.getByTestId('conflict-mark-resolved').click();
  const resolveDialog = page.getByTestId('conflict-resolve-dialog');
  await expect(resolveDialog).toBeVisible();
  const resolveClose = resolveDialog.getByRole('button', { name: '关闭标记已化解对话框', exact: true });
  await expect(resolveClose).toBeVisible();
  const resolveCloseBox = await resolveClose.boundingBox();
  expect(resolveCloseBox!.width).toBeGreaterThanOrEqual(44);
  expect(resolveCloseBox!.height).toBeGreaterThanOrEqual(44);
  await expect(resolveDialog.getByRole('button', { name: 'Close', exact: true })).toHaveCount(0);
  await resolveClose.click();
  await expect(resolveDialog).toHaveCount(0);
  await expect(page.getByTestId('conflict-mark-resolved')).toBeFocused();

  await page.screenshot({ path: '/tmp/lingang-k02-enabled-390-detail.png' });

  // not-found 与 error 分离：不存在 id → not-found UI，而不是网络错误
  allowResponse(/\/api\/conflicts\/no-such-conflict$/, [404]);
  allowConsoleError(
    /^Failed to load resource: the server responded with a status of 404/,
    /\/api\/conflicts\/no-such-conflict$/,
  );
  await page.goto('/mobile/conflict/no-such-conflict');
  await expect(page.getByTestId('conflict-detail-not-found')).toBeVisible();
  await expect(page.getByTestId('conflict-detail-error')).toHaveCount(0);
  await page.getByRole('button', { name: '返回' }).click();
  await expect(page).toHaveURL(/\/mobile\/conflict$/);
});

test.describe('hosted 桌面宿主', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('375×812 手机框内 Drawer 不越界，触控目标 ≥44，键盘/Escape/中文 IME 正常', async ({ page, request }) => {
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

    const expectInsideFrame = async (box: { x: number; y: number; width: number; height: number }, label: string) => {
      expect(box.x, `${label} 左缘越界`).toBeGreaterThanOrEqual(frameBox!.x - 1);
      expect(box.y, `${label} 上缘越界`).toBeGreaterThanOrEqual(frameBox!.y - 1);
      expect(box.x + box.width, `${label} 右缘越界`).toBeLessThanOrEqual(frameBox!.x + frameBox!.width + 1);
      expect(box.y + box.height, `${label} 下缘越界`).toBeLessThanOrEqual(frameBox!.y + frameBox!.height + 1);
    };

    // 当事人 Drawer 不越出 375×812
    await page.getByTestId('conflict-party-add').click();
    const partyDrawer = page.getByTestId('conflict-party-drawer');
    await expect(partyDrawer).toBeVisible();
    const partyDrawerBox = await settledBox(partyDrawer, 'party-drawer');
    await expectInsideFrame(partyDrawerBox, 'party-drawer');

    // 中文 IME 组合态：composition 未结束不得破坏输入，也不得自动加入当事人
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

    // Drawer 内触控目标（机构行宽、高均 ≥44）
    const orgRowBox = await page.getByTestId('conflict-party-org-org_wy').boundingBox();
    expect(orgRowBox!.width).toBeGreaterThanOrEqual(44);
    expect(orgRowBox!.height).toBeGreaterThanOrEqual(44);

    // Escape 关闭 Drawer 并恢复焦点到触发按钮
    await page.keyboard.press('Escape');
    await expect(partyDrawer).toHaveCount(0);
    await expect(page.getByTestId('conflict-party-add')).toBeFocused();

    // 网格 Drawer 不越界；options 真实数量与 seed 一致
    await page.getByTestId('conflict-grid-trigger').click();
    const gridDrawer = page.getByRole('dialog');
    await expect(gridDrawer).toBeVisible();
    const gridDrawerBox = await settledBox(gridDrawer, 'grid-drawer');
    await expectInsideFrame(gridDrawerBox, 'grid-drawer');
    await expect(page.locator('[data-testid^="conflict-grid-option-"]')).toHaveCount(grids.length);
    // 网格 options 为原生 radio：role/name 可定位，预选 g1 为 checked
    await expect(gridDrawer.getByRole('radio', { name: g1.name, exact: true })).toBeChecked();
    const gridOptionBox = await page.getByTestId(`conflict-grid-option-${g1.id}`).boundingBox();
    expect(gridOptionBox!.width).toBeGreaterThanOrEqual(44);
    expect(gridOptionBox!.height).toBeGreaterThanOrEqual(44);
    expect(grids.length, '网格键盘探针至少需要两个真实 option').toBeGreaterThan(1);
    const g1Index = grids.findIndex((grid) => grid.id === g1.id);
    const nextGrid = grids[(g1Index + 1) % grids.length];
    const firstGrid = grids[0];
    const lastGrid = grids[grids.length - 1];

    // Arrow：原生 radio 从当前项移动并选择下一项，Drawer 收束且 trigger 名称同步。
    await gridDrawer.getByRole('radio', { name: g1.name, exact: true }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(gridDrawer).toHaveCount(0);
    await expect(page.getByRole('button', { name: `所属网格：${nextGrid.name}`, exact: true })).toBeFocused();

    // Space：重新打开后聚焦未选 g1，Space 真实选择并收束。
    await page.getByTestId('conflict-grid-trigger').click();
    await page.getByRole('radio', { name: g1.name, exact: true }).focus();
    await page.keyboard.press('Space');
    await expect(gridDrawer).toHaveCount(0);
    await expect(page.getByRole('button', { name: `所属网格：${g1.name}`, exact: true })).toBeFocused();

    // End/Home：保留首尾键模型；每次选择后 Drawer 收束并恢复 trigger 焦点。
    await page.getByTestId('conflict-grid-trigger').click();
    await page.getByRole('radio', { name: g1.name, exact: true }).focus();
    await page.keyboard.press('End');
    await expect(gridDrawer).toHaveCount(0);
    await expect(page.getByRole('button', { name: `所属网格：${lastGrid.name}`, exact: true })).toBeFocused();

    await page.getByTestId('conflict-grid-trigger').click();
    await page.getByRole('radio', { name: lastGrid.name, exact: true }).focus();
    await page.keyboard.press('Home');
    await expect(gridDrawer).toHaveCount(0);
    await expect(page.getByRole('button', { name: `所属网格：${firstGrid.name}`, exact: true })).toBeFocused();

    // 表单触控目标（宽、高均 ≥44）
    await expectTouchTarget(page, 'conflict-description');
    await expectTouchTarget(page, 'conflict-title');
    await expectTouchTarget(page, 'conflict-type-邻里纠纷');
    await expectTouchTarget(page, 'conflict-grid-trigger');
    await expectTouchTarget(page, 'conflict-location');
    await expectTouchTarget(page, 'conflict-party-add');
    await expectTouchTarget(page, 'conflict-submit');

    // 键盘 tab 顺序：返回 → 描述 → 标题 → 类型 radio
    await page.getByTestId('conflict-description').click();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: '返回', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('conflict-description')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('conflict-title')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: '邻里纠纷', exact: true })).toBeFocused();
    // 焦点可见：focus-visible 环呈现在包裹原生 radio 的 label 上（以 box-shadow 呈现）
    const focusRingVisible = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      const target = active?.closest('label') ?? active;
      if (!target) {
        return false;
      }
      const style = window.getComputedStyle(target);
      return style.boxShadow !== 'none' || style.outlineStyle !== 'none';
    });
    expect(focusRingVisible).toBe(true);

    // 原生 radio 键盘模型：Arrow 键移动并选中、Space 选中聚焦项，不得只 click
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: '家庭纠纷', exact: true })).toBeFocused();
    await expect(page.getByRole('radio', { name: '家庭纠纷', exact: true })).toBeChecked();
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('radio', { name: '邻里纠纷', exact: true })).toBeChecked();
    await page.getByRole('radio', { name: '其他', exact: true }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('radio', { name: '其他', exact: true })).toBeChecked();

    // 手机框内无横向 overflow
    const frameOverflow = await frame.evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(frameOverflow).toBeLessThanOrEqual(0);

    await page.screenshot({ path: '/tmp/lingang-k02-enabled-hosted-form.png' });
  });

  test('375×812 手机框内实测详情页：两个 Dialog 与 overlay 不越框，中文关闭/Escape/焦点恢复', async ({ page }) => {
    await page.goto('/mobile/conflict/c_hero_001');
    await expect(page.getByTestId('conflict-detail')).toBeVisible();

    const frame = page.locator('#mobile-viewport');
    const frameBox = await frame.boundingBox();
    expect(frameBox).toBeTruthy();
    expect(frameBox!.width).toBeCloseTo(375, 0);
    expect(frameBox!.height).toBeCloseTo(812, 0);

    const expectInsideFrame = async (box: { x: number; y: number; width: number; height: number }, label: string) => {
      expect(box.x, `${label} 左缘越界`).toBeGreaterThanOrEqual(frameBox!.x - 1);
      expect(box.y, `${label} 上缘越界`).toBeGreaterThanOrEqual(frameBox!.y - 1);
      expect(box.x + box.width, `${label} 右缘越界`).toBeLessThanOrEqual(frameBox!.x + frameBox!.width + 1);
      expect(box.y + box.height, `${label} 下缘越界`).toBeLessThanOrEqual(frameBox!.y + frameBox!.height + 1);
    };

    // 详情页 document 与手机框均无横向 overflow
    const detailOverflow = await page.evaluate(() => {
      const frameEl = document.getElementById('mobile-viewport');
      return {
        page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        frame: frameEl ? frameEl.scrollWidth - frameEl.clientWidth : 0,
      };
    });
    expect(detailOverflow.page).toBeLessThanOrEqual(0);
    expect(detailOverflow.frame).toBeLessThanOrEqual(0);

    const overlay = page.locator('#mobile-viewport .bg-overlay');

    // 添加进展 Dialog：Dialog 与 overlay 均不越手机框四边；Escape 关闭并恢复焦点
    await page.getByTestId('conflict-add-progress').click();
    const progressDialog = page.getByTestId('conflict-progress-dialog');
    await expect(progressDialog).toBeVisible();
    const progressDialogBox = await settledBox(progressDialog, 'progress-dialog');
    await expectInsideFrame(progressDialogBox, 'progress-dialog');
    await expect(overlay).toBeVisible();
    const progressOverlayBox = await overlay.boundingBox();
    expect(progressOverlayBox).toBeTruthy();
    await expectInsideFrame(progressOverlayBox!, 'progress-overlay');
    const progressClose = progressDialog.getByRole('button', { name: '关闭添加调解进展对话框', exact: true });
    const progressCloseBox = await progressClose.boundingBox();
    expect(progressCloseBox!.width).toBeGreaterThanOrEqual(44);
    expect(progressCloseBox!.height).toBeGreaterThanOrEqual(44);
    await expect(progressDialog.getByRole('button', { name: 'Close', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(progressDialog).toHaveCount(0);
    await expect(page.getByTestId('conflict-add-progress')).toBeFocused();

    // 标记化解 Dialog：Dialog 与 overlay 均不越手机框四边；中文关闭按钮关闭并恢复焦点
    await page.getByTestId('conflict-mark-resolved').click();
    const resolveDialog = page.getByTestId('conflict-resolve-dialog');
    await expect(resolveDialog).toBeVisible();
    const resolveDialogBox = await settledBox(resolveDialog, 'resolve-dialog');
    await expectInsideFrame(resolveDialogBox, 'resolve-dialog');
    const resolveOverlayBox = await overlay.boundingBox();
    expect(resolveOverlayBox).toBeTruthy();
    await expectInsideFrame(resolveOverlayBox!, 'resolve-overlay');
    const resolveClose = resolveDialog.getByRole('button', { name: '关闭标记已化解对话框', exact: true });
    const resolveCloseBox = await resolveClose.boundingBox();
    expect(resolveCloseBox!.width).toBeGreaterThanOrEqual(44);
    expect(resolveCloseBox!.height).toBeGreaterThanOrEqual(44);
    await expect(resolveDialog.getByRole('button', { name: 'Close', exact: true })).toHaveCount(0);
    await resolveClose.click();
    await expect(resolveDialog).toHaveCount(0);
    await expect(page.getByTestId('conflict-mark-resolved')).toBeFocused();

    await page.screenshot({ path: '/tmp/lingang-k02-enabled-hosted-detail.png' });
  });
});
