import { expect, test, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

/**
 * T1a a11y 审计扫描器：对 30 个桌面路由 + 4 条移动 smoke 路径执行自动检查。
 * 输出 test-results/a11y-audit/findings.json，供 triage 分级。
 * 检查项（对应冻结的严重度规则）：
 *  - icon-only 按钮无可访问名称（阻断）
 *  - 键盘 Tab 路径 focus 可见性（阻断）
 *  - 移动触控目标 <44px（阻断）
 *  - 正文 computed 对比度 <4.5（阻断）/ 4.5-7（建议）
 *  - Dialog focus 进入与 Esc 关闭（阻断，冒烟路径）
 */

type Severity = 'blocker' | 'advisory';
type Finding = {
  page: string;
  viewport: string;
  rule: string;
  severity: Severity;
  selector: string;
  evidence: string;
};

const findings: Finding[] = [];

const DESKTOP_ROUTES: Array<{ id: string; path: string; readyText: string }> = [
  { id: 'statistics-overview', path: '/', readyText: '综合统计驾驶舱' },
  { id: 'demographics-analysis', path: '/analysis/demographics', readyText: '人口特征分析' },
  { id: 'housing-statistics', path: '/analysis/housing', readyText: '房屋网格画像' },
  { id: 'migration-trends', path: '/analysis/migration-trends', readyText: '人口流动趋势' },
  { id: 'population-tags', path: '/analysis/tags', readyText: '标签分析画像' },
  { id: 'data-comparison', path: '/analysis/comparison', readyText: '数据对比分析' },
  { id: 'data-reports', path: '/analysis/reports', readyText: '报表中心' },
  { id: 'heatmap', path: '/analysis/warning-map', readyText: '预警地图' },
  { id: 'population', path: '/population', readyText: '人口管理' },
  { id: 'housing', path: '/housing', readyText: '房屋管理' },
  { id: 'relationship', path: '/relationship', readyText: '人房关系管理' },
  { id: 'batch-import', path: '/batch-import', readyText: '批量导入' },
  { id: 'tag-overview', path: '/tags', readyText: '标签管理' },
  { id: 'knowledge-accumulation', path: '/knowledge', readyText: '知识沉淀' },
  { id: 'policy-interpretation', path: '/ai/policy', readyText: '政策解读' },
  { id: 'document-writing', path: '/ai/document-writing', readyText: '公文写作' },
  { id: 'smart-query', path: '/ai/smart-query', readyText: '智能问数' },
  { id: 'behavior-supervision', path: '/grid/behavior', readyText: '行为督导中心' },
  { id: 'activity-management', path: '/grid/activities', readyText: '活动综合管理' },
  { id: 'conflict-management', path: '/grid/conflicts', readyText: '矛盾调解' },
  { id: 'notice-management', path: '/grid/notices', readyText: '公告管理' },
  { id: 'rule-config', path: '/grid/rules', readyText: '待办规则配置' },
  { id: 'anomaly-analysis', path: '/attribution/anomaly', readyText: '异常结果分析' },
  { id: 'time-series', path: '/attribution/time-series', readyText: '时序分析' },
  { id: 'factor-identification', path: '/attribution/factors', readyText: '影响因子识别' },
  { id: 'contribution-ranking', path: '/attribution/contribution', readyText: '贡献程度排名' },
  { id: 'user-management', path: '/settings/users', readyText: '用户管理' },
  { id: 'role-management', path: '/settings/roles', readyText: '角色管理' },
  { id: 'permission-management', path: '/settings/permissions', readyText: '权限管理' },
  { id: 'log-management', path: '/settings/logs', readyText: '日志管理' },
];

const MOBILE_ROUTES: Array<{ id: string; path: string; readyText: string }> = [
  { id: 'mobile-home', path: '/mobile', readyText: '快捷功能' },
  { id: 'mobile-people', path: '/mobile/people', readyText: '条人员' },
  { id: 'mobile-person-detail', path: '/mobile/person/:first', readyText: '人员详情' },
  { id: 'mobile-conflict-form', path: '/mobile/conflict/new', readyText: '上报矛盾纠纷' },
];

async function checkIconOnlyButtons(page: Page, pageId: string, viewport: string) {
  const results = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
    const bad: Array<{ selector: string; evidence: string }> = [];
    for (const btn of buttons) {
      const el = btn as HTMLElement;
      if (el.offsetParent === null) continue; // 不可见
      const text = (el.textContent ?? '').trim();
      const hasName = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
      // 关联 label（htmlFor / 被 label 包裹）同样提供可访问名称
      const id = el.getAttribute('id');
      const hasLinkedLabel =
        (id !== null && document.querySelector(`label[for="${id}"]`) !== null) ||
        el.closest('label') !== null;
      if (!text && !hasName && !hasLinkedLabel) {
        const cls = (el.getAttribute('class') ?? '').slice(0, 80);
        bad.push({
          selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + `.${cls.split(' ')[0]}`,
          evidence: `无可访问名称的 icon-only 按钮，class="${cls}"`,
        });
      }
    }
    return bad;
  });
  for (const item of results) {
    findings.push({ page: pageId, viewport, rule: 'icon-button-name', severity: 'blocker', ...item });
  }
}

async function checkFocusVisibility(page: Page, pageId: string, viewport: string) {
  // 真实 Tab 全路径：持续按 Tab，直到回到首个聚焦元素（循环）或焦点不再变化（走尽），
  // 安全上限防死循环。读取每个新聚焦元素的 computed 样式。
  // 元素身份用临时 data-a11y-audit-id（真实 DOM 身份），展示 selector 与身份分离——
  // 同名 class 的无 id 按钮（如侧栏 button.w-full）不再被误判为同一元素。
  const MAX_STEPS = 100;
  const flagged = new Set<string>();
  let firstElementId: number | null = null;
  let lastElementId = -1;

  await page.evaluate(() => {
    (window as unknown as { __a11yAuditSeq: number }).__a11yAuditSeq = 0;
  });

  for (let step = 0; step < MAX_STEPS; step++) {
    await page.keyboard.press('Tab');
    const result = await page.evaluate(() => {
      const w = window as unknown as { __a11yAuditSeq: number };
      const el = document.activeElement as (HTMLElement & { dataset: DOMStringMap }) | null;
      if (!el || el === document.body) return { elementId: -2, selector: '__body__', noRing: false, evidence: '' };
      if (!el.dataset.a11yAuditId) {
        w.__a11yAuditSeq += 1;
        el.dataset.a11yAuditId = String(w.__a11yAuditSeq);
      }
      const cls = (el.getAttribute('class') ?? '').split(' ')[0];
      const style = getComputedStyle(el);
      const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      const hasRing = style.boxShadow !== 'none' && style.boxShadow !== '';
      return {
        elementId: Number(el.dataset.a11yAuditId),
        selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + `.${cls}`,
        noRing: !hasOutline && !hasRing,
        evidence: `Tab 聚焦时 outline=${style.outlineStyle}/${style.outlineWidth}，box-shadow=none，text=${(el.textContent ?? '').trim().slice(0, 24)}`,
      };
    });

    if (result.elementId === -2) break; // 焦点回到 body，路径走尽
    if (firstElementId === null) {
      firstElementId = result.elementId;
    } else if (result.elementId === firstElementId) {
      break; // 同一实际元素再次出现，循环结束
    }
    if (result.elementId === lastElementId) {
      break; // 焦点不再移动（到达末尾或陷阱），防死循环
    }
    lastElementId = result.elementId;

    if (result.noRing) {
      flagged.add(`${result.selector}|${result.evidence}`);
    }
  }

  for (const item of flagged) {
    const [selector, evidence] = item.split('|');
    findings.push({ page: pageId, viewport, rule: 'focus-visible', severity: 'blocker', selector, evidence });
  }
}

async function checkTouchTargets(page: Page, pageId: string, viewport: string) {
  const results = await page.evaluate(() => {
    const bad: Array<{ selector: string; evidence: string }> = [];
    const interactives = Array.from(document.querySelectorAll('button, a, input, select, [role="button"], [role="tab"]'));
    for (const el of interactives) {
      const htmlEl = el as HTMLElement;
      if (htmlEl.offsetParent === null) continue;
      const rect = htmlEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        const cls = (htmlEl.getAttribute('class') ?? '').slice(0, 60);
        bad.push({
          selector: htmlEl.tagName.toLowerCase() + `.${cls.split(' ')[0]}`,
          evidence: `触控目标 ${Math.round(rect.width)}×${Math.round(rect.height)}px < 44px`,
        });
      }
    }
    return bad.slice(0, 20);
  });
  for (const item of results) {
    findings.push({ page: pageId, viewport, rule: 'touch-target', severity: 'blocker', ...item });
  }
}

function luminance(r: number, g: number, b: number) {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

async function checkContrast(page: Page, pageId: string, viewport: string) {
  const results = await page.evaluate(() => {
    function parseColor(value: string): [number, number, number, number] | null {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(',').map((part) => parseFloat(part.trim()));
      return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
    }
    function composite(fg: [number, number, number, number], bg: [number, number, number, number]): [number, number, number] {
      const alpha = fg[3] + bg[3] * (1 - fg[3]);
      if (alpha === 0) return [bg[0], bg[1], bg[2]];
      return [
        (fg[0] * fg[3] + bg[0] * bg[3] * (1 - fg[3])) / alpha,
        (fg[1] * fg[3] + bg[1] * bg[3] * (1 - fg[3])) / alpha,
        (fg[2] * fg[3] + bg[2] * bg[3] * (1 - fg[3])) / alpha,
      ];
    }
    function luminanceOf(rgb: [number, number, number]) {
      const channel = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
    }
    function effectiveBackground(el: HTMLElement): [number, number, number, number] {
      let node: HTMLElement | null = el;
      while (node) {
        const bg = parseColor(getComputedStyle(node).backgroundColor);
        if (bg && bg[3] > 0.98) return bg;
        node = node.parentElement;
      }
      return [29, 35, 54, 1]; // neutral-01 兜底
    }

    const bad: Array<{ selector: string; evidence: string; ratio: number }> = [];
    const textNodes = Array.from(document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, td, th, label, li, a'))
      .filter((el) => {
        const htmlEl = el as HTMLElement;
        return htmlEl.offsetParent !== null && (htmlEl.textContent ?? '').trim().length > 0 && htmlEl.children.length === 0;
      })
      .slice(0, 120) as HTMLElement[];

    for (const el of textNodes) {
      const style = getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      if (fontSize < 11) continue;
      const fg = parseColor(style.color);
      if (!fg) continue;
      const bg = effectiveBackground(el);
      const fgComposite = composite(fg, bg);
      const bgComposite: [number, number, number] = [bg[0], bg[1], bg[2]];
      const lum1 = luminanceOf(fgComposite);
      const lum2 = luminanceOf(bgComposite);
      const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
      if (ratio < 7) {
        const cls = (el.getAttribute('class') ?? '').slice(0, 60);
        bad.push({
          selector: el.tagName.toLowerCase() + `.${cls.split(' ')[0]}`,
          evidence: `对比度 ${ratio.toFixed(2)}:1（字号 ${fontSize}px，color=${style.color}）「${(el.textContent ?? '').trim().slice(0, 24)}」`,
          ratio,
        });
      }
    }
    return bad;
  });
  for (const item of results) {
    findings.push({
      page: pageId,
      viewport,
      rule: 'contrast',
      severity: item.ratio < 4.5 ? 'blocker' : 'advisory',
      selector: item.selector,
      evidence: item.evidence,
    });
  }
}

async function auditPage(page: Page, routeId: string, path: string, viewportName: string, readyText: string) {
  const pageErrors: string[] = [];
  const onPageError = (error: Error) => pageErrors.push(String(error));
  page.on('pageerror', onPageError);
  let navigationError = '';
  try {
    try {
      await page.goto(path, { waitUntil: 'networkidle' });
    } catch (error) {
      navigationError = String(error);
    }
    await page.waitForTimeout(800);
    // ready 断言（route 专属文本 + 无 pageerror + 无导航异常）：
    // 白屏/崩溃/导航失败均不得被当成审计成功（权限页崩溃、导航吞异常两轮教训）
    const ready = navigationError === '' && (await page.getByText(readyText, { exact: false }).first().isVisible().catch(() => false));
    if (!ready || pageErrors.length > 0) {
      findings.push({
        page: routeId,
        viewport: viewportName,
        rule: 'page-ready',
        severity: 'blocker',
        selector: 'body',
        evidence: `页面未正常渲染（readyText="${readyText}" 不可见）${navigationError ? `，navigationError=${navigationError.slice(0, 120)}` : ''}${pageErrors.length > 0 ? `，pageerror=${pageErrors[0].slice(0, 160)}` : ''}`,
      });
      return; // 崩溃页不做后续检查（数据无意义）
    }
    await checkIconOnlyButtons(page, routeId, viewportName);
    await checkFocusVisibility(page, routeId, viewportName);
    if (viewportName.startsWith('mobile')) {
      await checkTouchTargets(page, routeId, viewportName);
    }
    await checkContrast(page, routeId, viewportName);
  } finally {
    page.off('pageerror', onPageError);
  }
}

test.describe('a11y audit @audit', () => {
  test.setTimeout(600_000);

  test('desktop routes 1440x900', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'chromium only');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
    });
    for (const route of DESKTOP_ROUTES) {
      await auditPage(page, route.id, route.path, 'desktop-1440', route.readyText);
    }
  });

  test('mobile routes 390x844', async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      window.localStorage.setItem('homedata.mobile.onboarding.dismissed', 'true');
    });
    const backendPort = Number(process.env.BACKEND_PORT ?? '8000');
    let personPath = '/mobile';
    const peopleResponse = await request.get(`http://127.0.0.1:${backendPort}/api/people?limit=1`);
    if (peopleResponse.ok()) {
      const people = await peopleResponse.json() as { items: Array<{ id: string }> };
      if (people.items.length > 0) {
        personPath = `/mobile/person/${people.items[0].id}`;
      }
    }
    for (const route of MOBILE_ROUTES) {
      const path = route.path === '/mobile/person/:first' ? personPath : route.path;
      await auditPage(page, route.id, path, 'mobile-390', route.readyText);
    }
  });

  test.afterAll(() => {
    mkdirSync('test-results/a11y-audit', { recursive: true });
    writeFileSync('test-results/a11y-audit/findings.json', JSON.stringify(findings, null, 2), 'utf-8');
    console.log(`findings written: ${findings.length}`);
  });

  // 硬断言（T1b 复审裁决）：非豁免阻断项必须为 0，否则套件失败。
  // 豁免须精确到 page + rule + 元素特征（selector 子串），禁止整类放行；
  // 每条均附逐条核实的原因。
  // 硬断言（T1b 复审裁决）：阻断项必须为 0，否则套件失败。
  // 豁免机制保留但当前为空——htmlFor 关联 label 已由扫描器直接识别，
  // 今后新增豁免须精确到 evidence 子串并附逐条核实的原因，禁止整类放行。
  const EXEMPTIONS: Array<{ page: string; rule: string; evidenceIncludes: string; reason: string }> = [];

  test('非豁免阻断项为零', async () => {
    const remaining = findings.filter(
      (finding) =>
        finding.severity === 'blocker' &&
        !EXEMPTIONS.some(
          (exemption) =>
            exemption.page === finding.page &&
            exemption.rule === finding.rule &&
            finding.evidence.includes(exemption.evidenceIncludes),
        ),
    );
    expect(
      remaining,
      `存在 ${remaining.length} 条非豁免阻断项：\n${remaining.map((f) => `[${f.page}] ${f.rule} ${f.evidence}`).join('\n')}`,
    ).toHaveLength(0);
  });
});
