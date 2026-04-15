import type { Grid } from '../../types/core';
import { callWithFallback, fetchJson } from '../api';
import { db } from '../db';

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
  peopleCount: number;
  houseCount: number;
  visitCount: number;
  conflictCount: number;
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
}

export interface GridStatsResponse {
  metadata: StatsMetadata;
  grids: StatsGridItem[];
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
    grids: grids.map((grid) => ({
      id: grid.id,
      name: grid.name,
      parentId: grid.parentId,
      managerName: grid.managerName,
      peopleCount: people.filter((person) => person.gridId === grid.id).length,
      houseCount: houses.filter((house) => house.gridId === grid.id).length,
      visitCount: visits.filter((visit) => visit.gridId === grid.id).length,
      conflictCount: conflicts.filter((conflict) => conflict.gridId === grid.id).length,
    })),
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
};
