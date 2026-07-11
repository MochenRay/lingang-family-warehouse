import { describe, expect, it, vi } from 'vitest';

import { fetchAllListPages } from './api';

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
