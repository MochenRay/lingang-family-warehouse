import { afterEach, describe, expect, it, vi } from 'vitest';

import { personRepository } from './personRepository';

describe('personRepository', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the complete population ledger and exposes the authoritative total', async () => {
    const total = 501;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const limit = Number(url.searchParams.get('limit'));
      const offset = Number(url.searchParams.get('offset'));
      const itemCount = Math.max(0, Math.min(limit, total - offset));

      return new Response(JSON.stringify({
        items: Array.from({ length: itemCount }, (_, index) => ({ id: `person-${offset + index}` })),
        total,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await personRepository.getPeopleList();

    expect(result.total).toBe(501);
    expect(result.items).toHaveLength(501);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([input]) => new URL(String(input)).searchParams.get('offset'))).toEqual([
      '0',
      '500',
    ]);
  });
});
