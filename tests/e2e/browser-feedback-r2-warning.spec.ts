import { expect, test, type Page } from '@playwright/test';

/**
 * K5 预警热区重设计验收（browser-feedback-r2，合同 AC-02~AC-05）。
 *
 * 覆盖口径（全部为实际 bounding box / scroll / focus 行为，不查 class 字符串）：
 *  1. 1608x1324（≥1536）：workspace 双列 2fr/1fr、rail Card sticky、列表内部有界滚动、
 *     统计卡 6 列、无横向溢出；落 K5-warning-1608x1324.png 与 K5-warning-1608-scrolled.png。
 *  2. 1507/1440/1024（<1536）：rail 布局不误触发——rail 非 sticky、矩阵在前清单在后的
 *     文档序堆叠、无横向溢出（矩阵列数由 warning-zones.spec.ts 既有断言锁定，不重复）。
 *  3. 390x844：统计卡 2 列、矩阵 1 列、导出按钮折行占满、rail 堆叠、无横向溢出；
 *     落 K5-warning-390x844.png。
 *  4. severity 多通道：板与清单条目同时具备等级文字 + 徽章图标（aria-hidden）+ 左侧
 *     accent（borderLeftWidth/Color 按档位分色）。
 *  5. error/retry：API 全挂 → ErrorState（页头保持）→ 重试恢复真实数据。
 *  6. 空态：筛选无命中 → 清单 EmptyState；grids 为空 → 矩阵 EmptyState。
 *  7. keyboard/focus：Tab 序 类型→…→ZoneBoard→rail 滚动区→查看详情；focus-visible
 *     轮廓（板 outline、rail ring）真实出现在 document.activeElement 上。
 *  8. reduced-motion：全局压平，板面无持久 transition。
 *
 * mock 面与 warning-zones.spec.ts 同形（仅 GET：grids/people/houses/visits/conflicts/
 * task-rules/projection）。fixture 为本文件自建的确定性测试替身：g_red(严重)、
 * g_amber(中等)、g_blue/g_calm(轻微) + 10 个填充网格垫高页面以验证 sticky；
 * 数值仅服务布局/状态断言，不是 K4 §11 推演值，也不是数据真值。
 * 注：网格名不含「第…网格」字样——parseGridHierarchy 的 fallback 分支对「第」字名
 * 会产出「第undefined」（既有 fixture 亦如此，真实种子走 regions 配置不受影响），
 * 这里用普通社区名让板面 gridLabel 可读。
 */

const OVERDUE_DEADLINE = '2026-01-01 09:00:00';
const SCREENSHOT_DIR = '/tmp/lingang-browser-r2/screenshots';

interface MockGrid {
  id: string;
  name: string;
  parentId: null;
  managerName: string;
}

interface MockTask {
  id: string;
  title: string;
  type: string;
  sourceKind: string;
  sourceId: string;
  gridId: string;
  route: string;
  priority: string;
  urgent: boolean;
  description: string;
  assignedBy: string;
  deadline: string;
  status: string;
  statusLabel: string;
}

function makeGrid(id: string, name: string): MockGrid {
  return { id, name, parentId: null, managerName: '自动化验证员' };
}

function makeOverdueTask(id: string, gridId: string): MockTask {
  return {
    id,
    title: `${id} 超期回访`,
    type: '回访',
    sourceKind: 'rule',
    sourceId: `rule_${id}`,
    gridId,
    route: '/mobile/tasks',
    priority: 'medium',
    urgent: false,
    description: '自动化验证用超期待办',
    assignedBy: '系统',
    deadline: OVERDUE_DEADLINE,
    status: 'pending',
    statusLabel: '待处理',
  };
}

function makePerson(id: string, gridId: string, risk: 'High' | 'Low') {
  return {
    id,
    gridId,
    name: `验证对象${id}`,
    idCard: `37068419900101${id.slice(-4).padStart(4, '0')}`,
    gender: '男',
    age: 36,
    address: '验证地址',
    type: '户籍',
    tags: [],
    risk,
    updatedAt: '2026-07-25 09:00:00',
  };
}

function makeVisit(id: string, targetId: string, gridId: string) {
  return {
    id,
    targetId,
    targetType: 'person',
    gridId,
    visitorName: '自动化验证员',
    date: '2026-07-25 10:00:00',
    content: '走访覆盖验证',
  };
}

const FILLER_IDS = Array.from({ length: 10 }, (_, index) => `g_fill_${String(index + 1).padStart(2, '0')}`);

const FIXTURE_GRIDS: MockGrid[] = [
  makeGrid('g_red', '登州街道红社区'), // 1 高风险 + 2 超期 + 100% 走访 → 严重板 + 严重清单项
  makeGrid('g_amber', '登州街道黄社区'), // 1 超期 → 中等板 + 中等清单项
  makeGrid('g_blue', '向阳街道蓝社区'), // 2 人全走访、零信号 → 轻微板
  makeGrid('g_calm', '向阳街道稳社区'), // 全零 → 轻微板、摘要整行省略
  ...FILLER_IDS.map((id, index) => makeGrid(id, `登州街道填充社区${String(index + 1).padStart(2, '0')}`)), // 垫高页面
];

const FIXTURE_PEOPLE = [
  makePerson('person_red_1', 'g_red', 'High'),
  makePerson('person_blue_1', 'g_blue', 'Low'),
  makePerson('person_blue_2', 'g_blue', 'Low'),
];

const FIXTURE_VISITS = [
  makeVisit('visit_red_1', 'person_red_1', 'g_red'),
  makeVisit('visit_blue_1', 'person_blue_1', 'g_blue'),
  makeVisit('visit_blue_2', 'person_blue_2', 'g_blue'),
];

const FIXTURE_TASKS: MockTask[] = [
  makeOverdueTask('task_red_1', 'g_red'),
  makeOverdueTask('task_red_2', 'g_red'),
  makeOverdueTask('task_amber_1', 'g_amber'),
  ...FILLER_IDS.map((id) => makeOverdueTask(`task_${id}`, id)),
];

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

function trackRuntimeFailures(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`.trim());
  });

  return () => {
    expect(consoleErrors, 'console errors').toEqual([]);
    expect(pageErrors, 'page errors').toEqual([]);
    expect(requestFailures, 'request failures').toEqual([]);
  };
}

/** 最小 mock 面：驱动 getGovernanceSnapshot 的全部 GET 端点。 */
async function mockWarningSnapshot(page: Page, grids: MockGrid[] = FIXTURE_GRIDS) {
  await page.route('**/api/stats/grids**', (route) =>
    route.fulfill({ json: { grids } }));
  await page.route('**/api/people**', (route) =>
    route.fulfill({ json: { items: FIXTURE_PEOPLE, total: FIXTURE_PEOPLE.length } }));
  await page.route('**/api/houses**', (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/api/houses/history-records') {
      return route.fulfill({ json: [] });
    }
    return route.fulfill({ json: { items: [], total: 0 } });
  });
  await page.route('**/api/visits**', (route) =>
    route.fulfill({ json: { items: FIXTURE_VISITS, total: FIXTURE_VISITS.length } }));
  await page.route('**/api/conflicts**', (route) =>
    route.fulfill({ json: { items: [], total: 0 } }));
  await page.route('**/api/task-rules/projection**', (route) =>
    route.fulfill({
      json: {
        pending: FIXTURE_TASKS,
        completed: [],
        summary: {
          pending: FIXTURE_TASKS.length,
          overdue: FIXTURE_TASKS.length,
          completed: 0,
          completionRate: 0,
        },
      },
    }));
}

async function gotoWarningZones(page: Page) {
  await page.goto('/analysis/warning-map');
  await expect(page.locator('[data-page-title]')).toHaveText('预警热区');
}

/** 统计一组元素的去重 x 坐标数（= 实际列数）。 */
async function distinctColumnCount(locator: ReturnType<Page['locator']>) {
  const xs = await locator.evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().x)));
  return new Set(xs).size;
}

/** 页面级横向溢出：页面滚动容器是 main（App.tsx），body 不滚动，查 document 是无效的。 */
async function mainOverflow(page: Page) {
  return page.locator('main').evaluate((el) => el.scrollWidth - el.clientWidth);
}

test.describe('K5 预警热区重设计（deterministic routes）', () => {
  test.beforeEach(async ({ page }) => {
    await dismissJourneyOverlay(page);
    await mockWarningSnapshot(page);
  });

  test('1608x1324：2fr/1fr workspace、rail sticky、列表内部有界滚动（AC-03 截图 ×2）', async ({ page }) => {
    await page.setViewportSize({ width: 1608, height: 1324 });
    const assertRuntimeClean = trackRuntimeFailures(page);
    await gotoWarningZones(page);
    await expect(page.getByTestId('zone-board')).toHaveCount(14);

    const firstGroup = page.getByTestId('zone-group').first();
    const rail = page.getByTestId('warning-rail-scroll');
    const railCard = rail.locator('xpath=..');
    const main = page.locator('main');
    await expect(rail).toBeVisible();

    // 双列：rail 在矩阵右侧且宽度 ≥ 320
    const matrixBox = (await firstGroup.boundingBox())!;
    const railBox = (await rail.boundingBox())!;
    expect(railBox.x).toBeGreaterThan(matrixBox.x + matrixBox.width / 2);
    expect(railBox.width).toBeGreaterThanOrEqual(320);
    // rail Card 自身 sticky
    await expect.poll(() => railCard.evaluate((el) => getComputedStyle(el).position)).toBe('sticky');

    // 筛选/导出/统计全部可见，统计卡 6 列
    await expect(page.getByRole('combobox').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '导出' })).toBeVisible();
    expect(await distinctColumnCount(page.getByTestId('warning-stat-grid').locator(':scope > *'))).toBe(6);

    // 列表拥有内部有界滚动
    const scrollMetrics = await rail.evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);

    // 顶部全景截图
    await expect.poll(() => main.evaluate((el) => el.scrollTop)).toBe(0);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/K5-warning-1608x1324.png` });

    // 页面（main）滚动时 rail 相对视口固定，矩阵随滚动上移
    const groupYBefore = (await firstGroup.boundingBox())!.y;
    const mainTop = (await main.boundingBox())!.y;
    const railYAtTop = (await rail.boundingBox())!.y;
    // rail 开始 sticky 的 scrollTop 阈值 = rail 在 main 内的文档位置 - top-6(24px)
    const stickyThreshold = railYAtTop - mainTop - 24;
    await main.evaluate((el, y) => { el.scrollTop = y; }, Math.ceil(stickyThreshold + 100));
    await expect.poll(() => main.evaluate((el) => el.scrollTop))
      .toBeGreaterThanOrEqual(Math.floor(stickyThreshold + 100));
    const railY1 = (await rail.boundingBox())!.y;
    await main.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await expect.poll(() => main.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(Math.floor(stickyThreshold + 400));
    const railY2 = (await rail.boundingBox())!.y;
    expect(Math.abs(railY2 - railY1)).toBeLessThanOrEqual(2);
    const groupYAfter = (await firstGroup.boundingBox())!.y;
    expect(groupYAfter).toBeLessThan(groupYBefore - 500);

    // rail 内部滚动不改变 rail 自身位置
    await rail.evaluate((el) => { el.scrollTop = 150; });
    await expect.poll(() => rail.evaluate((el) => el.scrollTop)).toBe(150);
    const railY3 = (await rail.boundingBox())!.y;
    expect(Math.abs(railY3 - railY2)).toBeLessThanOrEqual(1);

    // 滚动态截图：rail 固定 + 内部滚动偏移
    await page.screenshot({ path: `${SCREENSHOT_DIR}/K5-warning-1608-scrolled.png` });

    expect(await mainOverflow(page)).toBeLessThanOrEqual(1);
    assertRuntimeClean();
  });

  for (const viewport of [
    { width: 1507, height: 1324 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    test(`${viewport.width}x${viewport.height}：rail 布局不误触发（静态堆叠、矩阵在前）`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await gotoWarningZones(page);
      await expect(page.getByTestId('zone-board')).toHaveCount(14);

      const rail = page.getByTestId('warning-rail-scroll');
      // <1536 时 rail Card 不是 sticky
      await expect.poll(() => rail.locator('xpath=..').evaluate((el) => getComputedStyle(el).position)).toBe('static');
      // 文档序堆叠：矩阵在前、清单在后，两张 Card 左缘对齐（单列流）
      const matrixBox = (await page.getByTestId('zone-group').first().boundingBox())!;
      const railBox = (await rail.boundingBox())!;
      expect(railBox.y).toBeGreaterThan(matrixBox.y + matrixBox.height - 1);
      const matrixCardBox = (await page
        .locator('[data-slot="card"]', { has: page.getByTestId('zone-group').first() })
        .boundingBox())!;
      const railCardBox = (await rail.locator('xpath=..').boundingBox())!;
      expect(Math.abs(railCardBox.x - matrixCardBox.x)).toBeLessThanOrEqual(1);

      expect(await mainOverflow(page)).toBeLessThanOrEqual(1);
    });
  }

  test('390x844：统计卡 2 列、矩阵 1 列、导出折行占满（AC-04 截图）', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const assertRuntimeClean = trackRuntimeFailures(page);
    await gotoWarningZones(page);
    await expect(page.getByTestId('zone-board')).toHaveCount(14);

    // K4 移动端设计稿为内容区全宽（无侧栏）；桌面壳在 390 默认展开侧栏会把内容区
    // 压到约 100px。收起侧边导航（用户可达的确定性操作）后按 AC-04 检查内容区布局。
    await page.getByRole('button', { name: '收起侧边导航' }).click();
    await expect.poll(() => page.locator('main').evaluate((el) => el.clientWidth)).toBeGreaterThan(200);
    expect(await distinctColumnCount(page.getByTestId('warning-stat-grid').locator(':scope > *'))).toBe(2);
    expect(await distinctColumnCount(page.getByTestId('zone-group'))).toBe(1);

    // K4 批准稿：两个筛选同一行，导出按钮折行占满下一行。
    // 等侧栏收起过渡结束再测量，避免动画中间态的亚像素差异
    await page.waitForTimeout(400);
    const comboboxes = page.getByRole('combobox');
    await expect(comboboxes).toHaveCount(2);
    const typeSelectBox = (await comboboxes.first().boundingBox())!;
    const severitySelectBox = (await comboboxes.nth(1).boundingBox())!;
    const exportButton = page.getByRole('button', { name: '导出' });
    const exportBox = (await exportButton.boundingBox())!;
    expect(Math.abs(severitySelectBox.y - typeSelectBox.y)).toBeLessThanOrEqual(2);
    expect(severitySelectBox.x).toBeGreaterThan(typeSelectBox.x + typeSelectBox.width - 1);
    expect(exportBox.y).toBeGreaterThan(typeSelectBox.y + typeSelectBox.height - 1);
    // 导出确实占满操作区整行（允许 flex 亚像素舍入）。
    const actionsBox = (await exportButton.locator('xpath=..').boundingBox())!;
    expect(Math.abs(exportBox.x - actionsBox.x)).toBeLessThanOrEqual(1);
    expect(exportBox.width).toBeGreaterThanOrEqual(actionsBox.width * 0.95);

    // 操作不被裁切：两个筛选与导出完整落在 main 可视宽度内
    const mainBox = (await page.locator('main').boundingBox())!;
    for (const box of [typeSelectBox, severitySelectBox, exportBox]) {
      expect(box.x).toBeGreaterThanOrEqual(mainBox.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(mainBox.x + mainBox.width + 1);
    }

    // rail 静态堆叠在矩阵之后
    const rail = page.getByTestId('warning-rail-scroll');
    await expect.poll(() => rail.locator('xpath=..').evaluate((el) => getComputedStyle(el).position)).toBe('static');
    const matrixBox = (await page.getByTestId('zone-group').first().boundingBox())!;
    const railBox = (await rail.boundingBox())!;
    expect(railBox.y).toBeGreaterThan(matrixBox.y);

    expect(await mainOverflow(page)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/K5-warning-390x844.png`, fullPage: true });
    assertRuntimeClean();
  });

  test('severity 多通道：文字 + 徽章图标 + 左侧 accent（板与清单条目一致）', async ({ page }) => {
    await gotoWarningZones(page);
    await expect(page.getByTestId('zone-board')).toHaveCount(14);

    const cases: Array<{ name: string; label: string; rgb: string }> = [
      { name: '红社区', label: '严重', rgb: 'rgb(213, 33, 50)' },
      { name: '黄社区', label: '中等', rgb: 'rgb(214, 115, 13)' },
      { name: '蓝社区', label: '轻微', rgb: 'rgb(42, 163, 207)' },
    ];
    for (const item of cases) {
      const board = page.getByTestId('zone-board').filter({ hasText: item.name });
      const metrics = await board.evaluate((el) => {
        const style = getComputedStyle(el);
        return { width: style.borderLeftWidth, color: style.borderLeftColor };
      });
      expect(metrics.width, `${item.name}板左侧 accent 宽度`).toBe('2px');
      expect(metrics.color, `${item.name}板左侧 accent 颜色`).toBe(item.rgb);
      const badge = board.getByText(item.label, { exact: true });
      await expect(badge).toBeVisible();
      await expect(badge.locator('svg[aria-hidden="true"]')).toHaveCount(1);
    }

    // 清单条目同一套通道（g_red 严重 / g_amber 中等）
    const redItem = page.locator('[data-testid="warning-list-item"][data-warning-id="g_red-overdue"]');
    expect(await redItem.evaluate((el) => getComputedStyle(el).borderLeftColor)).toBe('rgb(213, 33, 50)');
    await expect(redItem.getByText('严重', { exact: true }).locator('svg[aria-hidden="true"]')).toHaveCount(1);
    const amberItem = page.locator('[data-testid="warning-list-item"][data-warning-id="g_amber-overdue"]');
    expect(await amberItem.evaluate((el) => getComputedStyle(el).borderLeftColor)).toBe('rgb(214, 115, 13)');
    await expect(amberItem.getByText('中等', { exact: true }).locator('svg[aria-hidden="true"]')).toHaveCount(1);
    // 清单确定性：首条 = 唯一严重项
    await expect(page.getByTestId('warning-list-item').first()).toHaveAttribute('data-warning-id', 'g_red-overdue');
  });

  test('error/retry：API 失败渲染 ErrorState（页头保持），重试恢复', async ({ page }) => {
    await page.unrouteAll();
    await page.route('**/api/**', (route) => route.abort());
    await page.goto('/analysis/warning-map');

    // 页头保持 + ErrorState 可见
    await expect(page.locator('[data-page-title]')).toHaveText('预警热区');
    await expect(page.locator('[data-page-state="error"]')).toBeVisible();
    const retry = page.getByRole('button', { name: '重试' });
    await expect(retry).toBeVisible();

    // 恢复路由后重试成功加载真实种子
    await page.unrouteAll();
    await retry.click();
    await expect(page.getByTestId('zone-board').first()).toBeVisible();
    await expect(page.locator('[data-page-state="error"]')).toHaveCount(0);
  });

  test('空态：筛选无命中 → 清单 EmptyState', async ({ page }) => {
    await gotoWarningZones(page);
    await expect(page.getByTestId('warning-list-item')).toHaveCount(12);

    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: '出租密度' }).click();
    await expect(page.getByTestId('warning-list-item')).toHaveCount(0);
    const rail = page.getByTestId('warning-rail-scroll');
    await expect(rail.locator('[data-page-state="empty"]')).toBeVisible();
    await expect(rail.getByText('当前筛选条件下暂无预警。')).toBeVisible();
    // 页头与统计卡不受空态影响
    await expect(page.locator('[data-page-title]')).toHaveText('预警热区');
    await expect(page.getByText('预警总数')).toBeVisible();
  });

  test('空态：grids 为空 → 矩阵 EmptyState（清单同步空态）', async ({ page }) => {
    await page.unrouteAll();
    await dismissJourneyOverlay(page);
    await mockWarningSnapshot(page, []);
    await gotoWarningZones(page);

    await expect(page.getByText('暂无网格热区数据。')).toBeVisible();
    await expect(page.getByText('当前筛选条件下暂无预警。')).toBeVisible();
    await expect(page.locator('[data-page-state="empty"]')).toHaveCount(2);
    await expect(page.getByTestId('zone-board')).toHaveCount(0);
  });

  test('keyboard/focus：Tab 序 矩阵板 → rail 滚动区 → 查看详情，focus 可见', async ({ page }) => {
    await gotoWarningZones(page);
    await expect(page.getByTestId('zone-board')).toHaveCount(14);

    let boardIndex = -1;
    let railIndex = -1;
    let detailIndex = -1;
    let boardOutline: { style: string; width: string } | null = null;
    let railBoxShadow: string | null = null;

    // 侧栏/页头导航在 DOM 中位于主内容之前，Tab 轨迹需容纳这些前置停点
    for (let step = 0; step < 60; step += 1) {
      await page.keyboard.press('Tab');
      const active = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) {
          return { testid: null, label: null, text: '' };
        }
        const style = getComputedStyle(el);
        return {
          testid: el.getAttribute('data-testid'),
          label: el.getAttribute('aria-label'),
          text: (el.textContent ?? '').trim().slice(0, 12),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow,
        };
      });
      if (boardIndex === -1 && active.testid === 'zone-board') {
        boardIndex = step;
        boardOutline = { style: active.outlineStyle ?? '', width: active.outlineWidth ?? '' };
      }
      if (railIndex === -1 && active.label === '预警清单，可上下滚动') {
        railIndex = step;
        railBoxShadow = active.boxShadow ?? '';
      }
      if (active.text.includes('查看详情')) {
        detailIndex = step;
        break;
      }
    }

    expect(boardIndex, 'ZoneBoard 可被 Tab 聚焦').toBeGreaterThanOrEqual(0);
    expect(railIndex, 'rail 滚动区可被 Tab 聚焦').toBeGreaterThan(boardIndex);
    expect(detailIndex, '查看详情按钮可被 Tab 聚焦').toBeGreaterThan(railIndex);
    // 键盘聚焦时 focus-visible 样式真实出现
    expect(boardOutline).not.toBeNull();
    expect(boardOutline!.style).toBe('solid');
    expect(boardOutline!.width).toBe('2px');
    expect(railBoxShadow).not.toBeNull();
    expect(railBoxShadow).not.toBe('none');
  });

  test('reduced-motion：全局压平，无持久动画', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoWarningZones(page);
    await expect(page.getByTestId('zone-board')).toHaveCount(14);

    const duration = await page.getByTestId('zone-board').first().evaluate(
      (el) => getComputedStyle(el).transitionDuration);
    // animations.css 全局压到 0.01ms；容忍 Chromium 序列化差异（0.00001s / 1e-05s）
    expect(['0s', '0.00001s', '1e-05s']).toContain(duration);
  });
});
