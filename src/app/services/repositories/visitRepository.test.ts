import { afterEach, describe, expect, it, vi } from 'vitest';

import { visitRepository } from './visitRepository';

describe('visitRepository', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads every visit by default and keeps the server total', async () => {
    const total = 760;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const limit = Number(url.searchParams.get('limit'));
      const offset = Number(url.searchParams.get('offset'));
      const itemCount = Math.max(0, Math.min(limit, total - offset));

      return new Response(JSON.stringify({
        items: Array.from({ length: itemCount }, (_, index) => ({ id: `visit-${offset + index}` })),
        total,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await visitRepository.getVisitsList({ targetType: 'person', order: 'desc' });

    expect(result.total).toBe(760);
    expect(result.items).toHaveLength(760);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([input]) => new URL(String(input)).searchParams.get('offset'))).toEqual([
      '0',
      '500',
    ]);
  });
});
