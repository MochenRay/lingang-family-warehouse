import type { Grid } from '../../types/core';
import { callWithFallback, fetchJson } from '../api';
import { db } from '../db';
import { taskRepository } from './taskRepository';
import { getRegionForGrid } from '../../config/regions';

export interface StatsGenderItem {
  name: string;
  value: number;
  color: string;
}

export interface StatsAgeItem {
  name: string;
  value: number;
  fill: string;
}

export interface StatsRiskTagItem {
  name: string;
  count: number;
  level: string;
  delta: string;
}

export interface StatsTrendItem {
  month: string;
  value: number;
}

export interface StatsHousingStats {
  total: number;
  selfOccupied: number;
  rental: number;
  vacant: number;
  commercial: number;
  buildings: number;
  avgArea: number;
  avgMembers: number;
  completionRate: number;
}

export interface StatsConflictStats {
  total: number;
  today: number;
  resolved: number;
  active: number;
  rate: number;
}

export interface StatsMobilePeopleStats {
  total: number;
  registered: number;
  floating: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

export interface StatsGridItem {
  id: string;
  name: string;
  parentId?: string | null;
  managerName?: string | null;
  districtName: string;
  streetName: string;
  communityName: string;
  gridLabel: string;
  peopleCount: number;
  houseCount: number;
  visitCount: number;
  conflictCount: number;
}

export type StatsRegionLevel = 'city' | 'district' | 'street' | 'community' | 'grid';

export interface StatsRegionSummary {
  id: string;
  level: StatsRegionLevel;
  name: string;
  parentName?: string | null;
  peopleCount: number;
  houseCount: number;
  visitCount: number;
  conflictCount: number;
  floatingCount: number;
  activeConflictCount: number;
  riskCount: number;
  score: number;
}

export interface StatsActionItem {
  id: string;
  title: string;
  description: string;
  area: string;
  priority: '高' | '中' | '低' | string;
  metric: string;
  route: string;
}

export interface StatsMetadata {
  generatedAt: string;
  totalGrids: number;
  totalPeople: number;
  totalHouses: number;
  totalVisits: number;
  totalConflicts: number;
}

export interface DashboardStatsResponse {
  metadata: StatsMetadata;
  totalPopulation: number;
  totalHouses: number;
  genderData: StatsGenderItem[];
  ageData: StatsAgeItem[];
  riskTagsSummary: StatsRiskTagItem[];
  trendData: StatsTrendItem[];
  housingStats: StatsHousingStats;
  conflictStats: StatsConflictStats;
  mobilePeopleStats: StatsMobilePeopleStats;
  grids: StatsGridItem[];
  regionSummaries: StatsRegionSummary[];
  actionItems: StatsActionItem[];
}

export interface GridStatsResponse {
  metadata: StatsMetadata;
  grids: StatsGridItem[];
}

export const PERFORMANCE_SCORE_WEIGHTS = {
  visitFreq: 0.25,
  visitQuality: 0.25,
  infoComplete: 0.20,
  taskCount: 0.15,
  taskSpeed: 0.15,
} as const;

export type PerformanceScoreKey = keyof typeof PERFORMANCE_SCORE_WEIGHTS;

export interface StatsPerformanceScore {
  visitFreq: number;
  visitQuality: number;
  infoComplete: number;
  taskCount: number;
  taskSpeed: number;
}

export interface StatsPerformanceItem {
  id: string;
  name: string;
  gridId: string;
  gridName: string;
  communityName: string;
  streetName: string;
  districtName: string;
  workerCount: number;
  visitCount: number;
  visitQuality: number;
  infoCompleteness: number;
  taskCompleted: number;
  pendingCount: number;
  overdueCount: number;
  scores: StatsPerformanceScore;
  totalScore: number;
}

export interface StatsPerformanceSummary {
  workerCount: number;
  avgScore: number;
  bestCommunity: string;
  needImproveCount: number;
}

export interface StatsQualityAlertItem {
  id: string;
  type: string;
  desc: string;
  count: number;
  area: string;
}

export interface PerformanceStatsResponse {
  metadata: StatsMetadata;
  weights: StatsPerformanceScore;
  workers: StatsPerformanceItem[];
  summary: StatsPerformanceSummary;
  qualityAlerts: StatsQualityAlertItem[];
}

const PERFORMANCE_DISTRICT_NAME = '蓬莱示范片区';

function clampScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function parseGridHierarchy(name: string, gridId?: string): { districtName: string; streetName: string; communityName: string; gridLabel: string } {
  const region = getRegionForGrid(gridId, name);
  if (region) {
    return {
      districtName: region.district,
      streetName: region.street,
      communityName: region.community,
      gridLabel: region.gridLabel,
    };
  }

  let streetName = name;
  let communityName = name;
  let gridLabel = name;

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
    gridLabel = `第${communityName.split('第', 1)[1]}`;
    communityName = communityName.split('第', 1)[0];
  } else if (communityName.includes('网格')) {
    gridLabel = `${communityName.split('网格', 1)[0]}网格`;
    communityName = communityName.split('网格', 1)[0];
  }

  return {
    districtName: PERFORMANCE_DISTRICT_NAME,
    streetName: streetName.trim() || name,
    communityName: communityName.trim() || name,
    gridLabel: gridLabel.trim() || name,
  };
}

function getPersonCompleteness(person: ReturnType<typeof db.getPeople>[number]): number {
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

function getHouseCompleteness(house: ReturnType<typeof db.getHouses>[number]): number {
  const fields = [
    Boolean(house.ownerPhone),
    Boolean(house.area),
    Boolean(house.type),
    Boolean(house.occupancyStatus),
    Boolean(house.residenceType),
  ];
  return fields.filter(Boolean).length / fields.length;
}

function getVisitQualityScore(visit: ReturnType<typeof db.getVisits>[number]): number {
  const contentLength = visit.content.trim().length;
  const tagBonus = Math.min((visit.tags?.length ?? 0) * 6, 18);
  const imageBonus = Math.min((visit.images?.length ?? 0) * 8, 16);
  const score = 42 + Math.min(contentLength * 0.6, 32) + tagBonus + imageBonus;
  return Number(clampScore(score, 45).toFixed(1));
}

function getWeightedTotal(scores: StatsPerformanceScore): number {
  return Number((
    scores.visitFreq * PERFORMANCE_SCORE_WEIGHTS.visitFreq +
    scores.visitQuality * PERFORMANCE_SCORE_WEIGHTS.visitQuality +
    scores.infoComplete * PERFORMANCE_SCORE_WEIGHTS.infoComplete +
    scores.taskCount * PERFORMANCE_SCORE_WEIGHTS.taskCount +
    scores.taskSpeed * PERFORMANCE_SCORE_WEIGHTS.taskSpeed
  ).toFixed(1));
}

async function buildFallbackPerformance(): Promise<PerformanceStatsResponse> {
  const grids = db.getGrids();
  const people = db.getPeople();
  const houses = db.getHouses();
  const visits = db.getVisits();
  const conflicts = db.getConflicts();
  const taskFeed = await taskRepository.getTaskFeed();

  const tasksByGrid = new Map<string, { pending: typeof taskFeed.pending; completed: typeof taskFeed.completed }>();
  for (const task of taskFeed.pending) {
    const bucket = tasksByGrid.get(task.gridId) ?? { pending: [], completed: [] };
    bucket.pending.push(task);
    tasksByGrid.set(task.gridId, bucket);
  }
  for (const task of taskFeed.completed) {
    const bucket = tasksByGrid.get(task.gridId) ?? { pending: [], completed: [] };
    bucket.completed.push(task);
    tasksByGrid.set(task.gridId, bucket);
  }

  const maxVisitCount = Math.max(...grids.map((grid) => visits.filter((visit) => visit.gridId === grid.id).length), 1);
  const maxCompletedCount = Math.max(
    ...grids.map((grid) => tasksByGrid.get(grid.id)?.completed.length ?? 0),
    1,
  );

  const workers = grids
    .map((grid): StatsPerformanceItem => {
      const gridPeople = people.filter((person) => person.gridId === grid.id);
      const gridHouses = houses.filter((house) => house.gridId === grid.id);
      const gridVisits = visits.filter((visit) => visit.gridId === grid.id);
      const gridTasks = tasksByGrid.get(grid.id) ?? { pending: [], completed: [] };
      const { districtName, streetName, communityName } = parseGridHierarchy(grid.name, grid.id);

      const visitCount = gridVisits.length;
      const visitFreq = Number(((visitCount / maxVisitCount) * 100).toFixed(1));
      const visitQuality = average(gridVisits.map(getVisitQualityScore));
      const infoComplete = Number((
        average([
          ...gridPeople.map(getPersonCompleteness),
          ...gridHouses.map(getHouseCompleteness),
        ]) * 100
      ).toFixed(1));
      const taskCount = Number((((gridTasks.completed.length || 0) / maxCompletedCount) * 100).toFixed(1));

      const onTimeFlags = gridTasks.completed
        .map((task) => task.onTime)
        .filter((value): value is boolean => typeof value === 'boolean');
      const onTimeRate = onTimeFlags.length
        ? (onTimeFlags.filter(Boolean).length / onTimeFlags.length) * 100
        : (gridTasks.pending.length ? 60 : 100);
      const overdueRatio = gridTasks.pending.length + gridTasks.completed.length > 0
        ? gridTasks.pending.filter((task) => task.deadline && new Date(task.deadline).getTime() < Date.now()).length
          / (gridTasks.pending.length + gridTasks.completed.length)
        : 0;
      const taskSpeed = Number(clampScore(onTimeRate * 0.7 + (1 - overdueRatio) * 30, 45).toFixed(1));

      const scores: StatsPerformanceScore = {
        visitFreq,
        visitQuality,
        infoComplete,
        taskCount,
        taskSpeed,
      };

      return {
        id: grid.id,
        name: grid.managerName || grid.name,
        gridId: grid.id,
        gridName: grid.name,
        communityName,
        streetName,
        districtName,
        workerCount: 1,
        visitCount,
        visitQuality,
        infoCompleteness: infoComplete,
        taskCompleted: gridTasks.completed.length,
        pendingCount: gridTasks.pending.length,
        overdueCount: gridTasks.pending.filter((task) => task.deadline && new Date(task.deadline).getTime() < Date.now()).length,
        scores,
        totalScore: getWeightedTotal(scores),
      };
    })
    .sort((left, right) => right.totalScore - left.totalScore || left.name.localeCompare(right.name, 'zh-CN'));

  const incompleteByGrid = new Map<string, number>();
  const overdueByGrid = new Map<string, number>();
  const lateClosedByGrid = new Map<string, number>();
  for (const grid of grids) {
    const gridPeople = people.filter((person) => person.gridId === grid.id);
    const gridHouses = houses.filter((house) => house.gridId === grid.id);
    const gridTasks = tasksByGrid.get(grid.id) ?? { pending: [], completed: [] };
    incompleteByGrid.set(
      grid.name,
      gridPeople.filter((person) => !person.phone || !person.houseId || !person.tags?.length).length
        + gridHouses.filter((house) => !house.ownerPhone || !house.area || !house.occupancyStatus || !house.residenceType).length,
    );
    overdueByGrid.set(
      grid.name,
      gridTasks.pending.filter((task) => task.deadline && new Date(task.deadline).getTime() < Date.now()).length,
    );
    lateClosedByGrid.set(
      grid.name,
      gridTasks.completed.filter((task) => task.onTime === false).length,
    );
  }

  const communityScores = new Map<string, number[]>();
  for (const worker of workers) {
    const scores = communityScores.get(worker.communityName) ?? [];
    scores.push(worker.totalScore);
    communityScores.set(worker.communityName, scores);
  }
  const bestCommunity = Array.from(communityScores.entries())
    .map(([name, scores]) => ({ name, avg: scores.reduce((sum, score) => sum + score, 0) / scores.length }))
    .sort((left, right) => right.avg - left.avg)[0]?.name ?? '暂无';

  const qualityAlerts: StatsQualityAlertItem[] = [];
  const maxIncomplete = Array.from(incompleteByGrid.entries()).sort((left, right) => right[1] - left[1])[0];
  if (maxIncomplete) {
    qualityAlerts.push({
      id: 'profile_gap',
      type: '档案缺口',
      desc: '人员档案缺少联系电话、关联房屋或基础标签。',
      count: maxIncomplete[1],
      area: maxIncomplete[0],
    });
  }
  const maxOverdue = Array.from(overdueByGrid.entries()).sort((left, right) => right[1] - left[1])[0];
  if (maxOverdue) {
    qualityAlerts.push({
      id: 'overdue_followup',
      type: '跟进超期',
      desc: '待回访或矛盾跟进任务已超期，影响闭环时效。',
      count: maxOverdue[1],
      area: maxOverdue[0],
    });
  }
  const maxLateClosed = Array.from(lateClosedByGrid.entries()).sort((left, right) => right[1] - left[1])[0];
  if (maxLateClosed) {
    qualityAlerts.push({
      id: 'late_resolution',
      type: '闭环滞后',
      desc: '已化解事件存在超期闭环，建议复盘处置链路。',
      count: maxLateClosed[1],
      area: maxLateClosed[0],
    });
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalGrids: grids.length,
      totalPeople: people.length,
      totalHouses: houses.length,
      totalVisits: visits.length,
      totalConflicts: conflicts.length,
    },
    weights: { ...PERFORMANCE_SCORE_WEIGHTS },
    workers,
    summary: {
      workerCount: workers.length,
      avgScore: workers.length ? Number((workers.reduce((sum, worker) => sum + worker.totalScore, 0) / workers.length).toFixed(1)) : 0,
      bestCommunity,
      needImproveCount: workers.filter((worker) => worker.totalScore < 70).length,
    },
    qualityAlerts,
  };
}

function buildFallbackRegionSummaries(
  grids: StatsGridItem[],
  people: ReturnType<typeof db.getPeople>,
  conflicts: ReturnType<typeof db.getConflicts>,
): StatsRegionSummary[] {
  const peopleByGrid = new Map<string, typeof people>();
  const conflictsByGrid = new Map<string, typeof conflicts>();
  for (const person of people) {
    const bucket = peopleByGrid.get(person.gridId) ?? [];
    bucket.push(person);
    peopleByGrid.set(person.gridId, bucket);
  }
  for (const conflict of conflicts) {
    const bucket = conflictsByGrid.get(conflict.gridId) ?? [];
    bucket.push(conflict);
    conflictsByGrid.set(conflict.gridId, bucket);
  }

  const buckets = new Map<string, StatsRegionSummary>();
  const add = (level: StatsRegionLevel, name: string, parentName: string | null, grid: StatsGridItem) => {
    const key = `${level}:${name}`;
    const item = buckets.get(key) ?? {
      id: key,
      level,
      name,
      parentName,
      peopleCount: 0,
      houseCount: 0,
      visitCount: 0,
      conflictCount: 0,
      floatingCount: 0,
      activeConflictCount: 0,
      riskCount: 0,
      score: 0,
    };
    const gridPeople = peopleByGrid.get(grid.id) ?? [];
    const gridConflicts = conflictsByGrid.get(grid.id) ?? [];
    item.peopleCount += grid.peopleCount;
    item.houseCount += grid.houseCount;
    item.visitCount += grid.visitCount;
    item.conflictCount += grid.conflictCount;
    item.floatingCount += gridPeople.filter((person) => person.type === '流动').length;
    item.activeConflictCount += gridConflicts.filter((conflict) => conflict.status !== '已化解').length;
    item.riskCount += gridPeople.filter((person) => person.risk === 'High' || person.risk === 'Medium').length;
    buckets.set(key, item);
  };

  for (const grid of grids) {
    add('city', '烟台市', null, grid);
    add('district', grid.districtName, '烟台市', grid);
    add('street', grid.streetName, grid.districtName, grid);
    add('community', grid.communityName, grid.streetName, grid);
    add('grid', `${grid.communityName}${grid.gridLabel}`, grid.communityName, grid);
  }

  const levelRank: Record<StatsRegionLevel, number> = { city: 0, district: 1, street: 2, community: 3, grid: 4 };
  return Array.from(buckets.values())
    .map((item) => ({
      ...item,
      score: Number(Math.min(
        100,
        item.riskCount * 0.9
          + item.activeConflictCount * 8
          + item.floatingCount * 0.35
          + Math.max(0, item.peopleCount - item.visitCount) * 0.06,
      ).toFixed(1)),
    }))
    .sort((left, right) => levelRank[left.level] - levelRank[right.level] || right.score - left.score || left.name.localeCompare(right.name, 'zh-CN'));
}

function buildFallbackActionItems(regionSummaries: StatsRegionSummary[]): StatsActionItem[] {
  const districts = regionSummaries.filter((item) => item.level === 'district');
  if (districts.length === 0) {
    return [];
  }
  const byRisk = [...districts].sort((left, right) => right.riskCount - left.riskCount || right.score - left.score)[0];
  const byConflict = [...districts].sort((left, right) => right.activeConflictCount - left.activeConflictCount || right.score - left.score)[0];
  const byFloating = [...districts].sort((left, right) => right.floatingCount - left.floatingCount || right.score - left.score)[0];
  return [
    { id: 'risk-focus', title: '重点对象压降', description: '先按区县定位重点对象，再下钻到社区与网格核对责任清单。', area: byRisk.name, priority: '高', metric: `${byRisk.riskCount} 人`, route: 'population-tags' },
    { id: 'conflict-followup', title: '矛盾纠纷清零', description: '优先处理仍在调解中的事件，避免跨月积压。', area: byConflict.name, priority: '高', metric: `${byConflict.activeConflictCount} 起`, route: 'conflict-management' },
    { id: 'floating-scan', title: '流动人口复核', description: '联动出租房、走访和移动端任务做集中复核。', area: byFloating.name, priority: '中', metric: `${byFloating.floatingCount} 人`, route: 'migration-trends' },
  ];
}

function buildFallbackDashboard(): DashboardStatsResponse {
  const people = db.getPeople();
  const houses = db.getHouses();
  const grids = db.getGrids();

  const genderData: StatsGenderItem[] = [
    { name: '男性', value: people.filter((person) => person.gender === '男').length, color: '#3b82f6' },
    { name: '女性', value: people.filter((person) => person.gender === '女').length, color: '#ec4899' },
  ];

  const ageData: StatsAgeItem[] = [
    { name: '0-18岁', value: people.filter((person) => person.age <= 18).length, fill: '#8b5cf6' },
    { name: '19-35岁', value: people.filter((person) => person.age >= 19 && person.age <= 35).length, fill: '#3b82f6' },
    { name: '36-60岁', value: people.filter((person) => person.age >= 36 && person.age <= 60).length, fill: '#10b981' },
    { name: '60岁以上', value: people.filter((person) => person.age > 60).length, fill: '#f59e0b' },
  ];

  const visits = db.getVisits();
  const conflicts = db.getConflicts();
  const gridItems: StatsGridItem[] = grids.map((grid) => {
    const { districtName, streetName, communityName, gridLabel } = parseGridHierarchy(grid.name, grid.id);
    return {
      id: grid.id,
      name: grid.name,
      parentId: grid.parentId,
      managerName: grid.managerName,
      districtName,
      streetName,
      communityName,
      gridLabel,
      peopleCount: people.filter((person) => person.gridId === grid.id).length,
      houseCount: houses.filter((house) => house.gridId === grid.id).length,
      visitCount: visits.filter((visit) => visit.gridId === grid.id).length,
      conflictCount: conflicts.filter((conflict) => conflict.gridId === grid.id).length,
    };
  });
  const regionSummaries = buildFallbackRegionSummaries(gridItems, people, conflicts);
  const housingStats: StatsHousingStats = {
    total: houses.length,
    selfOccupied: houses.filter((house) => house.type === '自住').length,
    rental: houses.filter((house) => house.type === '出租').length,
    vacant: houses.filter((house) => house.type === '空置').length,
    commercial: houses.filter((house) => house.type === '经营').length,
    buildings: new Set(houses.map((house) => `${house.communityName}-${house.building}`)).size,
    avgArea: 0,
    avgMembers: houses.length
      ? Number((houses.reduce((sum, house) => sum + (house.memberCount ?? 0), 0) / houses.length).toFixed(1))
      : 0,
    completionRate: houses.length
      ? Math.round(houses.filter((house) => house.ownerName && house.area && house.type).length / houses.length * 100)
      : 0,
  };

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalGrids: grids.length,
      totalPeople: people.length,
      totalHouses: houses.length,
      totalVisits: visits.length,
      totalConflicts: conflicts.length,
    },
    totalPopulation: people.length,
    totalHouses: houses.length,
    genderData,
    ageData,
    riskTagsSummary: [],
    trendData: [],
    housingStats,
    conflictStats: {
      total: conflicts.length,
      today: 0,
      resolved: conflicts.filter((conflict) => conflict.status === '已化解').length,
      active: conflicts.filter((conflict) => conflict.status !== '已化解').length,
      rate: conflicts.length
        ? Math.round(conflicts.filter((conflict) => conflict.status === '已化解').length / conflicts.length * 100)
        : 0,
    },
    mobilePeopleStats: {
      total: people.length,
      registered: people.filter((person) => person.type === '户籍').length,
      floating: people.filter((person) => person.type === '流动').length,
      highRisk: people.filter((person) => person.risk === 'High').length,
      mediumRisk: people.filter((person) => person.risk === 'Medium').length,
      lowRisk: people.filter((person) => person.risk === 'Low').length,
    },
    grids: gridItems,
    regionSummaries,
    actionItems: buildFallbackActionItems(regionSummaries),
  };
}

export const statsRepository = {
  async getDashboard(range: 'week' | 'month' | 'quarter' = 'month'): Promise<DashboardStatsResponse> {
    return callWithFallback(
      () => fetchJson<DashboardStatsResponse>(`/stats/dashboard?range=${range}`),
      () => buildFallbackDashboard(),
    );
  },

  async getGridStats(): Promise<GridStatsResponse> {
    return callWithFallback(
      () => fetchJson<GridStatsResponse>('/stats/grids'),
      async () => {
        const dashboard = buildFallbackDashboard();
        return {
          metadata: dashboard.metadata,
          grids: dashboard.grids,
        };
      },
    );
  },

  async getGrids(): Promise<Grid[]> {
    return callWithFallback(
      async () => {
        const response = await fetchJson<GridStatsResponse>('/stats/grids');
        return response.grids.map((grid) => ({
          id: grid.id,
          name: grid.name,
          parentId: grid.parentId ?? undefined,
          managerName: grid.managerName ?? undefined,
        }));
      },
      () => db.getGrids(),
    );
  },

  async getPerformanceStats(): Promise<PerformanceStatsResponse> {
    return callWithFallback(
      () => fetchJson<PerformanceStatsResponse>('/stats/performance'),
      () => buildFallbackPerformance(),
    );
  },
};
