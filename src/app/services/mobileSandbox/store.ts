import {
  MOBILE_SANDBOX_CHANGE_EVENT,
  MOBILE_SANDBOX_STORAGE_KEY,
  MOBILE_SANDBOX_VERSION,
  type MobileSandboxAction,
  type MobileSandboxEntity,
  type MobileSessionEnvelopeV1,
  type MobileSessionEventV1,
  type MobileSessionObjectPayloadV1,
  type MobileSessionStatusPayloadV1,
} from './types';
import {
  PersonVisitPayloadValidationError,
  assertMobilePersonCreatePayload,
  assertMobilePersonUpdatePayload,
  assertMobileVisitCreatePayload,
} from './personVisitPayloads';
import {
  ConflictPayloadValidationError,
  assertMobileConflictCreatePayload,
  assertMobileConflictStatusPayload,
  assertMobileConflictUpdatePayload,
} from './conflictPayloads';

const ENTITY_ACTIONS: Record<MobileSandboxEntity, ReadonlySet<MobileSandboxAction>> = {
  person: new Set(['create', 'update', 'tombstone']),
  house: new Set(['create', 'update', 'tombstone']),
  visit: new Set(['create', 'tombstone']),
  conflict: new Set(['create', 'update', 'status', 'tombstone']),
  patrolReport: new Set(['create', 'status', 'tombstone']),
  quickNote: new Set(['create', 'update', 'tombstone']),
};

const ENTITY_NAMES = new Set<MobileSandboxEntity>(Object.keys(ENTITY_ACTIONS) as MobileSandboxEntity[]);
const ENVELOPE_KEYS = new Set(['version', 'events']);
const EVENT_KEYS = new Set(['id', 'entity', 'action', 'targetId', 'tempId', 'payload', 'createdAt']);
const EVENT_REQUIRED_KEYS = new Set(['id', 'entity', 'action', 'targetId', 'payload', 'createdAt']);
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export class MobileSessionStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MobileSessionStoreError';
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (
    typeof value !== 'string'
    || value.trim().length === 0
    || value !== value.trim()
    || CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw new MobileSessionStoreError(`Invalid mobile session event field: ${field}`);
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  required: ReadonlySet<string>,
  label: string,
): void {
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== 'string')) {
    throw new MobileSessionStoreError(`Invalid mobile session ${label} keys`);
  }
  const keys = ownKeys as string[];
  if (
    keys.some((key) => !allowed.has(key))
    || [...required].some((key) => !keys.includes(key))
    || keys.some((key) => !Object.prototype.propertyIsEnumerable.call(value, key))
  ) {
    throw new MobileSessionStoreError(`Invalid mobile session ${label} keys`);
  }
}

function isUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}

function assertStrictIsoTimestamp(value: string): void {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new MobileSessionStoreError('Invalid mobile session event field: createdAt');
  }
}

function isSessionTarget(value: string): boolean {
  return value.startsWith('session:');
}

function isValidSessionTarget(value: string, entity: MobileSandboxEntity): boolean {
  const prefix = `session:${entity}:`;
  return value.startsWith(prefix) && isUuidV4(value.slice(prefix.length));
}

function assertJsonCompatible(
  value: unknown,
  field: string,
  ancestors = new Set<object>(),
  depth = 0,
): void {
  if (depth > 50) {
    throw new MobileSessionStoreError(`${field} must be JSON-compatible`);
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return;
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return;
    }
    throw new MobileSessionStoreError(`${field} must be JSON-compatible`);
  }
  if (typeof value !== 'object') {
    throw new MobileSessionStoreError(`${field} must be JSON-compatible`);
  }
  if (ancestors.has(value)) {
    throw new MobileSessionStoreError(`${field} must be JSON-compatible`);
  }

  ancestors.add(value);
  if (Array.isArray(value)) {
    const keys = Reflect.ownKeys(value);
    const expectedKeys = new Set([...value.keys()].map(String));
    expectedKeys.add('length');
    if (
      keys.some((key) => typeof key !== 'string' || !expectedKeys.has(key))
      || [...value.keys()].some((index) => !Object.prototype.hasOwnProperty.call(value, index))
    ) {
      throw new MobileSessionStoreError(`${field} must be JSON-compatible`);
    }
    value.forEach((item) => assertJsonCompatible(item, field, ancestors, depth + 1));
    ancestors.delete(value);
    return;
  }
  if (!isPlainObject(value)) {
    throw new MobileSessionStoreError(`${field} must be JSON-compatible`);
  }
  const keys = Reflect.ownKeys(value);
  if (
    keys.some((key) => typeof key !== 'string')
    || keys.some((key) => !Object.prototype.propertyIsEnumerable.call(value, key))
  ) {
    throw new MobileSessionStoreError(`${field} must be JSON-compatible`);
  }
  for (const [key, item] of Object.entries(value)) {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
      throw new MobileSessionStoreError(`${field} must be JSON-compatible`);
    }
    assertJsonCompatible(item, field, ancestors, depth + 1);
  }
  ancestors.delete(value);
}

function assertNonEmptyObjectPayload(
  value: unknown,
  action: 'create' | 'update',
): asserts value is MobileSessionObjectPayloadV1 {
  if (!isPlainObject(value) || Object.keys(value).length === 0) {
    throw new MobileSessionStoreError(`Invalid mobile session ${action} payload`);
  }
  assertJsonCompatible(value, `Mobile session ${action} payload`);
}

function assertStatusPayload(value: unknown): asserts value is MobileSessionStatusPayloadV1 {
  if (
    !isPlainObject(value)
    || Object.keys(value).length !== 1
    || !Object.prototype.hasOwnProperty.call(value, 'status')
  ) {
    throw new MobileSessionStoreError('Invalid mobile session status payload');
  }
  try {
    assertNonEmptyString(value.status, 'payload.status');
  } catch {
    throw new MobileSessionStoreError('Invalid mobile session status payload');
  }
  assertJsonCompatible(value, 'Mobile session status payload');
}

function assertTombstonePayload(value: unknown): asserts value is null {
  if (value !== null) {
    throw new MobileSessionStoreError('Invalid mobile session tombstone payload');
  }
}

type PayloadValidator = (value: unknown) => void;

const CREATE_PAYLOAD = (value: unknown) => assertNonEmptyObjectPayload(value, 'create');
const UPDATE_PAYLOAD = (value: unknown) => assertNonEmptyObjectPayload(value, 'update');

function asStorePayloadValidator(validator: PayloadValidator): PayloadValidator {
  return (value) => {
    try {
      validator(value);
    } catch (error) {
      if (
        error instanceof PersonVisitPayloadValidationError
        || error instanceof ConflictPayloadValidationError
      ) {
        throw new MobileSessionStoreError(error.message);
      }
      throw error;
    }
  };
}

const PERSON_CREATE_PAYLOAD = asStorePayloadValidator(assertMobilePersonCreatePayload);
const PERSON_UPDATE_PAYLOAD = asStorePayloadValidator(assertMobilePersonUpdatePayload);
const VISIT_CREATE_PAYLOAD = asStorePayloadValidator(assertMobileVisitCreatePayload);
const CONFLICT_CREATE_PAYLOAD = asStorePayloadValidator(assertMobileConflictCreatePayload);
const CONFLICT_UPDATE_PAYLOAD = asStorePayloadValidator(assertMobileConflictUpdatePayload);
const CONFLICT_STATUS_PAYLOAD = asStorePayloadValidator(assertMobileConflictStatusPayload);

const ENTITY_PAYLOAD_VALIDATORS: Record<
  MobileSandboxEntity,
  Partial<Record<MobileSandboxAction, PayloadValidator>>
> = {
  person: {
    create: PERSON_CREATE_PAYLOAD,
    update: PERSON_UPDATE_PAYLOAD,
    tombstone: assertTombstonePayload,
  },
  house: { create: CREATE_PAYLOAD, update: UPDATE_PAYLOAD, tombstone: assertTombstonePayload },
  visit: { create: VISIT_CREATE_PAYLOAD, tombstone: assertTombstonePayload },
  conflict: {
    create: CONFLICT_CREATE_PAYLOAD,
    update: CONFLICT_UPDATE_PAYLOAD,
    status: CONFLICT_STATUS_PAYLOAD,
    tombstone: assertTombstonePayload,
  },
  patrolReport: {
    create: CREATE_PAYLOAD,
    status: assertStatusPayload,
    tombstone: assertTombstonePayload,
  },
  quickNote: { create: CREATE_PAYLOAD, update: UPDATE_PAYLOAD, tombstone: assertTombstonePayload },
};

function assertValidEvent(value: unknown): asserts value is MobileSessionEventV1 {
  if (!isPlainObject(value)) {
    throw new MobileSessionStoreError('Invalid mobile session event');
  }

  assertExactKeys(value, EVENT_KEYS, EVENT_REQUIRED_KEYS, 'event');

  assertNonEmptyString(value.id, 'id');
  assertNonEmptyString(value.entity, 'entity');
  assertNonEmptyString(value.action, 'action');
  assertNonEmptyString(value.targetId, 'targetId');
  assertNonEmptyString(value.createdAt, 'createdAt');
  if (!isUuidV4(value.id)) {
    throw new MobileSessionStoreError('Invalid mobile session event field: id');
  }

  const entity = value.entity as MobileSandboxEntity;
  const action = value.action as MobileSandboxAction;
  if (!ENTITY_NAMES.has(entity) || !ENTITY_ACTIONS[entity].has(action)) {
    throw new MobileSessionStoreError(`Unsupported mobile session event: ${entity}/${action}`);
  }
  assertStrictIsoTimestamp(value.createdAt);
  if (action === 'create') {
    assertNonEmptyString(value.tempId, 'tempId');
    if (value.tempId !== value.targetId || !isValidSessionTarget(value.tempId, entity)) {
      throw new MobileSessionStoreError('Invalid mobile session temp id');
    }
  } else if (Object.prototype.hasOwnProperty.call(value, 'tempId')) {
    throw new MobileSessionStoreError('tempId is only allowed for create events');
  }
  if (action !== 'create' && isSessionTarget(value.targetId) && !isValidSessionTarget(value.targetId, entity)) {
    throw new MobileSessionStoreError('Invalid mobile session event target');
  }

  const payloadValidator = ENTITY_PAYLOAD_VALIDATORS[entity][action];
  if (!payloadValidator) {
    throw new MobileSessionStoreError(`Unsupported mobile session event: ${entity}/${action}`);
  }
  payloadValidator(value.payload);
}

function parseEnvelope(raw: string): MobileSessionEnvelopeV1 {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new MobileSessionStoreError('Mobile session data is not valid JSON');
  }

  if (!isPlainObject(value)) {
    throw new MobileSessionStoreError('Invalid mobile session data envelope');
  }
  assertExactKeys(value, ENVELOPE_KEYS, ENVELOPE_KEYS, 'envelope');
  if (value.version !== MOBILE_SANDBOX_VERSION || !Array.isArray(value.events)) {
    throw new MobileSessionStoreError('Unsupported mobile session data version');
  }
  const eventIds = new Set<string>();
  const createTargets = new Set<string>();
  value.events.forEach((event) => {
    assertValidEvent(event);
    if (eventIds.has(event.id)) {
      throw new MobileSessionStoreError(`Duplicate mobile session event id: ${event.id}`);
    }
    eventIds.add(event.id);
    if (event.action === 'create') {
      if (createTargets.has(event.targetId)) {
        throw new MobileSessionStoreError(`Duplicate mobile session create target: ${event.targetId}`);
      }
      createTargets.add(event.targetId);
    }
  });
  return value as unknown as MobileSessionEnvelopeV1;
}

function getSessionStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.sessionStorage;
}

function emitChange(events: MobileSessionEventV1[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(MOBILE_SANDBOX_CHANGE_EVENT, { detail: { events } }));
}

export function readMobileSessionEnvelope(storage = getSessionStorage()): MobileSessionEnvelopeV1 {
  if (!storage) {
    return { version: MOBILE_SANDBOX_VERSION, events: [] };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(MOBILE_SANDBOX_STORAGE_KEY);
  } catch (error) {
    throw new MobileSessionStoreError('Mobile session storage is unavailable');
  }
  return raw === null ? { version: MOBILE_SANDBOX_VERSION, events: [] } : parseEnvelope(raw);
}

export function appendMobileSessionTransaction(
  nextEvents: readonly MobileSessionEventV1[],
  storage = getSessionStorage(),
): MobileSessionEnvelopeV1 {
  if (!storage) {
    throw new MobileSessionStoreError('Mobile session storage is unavailable');
  }
  if (nextEvents.length === 0) {
    throw new MobileSessionStoreError('Mobile session transaction cannot be empty');
  }
  nextEvents.forEach(assertValidEvent);

  const current = readMobileSessionEnvelope(storage);
  const knownIds = new Set(current.events.map((event) => event.id));
  const knownCreateTargets = new Set(
    current.events
      .filter((event) => event.action === 'create')
      .map((event) => event.targetId),
  );
  for (const event of nextEvents) {
    if (knownIds.has(event.id)) {
      throw new MobileSessionStoreError(`Duplicate mobile session event id: ${event.id}`);
    }
    if (event.action === 'create' && knownCreateTargets.has(event.targetId)) {
      throw new MobileSessionStoreError(`Duplicate mobile session create target: ${event.targetId}`);
    }
    knownIds.add(event.id);
    if (event.action === 'create') {
      knownCreateTargets.add(event.targetId);
    }
  }

  const next: MobileSessionEnvelopeV1 = {
    version: MOBILE_SANDBOX_VERSION,
    events: [...current.events, ...nextEvents],
  };
  try {
    storage.setItem(MOBILE_SANDBOX_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    throw new MobileSessionStoreError('Unable to persist mobile session data');
  }
  emitChange([...nextEvents]);
  return next;
}

export function resetMobileSession(storage = getSessionStorage()): void {
  if (!storage) {
    throw new MobileSessionStoreError('Mobile session storage is unavailable');
  }
  try {
    storage.removeItem(MOBILE_SANDBOX_STORAGE_KEY);
  } catch (error) {
    throw new MobileSessionStoreError('Unable to reset mobile session data');
  }
  emitChange([]);
}

export function createMobileSessionTempId(entity: MobileSandboxEntity): string {
  return `session:${entity}:${crypto.randomUUID()}`;
}

export function createMobileSessionEvent(
  entity: MobileSandboxEntity,
  action: MobileSandboxAction,
  targetId: string,
  payload: unknown,
): MobileSessionEventV1 {
  const isCreate = action === 'create';
  const resolvedTargetId = isCreate ? createMobileSessionTempId(entity) : targetId;
  const event: unknown = {
    id: crypto.randomUUID(),
    entity,
    action,
    targetId: resolvedTargetId,
    ...(isCreate ? { tempId: resolvedTargetId } : {}),
    payload,
    createdAt: new Date().toISOString(),
  };
  assertValidEvent(event);
  return event;
}

export function getMobileSessionEvents(
  entity: MobileSandboxEntity,
  storage = getSessionStorage(),
): MobileSessionEventV1[] {
  return readMobileSessionEnvelope(storage).events.filter((event) => event.entity === entity);
}

export function applyMobileSessionEvents<T extends { id: string }>(
  seed: readonly T[],
  entity: MobileSandboxEntity,
  events: readonly MobileSessionEventV1[],
): T[] {
  const items = new Map(seed.map((item) => [item.id, { ...item }]));
  const order = seed.map((item) => item.id);

  for (const event of events) {
    assertValidEvent(event);
    if (event.entity !== entity) {
      continue;
    }
    if (event.action === 'create') {
      if (!isPlainObject(event.payload) || items.has(event.targetId)) {
        throw new MobileSessionStoreError(`Invalid create event target: ${event.targetId}`);
      }
      items.set(event.targetId, { ...event.payload, id: event.targetId } as T);
      order.push(event.targetId);
      continue;
    }
    if (event.action === 'tombstone') {
      if (!items.has(event.targetId)) {
        throw new MobileSessionStoreError(`Unknown tombstone target: ${event.targetId}`);
      }
      items.delete(event.targetId);
      continue;
    }

    const current = items.get(event.targetId);
    if (!current || !isPlainObject(event.payload)) {
      throw new MobileSessionStoreError(`Unknown update target: ${event.targetId}`);
    }
    items.set(event.targetId, { ...current, ...event.payload, id: event.targetId });
  }

  return order.flatMap((id) => {
    const item = items.get(id);
    return item ? [item] : [];
  });
}
