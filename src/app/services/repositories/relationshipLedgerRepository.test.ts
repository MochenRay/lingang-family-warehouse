import { afterEach, describe, expect, it, vi } from 'vitest';

import { relationshipLedgerRepository } from './relationshipLedgerRepository';

function listResponse(total: number, url: URL, prefix: string) {
  const limit = Number(url.searchParams.get('limit'));
  const offset = Number(url.searchParams.get('offset'));
  const itemCount = Math.max(0, Math.min(limit, total - offset));

  return new Response(JSON.stringify({
    items: Array.from({ length: itemCount }, (_, index) => ({ id: `${prefix}-${offset + index}` })),
    total,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('relationshipLedgerRepository', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads a full relationship snapshot in no more than ten business requests', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/houses/history-records')) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.pathname.endsWith('/people')) {
        return listResponse(1917, url, 'person');
      }
      if (url.pathname.endsWith('/houses')) {
        return listResponse(788, url, 'house');
      }
      return new Response('not found', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const snapshot = await relationshipLedgerRepository.getSnapshot();

    expect(snapshot.people).toHaveLength(1917);
    expect(snapshot.houses).toHaveLength(788);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(10);

    const urls = fetchMock.mock.calls.map(([input]) => new URL(String(input)));
    expect(urls.filter((url) => url.pathname.endsWith('/houses/history-records'))).toHaveLength(1);
    expect(urls.some((url) => /\/houses\/[^/]+\/history$/.test(url.pathname))).toBe(false);
  });
});
