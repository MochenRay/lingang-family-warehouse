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
const RECENT_MIGRATION_PERIODS: Array<{ period: string; moveOutReason?: string }> = [
  { period: '2026-02-03 ~ 至今' },
  { period: '2026-03-06 ~ 至今' },
  { period: '2026-04-09 ~ 至今' },
  { period: '2026-05-12 ~ 至今' },
  { period: '2026-06-15 ~ 至今' },
  { period: '2026-07-04 ~ 至今' },
  { period: '2026-07-18 ~ 至今' },
  { period: '2025-03-01 ~ 2026-02-08', moveOutReason: '工作调动。' },
  { period: '2025-04-01 ~ 2026-03-11', moveOutReason: '家庭迁居。' },
  { period: '2025-05-01 ~ 2026-04-14', moveOutReason: '租约到期。' },
  { period: '2025-06-01 ~ 2026-05-17', moveOutReason: '工作调动。' },
  { period: '2025-07-01 ~ 2026-06-20', moveOutReason: '家庭迁居。' },
  { period: '2025-08-01 ~ 2026-07-23', moveOutReason: '租约到期。' },
];
const REGIONAL_HOUSE_TARGETS: Record<string, number> = {
  g_zf_1: 13,
  g_fs_1: 9,
  g_mp_1: 10,
  g_ls_1: 8,
  g_lk_1: 12,
  g_ly_1: 9,
  g_lz_1: 11,
  g_zy_1: 8,
  g_qx_1: 10,
  g_hy_1: 10,
};
const REGIONAL_POPULATION_TARGET = 130;

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
  const targetCount = REGIONAL_HOUSE_TARGETS[grid.id] ?? 10;
  for (let i = 0; i < targetCount; i += 1) {
    const type = i % 7 === 0 ? '空置' : i % 5 === 0 ? '经营' : i % 3 === 0 ? '出租' : '自住';
    const warningRental = type === '出租' && (idx + i) % 3 === 0;
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
      tags: type === '出租'
        ? warningRental ? ['出租房', i % 2 === 0 ? '群租风险' : '换租频繁'] : ['出租房']
        : type === '空置' ? ['长期空置'] : [],
      updatedAt: `2026-07-${String(5 + (i % 10)).padStart(2, '0')}`,
      houseType: type === '经营' ? '门市' : '普通住宅',
      ownerPhone: `139${String(20000000 + idx * 1000 + i).padStart(8, '0')}`,
      ownerAddress: `${option.district}${option.street}${option.community}`,
      occupancyStatus: type === '出租'
        ? warningRental ? '户在人不在' : '其他'
        : type === '空置' ? '人不在户不在' : '人在户在',
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
        updatedAt: `2026-07-${String(1 + (seed % 15)).padStart(2, '0')}`,
        nation: NATIONS[seed % NATIONS.length],
        education: EDUCATION[seed % EDUCATION.length],
      });
    }
  });
  return people;
}

function restoreRegionalPopulationTotal(
  generated: Array<{ grid: Grid; houses: House[]; people: Person[] }>,
) {
  const currentTotal = generated.reduce((sum, item) => sum + item.people.length, 0);
  const deficit = REGIONAL_POPULATION_TARGET - currentTotal;
  if (deficit <= 0) return;

  const candidates = generated.flatMap((item) => item.houses
    .filter((house) => house.type === '自住')
    .map((house) => ({ item, house })));
  if (candidates.length === 0) throw new Error('无法恢复 fallback 区域人口总量');

  for (let index = 0; index < deficit; index += 1) {
    const { item, house } = candidates[Math.floor(index * candidates.length / deficit)];
    const seed = 9000 + index;
    item.people.push({
      id: `p_${item.grid.id}_balance_${index + 1}`,
      gridId: item.grid.id,
      name: personName(seed),
      idCard: `3706********${String(seed).slice(-4)}`,
      gender: index % 2 === 0 ? '男' : '女',
      age: 28 + index % 35,
      phone: `138${String(19000000 + index).padStart(8, '0')}`,
      address: house.address,
      houseId: house.id,
      type: '户籍',
      tags: ['家庭成员'],
      risk: 'Low',
      updatedAt: '2026-07-01',
      nation: '汉族',
      education: '高中',
    });
    house.memberCount += 1;
  }
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
      date: `2026-07-${String(18 + index).padStart(2, '0')}`,
      content: '入户核验人口状态、联系方式与重点标签，已同步到区县治理快照。',
      tags: ['人口核验', person.type === '流动' ? '流动人口' : '常住人口'],
    })),
    ...houses.slice(0, 5).map((house, index): VisitRecord => ({
      id: `v_${grid.id}_h_${index}`,
      targetId: house.id,
      targetType: 'house',
      gridId: grid.id,
      visitorName: manager,
      date: `2026-07-${String(20 + index).padStart(2, '0')}`,
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
      { date: '2026-07-20', content: '接到投诉并登记。', operator: grid.managerName || '网格员' },
      { date: '2026-07-26', content: '完成入户核查并约定调解。', operator: grid.managerName || '网格员' },
    ],
    images: [],
    createdAt: '2026-07-20',
    updatedAt: '2026-07-26',
  }));
}

function makeRegionalHistory(houses: House[]): HousingHistory[] {
  return RECENT_MIGRATION_PERIODS.map((definition, index): HousingHistory => {
    const house = houses[index % houses.length];
    return {
      id: `hh_${house.id}_${index + 1}`,
      houseId: house.id,
      personName: house.ownerName,
      type: house.type === '出租' ? '租客' : '业主',
      period: definition.period,
      moveOutReason: definition.moveOutReason,
    };
  });
}

function selectSpread(people: Person[], count: number): Person[] {
  const sampleSize = Math.min(count, people.length);
  return Array.from({ length: sampleSize }, (_item, index) => people[Math.floor(index * people.length / sampleSize)]);
}

function ensurePriorityTagCoverage(source: Person[]): Person[] {
  const people = source.map((person) => ({ ...person, tags: [...person.tags] }));
  const assigned = new Set<string>();
  const assign = (candidates: Person[], label: string, count: number, risk?: Person['risk']) => {
    for (const person of selectSpread(candidates.filter((item) => !assigned.has(item.id)), count)) {
      person.tags = Array.from(new Set([...person.tags, label]));
      if (risk) person.risk = risk;
      assigned.add(person.id);
    }
  };

  assign(people.filter((person) => person.age >= 65), '独居老人', 8, 'Medium');
  assign(people.filter((person) => person.type === '流动'), '群租人员', 10, 'Medium');
  const adults = people.filter((person) => person.age >= 25 && person.age <= 70);
  assign(adults, '社区矫正', 4, 'High');
  assign(adults, '严重精神障碍', 4, 'High');
  assign(adults, '信访人员', 6, 'Medium');
  assign(adults, '低保家庭', 8, 'Medium');
  assign(adults, '重点关注', 12, 'Medium');
  return people;
}

function stableNumber(value: string): number {
  return Array.from(value).reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function ensureFirstPageRelations(source: Person[]): Person[] {
  const people = source.map((person) => ({
    ...person,
    tags: [...person.tags],
    familyRelations: person.familyRelations?.map((relation) => ({ ...relation })),
  }));
  const byHouse = new Map<string, Person[]>();
  const byGrid = new Map<string, Person[]>();
  people.forEach((person) => {
    if (person.houseId) byHouse.set(person.houseId, [...(byHouse.get(person.houseId) ?? []), person]);
    byGrid.set(person.gridId, [...(byGrid.get(person.gridId) ?? []), person]);
  });

  people.slice(0, 20).forEach((person, index) => {
    const coResidents = (person.houseId ? byHouse.get(person.houseId) : [])?.filter((item) => item.id !== person.id) ?? [];
    if (coResidents.length > 0 || (person.familyRelations?.length ?? 0) > 0) return;
    const candidates = (byGrid.get(person.gridId) ?? []).filter((item) => item.id !== person.id);
    const related = candidates[index % Math.max(candidates.length, 1)];
    if (related) {
      person.familyRelations = [{ relatedPersonId: related.id, relationType: '兄弟姐妹' }];
    }
  });
  return people;
}

function ensureFirstPageVisits(people: Person[], source: VisitRecord[]): VisitRecord[] {
  const visits = source.map((visit) => ({ ...visit, tags: visit.tags ? [...visit.tags] : undefined }));
  const countByPerson = new Map<string, number>();
  visits.forEach((visit) => {
    if (visit.targetType === 'person') countByPerson.set(visit.targetId, (countByPerson.get(visit.targetId) ?? 0) + 1);
  });
  const templates = [
    ['常规走访', '核对联系方式、实际居住状态和近期服务诉求。'],
    ['风险复核', '复核重点标签、风险变化和上一轮处置结果。'],
    ['服务回访', '跟进已登记需求，确认办理进度并约定下一次联系时间。'],
  ] as const;

  people.slice(0, 20).forEach((person, personIndex) => {
    const minimum = person.risk === 'High' ? 3 : person.risk === 'Medium' ? 2 : 1;
    const current = countByPerson.get(person.id) ?? 0;
    for (let index = current; index < minimum; index += 1) {
      const [tag, content] = templates[index % templates.length];
      const dayOffset = personIndex * 2 + index * 11;
      const date = new Date(Date.UTC(2026, 6, 29 - dayOffset)).toISOString().slice(0, 10);
      visits.push({
        id: `v_first_${person.id}_${index + 1}`,
        targetId: person.id,
        targetType: 'person',
        gridId: person.gridId,
        visitorName: DEMO_GRID_OPTIONS.find((grid) => grid.id === person.gridId)?.managerName ?? '网格员',
        date,
        content,
        tags: [tag],
      });
    }
  });
  return visits;
}

function ensureCurrentHousingHistory(
  people: Person[],
  houses: House[],
  source: HousingHistory[],
): HousingHistory[] {
  const histories = source.map((history) => ({ ...history }));
  const housesById = new Map(houses.map((house) => [house.id, house]));
  people.forEach((person) => {
    if (!person.houseId) return;
    const house = housesById.get(person.houseId);
    if (!house) return;
    const hasCurrent = histories.some((history) => (
      history.houseId === person.houseId
      && history.personName === person.name
      && history.period.split('~').slice(-1)[0]?.trim() === '至今'
    ));
    if (hasCurrent) return;
    const offset = stableNumber(person.id) % 330;
    const start = new Date(Date.UTC(2024, 0, 1 + offset)).toISOString().slice(0, 10);
    histories.push({
      id: `hh_current_${person.id}`,
      houseId: person.houseId,
      personName: person.name,
      type: house.type === '出租' ? '租客' : person.name === house.ownerName ? '业主' : '家属',
      period: `${start} ~ 至今`,
    });
  });
  return histories;
}

function rebalanceTaskFreshness(
  people: Person[],
  sourceVisits: VisitRecord[],
  sourceConflicts: ConflictRecord[],
): { visits: VisitRecord[]; conflicts: ConflictRecord[] } {
  const backgroundGridIds = new Set(Object.keys(REGIONAL_HOUSE_TARGETS));
  const mediumGridIds = new Set(['g_zf_1', 'g_fs_1', 'g_mp_1']);
  const visits = sourceVisits.map((visit) => ({ ...visit, tags: visit.tags ? [...visit.tags] : undefined }));
  const conflicts = sourceConflicts.map((conflict) => (
    backgroundGridIds.has(conflict.gridId) && conflict.status !== '已化解'
      ? { ...conflict, updatedAt: '2026-07-29 10:00:00' }
      : conflict
  ));

  for (const gridId of backgroundGridIds) {
    let eligible = people
      .filter((person) => person.gridId === gridId && (person.risk === 'High' || Boolean(person.careLabels?.length)))
      .sort((left, right) => left.id.localeCompare(right.id));
    if (mediumGridIds.has(gridId) && eligible.length === 0) {
      const candidate = people.filter((person) => person.gridId === gridId).sort((left, right) => left.id.localeCompare(right.id))[0];
      if (candidate) {
        candidate.risk = 'High';
        eligible = [candidate];
      }
    }

    const preserved = mediumGridIds.has(gridId) ? eligible.slice(0, 1) : [];
    const preservedIds = new Set(preserved.map((person) => person.id));
    const preservedHouseIds = new Set(preserved.map((person) => person.houseId).filter((id): id is string => Boolean(id)));
    visits.forEach((visit) => {
      if (preservedIds.has(visit.targetId) || preservedHouseIds.has(visit.targetId)) visit.date = '2026-07-10';
    });

    eligible.forEach((person) => {
      if (preservedIds.has(person.id)) {
        person.updatedAt = '2026-07-10';
        return;
      }
      visits.push({
        id: `v_task_fresh_${person.id}`,
        targetId: person.id,
        targetType: 'person',
        gridId: person.gridId,
        visitorName: DEMO_GRID_OPTIONS.find((grid) => grid.id === person.gridId)?.managerName ?? '网格员',
        date: '2026-07-29',
        content: '完成近期风险与关爱对象复核，当前无需生成超期任务。',
        tags: ['近期复核'],
      });
    });
  }

  return { visits, conflicts };
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
  restoreRegionalPopulationTotal(generated);

  const houses = [...input.houses, ...generated.flatMap((item) => item.houses)];
  const people = ensureFirstPageRelations(ensurePriorityTagCoverage([
    ...input.people,
    ...generated.flatMap((item) => item.people),
  ]));
  const initialVisits = ensureFirstPageVisits(people, [
    ...input.visits,
    ...generated.flatMap((item) => item.visits),
  ]);
  const housingHistory = ensureCurrentHousingHistory(people, houses, [
    ...input.housingHistory,
    ...generated.flatMap((item) => item.housingHistory),
  ]);

  const balanced = rebalanceTaskFreshness(
    people,
    initialVisits,
    [...input.conflicts, ...generated.flatMap((item) => item.conflicts)],
  );

  return {
    grids: input.grids,
    houses,
    people,
    visits: balanced.visits,
    notifications: input.notifications,
    housingHistory,
    conflicts: balanced.conflicts,
  };
}
