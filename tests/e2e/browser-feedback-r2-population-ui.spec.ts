import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Browser feedback R2 / K2：人口详情头部行序、关系图谱响应式双列、
 * 新增/编辑人口弹窗单开手风琴（未保存输入保留、滚动所有权、键盘 focus）。
 */

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

function collectRuntimeErrors(page: Page, ignorePatterns: RegExp[] = []) {
  const errors: string[] = [];
  const push = (entry: string) => {
    if (ignorePatterns.some((pattern) => pattern.test(entry))) {
      return;
    }
    errors.push(entry);
  };
  page.on('pageerror', (error) => push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      push(`console: ${message.text()}`);
    }
  });
  return errors;
}

/** 页面跳转中止在途走访摘要请求时的既有告警日志（非本次改动引入） */
const ABORTED_VISIT_SUMMARY = /Failed to load population visit summaries/;

async function expectNoPageHorizontalOverflow(page: Page) {
  const delta = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(delta).toBeLessThanOrEqual(0);
}

async function gotoPopulationLedger(page: Page) {
  await page.goto('/population');
  await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible({ timeout: 20_000 });
}

async function openFirstPopulationDetail(page: Page) {
  await page.getByRole('button', { name: '查看人员' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /人口详情 · .+/ })).toBeVisible();
  // 等待弹窗进场动画（200ms）结束，避免 boundingBox 受 transform 影响
  await page.waitForTimeout(300);
  return dialog;
}

async function openFirstPopulationEdit(page: Page) {
  await page.getByRole('button', { name: '编辑人员' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: '编辑人口' })).toBeVisible();
  return dialog;
}

/** 同住 / 血缘 / 关系网络三个 DetailSection 面板 */
function relationSection(dialog: Locator, title: string) {
  return dialog
    .locator('section')
    .filter({ has: dialog.page().getByRole('heading', { name: title, exact: true }) })
    .first();
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box as NonNullable<typeof box>;
}

test.describe('K2 人口详情信息架构', () => {
  test('详情头部三行：标题+操作 / 徽标 / 住址，关系图谱桌面双列', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page, [ABORTED_VISIT_SUMMARY]);
    await dismissJourneyOverlay(page);
    await page.setViewportSize({ width: 1608, height: 1324 });
    await gotoPopulationLedger(page);
    const dialog = await openFirstPopulationDetail(page);

    // 行一：标题与编辑操作同一行；行二：徽标；行三：住址说明
    const header = page.locator('[data-detail-dialog-header]');
    const title = header.getByRole('heading', { name: /人口详情 · .+/ });
    const editAction = header.getByRole('button', { name: '编辑' });
    const headerRows = header.locator(':scope > *');
    await expect(headerRows).toHaveCount(3);
    const titleBox = await boxOf(title);
    const actionBox = await boxOf(editAction);
    const badgesBox = await boxOf(headerRows.nth(1));
    const addressBox = await boxOf(headerRows.nth(2));
    expect(Math.abs(titleBox.y - actionBox.y)).toBeLessThanOrEqual(4);
    expect(actionBox.x).toBeGreaterThan(titleBox.x);
    expect(badgesBox.y).toBeGreaterThan(titleBox.y + titleBox.height - 1);
    expect(addressBox.y).toBeGreaterThan(badgesBox.y + badgesBox.height - 1);
    await expect(headerRows.nth(2)).toContainText('·');

    // 关系图谱：同住与血缘桌面端横向双列，关系网络占满整行位于下方
    await dialog.getByRole('tab', { name: '关系图谱' }).click();
    const coResident = relationSection(dialog, '同住关系');
    const family = relationSection(dialog, '血缘关系');
    const network = relationSection(dialog, '关系网络');
    await expect(coResident).toBeVisible();
    await expect(family).toBeVisible();
    await expect(network).toBeVisible();
    const coBox = await boxOf(coResident);
    const familyBox = await boxOf(family);
    const networkBox = await boxOf(network);
    expect(Math.abs(coBox.y - familyBox.y)).toBeLessThanOrEqual(2);
    expect(familyBox.x).toBeGreaterThan(coBox.x);
    expect(networkBox.y).toBeGreaterThanOrEqual(Math.max(coBox.y, familyBox.y));
    expect(networkBox.width).toBeGreaterThan(coBox.width + familyBox.width);

    await page.screenshot({
      path: '/tmp/lingang-browser-r2/screenshots/K2-population-detail-1608x1324.png',
      animations: 'disabled',
    });
    expect(runtimeErrors).toEqual([]);
  });

  test('关系图谱在 1024x768 回落单列，关系网络仍在最下方', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page, [ABORTED_VISIT_SUMMARY]);
    await dismissJourneyOverlay(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoPopulationLedger(page);
    const dialog = await openFirstPopulationDetail(page);

    await dialog.getByRole('tab', { name: '关系图谱' }).click();
    const coBox = await boxOf(relationSection(dialog, '同住关系'));
    const familyBox = await boxOf(relationSection(dialog, '血缘关系'));
    const networkBox = await boxOf(relationSection(dialog, '关系网络'));
    // 单列堆叠：血缘在同住下方，关系网络在血缘下方且与二者同宽
    expect(familyBox.y).toBeGreaterThanOrEqual(coBox.y + coBox.height - 1);
    expect(networkBox.y).toBeGreaterThanOrEqual(familyBox.y + familyBox.height - 1);
    expect(Math.abs(networkBox.width - coBox.width)).toBeLessThanOrEqual(2);
    expect(runtimeErrors).toEqual([]);
  });
});

test.describe('K2 人口表单单开手风琴', () => {
  test('七个分区、基础信息默认展开、单开互斥、切换不丢未保存输入（新增与编辑）', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await dismissJourneyOverlay(page);
    await page.setViewportSize({ width: 1608, height: 1324 });
    await gotoPopulationLedger(page);

    const expectedSections = ['basic', 'detail', 'biography', 'activity', 'health', 'events', 'tags'];

    // 编辑弹窗
    const dialog = await openFirstPopulationEdit(page);
    await expect(dialog.locator('[data-form-accordion-item]')).toHaveCount(7);
    for (const [index, id] of expectedSections.entries()) {
      await expect(dialog.locator('[data-form-accordion-item]').nth(index)).toHaveAttribute(
        'data-form-accordion-item',
        id,
      );
    }

    const basicTrigger = dialog.locator('#form-section-trigger-basic');
    const detailTrigger = dialog.locator('#form-section-trigger-detail');
    // 基础信息默认展开，其余收起
    await expect(basicTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(detailTrigger).toHaveAttribute('aria-expanded', 'false');

    // 在基础信息输入未保存内容
    const nameInput = dialog.locator('#form-section-panel-basic input').first();
    await nameInput.fill('手风琴保留测试');

    // 单开互斥：打开详细信息后基础信息收起
    await detailTrigger.click();
    await expect(detailTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(basicTrigger).toHaveAttribute('aria-expanded', 'false');

    // 切回基础信息：未保存输入仍在
    await basicTrigger.click();
    await expect(basicTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(dialog.locator('#form-section-panel-basic input').first()).toHaveValue('手风琴保留测试');

    // collapsible：再次点击已展开组可全部折叠
    await basicTrigger.click();
    await expect(basicTrigger).toHaveAttribute('aria-expanded', 'false');
    // 折叠后重新展开，输入依然保留
    await basicTrigger.click();
    await expect(dialog.locator('#form-section-panel-basic input').first()).toHaveValue('手风琴保留测试');

    await dialog.getByRole('button', { name: '取消' }).click();
    await expect(dialog).toBeHidden();

    // 新增弹窗：同样具备七分区且基础信息默认展开
    await page.getByRole('button', { name: '新增人口' }).click();
    const addDialog = page.getByRole('dialog');
    await expect(addDialog.getByRole('heading', { name: '新增人口' })).toBeVisible();
    await expect(addDialog.locator('[data-form-accordion-item]')).toHaveCount(7);
    await expect(addDialog.locator('#form-section-trigger-basic')).toHaveAttribute('aria-expanded', 'true');
    await expect(addDialog.locator('#form-section-trigger-tags')).toHaveAttribute('aria-expanded', 'false');
    await addDialog.getByRole('button', { name: '取消' }).click();
    await expect(addDialog).toBeHidden();
    expect(runtimeErrors).toEqual([]);
  });

  test('弹窗主体承担滚动，标题区与底部操作保持可见（1024x768）', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await dismissJourneyOverlay(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoPopulationLedger(page);
    const dialog = await openFirstPopulationEdit(page);

    // 打开内容较多的健康档案分区，确保主体出现溢出
    await dialog.locator('#form-section-trigger-health').click();
    const scrollViewport = dialog.locator('[data-form-scroll-body]');
    const metrics = await scrollViewport.evaluate((element) => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
    }));
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

    // 滚到底部后：弹窗外框自身不滚动，标题与底部操作仍钉在可视区内
    await scrollViewport.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const dialogBox = await boxOf(dialog);
    const contentMetrics = await dialog.evaluate((element) => ({
      scrollTop: element.scrollTop,
      scrollable: element.scrollHeight - element.clientHeight,
    }));
    expect(contentMetrics.scrollTop).toBe(0);
    expect(contentMetrics.scrollable).toBeLessThanOrEqual(1);

    const titleBox = await boxOf(dialog.getByRole('heading', { name: '编辑人口' }));
    const saveBox = await boxOf(dialog.getByRole('button', { name: '保存' }));
    expect(titleBox.y).toBeGreaterThanOrEqual(dialogBox.y - 1);
    expect(saveBox.y + saveBox.height).toBeLessThanOrEqual(dialogBox.y + dialogBox.height + 1);
    expect(runtimeErrors).toEqual([]);
  });

  test('手风琴键盘可操作且 focus 可见', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await dismissJourneyOverlay(page);
    await gotoPopulationLedger(page);
    const dialog = await openFirstPopulationEdit(page);

    // 仅用键盘把焦点移到任一 accordion trigger（弹窗内焦点被 trap，循环 Tab 必达）
    let focusedId = '';
    for (let step = 0; step < 40; step += 1) {
      await page.keyboard.press('Tab');
      focusedId = await page.evaluate(() => document.activeElement?.id ?? '');
      if (focusedId.startsWith('form-section-trigger-')) {
        break;
      }
    }
    expect(focusedId.startsWith('form-section-trigger-')).toBe(true);

    // 键盘聚焦（:focus-visible 命中），且 trigger 带 focus-visible 环样式
    await expect(page.locator(`#${focusedId}`)).toBeFocused();
    const focusVisibility = await page.evaluate(
      () => document.activeElement?.matches(':focus-visible') ?? false,
    );
    expect(focusVisibility).toBe(true);
    await expect(page.locator(`#${focusedId}`)).toHaveClass(/focus-visible:ring-2/);

    // Enter 键开合分区
    const trigger = page.locator(`#${focusedId}`);
    const before = await trigger.getAttribute('aria-expanded');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', before === 'true' ? 'false' : 'true');
    expect(runtimeErrors).toEqual([]);
  });

  test('390x844 新增/编辑弹窗无横向溢出', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await dismissJourneyOverlay(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoPopulationLedger(page);
    const dialog = await openFirstPopulationEdit(page);

    // 弹窗自身与其滚动主体均无横向溢出
    for (const locator of [dialog, dialog.locator('[data-form-scroll-body]')]) {
      const delta = await locator.evaluate(
        (element) => element.scrollWidth - element.clientWidth,
      );
      expect(delta).toBeLessThanOrEqual(1);
    }
    // 逐组展开复验溢出
    for (const id of ['detail', 'biography', 'activity', 'health', 'events', 'tags']) {
      await dialog.locator(`#form-section-trigger-${id}`).click();
      const delta = await dialog.evaluate((element) => element.scrollWidth - element.clientWidth);
      expect(delta).toBeLessThanOrEqual(1);
    }
    await expectNoPageHorizontalOverflow(page);

    await dialog.locator('#form-section-trigger-basic').click();
    await page.screenshot({
      path: '/tmp/lingang-browser-r2/screenshots/K2-population-edit-390x844.png',
      animations: 'disabled',
    });
    expect(runtimeErrors).toEqual([]);
  });
});
