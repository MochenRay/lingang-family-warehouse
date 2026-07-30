import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Person, VisitRecord } from '../../types/core';
import { analysisRepository } from './analysisRepository';
import { conflictRepository } from './conflictRepository';
import { houseRepository } from './houseRepository';
import { personRepository } from './personRepository';
import { taskRepository, type MobileTaskItem } from './taskRepository';
import { visitRepository } from './visitRepository';

describe('analysisRepository migration aggregation', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('anchors the six-month window to the latest migration record and ignores old data even under a 2027 wall clock', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-11-23T12:00:00+08:00'));

    vi.spyOn(personRepository, 'getGrids').mockResolvedValue([
      { id: 'g1', name: '登州街道海梦苑社区第一网格', managerName: '网格员' },
    ]);
    vi.spyOn(personRepository, 'getPeople').mockResolvedValue([]);
    vi.spyOn(houseRepository, 'getHouses').mockResolvedValue([
      {
        id: 'h1',
        gridId: 'g1',
        address: '海梦苑1号楼101',
        communityName: '海梦苑',
        building: '1号楼',
        unit: '1单元',
        room: '101',
        ownerName: '居民甲',
        area: '90㎡',
        type: '出租',
        memberCount: 1,
        tags: [],
        updatedAt: '2026-07-01',
      },
    ]);
    vi.spyOn(visitRepository, 'getVisits').mockResolvedValue([]);
    vi.spyOn(conflictRepository, 'getConflicts').mockResolvedValue([]);
    vi.spyOn(taskRepository, 'getTaskFeed').mockResolvedValue({ pending: [], completed: [] } as never);
    vi.spyOn(houseRepository, 'getHousingHistoryRecords').mockResolvedValue([
      { id: 'old', houseId: 'h1', personName: '旧住户', type: '租客', period: '2020-01-01 ~ 2021-01-01' },
      { id: 'feb-in', houseId: 'h1', personName: '居民甲', type: '租客', period: '2026-02-03 ~ 至今' },
      { id: 'mar-out', houseId: 'h1', personName: '旧住户乙', type: '租客', period: '2025-05-01 ~ 2026-03-09' },
      { id: 'paired', houseId: 'h1', personName: '居民丙', type: '租客', period: '2026-04-02 ~ 2026-06-12' },
      { id: 'jul-in', houseId: 'h1', personName: '居民丁', type: '租客', period: '2026-07-01 ~ 至今' },
    ]);

    const snapshot = await analysisRepository.getGovernanceSnapshot();

    expect(snapshot.monthly.map(({ month, moveIns, moveOuts }) => ({ month, moveIns, moveOuts }))).toEqual([
      { month: '2月', moveIns: 1, moveOuts: 0 },
      { month: '3月', moveIns: 0, moveOuts: 1 },
      { month: '4月', moveIns: 1, moveOuts: 0 },
      { month: '5月', moveIns: 0, moveOuts: 0 },
      { month: '6月', moveIns: 0, moveOuts: 1 },
      { month: '7月', moveIns: 1, moveOuts: 0 },
    ]);
    expect(snapshot.migration).toEqual({
      totalIn: 3,
      totalOut: 2,
      net: 1,
      inboundHotspots: [{ name: '蓬莱区', value: 3 }],
      outboundHotspots: [{ name: '蓬莱区', value: 2 }],
    });
  });
});

function peopleForGrid(gridId: string, highRiskCount: number): Person[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `${gridId}-person-${index}`,
    gridId,
    name: `${gridId}居民${index}`,
    idCard: `${gridId}-${index}`,
    gender: index % 2 ? '女' : '男',
    age: 30 + index,
    address: `${gridId}测试地址`,
    type: '户籍',
    tags: [],
    risk: index < highRiskCount ? 'High' : 'Low',
    updatedAt: '2026-07-30',
  }));
}

function visitsForPeople(people: Person[]): VisitRecord[] {
  return people.map((person, index) => ({
    id: `visit-${person.id}`,
    targetId: person.id,
    targetType: 'person',
    gridId: person.gridId,
    visitorName: '测试网格员',
    date: `2026-07-${String(10 + (index % 19)).padStart(2, '0')}`,
    content: '测试走访记录',
  }));
}

function pendingTask(gridId: string, index: number): MobileTaskItem {
  return {
    id: `${gridId}-task-${index}`,
    title: '测试超期待办',
    type: '重点走访',
    sourceKind: 'person',
    sourceId: `${gridId}-person-0`,
    gridId,
    route: '/mobile/tasks',
    priority: 'high',
    urgent: true,
    description: '测试任务',
    assignedBy: '系统规则',
    deadline: '2026-01-01 09:00',
    status: 'pending',
    statusLabel: '待回访',
  };
}

describe('analysisRepository warning levels', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uses the compact visit window and preserves severe, medium and mild thresholds', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-30T12:00:00+08:00'));
    const grids = [
      { id: 'grid-high', name: '蓬莱区/登州街道/甲社区/第一网格', managerName: '甲' },
      { id: 'grid-medium', name: '龙口市/东莱街道/乙社区/第一网格', managerName: '乙' },
      { id: 'grid-low', name: '芝罘区/毓璜顶街道/丙社区/第一网格', managerName: '丙' },
    ];
    const people = [
      ...peopleForGrid('grid-high', 0),
      ...peopleForGrid('grid-medium', 0),
      ...peopleForGrid('grid-low', 1),
    ];
    const getVisits = vi.spyOn(visitRepository, 'getVisits').mockResolvedValue(visitsForPeople(people));
    vi.spyOn(personRepository, 'getGrids').mockResolvedValue(grids);
    vi.spyOn(personRepository, 'getPeople').mockResolvedValue(people);
    vi.spyOn(houseRepository, 'getHouses').mockResolvedValue([]);
    vi.spyOn(houseRepository, 'getHousingHistoryRecords').mockResolvedValue([]);
    vi.spyOn(conflictRepository, 'getConflicts').mockResolvedValue([]);
    const pending = [
      pendingTask('grid-high', 1),
      pendingTask('grid-high', 2),
      pendingTask('grid-medium', 1),
    ];
    vi.spyOn(taskRepository, 'getTaskFeed').mockResolvedValue({
      pending,
      completed: [],
      summary: { pending: pending.length, overdue: pending.length, completed: 0, completionRate: 0 },
    });

    const snapshot = await analysisRepository.getGovernanceSnapshot();
    const levels = Object.fromEntries(snapshot.grids.map((grid) => [grid.id, grid.statusLevel]));

    expect(getVisits).toHaveBeenCalledWith({ limit: 500 });
    expect(levels).toEqual({
      'grid-high': 'high',
      'grid-medium': 'medium',
      'grid-low': 'low',
    });
    expect(new Set(snapshot.anomalies.map((item) => item.severity))).toEqual(new Set(['high', 'medium', 'low']));
  });
});
