import { describe, expect, it } from 'vitest';

import type { Grid, House } from '../../types/core';
import { deriveHousingFinderModel } from './finderModel';

const grids: Grid[] = [
  { id: 'g1', name: '第一网格' },
  { id: 'g2', name: '第二网格' },
];

const houses: House[] = [
  {
    id: 'h1',
    gridId: 'g1',
    address: '海梦苑1号楼1单元101',
    communityName: '海梦苑',
    building: '1号楼',
    unit: '1单元',
    room: '101',
    ownerName: '张三',
    area: '90㎡',
    type: '自住',
    memberCount: 2,
    tags: [],
    updatedAt: '2026-07-23',
  },
  {
    id: 'h2',
    gridId: 'g1',
    address: '海梦苑1号楼1单元201',
    communityName: '海梦苑',
    building: '1号楼',
    unit: '1单元',
    room: '201',
    ownerName: '李四',
    area: '88㎡',
    type: '出租',
    memberCount: 1,
    tags: [],
    updatedAt: '2026-07-23',
  },
  {
    id: 'h3',
    gridId: 'g2',
    address: '海梦苑2号楼2单元501',
    communityName: '海梦苑',
    building: '2号楼',
    unit: '2单元',
    room: '501',
    ownerName: '王五',
    area: '110㎡',
    type: '自住',
    memberCount: 3,
    tags: [],
    updatedAt: '2026-07-23',
  },
];

describe('deriveHousingFinderModel hierarchy labels', () => {
  it('shows complete housing totals in every hierarchy subtitle', () => {
    const communityModel = deriveHousingFinderModel(houses, grids);
    expect(communityModel.communities[0].subtitle).toBe('2个网格 · 2栋楼 · 3套房屋');

    const buildingModel = deriveHousingFinderModel(houses, grids, { community: '海梦苑' });
    expect(buildingModel.buildings.find((item) => item.value === '1号楼')?.subtitle)
      .toBe('1个单元 · 2层楼 · 2套房屋');

    const unitModel = deriveHousingFinderModel(houses, grids, {
      community: '海梦苑',
      building: '1号楼',
    });
    expect(unitModel.units[0].subtitle).toBe('2层楼 · 2套房屋');

    const floorModel = deriveHousingFinderModel(houses, grids, {
      community: '海梦苑',
      building: '1号楼',
      unit: '1单元',
    });
    expect(floorModel.floors.map((item) => item.subtitle)).toEqual(['1套房屋', '1套房屋']);
  });

  it('stops the house subtitle after area and omits grid or region text', () => {
    const model = deriveHousingFinderModel(houses, grids, {
      community: '海梦苑',
      building: '1号楼',
      unit: '1单元',
      floor: '1层',
    });

    expect(model.houses[0].subtitle).toBe('张三 · 自住 · 90㎡');
    expect(model.houses[0].subtitle).not.toContain('第一网格');
  });
});
