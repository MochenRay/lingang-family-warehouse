import { expect, test, type Page } from '@playwright/test';

const EVIDENCE_DIR = '/tmp/lingang-browser-feedback-b01-b18';
const TRACKED_LEDGER_PATHS = ['/api/people', '/api/stats/grids', '/api/houses'] as const;

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

async function openOccupiedHouseDetail(page: Page, address: string) {
  await expect(page.getByText('房屋总数', { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByPlaceholder('搜索地址、产权人、楼栋、单元、房号、标签').fill(address);
  const finderColumns = page.locator('section:has(header h3)');
  for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
    const item = finderColumns.nth(columnIndex).locator('button[aria-pressed]').first();
    await expect(item).toBeVisible();
    await item.click();
    await expect(finderColumns).toHaveCount(columnIndex + 2);
  }
  await finderColumns.nth(4).locator('button[aria-pressed]').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /^房屋详情 · .+$/ })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '查看人员' }).first()).toBeVisible();
  return dialog;
}

test.describe('B10/B11/B18 核心修复', () => {
  test('B10 DetailSection 仅保留标题栏下边框，说明自身无下边框', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/population');
    await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: '查看人员' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: '推荐动作' })).toBeVisible();

    for (const title of ['风险摘要', '推荐动作']) {
      const section = dialog.getByRole('heading', { name: title }).locator('xpath=ancestor::section[1]');
      const headerBorder = await section.locator(':scope > header').evaluate((element) => getComputedStyle(element).borderBottomWidth);
      const descriptionBorder = await section.locator(':scope > p').evaluate((element) => getComputedStyle(element).borderBottomWidth);
      expect(Number.parseFloat(headerBorder)).toBeGreaterThan(0);
      expect(descriptionBorder).toBe('0px');
    }
  });

  test('B11 同一 SPA session 二次进入即时复用，明确 invalidate 后重新读取', async ({ page }) => {
    test.setTimeout(120_000);
    await dismissJourneyOverlay(page);
    const counts = new Map<string, number>(TRACKED_LEDGER_PATHS.map((path) => [path, 0]));
    let delayTrackedReads = false;
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (request.method() === 'GET' && counts.has(pathname)) {
        counts.set(pathname, (counts.get(pathname) ?? 0) + 1);
        if (delayTrackedReads) await new Promise((resolve) => setTimeout(resolve, 1_500));
      }
      await route.continue();
    });

    await page.goto('/population');
    await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible({ timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    for (const path of TRACKED_LEDGER_PATHS) expect(counts.get(path)).toBeGreaterThan(0);
    const occupiedHouseAddress = await page.evaluate(async () => {
      const module = await import('/src/app/services/populationLedgerCache.ts');
      const snapshot = module.readPopulationLedgerCache();
      const person = snapshot?.people.find((item) => item.houseId);
      return snapshot?.houses.find((house) => house.id === person?.houseId)?.address ?? null;
    });
    if (!occupiedHouseAddress) throw new Error('人口台账缓存未提供可导航的现居房屋');

    await page.locator('aside [data-route-id="housing"]').click();
    await expect(page).toHaveURL('/housing');
    const houseDialog = await openOccupiedHouseDetail(page, occupiedHouseAddress);
    await page.waitForLoadState('networkidle');
    const beforeReturn = new Map(counts);
    delayTrackedReads = true;

    await houseDialog.getByRole('button', { name: '查看人员' }).first().click();
    await expect(page).toHaveURL(/\/population\?personId=/);
    await expect(page.getByRole('heading', { name: '人口详情' })).toBeVisible({ timeout: 800 });
    await expect(page.getByText('正在加载人口台账')).toHaveCount(0);
    for (const path of TRACKED_LEDGER_PATHS) expect(counts.get(path)).toBe(beforeReturn.get(path));

    delayTrackedReads = false;
    await page.keyboard.press('Escape');
    await page.evaluate(async () => {
      const module = await import('/src/app/services/populationLedgerCache.ts');
      module.invalidatePopulationLedgerCache();
    });
    await page.locator('aside [data-route-id="housing"]').click();
    await expect(page).toHaveURL('/housing');
    await expect(page.getByText('房屋总数', { exact: true })).toBeVisible({ timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    const beforeInvalidatedReturn = new Map(counts);
    await page.locator('aside [data-route-id="population"]').click();
    await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible({ timeout: 20_000 });
    for (const path of TRACKED_LEDGER_PATHS) {
      expect(counts.get(path), path).toBeGreaterThan(beforeInvalidatedReturn.get(path) ?? 0);
    }
  });

  test('B18 标签弹窗仅覆盖对象区滚动，Esc 后焦点归还', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 900 });
    await dismissJourneyOverlay(page);
    await page.goto('/tags');
    await expect(page.getByText('标签目录')).toBeVisible();
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
    const coverageCounts = await rows.evaluateAll((elements) =>
      elements.map((element) => Number(element.querySelectorAll('td')[3]?.textContent?.trim() ?? 0)));
    const maxCoverageIndex = coverageCounts.indexOf(Math.max(...coverageCounts));
    const trigger = rows.nth(maxCoverageIndex).getByRole('button', { name: /查看.+详情/ });
    await trigger.focus();
    await trigger.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: '规则信息' })).toBeVisible();
    const body = dialog.locator('[data-detail-dialog-body]');
    expect(await body.evaluate((element) => getComputedStyle(element).overflowY)).toBe('hidden');
    const scroller = dialog.getByRole('region', { name: '覆盖对象列表，可上下滚动' });
    await expect(scroller).toHaveAttribute('tabindex', '0');
    const scrollStyle = await scroller.evaluate((element) => {
      const style = getComputedStyle(element);
      return { overflowY: style.overflowY, overscrollBehaviorY: style.overscrollBehaviorY };
    });
    expect(['auto', 'scroll']).toContain(scrollStyle.overflowY);
    expect(scrollStyle.overscrollBehaviorY).toBe('contain');
    await dialog.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    const dialogHeader = dialog.locator('[data-detail-dialog-header]');
    const rulesSection = dialog.getByRole('heading', { name: '规则信息' }).locator('xpath=ancestor::section[1]');
    const [headerBefore, rulesBefore] = await Promise.all([dialogHeader.boundingBox(), rulesSection.boundingBox()]);
    expect(await scroller.evaluate((element) => element.scrollHeight)).toBeGreaterThan(
      await scroller.evaluate((element) => element.clientHeight),
    );
    await scroller.focus();
    await expect(scroller).toBeFocused();
    await scroller.press('End');
    await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const [headerAfter, rulesAfter] = await Promise.all([dialogHeader.boundingBox(), rulesSection.boundingBox()]);
    expect(Math.abs(headerAfter!.y - headerBefore!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(rulesAfter!.y - rulesBefore!.y)).toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('四视口标签详情无整页横溢、内部滚动稳定并生成截图', async ({ page }) => {
    test.setTimeout(120_000);
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const requestFailures: string[] = [];
    page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => requestFailures.push(request.method() + ' ' + request.url() + ' ' + (request.failure()?.errorText ?? '')));
    await dismissJourneyOverlay(page);

    for (const viewport of [
      { width: 1573, height: 1324 },
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 480, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/tags');
      const trigger = page.getByRole('button', { name: /查看.+详情/ }).first();
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('region', { name: '覆盖对象列表，可上下滚动' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: EVIDENCE_DIR + '/core-tags-' + viewport.width + 'x' + viewport.height + '.png',
        animations: 'disabled',
      });
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(requestFailures).toEqual([]);
  });
});

test.describe('reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('页面进入动画尊重 reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await dismissJourneyOverlay(page);
    await page.goto('/analysis/demographics');
    const duration = await page.locator('.page-enter').evaluate((element) => getComputedStyle(element).animationDuration);
    expect(Number.parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000)).toBeLessThanOrEqual(0.02);
  });
});
