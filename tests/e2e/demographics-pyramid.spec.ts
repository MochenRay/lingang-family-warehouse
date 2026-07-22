import { expect, test, type Page } from '@playwright/test';

const backendPort = Number(process.env.BACKEND_PORT ?? '8000');

/**
 * P5-T7c 人口金字塔 div → Recharts 验收。
 *
 * mock 用例：page.route() 拦截 `/api/people` 注入确定性 12 人 fixture
 * （各桶男女分布已知，含 1 名 60 岁——验证其归入 36-60岁 桶且不计入老龄化比例）。
 * mock 服务端硬限单页 5 条（不论请求 limit）：12 人须经 offsets [0,5,10] 三页取全，
 * 并断言该 offset 序列——组件若退回显式 { limit: 500 } 单页调用只能取到 5 人，必红
 * （Codex 复审指出的 false-green 修复：锁「全量分页」核心修复）。
 *
 * 真实种子用例：非 mock，验证全量 1917 人下金字塔渲染不崩。
 *
 * fixture 推算（12 人）：
 *   0-18岁   男2 女1 ｜ 19-35岁 男1 女2 ｜ 36-60岁 男2(含60岁) 女1 ｜ 60岁以上 男1 女2
 *   老龄化（>60，即 61 岁及以上）= 3 → 3/12 = 25.0%
 */

interface PersonFixture {
  id: string;
  gridId: string;
  name: string;
  idCard: string;
  gender: '男' | '女';
  age: number;
  address: string;
  type: '户籍';
  tags: never[];
  risk: 'Low';
  updatedAt: string;
  nation: string;
  education: string;
}

const AGES: Array<{ gender: '男' | '女'; age: number }> = [
  { gender: '男', age: 5 },
  { gender: '男', age: 12 },
  { gender: '女', age: 9 },
  { gender: '男', age: 30 },
  { gender: '女', age: 25 },
  { gender: '女', age: 33 },
  { gender: '男', age: 45 },
  { gender: '男', age: 60 }, // 边界：60 岁须归入 36-60岁，且不计入老龄化
  { gender: '女', age: 50 },
  { gender: '男', age: 70 },
  { gender: '女', age: 66 },
  { gender: '女', age: 80 },
];

/** 各桶期望（与组件 AGE_BUCKETS 顺序一致：顶→底）。 */
const EXPECTED_BUCKETS = [
  { name: '60岁以上', male: 1, female: 2 },
  { name: '36-60岁', male: 2, female: 1 },
  { name: '19-35岁', male: 1, female: 2 },
  { name: '0-18岁', male: 2, female: 1 },
];

const ELDERLY_RATE = '25.0%';
/** fixture 最大单桶单性别人数 = 2 → axisMax = 10，对称刻度取绝对值后。 */
const EXPECTED_X_TICKS = ['10', '5', '0', '5', '10'];
const MALE_FILL = '#2761CB';
const FEMALE_FILL = '#E845B1';

function buildPersonFixtures(): PersonFixture[] {
  return AGES.map((entry, index) => {
    const seq = index + 1;
    return {
      id: `e2e_person_${String(seq).padStart(2, '0')}`,
      gridId: 'g1',
      name: `金字塔注入人员${seq}`,
      idCard: `310000********${String(seq).padStart(4, '0')}`,
      gender: entry.gender,
      age: entry.age,
      address: '自动化验证地址',
      type: '户籍',
      tags: [],
      risk: 'Low',
      updatedAt: '2026-07-01 10:00:00',
      nation: '汉族',
      education: '本科',
    };
  });
}

/** mock 服务端硬限单页条数（不论请求 limit） */
const MOCK_PAGE_SIZE = 5;

/**
 * 人口列表 GET 注入 fixture；服务端硬限单页 5 条，按 offset 切片，
 * 返回本次请求命中的 offset 序列（供断言 [0,5,10]）。其他请求放行。
 */
async function mockPeopleList(page: Page): Promise<number[]> {
  const fixtures = buildPersonFixtures();
  const requestedOffsets: number[] = [];
  await page.route('**/api/people**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== 'GET' || url.pathname !== '/api/people') {
      return route.continue();
    }
    const offset = Number(url.searchParams.get('offset') ?? '0');
    requestedOffsets.push(offset);
    return route.fulfill({ json: { items: fixtures.slice(offset, offset + MOCK_PAGE_SIZE), total: fixtures.length } });
  });
  return requestedOffsets;
}

function dismissJourneyOverlay(page: Page) {
  return page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });
}

/** StatCard 结构：label div 的下一个兄弟 div 为数值。 */
function statCardValue(page: Page, label: string) {
  return page
    .locator('div.text-sm')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .first()
    .locator('xpath=following-sibling::div[1]');
}

function maleBars(page: Page) {
  return page.getByTestId('population-pyramid').locator(`path.recharts-rectangle[fill="${MALE_FILL}"]`);
}

function femaleBars(page: Page) {
  return page.getByTestId('population-pyramid').locator(`path.recharts-rectangle[fill="${FEMALE_FILL}"]`);
}

test.describe('P5-T7c 人口金字塔 Recharts（mock fixture）', () => {
  let requestedOffsets: number[];

  test.beforeEach(async ({ page }) => {
    await dismissJourneyOverlay(page);
    requestedOffsets = await mockPeopleList(page);
    await page.goto('/analysis/demographics');
    await expect(page.getByTestId('population-pyramid')).toBeVisible();
    await expect(maleBars(page)).toHaveCount(4);
    await expect(femaleBars(page)).toHaveCount(4);
  });

  test('全量分页被锁定：请求 offsets 为 [0,5,10]（退回显式 limit 必红）', async () => {
    // mock 硬限单页 5 条：无参 getPeople() 经 fetchAllListPages 须三页取全 12 人；
    // 若组件退回 { limit: 500 } 单页调用，只能取到首 5 人，此处与桶断言双红。
    // dev 下 React StrictMode 双挂载会多发一轮请求（实测前缀 [0] 或 [0,5,10]），
    // 故锁定**末尾**三次 offset——完整全量拉取必然以 [0,5,10] 收尾
    expect(requestedOffsets.slice(-3)).toEqual([0, 5, 10]);
  });

  test('各桶男/女人数与 fixture 推算一致；60 岁归入 36-60岁 且不计入老龄化比例', async ({ page }) => {
    // 隐藏数据表（可访问语义副本）逐行断言桶人数
    const table = page.getByRole('table', { name: '年龄性别人口金字塔数据（单位：人）' });
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(4);
    for (const [index, bucket] of EXPECTED_BUCKETS.entries()) {
      const cells = rows.nth(index).locator('th, td');
      await expect(cells.nth(0)).toHaveText(bucket.name);
      await expect(cells.nth(1)).toHaveText(String(bucket.male));
      await expect(cells.nth(2)).toHaveText(String(bucket.female));
    }
    // 36-60岁 男=2 含 60 岁者（若 60 岁错归 60岁以上，此处男=1 且 60岁以上男=2）
    // 老龄化比例 = 3/12 = 25.0%（若 60 岁被计入则为 4/12 = 33.3%）
    await expect(statCardValue(page, '老龄化比例')).toHaveText(ELDERLY_RATE);
  });

  test('StatCard 显示「61 岁及以上」语义', async ({ page }) => {
    await expect(statCardValue(page, '老龄化比例')).toHaveText(ELDERLY_RATE);
    await expect(page.getByText('61 岁及以上人口占比')).toBeVisible();
  });

  test('镜像正确：同一年龄段男/女条同一 y；X 轴刻度显示正人数', async ({ page }) => {
    const males = maleBars(page);
    const females = femaleBars(page);
    for (let index = 0; index < 4; index += 1) {
      // 比较 SVG y 属性（同一类别行必然完全相等）；不用 boundingBox——
      // 渲染层 bounding box 有亚像素噪声（实测差 0.09px 的假性失败）
      const maleY = await males.nth(index).getAttribute('y');
      const femaleY = await females.nth(index).getAttribute('y');
      expect(maleY, `第 ${index} 段男条无 y 属性`).not.toBeNull();
      expect(maleY, `第 ${index} 段男/女条 y 不一致`).toBe(femaleY);
    }
    const tickTexts = (await page
      .getByTestId('population-pyramid')
      .locator('.recharts-xAxis .recharts-cartesian-axis-tick text')
      .allTextContents())
      .map((text) => text.trim());
    expect(tickTexts).toEqual(EXPECTED_X_TICKS);
  });

  test('tooltip 显示正人数（无负号）', async ({ page }) => {
    // hover 首行（60岁以上：男 1 / 女 2）女条
    await femaleBars(page).first().hover();
    const tooltip = page.getByTestId('population-pyramid').locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('60岁以上');
    const tooltipText = (await tooltip.textContent()) ?? '';
    expect(tooltipText).toMatch(/男\s*1/);
    expect(tooltipText).toMatch(/女\s*2/);
    expect(tooltipText).not.toMatch(/[男女]\s*-\d/);
  });
});

test.describe('P5-T7c 人口金字塔 Recharts（真实种子库）', () => {
  test('全量数据下金字塔渲染不崩', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    await dismissJourneyOverlay(page);
    await page.goto('/analysis/demographics');
    await expect(page.getByText('人口特征分析').first()).toBeVisible();
    const pyramid = page.getByTestId('population-pyramid');
    await expect(pyramid).toBeVisible();
    // 4 桶 × 2 性别全部渲染（recharts 对零值条不渲染 path，全量种子各桶男女均非零）
    await expect(maleBars(page)).toHaveCount(4);
    await expect(femaleBars(page)).toHaveCount(4);
    // 隐藏数据表覆盖全部 4 个年龄段
    const table = page.getByRole('table', { name: '年龄性别人口金字塔数据（单位：人）' });
    await expect(table.locator('tbody tr')).toHaveCount(4);
    // sr-only 表八数求和 = 后端 /api/people total（锁全量拉取，防 500 截断回退）
    const cells = await table.locator('tbody td').allTextContents();
    const sum = cells.map((text) => Number(text.trim())).reduce((acc, value) => acc + value, 0);
    const peopleResponse = await page.request.get(`http://127.0.0.1:${backendPort}/api/people?limit=1`);
    expect(peopleResponse.ok()).toBe(true);
    const { total } = (await peopleResponse.json()) as { total: number };
    expect(sum).toBe(total);
    await expect(page.getByText('61 岁及以上人口占比')).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });
});
