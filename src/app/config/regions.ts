export interface RegionGridOption {
  id: string;
  name: string;
  district: string;
  street: string;
  community: string;
}

export const DEMO_REGION_TREE = {
  "蓬莱区": {
    "登州街道": ["海梦苑社区", "东城社区"],
    "蓬莱阁街道": [],
    "紫荆山街道": [],
  },
} as const;

export const DEMO_GRID_OPTIONS: RegionGridOption[] = [
  {
    id: "g1",
    name: "登州街道海梦苑社区第一网格",
    district: "蓬莱区",
    street: "登州街道",
    community: "海梦苑社区",
  },
  {
    id: "g2",
    name: "登州街道海梦苑社区第二网格",
    district: "蓬莱区",
    street: "登州街道",
    community: "海梦苑社区",
  },
];

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

export const inferRegionByGridName = (gridName?: string) => {
  if (!gridName) return {};
  const matchedGrid = DEMO_GRID_OPTIONS.find((grid) => grid.name === gridName || gridName.includes(grid.name));
  if (matchedGrid) {
    return {
      district: matchedGrid.district,
      street: matchedGrid.street,
      community: matchedGrid.community,
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
