import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchAllListPages, getDataMode } from './api';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('getDataMode', () => {
  it('locks explicit env modes and only accepts a persisted choice in auto mode', () => {
    let persistedMode = 'fallback';
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => persistedMode),
      },
    });

    vi.stubEnv('VITE_DATA_MODE', 'api');
    expect(getDataMode()).toBe('api');

    persistedMode = 'api';
    vi.stubEnv('VITE_DATA_MODE', 'fallback');
    expect(getDataMode()).toBe('fallback');

    persistedMode = 'fallback';
    vi.stubEnv('VITE_DATA_MODE', 'auto');
    expect(getDataMode()).toBe('fallback');
  });
});

describe('fetchAllListPages', () => {
  it('returns every item across pages while preserving the server total', async () => {
    const fetchPage = vi.fn(async ({ limit, offset }: { limit: number; offset: number }) => ({
      items: Array.from(
        { length: Math.min(limit, 5 - offset) },
        (_, index) => ({ id: offset + index + 1 }),
      ),
      total: 5,
    }));

    const result = await fetchAllListPages(fetchPage, { pageSize: 2 });

    expect(result).toEqual({
      items: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      total: 5,
    });
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([
      { limit: 2, offset: 0 },
      { limit: 2, offset: 2 },
      { limit: 2, offset: 4 },
    ]);
  });
});
