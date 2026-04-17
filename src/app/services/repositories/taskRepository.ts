import type { ConflictRecord, House, Person, VisitRecord } from '../../types/core';
import { buildQueryString, callWithFallback, fetchJson } from '../api';
import { conflictRepository, type ConflictContext } from './conflictRepository';
import { houseRepository } from './houseRepository';
import { mobileContextRepository } from './mobileContextRepository';
import { personRepository } from './personRepository';
import { visitRepository } from './visitRepository';

export type MobileTaskSourceKind = 'person' | 'conflict';
export type MobileTaskStatus = 'pending' | 'completed';

export interface MobileTaskItem {
  id: string;
  title: string;
  type: string;
  sourceKind: MobileTaskSourceKind;
  sourceId: string;
  gridId: string;
  route: string;
  priority: 'high' | 'medium' | 'low';
  urgent: boolean;
  description: string;
  assignedBy: string;
  deadline?: string;
  completedAt?: string;
  status: MobileTaskStatus;
  statusLabel: string;
  feedback?: string;
  personId?: string;
  houseId?: string;
  conflictId?: string;
  visitId?: string;
  onTime?: boolean;
}

export interface MobileTaskFeed {
  pending: MobileTaskItem[];
  completed: MobileTaskItem[];
  summary: {
    pending: number;
    overdue: number;
    completed: number;
    completionRate: number;
  };
}

export interface MobileTaskDetail extends MobileTaskItem {
  subjectName: string;
  context: {
    people: Array<{ id: string; name: string; risk?: string }>;
    house?: { id: string; address: string; type?: string; memberCount?: number };
    visits: Array<{ id: string; date: string; content: string }>;
    followUpStatus?: { code: string; label: string; detail: string };
    suggestedActions: string[];
  };
  primaryActionLabel: string;
  secondaryActionLabel: string;
  secondaryRoute: string;
}

function parseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\//g, '-');
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp);
}

function toDateTimeString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function addDays(value: string | undefined, days: number): string {
  const base = parseDate(value) ?? new Date();
  const next = new Date(base.getTime());
  next.setDate(next.getDate() + days);
  return toDateTimeString(next);
}

function getDaysDiff(value: string | undefined): number {
  const parsed = parseDate(value);
  if (!parsed) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)), 0);
}

function getCurrentWorkerName(): string {
  return mobileContextRepository.getCurrentWorkerName();
}

function getCurrentGridId(): string | undefined {
  return mobileContextRepository.getCurrentGridSelection().id;
}

function summarizeContent(content: string, maxLength = 64): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}...`;
}

function buildVisitTaskId(personId: string): string {
  return `visit__${personId}`;
}

function buildVisitDoneTaskId(visitId: string): string {
  return `visit_done__${visitId}`;
}

function buildConflictTaskId(conflictId: string): string {
  return `conflict__${conflictId}`;
}

function buildConflictDoneTaskId(conflictId: string): string {
  return `conflict_done__${conflictId}`;
}

function buildPendingVisitTasks(people: Person[], visitsByPersonId: Map<string, VisitRecord[]>): MobileTaskItem[] {
  return people
    .filter((person) => person.risk === 'High' || (person.careLabels?.length ?? 0) > 0)
    .map((person): MobileTaskItem | null => {
      const latestVisit = visitsByPersonId.get(person.id)?.[0];
      const daysSinceVisit = getDaysDiff(latestVisit?.date);
      if (latestVisit && daysSinceVisit < 7) {
        return null;
      }

      const hasPhone = Boolean(person.phone);
      const dueAt = latestVisit ? addDays(latestVisit.date, 7) : addDays(person.updatedAt, 1);
      const urgent = !latestVisit || daysSinceVisit >= 14 || person.risk === 'High';
      const signals = [
        person.risk === 'High' ? '高风险对象' : null,
        person.careLabels?.length ? `关爱标签：${person.careLabels.slice(0, 2).join('、')}` : null,
        !hasPhone ? '缺少联系电话' : null,
        latestVisit ? `距上次走访已 ${daysSinceVisit} 天` : '暂无历史走访',
      ].filter((item): item is string => Boolean(item));

      return {
        id: buildVisitTaskId(person.id),
        title: `${person.name}重点走访`,
        type: '重点走访',
        sourceKind: 'person',
        sourceId: person.id,
        gridId: person.gridId,
        route: `person-detail/${person.id}`,
        priority: urgent ? 'high' : 'medium',
        urgent,
        description: signals.join('，'),
        assignedBy: '系统研判',
        deadline: dueAt,
        status: 'pending',
        statusLabel: latestVisit ? '待回访' : '待首次走访',
        personId: person.id,
        houseId: person.houseId,
      };
    })
    .filter((item): item is MobileTaskItem => Boolean(item))
    .sort((left, right) => {
      const leftUrgent = left.urgent ? 1 : 0;
      const rightUrgent = right.urgent ? 1 : 0;
      if (leftUrgent !== rightUrgent) {
        return rightUrgent - leftUrgent;
      }
      return (parseDate(left.deadline)?.getTime() ?? 0) - (parseDate(right.deadline)?.getTime() ?? 0);
    })
    .slice(0, 12);
}

function buildCompletedVisitTasks(peopleById: Map<string, Person>, visits: VisitRecord[]): MobileTaskItem[] {
  return visits
    .filter((visit) => visit.targetType === 'person')
    .map((visit): MobileTaskItem | null => {
      const person = peopleById.get(visit.targetId);
      if (!person) {
        return null;
      }
      const daysSinceVisit = getDaysDiff(visit.date);
      if (daysSinceVisit > 30) {
        return null;
      }

      return {
        id: buildVisitDoneTaskId(visit.id),
        title: `完成走访：${person.name}`,
        type: '走访反馈',
        sourceKind: 'person',
        sourceId: person.id,
        gridId: person.gridId,
        route: `person-detail/${person.id}`,
        priority: person.risk === 'High' ? 'high' : 'medium',
        urgent: false,
        description: summarizeContent(visit.content, 72),
        assignedBy: visit.visitorName,
        completedAt: visit.date,
        status: 'completed',
        statusLabel: '已回访',
        feedback: summarizeContent(visit.content, 88),
        personId: person.id,
        houseId: person.houseId,
        visitId: visit.id,
        onTime: true,
      };
    })
    .filter((item): item is MobileTaskItem => Boolean(item))
    .sort((left, right) => (parseDate(right.completedAt)?.getTime() ?? 0) - (parseDate(left.completedAt)?.getTime() ?? 0))
    .slice(0, 12);
}

function buildPendingConflictTasks(conflicts: ConflictRecord[]): MobileTaskItem[] {
  return conflicts
    .filter((conflict) => conflict.status !== '已化解')
    .map((conflict): MobileTaskItem => {
      const daysSinceTouch = getDaysDiff(conflict.updatedAt);
      const urgent = daysSinceTouch >= 3 || conflict.source === '上级下派';
      return {
        id: buildConflictTaskId(conflict.id),
        title: `跟进：${conflict.title}`,
        type: '矛盾调解',
        sourceKind: 'conflict' as const,
        sourceId: conflict.id,
        gridId: conflict.gridId,
        route: `conflict-detail/${conflict.id}`,
        priority: urgent ? 'high' : 'medium',
        urgent,
        description: summarizeContent(conflict.description, 72),
        assignedBy: conflict.source,
        deadline: addDays(conflict.updatedAt || conflict.createdAt, 3),
        status: 'pending' as const,
        statusLabel: daysSinceTouch >= 7 ? '回访超期' : '待跟进',
        conflictId: conflict.id,
        personId: conflict.involvedParties.find((party) => party.type === 'resident')?.id,
      };
    })
    .sort((left, right) => {
      const leftUrgent = left.urgent ? 1 : 0;
      const rightUrgent = right.urgent ? 1 : 0;
      if (leftUrgent !== rightUrgent) {
        return rightUrgent - leftUrgent;
      }
      return (parseDate(left.deadline)?.getTime() ?? 0) - (parseDate(right.deadline)?.getTime() ?? 0);
    });
}

function buildCompletedConflictTasks(conflicts: ConflictRecord[]): MobileTaskItem[] {
  return conflicts
    .filter((conflict) => conflict.status === '已化解')
    .map((conflict): MobileTaskItem => ({
      id: buildConflictDoneTaskId(conflict.id),
      title: `完成调解：${conflict.title}`,
      type: '矛盾调解',
      sourceKind: 'conflict' as const,
      sourceId: conflict.id,
      gridId: conflict.gridId,
      route: `conflict-detail/${conflict.id}`,
      priority: 'medium',
      urgent: false,
      description: summarizeContent(conflict.description, 72),
      assignedBy: conflict.source,
      completedAt: conflict.updatedAt,
      status: 'completed' as const,
      statusLabel: '已化解',
      feedback: conflict.timeline[conflict.timeline.length - 1]?.content,
      conflictId: conflict.id,
      personId: conflict.involvedParties.find((party) => party.type === 'resident')?.id,
      onTime: getDaysDiff(conflict.updatedAt) <= 7,
    }))
    .sort((left, right) => (parseDate(right.completedAt)?.getTime() ?? 0) - (parseDate(left.completedAt)?.getTime() ?? 0))
    .slice(0, 12);
}

async function buildFallbackTaskFeed(): Promise<MobileTaskFeed> {
  const currentGridId = getCurrentGridId();
  const [people, conflicts, recentVisits] = await Promise.all([
    personRepository.getPeople({ limit: 500, gridId: currentGridId }),
    conflictRepository.getConflicts({ limit: 200, gridId: currentGridId }),
    visitRepository.getVisits({ targetType: 'person', limit: 500, order: 'desc', gridId: currentGridId }),
  ]);

  const peopleById = new Map(people.map((person) => [person.id, person]));
  const visitsByPersonId = new Map<string, VisitRecord[]>();
  for (const visit of recentVisits) {
    if (visit.targetType !== 'person') {
      continue;
    }
    const current = visitsByPersonId.get(visit.targetId) ?? [];
    current.push(visit);
    visitsByPersonId.set(visit.targetId, current);
  }

  for (const items of visitsByPersonId.values()) {
    items.sort((left, right) => (parseDate(right.date)?.getTime() ?? 0) - (parseDate(left.date)?.getTime() ?? 0));
  }

  const pending = [
    ...buildPendingConflictTasks(conflicts),
    ...buildPendingVisitTasks(people, visitsByPersonId),
  ].sort((left, right) => {
    const leftOverdue = (parseDate(left.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER) < Date.now() ? 1 : 0;
    const rightOverdue = (parseDate(right.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER) < Date.now() ? 1 : 0;
    if (leftOverdue !== rightOverdue) {
      return rightOverdue - leftOverdue;
    }
    if (left.urgent !== right.urgent) {
      return Number(right.urgent) - Number(left.urgent);
    }
    return (parseDate(left.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER) - (parseDate(right.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER);
  });

  const completed = [
    ...buildCompletedConflictTasks(conflicts),
    ...buildCompletedVisitTasks(peopleById, recentVisits),
  ].sort((left, right) => (parseDate(right.completedAt)?.getTime() ?? 0) - (parseDate(left.completedAt)?.getTime() ?? 0));

  const overdue = pending.filter((item) => (parseDate(item.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER) < Date.now()).length;
  const completionRate = pending.length + completed.length > 0
    ? Math.round((completed.length / (pending.length + completed.length)) * 100)
    : 100;

  return {
    pending,
    completed,
    summary: {
      pending: pending.length,
      overdue,
      completed: completed.length,
      completionRate,
    },
  };
}

function buildPersonTaskDetail(
  task: MobileTaskItem,
  person: Person,
  house: House | undefined,
  visits: VisitRecord[],
): MobileTaskDetail {
  const latestVisit = visits[0];
  return {
    ...task,
    subjectName: person.name,
    context: {
      people: [{ id: person.id, name: person.name, risk: person.risk }],
      house: house
        ? {
            id: house.id,
            address: house.address,
            type: house.type,
            memberCount: house.memberCount,
          }
        : undefined,
      visits: visits.slice(0, 5).map((visit) => ({
        id: visit.id,
        date: visit.date,
        content: summarizeContent(visit.content, 88),
      })),
      suggestedActions: [
        `优先核验 ${person.name} 的近况、联系方式和关爱标签是否仍然有效。`,
        latestVisit
          ? `最近一次走访在 ${latestVisit.date}，建议先跟进上次承诺事项。`
          : '暂无历史走访，建议本次补齐基础信息和重点诉求。',
        house ? `可同步核查关联房屋 ${house.address} 的居住状态和同住人员。` : '建议结合邻里和家庭关系补充居住环境信息。',
      ],
    },
    primaryActionLabel: task.status === 'pending' ? '登记走访并完成' : '查看人员详情',
    secondaryActionLabel: house ? '查看关联房屋' : '查看人员详情',
    secondaryRoute: house ? `house-detail/${house.id}` : `person-detail/${person.id}`,
  };
}

function buildConflictTaskDetail(
  task: MobileTaskItem,
  conflict: ConflictRecord,
  context: ConflictContext,
): MobileTaskDetail {
  return {
    ...task,
    subjectName: conflict.title,
    context: {
      people: context.relatedPeople.map((person) => ({
        id: person.id,
        name: person.name,
        risk: person.risk,
      })),
      house: context.relatedHouse
        ? {
            id: context.relatedHouse.id,
            address: context.relatedHouse.address,
            type: context.relatedHouse.type,
            memberCount: context.relatedHouse.memberCount,
          }
        : undefined,
      visits: context.recentVisits.map((visit) => ({
        id: visit.id,
        date: visit.date,
        content: summarizeContent(visit.content, 88),
      })),
      followUpStatus: context.followUpStatus,
      suggestedActions: context.suggestedActions,
    },
    primaryActionLabel: task.status === 'pending' ? '记录处置并完成' : '查看纠纷详情',
    secondaryActionLabel: context.relatedPeople[0] ? '查看关联人员' : '查看纠纷详情',
    secondaryRoute: context.relatedPeople[0]
      ? `person-detail/${context.relatedPeople[0].id}`
      : `conflict-detail/${conflict.id}`,
  };
}

export const taskRepository = {
  async getTaskFeed(): Promise<MobileTaskFeed> {
    return callWithFallback(
      async () => {
        const currentGridId = getCurrentGridId();
        return fetchJson<MobileTaskFeed>(`/task-rules/projection${buildQueryString({ gridId: currentGridId })}`);
      },
      () => buildFallbackTaskFeed(),
    );
  },

  async getTaskSummary(): Promise<MobileTaskFeed['summary']> {
    const feed = await this.getTaskFeed();
    return feed.summary;
  },

  async getTaskDetail(id: string): Promise<MobileTaskDetail | undefined> {
    const feed = await this.getTaskFeed();
    const task = [...feed.pending, ...feed.completed].find((item) => item.id === id);
    if (!task) {
      return undefined;
    }

    if (task.sourceKind === 'person' && task.personId) {
      const [person, visits] = await Promise.all([
        personRepository.getPerson(task.personId),
        visitRepository.getVisits({ targetId: task.personId, targetType: 'person', limit: 20, order: 'desc' }),
      ]);
      if (!person) {
        return undefined;
      }
      const house = person.houseId ? await houseRepository.getHouse(person.houseId) : undefined;
      return buildPersonTaskDetail(task, person, house, visits);
    }

    if (task.sourceKind === 'conflict' && task.conflictId) {
      const [conflict, context] = await Promise.all([
        conflictRepository.getConflict(task.conflictId),
        conflictRepository.getConflictContext(task.conflictId),
      ]);
      if (!conflict) {
        return undefined;
      }
      return buildConflictTaskDetail(task, conflict, context);
    }

    return undefined;
  },

  async completeTask(id: string, feedback: string): Promise<void> {
    const detail = await this.getTaskDetail(id);
    if (!detail) {
      throw new Error(`Task '${id}' not found`);
    }

    const operator = getCurrentWorkerName();
    const now = toDateTimeString(new Date());

    if (detail.sourceKind === 'person' && detail.personId) {
      await visitRepository.addPersonVisit(detail.personId, {
        gridId: detail.gridId,
        visitorName: operator,
        date: now,
        content: feedback.trim(),
        images: [],
        tags: ['任务回填', detail.type],
      });
      return;
    }

    if (detail.sourceKind === 'conflict' && detail.conflictId) {
      const conflict = await conflictRepository.getConflict(detail.conflictId);
      if (!conflict) {
        throw new Error(`Conflict '${detail.conflictId}' not found`);
      }
      await conflictRepository.updateConflict(detail.conflictId, {
        status: '已化解',
        updatedAt: now,
        timeline: [
          ...conflict.timeline,
          {
            date: now,
            content: feedback.trim(),
            operator,
          },
        ],
      });
    }
  },
};
