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
 * 时钟冻结（评审阻断修复）：dashboard 的 trendData 月份标签（`_month_labels(now, 6)`）
 * 与 metadata.generatedAt 由后端按墙钟滚动，跨月必漂——经 page.route 保留真实响应、
 * 仅钉死这两个时钟字段为固定 fixture（固定时钟 2026-07-15 的真实种子聚合值，与
 * 2026-07 内任意日期滚动值逐月相同，故既有基线无需重建）。
 * 已审计本批次 3 页其余字段无墙钟依赖：riskTagsSummary.delta 与 conflictStats.today
 * 不在试点页渲染；task projection 的 overdue 计数不在移动 home 渲染。
 *
 * 阈值：试点量测后按冻结稿定 maxDiffPixelRatio（不预设）。
 */

// 固定时钟 fixture：值经 backend seed 实测（tmp 探针脚本计算 _build_trend_data(now=2026-07-15)）
const DASHBOARD_CLOCK_FIXTURE = {
  generatedAt: '2026-07-15 12:00:00',
  trendData: [
    { month: '2月', value: 0 },
    { month: '3月', value: 0 },
    { month: '4月', value: 1917 },
    { month: '5月', value: 1917 },
    { month: '6月', value: 1917 },
    { month: '7月', value: 1917 },
  ],
};

/** 保留真实 dashboard 响应，仅钉死墙钟滚动字段（trendData / metadata.generatedAt）。 */
async function pinDashboardClock(page: import('@playwright/test').Page) {
  await page.route('**/api/stats/dashboard**', async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    json.metadata.generatedAt = DASHBOARD_CLOCK_FIXTURE.generatedAt;
    json.trendData = DASHBOARD_CLOCK_FIXTURE.trendData;
    await route.fulfill({ response, json });
  });
}

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
      await pinDashboardClock(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitUntilScreenshotReady(page, '综合统计驾驶舱');
      await expect(page).toHaveScreenshot('statistics-overview.png', {
        animations: 'disabled',
        maxDiffPixelRatio: 0.002, // 量测：首轮 3 跑 + 阻断修复后 strict 0 两跑均零像素差；
        // 按冻结稿估计带（0.002–0.005）取下限作 runner 镜像字体光栅化漂移余量
      });
    });

    test('notice-management', async ({ page }) => {
      // 本页无墙钟依赖字段（公告日期为种子固定值，「今日发布」恒 0），无需时钟拦截
      await page.goto('/grid/notices', { waitUntil: 'domcontentloaded' });
      await waitUntilScreenshotReady(page, '公告列表');
      await expect(page).toHaveScreenshot('notice-management.png', {
        animations: 'disabled',
        maxDiffPixelRatio: 0.002, // 量测：首轮 3 跑 + 阻断修复后 strict 0 两跑均零像素差；
        // 按冻结稿估计带（0.002–0.005）取下限作 runner 镜像字体光栅化漂移余量
      });
    });
  });

  test.describe('mobile 390x844', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('mobile-home', async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
      });
      await pinDashboardClock(page);
      await page.goto('/mobile', { waitUntil: 'domcontentloaded' });
      await waitUntilScreenshotReady(page, '治理总览');
      await expect(page).toHaveScreenshot('mobile-home.png', {
        animations: 'disabled',
        maxDiffPixelRatio: 0.002, // 量测：首轮 3 跑 + 阻断修复后 strict 0 两跑均零像素差；
        // 按冻结稿估计带（0.002–0.005）取下限作 runner 镜像字体光栅化漂移余量
        mask: [page.getByText(/最近同步/)],
      });
    });
  });
});
