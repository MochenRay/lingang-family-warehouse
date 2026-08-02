import type { Person, PersonType, RiskLevel, VisitRecord } from '../../types/core';
import {
  buildQueryString,
  fetchAllListPages,
  fetchJson,
  type ApiListResponse,
} from '../api';
import {
  secondaryAiRepository,
  type SecondaryAiChatResult,
} from '../repositories/secondaryAiRepository';
import { getActiveMobileSandboxMode } from './mode';
import { executeMobileMutation } from './mutation';
import {
  assertMobilePersonCreatePayload,
  assertMobilePersonUpdatePayload,
  assertMobileVisitCreatePayload,
  PersonVisitPayloadValidationError,
  type MobilePersonCreatePayload,
  type MobilePersonUpdatePayload,
  type MobileVisitCreatePayload,
} from './personVisitPayloads';
import {
  appendMobileSessionTransaction,
  applyMobileSessionEvents,
  createMobileSessionEvent,
  getMobileSessionEvents,
} from './store';
import {
  MOBILE_SANDBOX_CHANGE_EVENT,
  type MobileSandboxModeResult,
  type MobileSessionEventV1,
} from './types';

const VISIT_OUTLINE_PROMPT =
  '请依据已裁剪的对象上下文，生成本次入户走访提纲。只给出需核验事项、建议提问和闭环动作，不得推断未提供的隐私事实。';

const SESSION_PERSON_AI_DISCLOSURE =
  '会话中新建人员暂不支持对象化 AI；可先手工填写并保存走访记录。';
const SERVER_PERSON_AI_DISCLOSURE = 'AI 提纲基于服务器档案。';
const SERVER_BASELINE_AI_DISCLOSURE =
  'AI 提纲基于服务器原始档案，不包含本次浏览会话中的修改。';

export interface MobilePersonQuery {
  q?: string;
  search?: string;
  gridId?: string;
  houseId?: string;
  type?: PersonType;
  risk?: RiskLevel;
  tag?: string;
  limit?: number;
  offset?: number;
}

export interface MobileVisitQuery {
  gridId?: string;
  targetId?: string;
  targetType?: 'person' | 'house';
  visitorName?: string;
  tag?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export type MobilePersonVisitCreateInput = Pick<
  VisitRecord,
  'visitorName' | 'date' | 'content'
> & Partial<Pick<VisitRecord, 'images' | 'tags'>>;

export type PersonAiPolicy =
  | {
      allowed: false;
      reason: 'session-person';
      disclosure: typeof SESSION_PERSON_AI_DISCLOSURE;
    }
  | {
      allowed: true;
      contextId: string;
      baseline: 'server';
      sessionOverlayExcluded: boolean;
      disclosure: string;
    };

export type VisitOutlineResponse =
  | { allowed: false; policy: Extract<PersonAiPolicy, { allowed: false }> }
  | {
      allowed: true;
      policy: Extract<PersonAiPolicy, { allowed: true }>;
      result: SecondaryAiChatResult;
      grounded: boolean;
    };

export class MobileFacadeTargetNotFoundError extends Error {
  constructor(entity: 'person' | 'visit', id: string) {
    super(`Mobile ${entity} target was not found: ${id}`);
    this.name = 'MobileFacadeTargetNotFoundError';
  }
}

function assertPagination(limit?: number, offset?: number): void {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 500)) {
    throw new RangeError('Mobile facade limit must be an integer from 1 to 500');
  }
  if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
    throw new RangeError('Mobile facade offset must be a non-negative integer');
  }
}

function assertListResponse<T>(value: ApiListResponse<T>, label: string): ApiListResponse<T> {
  if (
    !value
    || !Array.isArray(value.items)
    || !Number.isInteger(value.total)
    || value.total < 0
    || value.items.length > value.total
  ) {
    throw new Error(`Invalid ${label} API list response`);
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

const PERSON_UPDATE_KEYS = new Set([
  'name',
  'phone',
  'address',
  'type',
  'tags',
  'nation',
  'education',
  'birthDate',
  'birthplace',
  'maritalStatus',
  'religion',
  'politicalStatus',
  'militaryService',
  'graduationInfo',
  'workplace',
  'communityVolunteer',
  'skills',
  'pets',
  'biography',
  'activityParticipation',
  'healthRecord',
  'importantEvents',
  'updatedAt',
]);
const ACTIVITY_PARTICIPATION_KEYS = new Set(['activities', 'needs']);
const HEALTH_RECORD_KEYS = new Set([
  'hasChronic',
  'chronicDetails',
  'needsRegularMedicine',
  'medicineFrequency',
  'medicalVisitFrequency',
  'isSeverePatient',
  'isPregnant',
  'specialNotes',
]);
const PERSON_VISIT_INPUT_KEYS = new Set(['visitorName', 'date', 'content', 'images', 'tags']);

function assertOnlyEnumerableKeys(
  value: unknown,
  allowed: ReadonlySet<string>,
  label: string,
): asserts value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new PersonVisitPayloadValidationError(`Invalid ${label}`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      typeof key !== 'string'
      || !allowed.has(key)
      || !descriptor?.enumerable
      || !('value' in descriptor)
    ) {
      throw new PersonVisitPayloadValidationError(`Invalid ${label} keys`);
    }
  }
}

function omitKnownUndefined(
  value: Record<string, unknown>,
  nestedKeys?: ReadonlySet<string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue;
    if (nestedKeys && isPlainObject(item)) {
      assertOnlyEnumerableKeys(item, nestedKeys, key);
      result[key] = omitKnownUndefined(item);
    } else {
      result[key] = item;
    }
  }
  return result;
}

function normalizePersonUpdate(input: MobilePersonUpdatePayload): MobilePersonUpdatePayload {
  assertOnlyEnumerableKeys(input, PERSON_UPDATE_KEYS, 'mobile person/update input');
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(input)) {
    if (item === undefined) continue;
    if (key === 'activityParticipation' && isPlainObject(item)) {
      assertOnlyEnumerableKeys(item, ACTIVITY_PARTICIPATION_KEYS, 'activityParticipation');
      result[key] = omitKnownUndefined(item);
      continue;
    }
    if (key === 'healthRecord' && isPlainObject(item)) {
      assertOnlyEnumerableKeys(item, HEALTH_RECORD_KEYS, 'healthRecord');
      result[key] = omitKnownUndefined(item);
      continue;
    }
    result[key] = item;
  }
  return result as MobilePersonUpdatePayload;
}

function normalizePersonVisitInput(
  input: MobilePersonVisitCreateInput,
): MobilePersonVisitCreateInput {
  assertOnlyEnumerableKeys(input, PERSON_VISIT_INPUT_KEYS, 'mobile person visit input');
  return Object.fromEntries(
    Object.entries(input).filter(([, item]) => item !== undefined),
  ) as MobilePersonVisitCreateInput;
}

function matchesPerson(person: Person, query: MobilePersonQuery): boolean {
  const keyword = (query.q ?? query.search ?? '').trim().toLocaleLowerCase();
  if (keyword) {
    const values = [
      person.name,
      person.address,
      person.idCard,
      person.phone ?? '',
      ...(person.tags ?? []),
    ];
    if (!values.some((value) => value.toLocaleLowerCase().includes(keyword))) {
      return false;
    }
  }
  if (query.gridId && person.gridId !== query.gridId) return false;
  if (query.houseId && person.houseId !== query.houseId) return false;
  if (query.type && person.type !== query.type) return false;
  if (query.risk && person.risk !== query.risk) return false;
  if (
    query.tag
    && !(person.tags ?? []).includes(query.tag)
    && !(person.careLabels ?? []).includes(query.tag as never)
  ) {
    return false;
  }
  return true;
}

function matchesVisit(visit: VisitRecord, query: MobileVisitQuery): boolean {
  if (query.gridId && visit.gridId !== query.gridId) return false;
  if (query.targetId && visit.targetId !== query.targetId) return false;
  if (query.targetType && visit.targetType !== query.targetType) return false;
  if (
    query.visitorName
    && !visit.visitorName.toLocaleLowerCase().includes(query.visitorName.trim().toLocaleLowerCase())
  ) {
    return false;
  }
  if (query.tag && !(visit.tags ?? []).includes(query.tag)) return false;
  return true;
}

function paginate<T>(items: T[], limit?: number, offset?: number): ApiListResponse<T> {
  const total = items.length;
  if (limit === undefined && offset === undefined) {
    return { items, total };
  }
  const resolvedOffset = offset ?? 0;
  const resolvedLimit = limit ?? 500;
  return {
    items: items.slice(resolvedOffset, resolvedOffset + resolvedLimit),
    total,
  };
}

function sortPeople(items: Person[]): Person[] {
  return [...items].sort((left, right) => (
    right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id)
  ));
}

function sortVisits(items: VisitRecord[], order: 'asc' | 'desc'): VisitRecord[] {
  const direction = order === 'asc' ? 1 : -1;
  return [...items].sort((left, right) => direction * (
    left.date.localeCompare(right.date) || left.id.localeCompare(right.id)
  ));
}

async function readMode(): Promise<MobileSandboxModeResult> {
  return getActiveMobileSandboxMode();
}

function isApiNotFound(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('API 404:');
}

async function fetchOptionalJson<T>(path: string): Promise<T | undefined> {
  try {
    return await fetchJson<T>(path);
  } catch (error) {
    if (isApiNotFound(error)) {
      return undefined;
    }
    throw error;
  }
}

async function fetchPeopleSeed(query: MobilePersonQuery): Promise<Person[]> {
  // API 先按领域条件收窄；pagination 留到 overlay replay 后统一重算。
  const { limit: _limit, offset: _offset, ...filters } = query;
  return (await listPeopleApi(filters)).items;
}

async function fetchVisitsSeed(query: MobileVisitQuery): Promise<VisitRecord[]> {
  // 只下载命中当前对象/筛选的 server baseline，避免每个详情页扫描全库。
  const { limit: _limit, offset: _offset, ...filters } = query;
  return (await listVisitsApi(filters)).items;
}

async function hydrateProjectionTargets<T extends { id: string }>(
  seed: readonly T[],
  events: readonly MobileSessionEventV1[],
  entity: 'person' | 'visit',
  fetchTarget: (targetId: string) => Promise<T | undefined>,
): Promise<T[]> {
  const knownTargets = new Set(seed.map((item) => item.id));
  const createdTargets = new Set(
    events.filter((event) => event.action === 'create').map((event) => event.targetId),
  );
  const missingTargets = [...new Set(
    events
      .filter((event) => event.action !== 'create')
      .map((event) => event.targetId)
      .filter((targetId) => !knownTargets.has(targetId) && !createdTargets.has(targetId)),
  )];
  if (missingTargets.length === 0) {
    return [...seed];
  }
  // 事件可能把原本不命中筛选的对象移入结果；补取其 server baseline 后再 replay。
  const hydrated = await Promise.all(missingTargets.map(async (targetId) => {
    const current = await fetchTarget(targetId);
    if (!current) {
      throw new MobileFacadeTargetNotFoundError(entity, targetId);
    }
    return current;
  }));
  return [...seed, ...hydrated];
}

async function projectSessionPeople(query: MobilePersonQuery = {}): Promise<ApiListResponse<Person>> {
  const filteredSeed = await fetchPeopleSeed(query);
  const events = getMobileSessionEvents('person');
  const seed = await hydrateProjectionTargets(
    filteredSeed,
    events,
    'person',
    (targetId) => fetchOptionalJson<Person>(`/people/${encodeURIComponent(targetId)}`),
  );
  const projected = applyMobileSessionEvents(seed, 'person', events);
  return paginate(sortPeople(projected.filter((person) => matchesPerson(person, query))), query.limit, query.offset);
}

async function projectSessionVisits(query: MobileVisitQuery = {}): Promise<ApiListResponse<VisitRecord>> {
  const filteredSeed = await fetchVisitsSeed(query);
  const events = getMobileSessionEvents('visit');
  const seed = await hydrateProjectionTargets(
    filteredSeed,
    events,
    'visit',
    (targetId) => fetchOptionalJson<VisitRecord>(`/visits/${encodeURIComponent(targetId)}`),
  );
  const projected = applyMobileSessionEvents(seed, 'visit', events);
  const filtered = projected.filter((visit) => matchesVisit(visit, query));
  return paginate(sortVisits(filtered, query.order ?? 'desc'), query.limit, query.offset);
}

async function projectSessionPerson(id: string): Promise<Person | undefined> {
  const events = getMobileSessionEvents('person').filter((event) => event.targetId === id);
  const hasCreate = events.some((event) => event.action === 'create');
  if (id.startsWith('session:person:') && !hasCreate) {
    return undefined;
  }
  const current = hasCreate
    ? undefined
    : await fetchOptionalJson<Person>(`/people/${encodeURIComponent(id)}`);
  const seed = current ? [current] : [];
  return applyMobileSessionEvents(seed, 'person', events)[0];
}

async function projectSessionVisit(id: string): Promise<VisitRecord | undefined> {
  const events = getMobileSessionEvents('visit').filter((event) => event.targetId === id);
  const hasCreate = events.some((event) => event.action === 'create');
  if (id.startsWith('session:visit:') && !hasCreate) {
    return undefined;
  }
  const current = hasCreate
    ? undefined
    : await fetchOptionalJson<VisitRecord>(`/visits/${encodeURIComponent(id)}`);
  const seed = current ? [current] : [];
  return applyMobileSessionEvents(seed, 'visit', events)[0];
}

async function listPeopleApi(query: MobilePersonQuery): Promise<ApiListResponse<Person>> {
  const { limit, offset, ...filters } = query;
  if (limit !== undefined || offset !== undefined) {
    return assertListResponse(
      await fetchJson<ApiListResponse<Person>>(
        `/people${buildQueryString({ ...filters, limit: limit ?? 500, offset: offset ?? 0 })}`,
      ),
      'people',
    );
  }
  return fetchAllListPages<Person>(async (page) => (
    assertListResponse(
      await fetchJson<ApiListResponse<Person>>(
        `/people${buildQueryString({ ...filters, ...page })}`,
      ),
      'people',
    )
  ));
}

async function listVisitsApi(query: MobileVisitQuery): Promise<ApiListResponse<VisitRecord>> {
  const { limit, offset, ...filters } = { order: 'desc' as const, ...query };
  if (limit !== undefined || offset !== undefined) {
    return assertListResponse(
      await fetchJson<ApiListResponse<VisitRecord>>(
        `/visits${buildQueryString({ ...filters, limit: limit ?? 500, offset: offset ?? 0 })}`,
      ),
      'visits',
    );
  }
  return fetchAllListPages<VisitRecord>(async (page) => (
    assertListResponse(
      await fetchJson<ApiListResponse<VisitRecord>>(
        `/visits${buildQueryString({ ...filters, ...page })}`,
      ),
      'visits',
    )
  ));
}

async function requireSessionPerson(id: string): Promise<Person> {
  const person = await projectSessionPerson(id);
  if (!person) {
    throw new MobileFacadeTargetNotFoundError('person', id);
  }
  return person;
}

async function resolvePersonAiPolicy(personId: string, loadedPerson?: Person): Promise<PersonAiPolicy> {
  const mode = await readMode();
  if (mode.mode !== 'session') {
    if (!loadedPerson) {
      await fetchJson<Person>(`/people/${encodeURIComponent(personId)}`);
    }
    return {
      allowed: true,
      contextId: personId,
      baseline: 'server',
      sessionOverlayExcluded: false,
      disclosure: SERVER_PERSON_AI_DISCLOSURE,
    };
  }

  const person = loadedPerson ?? await requireSessionPerson(personId);
  if (person.id !== personId) {
    throw new MobileFacadeTargetNotFoundError('person', personId);
  }
  if (person.id.startsWith('session:person:')) {
    return {
      allowed: false,
      reason: 'session-person',
      disclosure: SESSION_PERSON_AI_DISCLOSURE,
    };
  }

  const personEvents = getMobileSessionEvents('person');
  const visitEvents = getMobileSessionEvents('visit');
  const hasOverlay = personEvents.some((event) => event.targetId === person.id)
    || visitEvents.some((event) => (
      event.action === 'create'
      && isPlainObject(event.payload)
      && event.payload.targetId === person.id
    ));
  return {
    allowed: true,
    contextId: person.id,
    baseline: 'server',
    sessionOverlayExcluded: hasOverlay,
    disclosure: hasOverlay ? SERVER_BASELINE_AI_DISCLOSURE : SERVER_PERSON_AI_DISCLOSURE,
  };
}

export const personVisitFacade = {
  async listPeople(query: MobilePersonQuery = {}): Promise<ApiListResponse<Person>> {
    assertPagination(query.limit, query.offset);
    const mode = await readMode();
    return mode.mode === 'session' ? projectSessionPeople(query) : listPeopleApi(query);
  },

  async getPerson(id: string): Promise<Person | undefined> {
    const mode = await readMode();
    if (mode.mode === 'session') {
      return projectSessionPerson(id);
    }
    return fetchJson<Person>(`/people/${encodeURIComponent(id)}`);
  },

  async createPerson(input: MobilePersonCreatePayload): Promise<Person> {
    const payload = input;
    assertMobilePersonCreatePayload(payload);
    return executeMobileMutation({
      api: () => fetchJson<Person>('/people', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      session: (lease) => {
        lease.assertActive();
        const event = createMobileSessionEvent('person', 'create', '', payload);
        appendMobileSessionTransaction([event]);
        return { ...payload, id: event.targetId };
      },
    });
  },

  async updatePerson(id: string, input: MobilePersonUpdatePayload): Promise<Person> {
    const payload = normalizePersonUpdate(input);
    assertMobilePersonUpdatePayload(payload);
    return executeMobileMutation({
      api: () => fetchJson<Person>(`/people/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
      session: async (lease) => {
        const person = await requireSessionPerson(id);
        const event = createMobileSessionEvent('person', 'update', id, payload);
        lease.assertActive();
        appendMobileSessionTransaction([event]);
        return { ...person, ...payload, id };
      },
    });
  },

  async listVisits(query: MobileVisitQuery = {}): Promise<ApiListResponse<VisitRecord>> {
    assertPagination(query.limit, query.offset);
    const mode = await readMode();
    return mode.mode === 'session' ? projectSessionVisits(query) : listVisitsApi(query);
  },

  async getVisit(id: string): Promise<VisitRecord | undefined> {
    const mode = await readMode();
    if (mode.mode === 'session') {
      return projectSessionVisit(id);
    }
    return fetchJson<VisitRecord>(`/visits/${encodeURIComponent(id)}`);
  },

  async createPersonVisit(
    personId: string,
    input: MobilePersonVisitCreateInput,
  ): Promise<{ visit: VisitRecord; person: Person }> {
    const normalizedInput = normalizePersonVisitInput(input);
    return executeMobileMutation({
      api: async () => {
        const person = await fetchJson<Person>(`/people/${encodeURIComponent(personId)}`);
        const payload: MobileVisitCreatePayload = {
          targetId: person.id,
          targetType: 'person',
          gridId: person.gridId,
          visitorName: normalizedInput.visitorName,
          date: normalizedInput.date,
          content: normalizedInput.content,
          images: normalizedInput.images ?? [],
          tags: normalizedInput.tags ?? [],
        };
        assertMobileVisitCreatePayload(payload);
        const { targetId: _targetId, targetType: _targetType, ...apiPayload } = payload;
        const visit = await fetchJson<VisitRecord>(
          `/people/${encodeURIComponent(personId)}/visits`,
          { method: 'POST', body: JSON.stringify(apiPayload) },
        );
        return { visit, person: { ...person, updatedAt: visit.date } };
      },
      session: async (lease) => {
        const person = await requireSessionPerson(personId);
        const payload: MobileVisitCreatePayload = {
          targetId: person.id,
          targetType: 'person',
          gridId: person.gridId,
          visitorName: normalizedInput.visitorName,
          date: normalizedInput.date,
          content: normalizedInput.content,
          images: normalizedInput.images ?? [],
          tags: normalizedInput.tags ?? [],
        };
        assertMobileVisitCreatePayload(payload);
        const visitEvent = createMobileSessionEvent('visit', 'create', '', payload);
        const personEvent = createMobileSessionEvent('person', 'update', person.id, {
          updatedAt: payload.date,
        });
        lease.assertActive();
        appendMobileSessionTransaction([visitEvent, personEvent]);
        return {
          visit: { ...payload, id: visitEvent.targetId },
          person: { ...person, updatedAt: payload.date },
        };
      },
    });
  },

  async getPersonAiPolicy(personId: string, loadedPerson?: Person): Promise<PersonAiPolicy> {
    return resolvePersonAiPolicy(personId, loadedPerson);
  },

  async requestVisitOutline(personId: string): Promise<VisitOutlineResponse> {
    const policy = await resolvePersonAiPolicy(personId);
    if (policy.allowed === false) {
      return { allowed: false, policy };
    }
    const result = await secondaryAiRepository.sendMessage(
      'writing',
      VISIT_OUTLINE_PROMPT,
      policy.contextId,
    );
    return {
      allowed: true,
      policy,
      result,
      grounded: result.status === 'live'
        && result.provider === 'gemini'
        && result.context_applied === true,
    };
  },

  subscribe(listener: () => void): () => void {
    if (typeof window === 'undefined') {
      return () => undefined;
    }
    window.addEventListener(MOBILE_SANDBOX_CHANGE_EVENT, listener);
    return () => window.removeEventListener(MOBILE_SANDBOX_CHANGE_EVENT, listener);
  },
};
