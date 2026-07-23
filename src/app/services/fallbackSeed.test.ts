import { afterEach, describe, expect, it, vi } from 'vitest';

function createMemoryStorage(seed: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(seed));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

function stubFallbackBrowser(storage: Storage) {
  vi.stubEnv('VITE_DATA_MODE', 'fallback');
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('window', {
    localStorage: storage,
    location: { hostname: 'localhost' },
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal('Event', class {
    constructor(public type: string) {}
  });
  vi.stubGlobal('CustomEvent', class {
    constructor(
      public type: string,
      public init?: CustomEventInit,
    ) {}
  });
}

async function loadFreshFallbackSnapshot() {
  vi.resetModules();
  const storage = createMemoryStorage();
  stubFallbackBrowser(storage);
  const { statsRepository } = await import('./repositories/statsRepository');
  const { analysisRepository } = await import('./repositories/analysisRepository');

  const dashboard = await statsRepository.getDashboard();
  const analysis = await analysisRepository.getGovernanceSnapshot();
  return { dashboard, analysis, storage };
}

describe('versioned deterministic fallback seed', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('produces the same seven non-zero priority counts and migration snapshot in fresh contexts', async () => {
    const first = await loadFreshFallbackSnapshot();
    const second = await loadFreshFallbackSnapshot();

    expect(first.dashboard.riskTagsSummary).toHaveLength(7);
    expect(first.dashboard.riskTagsSummary[first.dashboard.riskTagsSummary.length - 1]?.name).toBe('其他重点标签');
    expect(first.dashboard.riskTagsSummary.every((item) => item.count > 0)).toBe(true);
    expect(second.dashboard.riskTagsSummary).toEqual(first.dashboard.riskTagsSummary);

    expect(first.analysis.migration.totalIn).toBeGreaterThan(0);
    expect(first.analysis.migration.totalOut).toBeGreaterThan(0);
    expect(first.analysis.migration.net).not.toBe(0);
    expect(first.analysis.monthly.every((item) => item.moveIns > 0 && item.moveOuts > 0)).toBe(true);
    expect(first.analysis.migration).toEqual(second.analysis.migration);
    expect(first.analysis.monthly.map(({ key, moveIns, moveOuts }) => ({ key, moveIns, moveOuts }))).toEqual(
      second.analysis.monthly.map(({ key, moveIns, moveOuts }) => ({ key, moveIns, moveOuts })),
    );
  });

  it('replaces a v15 localStorage snapshot when the v16 seed marker is absent', async () => {
    vi.resetModules();
    const storage = createMemoryStorage({
      app_data_v15_phase10_city_dashboard_initialized: 'true',
      app_data_people: JSON.stringify([{ id: 'stale-person' }]),
      app_data_housing_history: JSON.stringify([{ id: 'stale-history', period: '2020-01 ~ 2020-02' }]),
    });
    stubFallbackBrowser(storage);

    const { db } = await import('./db');

    expect(storage.getItem('app_data_v16_demographics_migration_initialized')).toBe('true');
    expect(db.getPeople().some((person) => person.id === 'stale-person')).toBe(false);
    expect(db.getPeople().some((person) => person.type === '留守')).toBe(true);
    expect(db.getPeople().some((person) => person.type === '境外')).toBe(true);
    expect(db.getPeople().some((person) => person.tags.includes('严重精神障碍'))).toBe(true);
    expect(db.getPeople().some((person) => person.tags.includes('社区矫正'))).toBe(true);
    expect(db.getHousingHistory().some((history) => history.period.startsWith('2026-07'))).toBe(true);
  });
});
