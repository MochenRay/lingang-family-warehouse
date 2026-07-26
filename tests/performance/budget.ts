import { isDeepStrictEqual } from 'node:util';

export const PERFORMANCE_SCHEMA_VERSION = 3;

export const CANONICAL_PERFORMANCE_EXECUTION_CLASS = 'ci-performance';

export interface PerformanceProfile {
  build: 'production-preview';
  dataMode: 'api';
  browser: 'chromium';
  samples: number;
  warmups: number;
  viewport: { width: number; height: number };
  network: { downloadMbps: number; uploadMbps: number; latencyMs: number };
  cpuSlowdown: number;
  fixedTime: string;
  reducedMotion: 'reduce';
  serviceWorkers: 'block';
  cacheDisabled: true;
  networkQuietMs: number;
  waitForFonts: true;
}

export const CANONICAL_PERFORMANCE_PROFILE: PerformanceProfile = {
  build: 'production-preview',
  dataMode: 'api',
  browser: 'chromium',
  samples: 3,
  warmups: 1,
  viewport: { width: 1440, height: 900 },
  network: { downloadMbps: 5, uploadMbps: 3, latencyMs: 80 },
  cpuSlowdown: 4,
  fixedTime: '2026-07-15T04:00:00.000Z',
  reducedMotion: 'reduce',
  serviceWorkers: 'block',
  cacheDisabled: true,
  networkQuietMs: 200,
  waitForFonts: true,
};

export interface ApiResponseMetric {
  method: string;
  path: string;
  status: number;
  bytes: number;
}

export interface PerformanceSample {
  readyMs: number;
  apiRequestCount: number;
  apiResponseBytes: number;
  apiResponses: ApiResponseMetric[];
}

export interface RoutePerformanceMetrics {
  path: string;
  readyMs: number;
  apiRequestCount: number;
  apiResponseBytes: number;
  apiCalls: string[];
  samples: PerformanceSample[];
}

export interface PerformanceReport {
  schemaVersion: number;
  profile: PerformanceProfile;
  provenance: {
    runner: string;
    platform: string;
    arch: string;
    nodeVersion: string;
    browserVersion: string;
    playwrightVersion: string;
    executionClass: string;
    sourceRevision: string;
    dirty: boolean;
    seedFingerprint: string;
    generatedAt: string;
  };
  routes: Record<string, RoutePerformanceMetrics>;
}

const RELATIVE_BUDGET = 1.2;
const READY_MIN_DELTA_MS = 250;

function formatBudget(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

function exceedsRelativeBudget(baseline: number, current: number): boolean {
  return baseline === 0 ? current > 0 : current > baseline * RELATIVE_BUDGET;
}

function environmentKey(report: PerformanceReport): string {
  const { runner, platform, arch } = report.provenance;
  return `${runner}/${platform}/${arch}`;
}

function nodeMajor(version: string): string {
  return version.match(/^v?(\d+)/)?.[1] ?? version;
}

function timingCohortMismatches(
  baseline: PerformanceReport,
  current: PerformanceReport,
): string[] {
  const fields: Array<[string, string, string]> = [
    ['runner', baseline.provenance.runner, current.provenance.runner],
    ['platform', baseline.provenance.platform, current.provenance.platform],
    ['arch', baseline.provenance.arch, current.provenance.arch],
    ['nodeMajor', nodeMajor(baseline.provenance.nodeVersion), nodeMajor(current.provenance.nodeVersion)],
    ['browserVersion', baseline.provenance.browserVersion, current.provenance.browserVersion],
    ['playwrightVersion', baseline.provenance.playwrightVersion, current.provenance.playwrightVersion],
    ['executionClass', baseline.provenance.executionClass, current.provenance.executionClass],
    ['seedFingerprint', baseline.provenance.seedFingerprint, current.provenance.seedFingerprint],
  ];
  return fields.filter(([, left, right]) => left !== right).map(([name]) => name);
}

function hasComparableReadyTiming(baseline: PerformanceReport, current: PerformanceReport): boolean {
  return timingCohortMismatches(baseline, current).length === 0;
}

function validateProvenance(label: 'baseline' | 'current', report: PerformanceReport): string[] {
  const { provenance } = report;
  const validRunner = provenance.runner === 'local' || provenance.runner === 'github-actions';
  const validSha = /^[0-9a-f]{40}$/i.test(provenance.sourceRevision);
  const validSeed = /^[0-9a-f]{64}$/i.test(provenance.seedFingerprint);
  const validGeneratedAt = !Number.isNaN(Date.parse(provenance.generatedAt));
  const valid = validRunner
    && Boolean(provenance.platform)
    && Boolean(provenance.arch)
    && Boolean(provenance.nodeVersion)
    && Boolean(provenance.browserVersion)
    && Boolean(provenance.playwrightVersion)
    && Boolean(provenance.executionClass)
    && typeof provenance.dirty === 'boolean'
    && validSha
    && validSeed
    && validGeneratedAt;
  return valid ? [] : [`${label} provenance is missing or invalid`];
}

function occurrenceCounts(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

export function performanceBaselineWarnings(
  baseline: PerformanceReport,
  current: PerformanceReport,
): string[] {
  const mismatches = timingCohortMismatches(baseline, current);
  if (mismatches.length === 0) return [];
  return [
    `readyMs budget skipped: timing cohort differs: ${mismatches.join(', ')}`,
  ];
}

export function requireComparableTimingCohort(
  baseline: PerformanceReport,
  current: PerformanceReport,
): string[] {
  const mismatches = timingCohortMismatches(baseline, current);
  return mismatches.length === 0
    ? []
    : [`canonical timing cohort mismatch: ${mismatches.join(', ')}`];
}

export function requireCanonicalUbuntuBaseline(baseline: PerformanceReport): string[] {
  const {
    runner,
    platform,
    arch,
    dirty,
    executionClass,
  } = baseline.provenance;
  if (
    runner === 'github-actions'
    && platform === 'linux'
    && arch === 'x64'
    && dirty === false
    && executionClass === CANONICAL_PERFORMANCE_EXECUTION_CLASS
  ) {
    return [];
  }
  return [
    `baseline is not canonical PR CI performance evidence: ${environmentKey(baseline)}, dirty=${String(dirty)}, executionClass=${String(executionClass)}`,
  ];
}

export function requireCanonicalUbuntuCurrent(current: PerformanceReport): string[] {
  const baselineMessage = requireCanonicalUbuntuBaseline(current);
  return [...new Set([
    ...baselineMessage.map((message) => message.replace(/^baseline /, 'current ')),
    ...validateProvenance('current', current),
  ])];
}

export function baselineRefreshReasons(
  baseline: PerformanceReport,
  current: PerformanceReport,
): string[] {
  const reasons: string[] = [];
  if (baseline.schemaVersion !== PERFORMANCE_SCHEMA_VERSION) {
    reasons.push(`baseline schemaVersion ${baseline.schemaVersion} != canonical ${PERFORMANCE_SCHEMA_VERSION}`);
  }
  if (!isDeepStrictEqual(baseline.profile, CANONICAL_PERFORMANCE_PROFILE)) {
    reasons.push('baseline profile differs from canonical measurement profile');
  }
  reasons.push(...validateProvenance('baseline', baseline));
  reasons.push(...requireCanonicalUbuntuBaseline(baseline));
  reasons.push(...requireComparableTimingCohort(baseline, current));
  return [...new Set(reasons)];
}

export function evaluatePerformanceBaseline(
  baseline: PerformanceReport,
  current: PerformanceReport,
): string[] {
  const violations: string[] = [];
  if (baseline.schemaVersion !== PERFORMANCE_SCHEMA_VERSION) {
    violations.push(`baseline schemaVersion ${baseline.schemaVersion} != canonical ${PERFORMANCE_SCHEMA_VERSION}`);
  }
  if (current.schemaVersion !== PERFORMANCE_SCHEMA_VERSION) {
    violations.push(`current schemaVersion ${current.schemaVersion} != canonical ${PERFORMANCE_SCHEMA_VERSION}`);
  }
  if (!isDeepStrictEqual(baseline.profile, CANONICAL_PERFORMANCE_PROFILE)) {
    violations.push('baseline profile differs from canonical measurement profile');
  }
  if (!isDeepStrictEqual(current.profile, CANONICAL_PERFORMANCE_PROFILE)) {
    violations.push('current profile differs from canonical measurement profile');
  }
  violations.push(...validateProvenance('baseline', baseline));
  violations.push(...validateProvenance('current', current));
  const baselineIds = Object.keys(baseline.routes).sort();
  const currentIds = Object.keys(current.routes).sort();

  for (const routeId of baselineIds) {
    if (!(routeId in current.routes)) {
      violations.push(`missing route: ${routeId}`);
    }
  }
  for (const routeId of currentIds) {
    if (!(routeId in baseline.routes)) {
      violations.push(`unexpected route: ${routeId}`);
    }
  }

  for (const routeId of baselineIds) {
    const expected = baseline.routes[routeId];
    const actual = current.routes[routeId];
    if (!actual) continue;
    if (actual.path !== expected.path) {
      violations.push(`${routeId} path ${actual.path} != baseline ${expected.path}`);
      continue;
    }

    if (expected.samples.length !== baseline.profile.samples) {
      violations.push(
        `${routeId} baseline sample count ${expected.samples.length} != profile ${baseline.profile.samples}`,
      );
    }
    if (actual.samples.length !== current.profile.samples) {
      violations.push(
        `${routeId} sample count ${actual.samples.length} != profile ${current.profile.samples}`,
      );
    }

    const expectedCalls = occurrenceCounts(expected.apiCalls);
    const actualCalls = occurrenceCounts(actual.apiCalls);
    for (const [apiCall, expectedCount] of expectedCalls) {
      const actualCount = actualCalls.get(apiCall) ?? 0;
      if (actualCount < expectedCount) {
        violations.push(
          `${routeId} missing API call: ${apiCall} (expected ${expectedCount}, current ${actualCount})`,
        );
      }
    }
    for (const [apiCall, actualCount] of actualCalls) {
      const expectedCount = expectedCalls.get(apiCall) ?? 0;
      if (actualCount > expectedCount) {
        violations.push(
          `${routeId} unexpected API call: ${apiCall} (expected ${expectedCount}, current ${actualCount})`,
        );
      }
    }

    const readyBudget = expected.readyMs * RELATIVE_BUDGET;
    const readyDelta = actual.readyMs - expected.readyMs;
    if (
      hasComparableReadyTiming(baseline, current)
      && actual.readyMs > readyBudget
      && readyDelta > READY_MIN_DELTA_MS
    ) {
      violations.push(
        `${routeId} readyMs ${formatBudget(actual.readyMs)} > budget ${formatBudget(readyBudget)} and delta ${formatBudget(readyDelta)}ms > ${READY_MIN_DELTA_MS}ms`,
      );
    }

    const requestBudget = expected.apiRequestCount * RELATIVE_BUDGET;
    if (exceedsRelativeBudget(expected.apiRequestCount, actual.apiRequestCount)) {
      violations.push(
        `${routeId} apiRequestCount ${formatBudget(actual.apiRequestCount)} > budget ${formatBudget(requestBudget)}`,
      );
    }

    const payloadBudget = expected.apiResponseBytes * RELATIVE_BUDGET;
    if (exceedsRelativeBudget(expected.apiResponseBytes, actual.apiResponseBytes)) {
      violations.push(
        `${routeId} apiResponseBytes ${formatBudget(actual.apiResponseBytes)} > budget ${formatBudget(payloadBudget)}`,
      );
    }
  }

  return violations;
}
