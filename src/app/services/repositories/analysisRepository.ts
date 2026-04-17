import type { ConflictRecord, Grid, House, HousingHistory, Person, VisitRecord } from '../../types/core';
import { conflictRepository } from './conflictRepository';
import { houseRepository } from './houseRepository';
import { personRepository } from './personRepository';
import { taskRepository, type MobileTaskItem } from './taskRepository';
import { visitRepository } from './visitRepository';

export type AnalysisSeverity = 'high' | 'medium' | 'low';

export interface AnalysisGridMetric {
  id: string;
  name: string;
  districtName: string;
  streetName: string;
  communityName: string;
  peopleCount: number;
  houseCount: number;
  visitCount: number;
  conflictCount: number;
  activeConflictCount: number;
  resolvedConflictCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  floatingCount: number;
  elderlyCount: number;
  rentalCount: number;
  vacantCount: number;
  migrationInCount: number;
  migrationOutCount: number;
  pendingTaskCount: number;
  overdueTaskCount: number;
  completedTaskCount: number;
  visitCoverage: number;
  infoCompleteness: number;
  rentalRate: number;
  heatScore: number;
  statusLevel: AnalysisSeverity;
  primarySignals: string[];
}

export interface AnalysisAnomalyItem {
  id: string;
  gridId: string;
  gridName: string;
  type: string;
  indicator: string;
  value: string;
  baseline: string;
  severity: AnalysisSeverity;
  date: string;
  reason: string;
  impact: string;
}

export interface AnalysisMonthlyPoint {
  key: string;
  month: string;
  visits: number;
  conflicts: number;
  moveIns: number;
  moveOuts: number;
}

export interface AnalysisMigrationSpot {
  name: string;
  value: number;
}

export interface GovernanceAnalysisSnapshot {
  generatedAt: string;
  totals: {
    people: number;
    houses: number;
    visits: number;
    conflicts: number;
    pendingTasks: number;
    completedTasks: number;
  };
  grids: AnalysisGridMetric[];
  anomalies: AnalysisAnomalyItem[];
  monthly: AnalysisMonthlyPoint[];
  migration: {
    totalIn: number;
    totalOut: number;
    net: number;
    inboundHotspots: AnalysisMigrationSpot[];
    outboundHotspots: AnalysisMigrationSpot[];
  };
}

function parseDate(value?: string | null): Date | null {
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

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function parseGridHierarchy(name: string): { districtName: string; streetName: string; communityName: string } {
  let streetName = name;
  let communityName = name;

  if (name.includes('街道')) {
    const [prefix] = name.split('街道', 1);
    streetName = `${prefix}街道`;
    communityName = name.slice(streetName.length) || name;
  } else if (name.includes('镇')) {
    const [prefix] = name.split('镇', 1);
    streetName = `${prefix}镇`;
    communityName = name.slice(streetName.length) || name;
  }

  if (communityName.includes('第') && communityName.includes('网格')) {
    communityName = communityName.split('第', 1)[0];
  } else if (communityName.includes('网格')) {
    communityName = communityName.split('网格', 1)[0];
  }

  return {
    districtName: '海源示范片区',
    streetName: streetName.trim() || name,
    communityName: communityName.trim() || name,
  };
}

function getPersonCompleteness(person: Person): number {
  const fields = [
    Boolean(person.phone),
    Boolean(person.idCard),
    Boolean(person.address),
    Boolean(person.houseId),
    Boolean(person.updatedAt),
    Boolean(person.tags?.length),
  ];
  return fields.filter(Boolean).length / fields.length;
}

function getHouseCompleteness(house: House): number {
  const fields = [
    Boolean(house.ownerPhone),
    Boolean(house.area),
    Boolean(house.type),
    Boolean(house.occupancyStatus),
    Boolean(house.residenceType),
  ];
  return fields.filter(Boolean).length / fields.length;
}

function formatMonth(date: Date): string {
  return `${date.getMonth() + 1}月`;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthRange(months = 6): AnalysisMonthlyPoint[] {
  const now = new Date();
  const values: AnalysisMonthlyPoint[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  cursor.setMonth(cursor.getMonth() - (months - 1));

  for (let index = 0; index < months; index += 1) {
    const current = new Date(cursor.getFullYear(), cursor.getMonth() + index, 1);
    values.push({
      key: getMonthKey(current),
      month: formatMonth(current),
      visits: 0,
      conflicts: 0,
      moveIns: 0,
      moveOuts: 0,
    });
  }

  return values;
}

function groupTasksByGrid(tasks: MobileTaskItem[]): Map<string, MobileTaskItem[]> {
  const bucket = new Map<string, MobileTaskItem[]>();
  for (const task of tasks) {
    const items = bucket.get(task.gridId) ?? [];
    items.push(task);
    bucket.set(task.gridId, items);
  }
  return bucket;
}

function getHistoryPeriod(history: HousingHistory): { start?: Date; end?: Date } {
  const [startRaw, endRaw] = history.period.split('~').map((item) => item.trim());
  return {
    start: parseDate(startRaw),
    end: parseDate(endRaw),
  };
}

function severityRank(value: AnalysisSeverity): number {
  switch (value) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}

function buildGridMetric(
  grid: Grid,
  people: Person[],
  houses: House[],
  visits: VisitRecord[],
  conflicts: ConflictRecord[],
  histories: HousingHistory[],
  pendingTasks: MobileTaskItem[],
  completedTasks: MobileTaskItem[],
): AnalysisGridMetric {
  const { districtName, streetName, communityName } = parseGridHierarchy(grid.name);
  const peopleCount = people.length;
  const houseCount = houses.length;
  const visitCount = visits.length;
  const conflictCount = conflicts.length;
  const activeConflictCount = conflicts.filter((item) => item.status !== '已化解').length;
  const resolvedConflictCount = conflictCount - activeConflictCount;
  const highRiskCount = people.filter((item) => item.risk === 'High').length;
  const mediumRiskCount = people.filter((item) => item.risk === 'Medium').length;
  const floatingCount = people.filter((item) => item.type === '流动').length;
  const elderlyCount = people.filter((item) => item.age >= 60).length;
  const rentalCount = houses.filter((item) => item.type === '出租').length;
  const vacantCount = houses.filter((item) => item.type === '空置').length;
  const migrationInCount = histories.filter((item) => getHistoryPeriod(item).start).length;
  const migrationOutCount = histories.filter((item) => getHistoryPeriod(item).end).length;
  const pendingTaskCount = pendingTasks.length;
  const overdueTaskCount = pendingTasks.filter((task) => {
    const deadline = parseDate(task.deadline);
    return Boolean(deadline && deadline.getTime() < Date.now());
  }).length;
  const completedTaskCount = completedTasks.length;

  const visitedPeople = new Set(
    visits
      .filter((item) => item.targetType === 'person')
      .map((item) => item.targetId),
  );
  const visitCoverage = peopleCount
    ? Number(((visitedPeople.size / peopleCount) * 100).toFixed(1))
    : 0;
  const infoCompleteness = Number((
    average([
      ...people.map(getPersonCompleteness),
      ...houses.map(getHouseCompleteness),
    ]) * 100
  ).toFixed(1));
  const rentalRate = houseCount ? Number(((rentalCount / houseCount) * 100).toFixed(1)) : 0;
  const heatScore = Number(clamp(
    highRiskCount * 12
      + activeConflictCount * 15
      + overdueTaskCount * 18
      + pendingTaskCount * 6
      + rentalRate * 0.45
      + vacantCount * 4
      + Math.max(0, 55 - visitCoverage) * 0.8,
  ).toFixed(1));

  const primarySignals = [
    highRiskCount > 0 ? `高风险对象 ${highRiskCount} 人` : null,
    activeConflictCount > 0 ? `调解中纠纷 ${activeConflictCount} 起` : null,
    overdueTaskCount > 0 ? `超期待办 ${overdueTaskCount} 条` : null,
    rentalRate >= 30 ? `出租占比 ${rentalRate}%` : null,
    visitCoverage < 45 && peopleCount > 0 ? `走访覆盖 ${visitCoverage}%` : null,
  ].filter((item): item is string => Boolean(item));

  const statusLevel: AnalysisSeverity =
    heatScore >= 75 || overdueTaskCount >= 2 || activeConflictCount >= 2
      ? 'high'
      : heatScore >= 45 || pendingTaskCount > 0 || rentalRate >= 25
        ? 'medium'
        : 'low';

  return {
    id: grid.id,
    name: grid.name,
    districtName,
    streetName,
    communityName,
    peopleCount,
    houseCount,
    visitCount,
    conflictCount,
    activeConflictCount,
    resolvedConflictCount,
    highRiskCount,
    mediumRiskCount,
    floatingCount,
    elderlyCount,
    rentalCount,
    vacantCount,
    migrationInCount,
    migrationOutCount,
    pendingTaskCount,
    overdueTaskCount,
    completedTaskCount,
    visitCoverage,
    infoCompleteness,
    rentalRate,
    heatScore,
    statusLevel,
    primarySignals,
  };
}

function buildAnomalies(grids: AnalysisGridMetric[]): AnalysisAnomalyItem[] {
  const items: AnalysisAnomalyItem[] = [];
  for (const grid of grids) {
    if (grid.overdueTaskCount > 0) {
      items.push({
        id: `${grid.id}-overdue`,
        gridId: grid.id,
        gridName: grid.name,
        type: '跟进超期',
        indicator: '超期待办',
        value: `${grid.overdueTaskCount} 条`,
        baseline: '0 条',
        severity: grid.overdueTaskCount >= 2 ? 'high' : 'medium',
        date: new Date().toISOString().slice(0, 10),
        reason: '待回访或矛盾跟进已超过建议处置时限。',
        impact: '会直接拉高自由浏览时的风险感知，并影响督导闭环。',
      });
    }
    if (grid.activeConflictCount >= 2) {
      items.push({
        id: `${grid.id}-conflict`,
        gridId: grid.id,
        gridName: grid.name,
        type: '矛盾压力集中',
        indicator: '调解中纠纷',
        value: `${grid.activeConflictCount} 起`,
        baseline: '1 起以内',
        severity: grid.activeConflictCount >= 3 ? 'high' : 'medium',
        date: new Date().toISOString().slice(0, 10),
        reason: '近期未化解矛盾集中在同一网格，说明治理压力存在堆积。',
        impact: '需要优先安排回访、复盘责任分工与后续动作。',
      });
    }
    if (grid.visitCoverage < 45 && grid.peopleCount >= 20) {
      items.push({
        id: `${grid.id}-coverage`,
        gridId: grid.id,
        gridName: grid.name,
        type: '走访覆盖偏低',
        indicator: '人员触达率',
        value: `${grid.visitCoverage}%`,
        baseline: '45% 以上',
        severity: grid.visitCoverage < 30 ? 'high' : 'medium',
        date: new Date().toISOString().slice(0, 10),
        reason: '实际入户触达不足，导致画像、风险和任务闭环难以互证。',
        impact: '人物详情、待办和统计页之间的口径会更容易打架。',
      });
    }
    if (grid.rentalRate >= 35) {
      items.push({
        id: `${grid.id}-rental`,
        gridId: grid.id,
        gridName: grid.name,
        type: '出租密度偏高',
        indicator: '出租占比',
        value: `${grid.rentalRate}%`,
        baseline: '30% 以内',
        severity: grid.rentalRate >= 45 ? 'high' : 'medium',
        date: new Date().toISOString().slice(0, 10),
        reason: '出租房集中会放大群租、流动人口和秩序整治的治理压力。',
        impact: '房屋支持页、矛盾调解和移动待办会更频繁联动。',
      });
    }
    if (grid.highRiskCount >= 3) {
      items.push({
        id: `${grid.id}-risk`,
        gridId: grid.id,
        gridName: grid.name,
        type: '重点对象密集',
        indicator: '高风险对象',
        value: `${grid.highRiskCount} 人`,
        baseline: '2 人以内',
        severity: grid.highRiskCount >= 5 ? 'high' : 'medium',
        date: new Date().toISOString().slice(0, 10),
        reason: '高风险对象集中分布在单网格，需要更高频的走访和规则跟进。',
        impact: '如果不及时跟进，会同步拉高预警热度和绩效压力。',
      });
    }
  }

  return items
    .sort((left, right) => {
      const severityDiff = severityRank(right.severity) - severityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return left.gridName.localeCompare(right.gridName, 'zh-CN');
    })
    .slice(0, 12);
}

export const analysisRepository = {
  async getGovernanceSnapshot(): Promise<GovernanceAnalysisSnapshot> {
    const [grids, people, houses, visits, conflicts, taskFeed, histories] = await Promise.all([
      personRepository.getGrids(),
      personRepository.getPeople(),
      houseRepository.getHouses(),
      visitRepository.getVisits({ limit: 500 }),
      conflictRepository.getConflicts({ limit: 500 }),
      taskRepository.getTaskFeed(),
      houseRepository.getHousingHistoryRecords(),
    ]);

    const peopleByGrid = new Map<string, Person[]>();
    const housesByGrid = new Map<string, House[]>();
    const visitsByGrid = new Map<string, VisitRecord[]>();
    const conflictsByGrid = new Map<string, ConflictRecord[]>();
    const historiesByGrid = new Map<string, HousingHistory[]>();
    const housesById = new Map(houses.map((house) => [house.id, house]));
    const pendingByGrid = groupTasksByGrid(taskFeed.pending);
    const completedByGrid = groupTasksByGrid(taskFeed.completed);

    for (const person of people) {
      const bucket = peopleByGrid.get(person.gridId) ?? [];
      bucket.push(person);
      peopleByGrid.set(person.gridId, bucket);
    }
    for (const house of houses) {
      const bucket = housesByGrid.get(house.gridId) ?? [];
      bucket.push(house);
      housesByGrid.set(house.gridId, bucket);
    }
    for (const visit of visits) {
      const bucket = visitsByGrid.get(visit.gridId) ?? [];
      bucket.push(visit);
      visitsByGrid.set(visit.gridId, bucket);
    }
    for (const conflict of conflicts) {
      const bucket = conflictsByGrid.get(conflict.gridId) ?? [];
      bucket.push(conflict);
      conflictsByGrid.set(conflict.gridId, bucket);
    }
    for (const history of histories) {
      const house = housesById.get(history.houseId);
      if (!house) {
        continue;
      }
      const bucket = historiesByGrid.get(house.gridId) ?? [];
      bucket.push(history);
      historiesByGrid.set(house.gridId, bucket);
    }

    const gridMetrics = grids
      .map((grid) =>
        buildGridMetric(
          grid,
          peopleByGrid.get(grid.id) ?? [],
          housesByGrid.get(grid.id) ?? [],
          visitsByGrid.get(grid.id) ?? [],
          conflictsByGrid.get(grid.id) ?? [],
          historiesByGrid.get(grid.id) ?? [],
          pendingByGrid.get(grid.id) ?? [],
          completedByGrid.get(grid.id) ?? [],
        ),
      )
      .sort((left, right) => right.heatScore - left.heatScore || left.name.localeCompare(right.name, 'zh-CN'));

    const monthMap = new Map(getMonthRange().map((item) => [item.key, item]));
    for (const visit of visits) {
      const parsed = parseDate(visit.date);
      if (!parsed) {
        continue;
      }
      const point = monthMap.get(getMonthKey(parsed));
      if (point) {
        point.visits += 1;
      }
    }
    for (const conflict of conflicts) {
      const parsed = parseDate(conflict.updatedAt || conflict.createdAt);
      if (!parsed) {
        continue;
      }
      const point = monthMap.get(getMonthKey(parsed));
      if (point) {
        point.conflicts += 1;
      }
    }
    const inboundCounts = new Map<string, number>();
    const outboundCounts = new Map<string, number>();
    for (const history of histories) {
      const house = housesById.get(history.houseId);
      const areaName = house?.communityName ?? house?.address ?? '未识别房屋';
      const { start, end } = getHistoryPeriod(history);
      if (start) {
        const point = monthMap.get(getMonthKey(start));
        if (point) {
          point.moveIns += 1;
        }
        inboundCounts.set(areaName, (inboundCounts.get(areaName) ?? 0) + 1);
      }
      if (end) {
        const point = monthMap.get(getMonthKey(end));
        if (point) {
          point.moveOuts += 1;
        }
        outboundCounts.set(areaName, (outboundCounts.get(areaName) ?? 0) + 1);
      }
    }

    const monthly = Array.from(monthMap.values());
    const totalIn = monthly.reduce((sum, item) => sum + item.moveIns, 0);
    const totalOut = monthly.reduce((sum, item) => sum + item.moveOuts, 0);

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        people: people.length,
        houses: houses.length,
        visits: visits.length,
        conflicts: conflicts.length,
        pendingTasks: taskFeed.pending.length,
        completedTasks: taskFeed.completed.length,
      },
      grids: gridMetrics,
      anomalies: buildAnomalies(gridMetrics),
      monthly,
      migration: {
        totalIn,
        totalOut,
        net: totalIn - totalOut,
        inboundHotspots: Array.from(inboundCounts.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name, 'zh-CN'))
          .slice(0, 5),
        outboundHotspots: Array.from(outboundCounts.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name, 'zh-CN'))
          .slice(0, 5),
      },
    };
  },
};
