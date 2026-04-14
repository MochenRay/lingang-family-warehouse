import { Vehicle } from '../../types/core';

export const SEED_VEHICLES: Vehicle[] = [
  {
    id: "v1",
    personId: "p1",
    houseId: "h1",
    brand: "比亚迪",
    type: "新能源轿车",
    plateNumber: "沪A12345",
    parkingLocation: "地下车库A区",
    usageStatus: "正常使用",
    updatedAt: "2025-12-20"
  },
  {
    id: "v2",
    personId: "p3",
    houseId: "h1",
    brand: "雅迪",
    type: "电动自行车",
    plateNumber: "沪电000123",
    parkingLocation: "地下车库非机动车区",
    usageStatus: "正常使用",
    updatedAt: "2025-12-20"
  },
  {
    id: "v3",
    personId: "p5",
    houseId: "h3",
    brand: "本田",
    type: "轿车",
    plateNumber: "鲁B67890",
    parkingLocation: "地下车库B区",
    usageStatus: "正常使用",
    updatedAt: "2025-12-22"
  },
  {
    id: "v4",
    personId: "p7",
    houseId: "h5",
    brand: "五菱",
    type: "面包车",
    plateNumber: "沪C34567",
    parkingLocation: "地面停车场",
    usageStatus: "正常使用",
    updatedAt: "2025-12-25"
  }
];
