import { expect, test, type Locator, type Page } from '@playwright/test';

type WorkbenchScenario = {
  path: string;
  pageTitle: string;
  categoryTitle: string;
  categoryItem: string;
  apiKind: 'policy' | 'writing' | 'query';
  suggestedQuestions: string[];
  placeholder: string;
};

const scenarios: WorkbenchScenario[] = [
  {
    path: '/ai/policy',
    pageTitle: '政策解读',
    categoryTitle: '热门政策领域',
    categoryItem: '民政救助',
    apiKind: 'policy',
    suggestedQuestions: [
      '蓬莱区最新的低保申请条件是什么？',
      '残疾人两项补贴的具体标准是多少？',
      '退役军人优待证如何办理？',
      '大病救助的报销比例是多少？',
    ],
    placeholder: '请输入您想查询的政策问题，例如：最新的高龄津贴发放标准是什么？',
  },
  {
    path: '/ai/document-writing',
    pageTitle: '公文写作',
    categoryTitle: '常用文体模板',
    categoryItem: '工作总结',
    apiKind: 'writing',
    suggestedQuestions: [
      '生成一份季度社区网格化管理工作总结',
      '起草一份关于开展社区义诊活动的通知',
      '帮我润色这篇民情日记，使其更正式',
      '写一份关于解决邻里纠纷的情况汇报',
    ],
    placeholder: '请输入您的写作需求，例如：帮我写一份关于社区环境整治的总结报告。',
  },
  {
    path: '/ai/smart-query',
    pageTitle: '智能问数',
    categoryTitle: '核心数据领域',
    categoryItem: '人口数据',
    apiKind: 'query',
    suggestedQuestions: [
      '统计辖区内60岁以上老人的总数及占比',
      '分析最近三个月矛盾纠纷的主要类型',
      '列出本月入户走访完成率最低的网格',
      '对比去年同期，常住人口有什么变化？',
    ],
    placeholder: '请输入您想分析的数据问题，例如：统计本月新增流动人口数量。',
  },
];

async function visibleBox(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function stubAiChat(page: Page, requestedKinds: string[]) {
  await page.route('**/api/ai/chat', async (route) => {
    const payload = route.request().postDataJSON() as { kind?: string } | null;
    const kind = payload?.kind ?? '';
    requestedKinds.push(kind);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'live',
        agent_type: 'assistant',
        kind,
        content: '布局回归验证回复',
        model: 'e2e-stub',
        used_fallback_model: false,
      }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
});

for (const scenario of scenarios) {
  test(`${scenario.pageTitle} keeps categories above chat and suggestions above composer`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const requestedKinds: string[] = [];
    await stubAiChat(page, requestedKinds);
    await page.goto(scenario.path);

    await expect(page.getByRole('heading', { name: scenario.pageTitle, exact: true })).toBeVisible();
    await expect(page.getByText(scenario.categoryItem, { exact: true })).toBeVisible();

    const categoryLabel = page.getByText(scenario.categoryTitle, { exact: true });
    const categoryCard = categoryLabel.locator('xpath=ancestor::*[@data-slot="card"][1]');
    const introMessage = page.getByText(/^您好，我是/).first();
    const composer = page.getByPlaceholder(scenario.placeholder, { exact: true });
    const recommendationLabel = page.getByText('推荐问题', { exact: true });

    const [categoryBox, introBox, composerBox, recommendationLabelBox] = await Promise.all([
      visibleBox(categoryCard),
      visibleBox(introMessage),
      visibleBox(composer),
      visibleBox(recommendationLabel),
    ]);

    const categoryRight = categoryBox.x + categoryBox.width;
    const composerRight = composerBox.x + composerBox.width;

    // 分类区是与对话窗同列的顶部区域，而非窄左侧栏。
    expect(categoryBox.width).toBeGreaterThanOrEqual(composerBox.width * 0.8);
    expect(Math.abs(categoryBox.x - composerBox.x)).toBeLessThanOrEqual(32);
    expect(Math.abs(categoryRight - composerRight)).toBeLessThanOrEqual(32);
    expect(categoryBox.y + categoryBox.height).toBeLessThanOrEqual(introBox.y + 4);

    const questionBoxes = await Promise.all(
      scenario.suggestedQuestions.map((question) =>
        visibleBox(page.getByText(question, { exact: true })),
      ),
    );
    const lowestQuestionEdge = Math.max(...questionBoxes.map((box) => box.y + box.height));

    // 推荐问题与输入框同列，且最后一行紧贴输入框上方。
    expect(recommendationLabelBox.x).toBeGreaterThanOrEqual(composerBox.x - 32);
    expect(recommendationLabelBox.x).toBeLessThan(composerRight);
    expect(lowestQuestionEdge).toBeLessThanOrEqual(composerBox.y + 2);
    expect(composerBox.y - lowestQuestionEdge).toBeLessThanOrEqual(64);

    const firstQuestion = page.getByText(scenario.suggestedQuestions[0], { exact: true });
    await expect(firstQuestion).toHaveCount(1);
    await firstQuestion.click();
    await expect(firstQuestion).toHaveCount(2);
    await expect.poll(
      () => [...requestedKinds],
      {
        message: `clicking a suggestion should call /api/ai/chat with kind=${scenario.apiKind}`,
        timeout: 5_000,
      },
    ).toEqual([scenario.apiKind]);

    await composer.fill('手动输入交互验证');
    await composer.press('Enter');
    await expect(page.getByText('手动输入交互验证', { exact: true })).toBeVisible();
    await expect(composer).toBeEnabled();
  });

  test(`${scenario.pageTitle} preserves the chat viewport at 768x600`, async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 600 });
    await page.goto(scenario.path);

    const main = page.locator('main');
    const categoryLabel = page.getByText(scenario.categoryTitle, { exact: true });
    const categoryCard = categoryLabel.locator('xpath=ancestor::*[@data-slot="card"][1]');
    const introMessage = page.getByText(/^您好，我是/).first();
    const messageViewport = introMessage.locator(
      'xpath=ancestor::*[@data-radix-scroll-area-viewport][1]',
    );
    const recommendationLabel = page.getByText('推荐问题', { exact: true });
    const composer = page.getByPlaceholder(scenario.placeholder, { exact: true });

    const [categoryBox, introBox, viewportBox, recommendationBox, composerBox] = await Promise.all([
      visibleBox(categoryCard),
      visibleBox(introMessage),
      visibleBox(messageViewport),
      visibleBox(recommendationLabel),
      visibleBox(composer),
    ]);

    expect(viewportBox.height).toBeGreaterThan(0);
    expect(categoryBox.y).toBeLessThan(introBox.y);
    expect(recommendationBox.y).toBeLessThan(composerBox.y);

    const mainScrollMetrics = await main.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(mainScrollMetrics.scrollHeight).toBe(mainScrollMetrics.clientHeight);
  });
}
