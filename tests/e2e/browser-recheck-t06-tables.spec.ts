import { expect, test, type Locator, type Page } from '@playwright/test';

const VIEWPORTS = [
  { width: 1507, height: 1324 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
] as const;

const TABLE_ROUTES = [
  '/',
  '/population',
  '/relationship',
  '/tags',
  '/analysis/comparison',
  '/grid/conflicts',
  '/grid/notices',
  '/grid/rules',
  '/settings/users',
  '/settings/permissions',
  '/settings/logs',
] as const;

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

function collectRuntimeErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  return { consoleErrors, pageErrors };
}

async function expectNoPageHorizontalOverflow(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    .toBeLessThanOrEqual(1);
}

async function contentStartX(cell: Locator) {
  return cell.evaluate((element) => {
    const directContent = Array.from(element.children).find((child) => {
      const rect = child.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (directContent) return directContent.getBoundingClientRect().left;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textStarts: number[] = [];
    let node = walker.nextNode();
    while (node) {
      if (node.textContent?.trim()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) textStarts.push(rect.left);
      }
      node = walker.nextNode();
    }
    if (textStarts.length > 0) return Math.min(...textStarts);

    const interactive = element.querySelector<HTMLElement>('button, input, [role="checkbox"], [role="switch"]');
    if (interactive) return interactive.getBoundingClientRect().left;

    const style = getComputedStyle(element);
    return element.getBoundingClientRect().left + Number.parseFloat(style.paddingLeft || '0');
  });
}

async function expectFirstRowAligned(table: Locator, label = 'table') {
  const headers = table.getByRole('columnheader');
  const firstRow = table.locator('tbody tr:has(td:not([colspan]))').first();
  const cells = firstRow.locator('td');
  const headerCount = await headers.count();
  const cellCount = await cells.count();
  if (headerCount === 0 || cellCount === 0) return;

  expect(cellCount).toBe(headerCount);
  for (let index = 0; index < headerCount; index += 1) {
    const [headerMetrics, cellMetrics] = await Promise.all([
      headers.nth(index).evaluate((element) => {
        const style = getComputedStyle(element);
        const child = Array.from(element.children).find((candidate) => {
          const rect = candidate.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        const childStyle = child ? getComputedStyle(child) : null;
        return {
          edge: element.getBoundingClientRect().left + Number.parseFloat(style.paddingLeft),
          textAlign: style.textAlign,
          childStart: child?.getBoundingClientRect().left ?? null,
          childTag: child?.tagName ?? null,
          childDisplay: childStyle?.display ?? null,
          childJustify: childStyle?.justifyContent ?? null,
        };
      }),
      cells.nth(index).evaluate((element) => {
        const style = getComputedStyle(element);
        const child = Array.from(element.children).find((candidate) => {
          const rect = candidate.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        const childStyle = child ? getComputedStyle(child) : null;
        return {
          edge: element.getBoundingClientRect().left + Number.parseFloat(style.paddingLeft),
          textAlign: style.textAlign,
          childStart: child?.getBoundingClientRect().left ?? null,
          childTag: child?.tagName ?? null,
          childDisplay: childStyle?.display ?? null,
          childJustify: childStyle?.justifyContent ?? null,
        };
      }),
    ]);
    expect(headerMetrics.textAlign, `${label} header ${index + 1} should be left aligned`).toBe('left');
    expect(cellMetrics.textAlign, `${label} cell ${index + 1} should be left aligned`).toBe('left');
    expect(Math.abs(headerMetrics.edge - cellMetrics.edge), `${label} column ${index + 1} should share a left edge`).toBeLessThanOrEqual(1.5);
    for (const [kind, metrics] of [['header', headerMetrics], ['cell', cellMetrics]] as const) {
      if (metrics.childStart !== null) {
        expect(Math.abs(metrics.childStart - metrics.edge), `${label} ${kind} ${index + 1} content should start at the left edge`).toBeLessThanOrEqual(1.5);
      }
      if (metrics.childTag === 'DIV' && (metrics.childDisplay === 'flex' || metrics.childDisplay === 'inline-flex' || metrics.childDisplay === 'grid' || metrics.childDisplay === 'inline-grid')) {
        expect(['normal', 'start', 'flex-start'], `${label} ${kind} ${index + 1} should not center/end its content`).toContain(metrics.childJustify);
      }
    }
  }
}

async function expectTableScrollsToLastColumn(table: Locator, lastColumn: string, page: Page) {
  const scroller = table.locator('xpath=..');
  const metrics = await scroller.evaluate((element) => ({
    overflowX: getComputedStyle(element).overflowX,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(['auto', 'scroll']).toContain(metrics.overflowX);
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);

  await table.locator('tbody tr').first().hover();
  const initialLeft = await scroller.evaluate((element) => element.scrollLeft);
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await page.mouse.wheel(480, 0);
    await page.waitForTimeout(40);
  }
  expect(await scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(initialLeft);

  const [headerBox, scrollerBox] = await Promise.all([
    table.getByRole('columnheader', { name: lastColumn, exact: true }).boundingBox(),
    scroller.boundingBox(),
  ]);
  expect(headerBox).not.toBeNull();
  expect(scrollerBox).not.toBeNull();
  expect(headerBox!.x).toBeGreaterThanOrEqual(scrollerBox!.x - 1);
  expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(scrollerBox!.x + scrollerBox!.width + 1);
}

test.describe('T06 R40-R42 首页与全局桌面表格', () => {
  test.beforeEach(async ({ page }) => {
    await dismissJourneyOverlay(page);
  });

  for (const viewport of VIEWPORTS) {
    test(`R40/R41/R42 首页 ${viewport.width}x${viewport.height}`, async ({ page }) => {
      const runtimeErrors = collectRuntimeErrors(page);
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.getByRole('heading', { name: '综合统计驾驶舱' })).toBeVisible({ timeout: 20_000 });

      const actionStrip = page.getByTestId('dashboard-action-strip');
      await expect(actionStrip).toBeVisible();
      await expect(actionStrip).toContainText('AI 研判与行动清单 · 本月');
      await expect(actionStrip.getByTestId('dashboard-action-item')).toHaveCount(3);
      await expect(actionStrip.getByText('总人口', { exact: true })).toHaveCount(0);
      await expect(actionStrip.getByText('本月走访', { exact: true })).toHaveCount(0);
      await expect(actionStrip.getByText('区县样本', { exact: true })).toHaveCount(0);

      const stripMetrics = await actionStrip.evaluate((element) => ({
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      }));
      expect(stripMetrics.scrollWidth).toBeLessThanOrEqual(stripMetrics.clientWidth + 1);
      if (viewport.width >= 1440) {
        const centerYs = await actionStrip.locator('[data-action-strip-content]').evaluateAll((elements) =>
          elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return rect.top + rect.height / 2;
          }),
        );
        expect(Math.max(...centerYs) - Math.min(...centerYs)).toBeLessThanOrEqual(1.5);
      }

      const districtTable = page.getByTestId('district-overview-table');
      const rankHeader = districtTable.getByRole('columnheader', { name: '排名', exact: true });
      await expect(rankHeader).toBeVisible();
      expect(await rankHeader.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element.querySelector('span') ?? element);
        return range.getClientRects().length;
      })).toBe(1);

      const firstDistrictBefore = await districtTable.locator('tbody tr').first().locator('td').nth(1).innerText();
      await rankHeader.getByRole('button').click();
      await expect(rankHeader).toHaveAttribute('aria-sort', 'descending');
      await rankHeader.getByRole('button').click();
      await expect(rankHeader).toHaveAttribute('aria-sort', 'ascending');
      await expect.poll(() => districtTable.locator('tbody tr').first().locator('td').nth(1).innerText()).not.toBe(firstDistrictBefore);

      await expectFirstRowAligned(districtTable);
      const riskHeaderStart = await contentStartX(districtTable.getByRole('columnheader', { name: '风险指数', exact: true }));
      const riskContentStart = await districtTable.getByTestId('district-risk-content').first().evaluate((element) => element.getBoundingClientRect().left);
      expect(Math.abs(riskHeaderStart - riskContentStart)).toBeLessThanOrEqual(1.5);

      await expectNoPageHorizontalOverflow(page);
      expect(runtimeErrors).toEqual({ consoleErrors: [], pageErrors: [] });
      await page.locator('main').evaluate((element) => {
        element.scrollTop = 0;
      });
      await page.screenshot({
        path: `/tmp/lingang-browser-recheck-t06-home-${viewport.width}x${viewport.height}.png`,
        animations: 'disabled',
      });
      await districtTable.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `/tmp/lingang-browser-recheck-t06-home-${viewport.width}x${viewport.height}-table.png`,
        animations: 'disabled',
      });
    });
  }

  test('R42 全部桌面数据表首行与列标题共享左起始边', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const route of TABLE_ROUTES) {
      await page.goto(route);
      const tables = page.locator('table:visible');
      await expect(tables.first(), `${route} should expose a desktop data table`).toBeVisible({ timeout: 20_000 });
      await page.waitForLoadState('networkidle');
      const tableCount = await tables.count();
      for (let index = 0; index < tableCount; index += 1) {
        await expectFirstRowAligned(tables.nth(index), `${route} table ${index + 1}`);
      }
      await expectNoPageHorizontalOverflow(page);
    }

    await page.goto('/batch-import');
    await page.getByRole('button', { name: '导入历史', exact: true }).click();
    const importHistoryTable = page.getByRole('dialog').getByRole('table');
    await expect(importHistoryTable).toBeVisible();
    await expectFirstRowAligned(importHistoryTable, '/batch-import history table');
    await expectNoPageHorizontalOverflow(page);

    await page.goto('/grid/activities');
    await page.getByRole('tab', { name: /历史活动档案/ }).click();
    const activityHistoryTable = page.locator('table:visible');
    await expect(activityHistoryTable).toBeVisible();
    await expectFirstRowAligned(activityHistoryTable, '/grid/activities history table');
    await expectNoPageHorizontalOverflow(page);

    await page.goto('/tags');
    const tagTable = page.locator('table:visible').first();
    const coverageHeader = tagTable.getByRole('columnheader', { name: '覆盖人数', exact: true });
    const coverageCell = tagTable.locator('tbody tr:has(td:not([colspan]))').first().locator('td').nth(3);
    await expect(coverageCell).toBeVisible();
    const [coverageHeaderMetrics, coverageCellMetrics] = await Promise.all([
      coverageHeader.evaluate((element) => ({
        start: element.getBoundingClientRect().left + Number.parseFloat(getComputedStyle(element).paddingLeft),
        textAlign: getComputedStyle(element).textAlign,
      })),
      coverageCell.evaluate((element) => ({
        start: element.getBoundingClientRect().left + Number.parseFloat(getComputedStyle(element).paddingLeft),
        textAlign: getComputedStyle(element).textAlign,
      })),
    ]);
    expect(coverageHeaderMetrics.textAlign).toBe('left');
    expect(coverageCellMetrics.textAlign).toBe('left');
    expect(Math.abs(coverageHeaderMetrics.start - coverageCellMetrics.start)).toBeLessThanOrEqual(1.5);

    expect(runtimeErrors).toEqual({ consoleErrors: [], pageErrors: [] });
  });

  test('R42 人口 sticky 与 K1 用户/日志表保持容器内横向滚动', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.goto('/population');
    const populationTable = page.getByRole('table');
    await expect(populationTable.getByRole('columnheader', { name: '姓名', exact: true })).toBeVisible({ timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    const populationScroller = populationTable.locator('xpath=..');
    const stickyHeaders = [
      populationTable.getByRole('columnheader').nth(0),
      populationTable.getByRole('columnheader', { name: '姓名', exact: true }),
      populationTable.getByRole('columnheader', { name: '操作', exact: true }),
    ];
    for (const header of stickyHeaders) {
      expect(await header.evaluate((element) => getComputedStyle(element).position)).toBe('sticky');
    }
    const pinnedBefore = await Promise.all(stickyHeaders.slice(0, 2).map((header) => header.boundingBox()));
    await populationScroller.evaluate((element) => {
      element.scrollLeft = element.scrollWidth - element.clientWidth;
    });
    const pinnedAfter = await Promise.all(stickyHeaders.slice(0, 2).map((header) => header.boundingBox()));
    for (let index = 0; index < pinnedBefore.length; index += 1) {
      expect(Math.abs(pinnedAfter[index]!.x - pinnedBefore[index]!.x)).toBeLessThanOrEqual(1.5);
    }
    const [populationScrollerBox, operationHeaderBox] = await Promise.all([
      populationScroller.boundingBox(),
      stickyHeaders[2].boundingBox(),
    ]);
    expect(operationHeaderBox!.x + operationHeaderBox!.width).toBeLessThanOrEqual(populationScrollerBox!.x + populationScrollerBox!.width + 1);
    await expectNoPageHorizontalOverflow(page);

    await page.goto('/settings/users');
    const userTable = page.locator('[data-testid="user-table-card"] table');
    await expect(userTable).toBeVisible({ timeout: 20_000 });
    await expectTableScrollsToLastColumn(userTable, '操作', page);
    await expectNoPageHorizontalOverflow(page);

    await page.goto('/settings/logs');
    const logTable = page.getByRole('table');
    await expect(logTable).toBeVisible({ timeout: 20_000 });
    await expectTableScrollsToLastColumn(logTable, '耗时', page);
    await expectNoPageHorizontalOverflow(page);

    expect(runtimeErrors).toEqual({ consoleErrors: [], pageErrors: [] });
  });
});
