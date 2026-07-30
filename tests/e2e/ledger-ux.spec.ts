import { expect, test, type Page } from '@playwright/test';

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

test.describe('台账页体验回归', () => {
  test('人口首屏等待真实台账时显示明确 loading，不闪现零值统计', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.route('**/api/people?**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await route.continue();
    });

    await page.goto('/population');

    await expect(page.getByText('正在加载人口台账')).toBeVisible();
    await expect(page.getByText('总人口数', { exact: true })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: '人口管理' })).toBeVisible();
    await expect(page.getByText('总人口数', { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible();
  });

  test('走访摘要 503 不阻塞人口台账，且不伪装成暂无走访', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.route('**/api/visits?**', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'visit summary unavailable' }),
      });
    });

    await page.goto('/population');

    await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('走访摘要读取失败').first()).toBeVisible();
    await expect(page.getByText('暂不可用').first()).toBeVisible();
    await expect(page.getByText('暂无走访')).toHaveCount(0);
  });

  test('房屋层级移除数字胶囊，并以 URL 深链打开人员且返回原房屋', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/housing');
    await expect(page.getByText('房屋总数', { exact: true })).toBeVisible();

    const finderColumns = page.locator('section:has(header h3)');
    await expect(finderColumns).toHaveCount(1);
    await expect(finderColumns.nth(0).locator('header [data-slot="badge"]')).toHaveCount(0);

    for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
      await finderColumns.nth(columnIndex).locator('button[aria-pressed]').first().click();
      await expect(finderColumns).toHaveCount(columnIndex + 2);
    }

    await expect(finderColumns.nth(0).locator('button[aria-pressed]').first()).toContainText('套房屋');
    await expect(finderColumns.nth(1).locator('button[aria-pressed]').first()).toContainText('套房屋');
    await expect(finderColumns.nth(2).locator('button[aria-pressed]').first()).toContainText('套房屋');
    await expect(finderColumns.nth(3).locator('button[aria-pressed]').first()).toContainText('套房屋');

    const houseItems = finderColumns.nth(4).locator('button[aria-pressed]');
    const houseCount = await houseItems.count();
    let viewPersonButton = page.getByRole('button', { name: '查看人员' }).first();

    for (let index = 0; index < houseCount; index += 1) {
      await houseItems.nth(index).click();
      await expect(page.getByText('基础信息', { exact: true })).toBeVisible();
      if (await viewPersonButton.count()) {
        break;
      }
      await page.keyboard.press('Escape');
    }

    await expect(viewPersonButton).toBeVisible();
    await viewPersonButton.click();

    await expect(page).toHaveURL(/\/population\?personId=[^&]+/);
    await expect(page.getByRole('heading', { name: '人口详情' })).toBeVisible({ timeout: 20_000 });

    await page.goBack();
    await expect(page).toHaveURL(/\/housing\?houseId=[^&]+/);
    await expect(page.getByRole('button', { name: '查看人员' }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('关系详情沿用列表 pill，且页面不再展示内部读侧标识', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/relationship');

    await expect(page.getByText('真实读侧视图')).toHaveCount(0);
    await page.getByRole('button', { name: '查看关系详情' }).first().click();

    const dialog = page.getByRole('dialog');
    const riskPill = dialog
      .getByText('风险等级', { exact: true })
      .locator('xpath=following-sibling::div[1]//span');
    await expect(riskPill).toHaveClass(/rounded-full/);
    await expect(riskPill).toHaveText(/^(低风险|中风险|高风险)$/);
  });

  test('共享 Card 标题与正文之间不再叠加大段空白', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/batch-import');

    const card = page.locator('[data-slot="card"]').first();
    const header = card.locator('[data-slot="card-header"]');
    const content = card.locator('[data-slot="card-content"]');
    await expect(header).toBeVisible();
    await expect(content).toBeVisible();

    const gap = await card.evaluate((element) => getComputedStyle(element).rowGap);
    expect(Number.parseFloat(gap)).toBeLessThanOrEqual(8);
  });
});
