// 数据存储和共享 - 简单的数据管理解决方案

// 人口数据类型
export interface Population {
  id: string;
  name: string;
  idCard: string;
  gender: '男' | '女';
  age: number;
  phone: string;
  address: string;
  status: '正常' | '迁出' | '死亡' | '作废';
  residenceType: '常住' | '流动' | '户籍';
  createTime: string;
}

// 房屋数据类型
export interface Building {
  id: string;
  name: string;
  address: string;
  floors: number;
  units: Unit[];
  createTime: string;
}

export interface Unit {
  id: string;
  buildingId: string;
  name: string;
  floors: number;
  rooms: Room[];
}

export interface Room {
  id: string;
  unitId: string;
  roomNumber: string;
  floor: number;
  area: number;
  status: '已入住' | '空置' | '出租';
  residents: number;
  owner?: string;
}

// 人房关系数据类型
export interface Relationship {
  id: string;
  personId: string;
  personName: string;
  personIdCard: string;
  houseId: string;
  houseAddress: string;
  relationType: '现居' | '历史';
  relationship: '业主' | '家属' | '租客' | '其他';
  moveInDate: string;
  moveOutDate?: string;
  createTime: string;
}

// Mock初始数据
const initialPopulations: Population[] = [
  {
    id: '1',
    name: '张三',
    idCard: '370000199001011234',
    gender: '男',
    age: 34,
    phone: '13800138000',
    address: '威海市环翠区竹岛街道A区1号楼1单元101',
    status: '正常',
    residenceType: '常住',
    createTime: '2025-12-15 10:30:00'
  },
  {
    id: '2',
    name: '李四',
    idCard: '370000199205123456',
    gender: '女',
    age: 32,
    phone: '13900139000',
    address: '威海市环翠区竹岛街道A区1号楼1单元102',
    status: '正常',
    residenceType: '户籍',
    createTime: '2025-12-20 14:20:00'
  },
  {
    id: '3',
    name: '王五',
    idCard: '370000198803157890',
    gender: '男',
    age: 38,
    phone: '13700137000',
    address: '威海市环翠区竹岛街道B区2号楼3单元201',
    status: '正常',
    residenceType: '流动',
    createTime: '2025-12-28 09:15:00'
  },
  {
    id: '4',
    name: '赵六',
    idCard: '370000199512201111',
    gender: '女',
    age: 30,
    phone: '13600136000',
    address: '威海市环翠区竹岛街道C区3号楼2单元305',
    status: '迁出',
    residenceType: '常住',
    createTime: '2025-12-05 16:40:00'
  },
  {
    id: '5',
    name: '孙七',
    idCard: '370000196505052222',
    gender: '男',
    age: 60,
    phone: '13500135000',
    address: '威海市环翠区竹岛街道A区1号楼2单元203',
    status: '正常',
    residenceType: '常住',
    createTime: '2025-12-10 11:25:00'
  }
];

const initialBuildings: Building[] = [
  {
    id: '1',
    name: 'A区1号楼',
    address: '威海市环翠区竹岛街道A区',
    floors: 6,
    createTime: '2025-12-01',
    units: [
      {
        id: '1-1',
        buildingId: '1',
        name: '1单元',
        floors: 6,
        rooms: [
          { id: '1-1-101', unitId: '1-1', roomNumber: '101', floor: 1, area: 85, status: '已入住', residents: 3, owner: '张三' },
          { id: '1-1-102', unitId: '1-1', roomNumber: '102', floor: 1, area: 90, status: '已入住', residents: 2, owner: '李四' },
          { id: '1-1-201', unitId: '1-1', roomNumber: '201', floor: 2, area: 85, status: '空置', residents: 0 },
          { id: '1-1-202', unitId: '1-1', roomNumber: '202', floor: 2, area: 90, status: '出租', residents: 1 },
          { id: '1-1-301', unitId: '1-1', roomNumber: '301', floor: 3, area: 85, status: '已入住', residents: 4 },
        ]
      },
      {
        id: '1-2',
        buildingId: '1',
        name: '2单元',
        floors: 6,
        rooms: [
          { id: '1-2-101', unitId: '1-2', roomNumber: '101', floor: 1, area: 88, status: '已入住', residents: 2 },
          { id: '1-2-102', unitId: '1-2', roomNumber: '102', floor: 1, area: 92, status: '空置', residents: 0 },
          { id: '1-2-201', unitId: '1-2', roomNumber: '201', floor: 2, area: 88, status: '已入住', residents: 3 },
          { id: '1-2-202', unitId: '1-2', roomNumber: '202', floor: 2, area: 92, status: '出租', residents: 2 },
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'B区2号楼',
    address: '威海市环翠区竹岛街道B区',
    floors: 8,
    createTime: '2025-12-03',
    units: [
      {
        id: '2-1',
        buildingId: '2',
        name: '1单元',
        floors: 8,
        rooms: [
          { id: '2-1-101', unitId: '2-1', roomNumber: '101', floor: 1, area: 95, status: '已入住', residents: 2 },
          { id: '2-1-102', unitId: '2-1', roomNumber: '102', floor: 1, area: 100, status: '已入住', residents: 3 },
          { id: '2-1-201', unitId: '2-1', roomNumber: '201', floor: 2, area: 95, status: '空置', residents: 0 },
        ]
      }
    ]
  }
];

const initialRelationships: Relationship[] = [
  {
    id: '1',
    personId: '1',
    personName: '张三',
    personIdCard: '370000199001011234',
    houseId: '1-1-101',
    houseAddress: 'A区1号楼1单元101',
    relationType: '现居',
    relationship: '业主',
    moveInDate: '2025-12-15',
    createTime: '2025-12-15 10:30:00'
  },
  {
    id: '2',
    personId: '2',
    personName: '李四',
    personIdCard: '370000199205123456',
    houseId: '1-1-102',
    houseAddress: 'A区1号楼1单元102',
    relationType: '现居',
    relationship: '业主',
    moveInDate: '2025-12-20',
    createTime: '2025-12-20 14:20:00'
  },
  {
    id: '3',
    personId: '3',
    personName: '王五',
    personIdCard: '370000198803157890',
    houseId: '2-1-101',
    houseAddress: 'B区2号楼1单元101',
    relationType: '现居',
    relationship: '租客',
    moveInDate: '2025-12-28',
    createTime: '2025-12-28 09:15:00'
  },
  {
    id: '4',
    personId: '4',
    personName: '赵六',
    personIdCard: '370000199512201111',
    houseId: '1-1-201',
    houseAddress: 'A区1号楼1单元201',
    relationType: '历史',
    relationship: '租客',
    moveInDate: '2025-12-06',
    moveOutDate: '2026-01-15',
    createTime: '2025-12-06 11:00:00'
  },
  {
    id: '5',
    personId: '1',
    personName: '张三',
    personIdCard: '370000199001011234',
    houseId: '1-2-102',
    houseAddress: 'A区1号楼2单元102',
    relationType: '历史',
    relationship: '租客',
    moveInDate: '2025-12-01',
    moveOutDate: '2026-01-10',
    createTime: '2025-12-01 09:00:00'
  }
];

// 数据存储类
class DataStore {
  private populations: Population[] = [...initialPopulations];
  private buildings: Building[] = [...initialBuildings];
  private relationships: Relationship[] = [...initialRelationships];

  // 人口管理方法
  getPopulations(): Population[] {
    return [...this.populations];
  }

  addPopulation(population: Population): void {
    this.populations = [population, ...this.populations];
  }

  updatePopulation(id: string, data: Partial<Population>): void {
    this.populations = this.populations.map(p => 
      p.id === id ? { ...p, ...data } : p
    );
  }

  deletePopulation(id: string): void {
    this.populations = this.populations.filter(p => p.id !== id);
  }

  // 房屋管理方法
  getBuildings(): Building[] {
    return [...this.buildings];
  }

  addBuilding(building: Building): void {
    this.buildings = [...this.buildings, building];
  }

  updateBuilding(id: string, data: Partial<Building>): void {
    this.buildings = this.buildings.map(b => 
      b.id === id ? { ...b, ...data } : b
    );
  }

  deleteBuilding(id: string): void {
    this.buildings = this.buildings.filter(b => b.id !== id);
  }

  // 人房关系管理方法
  getRelationships(): Relationship[] {
    return [...this.relationships];
  }

  addRelationship(relationship: Relationship): void {
    this.relationships = [relationship, ...this.relationships];
  }

  updateRelationship(id: string, data: Partial<Relationship>): void {
    this.relationships = this.relationships.map(r => 
      r.id === id ? { ...r, ...data } : r
    );
  }

  deleteRelationship(id: string): void {
    this.relationships = this.relationships.filter(r => r.id !== id);
  }

  // 统计方法
  getStats() {
    const totalRooms = this.buildings.reduce((sum, b) => 
      sum + b.units.reduce((unitSum, u) => unitSum + u.rooms.length, 0), 0
    );

    return {
      totalPopulation: this.populations.length,
      normalPopulation: this.populations.filter(p => p.status === '正常').length,
      totalBuildings: this.buildings.length,
      totalUnits: this.buildings.reduce((sum, b) => sum + b.units.length, 0),
      totalRooms,
      totalRelationships: this.relationships.length,
      currentRelationships: this.relationships.filter(r => r.relationType === '现居').length,
    };
  }
}

// 创建单例实例
export const dataStore = new DataStore();
