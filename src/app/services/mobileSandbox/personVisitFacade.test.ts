import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Person, VisitRecord } from '../../types/core';
import {
  activateMobileSandboxModeSession,
  type MobileSandboxModeSession,
} from './mode';
import {
  MobileFacadeTargetNotFoundError,
  personVisitFacade,
} from './personVisitFacade';
import { MobileMutationBlockedError } from './mutation';
import {
  appendMobileSessionTransaction,
  createMobileSessionEvent,
  readMobileSessionEnvelope,
} from './store';
import {
  MOBILE_SANDBOX_STORAGE_KEY,
  type MobileSandboxModeResult,
  type MobileSessionEventV1,
} from './types';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  writeCount = 0;

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    this.writeCount += 1;
    this.values.set(key, value);
  }
}

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: 'person-1',
    gridId: 'grid-1',
    name: '居民甲',
    idCard: '310000199001010001',
    gender: '女',
    age: 36,
    address: '临港新片区一号',
    type: '户籍',
    tags: ['重点关注'],
    risk: 'Medium',
    updatedAt: '2026-07-30 09:00',
    ...overrides,
  };
}

function visit(overrides: Partial<VisitRecord> = {}): VisitRecord {
  return {
    id: 'visit-1',
    targetId: 'person-1',
    targetType: 'person',
    gridId: 'grid-1',
    visitorName: '网格员甲',
    date: '2026-07-30 09:00',
    content: '既有走访记录',
    images: [],
    tags: ['日常走访'],
    ...overrides,
  };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('personVisitFacade', () => {
  let sessionStorage: MemoryStorage;
  let deactivate: (() => void) | undefined;
  let browserEvents: EventTarget;

  function activate(result: MobileSandboxModeResult) {
    const session: MobileSandboxModeSession = {
      resolve: vi.fn().mockResolvedValue(result),
    };
    deactivate = activateMobileSandboxModeSession(session);
  }

  beforeEach(() => {
    sessionStorage = new MemoryStorage();
    browserEvents = new EventTarget();
    vi.stubGlobal('window', {
      location: { hostname: 'localhost' },
      localStorage: new MemoryStorage(),
      sessionStorage,
      addEventListener: browserEvents.addEventListener.bind(browserEvents),
      removeEventListener: browserEvents.removeEventListener.bind(browserEvents),
      dispatchEvent: browserEvents.dispatchEvent.bind(browserEvents),
    });
  });

  afterEach(() => {
    deactivate?.();
    deactivate = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses target-filtered session seeds for the person detail and visit form read chain', async () => {
    activate({ mode: 'session' });
    const currentPerson = person({ houseId: 'house-1' });
    const currentVisit = visit();
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/people/person-1')) {
        return Promise.resolve(json(currentPerson));
      }
      if (url.pathname.endsWith('/people') && url.searchParams.get('houseId') === 'house-1') {
        return Promise.resolve(json({ items: [currentPerson], total: 1 }));
      }
      if (url.pathname.endsWith('/visits') && url.searchParams.get('targetId') === 'person-1') {
        return Promise.resolve(json({ items: [currentVisit], total: 1 }));
      }
      throw new Error(`Unexpected unfiltered mobile seed request: ${url.pathname}${url.search}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(personVisitFacade.getPerson('person-1')).resolves.toEqual(currentPerson);
    await expect(personVisitFacade.listPeople({ houseId: 'house-1', limit: 500 })).resolves.toEqual({
      items: [currentPerson],
      total: 1,
    });
    await expect(personVisitFacade.listVisits({
      targetId: 'person-1',
      targetType: 'person',
      limit: 100,
    })).resolves.toEqual({ items: [currentVisit], total: 1 });

    expect(fetchMock.mock.calls.map((call) => {
      const url = new URL(String(call[0]));
      return `${url.pathname}${url.search}`;
    })).toEqual([
      '/api/people/person-1',
      '/api/people?houseId=house-1&limit=500&offset=0',
      '/api/visits?order=desc&targetId=person-1&targetType=person&limit=500&offset=0',
    ]);
  });

  it('hydrates an updated person omitted by the server filter before local replay', async () => {
    activate({ mode: 'session' });
    const resident = person({ id: 'person-resident', name: '会话原居民' });
    const moving = person({ id: 'person-moving', name: '迁入前居民' });
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/people') && url.searchParams.get('q') === '会话') {
        return Promise.resolve(json({ items: [resident], total: 1 }));
      }
      if (url.pathname.endsWith('/people/person-moving')) {
        return Promise.resolve(json(moving));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const updated = createMobileSessionEvent('person', 'update', moving.id, {
      name: '会话迁入居民',
      updatedAt: '2026-07-31 13:00',
    });
    appendMobileSessionTransaction([updated], sessionStorage);

    const result = await personVisitFacade.listPeople({ q: '会话', limit: 10, offset: 0 });

    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual(['person-moving', 'person-resident']);
    expect(result.items[0]).toMatchObject({ name: '会话迁入居民' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((call) => new URL(String(call[0])).pathname)).toEqual([
      '/api/people',
      '/api/people/person-moving',
    ]);
  });

  it('uses a target-filtered visit seed before replaying a tombstone', async () => {
    activate({ mode: 'session' });
    const targetVisit = visit({ id: 'visit-target', targetId: 'person-target' });
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input));
      expect(url.searchParams.get('targetId')).toBe('person-target');
      return Promise.resolve(json({ items: [targetVisit], total: 1 }));
    });
    vi.stubGlobal('fetch', fetchMock);
    appendMobileSessionTransaction([
      createMobileSessionEvent('visit', 'tombstone', targetVisit.id, null),
    ], sessionStorage);

    const result = await personVisitFacade.listVisits({ targetId: 'person-target' });

    expect(result).toEqual({ items: [], total: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('hydrates an out-of-filter visit tombstone instead of skipping referential validation', async () => {
    activate({ mode: 'session' });
    const visibleVisit = visit({ id: 'visit-visible', targetId: 'person-visible' });
    const hiddenVisit = visit({ id: 'visit-hidden', targetId: 'person-hidden' });
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/visits')) {
        expect(url.searchParams.get('targetId')).toBe('person-visible');
        return Promise.resolve(json({ items: [visibleVisit], total: 1 }));
      }
      if (url.pathname.endsWith('/visits/visit-hidden')) {
        return Promise.resolve(json(hiddenVisit));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    appendMobileSessionTransaction([
      createMobileSessionEvent('visit', 'tombstone', hiddenVisit.id, null),
    ], sessionStorage);

    await expect(personVisitFacade.listVisits({ targetId: 'person-visible' })).resolves.toEqual({
      items: [visibleVisit],
      total: 1,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails the whole projection for an orphan update or a failed API seed', async () => {
    activate({ mode: 'session' });
    const orphan: MobileSessionEventV1 = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      entity: 'person',
      action: 'update',
      targetId: 'missing-person',
      payload: { name: '不得凭空生成' },
      createdAt: '2026-07-31T12:00:00.000Z',
    };
    sessionStorage.setItem(MOBILE_SANDBOX_STORAGE_KEY, JSON.stringify({
      version: 1,
      events: [orphan],
    }));
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/people')) {
        return Promise.resolve(json({ items: [person()], total: 1 }));
      }
      if (url.pathname.endsWith('/people/missing-person')) {
        return Promise.resolve(json({ detail: 'missing' }, 404));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(personVisitFacade.listPeople()).rejects.toBeInstanceOf(MobileFacadeTargetNotFoundError);

    fetchMock.mockRejectedValueOnce(new TypeError('seed network down'));
    await expect(personVisitFacade.listPeople()).rejects.toThrow('seed network down');
  });

  it('writes visit create and person updatedAt in one session transaction', async () => {
    activate({ mode: 'session' });
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const pathname = new URL(String(input)).pathname;
      if (pathname.endsWith('/people/person-1')) {
        return Promise.resolve(json(person()));
      }
      if (pathname.endsWith('/people')) {
        return Promise.resolve(json({ items: [person()], total: 1 }));
      }
      if (pathname.endsWith('/visits')) {
        return Promise.resolve(json({ items: [visit()], total: 1 }));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    sessionStorage.writeCount = 0;

    const saved = await personVisitFacade.createPersonVisit('person-1', {
      visitorName: '网格员乙',
      date: '2026-07-31 14:00',
      content: '本次会话走访',
      images: [],
      tags: ['日常走访'],
    });

    expect(sessionStorage.writeCount).toBe(1);
    expect(fetchMock.mock.calls.every((call) => (call[1] as RequestInit | undefined)?.method === undefined)).toBe(true);
    expect(saved.visit).toMatchObject({
      targetId: 'person-1',
      targetType: 'person',
      gridId: 'grid-1',
      date: '2026-07-31 14:00',
    });
    expect(saved.person.updatedAt).toBe(saved.visit.date);
    const envelope = readMobileSessionEnvelope(sessionStorage);
    expect(envelope.events).toHaveLength(2);
    expect(envelope.events.map((event) => `${event.entity}/${event.action}`)).toEqual([
      'visit/create',
      'person/update',
    ]);
    expect(envelope.events[1]).toMatchObject({
      targetId: 'person-1',
      payload: { updatedAt: saved.visit.date },
    });

    const history = await personVisitFacade.listVisits({ targetId: 'person-1' });
    expect(history.total).toBe(2);
    expect(history.items[0].id).toBe(saved.visit.id);
  });

  it('does not persist after the originating session mount expires during seed loading', async () => {
    activate({ mode: 'session' });
    let resolveSeed!: (response: Response) => void;
    let markSeedStarted!: () => void;
    const seedStarted = new Promise<void>((resolve) => { markSeedStarted = resolve; });
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      markSeedStarted();
      return new Promise<Response>((resolve) => { resolveSeed = resolve; });
    }));

    const pending = personVisitFacade.createPersonVisit('person-1', {
      visitorName: '网格员乙',
      date: '2026-07-31 14:30',
      content: '过期 mount 不得落盘',
    });
    await seedStarted;
    deactivate?.();
    deactivate = undefined;
    activate({ mode: 'api' });
    resolveSeed(json(person()));

    await expect(pending).rejects.toEqual(new MobileMutationBlockedError('mode-session-expired'));
    expect(sessionStorage.writeCount).toBe(0);
  });

  it('rejects a missing session person without writing an event', async () => {
    activate({ mode: 'session' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ detail: 'missing' }, 404)));

    await expect(personVisitFacade.updatePerson('missing-person', { name: '不存在' })).rejects.toBeInstanceOf(
      MobileFacadeTargetNotFoundError,
    );
    expect(sessionStorage.writeCount).toBe(0);
  });

  it.each([401, 403, 404, 409, 422, 429, 500])(
    'never turns an API %i visit failure into a session success',
    async (status) => {
      activate({ mode: 'api' });
      const apiError = new Error(`API ${status}`);
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(json(person()))
        .mockRejectedValueOnce(apiError);
      vi.stubGlobal('fetch', fetchMock);

      await expect(personVisitFacade.createPersonVisit('person-1', {
        visitorName: '网格员甲',
        date: '2026-07-31 15:00',
        content: '不得降级成功',
      })).rejects.toBe(apiError);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe('POST');
      expect(sessionStorage.getItem(MOBILE_SANDBOX_STORAGE_KEY)).toBeNull();
      deactivate?.();
      deactivate = undefined;
    },
  );

  it('never turns an API network failure into a session success', async () => {
    activate({ mode: 'api' });
    const networkError = new TypeError('visit network down');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(person()))
      .mockRejectedValueOnce(networkError);
    vi.stubGlobal('fetch', fetchMock);

    await expect(personVisitFacade.createPersonVisit('person-1', {
      visitorName: '网格员甲',
      date: '2026-07-31 15:30',
      content: '网络错误不得降级',
    })).rejects.toBe(networkError);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem(MOBILE_SANDBOX_STORAGE_KEY)).toBeNull();
  });

  it('uses only the API endpoint in enabled mode and never writes session storage', async () => {
    activate({ mode: 'api' });
    const createdVisit = visit({ id: 'visit-api', date: '2026-07-31 16:00' });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(person()))
      .mockResolvedValueOnce(json(createdVisit));
    vi.stubGlobal('fetch', fetchMock);

    const saved = await personVisitFacade.createPersonVisit('person-1', {
      visitorName: createdVisit.visitorName,
      date: createdVisit.date,
      content: createdVisit.content,
    });

    const post = fetchMock.mock.calls[1];
    expect(String(post[0])).toContain('/people/person-1/visits');
    expect(post[1]).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String((post[1] as RequestInit).body))).toMatchObject({
      gridId: 'grid-1',
      visitorName: createdVisit.visitorName,
    });
    expect(saved.person.updatedAt).toBe(createdVisit.date);
    expect(sessionStorage.writeCount).toBe(0);
  });

  it('blocks object-grounded AI for a session-created person without an AI request', async () => {
    activate({ mode: 'session' });
    const fetchMock = vi.fn().mockResolvedValue(json({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);
    const created = await personVisitFacade.createPerson({
      gridId: 'grid-1',
      name: '会话新居民',
      idCard: '310000199001010009',
      gender: '女',
      age: 30,
      address: '临港新片区三号',
      type: '户籍',
      tags: [],
      risk: 'Low',
      updatedAt: '2026-07-31 16:00',
    });

    const outline = await personVisitFacade.requestVisitOutline(created.id);

    expect(outline).toEqual({
      allowed: false,
      policy: {
        allowed: false,
        reason: 'session-person',
        disclosure: '会话中新建人员暂不支持对象化 AI；可先手工填写并保存走访记录。',
      },
    });
    expect(fetchMock.mock.calls.every((call) => !String(call[0]).includes('/ai/'))).toBe(true);
  });

  it('keeps edited session fields out of the server-grounded AI context', async () => {
    activate({ mode: 'session' });
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const pathname = new URL(String(input)).pathname;
      if (pathname.endsWith('/people/person-1')) {
        return Promise.resolve(json(person()));
      }
      if (pathname.endsWith('/people')) {
        return Promise.resolve(json({ items: [person()], total: 1 }));
      }
      if (pathname.endsWith('/ai/chat')) {
        const body = JSON.parse(String(init?.body));
        expect(body).toMatchObject({
          kind: 'writing',
          agent_type: 'assistant',
          context_id: 'person-1',
        });
        expect(String(body.message)).not.toContain('会话改名');
        return Promise.resolve(json({
          status: 'live',
          agent_type: 'assistant',
          kind: 'writing',
          content: '真实对象化提纲',
          provider: 'gemini',
          model: 'gemini-test',
          context_applied: true,
          used_fallback_model: false,
        }));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    appendMobileSessionTransaction([
      createMobileSessionEvent('person', 'update', 'person-1', { name: '会话改名' }),
    ], sessionStorage);

    const outline = await personVisitFacade.requestVisitOutline('person-1');

    expect(outline.allowed).toBe(true);
    if (outline.allowed) {
      expect(outline.grounded).toBe(true);
      expect(outline.policy).toMatchObject({
        sessionOverlayExcluded: true,
        disclosure: 'AI 提纲基于服务器原始档案，不包含本次浏览会话中的修改。',
      });
    }
  });

  it('keeps degraded AI truthful instead of marking it grounded', async () => {
    activate({ mode: 'api' });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(json(person()))
      .mockRejectedValueOnce(new TypeError('AI network down')));

    const outline = await personVisitFacade.requestVisitOutline('person-1');

    expect(outline.allowed).toBe(true);
    if (outline.allowed) {
      expect(outline.result.status).toBe('degraded');
      expect(outline.grounded).toBe(false);
      expect(outline.policy.disclosure).toBe('AI 提纲基于服务器档案。');
    }
    expect(warning).toHaveBeenCalledOnce();
  });

  it('rejects invalid pagination before making an API request', async () => {
    activate({ mode: 'api' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(personVisitFacade.listPeople({ limit: 0 })).rejects.toBeInstanceOf(RangeError);
    await expect(personVisitFacade.listVisits({ offset: -1 })).rejects.toBeInstanceOf(RangeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('subscribes only to the mobile session change event', () => {
    const listener = vi.fn();
    const unsubscribe = personVisitFacade.subscribe(listener);

    browserEvents.dispatchEvent(new Event('db-change'));
    expect(listener).not.toHaveBeenCalled();
    browserEvents.dispatchEvent(new Event('mobile-session-change'));
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    browserEvents.dispatchEvent(new Event('mobile-session-change'));
    expect(listener).toHaveBeenCalledOnce();
  });
});
