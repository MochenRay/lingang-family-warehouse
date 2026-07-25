import { expect, test, type Page } from '@playwright/test';

/**
 * K1 交付 A：R11 / R16 / R46 / R57
 * 实体与标签详情弹窗统一骨架、人口页加载文案、房屋页刷新入口清除。
 */

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

function collectRuntimeErrors(page: Page, ignorePatterns: RegExp[] = []) {
  const errors: string[] = [];
  const push = (entry: string) => {
    if (ignorePatterns.some((pattern) => pattern.test(entry))) {
      return;
    }
    errors.push(entry);
  };
  page.on('pageerror', (error) => push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      push(`console: ${message.text()}`);
    }
  });
  return errors;
}

/** 页面跳转中止在途走访摘要请求时的既有告警日志（非本次改动引入） */
const ABORTED_VISIT_SUMMARY = /Failed to load population visit summaries/;

async function expectNoPageHorizontalOverflow(page: Page) {
  const delta = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(delta).toBeLessThanOrEqual(0);
}

async function openFirstHouseDetail(page: Page) {
  await page.goto('/housing');
  await expect(page.getByText('房屋总数', { exact: true })).toBeVisible();
  const finderColumns = page.locator('section:has(header h3)');
  for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
    await finderColumns.nth(columnIndex).locator('button[aria-pressed]').first().click();
    await expect(finderColumns).toHaveCount(columnIndex + 2);
  }
  await finderColumns.nth(4).locator('button[aria-pressed]').first().click();
  await expect(page.getByRole('heading', { name: '房屋详情' })).toBeVisible();
  return page.getByRole('dialog');
}

test.describe('K1-A 实体与标签详情', () => {
  test('R11 人口页加载文案面向业务用户，无内部口吻', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await dismissJourneyOverlay(page);
    await page.route('**/api/people?**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.continue();
    });

    await page.goto('/population');

    await expect(page.getByText('正在加载人口台账')).toBeVisible();
    await expect(page.getByText('数据准备好后会自动显示，请稍候。')).toBeVisible();
    await expect(page.getByText('总人口数', { exact: true })).not.toBeVisible();
    await expect(page.locator('text=真实人员')).toHaveCount(0);
    await expect(page.locator('text=不会展示零值')).toHaveCount(0);

    await expect(page.getByText('总人口数', { exact: true })).toBeVisible({ timeout: 20_000 });
    expect(runtimeErrors).toEqual([]);
  });

  test('R16 房屋页头与详情弹窗均无刷新入口', async ({ page }) => {
    await dismissJourneyOverlay(page);
    const dialog = await openFirstHouseDetail(page);

    await expect(page.getByRole('button', { name: /刷新/ })).toHaveCount(0);
    await expect(dialog.getByText('刷新')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: '编辑' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: '删除' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '基础信息' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '现居住户' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '居住历史' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('R46 人口详情骨架稳定、推荐动作解释如何产生', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await dismissJourneyOverlay(page);
    await page.goto('/population');
    await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible({ timeout: 20_000 });

    const viewButton = page.getByRole('button', { name: '查看人员' }).first();
    await viewButton.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(page.getByRole('heading', { name: '人口详情' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '个人概览' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '推荐动作' })).toBeVisible();
    await expect(
      dialog.getByText('推荐动作是系统根据该人员的风险等级、人员标签、最近走访时间和同住情况', { exact: false }),
    ).toBeVisible();
    await expect(dialog.getByText('预留嵌入位')).toHaveCount(0);

    // 主体高度在三个 Tab 间保持稳定（computed height 不受进场动画 transform 影响）
    const measureHeight = () =>
      dialog.evaluate((element) => Number.parseFloat(getComputedStyle(element).height));
    const heightOnBasic = await measureHeight();
    await dialog.getByRole('tab', { name: '关系图谱' }).click();
    const heightOnRelation = await measureHeight();
    await dialog.getByRole('tab', { name: '历史记录' }).click();
    const heightOnHistory = await measureHeight();
    expect(Math.abs(heightOnBasic - heightOnRelation)).toBeLessThanOrEqual(1);
    expect(Math.abs(heightOnBasic - heightOnHistory)).toBeLessThanOrEqual(1);

    // 内容超出时只在弹窗内部滚动
    const bodyOverflow = await page
      .locator('[data-detail-dialog-body]')
      .evaluate((element) => getComputedStyle(element).overflowY);
    expect(bodyOverflow).toBe('auto');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(viewButton).toBeFocused();
    expect(runtimeErrors).toEqual([]);
  });

  test('R46 房屋详情与人口详情使用同一弹窗骨架', async ({ page }) => {
    await dismissJourneyOverlay(page);
    const dialog = await openFirstHouseDetail(page);

    await expect(page.locator('[data-detail-dialog-body]')).toBeVisible();
    const housingHeight = await dialog.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).height),
    );

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.goto('/population');
    await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: '查看人员' }).first().click();
    const populationDialog = page.getByRole('dialog');
    await expect(page.getByRole('heading', { name: '人口详情' })).toBeVisible();
    const populationHeight = await populationDialog.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).height),
    );

    expect(Math.abs(housingHeight - populationHeight)).toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
    await expect(populationDialog).toBeHidden();
  });

  test('R46 人房关系详情对齐统一骨架', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/relationship');
    await page.getByRole('button', { name: '查看关系详情' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(page.getByRole('heading', { name: '人房关系详情' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '人员信息' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '房屋信息' })).toBeVisible();

    const riskPill = dialog
      .getByText('风险等级', { exact: true })
      .locator('xpath=following-sibling::div[1]//span');
    await expect(riskPill).toHaveClass(/rounded-full/);
    await expect(riskPill).toHaveText(/^(Low|Medium|High)$/);

    await expect(page.locator('[data-detail-dialog-body]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('R57 标签详情重设计，R31 查看/键盘/关闭行为保持', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/tags');
    await expect(page.getByText('标签目录')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible();

    const viewButtons = page.getByRole('button', { name: /查看.+详情/ });
    await expect(viewButtons.first()).toBeVisible();
    expect(await viewButtons.count()).toBeGreaterThanOrEqual(5);

    // 键盘 Enter 打开
    const firstViewButton = viewButtons.first();
    await firstViewButton.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(page.getByRole('heading', { name: '标签详情' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '规则信息' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '覆盖对象' })).toBeVisible();

    // 覆盖对象为桌面多列网格
    const grid = page.locator('[data-covered-people-grid]');
    await expect(grid).toBeVisible();
    const columnCount = await grid.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(columnCount).toBeGreaterThanOrEqual(2);

    // 网格卡片不丢姓名、风险、地址与最近走访（首个胶囊即风险等级，其余为命中原因）
    const firstCard = grid.locator('> div').first();
    const riskPill = firstCard.locator('span.rounded-full').first();
    await expect(riskPill).toBeVisible();
    await expect(riskPill).toHaveText(/^(Low|Medium|High)$/);
    await expect(firstCard.getByText('最近走访：')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(firstViewButton).toBeFocused();

    // 鼠标点击同样可打开（R31 行为不回退）
    await firstViewButton.click();
    await expect(page.getByRole('heading', { name: '标签详情' })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('R57 标签分析命中居民改响应式网格', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/analysis/tags');
    const crossTitle = page.locator('[data-slot="card-title"]', { hasText: '交叉分析' });
    await expect(crossTitle).toBeVisible();

    const crossCard = page.locator('[data-slot="card"]', { has: crossTitle });
    const toggles = crossCard.getByRole('button').filter({ hasNotText: '查看详情' });
    const detailButton = crossCard.getByRole('button', { name: '查看详情' });
    // 标签数据异步加载，等首个 toggle 出现再开始尝试
    await expect(toggles.first()).toBeVisible({ timeout: 20_000 });

    // 交叉命中随标签增加只会变少：逐个单选尝试，无命中则取消后再试下一个
    let opened = false;
    const toggleCount = Math.min(await toggles.count(), 8);
    for (let index = 0; index < toggleCount; index += 1) {
      await toggles.nth(index).click();
      const visible = await detailButton
        .waitFor({ state: 'visible', timeout: 2000 })
        .then(() => true)
        .catch(() => false);
      if (visible) {
        await detailButton.click();
        opened = true;
        break;
      }
      await toggles.nth(index).click();
    }
    expect(opened).toBe(true);

    const grid = page.locator('[data-matched-residents-grid]');
    await expect(grid).toBeVisible();
    const columnCount = await grid.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(columnCount).toBeGreaterThanOrEqual(2);
    await expect(grid.locator('> div').first().getByText('最近走访：')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('R46/R57 三视口截图与横向溢出检查', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page, [ABORTED_VISIT_SUMMARY]);
    await dismissJourneyOverlay(page);
    const viewports = [
      { width: 1507, height: 1324 },
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      const tag = `${viewport.width}x${viewport.height}`;

      await page.goto('/population');
      await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible({ timeout: 20_000 });
      await page.getByRole('button', { name: '查看人员' }).first().click();
      await expect(page.getByRole('heading', { name: '人口详情' })).toBeVisible();
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r46-population-${tag}.png`, animations: 'disabled' });
      await page.keyboard.press('Escape');

      const housingDialog = await openFirstHouseDetail(page);
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r16-r46-housing-${tag}.png`, animations: 'disabled' });
      await page.keyboard.press('Escape');
      await expect(housingDialog).toBeHidden();

      await page.goto('/relationship');
      await page.getByRole('button', { name: '查看关系详情' }).first().click();
      await expect(page.getByRole('heading', { name: '人房关系详情' })).toBeVisible();
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r46-relationship-${tag}.png`, animations: 'disabled' });
      await page.keyboard.press('Escape');

      await page.goto('/tags');
      await expect(page.getByText('标签目录')).toBeVisible();
      await page.getByRole('button', { name: /查看.+详情/ }).first().click();
      await expect(page.getByRole('heading', { name: '标签详情' })).toBeVisible();
      await expectNoPageHorizontalOverflow(page);
      await page.screenshot({ path: `/tmp/k1-r57-tags-${tag}.png`, animations: 'disabled' });
      await page.keyboard.press('Escape');
    }

    expect(runtimeErrors).toEqual([]);
  });
});
