import type { ConflictRecord, Grid, House, HousingHistory, Notification, Person, VisitRecord } from '../../types/core';
import { DEMO_GRID_OPTIONS } from '../../config/regions';

interface SeedBundleInput {
  grids: Grid[];
  houses: House[];
  people: Person[];
  visits: VisitRecord[];
  notifications: Notification[];
  housingHistory: HousingHistory[];
  conflicts: ConflictRecord[];
}

const SURNAMES = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '刘', '张'];
const GIVEN = ['晨', '宁', '琳', '涛', '洁', '明', '悦', '峰', '然', '琪', '楠', '远'];
const EDUCATION = ['小学', '初中', '高中', '中专', '大专', '本科', '硕士', '博士'];
const NATIONS = ['汉族', '满族', '回族'];

function personName(seed: number) {
  return `${SURNAMES[seed % SURNAMES.length]}${GIVEN[(seed * 3) % GIVEN.length]}${seed % 2 === 0 ? '' : '华'}`;
}

function gridIndex(id: string) {
  return Math.max(1, DEMO_GRID_OPTIONS.findIndex((grid) => grid.id === id) + 1);
}

function makeRegionalHouses(grid: Grid): House[] {
  const option = DEMO_GRID_OPTIONS.find((item) => item.id === grid.id);
  if (!option || grid.id === 'g1' || grid.id === 'g2') return [];
  const idx = gridIndex(grid.id);
  const communityShort = option.community.replace('社区', '');
  const houses: House[] = [];
  for (let i = 0; i < 10; i += 1) {
    const type = i % 7 === 0 ? '空置' : i % 5 === 0 ? '经营' : i % 3 === 0 ? '出租' : '自住';
    houses.push({
      id: `h_${grid.id}_${i + 1}`,
      gridId: grid.id,
      address: `${communityShort}${idx + 1}号楼${(i % 2) + 1}单元${i + 1}01`,
      communityName: communityShort,
      building: `${idx + 1}号楼`,
      unit: `${(i % 2) + 1}单元`,
      room: `${i + 1}01`,
      ownerName: personName(idx * 10 + i),
      area: `${82 + ((idx + i) % 48)}㎡`,
      type,
      memberCount: type === '空置' ? 0 : 1 + ((idx + i) % 4),
      tags: type === '出租' ? ['出租房', i % 2 === 0 ? '群租风险' : '换租频繁'] : type === '空置' ? ['长期空置'] : [],
      updatedAt: `2026-04-${String(5 + (i % 10)).padStart(2, '0')}`,
      houseType: type === '经营' ? '门市' : '普通住宅',
      ownerPhone: `139${String(20000000 + idx * 1000 + i).padStart(8, '0')}`,
      ownerAddress: `${option.district}${option.street}${option.community}`,
      occupancyStatus: type === '出租' ? '户在人不在' : type === '空置' ? '人不在户不在' : '人在户在',
      residenceType: type === '出租' ? '租住' : type === '空置' ? '闲置' : '自住',
    });
  }
  return houses;
}

function makeRegionalPeople(grid: Grid, houses: House[]): Person[] {
  const idx = gridIndex(grid.id);
  const people: Person[] = [];
  houses.forEach((house, houseIndex) => {
    if (house.type === '空置') return;
    const count = house.type === '出租' ? 2 + (houseIndex % 3) : 1 + (houseIndex % 2);
    for (let member = 0; member < count; member += 1) {
      const seed = idx * 100 + houseIndex * 5 + member;
      const type = house.type === '出租' || seed % 5 === 0 ? '流动' : seed % 17 === 0 ? '留守' : '户籍';
      const age = 8 + ((seed * 7) % 76);
      const risk = seed % 23 === 0 ? 'High' : seed % 6 === 0 ? 'Medium' : 'Low';
      people.push({
        id: `p_${grid.id}_${houseIndex}_${member}`,
        gridId: grid.id,
        name: personName(seed),
        idCard: `3706********${String(seed).padStart(4, '0')}`,
        gender: seed % 2 === 0 ? '男' : '女',
        age,
        phone: `138${String(10000000 + seed).padStart(8, '0')}`,
        address: house.address,
        houseId: house.id,
        type,
        tags: risk === 'High' ? ['重点关注', age >= 65 ? '独居老人' : '长期未走访'] : type === '流动' ? ['流动人口'] : [],
        risk,
        updatedAt: `2026-04-${String(1 + (seed % 15)).padStart(2, '0')}`,
        nation: NATIONS[seed % NATIONS.length],
        education: EDUCATION[seed % EDUCATION.length],
      });
    }
  });
  return people;
}

function makeRegionalVisits(grid: Grid, people: Person[], houses: House[]): VisitRecord[] {
  const manager = grid.managerName || '网格员';
  return [
    ...people.slice(0, 8).map((person, index): VisitRecord => ({
      id: `v_${grid.id}_p_${index}`,
      targetId: person.id,
      targetType: 'person',
      gridId: grid.id,
      visitorName: manager,
      date: `2026-04-${String(2 + index).padStart(2, '0')}`,
      content: '入户核验人口状态、联系方式与重点标签，已同步到区县治理快照。',
      tags: ['人口核验', person.type === '流动' ? '流动人口' : '常住人口'],
    })),
    ...houses.slice(0, 5).map((house, index): VisitRecord => ({
      id: `v_${grid.id}_h_${index}`,
      targetId: house.id,
      targetType: 'house',
      gridId: grid.id,
      visitorName: manager,
      date: `2026-04-${String(10 + index).padStart(2, '0')}`,
      content: '复核房屋用途、人房关系和出租风险，纳入市级驾驶舱聚合。',
      tags: ['房屋核查', house.type],
    })),
  ];
}

function makeRegionalConflicts(grid: Grid, houses: House[]): ConflictRecord[] {
  const idx = gridIndex(grid.id);
  return houses.slice(0, idx % 3 === 0 ? 2 : 1).map((house, index): ConflictRecord => ({
    id: `c_${grid.id}_${index}`,
    source: index % 2 === 0 ? '自行发现' : '上级下派',
    title: `${house.communityName}${house.building}邻里噪音调解`,
    type: '邻里纠纷',
    description: '楼上楼下因夜间噪音产生投诉，网格员已组织第一次调解。',
    involvedParties: [
      { type: 'resident', id: house.ownerName, name: house.ownerName },
      { type: 'organization', id: 'PROPERTY_MGMT', name: `${house.communityName}物业` },
    ],
    status: index % 2 === 0 ? '调解中' : '已化解',
    gridId: grid.id,
    location: house.address,
    timeline: [
      { date: '2026-04-10', content: '接到投诉并登记。', operator: grid.managerName || '网格员' },
      { date: '2026-04-12', content: '完成入户核查并约定调解。', operator: grid.managerName || '网格员' },
    ],
    images: [],
    createdAt: '2026-04-10',
    updatedAt: '2026-04-12',
  }));
}

function makeRegionalHistory(houses: House[]): HousingHistory[] {
  return houses.slice(0, 4).map((house, index): HousingHistory => ({
    id: `hh_${house.id}`,
    houseId: house.id,
    personName: house.ownerName,
    type: house.type === '出租' ? '租客' : '业主',
    period: index % 2 === 0 ? '2025-10 ~ 至今' : '2024-03 ~ 2026-03',
    moveOutReason: index % 2 === 0 ? undefined : '租约调整或家庭迁居。',
  }));
}

export function buildPhase10SeedBundle(input: SeedBundleInput): SeedBundleInput {
  const generated = DEMO_GRID_OPTIONS
    .filter((grid) => grid.id !== 'g1' && grid.id !== 'g2')
    .map((gridOption) => {
      const grid: Grid = { id: gridOption.id, name: gridOption.name, managerName: gridOption.managerName };
      const houses = makeRegionalHouses(grid);
      const people = makeRegionalPeople(grid, houses);
      return {
        grid,
        houses,
        people,
        visits: makeRegionalVisits(grid, people, houses),
        conflicts: makeRegionalConflicts(grid, houses),
        housingHistory: makeRegionalHistory(houses),
      };
    });

  return {
    grids: input.grids,
    houses: [...input.houses, ...generated.flatMap((item) => item.houses)],
    people: [...input.people, ...generated.flatMap((item) => item.people)],
    visits: [...input.visits, ...generated.flatMap((item) => item.visits)],
    notifications: input.notifications,
    housingHistory: [...input.housingHistory, ...generated.flatMap((item) => item.housingHistory)],
    conflicts: [...input.conflicts, ...generated.flatMap((item) => item.conflicts)],
  };
}
