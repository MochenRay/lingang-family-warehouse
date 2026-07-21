import { expect, test } from '@playwright/test';

/**
 * golden diff 视觉回归（P5-T2）。
 *
 * Canonical 环境（冻结）：GitHub Actions ubuntu-latest + chromium（Playwright 版本以
 * package-lock.json 为准）；本机 macOS 仅调试，不作为比对环境。基线 PNG 入仓于
 * tests/e2e/__screenshots__/，由 .github/workflows/visual-update.yml 在 CI 产出。
 *
 * 稳定性前提：种子库每轮重建（start-e2e-backend.sh 先删后 seed）；reducedMotion=reduce
 * 且 animations:'disabled' 消除动画非确定帧；移动端「最近同步」时间戳为动态区域，必须 mask。
 *
 * 阈值：试点量测后按冻结稿定 maxDiffPixelRatio（不预设）。
 */

type ReadyText = string | RegExp;

async function waitUntilScreenshotReady(page: import('@playwright/test').Page, readyText: ReadyText) {
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(readyText, { exact: typeof readyText === 'string' }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
}

test.describe('golden diff 视觉基线 @visual', () => {
  test.use({ reducedMotion: 'reduce' });

  test.describe('desktop 1440x900', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('statistics-overview', async ({ page }) => {
      await page.addInitScript(() => {
        window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
      });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitUntilScreenshotReady(page, '综合统计驾驶舱');
      await expect(page).toHaveScreenshot('statistics-overview.png', {
        animations: 'disabled',
        maxDiffPixelRatio: 0, // 量测期严格值；试点量测后按实测定
      });
    });

    test('notice-management', async ({ page }) => {
      await page.goto('/grid/notices', { waitUntil: 'domcontentloaded' });
      await waitUntilScreenshotReady(page, '公告列表');
      await expect(page).toHaveScreenshot('notice-management.png', {
        animations: 'disabled',
        maxDiffPixelRatio: 0, // 量测期严格值；试点量测后按实测定
      });
    });
  });

  test.describe('mobile 390x844', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('mobile-home', async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
      });
      await page.goto('/mobile', { waitUntil: 'domcontentloaded' });
      await waitUntilScreenshotReady(page, '治理总览');
      await expect(page).toHaveScreenshot('mobile-home.png', {
        animations: 'disabled',
        maxDiffPixelRatio: 0, // 量测期严格值；试点量测后按实测定
        mask: [page.getByText(/最近同步/)],
      });
    });
  });
});
