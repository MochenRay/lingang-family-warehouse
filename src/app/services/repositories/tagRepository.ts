import type { ConflictRecord, House, Person, RiskLevel, VisitRecord } from '../../types/core';
import { callWithFallback, fetchJson, getDataMode } from '../api';
import { conflictRepository } from './conflictRepository';
import { houseRepository } from './houseRepository';
import { personRepository } from './personRepository';
import { visitRepository } from './visitRepository';

export type ManagedTagType = '普通标签' | '智能标签';
export type TagConditionField = 'age' | 'household_size' | 'person_type' | 'risk';
export type TagConditionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';

export interface TagCondition {
  field: TagConditionField;
  operator: TagConditionOperator;
  value: number | string;
}

export interface ManagedTagDefinition {
  id: string;
  name: string;
  type: ManagedTagType;
  category: string;
  description: string;
  riskLevel: RiskLevel;
  status: '启用' | '禁用';
  createTime: string;
  updateTime: string;
  creator: string;
  conditions: TagCondition[];
  isSystem: boolean;
  rules?: string[];
  judgmentCriteria?: string;
}

export interface ManagedTagSummary extends ManagedTagDefinition {
  coverageCount: number;
}

export interface TaggedPersonMatch {
  tagId: string;
  tagName: string;
  reasons: string[];
  source: 'manual' | 'smart';
}

export interface TaggedPersonRecord {
  person: Pick<Person, 'id' | 'name' | 'gender' | 'age' | 'address' | 'type' | 'risk'>;
  house?: Pick<House, 'communityName' | 'building' | 'unit' | 'room'>;
  lastVisitAt?: string;
  totalConflictCount: number;
  activeConflictCount: number;
  matchedTags: TaggedPersonMatch[];
}

export interface TagSnapshot {
  generatedAt: string;
  totalPeople: number;
  tags: ManagedTagSummary[];
  people: TaggedPersonRecord[];
}

export interface CreateTagInput {
  name: string;
  type: 'ordinary' | 'smart';
  description: string;
  category: string;
  riskLevel: RiskLevel;
  conditions: TagCondition[];
}

interface ApiTagDefinition {
  id: string;
  name: string;
  type: 'ordinary' | 'smart';
  description: string;
  category: string;
  riskLevel: RiskLevel;
  status: string;
  conditions: TagCondition[];
  isSystem: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  coverageCount: number;
}

interface ApiTagSnapshot {
  generatedAt: string;
  totalPeople: number;
  tags: ApiTagDefinition[];
  people: TaggedPersonRecord[];
}

const TAG_WRITE_TOKEN_KEY = 'homedata.tag_write_token';
const FIELD_LABEL: Record<TagConditionField, string> = {
  age: '年龄',
  household_size: '同住人数',
  person_type: '居住类型',
  risk: '风险等级',
};
const OPERATOR_LABEL: Record<TagConditionOperator, string> = {
  eq: '=',
  neq: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
};

const FALLBACK_DEFINITION_BASE: Array<Omit<ManagedTagDefinition, 'rules' | 'judgmentCriteria'>> = [
  {
    id: 'tag_released_offender', name: '刑满释放', type: '普通标签', category: '重点关注',
    description: '刑满释放后纳入社区衔接与服务台账的人员。', riskLevel: 'High', status: '启用',
    createTime: '2026-07-30', updateTime: '2026-07-30', creator: '系统', conditions: [], isSystem: true,
  },
  {
    id: 'tag_drug_history', name: '吸毒人员', type: '普通标签', category: '重点关注',
    description: '需要由工作人员根据线下核实结果人工维护的重点人员标签。', riskLevel: 'High', status: '启用',
    createTime: '2026-07-30', updateTime: '2026-07-30', creator: '系统', conditions: [], isSystem: true,
  },
  {
    id: 'tag_senior', name: '高龄老人', type: '智能标签', category: '重点关爱',
    description: '年龄达到 80 岁后自动纳入高龄关爱范围。', riskLevel: 'Medium', status: '启用',
    createTime: '2026-07-30', updateTime: '2026-07-30', creator: '系统',
    conditions: [{ field: 'age', operator: 'gte', value: 80 }], isSystem: true,
  },
  {
    id: 'tag_high_age_living_alone', name: '高龄独居', type: '智能标签', category: '重点关爱',
    description: '年龄达到 80 岁且当前同住人数不超过 1 人。', riskLevel: 'High', status: '启用',
    createTime: '2026-07-30', updateTime: '2026-07-30', creator: '系统',
    conditions: [{ field: 'age', operator: 'gte', value: 80 }, { field: 'household_size', operator: 'lte', value: 1 }], isSystem: true,
  },
  {
    id: 'tag_key_stability_control', name: '重点稳控', type: '智能标签', category: '重点关注',
    description: '高风险对象或带有重点关注类型，需纳入稳控台账。', riskLevel: 'High', status: '启用',
    createTime: '2026-07-30', updateTime: '2026-07-30', creator: '系统',
    conditions: [{ field: 'risk', operator: 'eq', value: 'High' }], isSystem: true,
  },
  {
    id: 'tag_frequent_conflict', name: '矛盾频发', type: '智能标签', category: '矛盾治理',
    description: '存在未化解纠纷或多次纠纷关联，需要协同调处。', riskLevel: 'Medium', status: '启用',
    createTime: '2026-07-30', updateTime: '2026-07-30', creator: '系统',
    conditions: [{ field: 'risk', operator: 'neq', value: 'Low' }], isSystem: true,
  },
  {
    id: 'tag_pending_followup', name: '待回访', type: '智能标签', category: '走访治理',
    description: '存在未化解纠纷或重点对象走访间隔超过 14 天。', riskLevel: 'Medium', status: '启用',
    createTime: '2026-07-30', updateTime: '2026-07-30', creator: '系统',
    conditions: [{ field: 'risk', operator: 'neq', value: 'Low' }], isSystem: true,
  },
  {
    id: 'tag_long_time_no_visit', name: '长期未访', type: '智能标签', category: '走访治理',
    description: '没有走访记录或最近一次走访已超过 30 天。', riskLevel: 'Medium', status: '启用',
    createTime: '2026-07-30', updateTime: '2026-07-30', creator: '系统',
    conditions: [{ field: 'risk', operator: 'neq', value: 'Low' }], isSystem: true,
  },
];

const FALLBACK_DEFINITIONS: ManagedTagDefinition[] = FALLBACK_DEFINITION_BASE.map((definition) => ({
  ...definition,
  rules: definition.conditions.map(formatCondition),
  judgmentCriteria: definition.type === '智能标签' ? definition.description : undefined,
}));

function formatCondition(condition: TagCondition): string {
  const displayedValue = condition.field === 'risk'
    ? ({ High: '高风险', Medium: '中风险', Low: '低风险' }[String(condition.value)] ?? condition.value)
    : condition.value;
  return `${FIELD_LABEL[condition.field]} ${OPERATOR_LABEL[condition.operator]} ${displayedValue}`;
}

function toManagedTag(tag: ApiTagDefinition): ManagedTagSummary {
  return {
    id: tag.id,
    name: tag.name,
    type: tag.type === 'ordinary' ? '普通标签' : '智能标签',
    category: tag.category,
    description: tag.description,
    riskLevel: tag.riskLevel,
    status: tag.status === 'enabled' ? '启用' : '禁用',
    createTime: tag.createdAt,
    updateTime: tag.updatedAt,
    creator: tag.createdBy,
    conditions: tag.conditions,
    isSystem: tag.isSystem,
    rules: tag.conditions.map(formatCondition),
    judgmentCriteria: tag.type === 'smart' ? tag.description : undefined,
    coverageCount: tag.coverageCount,
  };
}

function adaptSnapshot(snapshot: ApiTagSnapshot): TagSnapshot {
  return {
    generatedAt: snapshot.generatedAt,
    totalPeople: snapshot.totalPeople,
    tags: snapshot.tags.map(toManagedTag),
    people: snapshot.people,
  };
}

function parseDate(raw?: string): Date | null {
  if (!raw) return null;
  const parsed = new Date(raw.trim().replace(/\//g, '-').replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function diffDays(now: Date, raw?: string): number | null {
  const parsed = parseDate(raw);
  return parsed ? Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / 86_400_000)) : null;
}

function buildVisitIndex(visits: VisitRecord[]): Map<string, VisitRecord[]> {
  const index = new Map<string, VisitRecord[]>();
  visits.forEach((visit) => index.set(visit.targetId, [...(index.get(visit.targetId) ?? []), visit]));
  return index;
}

function buildConflictIndex(conflicts: ConflictRecord[]): Map<string, ConflictRecord[]> {
  const index = new Map<string, ConflictRecord[]>();
  conflicts.forEach((conflict) => conflict.involvedParties
    .filter((party) => party.type === 'resident')
    .forEach((party) => index.set(party.id, [...(index.get(party.id) ?? []), conflict])));
  return index;
}

function deriveFallbackMatches(
  person: Person,
  house: House | undefined,
  visits: VisitRecord[],
  conflicts: ConflictRecord[],
  now: Date,
): TaggedPersonMatch[] {
  const matches: TaggedPersonMatch[] = [];
  const lastVisit = [...visits].sort((a, b) => (parseDate(b.date)?.getTime() ?? 0) - (parseDate(a.date)?.getTime() ?? 0))[0];
  const daysSinceLastVisit = diffDays(now, lastVisit?.date);
  const activeConflicts = conflicts.filter((conflict) => conflict.status !== '已化解').length;
  const focusTypes = person.categoryLabels?.focusType ?? [];
  const add = (tagId: string, tagName: string, reasons: string[]) => matches.push({ tagId, tagName, reasons, source: 'smart' });

  if (person.age >= 80) add('tag_senior', '高龄老人', [`年龄 ${person.age} 岁`]);
  if (person.age >= 80 && house && house.memberCount <= 1) {
    add('tag_high_age_living_alone', '高龄独居', [`年龄 ${person.age} 岁`, `当前同住 ${house.memberCount} 人`]);
  }
  if (person.risk === 'High' || focusTypes.length > 0 || person.tags.includes('重点关注')) {
    add('tag_key_stability_control', '重点稳控', ['高风险或存在重点关注类型']);
  }
  if (activeConflicts >= 1 || conflicts.length >= 2) {
    add('tag_frequent_conflict', '矛盾频发', [`关联纠纷 ${conflicts.length} 起，其中未化解 ${activeConflicts} 起`]);
  }
  if (activeConflicts >= 1 || (daysSinceLastVisit !== null && daysSinceLastVisit >= 14 && person.risk !== 'Low')) {
    add('tag_pending_followup', '待回访', [activeConflicts ? '存在未化解纠纷' : `距最近走访 ${daysSinceLastVisit} 天`]);
  }
  if (!lastVisit || (daysSinceLastVisit !== null && daysSinceLastVisit >= 30)) {
    add('tag_long_time_no_visit', '长期未访', [lastVisit ? `距最近走访 ${daysSinceLastVisit} 天` : '暂无走访记录']);
  }
  return matches;
}

async function buildFallbackSnapshot(): Promise<TagSnapshot> {
  const now = new Date();
  const [people, houses, visits, conflicts] = await Promise.all([
    personRepository.getPeople({ limit: 500 }),
    houseRepository.getHouses({ limit: 500 }),
    visitRepository.getVisits({ limit: 500, order: 'desc' }),
    conflictRepository.getConflicts({ limit: 500 }),
  ]);
  const houseById = new Map(houses.map((house) => [house.id, house]));
  const personVisits = buildVisitIndex(visits.filter((visit) => visit.targetType === 'person'));
  const houseVisits = buildVisitIndex(visits.filter((visit) => visit.targetType === 'house'));
  const personConflicts = buildConflictIndex(conflicts);
  const records = people.map((person): TaggedPersonRecord => {
    const house = person.houseId ? houseById.get(person.houseId) : undefined;
    const relatedVisits = [...(personVisits.get(person.id) ?? []), ...(person.houseId ? houseVisits.get(person.houseId) ?? [] : [])];
    const relatedConflicts = personConflicts.get(person.id) ?? [];
    return {
      person,
      house,
      lastVisitAt: [...relatedVisits].sort((a, b) => b.date.localeCompare(a.date))[0]?.date,
      totalConflictCount: relatedConflicts.length,
      activeConflictCount: relatedConflicts.filter((conflict) => conflict.status !== '已化解').length,
      matchedTags: deriveFallbackMatches(person, house, relatedVisits, relatedConflicts, now),
    };
  });
  const tags = FALLBACK_DEFINITIONS.map((definition) => ({
    ...definition,
    coverageCount: records.filter((record) => record.matchedTags.some((match) => match.tagId === definition.id)).length,
  }));
  return { generatedAt: now.toISOString(), totalPeople: people.length, tags, people: records };
}

function tagHeaders(token?: string): HeadersInit {
  const resolved = token ?? tagRepository.getStoredWriteToken();
  return resolved ? { 'X-Tag-Write-Token': resolved } : {};
}

export function millisecondsUntilNextShanghaiMidnight(now = new Date()): number {
  const shanghaiParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(shanghaiParts.map((part) => [part.type, part.value]));
  const nextMidnightUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + 1) - 8 * 60 * 60 * 1000;
  return Math.max(1_000, nextMidnightUtc - now.getTime());
}

export const tagRepository = {
  async getSnapshot(): Promise<TagSnapshot> {
    return callWithFallback(
      () => fetchJson<ApiTagSnapshot>('/tags/snapshot').then(adaptSnapshot),
      buildFallbackSnapshot,
    );
  },

  async createTag(input: CreateTagInput, token?: string): Promise<ManagedTagSummary> {
    if (getDataMode() === 'fallback') throw new Error('新增标签需要连接后端 API');
    const created = await fetchJson<ApiTagDefinition>('/tags', {
      method: 'POST',
      headers: tagHeaders(token),
      body: JSON.stringify(input),
    });
    return toManagedTag(created);
  },

  async assignOrdinaryTag(tagId: string, personId: string, token?: string): Promise<void> {
    if (getDataMode() === 'fallback') throw new Error('人工标签分配需要连接后端 API');
    await fetchJson(`/tags/${tagId}/assignments/${personId}`, {
      method: 'PUT',
      headers: tagHeaders(token),
    });
  },

  async removeOrdinaryTag(tagId: string, personId: string, token?: string): Promise<void> {
    if (getDataMode() === 'fallback') throw new Error('人工标签分配需要连接后端 API');
    await fetchJson(`/tags/${tagId}/assignments/${personId}`, {
      method: 'DELETE',
      headers: tagHeaders(token),
    });
  },

  getStoredWriteToken(): string {
    return typeof window === 'undefined' ? '' : window.sessionStorage.getItem(TAG_WRITE_TOKEN_KEY) ?? '';
  },

  storeWriteToken(token: string): void {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(TAG_WRITE_TOKEN_KEY, token);
  },

  clearWriteToken(): void {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(TAG_WRITE_TOKEN_KEY);
  },
};
