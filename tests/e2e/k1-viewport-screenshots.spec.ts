import { expect, test, type Page } from '@playwright/test';

/**
 * K1 交付 B/C 补充：R47–R50、R52–R56 三视口截图与整页横向溢出检查。
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
});
