import { expect, test } from '@playwright/test';

/**
 * UI 截图矩阵工具：为改造前后对比产出标准化截图。
 * 输出到 test-results/ui-screenshots/<viewport>/<route>.png（gitignored）。
 * 不断言内容，仅保证页面渲染完成；失败不阻塞套件其他测试。
 */

type ShotTarget = {
  route: string;
  name: string;
  readyText: string | RegExp;
  dismissOverlay?: 'desktop' | 'mobile';
};

const DESKTOP_TARGETS: ShotTarget[] = [
  { route: '/', name: 'statistics-overview', readyText: '综合统计驾驶舱', dismissOverlay: 'desktop' },
  { route: '/population', name: 'population', readyText: '人口管理' },
  { route: '/housing', name: 'housing', readyText: '房屋台账' },
  { route: '/analysis/demographics', name: 'demographics', readyText: '人口特征分析' },
  { route: '/grid/notices', name: 'notices', readyText: '公告列表' },
  { route: '/analysis/comparison', name: 'data-comparison', readyText: '详细数据明细' },
  { route: '/ai/smart-query', name: 'smart-query', readyText: '推荐问题' },
];

const MOBILE_TARGETS: ShotTarget[] = [
  { route: '/mobile', name: 'mobile-home', readyText: '治理总览', dismissOverlay: 'mobile' },
  { route: '/mobile/people', name: 'mobile-people', readyText: /共 \d+ 条人员/ },
  { route: '/mobile/housing', name: 'mobile-housing', readyText: /共 \d+ 条房屋/ },
  { route: '/mobile/profile', name: 'mobile-profile', readyText: '本月工作概览' },
];

test.use({ reducedMotion: 'reduce' });

async function waitUntilScreenshotReady(page: import('@playwright/test').Page, target: ShotTarget) {
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(target.readyText, { exact: typeof target.readyText === 'string' }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1024', width: 1024, height: 768 },
]) {
  test.describe(`desktop matrix ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const target of DESKTOP_TARGETS) {
      test(`${target.name}`, async ({ page }) => {
        if (target.dismissOverlay === 'desktop') {
          await page.addInitScript(() => {
            window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
          });
        }
        await page.goto(target.route, { waitUntil: 'domcontentloaded' });
        await waitUntilScreenshotReady(page, target);
        await page.screenshot({
          path: `test-results/ui-screenshots/${viewport.name}/${target.name}.png`,
          fullPage: false,
        });
      });
    }
  });
}

test.describe('mobile matrix 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const target of MOBILE_TARGETS) {
    test(`${target.name}`, async ({ page }) => {
      if (target.dismissOverlay === 'mobile') {
        await page.addInitScript(() => {
          window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
        });
      }
      await page.goto(target.route, { waitUntil: 'domcontentloaded' });
      await waitUntilScreenshotReady(page, target);
      await page.screenshot({
        path: `test-results/ui-screenshots/mobile-390/${target.name}.png`,
        fullPage: false,
      });
    });
  }
});
