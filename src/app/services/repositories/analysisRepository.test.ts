import { afterEach, describe, expect, it, vi } from 'vitest';

import { analysisRepository } from './analysisRepository';
import { conflictRepository } from './conflictRepository';
import { houseRepository } from './houseRepository';
import { personRepository } from './personRepository';
import { taskRepository } from './taskRepository';
import { visitRepository } from './visitRepository';

describe('analysisRepository migration aggregation', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps monthly totals and district hotspots on the same rolling six-month window', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T12:00:00+08:00'));

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
