import { describe, expect, it } from 'vitest';

import {
  CANONICAL_PERFORMANCE_EXECUTION_CLASS,
  CANONICAL_PERFORMANCE_PROFILE,
  PERFORMANCE_SCHEMA_VERSION,
  baselineRefreshReasons,
  evaluatePerformanceBaseline,
  performanceBaselineWarnings,
  requireCanonicalUbuntuBaseline,
  requireComparableTimingCohort,
  type PerformanceReport,
  type RoutePerformanceMetrics,
} from './budget';

function route(
  path: string,
  readyMs: number,
  apiRequestCount: number,
  apiResponseBytes: number,
  apiCalls: string[] = [],
): RoutePerformanceMetrics {
  return {
    path,
    readyMs,
    apiRequestCount,
    apiResponseBytes,
    apiCalls,
    samples: Array.from({ length: CANONICAL_PERFORMANCE_PROFILE.samples }, () => ({
      readyMs,
      apiRequestCount,
      apiResponseBytes,
      apiResponses: [],
    })),
  };
}

function report(routeMetrics: PerformanceReport['routes']): PerformanceReport {
  return {
    schemaVersion: PERFORMANCE_SCHEMA_VERSION,
    profile: structuredClone(CANONICAL_PERFORMANCE_PROFILE),
    provenance: {
      runner: 'local',
      platform: 'darwin',
      arch: 'arm64',
      nodeVersion: 'v22.0.0',
      browserVersion: '140.0.0.0',
      playwrightVersion: '1.58.2',
      executionClass: 'local',
      sourceRevision: 'a'.repeat(40),
      dirty: false,
      seedFingerprint: 'b'.repeat(64),
      generatedAt: '2026-07-23T07:30:00.000Z',
    },
    routes: routeMetrics,
  };
}

function markCanonical(reportValue: PerformanceReport): PerformanceReport {
  reportValue.provenance = {
    ...reportValue.provenance,
    runner: 'github-actions',
    platform: 'linux',
    arch: 'x64',
    executionClass: CANONICAL_PERFORMANCE_EXECUTION_CLASS,
  };
  return reportValue;
}

describe('performance budget', () => {
  it('accepts noise inside the relative and absolute ready-time guard', () => {
    const baseline = report({ dashboard: route('/', 1000, 5, 1000, ['GET /api/stats/dashboard']) });
    const current = report({ dashboard: route('/', 1210, 6, 1200, ['GET /api/stats/dashboard']) });

    expect(evaluatePerformanceBaseline(baseline, current)).toEqual([]);
  });

  it('fails request, payload, and material ready-time regressions over twenty percent', () => {
    const baseline = report({ dashboard: route('/', 1000, 5, 1000) });
    const current = report({ dashboard: route('/', 1300, 7, 1201) });

    expect(evaluatePerformanceBaseline(baseline, current)).toEqual([
      'dashboard readyMs 1300 > budget 1200 and delta 300ms > 250ms',
      'dashboard apiRequestCount 7 > budget 6',
      'dashboard apiResponseBytes 1201 > budget 1200',
    ]);
  });

  it('rejects route manifest drift before comparing metrics', () => {
    const baseline = report({ dashboard: route('/', 1000, 0, 0) });
    const current = report({ demographics: route('/analysis/demographics', 1000, 0, 0) });

    expect(evaluatePerformanceBaseline(baseline, current)).toEqual([
      'missing route: dashboard',
      'unexpected route: demographics',
    ]);
  });

  it('rejects baseline and current drift from the canonical schema and profile', () => {
    const baseline = report({});
    const current = report({});
    baseline.schemaVersion = 1;
    baseline.profile.warmups = 0;
    current.schemaVersion = 1;
    current.profile.cpuSlowdown = 1;

    expect(evaluatePerformanceBaseline(baseline, current)).toEqual([
      'baseline schemaVersion 1 != canonical 3',
      'current schemaVersion 1 != canonical 3',
      'baseline profile differs from canonical measurement profile',
      'current profile differs from canonical measurement profile',
    ]);
  });

  it('rejects API call disappearance, including duplicate-call multiplicity', () => {
    const call = 'GET /api/stats/dashboard';
    const baseline = report({ dashboard: route('/', 1000, 2, 1000, [call, call]) });
    const current = report({ dashboard: route('/', 500, 1, 500, [call]) });

    expect(evaluatePerformanceBaseline(baseline, current)).toEqual([
      `dashboard missing API call: ${call} (expected 2, current 1)`,
    ]);
  });

  it('skips only ready-time comparison across incompatible runners and explains why', () => {
    const call = 'GET /api/stats/dashboard';
    const baseline = report({ dashboard: route('/', 1000, 1, 1000, [call]) });
    const current = report({ dashboard: route('/', 2000, 1, 1000, [call]) });
    current.provenance = {
      ...current.provenance,
      runner: 'github-actions',
      platform: 'linux',
      executionClass: CANONICAL_PERFORMANCE_EXECUTION_CLASS,
    };

    expect(evaluatePerformanceBaseline(baseline, current)).toEqual([]);
    expect(performanceBaselineWarnings(baseline, current)).toEqual([
      'readyMs budget skipped: timing cohort differs: runner, platform, executionClass',
    ]);
  });

  it('rejects unverifiable provenance', () => {
    const baseline = report({});
    const current = report({});
    baseline.provenance.seedFingerprint = 'unknown';

    expect(evaluatePerformanceBaseline(baseline, current)).toEqual([
      'baseline provenance is missing or invalid',
    ]);
  });

  it('requires clean GitHub Actions Linux x64 provenance for canonical CI timing', () => {
    const baseline = report({});

    expect(requireCanonicalUbuntuBaseline(baseline)).toEqual([
      'baseline is not canonical PR CI performance evidence: local/darwin/arm64, dirty=false, executionClass=local',
    ]);

    baseline.provenance = {
      ...baseline.provenance,
      runner: 'github-actions',
      platform: 'linux',
      arch: 'x64',
      executionClass: CANONICAL_PERFORMANCE_EXECUTION_CLASS,
    };
    expect(requireCanonicalUbuntuBaseline(baseline)).toEqual([]);
  });

  it('requests a refresh only for canonical schema, profile, provenance, or timing-cohort drift', () => {
    const baseline = markCanonical(report({ dashboard: route('/', 1000, 1, 1000) }));
    const current = markCanonical(report({ dashboard: route('/', 2000, 2, 2000) }));

    expect(baselineRefreshReasons(baseline, current)).toEqual([]);

    current.provenance.executionClass = 'manual-candidate';
    expect(baselineRefreshReasons(baseline, current)).toEqual([
      'canonical timing cohort mismatch: executionClass',
    ]);
    current.provenance.executionClass = CANONICAL_PERFORMANCE_EXECUTION_CLASS;

    baseline.schemaVersion = 2;
    baseline.profile.warmups = 0;
    current.provenance.seedFingerprint = 'c'.repeat(64);
    expect(baselineRefreshReasons(baseline, current)).toEqual([
      'baseline schemaVersion 2 != canonical 3',
      'baseline profile differs from canonical measurement profile',
      'canonical timing cohort mismatch: seedFingerprint',
    ]);
  });

  it('skips local timing and blocks canonical enforcement when seed/runtime cohort drifts', () => {
    const call = 'GET /api/stats/dashboard';
    const baseline = report({ dashboard: route('/', 1000, 1, 1000, [call]) });
    const current = report({ dashboard: route('/', 2000, 1, 1000, [call]) });
    current.provenance.seedFingerprint = 'c'.repeat(64);
    current.provenance.browserVersion = '141.0.0.0';

    expect(evaluatePerformanceBaseline(baseline, current)).toEqual([]);
    expect(performanceBaselineWarnings(baseline, current)).toEqual([
      'readyMs budget skipped: timing cohort differs: browserVersion, seedFingerprint',
    ]);
    expect(requireComparableTimingCohort(baseline, current)).toEqual([
      'canonical timing cohort mismatch: browserVersion, seedFingerprint',
    ]);
  });
});
