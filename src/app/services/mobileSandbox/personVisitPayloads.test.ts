import { describe, expect, it } from 'vitest';
import {
  PersonVisitPayloadValidationError,
  assertMobilePersonCreatePayload,
  assertMobilePersonUpdatePayload,
  assertMobileVisitCreatePayload,
  type MobilePersonCreatePayload,
  type MobilePersonUpdatePayload,
  type MobileVisitCreatePayload,
} from './personVisitPayloads';

function personCreate(
  overrides: Partial<MobilePersonCreatePayload> = {},
): MobilePersonCreatePayload {
  return {
    gridId: 'grid-1',
    name: '测试居民',
    idCard: '310000199001010001',
    gender: '女',
    age: 36,
    phone: '13800000000',
    address: '临港新片区',
    houseId: 'house-1',
    type: '户籍',
    tags: ['重点关注'],
    risk: 'Medium',
    updatedAt: '2026-07-31T12:00:00.000Z',
    nation: '汉族',
    education: '本科',
    familyRelations: [{ relatedPersonId: 'person-2', relationType: '配偶' }],
    birthDate: '1990-01-01',
    birthplace: '上海',
    maritalStatus: '已婚',
    religion: '无',
    politicalStatus: '群众',
    militaryService: false,
    graduationInfo: '某大学',
    workplace: '某公司',
    communityVolunteer: true,
    skills: '书法',
    pets: '猫',
    careLabels: ['独居老人'],
    categoryLabels: {
      isFloorLeader: true,
      isUnitLeader: false,
      isAssistant: false,
      focusType: ['外籍人员'],
    },
    biography: '居住稳定',
    activityParticipation: { activities: '志愿服务', needs: '无' },
    healthRecord: {
      hasChronic: false,
      chronicDetails: '无',
      needsRegularMedicine: false,
      medicineFrequency: '无',
      medicalVisitFrequency: '每年',
      isSeverePatient: false,
      isPregnant: false,
      specialNotes: '无',
    },
    importantEvents: '无',
    ...overrides,
  };
}

function visitCreate(
  overrides: Partial<MobileVisitCreatePayload> = {},
): MobileVisitCreatePayload {
  return {
    targetId: 'person-1',
    targetType: 'person',
    gridId: 'grid-1',
    visitorName: '网格员',
    date: '2026-07-31 12:00',
    content: '已完成入户走访\n居民状态稳定',
    images: ['https://example.test/visit.jpg'],
    tags: ['日常走访'],
    ...overrides,
  };
}

describe('person and visit mobile session payload validators', () => {
  it('accepts exact replayable create, mutable update, and person visit payloads', () => {
    const update: MobilePersonUpdatePayload = {
      name: '更新名称',
      phone: '13900000000',
      updatedAt: '2026-07-31T13:00:00.000Z',
      activityParticipation: { needs: '定期回访' },
      healthRecord: { hasChronic: true, chronicDetails: '高血压' },
    };

    expect(() => assertMobilePersonCreatePayload(personCreate())).not.toThrow();
    expect(() => assertMobilePersonUpdatePayload(update)).not.toThrow();
    expect(() => assertMobileVisitCreatePayload(visitCreate())).not.toThrow();
  });

  it.each([
    ['unknown top-level key', { ...personCreate(), extra: true }],
    ['explicit undefined', { ...personCreate(), phone: undefined }],
    ['explicit null', { ...personCreate(), phone: null }],
    ['id in create', { ...personCreate(), id: 'person-1' }],
    ['missing required field', (({ name: _name, ...payload }) => payload)(personCreate())],
    ['untrimmed string', { ...personCreate(), name: ' 居民' }],
    ['empty business string', { ...personCreate(), address: '' }],
    ['control character', { ...personCreate(), name: '居\u0000民' }],
  ])('rejects person/create %s', (_label, payload) => {
    expect(() => assertMobilePersonCreatePayload(payload)).toThrow(
      PersonVisitPayloadValidationError,
    );
  });

  it.each([
    ['gender', { gender: '其他' }],
    ['person type', { type: '未知' }],
    ['risk', { risk: 'Critical' }],
    ['marital status', { maritalStatus: '未知' }],
    ['care label', { careLabels: ['未知标签'] }],
    ['focus type', { categoryLabels: { focusType: ['未知类型'] } }],
    ['family relation type', {
      familyRelations: [{ relatedPersonId: 'person-2', relationType: '未知' }],
    }],
  ])('rejects an invalid person/create %s enum', (_label, overrides) => {
    expect(() => assertMobilePersonCreatePayload(personCreate(overrides as never))).toThrow(
      PersonVisitPayloadValidationError,
    );
  });

  it.each([-1, 201, 20.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects out-of-contract age %s',
    (age) => {
      expect(() => assertMobilePersonCreatePayload(personCreate({ age }))).toThrow(
        PersonVisitPayloadValidationError,
      );
    },
  );

  it.each([
    ['family relation', {
      familyRelations: [{ relatedPersonId: 'person-2', relationType: '配偶', extra: true }],
    }],
    ['category labels', { categoryLabels: { isAssistant: true, extra: true } }],
    ['activity participation', {
      activityParticipation: { needs: '定期回访', extra: true },
    }],
    ['health record', { healthRecord: { hasChronic: true, extra: true } }],
  ])('rejects a nested extra key in %s', (_label, overrides) => {
    expect(() => assertMobilePersonCreatePayload(personCreate(overrides as never))).toThrow(
      PersonVisitPayloadValidationError,
    );
  });

  it.each([
    ['empty update', {}],
    ['unknown key', { extra: true }],
    ['explicit undefined', { phone: undefined }],
    ['invalid mutable enum', { type: '未知' }],
    ['nested extra key', { healthRecord: { hasChronic: true, extra: true } }],
    ['immutable id', { id: 'person-1' }],
    ['immutable gridId', { gridId: 'grid-2' }],
    ['immutable idCard', { idCard: 'new-card' }],
    ['immutable gender', { gender: '男' }],
    ['immutable age', { age: 40 }],
    ['immutable risk', { risk: 'High' }],
    ['immutable houseId', { houseId: 'house-2' }],
    ['immutable familyRelations', { familyRelations: [] }],
    ['immutable careLabels', { careLabels: [] }],
    ['immutable categoryLabels', { categoryLabels: {} }],
  ])('rejects person/update %s', (_label, payload) => {
    expect(() => assertMobilePersonUpdatePayload(payload)).toThrow(
      PersonVisitPayloadValidationError,
    );
  });

  it.each([
    ['a house target', { ...visitCreate(), targetType: 'house' }],
    ['an id field', { ...visitCreate(), id: 'visit-1' }],
    ['an unknown field', { ...visitCreate(), extra: true }],
    ['an undefined optional field', { ...visitCreate(), images: undefined }],
    ['a missing required field', (({ content: _content, ...payload }) => payload)(visitCreate())],
    ['an empty target id', { ...visitCreate(), targetId: '' }],
    ['an invalid string array item', { ...visitCreate(), tags: [' valid'] }],
  ])('rejects visit/create with %s', (_label, payload) => {
    expect(() => assertMobileVisitCreatePayload(payload)).toThrow(
      PersonVisitPayloadValidationError,
    );
  });
});
