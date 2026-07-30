import { expect, test, type Locator, type Page } from '@playwright/test';

const EVIDENCE_DIR = '/tmp/lingang-browser-feedback-b01-b18';
const NOTICE_FIELDS = ['通知对象', '工作任务', '时间安排', '覆盖范围', '执行要求', '反馈方式', '责任分工'];

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

async function openRelationship(page: Page) {
  await page.goto('/relationship');
  const trigger = page.getByRole('button', { name: '查看关系详情' }).first();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: '人房关系详情' })).toBeVisible();
  return { dialog, trigger };
}

async function openConflict(page: Page) {
  await page.goto('/grid/conflicts');
  await expect(page.getByRole('columnheader', { name: '标题' })).toBeVisible({ timeout: 20_000 });
  const trigger = page.getByRole('button', { name: '查看详情' }).first();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: '案件概况' })).toBeVisible({ timeout: 20_000 });
  return { dialog, trigger };
}

async function openNotice(page: Page) {
  await page.goto('/grid/notices');
  const trigger = page.getByRole('button', { name: '预览公告' }).first();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: '通知正文' })).toBeVisible({ timeout: 20_000 });
  return { dialog, trigger };
}

async function boxes(locator: Locator[]) {
  return Promise.all(locator.map((item) => item.boundingBox()));
}

test.describe('B13-B17 治理详情与日志展示', () => {
  test.beforeEach(async ({ page }) => {
    await dismissJourneyOverlay(page);
  });

  test('B13 人房关系地址左、pills 右，窄屏换行至标题下元数据行', async ({ page }) => {
    await page.setViewportSize({ width: 1573, height: 1324 });
    const { dialog, trigger } = await openRelationship(page);
    const meta = dialog.getByTestId('relationship-detail-meta');
    const address = meta.getByTestId('relationship-detail-address');
    const pills = meta.getByTestId('relationship-detail-pills');
    await expect(meta).toBeVisible();
    const [wideAddress, widePills] = await boxes([address, pills]);
    expect(Math.abs(wideAddress!.y - widePills!.y)).toBeLessThanOrEqual(3);
    expect(widePills!.x).toBeGreaterThan(wideAddress!.x);

    await page.setViewportSize({ width: 480, height: 900 });
    const [narrowAddress, narrowPills] = await boxes([address, pills]);
    expect(narrowPills!.y).toBeGreaterThanOrEqual(narrowAddress!.y + narrowAddress!.height - 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('B14 待办审批为六列表格且通过后自动转历史档案', async ({ page }) => {
    await page.goto('/grid/activities');
    const pendingTab = page.getByRole('tab', { name: /待办审批/ });
    const historyTab = page.getByRole('tab', { name: /历史活动档案/ });
    await expect(pendingTab).toHaveAttribute('aria-selected', 'true');
    for (const column of ['活动', '类型', '时间', '申请人', '参与预测', '操作']) {
      await expect(page.getByRole('columnheader', { name: column, exact: true })).toBeVisible();
    }
    const row = page.getByRole('row', { name: /防诈骗宣传讲座/ });
    await expect(row.getByRole('button', { name: '查看' })).toBeVisible();
    await expect(row.getByRole('button', { name: '通过' })).toBeVisible();
    await expect(row.getByRole('button', { name: '驳回' })).toBeVisible();
    const historyBefore = Number((await historyTab.textContent())?.match(/\((\d+)\)/)?.[1]);
    await row.getByRole('button', { name: '通过' }).click();
    await page.getByRole('dialog').getByRole('button', { name: '通过' }).click();
    await expect(historyTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('row', { name: /防诈骗宣传讲座/ })).toBeVisible();
    await expect(historyTab).toContainText('历史活动档案 (' + (historyBefore + 1) + ')');
  });

  test('B15 纠纷三类 pills 在宽屏标题右侧，窄屏落到标题下方', async ({ page }) => {
    await page.setViewportSize({ width: 1573, height: 1324 });
    const { dialog } = await openConflict(page);
    const title = dialog.locator('[data-detail-dialog-header] h2');
    const statuses = dialog.getByTestId('conflict-detail-statuses');
    await expect(statuses.locator('span.rounded-full')).toHaveCount(3);
    await expect.poll(async () => {
      const [titleBox, statusesBox] = await boxes([title, statuses]);
      return titleBox && statusesBox ? Math.abs(statusesBox.y - titleBox.y) : Number.POSITIVE_INFINITY;
    }).toBeLessThanOrEqual(5);
    const [wideTitle, wideStatuses] = await boxes([title, statuses]);
    expect(wideStatuses!.x).toBeGreaterThan(wideTitle!.x + wideTitle!.width);

    await page.setViewportSize({ width: 480, height: 900 });
    await expect.poll(async () => {
      const [titleBox, statusesBox] = await boxes([title, statuses]);
      return titleBox && statusesBox ? statusesBox.y - (titleBox.y + titleBox.height) : Number.NEGATIVE_INFINITY;
    }).toBeGreaterThanOrEqual(-2);
  });

  test('B16 公告七字段宽屏两等列、窄屏单列且无跨列特例', async ({ page }) => {
    await page.setViewportSize({ width: 1573, height: 1324 });
    const { dialog } = await openNotice(page);
    const fields = NOTICE_FIELDS.map((name) => dialog.getByText(name, { exact: true }).locator('xpath=..'));
    const wide = await boxes(fields);
    expect(Math.abs(wide[0]!.y - wide[1]!.y)).toBeLessThanOrEqual(2);
    expect(wide[2]!.y).toBeGreaterThan(wide[0]!.y + 2);
    const widths = wide.map((box) => Math.round(box!.width));
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(2);

    await page.setViewportSize({ width: 480, height: 900 });
    const narrow = await boxes(fields);
    for (let index = 1; index < narrow.length; index += 1) {
      expect(narrow[index]!.y).toBeGreaterThan(narrow[index - 1]!.y + narrow[index - 1]!.height - 2);
    }
  });

  test('B17 两个饼图扇区、图例、值与 sr-only 数据一一对应并响应式排列', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/settings/logs');
    const typeChart = page.getByTestId('log-type-pie');
    const moduleChart = page.getByTestId('log-module-pie');
    await expect(typeChart.locator('.recharts-sector')).toHaveCount(6);
    await expect(moduleChart.locator('.recharts-sector')).toHaveCount(5);
    const typeLegend = page.getByTestId('log-type-legend-item');
    const moduleLegend = page.getByTestId('log-module-legend-item');
    await expect(typeLegend).toHaveCount(6);
    await expect(moduleLegend).toHaveCount(5);
    await expect(page.getByRole('table', { name: '日志操作类型分布数据' }).locator('tbody tr')).toHaveCount(6);
    await expect(page.getByRole('table', { name: '日志模块分布数据' }).locator('tbody tr')).toHaveCount(5);
    const typeColors = await typeLegend.evaluateAll((items) => items.map((item) => item.getAttribute('data-color')));
    const typeSectorColors = await typeChart.locator('.recharts-sector').evaluateAll((items) => items.map((item) => item.getAttribute('fill')));
    expect(typeSectorColors).toEqual(typeColors);
    const [wideType, wideModule] = await boxes([typeChart, moduleChart]);
    expect(Math.abs(wideType!.y - wideModule!.y)).toBeLessThanOrEqual(2);

    await page.setViewportSize({ width: 480, height: 900 });
    await page.reload();
    await expect(typeChart).toBeVisible();
    const [narrowType, narrowModule] = await boxes([typeChart, moduleChart]);
    expect(narrowModule!.y).toBeGreaterThan(narrowType!.y + narrowType!.height - 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  });

  test('四视口治理页无横溢、运行错误并生成日志证据截图', async ({ page }) => {
    test.setTimeout(120_000);
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const requestFailures: string[] = [];
    page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => requestFailures.push(request.method() + ' ' + request.url() + ' ' + (request.failure()?.errorText ?? '')));

    for (const viewport of [
      { width: 1573, height: 1324 },
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 480, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/settings/logs');
      const typeChart = page.getByTestId('log-type-pie');
      await expect(typeChart).toBeVisible();
      await typeChart.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: EVIDENCE_DIR + '/governance-logs-' + viewport.width + 'x' + viewport.height + '.png',
        fullPage: true,
        animations: 'disabled',
      });
      await typeChart.locator('xpath=../..').screenshot({
        path: EVIDENCE_DIR + '/governance-pies-' + viewport.width + 'x' + viewport.height + '.png',
        animations: 'disabled',
      });
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(requestFailures).toEqual([]);
  });
});
