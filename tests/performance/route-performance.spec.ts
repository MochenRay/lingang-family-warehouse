import { expect, test, type Browser, type Page, type Request, type Response } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DESKTOP_ROUTES, type DesktopRouteProbe } from '../e2e/support/desktop-routes';
import {
  CANONICAL_PERFORMANCE_PROFILE,
  PERFORMANCE_SCHEMA_VERSION,
  baselineRefreshReasons,
  evaluatePerformanceBaseline,
  performanceBaselineWarnings,
  requireCanonicalUbuntuBaseline,
  requireCanonicalUbuntuCurrent,
  requireComparableTimingCohort,
  type ApiResponseMetric,
  type PerformanceReport,
  type PerformanceSample,
} from './budget';

const PROFILE = CANONICAL_PERFORMANCE_PROFILE;
const OUTPUT_DIR = resolve('test-results/performance');
const CURRENT_PATH = resolve(OUTPUT_DIR, 'current.json');
const CANDIDATE_PATH = resolve(OUTPUT_DIR, 'baseline-candidate.json');
const SUMMARY_PATH = resolve(OUTPUT_DIR, 'summary.md');
const BASELINE_PATH = resolve('tests/performance/performance-baseline.json');
const FIXED_TIME = new Date(PROFILE.fixedTime);

type DetailedSample = PerformanceSample;

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function round(value: number): number {
  return Number(value.toFixed(1));
}

function trackedResource(request: Request): boolean {
  return ['document', 'script', 'stylesheet', 'fetch', 'xhr'].includes(request.resourceType());
}

function gitOutput(args: string[]): string {
  try {
    return execFileSync('git', args, { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

function seedFingerprint(): string {
  const files = gitOutput(['ls-files', '--', 'backend/seed.py', 'backend/app/demo_data'])
    .split('\n')
    .filter((path) => path && path !== 'unknown')
    .sort();
  const hash = createHash('sha256');
  for (const path of files) {
    hash.update(path);
    hash.update(readFileSync(resolve(path)));
  }
  return files.length ? hash.digest('hex') : 'unknown';
}

function buildProvenance(browser: Browser): PerformanceReport['provenance'] {
  const playwrightPackage = JSON.parse(
    readFileSync(resolve('node_modules/@playwright/test/package.json'), 'utf-8'),
  ) as { version: string };
  return {
    runner: process.env.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'local',
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    browserVersion: browser.version(),
    playwrightVersion: playwrightPackage.version,
    executionClass: process.env.PERF_EXECUTION_CLASS
      ?? (process.env.GITHUB_ACTIONS === 'true' ? 'unclassified-github-actions' : 'local'),
    sourceRevision: gitOutput(['rev-parse', 'HEAD']),
    dirty: gitOutput(['status', '--porcelain']) !== '',
    seedFingerprint: seedFingerprint(),
    generatedAt: new Date().toISOString(),
  };
}

function stableApiCalls(routeId: string, samples: DetailedSample[]): string[] {
  const contracts = samples.map((sample) => sample.apiResponses
    .map((response) => `${response.method} ${response.path}`)
    .sort());
  const expected = contracts[0] ?? [];
  contracts.slice(1).forEach((contract, index) => {
    expect(contract, `${routeId} API path contract drift in sample ${index + 2}`).toEqual(expected);
  });
  return expected;
}

async function assertNoVisiblePageFailure(page: Page): Promise<void> {
  await expect(page.locator('[data-page-state="loading"]:visible')).toHaveCount(0);
  await expect(page.locator('[data-page-state="error"]:visible')).toHaveCount(0);
  await expect(page.locator('[data-sonner-toast][data-type="error"]:visible')).toHaveCount(0);
}

async function waitForNetworkQuiet(
  inFlight: Set<Request>,
  page: import('@playwright/test').Page,
  quietMs = PROFILE.networkQuietMs,
  timeoutMs = 30_000,
) {
  const deadline = Date.now() + timeoutMs;
  let quietSince = inFlight.size === 0 ? Date.now() : 0;
  while (Date.now() < deadline) {
    if (inFlight.size === 0) {
      if (!quietSince) quietSince = Date.now();
      if (Date.now() - quietSince >= quietMs) return;
    } else {
      quietSince = 0;
    }
    await page.waitForTimeout(25);
  }
  throw new Error(`network did not become quiet; ${inFlight.size} tracked request(s) remain`);
}

async function measureRoute(browser: Browser, baseURL: string, route: DesktopRouteProbe): Promise<DetailedSample> {
  const context = await browser.newContext({
    baseURL,
    viewport: PROFILE.viewport,
    reducedMotion: PROFILE.reducedMotion,
    serviceWorkers: PROFILE.serviceWorkers,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: PROFILE.cacheDisabled });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: PROFILE.network.latencyMs,
    downloadThroughput: PROFILE.network.downloadMbps * 1024 * 1024 / 8,
    uploadThroughput: PROFILE.network.uploadMbps * 1024 * 1024 / 8,
    connectionType: 'cellular4g',
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: PROFILE.cpuSlowdown });
  await page.clock.setFixedTime(FIXED_TIME);
  await page.addInitScript(() => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
  });

  const inFlight = new Set<Request>();
  const failures: string[] = [];
  const pageErrors: string[] = [];
  const dialogs: string[] = [];
  const responsePromises: Array<Promise<ApiResponseMetric | null>> = [];
  page.on('request', (request) => {
    if (trackedResource(request)) inFlight.add(request);
  });
  page.on('requestfinished', (request) => inFlight.delete(request));
  page.on('requestfailed', (request) => {
    inFlight.delete(request);
    failures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? 'failed'}`);
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('dialog', async (dialog) => {
    dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss();
  });
  page.on('response', (response: Response) => {
    const url = new URL(response.url());
    if (response.request().method() !== 'GET' || !url.pathname.startsWith('/api/')) return;
    responsePromises.push((async () => ({
      method: response.request().method(),
      path: `${url.pathname}${url.search}`,
      status: response.status(),
      bytes: (await response.body()).byteLength,
    }))().catch((error) => {
      failures.push(`body ${response.url()} ${String(error)}`);
      return null;
    }));
  });

  const startedAt = performance.now();
  const navigation = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  expect(navigation?.ok(), `${route.id} document status`).toBe(true);
  await expect.poll(() => new URL(page.url()).pathname).toBe(route.path);
  await expect(page.locator('main [data-page-title]')).toHaveText(route.readyTitle, { timeout: 30_000 });
  await waitForNetworkQuiet(inFlight, page);
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await expect(page.locator('[aria-busy="true"]:visible')).toHaveCount(0);
  await assertNoVisiblePageFailure(page);
  if (PROFILE.waitForFonts) await page.evaluate(() => document.fonts.ready);
  const readyMs = performance.now() - startedAt;

  const apiResponses = (await Promise.all(responsePromises))
    .filter((metric): metric is ApiResponseMetric => metric !== null);
  const nonSuccess = apiResponses.filter((response) => response.status < 200 || response.status >= 300);
  expect(failures, `${route.id} request failures`).toEqual([]);
  expect(pageErrors, `${route.id} page errors`).toEqual([]);
  expect(dialogs, `${route.id} unexpected dialogs`).toEqual([]);
  expect(nonSuccess, `${route.id} non-2xx API responses`).toEqual([]);

  await context.close();
  return {
    readyMs: round(readyMs),
    apiRequestCount: apiResponses.length,
    apiResponseBytes: apiResponses.reduce((sum, response) => sum + response.bytes, 0),
    apiResponses,
  };
}

function writeSummary(report: PerformanceReport, violations: string[], warnings: string[]) {
  const rows = Object.entries(report.routes)
    .map(([id, route]) => `| ${id} | ${route.readyMs} | ${route.apiRequestCount} | ${route.apiResponseBytes} |`)
    .join('\n');
  const violationText = violations.length
    ? violations.map((violation) => `- ${violation}`).join('\n')
    : '- none';
  const warningText = warnings.length
    ? warnings.map((warning) => `- ${warning}`).join('\n')
    : '- none';
  const environment = `${report.provenance.runner}/${report.provenance.platform}/${report.provenance.arch}`;
  writeFileSync(
    SUMMARY_PATH,
    `# Route performance\n\nEnvironment: ${environment}\n\n| Route | Ready ms | API requests | API response bytes |\n|---|---:|---:|---:|\n${rows}\n\n## Violations\n\n${violationText}\n\n## Warnings\n\n${warningText}\n`,
    'utf-8',
  );
}

test('30 desktop routes stay within the committed performance baseline @perf', async ({ browser, baseURL }) => {
  expect(baseURL).toBeTruthy();
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const report: PerformanceReport = {
    schemaVersion: PERFORMANCE_SCHEMA_VERSION,
    profile: PROFILE,
    provenance: buildProvenance(browser),
    routes: {},
  };

  for (const route of DESKTOP_ROUTES) {
    for (let index = 0; index < PROFILE.warmups; index += 1) {
      await measureRoute(browser, baseURL!, route); // primes server/OS caches, intentionally discarded
    }
    const samples: DetailedSample[] = [];
    for (let index = 0; index < PROFILE.samples; index += 1) {
      samples.push(await measureRoute(browser, baseURL!, route));
    }
    report.routes[route.id] = {
      path: route.path,
      readyMs: median(samples.map((sample) => sample.readyMs)),
      apiRequestCount: median(samples.map((sample) => sample.apiRequestCount)),
      apiResponseBytes: median(samples.map((sample) => sample.apiResponseBytes)),
      apiCalls: stableApiCalls(route.id, samples),
      samples,
    };
    console.log(
      `[perf] ${route.id} ready=${report.routes[route.id].readyMs}ms requests=${report.routes[route.id].apiRequestCount} bytes=${report.routes[route.id].apiResponseBytes}`,
    );
  }

  writeFileSync(CURRENT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
  if (process.env.PERF_UPDATE_BASELINE === '1') {
    writeFileSync(CANDIDATE_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
    writeSummary(report, [], []);
    expect(Object.keys(report.routes)).toHaveLength(30);
    return;
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) as PerformanceReport;
  const refreshReasons = baselineRefreshReasons(baseline, report);
  if (process.env.PERF_AUTO_CANDIDATE_ON_REFRESH === '1' && refreshReasons.length > 0) {
    const currentEvidenceBlockers = requireCanonicalUbuntuCurrent(report);
    if (currentEvidenceBlockers.length === 0) {
      writeFileSync(CANDIDATE_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
    }
    const refreshViolations = [...refreshReasons, ...currentEvidenceBlockers];
    writeSummary(report, refreshViolations, []);
    expect(refreshViolations, refreshViolations.join('\n')).toEqual([]);
  }

  const violations = evaluatePerformanceBaseline(baseline, report);
  if (process.env.PERF_REQUIRE_CANONICAL_BASELINE === '1') {
    violations.unshift(
      ...requireCanonicalUbuntuBaseline(baseline),
      ...requireCanonicalUbuntuCurrent(report),
      ...requireComparableTimingCohort(baseline, report),
    );
  }
  const warnings = performanceBaselineWarnings(baseline, report);
  writeSummary(report, violations, warnings);
  expect(violations, violations.join('\n')).toEqual([]);
});

test('readiness detector rejects a caught error rendered inside a valid page shell @perf', async ({ page }) => {
  await page.setContent(`
    <main>
      <h1 data-page-title>人口特征分析</h1>
      <div data-page-state="error">数据读取失败</div>
    </main>
  `);

  await expect(assertNoVisiblePageFailure(page)).rejects.toThrow();
});
