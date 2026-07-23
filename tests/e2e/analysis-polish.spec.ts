import { expect, test, type Page } from '@playwright/test';

async function goto(page: Page, path: string, title: string) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
  await page.goto(path);
  await expect(page.locator('[data-page-title]')).toHaveText(title);
}

function numericAttributes(values: Array<string | null>) {
  return values.map((value) => Number(value));
}

test.describe('analysis page polish', () => {
  test.use({ viewport: { width: 1502, height: 900 } });

  test('重点区县使用紧凑双列卡片', async ({ page }) => {
    await goto(page, '/analysis/housing', '房屋网格画像');

    const cards = page.getByTestId('district-priority-card');
    await expect(cards).toHaveCount(6);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs((first?.y ?? 0) - (second?.y ?? 0))).toBeLessThan(3);
    expect(first?.height ?? 999).toBeLessThan(130);
  });

  test('热区矩阵按多列铺开且保留全部网格板', async ({ page }) => {
    await goto(page, '/analysis/warning-map', '预警热区');

    const groups = page.getByTestId('zone-group');
    const boards = page.getByTestId('zone-board');
    await expect(groups).toHaveCount(11);
    await expect(boards).toHaveCount(12);
    const first = await groups.nth(0).boundingBox();
    const second = await groups.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(Math.abs((first?.y ?? 0) - (second?.y ?? 0))).toBeLessThan(3);
  });

  test('报表配置与记录卡内容自适应且不再显示内部口吻', async ({ page }) => {
    await goto(page, '/analysis/reports', '报表中心');

    await expect(page.getByText('只记录当前会话里真实生成过的导出包，不伪装成历史归档。')).toHaveCount(0);
    const empty = page.locator('[data-page-state="empty"]');
    await expect(empty).toBeVisible();
    const box = await empty.boundingBox();
    expect(box?.height ?? 999).toBeLessThan(150);
  });

  test('标签目录以键盘可用的查看按钮打开详情弹窗', async ({ page }) => {
    await goto(page, '/tags', '标签管理');

    await expect(page.getByText(/当前只保留首批|当前阶段固定首批|覆盖人数是派生值/)).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible();
    const viewButton = page.getByRole('button', { name: /^查看.+详情$/ }).first();
    await viewButton.focus();
    await viewButton.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('覆盖对象', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('标签分析下方两卡等宽', async ({ page }) => {
    await goto(page, '/analysis/tags', '标签分析画像');

    const riskCard = page.getByRole('heading', { name: '风险层级分布' }).locator('xpath=ancestor::*[@data-slot="card"][1]');
    const crossCard = page.getByRole('heading', { name: '交叉分析' }).locator('xpath=ancestor::*[@data-slot="card"][1]');
    const riskBox = await riskCard.boundingBox();
    const crossBox = await crossCard.boundingBox();
    expect(riskBox).not.toBeNull();
    expect(crossBox).not.toBeNull();
    expect(Math.abs((riskBox?.width ?? 0) - (crossBox?.width ?? 0))).toBeLessThan(3);
  });

  test('绩效卡保留规则弹窗并支持六项指标双向排序', async ({ page }) => {
    await goto(page, '/grid/behavior', '行为督导中心');

    await expect(page.getByRole('tab', { name: '数据质量监控' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: '绩效排名' })).toBeVisible();

    const rulesButton = page.getByRole('button', { name: '评分规则说明' });
    await rulesButton.focus();
    await rulesButton.press('Enter');
    const rulesDialog = page.getByRole('dialog');
    await expect(rulesDialog.getByRole('heading', { name: '评分规则说明' })).toBeVisible();
    await expect(rulesDialog).toContainText('走访频次×25%');
    await page.keyboard.press('Escape');

    const sortButtons = page.locator('[data-testid^="performance-sort-"]');
    await expect(sortButtons).toHaveCount(6);
    const sortableFields = [
      ['visitFreq', 'data-visit-freq'],
      ['visitQuality', 'data-visit-quality'],
      ['infoComplete', 'data-info-complete'],
      ['taskCount', 'data-task-count'],
      ['taskSpeed', 'data-task-speed'],
      ['totalScore', 'data-total-score'],
    ] as const;
    const rows = page.getByTestId('performance-ranking-row');
    for (const [sortKey, attribute] of sortableFields) {
      const sortButton = page.getByTestId(`performance-sort-${sortKey}`);
      if (await sortButton.getAttribute('data-sort-direction') !== 'desc') {
        await sortButton.click();
      }
      await expect(sortButton).toHaveAttribute('data-sort-direction', 'desc');
      const descending = numericAttributes(await rows.evaluateAll((elements, attr) => elements.map((element) => element.getAttribute(attr)), attribute));
      expect(descending, `${sortKey} 应按降序排列`).toEqual([...descending].sort((left, right) => right - left));

      await sortButton.click();
      await expect(sortButton).toHaveAttribute('data-sort-direction', 'asc');
      const ascending = numericAttributes(await rows.evaluateAll((elements, attr) => elements.map((element) => element.getAttribute(attr)), attribute));
      expect(ascending, `${sortKey} 应按升序排列`).toEqual([...ascending].sort((left, right) => left - right));
    }
  });
});

test.describe('analysis page responsive guard', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const [path, title] of [
    ['/analysis/housing', '房屋网格画像'],
    ['/analysis/warning-map', '预警热区'],
    ['/analysis/reports', '报表中心'],
    ['/tags', '标签管理'],
    ['/analysis/tags', '标签分析画像'],
    ['/grid/behavior', '行为督导中心'],
  ] as const) {
    test(`${title} 窄屏无整页横向溢出`, async ({ page }) => {
      await goto(page, path, title);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
