import type { Grid, House } from '../../types/core';

export interface HousingFinderSelection {
  community?: string;
  building?: string;
  unit?: string;
  floor?: string;
  houseId?: string;
}

export interface HousingFinderStats {
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

export interface HousingFinderOption {
  id: string;
  value: string;
  label: string;
  count: number;
  subtitle?: string;
  active: boolean;
}

export interface HousingFinderHouseItem {
  id: string;
  label: string;
  count: number;
  subtitle: string;
  active: boolean;
  house: House;
}

export interface HousingFinderModel {
  stats: HousingFinderStats;
  filteredHouses: House[];
  communities: HousingFinderOption[];
  buildings: HousingFinderOption[];
  units: HousingFinderOption[];
  floors: HousingFinderOption[];
  houses: HousingFinderHouseItem[];
  selectedHouse?: House;
}

type SortDirection = 'asc' | 'desc';

const naturalCollator = new Intl.Collator('zh-CN', {
  numeric: true,
  sensitivity: 'base',
});

const CHINESE_DIGITS: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

export function compareMixedLabel(left: string, right: string): number {
  return naturalCollator.compare(left, right);
}

export function extractHouseFloor(room: string): string {
  const normalized = room.trim();
  if (!normalized) {
    return '未知楼层';
  }

  const explicitFloor = normalized.match(/(?:地下|负)?[一二两三四五六七八九十百\d]+(?=层|楼)/);
  if (explicitFloor) {
    return formatFloorLabel(explicitFloor[0]);
  }

  const digitGroups = normalized.match(/\d+/g);
  const roomDigits = digitGroups?.[digitGroups.length - 1];
  if (!roomDigits) {
    return '未知楼层';
  }

  if (roomDigits.length <= 2) {
    return `${Number(roomDigits)}层`;
  }

  const floorDigits = roomDigits.length === 3 ? roomDigits.slice(0, 1) : roomDigits.slice(0, 2);
  return `${Number(floorDigits)}层`;
}

export function compareFloorLabel(left: string, right: string, direction: SortDirection = 'desc'): number {
  const leftFloor = parseFloorNumber(left);
  const rightFloor = parseFloorNumber(right);

  if (leftFloor !== rightFloor) {
    return direction === 'desc' ? rightFloor - leftFloor : leftFloor - rightFloor;
  }

  const fallback = compareMixedLabel(left, right);
  return direction === 'desc' ? -fallback : fallback;
}

export function filterHousesByKeyword(houses: House[], keyword: string): House[] {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) {
    return houses;
  }

  return houses.filter((house) => {
    const haystack = [
      house.address,
      house.ownerName,
      house.building,
      house.unit,
      house.room,
      ...(house.tags ?? []),
    ].map(normalizeSearchText);

    return haystack.some((value) => value.includes(normalizedKeyword));
  });
}

export function calculateHousingFinderStats(houses: House[]): HousingFinderStats {
  const total = houses.length;
  const totalArea = houses.reduce((sum, house) => sum + parseArea(house.area), 0);
  const totalMembers = houses.reduce((sum, house) => sum + (house.memberCount ?? 0), 0);
  const completeCount = houses.filter((house) => house.ownerName && house.area && house.type).length;

  return {
    total,
    selfOccupied: houses.filter((house) => house.type === '自住').length,
    rental: houses.filter((house) => house.type === '出租').length,
    vacant: houses.filter((house) => house.type === '空置').length,
    commercial: houses.filter((house) => house.type === '经营').length,
    buildings: new Set(houses.map((house) => `${house.communityName}-${house.building}`)).size,
    avgArea: total > 0 ? Math.round(totalArea / total) : 0,
    avgMembers: total > 0 ? Number((totalMembers / total).toFixed(1)) : 0,
    completionRate: total > 0 ? Math.round((completeCount / total) * 100) : 0,
  };
}

export function deriveHousingFinderModel(
  houses: House[],
  grids: Grid[],
  selection: HousingFinderSelection = {},
  searchKeyword = '',
): HousingFinderModel {
  const filteredHouses = filterHousesByKeyword(houses, searchKeyword);
  const gridById = new Map(grids.map((grid) => [grid.id, grid]));

  const communityHouses = selection.community
    ? filteredHouses.filter((house) => house.communityName === selection.community)
    : filteredHouses;
  const buildingHouses = selection.building
    ? communityHouses.filter((house) => house.building === selection.building)
    : communityHouses;
  const unitHouses = selection.unit
    ? buildingHouses.filter((house) => house.unit === selection.unit)
    : buildingHouses;
  const floorHouses = selection.floor
    ? unitHouses.filter((house) => extractHouseFloor(house.room) === selection.floor)
    : unitHouses;

  return {
    stats: calculateHousingFinderStats(filteredHouses),
    filteredHouses,
    communities: buildOptions(filteredHouses, {
      getValue: (house) => house.communityName,
      getId: (value) => `community:${value}`,
      isActive: (value) => selection.community === value,
      getSubtitle: (items) => {
        const gridCount = new Set(items.map((house) => house.gridId)).size;
        const buildingCount = new Set(items.map((house) => house.building)).size;
        return `${gridCount}个网格 · ${buildingCount}栋楼`;
      },
    }),
    buildings: buildOptions(communityHouses, {
      getValue: (house) => house.building,
      getId: (value) => `building:${selection.community ?? 'all'}:${value}`,
      isActive: (value) => selection.building === value,
      getSubtitle: (items) => {
        const unitCount = new Set(items.map((house) => house.unit)).size;
        const floorCount = new Set(items.map((house) => extractHouseFloor(house.room))).size;
        return `${unitCount}个单元 · ${floorCount}层`;
      },
    }),
    units: buildOptions(buildingHouses, {
      getValue: (house) => house.unit,
      getId: (value) => `unit:${selection.community ?? 'all'}:${selection.building ?? 'all'}:${value}`,
      isActive: (value) => selection.unit === value,
      getSubtitle: (items) => {
        const floorCount = new Set(items.map((house) => extractHouseFloor(house.room))).size;
        return `${floorCount}层 · ${items.length}套房`;
      },
    }),
    floors: buildOptions(unitHouses, {
      getValue: (house) => extractHouseFloor(house.room),
      getId: (value) =>
        `floor:${selection.community ?? 'all'}:${selection.building ?? 'all'}:${selection.unit ?? 'all'}:${value}`,
      isActive: (value) => selection.floor === value,
      getSubtitle: (items) => `${items.map((house) => house.room).sort(compareMixedLabel).join('、')}`,
      compare: compareFloorLabel,
    }),
    houses: floorHouses
      .slice()
      .sort((left, right) => compareMixedLabel(left.room, right.room))
      .map((house) => ({
        id: house.id,
        label: house.room,
        count: 1,
        subtitle: buildHouseSubtitle(house, gridById.get(house.gridId)),
        active: selection.houseId === house.id,
        house,
      })),
    selectedHouse: filteredHouses.find((house) => house.id === selection.houseId),
  };
}

function buildOptions(
  houses: House[],
  options: {
    getValue: (house: House) => string;
    getId: (value: string) => string;
    isActive: (value: string) => boolean;
    getSubtitle?: (houses: House[], value: string) => string;
    compare?: (left: string, right: string) => number;
  },
): HousingFinderOption[] {
  const groups = new Map<string, House[]>();

  houses.forEach((house) => {
    const value = options.getValue(house) || '未分组';
    const group = groups.get(value);
    if (group) {
      group.push(house);
    } else {
      groups.set(value, [house]);
    }
  });

  return Array.from(groups.entries())
    .sort(([left], [right]) => (options.compare ?? compareMixedLabel)(left, right))
    .map(([value, items]) => ({
      id: options.getId(value),
      value,
      label: value,
      count: items.length,
      subtitle: options.getSubtitle?.(items, value),
      active: options.isActive(value),
    }));
}

function buildHouseSubtitle(house: House, grid?: Grid): string {
  return [
    house.ownerName || '未登记产权人',
    house.type,
    house.area,
    grid?.name,
  ].filter(Boolean).join(' · ');
}

function parseArea(area: string): number {
  const value = area.match(/\d+(?:\.\d+)?/)?.[0];
  return value ? Number(value) : 0;
}

function normalizeSearchText(value: string | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase('zh-CN');
}

function formatFloorLabel(value: string): string {
  const isBasement = value.startsWith('地下') || value.startsWith('负');
  const floorText = value.replace(/^(地下|负)/, '');
  const floorNumber = parseChineseNumber(floorText) ?? Number(floorText);

  if (!Number.isFinite(floorNumber)) {
    return `${value}层`;
  }

  return isBasement ? `地下${floorNumber}层` : `${floorNumber}层`;
}

function parseFloorNumber(label: string): number {
  const isBasement = label.includes('地下') || label.includes('负');
  const explicitNumber = label.match(/\d+/)?.[0];
  const value = explicitNumber ? Number(explicitNumber) : parseChineseNumber(label);

  if (value === undefined || !Number.isFinite(value)) {
    return Number.NEGATIVE_INFINITY;
  }

  return isBasement ? -value : value;
}

function parseChineseNumber(value: string): number | undefined {
  const text = value.replace(/[层楼号单元室\s]/g, '');
  if (!text || /\d/.test(text)) {
    return undefined;
  }

  if (text === '十') {
    return 10;
  }

  if (text.includes('百')) {
    const [hundredsText, restText = ''] = text.split('百');
    const hundreds = CHINESE_DIGITS[hundredsText] ?? 1;
    return hundreds * 100 + (parseChineseNumber(restText) ?? 0);
  }

  if (text.includes('十')) {
    const [tensText, onesText = ''] = text.split('十');
    const tens = tensText ? CHINESE_DIGITS[tensText] : 1;
    const ones = onesText ? CHINESE_DIGITS[onesText] : 0;
    return tens * 10 + ones;
  }

  if (text.length === 1) {
    return CHINESE_DIGITS[text];
  }

  return undefined;
}
