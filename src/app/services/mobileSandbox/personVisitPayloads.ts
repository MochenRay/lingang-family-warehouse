import type { Person, VisitRecord } from '../../types/core';

export type MobilePersonCreatePayload = Omit<Person, 'id'>;

type MobileMutablePersonField =
  | 'name'
  | 'phone'
  | 'address'
  | 'type'
  | 'tags'
  | 'nation'
  | 'education'
  | 'birthDate'
  | 'birthplace'
  | 'maritalStatus'
  | 'religion'
  | 'politicalStatus'
  | 'militaryService'
  | 'graduationInfo'
  | 'workplace'
  | 'communityVolunteer'
  | 'skills'
  | 'pets'
  | 'biography'
  | 'activityParticipation'
  | 'healthRecord'
  | 'importantEvents'
  | 'updatedAt';

export type MobilePersonUpdatePayload = Partial<Pick<Person, MobileMutablePersonField>>;

export type MobileVisitCreatePayload = Omit<VisitRecord, 'id' | 'targetType'> & {
  targetType: 'person';
};

type FieldValidator = (value: unknown) => boolean;
type UnknownRecord = Record<string, unknown>;

const UNSAFE_CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

const GENDERS = new Set<Person['gender']>(['男', '女']);
const PERSON_TYPES = new Set<Person['type']>(['户籍', '流动', '留守', '境外']);
const RISK_LEVELS = new Set<Person['risk']>(['High', 'Medium', 'Low']);
const MARITAL_STATUSES = new Set<NonNullable<Person['maritalStatus']>>([
  '未婚',
  '已婚',
  '离异',
  '丧偶',
]);
const CARE_LABELS = new Set<NonNullable<Person['careLabels']>[number]>([
  '独居老人',
  '特困人员',
  '困境儿童',
  '孤儿',
  '留守人员',
  '军人',
  '困难',
  '失业',
  '失独',
  '残疾',
  '低保户',
  '优抚对象',
]);
const FOCUS_TYPES = new Set<NonNullable<NonNullable<Person['categoryLabels']>['focusType']>[number]>([
  '社区矫正',
  '安置帮教',
  '信访人员',
  '涉法涉诉人员',
  '易肇事精神障碍患者',
  '吸毒人员',
  '邪教人员',
  '疆籍人员',
  '藏籍人员',
  '外籍人员',
]);
const FAMILY_RELATION_TYPES = new Set<
  NonNullable<Person['familyRelations']>[number]['relationType']
>([
  '父亲',
  '母亲',
  '配偶',
  '子女',
  '兄弟',
  '姐妹',
  '兄弟姐妹',
  '祖父母',
  '孙子女',
  '其他',
]);

export class PersonVisitPayloadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersonVisitPayloadValidationError';
  }
}

function isPlainObject(value: unknown): value is UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactObjectKeys(
  value: unknown,
  allowed: ReadonlySet<string>,
  required: ReadonlySet<string>,
): value is UnknownRecord {
  if (!isPlainObject(value)) {
    return false;
  }

  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== 'string')) {
    return false;
  }

  const keys = ownKeys as string[];
  if (
    keys.some((key) => !allowed.has(key))
    || [...required].some((key) => !Object.prototype.hasOwnProperty.call(value, key))
  ) {
    return false;
  }

  return keys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return Boolean(descriptor?.enumerable && descriptor && 'value' in descriptor);
  });
}

function isBusinessString(value: unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value === value.trim()
    && !UNSAFE_CONTROL_CHARACTER_PATTERN.test(value);
}

function isArrayOf(value: unknown, itemValidator: FieldValidator): boolean {
  if (!Array.isArray(value)) {
    return false;
  }

  const expectedKeys = new Set<string>(['length', ...value.map((_item, index) => String(index))]);
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== expectedKeys.size
    || ownKeys.some((key) => typeof key !== 'string' || !expectedKeys.has(key))
  ) {
    return false;
  }

  return value.every((item, index) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    return Boolean(descriptor?.enumerable && descriptor && 'value' in descriptor)
      && itemValidator(item);
  });
}

function isStringArray(value: unknown): value is string[] {
  return isArrayOf(
    value,
    (item) => isBusinessString(item) && !CONTROL_CHARACTER_PATTERN.test(item),
  );
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isAge(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= 0
    && value <= 200;
}

function isEnumValue<T extends string>(value: unknown, values: ReadonlySet<T>): value is T {
  return typeof value === 'string' && values.has(value as T);
}

function isFamilyRelation(value: unknown): boolean {
  const keys = new Set(['relatedPersonId', 'relationType']);
  return hasExactObjectKeys(value, keys, keys)
    && isBusinessString(value.relatedPersonId)
    && isEnumValue(value.relationType, FAMILY_RELATION_TYPES);
}

function isFamilyRelations(value: unknown): boolean {
  return isArrayOf(value, isFamilyRelation);
}

function isCareLabels(value: unknown): boolean {
  return isArrayOf(value, (item) => isEnumValue(item, CARE_LABELS));
}

function isCategoryLabels(value: unknown): boolean {
  const allowed = new Set(['isFloorLeader', 'isUnitLeader', 'isAssistant', 'focusType']);
  if (!hasExactObjectKeys(value, allowed, new Set())) {
    return false;
  }
  return (!Object.prototype.hasOwnProperty.call(value, 'isFloorLeader') || isBoolean(value.isFloorLeader))
    && (!Object.prototype.hasOwnProperty.call(value, 'isUnitLeader') || isBoolean(value.isUnitLeader))
    && (!Object.prototype.hasOwnProperty.call(value, 'isAssistant') || isBoolean(value.isAssistant))
    && (
      !Object.prototype.hasOwnProperty.call(value, 'focusType')
      || isArrayOf(value.focusType, (item) => isEnumValue(item, FOCUS_TYPES))
    );
}

function isActivityParticipation(value: unknown): boolean {
  const allowed = new Set(['activities', 'needs']);
  if (!hasExactObjectKeys(value, allowed, new Set())) {
    return false;
  }
  return (!Object.prototype.hasOwnProperty.call(value, 'activities') || isBusinessString(value.activities))
    && (!Object.prototype.hasOwnProperty.call(value, 'needs') || isBusinessString(value.needs));
}

function isHealthRecord(value: unknown): boolean {
  const allowed = new Set([
    'hasChronic',
    'chronicDetails',
    'needsRegularMedicine',
    'medicineFrequency',
    'medicalVisitFrequency',
    'isSeverePatient',
    'isPregnant',
    'specialNotes',
  ]);
  if (!hasExactObjectKeys(value, allowed, new Set())) {
    return false;
  }

  const booleanFields = [
    'hasChronic',
    'needsRegularMedicine',
    'isSeverePatient',
    'isPregnant',
  ] as const;
  const stringFields = [
    'chronicDetails',
    'medicineFrequency',
    'medicalVisitFrequency',
    'specialNotes',
  ] as const;
  return booleanFields.every(
    (field) => !Object.prototype.hasOwnProperty.call(value, field) || isBoolean(value[field]),
  ) && stringFields.every(
    (field) => !Object.prototype.hasOwnProperty.call(value, field) || isBusinessString(value[field]),
  );
}

const PERSON_CREATE_FIELD_VALIDATORS = {
  gridId: isBusinessString,
  name: isBusinessString,
  idCard: isBusinessString,
  gender: (value: unknown) => isEnumValue(value, GENDERS),
  age: isAge,
  phone: isBusinessString,
  address: isBusinessString,
  houseId: isBusinessString,
  type: (value: unknown) => isEnumValue(value, PERSON_TYPES),
  tags: isStringArray,
  risk: (value: unknown) => isEnumValue(value, RISK_LEVELS),
  updatedAt: isBusinessString,
  nation: isBusinessString,
  education: isBusinessString,
  familyRelations: isFamilyRelations,
  birthDate: isBusinessString,
  birthplace: isBusinessString,
  maritalStatus: (value: unknown) => isEnumValue(value, MARITAL_STATUSES),
  religion: isBusinessString,
  politicalStatus: isBusinessString,
  militaryService: isBoolean,
  graduationInfo: isBusinessString,
  workplace: isBusinessString,
  communityVolunteer: isBoolean,
  skills: isBusinessString,
  pets: isBusinessString,
  careLabels: isCareLabels,
  categoryLabels: isCategoryLabels,
  biography: isBusinessString,
  activityParticipation: isActivityParticipation,
  healthRecord: isHealthRecord,
  importantEvents: isBusinessString,
} satisfies Record<keyof MobilePersonCreatePayload, FieldValidator>;

const PERSON_CREATE_REQUIRED_KEYS = new Set<keyof MobilePersonCreatePayload>([
  'gridId',
  'name',
  'idCard',
  'gender',
  'age',
  'address',
  'type',
  'tags',
  'risk',
  'updatedAt',
]);

const PERSON_UPDATE_FIELD_VALIDATORS = {
  name: PERSON_CREATE_FIELD_VALIDATORS.name,
  phone: PERSON_CREATE_FIELD_VALIDATORS.phone,
  address: PERSON_CREATE_FIELD_VALIDATORS.address,
  type: PERSON_CREATE_FIELD_VALIDATORS.type,
  tags: PERSON_CREATE_FIELD_VALIDATORS.tags,
  nation: PERSON_CREATE_FIELD_VALIDATORS.nation,
  education: PERSON_CREATE_FIELD_VALIDATORS.education,
  birthDate: PERSON_CREATE_FIELD_VALIDATORS.birthDate,
  birthplace: PERSON_CREATE_FIELD_VALIDATORS.birthplace,
  maritalStatus: PERSON_CREATE_FIELD_VALIDATORS.maritalStatus,
  religion: PERSON_CREATE_FIELD_VALIDATORS.religion,
  politicalStatus: PERSON_CREATE_FIELD_VALIDATORS.politicalStatus,
  militaryService: PERSON_CREATE_FIELD_VALIDATORS.militaryService,
  graduationInfo: PERSON_CREATE_FIELD_VALIDATORS.graduationInfo,
  workplace: PERSON_CREATE_FIELD_VALIDATORS.workplace,
  communityVolunteer: PERSON_CREATE_FIELD_VALIDATORS.communityVolunteer,
  skills: PERSON_CREATE_FIELD_VALIDATORS.skills,
  pets: PERSON_CREATE_FIELD_VALIDATORS.pets,
  biography: PERSON_CREATE_FIELD_VALIDATORS.biography,
  activityParticipation: PERSON_CREATE_FIELD_VALIDATORS.activityParticipation,
  healthRecord: PERSON_CREATE_FIELD_VALIDATORS.healthRecord,
  importantEvents: PERSON_CREATE_FIELD_VALIDATORS.importantEvents,
  updatedAt: PERSON_CREATE_FIELD_VALIDATORS.updatedAt,
} satisfies Record<keyof MobilePersonUpdatePayload, FieldValidator>;

const VISIT_CREATE_FIELD_VALIDATORS = {
  targetId: isBusinessString,
  targetType: (value: unknown) => value === 'person',
  gridId: isBusinessString,
  visitorName: isBusinessString,
  date: isBusinessString,
  content: isBusinessString,
  images: isStringArray,
  tags: isStringArray,
} satisfies Record<keyof MobileVisitCreatePayload, FieldValidator>;

const VISIT_CREATE_REQUIRED_KEYS = new Set<keyof MobileVisitCreatePayload>([
  'targetId',
  'targetType',
  'gridId',
  'visitorName',
  'date',
  'content',
]);

function assertExactPayload<T extends object>(
  value: unknown,
  validators: { [K in keyof T]-?: FieldValidator },
  required: ReadonlySet<keyof T>,
  label: string,
): asserts value is T {
  const allowedKeys = new Set(Object.keys(validators));
  const requiredKeys = new Set([...required].map(String));
  if (!hasExactObjectKeys(value, allowedKeys, requiredKeys)) {
    throw new PersonVisitPayloadValidationError(`Invalid ${label} keys`);
  }

  for (const key of Object.keys(value)) {
    const validator = validators[key as keyof T];
    if (!validator(value[key])) {
      throw new PersonVisitPayloadValidationError(`Invalid ${label} field: ${key}`);
    }
  }
}

export function assertMobilePersonCreatePayload(
  value: unknown,
): asserts value is MobilePersonCreatePayload {
  assertExactPayload(
    value,
    PERSON_CREATE_FIELD_VALIDATORS,
    PERSON_CREATE_REQUIRED_KEYS,
    'mobile person/create payload',
  );
}

export function assertMobilePersonUpdatePayload(
  value: unknown,
): asserts value is MobilePersonUpdatePayload {
  assertExactPayload(
    value,
    PERSON_UPDATE_FIELD_VALIDATORS,
    new Set(),
    'mobile person/update payload',
  );
  if (Object.keys(value).length === 0) {
    throw new PersonVisitPayloadValidationError('Invalid mobile person/update payload: empty');
  }
}

export function assertMobileVisitCreatePayload(
  value: unknown,
): asserts value is MobileVisitCreatePayload {
  assertExactPayload(
    value,
    VISIT_CREATE_FIELD_VALIDATORS,
    VISIT_CREATE_REQUIRED_KEYS,
    'mobile visit/create payload',
  );
}
