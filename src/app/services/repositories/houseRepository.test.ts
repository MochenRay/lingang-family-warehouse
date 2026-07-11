import { afterEach, describe, expect, it, vi } from 'vitest';

import { houseRepository } from './houseRepository';

describe('houseRepository', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the complete housing ledger and exposes the authoritative total', async () => {
    const total = 788;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const limit = Number(url.searchParams.get('limit'));
      const offset = Number(url.searchParams.get('offset'));
      const itemCount = Math.max(0, Math.min(limit, total - offset));

      return new Response(JSON.stringify({
        items: Array.from({ length: itemCount }, (_, index) => ({ id: `house-${offset + index}` })),
        total,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await houseRepository.getHousesList();

    expect(result.total).toBe(788);
    expect(result.items).toHaveLength(788);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([input]) => new URL(String(input)).searchParams.get('offset'))).toEqual([
      '0',
      '500',
    ]);
  });

  it('loads housing history through the largest supported bulk read', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const limit = Number(url.searchParams.get('limit'));
      const itemCount = Math.min(limit, 1_500);

      return new Response(JSON.stringify(
        Array.from({ length: itemCount }, (_, index) => ({ id: `history-${index}` })),
      ), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const history = await houseRepository.getHousingHistoryRecords();

    expect(history).toHaveLength(1_500);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
