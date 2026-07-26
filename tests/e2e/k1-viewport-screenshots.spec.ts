import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * K1 交付 B/C 补充：R47–R50、R52–R56 三视口截图与整页横向溢出检查，
 * 以及 1024 宽度下用户/日志表格内部横向滚动、角色弹窗键盘路径的实证。
 * 截图写入 /tmp（不入仓），供验收人工核对。
 */

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`);
    }
  });
  return errors;
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

const VIEWPORTS = [
  { width: 1507, height: 1324 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
];

/**
 * 断言表格在其滚动容器内可由用户真实横向滚至最后一列（整页不溢出，滚动发生在容器内）。
 * 证据链：computed overflow-x ∈ {auto, scroll} → scrollWidth > clientWidth →
 * 定位动作不偷滚 scrollLeft → 真实 wheel 令 scrollLeft 增长 → 到达 maxScrollLeft 附近 →
 * 末列完整落入容器可视区域。
 * 不用 hover 定位：对超宽行 hover 会先 scrollIntoViewIfNeeded，可能把容器自动滚到末端
 * （曾实测 initialLeft == maxScrollLeft 造成 false-red）；也不直接赋值 scrollLeft
 * （overflow-hidden 下赋值也可生效，不能证明用户可滚）。
 */
async function expectTableScrollsToLastColumn(page: Page, table: Locator, lastColumn: string) {
  const scroller = table.locator('xpath=..');

  // 1) 容器必须真的声明可横向滚动（用户可滚的前提）
  const overflowX = await scroller.evaluate((el) => getComputedStyle(el).overflowX);
  expect(['auto', 'scroll']).toContain(overflowX);

  const metrics = await scroller.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
  const maxScrollLeft = metrics.scrollWidth - metrics.clientWidth;

  // 2) 在容器「可视区域」内计算真实鼠标点（getBoundingClientRect 为视口坐标，
  // 与 elementFromPoint / mouse.move 同坐标系），不做任何会引发自动滚动的定位
  const point = await scroller.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const visibleLeft = Math.max(rect.left, 0);
    const visibleRight = Math.min(rect.right, window.innerWidth);
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, window.innerHeight);
    if (visibleRight - visibleLeft < 8 || visibleBottom - visibleTop < 8) {
      return null;
    }
    return { x: (visibleLeft + visibleRight) / 2, y: (visibleTop + visibleBottom) / 2 };
  });
  expect(point).not.toBeNull();

  const readScrollLeft = () => scroller.evaluate((el) => el.scrollLeft);
  const beforePositioning = await readScrollLeft();
  // 前置条件：初始位置必须留有可滚空间，否则「wheel 令 scrollLeft 增长」无从证明
  expect(beforePositioning).toBeLessThan(maxScrollLeft);

  await page.mouse.move(point!.x, point!.y);

  // 3) 命中证明：鼠标点必须落在 scroller 本身或其后代上
  const hitInside = await scroller.evaluate(
    (el, p) => {
      const hit = document.elementFromPoint(p.x, p.y);
      return hit === el || el.contains(hit);
    },
    point!,
  );
  expect(hitInside).toBe(true);

  // 4) 定位动作不得偷滚：move + 命中检查后 scrollLeft 保持初始值
  expect(await readScrollLeft()).toBe(beforePositioning);

  // 5) 首次 deltaX wheel 后只做非断言的短暂等待与读取：若此处用 expect.poll 断言，
  // deltaX 无效时会先抛错，Shift 回退永不可达。未增长则退回 Shift+纵向轮
  // （Chromium 按住 Shift 会转置滚轮轴）；keyboard.down 配 try/finally 保证
  // keyboard.up 必定执行。两种输入尝试完成后才执行唯一的增长断言。
  await page.mouse.wheel(240, 0);
  await page.waitForTimeout(150);
  if ((await readScrollLeft()) <= beforePositioning) {
    await page.keyboard.down('Shift');
    try {
      await page.mouse.wheel(0, 240);
      await page.waitForTimeout(150);
    } finally {
      await page.keyboard.up('Shift');
    }
  }
  await expect.poll(readScrollLeft, { timeout: 2_000 }).toBeGreaterThan(beforePositioning);

  // 6) 持续 wheel 至滚动尽头（scrollLeft 到达最大值附近）
  for (let attempt = 0; attempt < 24; attempt += 1) {
    if ((await readScrollLeft()) >= maxScrollLeft - 2) break;
    await page.mouse.wheel(480, 0);
    await page.waitForTimeout(50);
  }
  expect(await readScrollLeft()).toBeGreaterThanOrEqual(maxScrollLeft - 2);

  // 7) 末列完整落入容器可视区域（容器可能因页面滚动移位，此处重新量取）
  const header = table.getByRole('columnheader', { name: lastColumn, exact: true });
  const headerBox = await header.boundingBox();
  const scrollerBox = await scroller.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(scrollerBox).not.toBeNull();
  expect(headerBox!.x).toBeGreaterThanOrEqual(scrollerBox!.x - 1);
  expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(scrollerBox!.x + scrollerBox!.width + 1);
}

test.describe('K1-B/C 三视口截图', () => {
  test('R47–R50 知识、活动与治理弹窗三视口', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await dismissJourneyOverlay(page);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      const tag = `${viewport.width}x${viewport.height}`;

      await page.goto('/knowledge');
      await expect(page.locator('[data-knowledge-card]').first()).toBeVisible({ timeout: 20_000 });
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r47-knowledge-${tag}.png`, animations: 'disabled' });

      await page.goto('/grid/activities');
      await expect(page.getByRole('tab', { name: /待办审批/ })).toBeVisible({ timeout: 20_000 });
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r48-activities-${tag}.png`, animations: 'disabled' });

      await page.goto('/grid/conflicts');
      await expect(page.getByRole('columnheader', { name: '标题' })).toBeVisible({ timeout: 20_000 });
      await page.getByRole('button', { name: '查看详情' }).first().click();
      await expect(page.getByRole('heading', { name: '案件概况' })).toBeVisible({ timeout: 20_000 });
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r49-conflicts-${tag}.png`, animations: 'disabled' });
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();

      await page.goto('/grid/notices');
      await expect(page.getByText('公告列表')).toBeVisible({ timeout: 20_000 });
      await page.getByRole('button', { name: '预览公告' }).first().click();
      await expect(page.getByRole('heading', { name: '通知正文' })).toBeVisible({ timeout: 20_000 });
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r50-notices-${tag}.png`, animations: 'disabled' });
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
    }

    expect(runtimeErrors).toEqual([]);
  });

  test('R52–R56 高密度列表与系统页三视口', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await dismissJourneyOverlay(page);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      const tag = `${viewport.width}x${viewport.height}`;

      await page.goto('/attribution/contribution');
      await expect(page.locator('[data-testid="contribution-factor-card"]').first()).toBeVisible({
        timeout: 20_000,
      });
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r52-contribution-${tag}.png`, animations: 'disabled' });

      await page.goto('/settings/users');
      await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible({ timeout: 20_000 });
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r53-users-${tag}.png`, animations: 'disabled' });

      await page.goto('/settings/roles');
      await expect(page.locator('[data-testid="role-card"]').first()).toBeVisible({
        timeout: 20_000,
      });
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r54-roles-${tag}.png`, animations: 'disabled' });

      await page.goto('/settings/logs');
      await expect(page.getByRole('heading', { name: '日志管理' })).toBeVisible({ timeout: 20_000 });
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r56-logs-${tag}.png`, animations: 'disabled' });
    }

    expect(runtimeErrors).toEqual([]);
  });

  test('R53/R56 1024 宽度表格容器内真实横向滚动', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await dismissJourneyOverlay(page);
    await page.setViewportSize({ width: 1024, height: 768 });

    // 用户表：1024 宽度下容器内可横向滚动至「操作」列（整页不溢出）
    await page.goto('/settings/users');
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible({ timeout: 20_000 });
    await expectTableScrollsToLastColumn(
      page,
      page.locator('[data-testid="user-table-card"] table'),
      '操作',
    );
    await expectNoPageHorizontalOverflow(page);

    // 日志表：1024 宽度下容器内可横向滚动至「耗时」列
    await page.goto('/settings/logs');
    await expect(page.getByRole('heading', { name: '日志管理' })).toBeVisible({ timeout: 20_000 });
    await expectTableScrollsToLastColumn(page, page.getByRole('table'), '耗时');
    await expectNoPageHorizontalOverflow(page);

    expect(runtimeErrors).toEqual([]);
  });

  test('R54 角色弹窗键盘开启、Escape 关闭与焦点归还', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await dismissJourneyOverlay(page);
    await page.setViewportSize({ width: 1024, height: 768 });

    // 角色弹窗：键盘 Enter 打开、Esc 关闭、焦点归还触发按钮
    await page.goto('/settings/roles');
    await expect(page.locator('[data-testid="role-card"]').first()).toBeVisible({ timeout: 20_000 });
    const editButton = page.getByRole('button', { name: '编辑角色 系统管理员' });
    await editButton.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('编辑角色 - 系统管理员')).toBeVisible();

    // Escape readiness：Radix 的 Esc listener 与 DismissableLayer 顶层状态经 effect
    // 注册/更新，标题刚可见就发 Esc 可能被忽略。等焦点进入弹窗（effect 完成的
    // 可观测信号），再连续等两个 requestAnimationFrame，然后才发送 Escape。
    await expect
      .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(editButton).toBeFocused();

    expect(runtimeErrors).toEqual([]);
  });
});
