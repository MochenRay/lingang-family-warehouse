import { test } from '@playwright/test';

/**
 * UI 截图矩阵工具：为改造前后对比产出标准化截图。
 * 输出到 test-results/ui-screenshots/<viewport>/<route>.png（gitignored）。
 * 不断言内容，仅保证页面渲染完成；失败不阻塞套件其他测试。
 */

type ShotTarget = { route: string; name: string; dismissOverlay?: 'desktop' | 'mobile' };

const DESKTOP_TARGETS: ShotTarget[] = [
  { route: '/', name: 'statistics-overview', dismissOverlay: 'desktop' },
  { route: '/population', name: 'population' },
  { route: '/housing', name: 'housing' },
  { route: '/analysis/demographics', name: 'demographics' },
  { route: '/grid/notices', name: 'notices' },
  { route: '/analysis/comparison', name: 'data-comparison' },
  { route: '/ai/smart-query', name: 'smart-query' },
];

const MOBILE_TARGETS: ShotTarget[] = [
  { route: '/mobile', name: 'mobile-home', dismissOverlay: 'mobile' },
  { route: '/mobile/people', name: 'mobile-people' },
  { route: '/mobile/housing', name: 'mobile-housing' },
  { route: '/mobile/profile', name: 'mobile-profile' },
];

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
        await page.goto(target.route);
        await page.waitForTimeout(1500);
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
      await page.goto(target.route);
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: `test-results/ui-screenshots/mobile-390/${target.name}.png`,
        fullPage: false,
      });
    });
  }
});
