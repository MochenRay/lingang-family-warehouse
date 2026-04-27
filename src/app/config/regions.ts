export interface RegionGridOption {
  id: string;
  name: string;
  district: string;
  street: string;
  community: string;
  gridLabel: string;
  managerName: string;
}

export const DEMO_REGION_TREE = {
  "芝罘区": {
    "毓璜顶街道": ["南通社区"],
  },
  "福山区": {
    "清洋街道": ["银河社区"],
  },
  "牟平区": {
    "文化街道": ["沁水社区"],
  },
  "莱山区": {
    "黄海路街道": ["埠岚社区"],
  },
  "蓬莱区": {
    "登州街道": ["海梦苑社区", "东城社区"],
    "蓬莱阁街道": [],
    "紫荆山街道": [],
  },
  "龙口市": {
    "东莱街道": ["松岚社区"],
  },
  "莱阳市": {
    "城厢街道": ["旌旗社区"],
  },
  "莱州市": {
    "文昌路街道": ["文苑社区"],
  },
  "招远市": {
    "泉山街道": ["温泉社区"],
  },
  "栖霞市": {
    "庄园街道": ["霞光社区"],
  },
  "海阳市": {
    "方圆街道": ["海政社区"],
  },
} as const;

export const DEMO_GRID_OPTIONS: RegionGridOption[] = [
  {
    id: "g1",
    name: "登州街道海梦苑社区第一网格",
    district: "蓬莱区",
    street: "登州街道",
    community: "海梦苑社区",
    gridLabel: "第一网格",
    managerName: "李明辉",
  },
  {
    id: "g2",
    name: "登州街道海梦苑社区第二网格",
    district: "蓬莱区",
    street: "登州街道",
    community: "海梦苑社区",
    gridLabel: "第二网格",
    managerName: "王海燕",
  },
  { id: "g_zf_1", name: "毓璜顶街道南通社区第一网格", district: "芝罘区", street: "毓璜顶街道", community: "南通社区", gridLabel: "第一网格", managerName: "孙晓楠" },
  { id: "g_fs_1", name: "清洋街道银河社区第一网格", district: "福山区", street: "清洋街道", community: "银河社区", gridLabel: "第一网格", managerName: "赵晨" },
  { id: "g_mp_1", name: "文化街道沁水社区第一网格", district: "牟平区", street: "文化街道", community: "沁水社区", gridLabel: "第一网格", managerName: "周海宁" },
  { id: "g_ls_1", name: "黄海路街道埠岚社区第一网格", district: "莱山区", street: "黄海路街道", community: "埠岚社区", gridLabel: "第一网格", managerName: "刘若彤" },
  { id: "g_lk_1", name: "东莱街道松岚社区第一网格", district: "龙口市", street: "东莱街道", community: "松岚社区", gridLabel: "第一网格", managerName: "邹文博" },
  { id: "g_ly_1", name: "城厢街道旌旗社区第一网格", district: "莱阳市", street: "城厢街道", community: "旌旗社区", gridLabel: "第一网格", managerName: "姜嘉琪" },
  { id: "g_lz_1", name: "文昌路街道文苑社区第一网格", district: "莱州市", street: "文昌路街道", community: "文苑社区", gridLabel: "第一网格", managerName: "梁昊天" },
  { id: "g_zy_1", name: "泉山街道温泉社区第一网格", district: "招远市", street: "泉山街道", community: "温泉社区", gridLabel: "第一网格", managerName: "韩语嫣" },
  { id: "g_qx_1", name: "庄园街道霞光社区第一网格", district: "栖霞市", street: "庄园街道", community: "霞光社区", gridLabel: "第一网格", managerName: "马志远" },
  { id: "g_hy_1", name: "方圆街道海政社区第一网格", district: "海阳市", street: "方圆街道", community: "海政社区", gridLabel: "第一网格", managerName: "魏晨露" },
];

const GRID_BY_ID = new Map(DEMO_GRID_OPTIONS.map((grid) => [grid.id, grid]));

export const getDistricts = () => Object.keys(DEMO_REGION_TREE);

export const getStreets = (district: string) => {
  if (!district || district === "all") return [];
  return Object.keys(DEMO_REGION_TREE[district as keyof typeof DEMO_REGION_TREE] ?? {});
};

export const getCommunities = (district: string, street: string) => {
  if (!district || !street || district === "all" || street === "all") return [];
  const streets = DEMO_REGION_TREE[district as keyof typeof DEMO_REGION_TREE];
  if (!streets) return [];
  return [...(streets[street as keyof typeof streets] ?? [])];
};

export const getRegionGrids = (district?: string, street?: string, community?: string) =>
  DEMO_GRID_OPTIONS.filter((grid) => {
    if (district && district !== "all" && grid.district !== district) return false;
    if (street && street !== "all" && grid.street !== street) return false;
    if (community && community !== "all" && grid.community !== community) return false;
    return true;
  });

export const getRegionGridById = (gridId?: string) => (gridId ? GRID_BY_ID.get(gridId) : undefined);

export const getRegionForGrid = (gridId?: string, gridName?: string) => {
  const byId = getRegionGridById(gridId);
  if (byId) return byId;
  if (!gridName) return undefined;
  return DEMO_GRID_OPTIONS.find((grid) => grid.name === gridName || gridName.includes(grid.name));
};

export const inferRegionByGridName = (gridName?: string) => {
  if (!gridName) return {};
  const matchedGrid = DEMO_GRID_OPTIONS.find((grid) => grid.name === gridName || gridName.includes(grid.name));
  if (matchedGrid) {
    return {
      district: matchedGrid.district,
      street: matchedGrid.street,
      community: matchedGrid.community,
      gridLabel: matchedGrid.gridLabel,
    };
  }

  for (const district of getDistricts()) {
    for (const street of getStreets(district)) {
      if (!gridName.includes(street)) continue;
      const community = getCommunities(district, street).find((item) => gridName.includes(item.replace("社区", "")) || gridName.includes(item));
      return { district, street, community };
    }
  }

  return {};
};
