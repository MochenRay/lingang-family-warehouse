import { afterEach, describe, expect, it, vi } from 'vitest';

import { personRepository } from './personRepository';

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

function installBrowserStorage(storage: Storage): void {
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('window', {
    localStorage: storage,
    location: { hostname: 'localhost' },
    dispatchEvent: vi.fn(),
  });
  vi.stubGlobal('CustomEvent', class {
    constructor(
      public type: string,
      public init?: CustomEventInit,
    ) {}
  });
  vi.stubGlobal('Event', class {
    constructor(public type: string) {}
  });
}

describe('personRepository', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
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

  it('propagates an API mutation failure in auto mode without acknowledging a local write', async () => {
    const storage = createMemoryStorage({ app_data_people: '[]' });
    installBrowserStorage(storage);
    vi.stubEnv('VITE_DATA_MODE', 'auto');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('backend unavailable', { status: 503 })));

    const write = personRepository.addPerson({
      gridId: 'g1',
      name: '测试居民',
      idCard: '3706********1234',
      gender: '男',
      age: 35,
      address: '测试地址',
      type: '户籍',
      tags: [],
      risk: 'Low',
      updatedAt: '2026-07-11 16:00',
    });

    await expect(write).rejects.toThrow('API 503: backend unavailable');
    expect(storage.getItem('app_data_people')).toBe('[]');
  });
});
