import type { ConflictRecord, House, Person, VisitRecord } from '../../types/core';
import { conflictRepository } from './conflictRepository';
import { houseRepository } from './houseRepository';
import { personRepository } from './personRepository';
import { visitRepository } from './visitRepository';

type ManagedTagType = '规则标签' | '智能标签';
type ManagedTagStatus = '启用' | '禁用';
type RiskLevel = 'High' | 'Medium' | 'Low';

export interface ManagedTagDefinition {
  id: string;
  name: string;
  type: ManagedTagType;
  category: string;
  description: string;
  riskLevel: RiskLevel;
  status: ManagedTagStatus;
  createTime: string;
  updateTime: string;
  creator: string;
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
}

export interface TaggedPersonRecord {
  person: Person;
  house?: House;
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

const TAG_DEFINITIONS: ManagedTagDefinition[] = [
  {
    id: 'tag_high_age_living_alone',
    name: '高龄独居',
    type: '规则标签',
    category: '重点关爱',
    description: '年龄较高且独居或单人居住，需优先纳入关爱随访。',
    riskLevel: 'High',
    status: '启用',
    createTime: '2026-04-17',
    updateTime: '2026-04-17',
    creator: '系统规则',
    rules: ['年龄 >= 75', '存在独居标识或房屋同住人数 <= 1'],
  },
  {
    id: 'tag_key_stability_control',
    name: '重点稳控',
    type: '规则标签',
    category: '重点关注',
    description: '高风险对象或带有重点关注类型，需纳入稳控台账。',
    riskLevel: 'High',
    status: '启用',
    createTime: '2026-04-17',
    updateTime: '2026-04-17',
    creator: '系统规则',
    rules: ['风险等级 = High 或 focusType 非空', '命中重点关注显式标签'],
  },
  {
    id: 'tag_frequent_conflict',
    name: '矛盾频发',
    type: '规则标签',
    category: '矛盾治理',
    description: '近阶段存在未化解纠纷或多次纠纷关联，需要协同调处。',
    riskLevel: 'Medium',
    status: '启用',
    createTime: '2026-04-17',
    updateTime: '2026-04-17',
    creator: '系统规则',
    rules: ['关联未化解纠纷 >= 1 或关联纠纷总数 >= 2'],
  },
  {
    id: 'tag_pending_followup',
    name: '待回访',
    type: '智能标签',
    category: '走访治理',
    description: '近期存在重点回访需求或跟进间隔偏长，需要补一次回访。',
    riskLevel: 'Medium',
    status: '启用',
    createTime: '2026-04-17',
    updateTime: '2026-04-17',
    creator: '系统推导',
    judgmentCriteria: '重点对象 / 未化解纠纷 / 上次走访超过 14 天 的对象自动纳入待回访。',
  },
  {
    id: 'tag_long_time_no_visit',
    name: '长期未访',
    type: '智能标签',
    category: '走访治理',
    description: '长时间无走访记录或显式标记为长期未走访，需要优先补访。',
    riskLevel: 'Medium',
    status: '启用',
    createTime: '2026-04-17',
    updateTime: '2026-04-17',
    creator: '系统推导',
    judgmentCriteria: '最近一次走访超过 30 天，或对象/房屋带有长期未走访线索。',
  },
];

function parseDate(raw?: string): Date | null {
  if (!raw) {
    return null;
  }

  const normalized = raw.trim().replace(/\//g, '-');
  const withTime = normalized.includes('T') ? normalized : normalized.replace(' ', 'T');
  const parsed = new Date(withTime);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function diffDays(now: Date, raw?: string): number | null {
  const parsed = parseDate(raw);
  if (!parsed) {
    return null;
  }
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24)));
}

function includesAny(source: string[], keywords: string[]): boolean {
  const lowered = source.map((item) => item.toLowerCase());
  return keywords.some((keyword) => lowered.some((item) => item.includes(keyword.toLowerCase())));
}

function formatFocusTypes(person: Person): string[] {
  const focusType = person.categoryLabels?.focusType;
  return Array.isArray(focusType) ? focusType : [];
}

function buildLabelPool(person: Person, house?: House): string[] {
  return [
    ...(person.tags ?? []),
    ...((person.careLabels ?? []) as string[]),
    ...formatFocusTypes(person),
    ...(house?.tags ?? []),
  ];
}

function buildVisitIndex(visits: VisitRecord[]): Map<string, VisitRecord[]> {
  const index = new Map<string, VisitRecord[]>();
  visits.forEach((visit) => {
    const current = index.get(visit.targetId) ?? [];
    current.push(visit);
    index.set(visit.targetId, current);
  });
  return index;
}

function buildConflictIndex(conflicts: ConflictRecord[]): Map<string, ConflictRecord[]> {
  const index = new Map<string, ConflictRecord[]>();
  conflicts.forEach((conflict) => {
    conflict.involvedParties
      .filter((party) => party.type === 'resident')
      .forEach((party) => {
        const current = index.get(party.id) ?? [];
        current.push(conflict);
        index.set(party.id, current);
      });
  });
  return index;
}

function sortVisits(visits: VisitRecord[]): VisitRecord[] {
  return [...visits].sort((left, right) => {
    const leftAt = parseDate(left.date)?.getTime() ?? 0;
    const rightAt = parseDate(right.date)?.getTime() ?? 0;
    return rightAt - leftAt;
  });
}

function deriveMatches(
  person: Person,
  house: House | undefined,
  visits: VisitRecord[],
  conflicts: ConflictRecord[],
  now: Date,
): TaggedPersonMatch[] {
  const matches: TaggedPersonMatch[] = [];
  const labels = buildLabelPool(person, house);
  const lastVisit = sortVisits(visits)[0];
  const daysSinceLastVisit = diffDays(now, lastVisit?.date);
  const activeConflictCount = conflicts.filter((conflict) => conflict.status !== '已化解').length;
  const totalConflictCount = conflicts.length;

  const isOlderLivingAlone =
    person.age >= 75 &&
    (includesAny(labels, ['独居老人']) || (house?.memberCount ?? 0) <= 1);
  if (isOlderLivingAlone) {
    const reasons = [`年龄 ${person.age} 岁`];
    if (includesAny(labels, ['独居老人'])) {
      reasons.push('存在独居老人标签或关爱标识');
    }
    if ((house?.memberCount ?? 99) <= 1) {
      reasons.push(`房屋登记同住人数 ${house?.memberCount ?? 1} 人`);
    }
    matches.push({
      tagId: 'tag_high_age_living_alone',
      tagName: '高龄独居',
      reasons,
    });
  }

  const focusTypes = formatFocusTypes(person);
  const isKeyStabilityControl =
    person.risk === 'High' ||
    focusTypes.length > 0 ||
    includesAny(labels, ['社区矫正', '安置帮教', '信访', '精神障碍', '吸毒', '重点关注']);
  if (isKeyStabilityControl) {
    const reasons = [];
    if (person.risk === 'High') {
      reasons.push('人员风险等级为 High');
    }
    if (focusTypes.length > 0) {
      reasons.push(`重点类型：${focusTypes.join('、')}`);
    }
    if (reasons.length === 0) {
      reasons.push('命中重点关注显式标签');
    }
    matches.push({
      tagId: 'tag_key_stability_control',
      tagName: '重点稳控',
      reasons,
    });
  }

  const isFrequentConflict = activeConflictCount >= 1 || totalConflictCount >= 2;
  if (isFrequentConflict) {
    const reasons = [];
    if (activeConflictCount >= 1) {
      reasons.push(`存在 ${activeConflictCount} 条未化解纠纷`);
    }
    if (totalConflictCount >= 2) {
      reasons.push(`累计关联 ${totalConflictCount} 条纠纷记录`);
    }
    matches.push({
      tagId: 'tag_frequent_conflict',
      tagName: '矛盾频发',
      reasons,
    });
  }

  const needsFollowUp =
    includesAny(labels, ['重点回访']) ||
    activeConflictCount >= 1 ||
    ((daysSinceLastVisit ?? 0) >= 14 && (person.risk !== 'Low' || isOlderLivingAlone));
  if (needsFollowUp) {
    const reasons = [];
    if (includesAny(labels, ['重点回访'])) {
      reasons.push('显式标记重点回访');
    }
    if (activeConflictCount >= 1) {
      reasons.push('存在未化解纠纷需继续跟进');
    }
    if ((daysSinceLastVisit ?? 0) >= 14) {
      reasons.push(`距最近一次走访已 ${daysSinceLastVisit} 天`);
    }
    matches.push({
      tagId: 'tag_pending_followup',
      tagName: '待回访',
      reasons,
    });
  }

  const isLongTimeNoVisit =
    includesAny(labels, ['长期未走访']) ||
    lastVisit == null ||
    (daysSinceLastVisit ?? 0) >= 30;
  if (isLongTimeNoVisit) {
    const reasons = [];
    if (includesAny(labels, ['长期未走访'])) {
      reasons.push('显式命中长期未走访线索');
    }
    if (lastVisit == null) {
      reasons.push('当前没有走访记录');
    } else if ((daysSinceLastVisit ?? 0) >= 30) {
      reasons.push(`距最近一次走访已 ${daysSinceLastVisit} 天`);
    }
    matches.push({
      tagId: 'tag_long_time_no_visit',
      tagName: '长期未访',
      reasons,
    });
  }

  return matches;
}

async function loadContext() {
  const [people, houses, visits, conflicts] = await Promise.all([
    personRepository.getPeople({ limit: 500 }),
    houseRepository.getHouses({ limit: 500 }),
    visitRepository.getVisits({ limit: 500, order: 'desc' }),
    conflictRepository.getConflicts({ limit: 500 }),
  ]);

  return { people, houses, visits, conflicts };
}

export const tagRepository = {
  async getSnapshot(): Promise<TagSnapshot> {
    const now = new Date();
    const { people, houses, visits, conflicts } = await loadContext();
    const houseById = new Map(houses.map((house) => [house.id, house]));
    const personVisits = buildVisitIndex(visits.filter((visit) => visit.targetType === 'person'));
    const houseVisits = buildVisitIndex(visits.filter((visit) => visit.targetType === 'house'));
    const personConflicts = buildConflictIndex(conflicts);

    const peopleRecords: TaggedPersonRecord[] = people.map((person) => {
      const house = person.houseId ? houseById.get(person.houseId) : undefined;
      const relatedVisits = [
        ...(personVisits.get(person.id) ?? []),
        ...(person.houseId ? houseVisits.get(person.houseId) ?? [] : []),
      ];
      const relatedConflicts = personConflicts.get(person.id) ?? [];
      const matchedTags = deriveMatches(person, house, relatedVisits, relatedConflicts, now);
      const lastVisitAt = sortVisits(relatedVisits)[0]?.date;
      return {
        person,
        house,
        lastVisitAt,
        totalConflictCount: relatedConflicts.length,
        activeConflictCount: relatedConflicts.filter((conflict) => conflict.status !== '已化解').length,
        matchedTags,
      };
    });

    const tags = TAG_DEFINITIONS.map((definition) => ({
      ...definition,
      coverageCount: peopleRecords.filter((record) =>
        record.matchedTags.some((match) => match.tagId === definition.id),
      ).length,
    }));

    return {
      generatedAt: now.toISOString(),
      totalPeople: people.length,
      tags,
      people: peopleRecords,
    };
  },
};
