import { expect, test, type Page } from '@playwright/test';

const COMPLETE_RESPONSE = [
  '【完整答复开始】',
  '适用对象：以当地医保部门认定的救助对象范围为准。',
  ...Array.from(
    { length: 40 },
    (_, index) => `${index + 1}. 核验事项：确认参保地、人员类别、起付线与年度封顶线。`,
  ),
  '下一步建议：向参保地医保经办机构核验当年度正式口径。',
  '【完整答复结束】',
].join('\n');

async function stubCompleteAiResponse(page: Page) {
  await page.route('**/api/ai/chat', async (route) => {
    const payload = route.request().postDataJSON() as { kind?: string } | null;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'live',
        agent_type: 'assistant',
        kind: payload?.kind ?? 'policy',
        content: COMPLETE_RESPONSE,
        model: 'gemini-3.6-flash',
        used_fallback_model: false,
      }),
    });
  });
}

async function expectCompleteResponse(page: Page) {
  const response = page.getByText('【完整答复开始】', { exact: false }).first();
  await expect(response).toBeAttached();
  await expect.poll(async () => response.textContent()).toBe(COMPLETE_RESPONSE);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
  await stubCompleteAiResponse(page);
});

test('desktop policy chat retains a long Gemini response through its final marker', async ({ page }) => {
  await page.goto('/ai/policy');
  const composer = page.getByPlaceholder(
    '请输入您想查询的政策问题，例如：最新的高龄津贴发放标准是什么？',
  );
  await composer.fill('完整答复桌面端回归');
  await composer.press('Enter');

  await expectCompleteResponse(page);
});

test('mobile policy chat retains a long Gemini response through its final marker', async ({ page }) => {
  await page.goto('/mobile/policy-interpretation');
  const composer = page.getByPlaceholder('请输入您想查询的政策问题...');
  await composer.fill('完整答复移动端回归');
  await composer.press('Enter');

  await expectCompleteResponse(page);
});
