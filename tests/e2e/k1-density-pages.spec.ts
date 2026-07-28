import { expect, test, type Page } from '@playwright/test';

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

/** 整页（而非卡片内表格）不得出现横向溢出；视口切换后布局需要短暂收敛，故轮询等待。 */
async function expectNoPageHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    )
    .toBe(false);
}

test.describe('K1 高密度页面重设计', () => {
  test('R52 贡献因素响应式网格：排名语义不变且信息同屏可读', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/attribution/contribution');

    await expect(page.getByRole('heading', { name: '贡献程度排名' })).toBeVisible({ timeout: 20_000 });

    const cards = page.locator('[data-testid="contribution-factor-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // 桌面多列：前两张卡片同排
    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThan(4);

    // 排名 1..n 连续，贡献权重不递增（排序语义不变）
    const ranks = await cards.evaluateAll((els) =>
      els.map((el) => Number((el as HTMLElement).dataset.rank)),
    );
    const contributions = await cards.evaluateAll((els) =>
      els.map((el) => Number((el as HTMLElement).dataset.contribution)),
    );
    expect(ranks).toEqual(Array.from({ length: count }, (_, index) => index + 1));
    for (let index = 1; index < contributions.length; index += 1) {
      expect(contributions[index]).toBeLessThanOrEqual(contributions[index - 1]);
    }

    // 每张卡均显式展示权重/量级/趋势/可信度（0% 项也以数值文本呈现，不依赖条形宽度）
    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index);
      await expect(card).toContainText('贡献权重');
      await expect(card).toContainText('当前量级');
      await expect(card).toContainText('最近趋势');
      await expect(card).toContainText('可信度');
      await expect(card).toContainText(/\d+(\.\d+)?%/);
    }

    // 窄屏回落单列
    await page.setViewportSize({ width: 480, height: 900 });
    const narrowFirst = await cards.nth(0).boundingBox();
    const narrowSecond = await cards.nth(1).boundingBox();
    expect(narrowSecond!.y).toBeGreaterThan(narrowFirst!.y + 40);
    await expectNoPageHorizontalOverflow(page);
  });

  test('R52 零值因素精确呈现 0% 文本与 aria-label', async ({ page }) => {
    await dismissJourneyOverlay(page);
    // 零值 fixture：把待办任务截止时间全部改到未来，「超期待办」因素的原始值归零
    await page.route('**/api/task-rules/projection**', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      for (const task of json.pending ?? []) {
        task.deadline = '2099-01-01T00:00:00';
      }
      await route.fulfill({ response, json });
    });
    await page.goto('/attribution/contribution');

    const cards = page.locator('[data-testid="contribution-factor-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // 种子数据中「走访覆盖率」等也可能为 0：对所有零贡献卡逐一精确断言
    const zeroCards = page.locator('[data-testid="contribution-factor-card"][data-contribution="0"]');
    await expect(zeroCards.first()).toBeVisible();
    const zeroCount = await zeroCards.count();

    // 其中必须包含本次零值 fixture 的「超期待办」卡
    const overdueZero = zeroCards.filter({ hasText: '超期待办' });
    await expect(overdueZero).toHaveCount(1);

    // 每张零卡都精确呈现 0% 数值文本（不是任意百分数）与对应 aria-label
    for (let index = 0; index < zeroCount; index += 1) {
      const card = zeroCards.nth(index);
      await expect(card.locator('span', { hasText: /^0%$/ }).first()).toBeVisible();
      await expect(card.getByRole('img', { name: '贡献权重 0%' })).toBeVisible();
    }

    // 零贡献卡排在全部非零卡之后
    const allRanks = await cards.evaluateAll((els) =>
      els.map((el) => Number((el as HTMLElement).dataset.rank)),
    );
    const zeroRanks = await zeroCards.evaluateAll((els) =>
      els.map((el) => Number((el as HTMLElement).dataset.rank)),
    );
    const zeroSet = new Set(zeroRanks);
    const nonZeroRanks = allRanks.filter((rank) => !zeroSet.has(rank));
    expect(Math.min(...zeroRanks)).toBeGreaterThan(Math.max(...nonZeroRanks));

    // 非零卡不得误显 0%
    await expect(cards.first().locator('span', { hasText: /^0%$/ })).toHaveCount(0);
  });

  test('R53 用户列表通栏，角色分布默认折叠且筛选可发现可清除', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/settings/users');

    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();

    // 角色分布默认折叠：面板项不渲染
    const toggle = page.getByRole('button', { name: /角色分布/ });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('button[aria-pressed]')).toHaveCount(0);

    // 用户表通栏：角色面板与用户表同宽且上下排列（无左右分栏）
    const panelBox = await page.locator('[data-testid="role-distribution-panel"]').boundingBox();
    const tableBox = await page.locator('[data-testid="user-table-card"]').boundingBox();
    expect(panelBox).not.toBeNull();
    expect(tableBox).not.toBeNull();
    expect(tableBox!.y).toBeGreaterThan(panelBox!.y);
    expect(Math.abs(tableBox!.width - panelBox!.width)).toBeLessThan(4);

    // 完整用户字段列保持可见
    for (const column of ['用户', '角色', '部门', '管辖范围', '关联账户', '状态', '操作']) {
      await expect(page.getByRole('columnheader', { name: column, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: '编辑用户 张三' })).toBeVisible();

    // 展开角色面板并点击角色即可筛选
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const roleItems = page.locator('button[aria-pressed]');
    await expect(roleItems).toHaveCount(4);
    await roleItems.filter({ hasText: '网格员' }).click();
    await expect(page.getByRole('cell', { name: '网格员' })).toBeVisible();
    await expect(page.getByText('赵六')).toBeVisible();
    await expect(page.getByText('张三')).toHaveCount(0);

    // 筛选可清除
    await page.getByRole('button', { name: '清除筛选' }).click();
    await expect(page.getByText('张三')).toBeVisible();
    await expect(page.getByRole('combobox', { name: '按角色筛选' })).toContainText('全部角色');

    // 下拉筛选同样可用
    await page.getByRole('combobox', { name: '按角色筛选' }).click();
    await page.getByRole('option', { name: '街道干部' }).click();
    await expect(page.getByText('王五')).toBeVisible();
    await expect(page.getByText('张三')).toHaveCount(0);
  });

  test('R54 角色管理响应式网格：桌面多列可比、预设角色删除受保护', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/settings/roles');

    await expect(page.getByRole('heading', { name: '角色管理' })).toBeVisible();

    const cards = page.locator('[data-testid="role-card"]');
    await expect(cards).toHaveCount(5);

    // 桌面多列：前两张角色卡同排
    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();
    expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThan(4);

    // 卡片内可比较人数、权限数与管辖范围
    await expect(cards.nth(0)).toContainText('关联用户');
    await expect(cards.nth(0)).toContainText('权限数量');
    await expect(cards.nth(0)).toContainText('管辖区域');

    // 预设角色保护：删除禁用并说明原因，编辑仍可用
    const deleteButton = page.getByRole('button', { name: '删除角色 系统管理员' });
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toHaveAttribute('title', '系统预设角色不可删除');

    await page.getByRole('button', { name: '编辑角色 系统管理员' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('编辑角色 - 系统管理员')).toBeVisible();
    await dialog.getByRole('button', { name: '取消' }).click();
    await expect(dialog).toHaveCount(0);

    // 窄屏回落单列
    await page.setViewportSize({ width: 520, height: 900 });
    const narrowFirst = await cards.nth(0).boundingBox();
    const narrowSecond = await cards.nth(1).boundingBox();
    expect(narrowSecond!.y).toBeGreaterThan(narrowFirst!.y + 40);
    await expectNoPageHorizontalOverflow(page);
  });

  test('R56 日志管理整页重设计：筛选文案完整、表格层级清晰、无横向溢出', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/settings/logs');

    await expect(page.getByRole('heading', { name: '日志管理' })).toBeVisible();

    // 开发者口吻文案已移除
    await expect(page.getByText('为演示审计链路留痕')).toHaveCount(0);

    // “全部类型”等筛选文案完整显示（触发器无截断）
    const typeTrigger = page.getByRole('combobox', { name: '按类型筛选' });
    await expect(typeTrigger).toContainText('全部类型');
    const clipped = await typeTrigger.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(clipped).toBeLessThanOrEqual(1);

    // 表格化信息层级：类型/模块/状态/操作者/时间各就各位
    for (const column of ['时间', '类型', '模块', '操作内容', '操作人', '来源', '状态', '耗时']) {
      await expect(page.getByRole('columnheader', { name: column, exact: true })).toBeVisible();
    }
    const logRows = page.getByRole('columnheader', { name: '操作内容', exact: true }).locator('xpath=ancestor::table').locator('tbody tr');
    await expect(logRows).toHaveCount(10);
    await expect(page.getByRole('cell', { name: '2026-01-20 15:45:23' })).toBeVisible();
    await expect(page.getByText('新建人口信息：李明（身份证：370XXXXXXXXX）')).toBeVisible();

    // 类型筛选生效且可清除
    await typeTrigger.click();
    await page.getByRole('option', { name: '删除' }).click();
    await expect(logRows).toHaveCount(1);
    await expect(page.getByText('删除房屋信息').first()).toBeVisible();
    await page.getByRole('button', { name: '清除筛选' }).click();
    await expect(logRows).toHaveCount(10);

    // 桌面与窄屏均无整页横向溢出
    await expectNoPageHorizontalOverflow(page);
    await page.setViewportSize({ width: 480, height: 900 });
    await expectNoPageHorizontalOverflow(page);
    await expect(page.getByRole('columnheader', { name: '操作内容', exact: true })).toBeVisible();
  });

  test('R56 时间范围跨日期夹具：切换改变行数与行身份', async ({ page }) => {
    await dismissJourneyOverlay(page);
    // 跨日期夹具：Vite dev 按模块服务，拦截日志数据模块替换为跨日期数据，
    // 不改生产统计、路由与 API。锚点 = 数据集最新时间 2026-01-15 18:00，
    // 今天 3 条、近7天 5 条（含 01-09 边界）、近30天 6 条、全部 7 条 ——
    // 删除 LogManagement 的 isWithinTimeRange 接线后各档行数相同，本测试即变红。
    await page.route(/\/src\/app\/data\/operationLogs\.ts/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `const entry = (id, action, time, type = 'view') => ({
  id, type, module: '数据管理', action, user: '夹具操作员', username: 'fixture',
  ip: '10.0.0.1', location: '夹具科', detail: '跨日期夹具条目：' + action,
  status: 'success', time, duration: '0.10s',
});
export const OPERATION_LOGS = [
  entry(101, '夹具-今日甲', '2026-01-15 09:00:00', 'create'),
  entry(102, '夹具-今日乙', '2026-01-15 12:00:00', 'update'),
  entry(103, '夹具-今日丙', '2026-01-15 18:00:00', 'login'),
  entry(104, '夹具-七天内', '2026-01-10 10:00:00'),
  entry(105, '夹具-七天边界', '2026-01-09 10:00:00', 'export'),
  entry(106, '夹具-三十天内', '2025-12-20 10:00:00', 'delete'),
  entry(107, '夹具-全部范围', '2025-06-01 10:00:00', 'login'),
];`,
      }),
    );
    await page.goto('/settings/logs');
    await expect(page.getByRole('heading', { name: '日志管理' })).toBeVisible({ timeout: 20_000 });

    const rows = page.getByRole('columnheader', { name: '操作内容', exact: true }).locator('xpath=ancestor::table').locator('tbody tr');
    const timeTrigger = page.getByRole('combobox', { name: '按时间范围筛选' });

    // 默认今天：3 行且不含更早条目，无「已筛选」标记
    await expect(timeTrigger).toContainText('今天');
    await expect(rows).toHaveCount(3);
    await expect(rows.filter({ hasText: '夹具-今日甲' })).toHaveCount(1);
    await expect(rows.filter({ hasText: '夹具-七天内' })).toHaveCount(0);
    await expect(page.getByText('（已筛选）')).toHaveCount(0);

    // 近7天：5 行（01-09 边界含内），不含 12-20 与 2025-06-01
    await timeTrigger.click();
    await page.getByRole('option', { name: '近7天' }).click();
    await expect(rows).toHaveCount(5);
    await expect(rows.filter({ hasText: '夹具-七天边界' })).toHaveCount(1);
    await expect(rows.filter({ hasText: '夹具-三十天内' })).toHaveCount(0);
    await expect(page.getByText('（已筛选）')).toBeVisible();

    // 近30天：6 行，仍不含 2025-06-01
    await timeTrigger.click();
    await page.getByRole('option', { name: '近30天' }).click();
    await expect(rows).toHaveCount(6);
    await expect(rows.filter({ hasText: '夹具-三十天内' })).toHaveCount(1);
    await expect(rows.filter({ hasText: '夹具-全部范围' })).toHaveCount(0);

    // 全部：7 行，行身份齐备
    await timeTrigger.click();
    await page.getByRole('option', { name: '全部' }).click();
    await expect(rows).toHaveCount(7);
    await expect(rows.filter({ hasText: '夹具-全部范围' })).toHaveCount(1);

    // 清除筛选：回默认今天 3 行
    await page.getByRole('button', { name: '清除筛选' }).click();
    await expect(timeTrigger).toContainText('今天');
    await expect(rows).toHaveCount(3);
    await expect(page.getByText('（已筛选）')).toHaveCount(0);
  });
});
