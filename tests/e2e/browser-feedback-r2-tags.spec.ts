import { expect, test, type Page } from '@playwright/test';

const SNAPSHOT = {
  generatedAt: '2026-07-30T08:00:00+08:00',
  totalPeople: 1,
  tags: [
    {
      id: 'tag_released_offender',
      name: '刑满释放',
      type: 'ordinary',
      description: '刑满释放后纳入社区衔接与服务台账的人员。',
      category: '重点关注',
      riskLevel: 'High',
      status: 'enabled',
      conditions: [],
      isSystem: true,
      createdBy: '系统',
      createdAt: '2026-07-30T08:00:00+08:00',
      updatedAt: '2026-07-30T08:00:00+08:00',
      coverageCount: 0,
    },
    {
      id: 'tag_senior',
      name: '高龄老人',
      type: 'smart',
      description: '年龄达到 80 岁后自动纳入高龄关爱范围。',
      category: '重点关爱',
      riskLevel: 'Medium',
      status: 'enabled',
      conditions: [{ field: 'age', operator: 'gte', value: 80 }],
      isSystem: true,
      createdBy: '系统',
      createdAt: '2026-07-30T08:00:00+08:00',
      updatedAt: '2026-07-30T08:00:00+08:00',
      coverageCount: 1,
    },
  ],
  people: [
    {
      person: {
        id: 'person-1',
        gridId: 'grid-1',
        name: '巴晓梅',
        idCard: '370602194607310011',
        gender: '女',
        age: 80,
        address: '温泉9号楼1单元101',
        type: '户籍',
        tags: [],
        risk: 'High',
        updatedAt: '2026-07-30',
      },
      lastVisitAt: '2026-04-06',
      totalConflictCount: 0,
      activeConflictCount: 0,
      matchedTags: [
        {
          tagId: 'tag_senior',
          tagName: '高龄老人',
          reasons: ['年龄 80 岁'],
          source: 'smart',
        },
      ],
    },
  ],
};

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

async function mockTagsApi(page: Page, onCreate?: (payload: unknown) => void) {
  await page.route('**/api/tags/snapshot', (route) => route.fulfill({ json: SNAPSHOT }));
  await page.route('**/api/tags', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const payload = route.request().postDataJSON();
    onCreate?.(payload);
    return route.fulfill({
      status: 201,
      json: {
        ...(payload as Record<string, unknown>),
        id: 'tag-created',
        status: 'enabled',
        isSystem: false,
        createdBy: '标签管理员',
        createdAt: '2026-07-30T08:00:00+08:00',
        updatedAt: '2026-07-30T08:00:00+08:00',
        coverageCount: 0,
      },
    });
  });
}

test('标签管理使用中文风险文案，并可创建普通标签与配置智能标签条件', async ({ page }) => {
  await page.setViewportSize({ width: 1608, height: 1324 });
  await dismissJourneyOverlay(page);
  const createdPayloads: unknown[] = [];
  await mockTagsApi(page, (payload) => createdPayloads.push(payload));
  await page.goto('/tags');

  await expect(page.locator('[data-page-title]')).toHaveText('标签管理');
  await expect(page.getByText('高风险', { exact: true })).toBeVisible();
  await expect(page.getByText('中风险', { exact: true })).toBeVisible();
  await expect(page.getByText('High', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Medium', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: '新增标签' }).click();
  await page.locator('#tag-name').fill('社区志愿者');
  await page.locator('#tag-category').fill('社区参与');
  await page.locator('#tag-description').fill('由工作人员核实后人工维护的社区志愿服务标签。');
  await page.getByRole('button', { name: '创建标签' }).click();
  await expect.poll(() => createdPayloads.length).toBe(1);
  expect(createdPayloads[0]).toMatchObject({
    name: '社区志愿者',
    type: 'ordinary',
    conditions: [],
  });

  await page.getByRole('button', { name: '新增标签' }).click();
  await page.locator('#tag-name').fill('高龄独居关注');
  await page.locator('#tag-category').fill('重点关爱');
  await page.locator('#tag-description').fill('达到年龄门槛且同住人数不超过一人的自动关爱标签。');
  const typeField = page.getByText('标签类型', { exact: true }).locator('..').getByRole('combobox');
  await typeField.click();
  await page.getByRole('option', { name: '智能标签' }).click();
  await expect(page.getByText('智能判断条件')).toBeVisible();
  await page.getByRole('button', { name: '增加条件' }).click();
  const secondField = page.getByRole('combobox', { name: '条件 2 字段' });
  await secondField.click();
  await page.getByRole('option', { name: '同住人数' }).click();
  await page.getByRole('combobox', { name: '条件 2 运算符' }).click();
  await page.getByRole('option', { name: '小于等于' }).click();
  await page.getByRole('spinbutton', { name: '条件 2 数值' }).fill('1');
  await page.getByRole('button', { name: '创建标签' }).click();
  await expect.poll(() => createdPayloads.length).toBe(2);
  expect(createdPayloads[1]).toMatchObject({
    name: '高龄独居关注',
    type: 'smart',
    conditions: [
      { field: 'age', operator: 'gte', value: 80 },
      { field: 'household_size', operator: 'lte', value: 1 },
    ],
  });

  await page.screenshot({ path: '/tmp/lingang-browser-r2/screenshots/C3-tags-1608x1324.png', fullPage: true });
});

test('标签分析详情使用中文风险文案', async ({ page }) => {
  await page.setViewportSize({ width: 1608, height: 1324 });
  await dismissJourneyOverlay(page);
  await mockTagsApi(page);
  await page.goto('/analysis/tags');

  await expect(page.locator('[data-page-title]')).toHaveText('标签分析画像');
  await page.getByRole('button', { name: '高龄老人' }).click();
  await page.getByRole('button', { name: '查看详情' }).click();
  const detailDialog = page.getByRole('dialog');
  await expect(detailDialog.getByText('巴晓梅')).toBeVisible();
  await expect(detailDialog.getByText('高风险', { exact: true })).toBeVisible();
  await expect(detailDialog.getByText('High', { exact: true })).toHaveCount(0);
});

test('标签写口令使用掩码输入且只保存到当前 session', async ({ page }) => {
  await dismissJourneyOverlay(page);
  await page.route('**/api/tags/snapshot', (route) => route.fulfill({ json: SNAPSHOT }));
  let attempts = 0;
  await page.route('**/api/tags', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    attempts += 1;
    const token = route.request().headers()['x-tag-write-token'];
    if (token !== 'tag-secret') {
      return route.fulfill({
        status: 403,
        json: { detail: 'A valid tag administrator token is required.' },
      });
    }
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({
      status: 201,
      json: {
        ...payload,
        id: 'tag-authorized',
        status: 'enabled',
        isSystem: false,
        createdBy: '标签管理员',
        createdAt: '2026-07-30T08:00:00+08:00',
        updatedAt: '2026-07-30T08:00:00+08:00',
        coverageCount: 0,
      },
    });
  });
  await page.goto('/tags');

  await page.getByRole('button', { name: '新增标签' }).click();
  await page.locator('#tag-name').fill('授权测试标签');
  await page.locator('#tag-category').fill('测试分类');
  await page.locator('#tag-description').fill('验证专用标签口令的会话存储边界。');
  await page.getByRole('button', { name: '创建标签' }).click();

  const authorizationDialog = page.getByRole('dialog', { name: '标签管理员授权' });
  await expect(authorizationDialog).toBeVisible();
  const tokenInput = authorizationDialog.locator('#tag-write-token');
  await expect(tokenInput).toHaveAttribute('type', 'password');
  await tokenInput.fill('tag-secret');
  await authorizationDialog.getByRole('button', { name: '验证并创建' }).click();
  await expect(authorizationDialog).toBeHidden();
  expect(attempts).toBe(2);
  const storage = await page.evaluate(() => ({
    session: window.sessionStorage.getItem('homedata.tag_write_token'),
    local: window.localStorage.getItem('homedata.tag_write_token'),
  }));
  expect(storage).toEqual({ session: 'tag-secret', local: null });
  await expect(page.getByText('tag-secret', { exact: true })).toHaveCount(0);
});

test('人口编辑区分普通与智能标签，并在授权成功后写入普通标签关联', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await dismissJourneyOverlay(page);

  const mutationAttempts: Array<{ method: string; token?: string }> = [];
  await page.route('**/api/tags/*/assignments/*', async (route) => {
    const method = route.request().method();
    const token = route.request().headers()['x-tag-write-token'];
    mutationAttempts.push({ method, token });
    if (token !== 'tag-secret') {
      await route.fulfill({
        status: 403,
        json: { detail: 'A valid tag administrator token is required.' },
      });
      return;
    }
    if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    await route.fulfill({
      status: 200,
      json: {
        tagId: route.request().url().split('/assignments/')[0].split('/').at(-1),
        personId: route.request().url().split('/assignments/').at(-1),
        createdBy: '标签管理员',
        createdAt: '2026-07-30T08:00:00+08:00',
      },
    });
  });

  await page.goto('/population');
  await expect(page.getByRole('columnheader', { name: '姓名' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: '编辑人员' }).first().click();
  const editDialog = page.getByRole('dialog', { name: '编辑人口' });
  await editDialog.locator('#form-section-trigger-tags').click();

  const tagEditor = editDialog.locator('[data-managed-tag-editor]');
  await expect(tagEditor.getByText('普通标签', { exact: true })).toBeVisible();
  await expect(tagEditor.getByText('智能标签', { exact: true })).toBeVisible();
  const ordinaryTag = tagEditor.locator('[data-managed-ordinary-tag]').first();
  await expect(ordinaryTag).toBeEnabled();
  const before = await ordinaryTag.getAttribute('aria-pressed');
  await ordinaryTag.click();
  await expect(ordinaryTag).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');
  await expect(tagEditor.locator('[data-managed-smart-tag]').first()).toContainText(/已自动命中|未命中/);
  await expect(tagEditor.locator('[data-managed-smart-tag] button')).toHaveCount(0);
  await page.screenshot({
    path: '/tmp/lingang-browser-r2/screenshots/C3-population-tags-1024x768.png',
    animations: 'disabled',
  });

  await editDialog.getByRole('button', { name: '保存' }).click();
  const authDialog = page.getByRole('dialog', { name: '标签管理员授权' });
  await expect(authDialog).toBeVisible();
  const tokenInput = authDialog.locator('#population-tag-write-token');
  await expect(tokenInput).toHaveAttribute('type', 'password');

  await tokenInput.fill('wrong-token');
  await authDialog.getByRole('button', { name: '验证并保存' }).click();
  await expect.poll(() => mutationAttempts.length).toBe(1);
  await expect(authDialog).toBeVisible();
  expect(await page.evaluate(() => ({
    session: window.sessionStorage.getItem('homedata.tag_write_token'),
    local: window.localStorage.getItem('homedata.tag_write_token'),
  }))).toEqual({ session: null, local: null });

  await tokenInput.fill('tag-secret');
  await authDialog.getByRole('button', { name: '验证并保存' }).click();
  await expect.poll(() => mutationAttempts.length).toBe(2);
  await expect(authDialog).toBeHidden();
  await expect(editDialog).toBeHidden();
  expect(mutationAttempts).toEqual([
    { method: before === 'true' ? 'DELETE' : 'PUT', token: 'wrong-token' },
    { method: before === 'true' ? 'DELETE' : 'PUT', token: 'tag-secret' },
  ]);
  expect(await page.evaluate(() => ({
    session: window.sessionStorage.getItem('homedata.tag_write_token'),
    local: window.localStorage.getItem('homedata.tag_write_token'),
  }))).toEqual({ session: 'tag-secret', local: null });
  await expect(page.getByText('tag-secret', { exact: true })).toHaveCount(0);
});
