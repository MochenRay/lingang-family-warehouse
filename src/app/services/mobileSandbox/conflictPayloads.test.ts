import { describe, expect, it } from 'vitest';
import type { ConflictRecord } from '../../types/core';
import {
  assertMobileConflictCreatePayload,
  assertMobileConflictStatusPayload,
  assertMobileConflictUpdatePayload,
  ConflictPayloadValidationError,
  type MobileConflictCreatePayload,
} from './conflictPayloads';

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

describe('mobile conflict payload contract', () => {
  it('accepts an organization as the only involved party', () => {
    expect(() => assertMobileConflictCreatePayload(conflictPayload())).not.toThrow();
  });

  it.each([
    ['missing parties', { involvedParties: [] }],
    ['blank grid', { gridId: '   ' }],
    ['blank location', { location: '' }],
    ['invalid source', { source: '系统生成' }],
    ['invalid type', { type: '消防隐患' }],
    ['invalid status', { status: '待处理' }],
  ] as Array<[string, Partial<ConflictRecord>]>)('rejects %s', (_label, overrides) => {
    expect(() => assertMobileConflictCreatePayload(conflictPayload(overrides))).toThrow(
      ConflictPayloadValidationError,
    );
  });

  it('rejects duplicate parties and unknown payload keys', () => {
    const duplicated = conflictPayload({
      involvedParties: [
        { type: 'organization', id: 'org-property', name: '物业公司' },
        { type: 'organization', id: 'org-property', name: '物业公司' },
      ],
    });
    expect(() => assertMobileConflictCreatePayload(duplicated)).toThrow('duplicate party');

    expect(() => assertMobileConflictCreatePayload({
      ...conflictPayload(),
      fallbackGridId: 'g1',
    })).toThrow('keys');
  });

  it('rejects sparse arrays and nested extra keys', () => {
    const sparseImages = new Array<string>(1);
    expect(() => assertMobileConflictCreatePayload(conflictPayload({ images: sparseImages }))).toThrow(
      ConflictPayloadValidationError,
    );
    expect(() => assertMobileConflictCreatePayload(conflictPayload({
      involvedParties: [{
        type: 'organization',
        id: 'org-property',
        name: '物业公司',
        fallbackResidentId: 'person-1',
      } as MobileConflictCreatePayload['involvedParties'][number]],
    }))).toThrow('field: involvedParties');
  });

  it('allows only non-empty mutable fields in partial updates', () => {
    expect(() => assertMobileConflictUpdatePayload({
      timeline: [
        { date: '2026-08-01 10:00', content: '完成首次协调', operator: '网格员乙' },
      ],
      updatedAt: '2026-08-01 10:00',
    })).not.toThrow();

    expect(() => assertMobileConflictUpdatePayload({})).toThrow('empty');
    expect(() => assertMobileConflictUpdatePayload({ title: '越界字段' })).toThrow('keys');
    expect(() => assertMobileConflictUpdatePayload({ status: '已化解' })).toThrow('keys');
    expect(() => assertMobileConflictUpdatePayload({ createdAt: '2026-08-01' })).toThrow('keys');
    expect(() => assertMobileConflictUpdatePayload({ id: 'conflict-1' })).toThrow('keys');
  });

  it('keeps status as an exact, typed action payload', () => {
    expect(() => assertMobileConflictStatusPayload({ status: '已化解' })).not.toThrow();
    expect(() => assertMobileConflictStatusPayload({ status: '调解中' })).not.toThrow();
    expect(() => assertMobileConflictStatusPayload({ status: '待处理' })).toThrow(
      ConflictPayloadValidationError,
    );
    expect(() => assertMobileConflictStatusPayload({ status: '已化解', updatedAt: 'now' })).toThrow('keys');
  });
});
