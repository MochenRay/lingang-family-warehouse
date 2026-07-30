import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * browser-feedback-r2 移动端回归（合同 K3-mobile）：
 * - 人员列表 loading / error / success-empty / success-data 四态语义
 * - worker 默认名迁移（网格员 → 张三峰）与自定义名保留
 * - 任务页唯一主滚动容器、sticky 层级、首卡不遮挡、卡片信息顺序
 * 视口 390×844（iPhone 12/13/14 逻辑分辨率）；截图产物写入合同指定目录。
 */

const SCREENSHOT_DIR = '/tmp/lingang-browser-r2/screenshots';

test.use({
  viewport: { width: 390, height: 844 },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
  });
});

test('people 延迟加载期间渲染 loading 分支，不出现「暂无人员信息」', async ({ page }) => {
  await page.route('**/api/people?**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });

  await page.goto('/mobile/people');

  await expect(page.getByTestId('people-loading')).toBeVisible();
  await expect(page.getByText('暂无人员信息', { exact: true })).toHaveCount(0);

  // 延迟加载期间四张统计卡只显示统一占位符，不得出现看似真实的 0
  const statValues = page.getByTestId('people-stat-value');
  await expect(statValues).toHaveCount(4);
  await expect(statValues).toHaveText(['—', '—', '—', '—']);

  // 主 loading 文案全页恰好出现一次；结果计数条只保留中性区域标签
  await expect(page.getByText('正在加载人员信息…', { exact: true })).toHaveCount(1);
  await expect(page.getByText('人员列表', { exact: true })).toBeVisible();

  await page.screenshot({ path: `${SCREENSHOT_DIR}/K3-mobile-people-loading-390x844.png` });

  await expect(page.getByText(/共 \d+ 条人员/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('people-loading')).toHaveCount(0);

  // success 后统计卡恢复真实数字
  const settledValues = await statValues.allTextContents();
  expect(settledValues.every((value) => value.trim() !== '—')).toBe(true);
  expect(settledValues.some((value) => Number.parseInt(value, 10) > 0)).toBe(true);
});

test('people 接口失败渲染错误态，键盘触发重试后恢复数据', async ({ page }) => {
  await page.route('**/api/people?**', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'people unavailable' }),
    });
  });

  await page.goto('/mobile/people');

  await expect(page.getByTestId('people-error')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('暂无人员信息', { exact: true })).toHaveCount(0);

  // 错误态统计卡同样只显示占位符，主 error 文案全页恰好一次，计数条保持中性
  await expect(page.getByTestId('people-stat-value')).toHaveText(['—', '—', '—', '—']);
  await expect(page.getByText('人员信息加载失败', { exact: true })).toHaveCount(1);
  await expect(page.getByText('人员列表', { exact: true })).toBeVisible();

  await page.unroute('**/api/people?**');
  // 重试按钮可键盘触发（focus + Enter）
  await page.getByRole('button', { name: '重试' }).press('Enter');

  await expect(page.getByText(/共 \d+ 条人员/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('people-error')).toHaveCount(0);
});

test('people 搜索无结果时渲染 success-empty 空态', async ({ page }) => {
  await page.goto('/mobile/people');
  await expect(page.getByText(/共 \d+ 条人员/)).toBeVisible({ timeout: 20_000 });

  await page.getByPlaceholder('搜索姓名/身份证/地址...').fill('绝不存在的人名xyz');

  await expect(page.getByText('暂无人员信息', { exact: true })).toBeVisible();
});

test('未设置过 worker 名时默认显示「张三峰」', async ({ page }) => {
  await page.goto('/mobile');

  await expect(page.getByText('张三峰', { exact: true })).toBeVisible();

  // 首页截图必须等真实 dashboard 加载完成：同步时间出现且四指标为非占位真实值（至少一项非零）
  await expect(page.getByText(/最近同步/)).toBeVisible({ timeout: 20_000 });
  const metricValues = page.getByTestId('home-metric-value');
  await expect(metricValues).toHaveCount(4);
  const values = await metricValues.allTextContents();
  expect(values.every((value) => value.trim() !== '—')).toBe(true);
  expect(
    values.some((value) => value.trim() === '99+' || Number.parseInt(value, 10) > 0),
    '首页截图前未加载出真实非零指标',
  ).toBe(true);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/K3-mobile-home-390x844.png`, fullPage: true });
});

test('旧默认名「网格员」一次性迁移为「张三峰」', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('mobile_user', '网格员');
  });

  await page.goto('/mobile');

  await expect(page.getByText('张三峰', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.localStorage.getItem('mobile_user'))).toBe('张三峰');
});

test('用户自定义的 worker 名原样保留', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('mobile_user', '终验网格员');
  });

  await page.goto('/mobile');

  await expect(page.getByText('终验网格员', { exact: true })).toBeVisible();
  await expect(page.getByText('张三峰', { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.localStorage.getItem('mobile_user'))).toBe('终验网格员');
});

test('tasks 唯一主滚动容器，sticky 层级正确且首卡不被遮挡', async ({ page }) => {
  await page.goto('/mobile/tasks?mode=today');

  const firstCard = page.getByTestId('task-card-pending').first();
  await expect(firstCard).toBeVisible({ timeout: 20_000 });

  // 卡片列表容器自身不再滚动（唯一主滚动容器是 MobileLayout 内容区）
  const listOverflow = await firstCard.evaluate((el) => {
    const parent = el.parentElement;
    return parent ? getComputedStyle(parent).overflowY : '';
  });
  expect(listOverflow).not.toBe('auto');
  expect(listOverflow).not.toBe('scroll');

  // 初始位置：首卡完整位于 sticky 区之下
  const initial = await page.evaluate(() => {
    const tabs = document.querySelector('[data-testid="tasks-tabs-sticky"]')!.getBoundingClientRect();
    const card = document.querySelector('[data-testid="task-card-pending"]')!.getBoundingClientRect();
    return { tabsBottom: tabs.bottom, cardTop: card.top };
  });
  expect(initial.cardTop).toBeGreaterThanOrEqual(initial.tabsBottom - 1);

  // 滚动唯一主容器（MobileLayout 内容区）
  const scrollerFound = await page.evaluate(() => {
    let node = document.querySelector('[data-testid="task-card-pending"]')?.parentElement ?? null;
    while (node) {
      const style = getComputedStyle(node);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
        node.scrollTop += 400;
        return true;
      }
      node = node.parentElement;
    }
    return false;
  });
  expect(scrollerFound).toBe(true);
  await page.waitForTimeout(300);

  // 吸顶后：tabs 正好叠在 viewMode 条下方（65px），形成一条稳定 sticky 区
  const sticky = await page.evaluate(() => {
    const bar = document.querySelector('[data-testid="tasks-viewmode-bar"]')!.getBoundingClientRect();
    const tabs = document.querySelector('[data-testid="tasks-tabs-sticky"]')!.getBoundingClientRect();
    return { barBottom: bar.bottom, tabsTop: tabs.top };
  });
  expect(Math.abs(sticky.tabsTop - sticky.barBottom)).toBeLessThanOrEqual(2);

  // z-order：tabs 中心命中的是 sticky tabs 自身，而不是从下方经过的卡片
  const hitIsTabs = await page.evaluate(() => {
    const tabs = document.querySelector('[data-testid="tasks-tabs-sticky"]')!;
    const rect = tabs.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return Boolean(hit && tabs.contains(hit));
  });
  expect(hitIsTabs).toBe(true);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/K3-mobile-tasks-scrolled-390x844.png` });
});

test('任务卡片信息顺序固定为 类型/状态 → 人员动作 → 关爱背景 → 分隔来源行', async ({ page }) => {
  await page.goto('/mobile/tasks?mode=today');

  const firstCard = page.getByTestId('task-card-pending').first();
  await expect(firstCard).toBeVisible({ timeout: 20_000 });

  const tops = await firstCard.evaluate((card) => {
    return ['badges', 'subject', 'context', 'footer'].map((name) => {
      const el = card.querySelector(`[data-task-region="${name}"]`);
      return el ? { name, top: el.getBoundingClientRect().top } : null;
    });
  });

  for (const region of tops) {
    expect(region, '任务卡片缺少必备信息区域').not.toBeNull();
  }
  for (let i = 1; i < tops.length; i += 1) {
    expect(tops[i]!.top).toBeGreaterThan(tops[i - 1]!.top);
  }

  // 分隔线 + 下发来源 / 逾期状态行
  const footer = firstCard.locator('[data-task-region="footer"]');
  await expect(footer).toContainText('下发：');
  const borderTopWidth = await footer.evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(borderTopWidth).toBe('1px');

  // 样式层级：主视觉 subject 字号大于辅助区 context 且加粗；badges 区可换行
  const hierarchy = await firstCard.evaluate((card) => {
    const subject = card.querySelector('[data-task-region="subject"]')!;
    const context = card.querySelector('[data-task-region="context"]')!;
    const badges = card.querySelector('[data-task-region="badges"]')!;
    const subjectStyle = getComputedStyle(subject);
    const contextStyle = getComputedStyle(context);
    return {
      subjectSize: Number.parseFloat(subjectStyle.fontSize),
      subjectWeight: Number.parseInt(subjectStyle.fontWeight, 10),
      contextSize: Number.parseFloat(contextStyle.fontSize),
      badgesWrap: getComputedStyle(badges).flexWrap,
    };
  });
  expect(hierarchy.subjectSize).toBeGreaterThan(hierarchy.contextSize);
  expect(hierarchy.subjectWeight).toBeGreaterThanOrEqual(600);
  expect(hierarchy.badgesWrap).toBe('wrap');

  // 390px 下卡片自身无横向溢出
  const noOverflow = await firstCard.evaluate((card) => card.scrollWidth <= card.clientWidth + 1);
  expect(noOverflow).toBe(true);

  // 初始（未滚动）截图必须看见完整第一张卡
  await expect(firstCard).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/K3-mobile-tasks-initial-390x844.png` });
});

// 键盘 Tab 直至目标任务卡获得焦点（最多 maxSteps 次）
async function focusCardWithTab(page: Page, card: Locator, maxSteps = 20): Promise<boolean> {
  for (let i = 0; i < maxSteps; i += 1) {
    await page.keyboard.press('Tab');
    if (await card.evaluate((el) => document.activeElement === el)) {
      return true;
    }
  }
  return false;
}

test('任务卡可聚焦，Enter/Space 键盘触发且 focus 可见', async ({ page }) => {
  await page.goto('/mobile/tasks?mode=today');
  const firstCard = page.getByTestId('task-card-pending').first();
  await expect(firstCard).toBeVisible({ timeout: 20_000 });

  // 键盘 Tab 聚焦到第一张待处理卡，并出现可见 focus 环（:focus-visible）
  expect(await focusCardWithTab(page, firstCard), 'Tab 未能聚焦到待处理任务卡').toBe(true);
  const focusState = await firstCard.evaluate((el) => ({
    matched: el.matches(':focus-visible'),
    boxShadow: getComputedStyle(el).boxShadow,
  }));
  expect(focusState.matched).toBe(true);
  expect(focusState.boxShadow).not.toBe('none');

  // Enter 触发与点击一致的路由跳转
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/mobile\/tasks\/[^?/]+/, { timeout: 10_000 });

  // 返回列表，Space 触发同一路径
  await page.goBack();
  const cardAgain = page.getByTestId('task-card-pending').first();
  await expect(cardAgain).toBeVisible({ timeout: 20_000 });
  expect(await focusCardWithTab(page, cardAgain), '返回后 Tab 未能聚焦到待处理任务卡').toBe(true);
  await page.keyboard.press(' ');
  await expect(page).toHaveURL(/\/mobile\/tasks\/[^?/]+/, { timeout: 10_000 });

  // 已完成卡：footer 补齐下发来源，键盘 parity 与待处理卡一致（今日视图无已完成数据，用全部清单视图）
  await page.goto('/mobile/tasks?mode=all');
  const completedTab = page.getByRole('tab', { name: /已完成/ });
  await expect(completedTab).toBeVisible({ timeout: 20_000 });
  await completedTab.click();
  const completedCard = page.getByTestId('task-card-completed').first();
  await expect(completedCard).toBeVisible({ timeout: 20_000 });
  const completedFooter = completedCard.locator('[data-task-region="footer"]');
  await expect(completedFooter).toContainText('下发：');
  await expect(completedFooter).toContainText('完成时间：');
  expect(await focusCardWithTab(page, completedCard), 'Tab 未能聚焦到已完成任务卡').toBe(true);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/mobile\/tasks\/[^?/]+/, { timeout: 10_000 });
});
