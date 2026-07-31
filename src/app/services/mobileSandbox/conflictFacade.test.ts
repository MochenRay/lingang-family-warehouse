import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConflictRecord, House, Person, VisitRecord } from '../../types/core';
import {
  activateMobileSandboxModeSession,
  type MobileSandboxModeSession,
} from './mode';
import {
  conflictFacade,
  MobileConflictFacadeTargetNotFoundError,
} from './conflictFacade';
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
import type { MobileConflictCreatePayload } from './conflictPayloads';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  failWrites = false;
  writeCount = 0;

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException('full', 'QuotaExceededError');
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
    address: '海梦苑一号楼',
    houseId: 'house-1',
    type: '户籍',
    tags: [],
    risk: 'Medium',
    updatedAt: '2026-07-30 09:00',
    ...overrides,
  };
}

function house(overrides: Partial<House> = {}): House {
  return {
    id: 'house-1',
    gridId: 'grid-1',
    address: '海梦苑一号楼101室',
    communityName: '海梦苑',
    building: '一号楼',
    unit: '一单元',
    room: '101',
    ownerName: '居民甲',
    area: '89',
    type: '出租',
    memberCount: 1,
    tags: [],
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
    content: '服务器走访记录',
    images: [],
    tags: [],
    ...overrides,
  };
}

function conflictPayload(
  overrides: Partial<MobileConflictCreatePayload> = {},
): MobileConflictCreatePayload {
  return {
    source: '自行发现',
    title: '物业噪音协调',
    type: '物业纠纷',
    description: '物业夜间施工影响居民休息。',
    involvedParties: [
      { type: 'organization', id: 'org-property', name: '物业公司' },
    ],
    status: '调解中',
    gridId: 'grid-1',
    location: '海梦苑一号楼',
    timeline: [
      { date: '2026-08-01 09:00', content: '收到线索', operator: '网格员甲' },
    ],
    images: [],
    createdAt: '2026-08-01 09:00',
    updatedAt: '2026-08-01 09:00',
    ...overrides,
  };
}

function conflict(overrides: Partial<ConflictRecord> = {}): ConflictRecord {
  return { id: 'conflict-1', ...conflictPayload(), ...overrides };
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('conflictFacade', () => {
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

  it('waits for checking to resolve and fails closed without a business request', async () => {
    let resolveMode!: (value: MobileSandboxModeResult) => void;
    const session: MobileSandboxModeSession = {
      resolve: () => new Promise((resolve) => { resolveMode = resolve; }),
    };
    deactivate = activateMobileSandboxModeSession(session);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const pending = conflictFacade.listConflicts();
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
    resolveMode({ mode: 'blocked', reason: 'health-unavailable' });

    await expect(pending).rejects.toThrow('health-unavailable');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(MOBILE_SANDBOX_STORAGE_KEY)).toBeNull();
  });

  it('blocks token mode mutations before fetch or session persistence', async () => {
    activate({ mode: 'blocked', reason: 'token-mode' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(conflictFacade.createConflict(conflictPayload())).rejects.toEqual(
      new MobileMutationBlockedError('token-mode'),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(MOBILE_SANDBOX_STORAGE_KEY)).toBeNull();
  });

  it('loads every API seed page before replaying, filtering, sorting, and paginating', async () => {
    activate({ mode: 'session' });
    const seed = Array.from({ length: 501 }, (_value, index) => conflict({
      id: `conflict-${String(index).padStart(3, '0')}`,
      title: `既有纠纷${index}`,
      updatedAt: '2026-07-30 09:00',
    }));
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const offset = Number(url.searchParams.get('offset'));
      const limit = Number(url.searchParams.get('limit'));
      return Promise.resolve(json({ items: seed.slice(offset, offset + limit), total: seed.length }));
    });
    vi.stubGlobal('fetch', fetchMock);
    appendMobileSessionTransaction([
      createMobileSessionEvent('conflict', 'update', 'conflict-500', {
        timeline: [
          { date: '2026-08-01 12:00', content: '会话跟进', operator: '网格员乙' },
        ],
        updatedAt: '2026-08-01 12:00',
      }),
    ], sessionStorage);

    const result = await conflictFacade.listConflicts({ limit: 1, offset: 0 });

    expect(result.items).toEqual([
      expect.objectContaining({ id: 'conflict-500', updatedAt: '2026-08-01 12:00' }),
    ]);
    expect(result.total).toBe(501);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((call) => new URL(String(call[0])).searchParams.get('offset'))).toEqual([
      '0',
      '500',
    ]);
  });

  it('creates a session conflict and rebuilds temp detail/context from merged local entities', async () => {
    activate({ mode: 'session' });
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      expect(init?.method).toBeUndefined();
      if (url.pathname.endsWith('/conflicts')) {
        return Promise.resolve(json({ items: [], total: 0 }));
      }
      if (url.pathname.endsWith('/people')) {
        return Promise.resolve(json({ items: [person()], total: 1 }));
      }
      if (url.pathname.endsWith('/houses')) {
        return Promise.resolve(json({ items: [house()], total: 1 }));
      }
      if (url.pathname.endsWith('/visits')) {
        return Promise.resolve(json({ items: [visit()], total: 1 }));
      }
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    appendMobileSessionTransaction([
      createMobileSessionEvent('person', 'update', 'person-1', {
        name: '会话居民甲',
        updatedAt: '2026-08-01 10:00',
      }),
      createMobileSessionEvent('house', 'update', 'house-1', {
        address: '会话更新地址',
      }),
      createMobileSessionEvent('visit', 'create', '', {
        targetId: 'person-1',
        targetType: 'person',
        gridId: 'grid-1',
        visitorName: '网格员乙',
        date: '2026-08-01 11:00',
        content: '会话走访记录',
        images: [],
        tags: [],
      }),
    ], sessionStorage);
    sessionStorage.writeCount = 0;

    const created = await conflictFacade.createConflict(conflictPayload({
      involvedParties: [{ type: 'resident', id: 'person-1', name: '会话居民甲' }],
      location: '会话更新地址',
    }));
    expect(created.id).toMatch(/^session:conflict:[0-9a-f-]{36}$/i);
    expect(sessionStorage.writeCount).toBe(1);

    deactivate?.();
    deactivate = undefined;
    activate({ mode: 'session' });

    const listed = await conflictFacade.listConflicts();
    const detail = await conflictFacade.getConflictDetail(created.id);

    expect(listed.items).toContainEqual(expect.objectContaining({ id: created.id }));
    expect(detail?.conflict).toMatchObject({ id: created.id, location: '会话更新地址' });
    expect(detail?.context.relatedPeople).toContainEqual(expect.objectContaining({
      id: 'person-1',
      name: '会话居民甲',
    }));
    expect(detail?.context.relatedHouse).toMatchObject({ id: 'house-1', address: '会话更新地址' });
    expect(detail?.context.recentVisits[0]).toMatchObject({ content: '会话走访记录' });
    expect(fetchMock.mock.calls.every((call) => !String(call[0]).includes(created.id))).toBe(true);
    expect(fetchMock.mock.calls.every((call) => (call[1] as RequestInit | undefined)?.method === undefined)).toBe(true);
  });

  it('fails closed when session persistence is unavailable', async () => {
    activate({ mode: 'session' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    sessionStorage.failWrites = true;

    await expect(conflictFacade.createConflict(conflictPayload())).rejects.toThrow(
      'Unable to persist mobile session data',
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sessionStorage.writeCount).toBe(0);
    sessionStorage.failWrites = false;
    expect(sessionStorage.getItem(MOBILE_SANDBOX_STORAGE_KEY)).toBeNull();
  });

  it('adds progress and resolves a session conflict atomically, then reads the same projection', async () => {
    activate({ mode: 'session' });
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => (
      Promise.resolve(json({ items: [conflict()], total: 1 }))
    )));
    sessionStorage.writeCount = 0;

    const progressed = await conflictFacade.addProgress('conflict-1', {
      date: '2026-08-01 12:00',
      content: '双方完成首次协商',
      operator: '网格员乙',
    });
    const writesAfterProgress = sessionStorage.writeCount;
    const resolved = await conflictFacade.markResolved('conflict-1', {
      date: '2026-08-01 13:00',
      content: '网格员标记该纠纷已化解',
      operator: '网格员乙',
    });

    expect(writesAfterProgress).toBe(1);
    expect(sessionStorage.writeCount).toBe(2);
    expect(progressed.timeline[progressed.timeline.length - 1]?.content).toBe('双方完成首次协商');
    expect(resolved).toMatchObject({ status: '已化解', updatedAt: '2026-08-01 13:00' });
    expect(resolved.timeline[resolved.timeline.length - 1]?.content).toBe('网格员标记该纠纷已化解');
    const events = readMobileSessionEnvelope(sessionStorage).events;
    expect(events.map((event) => `${event.entity}/${event.action}`)).toEqual([
      'conflict/update',
      'conflict/status',
      'conflict/update',
    ]);
  });

  it('rejects an orphan session partial update without persisting', async () => {
    activate({ mode: 'session' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ items: [conflict()], total: 1 })));
    sessionStorage.writeCount = 0;

    await expect(conflictFacade.addProgress('missing-conflict', {
      date: '2026-08-01 12:00',
      content: '不得凭空创建',
      operator: '网格员甲',
    })).rejects.toBeInstanceOf(MobileConflictFacadeTargetNotFoundError);
    expect(sessionStorage.writeCount).toBe(0);
  });

  it('does not persist a partial update after the originating session mount expires', async () => {
    activate({ mode: 'session' });
    let resolveSeed!: (response: Response) => void;
    let markSeedStarted!: () => void;
    const seedStarted = new Promise<void>((resolve) => { markSeedStarted = resolve; });
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      markSeedStarted();
      return new Promise<Response>((resolve) => { resolveSeed = resolve; });
    }));
    sessionStorage.writeCount = 0;

    const pending = conflictFacade.addProgress('conflict-1', {
      date: '2026-08-01 12:00',
      content: '过期 mount 不得落盘',
      operator: '网格员甲',
    });
    await seedStarted;
    deactivate?.();
    deactivate = undefined;
    activate({ mode: 'api' });
    resolveSeed(json({ items: [conflict()], total: 1 }));

    await expect(pending).rejects.toEqual(new MobileMutationBlockedError('mode-session-expired'));
    expect(sessionStorage.writeCount).toBe(0);
  });

  it('fails a corrupt orphan overlay instead of manufacturing a conflict', async () => {
    activate({ mode: 'session' });
    const orphan: MobileSessionEventV1 = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      entity: 'conflict',
      action: 'update',
      targetId: 'missing-conflict',
      payload: {
        timeline: [{ date: '2026-08-01', content: '孤儿更新', operator: '网格员甲' }],
        updatedAt: '2026-08-01',
      },
      createdAt: '2026-08-01T12:00:00.000Z',
    };
    sessionStorage.setItem(MOBILE_SANDBOX_STORAGE_KEY, JSON.stringify({ version: 1, events: [orphan] }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ items: [conflict()], total: 1 })));

    await expect(conflictFacade.listConflicts()).rejects.toThrow('Unknown update target');
  });

  it.each([401, 403, 404, 409, 422, 429, 503])(
    'never turns an API %i create failure into session success',
    async (status) => {
      activate({ mode: 'api' });
      const fetchMock = vi.fn().mockResolvedValue(json({ detail: `failure-${status}` }, status));
      vi.stubGlobal('fetch', fetchMock);

      await expect(conflictFacade.createConflict(conflictPayload())).rejects.toThrow(`API ${status}`);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
      expect(sessionStorage.getItem(MOBILE_SANDBOX_STORAGE_KEY)).toBeNull();
      deactivate?.();
      deactivate = undefined;
    },
  );

  it('never turns an API network failure into session success', async () => {
    activate({ mode: 'api' });
    const networkError = new TypeError('conflict network down');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError));

    await expect(conflictFacade.createConflict(conflictPayload())).rejects.toBe(networkError);
    expect(sessionStorage.getItem(MOBILE_SANDBOX_STORAGE_KEY)).toBeNull();
  });

  it('uses canonical conflict API endpoints in enabled mode and never writes session storage', async () => {
    activate({ mode: 'api' });
    const created = conflict({ id: 'conflict-api' });
    const context = {
      relatedPeople: [],
      recentVisits: [],
      followUpStatus: { code: 'active', label: '近期已跟进', detail: '近期已有记录。' },
      suggestedActions: [],
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(created, 201))
      .mockResolvedValueOnce(json(created))
      .mockResolvedValueOnce(json(context));
    vi.stubGlobal('fetch', fetchMock);

    const saved = await conflictFacade.createConflict(conflictPayload());
    const detail = await conflictFacade.getConflictDetail(saved.id);

    expect(saved.id).toBe('conflict-api');
    expect(detail).toEqual({ conflict: created, context });
    expect(String(fetchMock.mock.calls[0][0])).toContain('/conflicts');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    expect(String(fetchMock.mock.calls[1][0])).toContain('/conflicts/conflict-api');
    expect(String(fetchMock.mock.calls[2][0])).toContain('/conflicts/conflict-api/context');
    expect(sessionStorage.writeCount).toBe(0);
  });

  it('never sends a session conflict ID to enabled detail, context, or mutation endpoints', async () => {
    activate({ mode: 'api' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const tempId = 'session:conflict:33333333-3333-4333-8333-333333333333';

    await expect(conflictFacade.getConflict(tempId)).resolves.toBeUndefined();
    await expect(conflictFacade.getConflictDetail(tempId)).resolves.toBeUndefined();
    await expect(conflictFacade.getConflictContext(tempId)).rejects.toBeInstanceOf(
      MobileConflictFacadeTargetNotFoundError,
    );
    await expect(conflictFacade.addProgress(tempId, {
      date: '2026-08-01 12:00',
      content: '不得请求临时 ID',
      operator: '网格员甲',
    })).rejects.toBeInstanceOf(MobileConflictFacadeTargetNotFoundError);
    await expect(conflictFacade.markResolved(tempId, {
      date: '2026-08-01 12:01',
      content: '不得请求临时 ID',
      operator: '网格员甲',
    })).rejects.toBeInstanceOf(MobileConflictFacadeTargetNotFoundError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(MOBILE_SANDBOX_STORAGE_KEY)).toBeNull();
  });

  it('subscribes only to mobile-session-change', () => {
    const listener = vi.fn();
    const unsubscribe = conflictFacade.subscribe(listener);

    browserEvents.dispatchEvent(new Event('db-change'));
    expect(listener).not.toHaveBeenCalled();
    browserEvents.dispatchEvent(new Event('mobile-session-change'));
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    browserEvents.dispatchEvent(new Event('mobile-session-change'));
    expect(listener).toHaveBeenCalledOnce();
  });
});
