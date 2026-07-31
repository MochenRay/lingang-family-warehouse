import type { ConflictRecord } from '../../types/core';

export type MobileConflictParty = ConflictRecord['involvedParties'][number];
export type MobileConflictTimelineEntry = ConflictRecord['timeline'][number];
export type MobileConflictCreatePayload = Omit<ConflictRecord, 'id'>;
export type MobileConflictUpdatePayload = Partial<Pick<ConflictRecord, 'timeline' | 'updatedAt'>>;
export type MobileConflictStatusPayload = Pick<ConflictRecord, 'status'>;
export type MobileConflictProgressInput = MobileConflictTimelineEntry;

type FieldValidator = (value: unknown) => boolean;
type UnknownRecord = Record<string, unknown>;

const UNSAFE_CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const SOURCES = new Set<ConflictRecord['source']>(['上级下派', '自行发现']);
const TYPES = new Set<ConflictRecord['type']>(['邻里纠纷', '家庭纠纷', '物业纠纷', '其他']);
const STATUSES = new Set<ConflictRecord['status']>(['调解中', '已化解']);
const PARTY_TYPES = new Set<MobileConflictParty['type']>(['resident', 'organization']);

export class ConflictPayloadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictPayloadValidationError';
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
  return keys.every((key) => allowed.has(key) && Object.prototype.propertyIsEnumerable.call(value, key))
    && [...required].every((key) => keys.includes(key));
}

function isBusinessString(value: unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value === value.trim()
    && !UNSAFE_CONTROL_CHARACTER_PATTERN.test(value);
}

function isEnumValue<T extends string>(value: unknown, values: ReadonlySet<T>): value is T {
  return typeof value === 'string' && values.has(value as T);
}

function isDenseArray(value: unknown): value is unknown[] {
  if (!Array.isArray(value)) {
    return false;
  }
  const expectedKeys = new Set([...value.keys()].map(String));
  expectedKeys.add('length');
  return [...value.keys()].every((index) => Object.prototype.hasOwnProperty.call(value, index))
    && Reflect.ownKeys(value).every((key) => typeof key === 'string' && expectedKeys.has(key));
}

function isStringArray(value: unknown): value is string[] {
  return isDenseArray(value) && value.every(isBusinessString);
}

const PARTY_KEYS = new Set(['type', 'id', 'name']);

function isConflictParty(value: unknown): value is MobileConflictParty {
  return hasExactObjectKeys(value, PARTY_KEYS, PARTY_KEYS)
    && isEnumValue(value.type, PARTY_TYPES)
    && isBusinessString(value.id)
    && isBusinessString(value.name);
}

function isConflictParties(value: unknown): value is MobileConflictParty[] {
  return isDenseArray(value) && value.length > 0 && value.every(isConflictParty);
}

const TIMELINE_KEYS = new Set(['date', 'content', 'operator']);

function isTimelineEntry(value: unknown): value is MobileConflictTimelineEntry {
  return hasExactObjectKeys(value, TIMELINE_KEYS, TIMELINE_KEYS)
    && isBusinessString(value.date)
    && isBusinessString(value.content)
    && isBusinessString(value.operator);
}

function isTimeline(value: unknown): value is MobileConflictTimelineEntry[] {
  return isDenseArray(value) && value.every(isTimelineEntry);
}

const CREATE_FIELD_VALIDATORS = {
  source: (value: unknown) => isEnumValue(value, SOURCES),
  title: isBusinessString,
  type: (value: unknown) => isEnumValue(value, TYPES),
  description: isBusinessString,
  involvedParties: isConflictParties,
  status: (value: unknown) => isEnumValue(value, STATUSES),
  gridId: isBusinessString,
  location: isBusinessString,
  timeline: isTimeline,
  images: isStringArray,
  createdAt: isBusinessString,
  updatedAt: isBusinessString,
} satisfies Record<keyof MobileConflictCreatePayload, FieldValidator>;

const UPDATE_FIELD_VALIDATORS = {
  timeline: isTimeline,
  updatedAt: isBusinessString,
} satisfies Record<keyof MobileConflictUpdatePayload, FieldValidator>;

const STATUS_FIELD_VALIDATORS = {
  status: (value: unknown) => isEnumValue(value, STATUSES),
} satisfies Record<keyof MobileConflictStatusPayload, FieldValidator>;

function assertExactPayload<T extends object>(
  value: unknown,
  validators: { [K in keyof T]-?: FieldValidator },
  required: ReadonlySet<keyof T>,
  label: string,
): asserts value is T {
  const allowedKeys = new Set(Object.keys(validators));
  const requiredKeys = new Set([...required].map(String));
  if (!hasExactObjectKeys(value, allowedKeys, requiredKeys)) {
    throw new ConflictPayloadValidationError(`Invalid ${label} keys`);
  }
  for (const key of Object.keys(value)) {
    if (!validators[key as keyof T](value[key])) {
      throw new ConflictPayloadValidationError(`Invalid ${label} field: ${key}`);
    }
  }
}

export function assertMobileConflictCreatePayload(
  value: unknown,
): asserts value is MobileConflictCreatePayload {
  assertExactPayload(
    value,
    CREATE_FIELD_VALIDATORS,
    new Set<keyof MobileConflictCreatePayload>(Object.keys(CREATE_FIELD_VALIDATORS) as Array<
      keyof MobileConflictCreatePayload
    >),
    'mobile conflict/create payload',
  );
  const payload = value as MobileConflictCreatePayload;
  const identities = payload.involvedParties.map((party) => `${party.type}:${party.id}`);
  if (new Set(identities).size !== identities.length) {
    throw new ConflictPayloadValidationError('Invalid mobile conflict/create payload: duplicate party');
  }
}

export function assertMobileConflictUpdatePayload(
  value: unknown,
): asserts value is MobileConflictUpdatePayload {
  assertExactPayload(
    value,
    UPDATE_FIELD_VALIDATORS,
    new Set(),
    'mobile conflict/update payload',
  );
  if (Object.keys(value).length === 0) {
    throw new ConflictPayloadValidationError('Invalid mobile conflict/update payload: empty');
  }
}

export function assertMobileConflictStatusPayload(
  value: unknown,
): asserts value is MobileConflictStatusPayload {
  assertExactPayload(
    value,
    STATUS_FIELD_VALIDATORS,
    new Set<keyof MobileConflictStatusPayload>(['status']),
    'mobile conflict/status payload',
  );
}

export function assertMobileConflictProgressInput(
  value: unknown,
): asserts value is MobileConflictProgressInput {
  if (!isTimelineEntry(value)) {
    throw new ConflictPayloadValidationError('Invalid mobile conflict progress input');
  }
}
