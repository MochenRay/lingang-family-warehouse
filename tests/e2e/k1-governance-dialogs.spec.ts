import { expect, test, type Page } from '@playwright/test';

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

test.describe('K1 治理页面重设计', () => {
  test('R47 知识沉淀资料卡桌面多列网格、窄屏回落单列', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/knowledge');

    const cards = page.locator('[data-knowledge-card]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(3);

    // 默认桌面视口（1280px）：前两张卡位于同一行，说明是多列网格
    const firstBox = await cards.nth(0).boundingBox();
    const secondBox = await cards.nth(1).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();
    expect(Math.abs(secondBox!.y - firstBox!.y)).toBeLessThan(8);

    // 卡片关键信息可读：标题、类型徽标、大小、上传时间与标签
    const firstCard = cards.first();
    await expect(firstCard.locator('h4').first()).toBeVisible();
    await expect(firstCard.getByText(/上传于/).first()).toBeVisible();
    await expect(firstCard.getByRole('button', { name: '预览' })).toBeVisible();
    await expect(firstCard.getByRole('button', { name: '下载' })).toBeVisible();

    // 窄屏：回落为单列，第二张卡移到首张下方
    await page.setViewportSize({ width: 480, height: 900 });
    const narrowFirst = await cards.nth(0).boundingBox();
    const narrowSecond = await cards.nth(1).boundingBox();
    expect(narrowFirst).not.toBeNull();
    expect(narrowSecond).not.toBeNull();
    expect(narrowSecond!.y).toBeGreaterThan(narrowFirst!.y + narrowFirst!.height - 8);
  });

  test('R48 活动管理双 Tab 并列，类型按「类型 · 子分类」层级展示', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/grid/activities');

    const pendingTab = page.getByRole('tab', { name: /待办审批/ });
    const historyTab = page.getByRole('tab', { name: '历史活动档案' });
    await expect(pendingTab).toBeVisible();
    await expect(historyTab).toBeVisible();

    // 有待办时默认落在待办审批
    await expect(pendingTab).toHaveAttribute('aria-selected', 'true');

    // 待办卡片中类型与子分类是层级组合而非孤立 pill
    const pendingCard = page.locator('[data-slot="card"]').filter({ hasText: '防诈骗宣传讲座' });
    await expect(pendingCard.getByText('志愿服务', { exact: true })).toBeVisible();
    await expect(pendingCard.getByText('政策宣传', { exact: true })).toBeVisible();

    // 历史档案表格保持可用，类型列同样是层级展示
    await historyTab.click();
    await expect(page.getByRole('columnheader', { name: '活动名称' })).toBeVisible();
    const historyRow = page.getByRole('row', { name: /社区环境大扫除/ });
    await expect(historyRow.getByText('志愿服务', { exact: true })).toBeVisible();
    await expect(historyRow.getByText('环境整治', { exact: true })).toBeVisible();

    // 搜索筛选保持可用
    await page.getByPlaceholder('搜索活动名称或申请人...').fill('卡拉OK');
    await expect(page.getByRole('row', { name: /社区卡拉OK大赛/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /社区环境大扫除/ })).toHaveCount(0);
    await page.getByPlaceholder('搜索活动名称或申请人...').fill('');
  });

  test('R48 待办审批完成后自动落到历史活动档案', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/grid/activities');

    const pendingTab = page.getByRole('tab', { name: /待办审批/ });
    const historyTab = page.getByRole('tab', { name: '历史活动档案' });
    await expect(pendingTab).toHaveAttribute('aria-selected', 'true');

    // 通过唯一的待办申请，待办清零后自动切到历史档案
    const pendingCard = page.locator('[data-slot="card"]').filter({ hasText: '防诈骗宣传讲座' });
    await pendingCard.getByRole('button', { name: '通过' }).click();
    const confirmDialog = page.getByRole('dialog');
    await confirmDialog.getByRole('button', { name: '通过' }).click();

    await expect(historyTab).toHaveAttribute('aria-selected', 'true');
    // 刚批准的活动出现在历史档案中
    await expect(page.getByRole('row', { name: /防诈骗宣传讲座/ })).toBeVisible();
  });

  test('R49 矛盾详情弹窗按统一骨架分区，且无内部口吻文案', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/grid/conflicts');
    await expect(page.getByRole('columnheader', { name: '标题' })).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: '查看详情' }).first().click();
    const dialog = page.getByRole('dialog');

    // DetailDialogShell 分区层级：概况、建议、人员、房屋、走访处置
    await expect(dialog.getByRole('heading', { name: '案件概况' })).toBeVisible({ timeout: 20_000 });
    await expect(dialog.getByRole('heading', { name: '调解建议' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '关联人员' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '关联房屋' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '走访与处置过程' })).toBeVisible();

    // 快速扫读字段与底部动作
    await expect(dialog.getByText('发生地点', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: '关闭' })).toBeVisible();

    // agent/开发者口吻文案全部清除
    await expect(dialog.getByText('以真实案件对象、地点和过程为准')).toHaveCount(0);
    await expect(dialog.getByText(/真实案件上下文/)).toHaveCount(0);
    await expect(dialog.getByText('社工助手建议')).toHaveCount(0);
    await expect(dialog.getByText(/稳定关联/)).toHaveCount(0);
  });

  test('R50 公告详情弹窗按基层通知结构分区展示', async ({ page }) => {
    await dismissJourneyOverlay(page);
    await page.goto('/grid/notices');
    await expect(page.getByText('公告列表')).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: '预览公告' }).first().click();
    const dialog = page.getByRole('dialog');

    await expect(dialog.getByRole('heading', { name: '通知正文' })).toBeVisible({ timeout: 20_000 });

    // 真实基层通知结构的七个分区全部呈现
    for (const section of ['通知对象', '工作任务', '时间安排', '覆盖范围', '执行要求', '反馈方式', '责任分工']) {
      await expect(dialog.getByText(section, { exact: true })).toBeVisible();
    }

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toHaveCount(0);

    // 打开带附件的核查通知，附件区与正文结构同时展示
    const taskRow = page.getByRole('row', { name: /第一季度信息核查/ });
    await taskRow.getByRole('button', { name: '预览公告' }).click();
    await expect(dialog.getByRole('heading', { name: /附件/ })).toBeVisible({ timeout: 20_000 });
    await expect(dialog.getByText('通知对象', { exact: true })).toBeVisible();
  });
});
