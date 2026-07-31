import type { ConflictRecord, House, Person, VisitRecord } from '../../types/core';
import {
  buildQueryString,
  fetchAllListPages,
  fetchJson,
  type ApiListResponse,
} from '../api';
import type { ConflictContext } from '../repositories/conflictRepository';
import {
  assertMobileConflictCreatePayload,
  assertMobileConflictProgressInput,
  assertMobileConflictStatusPayload,
  assertMobileConflictUpdatePayload,
  type MobileConflictCreatePayload,
  type MobileConflictProgressInput,
  type MobileConflictStatusPayload,
  type MobileConflictUpdatePayload,
} from './conflictPayloads';
import { getActiveMobileSandboxMode } from './mode';
import { executeMobileMutation } from './mutation';
import {
  appendMobileSessionTransaction,
  applyMobileSessionEvents,
  createMobileSessionEvent,
  readMobileSessionEnvelope,
} from './store';
import { MOBILE_SANDBOX_CHANGE_EVENT } from './types';

const SESSION_CONFLICT_ID_PREFIX = 'session:conflict:';

export interface MobileConflictQuery {
  q?: string;
  search?: string;
  status?: ConflictRecord['status'];
  type?: ConflictRecord['type'];
  gridId?: string;
  personId?: string;
  houseId?: string;
  limit?: number;
  offset?: number;
}

export interface MobileConflictDetailResult {
  conflict: ConflictRecord;
  context: ConflictContext;
}

export class MobileConflictFacadeBlockedError extends Error {
  constructor(public readonly reason: string) {
    super(`Mobile conflict facade is blocked: ${reason}`);
    this.name = 'MobileConflictFacadeBlockedError';
  }
}

export class MobileConflictFacadeTargetNotFoundError extends Error {
  constructor(id: string) {
    super(`Mobile conflict target was not found: ${id}`);
    this.name = 'MobileConflictFacadeTargetNotFoundError';
  }
}

function assertPagination(limit?: number, offset?: number): void {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 500)) {
    throw new RangeError('Mobile conflict limit must be an integer from 1 to 500');
  }
  if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
    throw new RangeError('Mobile conflict offset must be a non-negative integer');
  }
}

function isSessionConflictId(id: string): boolean {
  return id.startsWith(SESSION_CONFLICT_ID_PREFIX);
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

async function fetchAllSeed<T>(path: string, label: string): Promise<T[]> {
  const result = await fetchAllListPages<T>(async (page) => (
    assertListResponse(
      await fetchJson<ApiListResponse<T>>(`${path}${buildQueryString({ ...page })}`),
      label,
    )
  ));
  if (result.items.length !== result.total) {
    throw new Error(`Incomplete ${label} API seed`);
  }
  return result.items;
}

function fetchAllConflictSeed(): Promise<ConflictRecord[]> {
  return fetchAllSeed<ConflictRecord>('/conflicts', 'conflicts');
}

function fetchAllPeopleSeed(): Promise<Person[]> {
  return fetchAllSeed<Person>('/people', 'people');
}

function fetchAllHouseSeed(): Promise<House[]> {
  return fetchAllSeed<House>('/houses', 'houses');
}

function fetchAllVisitSeed(): Promise<VisitRecord[]> {
  return fetchAllSeed<VisitRecord>('/visits', 'visits');
}

function parseBusinessTime(value?: string): number {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(
    value
      .replace(/\//g, '-')
      .replace('年', '-')
      .replace('月', '-')
      .replace('日', ''),
  );
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortConflicts(items: ConflictRecord[]): ConflictRecord[] {
  return [...items].sort((left, right) => (
    parseBusinessTime(right.updatedAt) - parseBusinessTime(left.updatedAt)
    || right.id.localeCompare(left.id)
  ));
}

function sortVisits(items: VisitRecord[]): VisitRecord[] {
  return [...items].sort((left, right) => (
    parseBusinessTime(right.date) - parseBusinessTime(left.date)
    || right.id.localeCompare(left.id)
  ));
}

function paginate<T>(items: T[], limit?: number, offset?: number): ApiListResponse<T> {
  const total = items.length;
  if (limit === undefined && offset === undefined) {
    return { items, total };
  }
  const resolvedOffset = offset ?? 0;
  return {
    items: items.slice(resolvedOffset, resolvedOffset + (limit ?? 500)),
    total,
  };
}

function matchesConflictQuery(
  conflict: ConflictRecord,
  query: MobileConflictQuery,
  people: readonly Person[] = [],
  houses: readonly House[] = [],
): boolean {
  const keyword = (query.q ?? query.search ?? '').trim();
  if (keyword) {
    const haystack = [
      conflict.title,
      conflict.description,
      conflict.location,
      ...conflict.involvedParties.map((party) => party.name),
    ].join('||');
    if (!haystack.includes(keyword)) {
      return false;
    }
  }
  if (query.status && conflict.status !== query.status) {
    return false;
  }
  if (query.type && conflict.type !== query.type) {
    return false;
  }
  if (query.gridId && conflict.gridId !== query.gridId) {
    return false;
  }
  if (
    query.personId
    && !conflict.involvedParties.some(
      (party) => party.type === 'resident' && party.id === query.personId,
    )
  ) {
    return false;
  }
  if (query.houseId) {
    const residentIds = new Set(
      people.filter((person) => person.houseId === query.houseId).map((person) => person.id),
    );
    const house = houses.find((item) => item.id === query.houseId);
    const location = conflict.location.toLowerCase();
    const matchesResident = conflict.involvedParties.some(
      (party) => party.type === 'resident' && residentIds.has(party.id),
    );
    const matchesAddress = house && location.length > 0
      ? location.includes(house.address.toLowerCase())
        || house.address.toLowerCase().includes(location)
      : false;
    if (!matchesResident && !matchesAddress) {
      return false;
    }
  }
  return true;
}

async function readConflictMode(): Promise<'api' | 'session'> {
  const result = await getActiveMobileSandboxMode();
  if (result.mode === 'api' || result.mode === 'session') {
    return result.mode;
  }
  throw new MobileConflictFacadeBlockedError(result.reason ?? 'mode-blocked');
}

async function listConflictsApi(query: MobileConflictQuery): Promise<ApiListResponse<ConflictRecord>> {
  const { limit, offset, ...filters } = query;
  if (limit !== undefined || offset !== undefined) {
    return assertListResponse(
      await fetchJson<ApiListResponse<ConflictRecord>>(
        `/conflicts${buildQueryString({ ...filters, limit: limit ?? 500, offset: offset ?? 0 })}`,
      ),
      'conflicts',
    );
  }
  return fetchAllListPages<ConflictRecord>(async (page) => (
    assertListResponse(
      await fetchJson<ApiListResponse<ConflictRecord>>(
        `/conflicts${buildQueryString({ ...filters, ...page })}`,
      ),
      'conflicts',
    )
  ));
}

async function projectSessionConflicts(
  query: MobileConflictQuery = {},
): Promise<ApiListResponse<ConflictRecord>> {
  const needsHouseData = Boolean(query.houseId);
  const [conflictSeed, peopleSeed, houseSeed] = await Promise.all([
    fetchAllConflictSeed(),
    needsHouseData ? fetchAllPeopleSeed() : Promise.resolve([] as Person[]),
    needsHouseData ? fetchAllHouseSeed() : Promise.resolve([] as House[]),
  ]);
  const events = readMobileSessionEnvelope().events;
  const conflicts = applyMobileSessionEvents(conflictSeed, 'conflict', events);
  const people = needsHouseData
    ? applyMobileSessionEvents(peopleSeed, 'person', events)
    : [];
  const houses = needsHouseData
    ? applyMobileSessionEvents(houseSeed, 'house', events)
    : [];
  const filtered = conflicts.filter((item) => matchesConflictQuery(item, query, people, houses));
  return paginate(sortConflicts(filtered), query.limit, query.offset);
}

function buildFollowUpStatus(
  conflict: ConflictRecord,
  recentVisits: VisitRecord[],
): ConflictContext['followUpStatus'] {
  if (conflict.status === '已化解') {
    return {
      code: 'resolved',
      label: '已化解，转入观察',
      detail: '当前案件已完成处置，建议保留一次回访观察，确认是否再次反复。',
    };
  }
  const lastTouchAt = Math.max(
    parseBusinessTime(conflict.updatedAt),
    ...recentVisits.map((visit) => parseBusinessTime(visit.date)),
  );
  if (!lastTouchAt) {
    return {
      code: 'needs-followup',
      label: '缺少最新跟进',
      detail: '当前案件缺少可确认的最新跟进记录，建议尽快补一次入户或电话回访。',
    };
  }
  const daysSinceTouch = Math.max(
    Math.floor((Date.now() - lastTouchAt) / (1000 * 60 * 60 * 24)),
    0,
  );
  if (daysSinceTouch >= 7) {
    return {
      code: 'overdue',
      label: '回访已超期',
      detail: `距离最近一次更新已超过 ${daysSinceTouch} 天，建议优先安排本周跟进。`,
    };
  }
  if (daysSinceTouch >= 3) {
    return {
      code: 'watch',
      label: '建议继续跟进',
      detail: `距离最近一次更新已 ${daysSinceTouch} 天，适合补一轮确认和结果回填。`,
    };
  }
  return {
    code: 'active',
    label: '近期已跟进',
    detail: '案件在最近几天内有更新，可继续围绕处置结果和回访安排推进。',
  };
}

function buildSuggestedActions(
  conflict: ConflictRecord,
  relatedPeople: Person[],
  relatedHouse: House | undefined,
  recentVisits: VisitRecord[],
): string[] {
  const actions: string[] = [];
  if (conflict.type === '物业纠纷') {
    actions.push('结合物业反馈和现场情况，确认是否涉及群租、消防隐患或公共秩序问题。');
  } else if (conflict.type === '家庭纠纷') {
    actions.push('优先梳理家庭成员诉求和赡养/照护分工，形成一轮书面调解纪要。');
  } else if (conflict.type === '邻里纠纷') {
    actions.push('明确争议发生时段、频次和影响范围，避免双方口径长期停留在感受层。');
  } else {
    actions.push('先补一轮事实核验，再决定是转调解、转条线还是继续社区跟进。');
  }
  if (recentVisits.length === 0) {
    actions.push('补一次带结果回填的走访，确保当事人、房屋和网格信息能互相印证。');
  }
  if (relatedPeople.some((person) => person.risk === 'High')) {
    actions.push('相关当事人中存在高风险对象，建议同步做重点对象复核。');
  }
  if (relatedHouse?.type === '出租') {
    actions.push('该案件关联出租房，建议同步核查同住关系、租住人数和居住合规情况。');
  }
  if (conflict.status !== '已化解') {
    actions.push('当前仍处调解中，建议补齐下一步责任人、时间点和回访口径。');
  }
  return actions.slice(0, 4);
}

function buildSessionContext(
  conflict: ConflictRecord,
  people: Person[],
  houses: House[],
  visits: VisitRecord[],
): ConflictContext {
  const relatedPersonIds = conflict.involvedParties
    .filter((party) => party.type === 'resident')
    .map((party) => party.id);
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const relatedPeople = relatedPersonIds
    .flatMap((id) => {
      const related = peopleById.get(id);
      return related ? [related] : [];
    })
    .sort((left, right) => (
      right.risk.localeCompare(left.risk)
      || right.updatedAt.localeCompare(left.updatedAt)
      || right.id.localeCompare(left.id)
    ));

  const houseIds = new Set(relatedPeople.map((person) => person.houseId).filter(Boolean));
  let relatedHouse: House | undefined;
  if (houseIds.size === 1) {
    relatedHouse = houses.find((house) => house.id === [...houseIds][0]);
  }
  if (!relatedHouse && conflict.location.trim()) {
    const location = conflict.location.toLowerCase();
    relatedHouse = houses.find((house) => {
      const address = house.address.toLowerCase();
      return location.includes(address) || address.includes(location);
    });
  }

  const relatedPersonIdSet = new Set(relatedPeople.map((person) => person.id));
  const recentVisits = sortVisits(visits.filter((visit) => (
    (visit.targetType === 'person' && relatedPersonIdSet.has(visit.targetId))
    || (visit.targetType === 'house' && relatedHouse?.id === visit.targetId)
  ))).slice(0, 5);

  return {
    relatedPeople,
    relatedHouse,
    recentVisits,
    followUpStatus: buildFollowUpStatus(conflict, recentVisits),
    suggestedActions: buildSuggestedActions(conflict, relatedPeople, relatedHouse, recentVisits),
  };
}

async function projectSessionDetail(id: string): Promise<MobileConflictDetailResult | undefined> {
  const [conflictSeed, peopleSeed, houseSeed, visitSeed] = await Promise.all([
    fetchAllConflictSeed(),
    fetchAllPeopleSeed(),
    fetchAllHouseSeed(),
    fetchAllVisitSeed(),
  ]);
  const events = readMobileSessionEnvelope().events;
  const conflict = applyMobileSessionEvents(conflictSeed, 'conflict', events)
    .find((item) => item.id === id);
  if (!conflict) {
    return undefined;
  }
  const people = applyMobileSessionEvents(peopleSeed, 'person', events);
  const houses = applyMobileSessionEvents(houseSeed, 'house', events);
  const visits = applyMobileSessionEvents(visitSeed, 'visit', events);
  return {
    conflict,
    context: buildSessionContext(conflict, people, houses, visits),
  };
}

async function requireSessionConflict(id: string): Promise<ConflictRecord> {
  const result = await projectSessionConflicts();
  const conflict = result.items.find((item) => item.id === id);
  if (!conflict) {
    throw new MobileConflictFacadeTargetNotFoundError(id);
  }
  return conflict;
}

function cloneCreatePayload(payload: MobileConflictCreatePayload): MobileConflictCreatePayload {
  return {
    ...payload,
    involvedParties: payload.involvedParties.map((party) => ({ ...party })),
    timeline: payload.timeline.map((entry) => ({ ...entry })),
    images: [...payload.images],
  };
}

function appendProgress(
  conflict: ConflictRecord,
  input: MobileConflictProgressInput,
): MobileConflictUpdatePayload {
  const payload: MobileConflictUpdatePayload = {
    timeline: [...conflict.timeline.map((entry) => ({ ...entry })), { ...input }],
    updatedAt: input.date,
  };
  assertMobileConflictUpdatePayload(payload);
  return payload;
}

export const conflictFacade = {
  async listConflicts(query: MobileConflictQuery = {}): Promise<ApiListResponse<ConflictRecord>> {
    assertPagination(query.limit, query.offset);
    const mode = await readConflictMode();
    return mode === 'session' ? projectSessionConflicts(query) : listConflictsApi(query);
  },

  async getConflict(id: string): Promise<ConflictRecord | undefined> {
    const mode = await readConflictMode();
    if (mode === 'session') {
      return (await projectSessionConflicts()).items.find((item) => item.id === id);
    }
    if (isSessionConflictId(id)) {
      return undefined;
    }
    return fetchJson<ConflictRecord>(`/conflicts/${encodeURIComponent(id)}`);
  },

  async getConflictContext(id: string): Promise<ConflictContext> {
    const mode = await readConflictMode();
    if (mode === 'session') {
      const detail = await projectSessionDetail(id);
      if (!detail) {
        throw new MobileConflictFacadeTargetNotFoundError(id);
      }
      return detail.context;
    }
    if (isSessionConflictId(id)) {
      throw new MobileConflictFacadeTargetNotFoundError(id);
    }
    return fetchJson<ConflictContext>(`/conflicts/${encodeURIComponent(id)}/context`);
  },

  async getConflictDetail(id: string): Promise<MobileConflictDetailResult | undefined> {
    const mode = await readConflictMode();
    if (mode === 'session') {
      return projectSessionDetail(id);
    }
    if (isSessionConflictId(id)) {
      return undefined;
    }
    const conflict = await fetchJson<ConflictRecord>(`/conflicts/${encodeURIComponent(id)}`);
    const context = await fetchJson<ConflictContext>(`/conflicts/${encodeURIComponent(id)}/context`);
    return { conflict, context };
  },

  async createConflict(input: MobileConflictCreatePayload): Promise<ConflictRecord> {
    const payload = cloneCreatePayload(input);
    assertMobileConflictCreatePayload(payload);
    return executeMobileMutation({
      api: () => fetchJson<ConflictRecord>('/conflicts', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      session: (lease) => {
        const event = createMobileSessionEvent('conflict', 'create', '', payload);
        lease.assertActive();
        appendMobileSessionTransaction([event]);
        return { id: event.targetId, ...cloneCreatePayload(payload) };
      },
    });
  },

  async addProgress(
    id: string,
    input: MobileConflictProgressInput,
  ): Promise<ConflictRecord> {
    assertMobileConflictProgressInput(input);
    return executeMobileMutation({
      api: async () => {
        if (isSessionConflictId(id)) {
          throw new MobileConflictFacadeTargetNotFoundError(id);
        }
        const conflict = await fetchJson<ConflictRecord>(`/conflicts/${encodeURIComponent(id)}`);
        const payload = appendProgress(conflict, input);
        return fetchJson<ConflictRecord>(`/conflicts/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      },
      session: async (lease) => {
        const conflict = await requireSessionConflict(id);
        const payload = appendProgress(conflict, input);
        const event = createMobileSessionEvent('conflict', 'update', id, payload);
        lease.assertActive();
        appendMobileSessionTransaction([event]);
        return { ...conflict, ...payload, id };
      },
    });
  },

  async markResolved(
    id: string,
    input: MobileConflictProgressInput,
  ): Promise<ConflictRecord> {
    assertMobileConflictProgressInput(input);
    const statusPayload: MobileConflictStatusPayload = { status: '已化解' };
    assertMobileConflictStatusPayload(statusPayload);
    return executeMobileMutation({
      api: async () => {
        if (isSessionConflictId(id)) {
          throw new MobileConflictFacadeTargetNotFoundError(id);
        }
        const conflict = await fetchJson<ConflictRecord>(`/conflicts/${encodeURIComponent(id)}`);
        const updatePayload = appendProgress(conflict, input);
        return fetchJson<ConflictRecord>(`/conflicts/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...statusPayload, ...updatePayload }),
        });
      },
      session: async (lease) => {
        const conflict = await requireSessionConflict(id);
        const updatePayload = appendProgress(conflict, input);
        const statusEvent = createMobileSessionEvent('conflict', 'status', id, statusPayload);
        const updateEvent = createMobileSessionEvent('conflict', 'update', id, updatePayload);
        lease.assertActive();
        appendMobileSessionTransaction([statusEvent, updateEvent]);
        return { ...conflict, ...statusPayload, ...updatePayload, id };
      },
    });
  },

  subscribe(listener: () => void): () => void {
    if (typeof window === 'undefined') {
      return () => undefined;
    }
    window.addEventListener(MOBILE_SANDBOX_CHANGE_EVENT, listener);
    return () => window.removeEventListener(MOBILE_SANDBOX_CHANGE_EVENT, listener);
  },
};
