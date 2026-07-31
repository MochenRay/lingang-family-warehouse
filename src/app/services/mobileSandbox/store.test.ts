import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MobileSessionStoreError,
  appendMobileSessionTransaction,
  applyMobileSessionEvents,
  readMobileSessionEnvelope,
  resetMobileSession,
} from './store';
import {
  MOBILE_SANDBOX_STORAGE_KEY,
  type MobileSessionEventV1,
} from './types';
import type { MobilePersonCreatePayload } from './personVisitPayloads';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  failReads = false;
  failWrites = false;
  writeCount = 0;

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) {
    if (this.failReads) throw new DOMException('blocked', 'SecurityError');
    return this.values.get(key) ?? null;
  }
  removeItem(key: string) {
    if (this.failWrites) throw new DOMException('blocked', 'SecurityError');
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException('full', 'QuotaExceededError');
    this.writeCount += 1;
    this.values.set(key, value);
  }
}

const PERSON_UUID = '11111111-1111-4111-8111-111111111111';
const PERSON_TEMP_ID = `session:person:${PERSON_UUID}`;

function personPayload(): MobilePersonCreatePayload {
  return {
    gridId: 'grid-1',
    name: '测试居民',
    idCard: '310000199001010001',
    gender: '女',
    age: 36,
    address: '临港新片区',
    type: '户籍',
    tags: [],
    risk: 'Low',
    updatedAt: '2026-07-31T12:00:00.000Z',
  };
}

function event(overrides: Partial<MobileSessionEventV1> = {}): MobileSessionEventV1 {
  const result: MobileSessionEventV1 = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    entity: 'person',
    action: 'create',
    targetId: PERSON_TEMP_ID,
    tempId: PERSON_TEMP_ID,
    payload: personPayload(),
    createdAt: '2026-07-31T12:00:00.000Z',
    ...overrides,
  };
  if (result.action !== 'create' && overrides.tempId === undefined) {
    delete result.tempId;
  }
  return result;
}

describe('mobile session store', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('persists a validated transaction atomically', () => {
    const saved = appendMobileSessionTransaction([event()], storage);

    expect(saved.events).toHaveLength(1);
    expect(readMobileSessionEnvelope(storage)).toEqual(saved);
  });

  it('fails closed for corrupt JSON and unsupported events', () => {
    storage.setItem(MOBILE_SANDBOX_STORAGE_KEY, '{bad-json');
    expect(() => readMobileSessionEnvelope(storage)).toThrow(MobileSessionStoreError);

    storage.clear();
    expect(() => appendMobileSessionTransaction([
      event({ action: 'status' }),
    ], storage)).toThrow('Unsupported mobile session event');
  });

  it.each([
    ['an empty stored value', ''],
    ['an unsupported version', JSON.stringify({ version: 2, events: [] })],
    ['an extra envelope key', JSON.stringify({ version: 1, events: [], extra: true })],
    ['an extra event key', JSON.stringify({
      version: 1,
      events: [{ ...event(), extra: true }],
    })],
  ])('rejects %s instead of partially accepting the envelope', (_label, raw) => {
    storage.setItem(MOBILE_SANDBOX_STORAGE_KEY, raw);

    expect(() => readMobileSessionEnvelope(storage)).toThrow(MobileSessionStoreError);
  });

  it.each([
    ['non-UUID event id', { id: 'event-1' }],
    ['non-UUID temp id', {
      targetId: 'session:person:not-a-uuid',
      tempId: 'session:person:not-a-uuid',
    }],
    ['temp id for another entity', {
      targetId: 'session:house:22222222-2222-4222-8222-222222222222',
      tempId: 'session:house:22222222-2222-4222-8222-222222222222',
    }],
    ['mismatched create target and temp id', {
      targetId: PERSON_TEMP_ID,
      tempId: 'session:person:22222222-2222-4222-8222-222222222222',
    }],
    ['date-only timestamp', { createdAt: '2026-07-31' }],
    ['non-normalized ISO timestamp', { createdAt: '2026-07-31T12:00:00Z' }],
  ])('rejects %s', (_label, overrides) => {
    expect(() => appendMobileSessionTransaction([
      event(overrides),
    ], storage)).toThrow(MobileSessionStoreError);
  });

  it('rejects invalid target identifiers for non-create events', () => {
    expect(() => appendMobileSessionTransaction([
      event({ action: 'update', targetId: '  ', tempId: undefined, payload: { name: '更新' } }),
    ], storage)).toThrow('targetId');

    expect(() => appendMobileSessionTransaction([
      event({
        action: 'update',
        targetId: 'session:house:22222222-2222-4222-8222-222222222222',
        tempId: undefined,
        payload: { name: '跨实体更新' },
      }),
    ], storage)).toThrow('target');
  });

  it('enforces strict payload shapes for create, update, status and tombstone', () => {
    expect(() => appendMobileSessionTransaction([
      event({ payload: {} }),
    ], storage)).toThrow('create payload');

    expect(() => appendMobileSessionTransaction([
      event({
        action: 'update',
        targetId: 'person-1',
        tempId: undefined,
        payload: { name: undefined },
      }),
    ], storage)).toThrow('mobile person/update payload');

    expect(() => appendMobileSessionTransaction([
      event({
        entity: 'conflict',
        action: 'status',
        targetId: 'conflict-1',
        tempId: undefined,
        payload: { status: 2 },
      }),
    ], storage)).toThrow('status payload');

    expect(() => appendMobileSessionTransaction([
      event({
        entity: 'conflict',
        action: 'status',
        targetId: 'conflict-1',
        tempId: undefined,
        payload: { status: '调解中', title: '不应混入普通更新' },
      }),
    ], storage)).toThrow('status payload');

    expect(() => appendMobileSessionTransaction([
      event({
        action: 'tombstone',
        targetId: 'person-1',
        tempId: undefined,
        payload: {},
      }),
    ], storage)).toThrow('tombstone payload');
  });

  it('uses exact person and visit payload validators before persisting', () => {
    expect(() => appendMobileSessionTransaction([
      event({ payload: { ...personPayload(), extra: true } }),
    ], storage)).toThrow(MobileSessionStoreError);

    expect(() => appendMobileSessionTransaction([
      event({
        action: 'update',
        targetId: 'person-1',
        tempId: undefined,
        payload: { age: 37 },
      }),
    ], storage)).toThrow(MobileSessionStoreError);

    const visitTempId = 'session:visit:22222222-2222-4222-8222-222222222222';
    expect(() => appendMobileSessionTransaction([
      event({
        entity: 'visit',
        targetId: visitTempId,
        tempId: visitTempId,
        payload: {
          targetId: 'house-1',
          targetType: 'house',
          gridId: 'grid-1',
          visitorName: '网格员',
          date: '2026-07-31 12:00',
          content: '走访记录',
        },
      }),
    ], storage)).toThrow(MobileSessionStoreError);

    expect(storage.writeCount).toBe(0);
  });

  it('rejects payload actions that are incompatible with the entity', () => {
    expect(() => appendMobileSessionTransaction([
      event({
        entity: 'quickNote',
        action: 'status',
        targetId: 'note-1',
        tempId: undefined,
        payload: { status: '完成' },
      }),
    ], storage)).toThrow('Unsupported mobile session event');
  });

  it('does not write or emit when the stored envelope fails whole-package validation', () => {
    storage.setItem(MOBILE_SANDBOX_STORAGE_KEY, JSON.stringify({
      version: 1,
      events: [event({ payload: {} })],
    }));
    const writesBeforeAppend = storage.writeCount;
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });

    expect(() => appendMobileSessionTransaction([
      event({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }),
    ], storage)).toThrow(MobileSessionStoreError);

    expect(storage.writeCount).toBe(writesBeforeAppend);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('does not write or emit when reading session storage throws', () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });
    storage.failReads = true;

    expect(() => appendMobileSessionTransaction([event()], storage)).toThrow(
      'Mobile session storage is unavailable',
    );

    expect(storage.writeCount).toBe(0);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('does not emit or replace prior data when storage writes fail', () => {
    const first = appendMobileSessionTransaction([event()], storage);
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });
    storage.failWrites = true;

    expect(() => appendMobileSessionTransaction([
      event({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        targetId: 'session:person:22222222-2222-4222-8222-222222222222',
        tempId: 'session:person:22222222-2222-4222-8222-222222222222',
      }),
    ], storage)).toThrow('Unable to persist mobile session data');

    storage.failWrites = false;
    expect(readMobileSessionEnvelope(storage)).toEqual(first);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('rejects a duplicate create target across transactions', () => {
    appendMobileSessionTransaction([event()], storage);

    expect(() => appendMobileSessionTransaction([
      event({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }),
    ], storage)).toThrow('Duplicate mobile session create target');
  });

  it('rejects stored envelopes with duplicate event ids or create targets', () => {
    storage.setItem(MOBILE_SANDBOX_STORAGE_KEY, JSON.stringify({
      version: 1,
      events: [event(), event()],
    }));
    expect(() => readMobileSessionEnvelope(storage)).toThrow('Duplicate mobile session event id');

    storage.setItem(MOBILE_SANDBOX_STORAGE_KEY, JSON.stringify({
      version: 1,
      events: [event(), event({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' })],
    }));
    expect(() => readMobileSessionEnvelope(storage)).toThrow('Duplicate mobile session create target');
  });

  it('resets only the mobile sandbox key', () => {
    storage.setItem(MOBILE_SANDBOX_STORAGE_KEY, JSON.stringify({ version: 1, events: [] }));
    storage.setItem('homedata.tag_write_token', 'preserve-me');

    resetMobileSession(storage);

    expect(storage.getItem(MOBILE_SANDBOX_STORAGE_KEY)).toBeNull();
    expect(storage.getItem('homedata.tag_write_token')).toBe('preserve-me');
  });

  it('replays create, update, status and tombstone without inventing targets', () => {
    const events: MobileSessionEventV1[] = [
      event({ entity: 'conflict', targetId: 'session:conflict:33333333-3333-4333-8333-333333333333', tempId: 'session:conflict:33333333-3333-4333-8333-333333333333', payload: { title: '新线索', status: '待处理' } }),
      event({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', entity: 'conflict', action: 'update', targetId: 'seed-1', tempId: undefined, payload: { title: '已更新' } }),
      event({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', entity: 'conflict', action: 'status', targetId: 'session:conflict:33333333-3333-4333-8333-333333333333', tempId: undefined, payload: { status: '调解中' } }),
      event({ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', entity: 'conflict', action: 'tombstone', targetId: 'seed-2', tempId: undefined, payload: null }),
    ];

    expect(applyMobileSessionEvents([
      { id: 'seed-1', title: '原题', status: '待处理' },
      { id: 'seed-2', title: '删除项', status: '待处理' },
    ], 'conflict', events)).toEqual([
      { id: 'seed-1', title: '已更新', status: '待处理' },
      { id: 'session:conflict:33333333-3333-4333-8333-333333333333', title: '新线索', status: '调解中' },
    ]);

    expect(() => applyMobileSessionEvents([], 'conflict', [
      event({ entity: 'conflict', action: 'update', targetId: 'missing', tempId: undefined, payload: { title: '禁止凭空创建' } }),
    ])).toThrow('Unknown update target');
  });
});
