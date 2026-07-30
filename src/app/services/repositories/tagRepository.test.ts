import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  millisecondsUntilNextShanghaiMidnight,
  tagRepository,
  type CreateTagInput,
} from './tagRepository';

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

function installBrowserStorage() {
  const localStorage = createMemoryStorage();
  const sessionStorage = createMemoryStorage();
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('sessionStorage', sessionStorage);
  vi.stubGlobal('window', {
    localStorage,
    sessionStorage,
    location: { hostname: 'localhost' },
    dispatchEvent: vi.fn(),
  });
  vi.stubGlobal('CustomEvent', class {
    constructor(
      public type: string,
      public init?: CustomEventInit,
    ) {}
  });
  return { localStorage, sessionStorage };
}

const ORDINARY_TAG: CreateTagInput = {
  name: '测试普通标签',
  type: 'ordinary',
  description: '仅用于验证普通标签创建请求。',
  category: '测试分类',
  riskLevel: 'Medium',
  conditions: [],
};

describe('tagRepository', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('stores the dedicated write token in sessionStorage only', () => {
    const { localStorage, sessionStorage } = installBrowserStorage();

    tagRepository.storeWriteToken('tag-secret');

    expect(sessionStorage.getItem('homedata.tag_write_token')).toBe('tag-secret');
    expect(localStorage.getItem('homedata.tag_write_token')).toBeNull();
    expect(tagRepository.getStoredWriteToken()).toBe('tag-secret');

    tagRepository.clearWriteToken();
    expect(sessionStorage.getItem('homedata.tag_write_token')).toBeNull();
  });

  it('sends the dedicated token header and adapts the created tag response', async () => {
    installBrowserStorage();
    vi.stubEnv('VITE_DATA_MODE', 'api');
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => new Response(JSON.stringify({
      id: 'tag_created',
      name: ORDINARY_TAG.name,
      type: 'ordinary',
      description: ORDINARY_TAG.description,
      category: ORDINARY_TAG.category,
      riskLevel: ORDINARY_TAG.riskLevel,
      status: 'enabled',
      conditions: [],
      isSystem: false,
      createdBy: '标签管理员',
      createdAt: '2026-07-30T08:00:00+08:00',
      updatedAt: '2026-07-30T08:00:00+08:00',
      coverageCount: 0,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const created = await tagRepository.createTag(ORDINARY_TAG, 'tag-secret');

    expect(created.type).toBe('普通标签');
    expect(created.status).toBe('启用');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0];
    expect(String(requestUrl)).toBe('http://localhost:8000/api/tags');
    expect(requestInit?.method).toBe('POST');
    expect(requestInit?.headers).toMatchObject({ 'X-Tag-Write-Token': 'tag-secret' });
    expect(JSON.parse(String(requestInit?.body))).toEqual(ORDINARY_TAG);
  });

  it('surfaces a rejected mutation instead of silently writing to fallback data', async () => {
    installBrowserStorage();
    vi.stubEnv('VITE_DATA_MODE', 'auto');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      detail: 'A valid tag administrator token is required.',
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })));

    await expect(tagRepository.createTag(ORDINARY_TAG, 'wrong-token')).rejects.toThrow('API 403');
  });

  it('uses the dedicated token for ordinary tag assignment and removal', async () => {
    installBrowserStorage();
    vi.stubEnv('VITE_DATA_MODE', 'api');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        tagId: 'tag_released_offender',
        personId: 'person-1',
        createdBy: '标签管理员',
        createdAt: '2026-07-30T08:00:00+08:00',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await tagRepository.assignOrdinaryTag('tag_released_offender', 'person-1', 'tag-secret');
    await tagRepository.removeOrdinaryTag('tag_released_offender', 'person-1', 'tag-secret');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'http://localhost:8000/api/tags/tag_released_offender/assignments/person-1',
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PUT',
      headers: { 'X-Tag-Write-Token': 'tag-secret' },
    });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'DELETE',
      headers: { 'X-Tag-Write-Token': 'tag-secret' },
    });
  });

  it('calculates the next refresh against Shanghai midnight', () => {
    const now = new Date('2026-07-30T15:59:30.000Z');

    expect(millisecondsUntilNextShanghaiMidnight(now)).toBe(30_000);
  });
});
