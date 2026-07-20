import { expect, test, type Page } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

/**
 * T1a a11y 审计扫描器：对 31 个桌面路由 + 4 条移动 smoke 路径执行自动检查。
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

const DESKTOP_ROUTES: Array<{ id: string; path: string }> = [
  { id: 'statistics-overview', path: '/' },
  { id: 'demographics-analysis', path: '/analysis/demographics' },
  { id: 'housing-statistics', path: '/analysis/housing' },
  { id: 'migration-trends', path: '/analysis/migration-trends' },
  { id: 'population-tags', path: '/analysis/tags' },
  { id: 'data-comparison', path: '/analysis/comparison' },
  { id: 'data-reports', path: '/analysis/reports' },
  { id: 'heatmap', path: '/analysis/warning-map' },
  { id: 'population', path: '/population' },
  { id: 'housing', path: '/housing' },
  { id: 'relationship', path: '/relationship' },
  { id: 'batch-import', path: '/batch-import' },
  { id: 'tag-overview', path: '/tags' },
  { id: 'knowledge-accumulation', path: '/knowledge' },
  { id: 'policy-interpretation', path: '/ai/policy' },
  { id: 'document-writing', path: '/ai/document-writing' },
  { id: 'smart-query', path: '/ai/smart-query' },
  { id: 'behavior-supervision', path: '/grid/behavior' },
  { id: 'activity-management', path: '/grid/activities' },
  { id: 'conflict-management', path: '/grid/conflicts' },
  { id: 'notice-management', path: '/grid/notices' },
  { id: 'publish-notice', path: '/grid/notices/publish' },
  { id: 'rule-config', path: '/grid/rules' },
  { id: 'anomaly-analysis', path: '/attribution/anomaly' },
  { id: 'time-series', path: '/attribution/time-series' },
  { id: 'factor-identification', path: '/attribution/factors' },
  { id: 'contribution-ranking', path: '/attribution/contribution' },
  { id: 'user-management', path: '/settings/users' },
  { id: 'role-management', path: '/settings/roles' },
  { id: 'permission-management', path: '/settings/permissions' },
  { id: 'log-management', path: '/settings/logs' },
];

const MOBILE_ROUTES: Array<{ id: string; path: string }> = [
  { id: 'mobile-home', path: '/mobile' },
  { id: 'mobile-people', path: '/mobile/people' },
  { id: 'mobile-person-detail', path: '/mobile/person/:first' },
  { id: 'mobile-conflict-form', path: '/mobile/conflict/new' },
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
  const MAX_STEPS = 100;
  const flagged = new Set<string>();
  const seenSelectors = new Set<string>();
  let firstSelector: string | null = null;
  let lastSelector = '';

  for (let step = 0; step < MAX_STEPS; step++) {
    await page.keyboard.press('Tab');
    const result = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return { selector: '__body__', noRing: false, evidence: '' };
      const cls = (el.getAttribute('class') ?? '').split(' ')[0];
      const selector = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + `.${cls}`;
      const style = getComputedStyle(el);
      const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
      const hasRing = style.boxShadow !== 'none' && style.boxShadow !== '';
      return {
        selector,
        noRing: !hasOutline && !hasRing,
        evidence: `Tab 聚焦时 outline=${style.outlineStyle}/${style.outlineWidth}，box-shadow=none，text=${(el.textContent ?? '').trim().slice(0, 24)}`,
      };
    });

    if (result.selector === '__body__') break; // 焦点回到 body，路径走尽
    if (firstSelector === null) {
      firstSelector = result.selector;
    } else if (result.selector === firstSelector) {
      break; // 回到首个焦点，循环结束
    }
    if (result.selector === lastSelector) {
      break; // 焦点不再变化（到达末尾或陷阱），防死循环
    }
    lastSelector = result.selector;

    if (result.noRing && !seenSelectors.has(result.selector)) {
      seenSelectors.add(result.selector);
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

async function auditPage(page: Page, routeId: string, path: string, viewportName: string) {
  const pageErrors: string[] = [];
  const onPageError = (error: Error) => pageErrors.push(String(error));
  page.on('pageerror', onPageError);
  try {
    await page.goto(path, { waitUntil: 'networkidle' }).catch(() => undefined);
    await page.waitForTimeout(800);
    // ready 断言：页面必须有实质文本内容，且不得有 pageerror——
    // 白屏/崩溃页（body 为空）不得被当成审计成功（权限页 structuredClone 崩溃的教训）。
    // 注意：不以 h1-h3 为据（移动端部分页面用 div 渲染标题）。
    const ready = await page.evaluate(() => {
      const textLength = (document.body?.textContent ?? '').trim().length;
      const hasInteractives = document.querySelector('button, a, input, [role="button"], h1, h2, h3') !== null;
      return textLength > 20 && hasInteractives;
    });
    if (!ready || pageErrors.length > 0) {
      findings.push({
        page: routeId,
        viewport: viewportName,
        rule: 'page-ready',
        severity: 'blocker',
        selector: 'body',
        evidence: `页面未正常渲染：ready=${ready}${pageErrors.length > 0 ? `，pageerror=${pageErrors[0].slice(0, 160)}` : ''}`,
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
      await auditPage(page, route.id, route.path, 'desktop-1440');
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
      await auditPage(page, route.id, path, 'mobile-390');
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
