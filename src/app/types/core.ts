export type RiskLevel = 'High' | 'Medium' | 'Low';
export type PersonType = '户籍' | '流动' | '留守' | '境外';
export type HouseType = '自住' | '出租' | '空置' | '经营' | '其他';

export interface Grid {
  id: string;
  name: string;
  parentId?: string; // For hierarchy (e.g. Community -> Grid)
  managerName?: string;
}

export interface Tag {
  id: string;
  label: string;
  category: 'identity' | 'risk' | 'health' | 'other';
  color?: string; // Hex code or Tailwind class reference
}

export interface Person {
  id: string;
  gridId: string;
  name: string;
  idCard: string; // Masked in UI
  gender: '男' | '女';
  age: number;
  phone?: string;
  address: string; // Simplified for display
  houseId?: string; // Link to House
  type: PersonType;
  tags: string[]; // Array of Tag labels for simplicity, or Tag IDs
  risk: RiskLevel;
  updatedAt: string;
  nation?: string;
  education?: string;
  // 关系数据（可选，用于关系图谱）
  familyRelations?: FamilyRelation[]; // 血缘关系

  // === 户主详细信息 ===
  birthDate?: string; // 出生年月
  birthplace?: string; // 籍贯
  maritalStatus?: '未婚' | '已婚' | '离异' | '丧偶'; // 婚姻情况
  religion?: string; // 宗教信仰
  politicalStatus?: string; // 政治面貌（党员、团员、群众等）
  militaryService?: boolean; // 兵役情况
  graduationInfo?: string; // 毕业院校及专业
  workplace?: string; // 工作单位及职务
  communityVolunteer?: boolean; // 是否社区志愿力量
  skills?: string; // 特长、爱好
  pets?: string; // 宠物饲养情况

  // === 重点关爱标签 ===
  careLabels?: ('独居老人' | '特困人员' | '困境儿童' | '孤儿' | '留守人员' |
                '军人' | '困难' | '失业' | '失独' | '残疾' | '低保户' | '优抚对象')[];

  // === 人员类别标签 ===
  categoryLabels?: {
    isFloorLeader?: boolean; // 楼长
    isUnitLeader?: boolean; // 单元长
    isAssistant?: boolean; // 协管员
    focusType?: ('社区矫正' | '安置帮教' | '信访人员' | '涉法涉诉人员' |
                  '易肇事精神障碍患者' | '吸毒人员' | '邪教人员' |
                  '疆籍人员' | '藏籍人员' | '外籍人员')[]; // 重点关注类型
  };

  // === 个人经历 ===
  biography?: string; // 基本情况（学习经历、工作经历、上访事件等）

  // === 活动参与 ===
  activityParticipation?: {
    activities?: string; // 参加社区及社会组织活动情况
    needs?: string; // 家庭服务需求及诉求
  };

  // === 健康档案 ===
  healthRecord?: {
    hasChronic?: boolean; // 是否有基础疾病
    chronicDetails?: string; // 疾病类型
    needsRegularMedicine?: boolean; // 是否需要定期购药
    medicineFrequency?: string; // 购药频率
    medicalVisitFrequency?: string; // 就医频率
    isSeverePatient?: boolean; // 是否重症患者
    isPregnant?: boolean; // 是否孕产妇
    specialNotes?: string; // 特殊情况说明
  };

  // === 事件记录 ===
  importantEvents?: string; // 重要事件记录及其他
}

// 家庭关系类型
export interface FamilyRelation {
  relatedPersonId: string; // 关联人员ID
  relationType: '父亲' | '母亲' | '配偶' | '子女' | '兄弟' | '姐妹' | '兄弟姐妹' | '祖父母' | '孙子女' | '其他';
}

export interface House {
  id: string;
  gridId: string;
  address: string;
  communityName: string; // e.g., "海梦苑"
  building: string; // e.g., "1号楼"
  unit: string; // e.g., "1单元"
  room: string; // e.g., "101"
  ownerName: string;
  area: string;
  type: HouseType;
  memberCount: number; // Can be derived, but kept for cache
  tags: string[];
  updatedAt: string;

  // === 房屋详细信息 ===
  houseType?: '普通住宅' | '门市' | '草厦子' | '车库' | '阁楼'; // 房屋类型
  ownerPhone?: string; // 产权人联系方式
  ownerAddress?: string; // 产权人居住地址
  occupancyStatus?: '人在户在' | '户在人不在' | '人不在户不在' | '其他'; // 人房关系
  residenceType?: '自住' | '租住' | '闲置'; // 居住类型
}

export interface VisitRecord {
  id: string;
  targetId: string; // Person ID or House ID
  targetType: 'person' | 'house';
  gridId: string;
  visitorName: string;
  date: string;
  content: string;
  images?: string[];
  tags?: string[];
}

export interface HousingHistory {
  id: string;
  houseId: string;
  personName: string;
  type: '业主' | '租客' | '家属' | '其他';
  period: string; // e.g., "2020-01-01 ~ 2022-01-01"
  moveOutReason?: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  date: string;
  read: boolean;
  type: 'system' | 'task' | 'alert' | 'urgent' | 'guide' | 'info';
  scope?: string[];
  grids?: string[];
  status?: 'published' | 'draft';
  publisher?: string;
  department?: string;
  scheduledTime?: string;
  readCount?: number;
  attachments?: { name: string; size: string }[];
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  type: 'document' | 'meeting' | 'image' | 'article' | string;
  category: string;
  summary: string;
  content: string;
  size?: string;
  uploadDate: string;
  author: string;
  tags: string[];
  relatedType?: string;
  relatedId?: string;
  source?: string;
}

export interface DashboardStats {
  population: number;
  houses: number;
  rentalHouses: number;
  specialGroups: number; // e.g. elderly, children
  riskCount: number;
}

export interface ConflictRecord {
  id: string;
  source: '上级下派' | '自行发现';
  title: string;
  type: '邻里纠纷' | '家庭纠纷' | '物业纠纷' | '其他';
  description: string;
  involvedParties: {
    type: 'resident' | 'organization';
    id: string; // Person ID or "PROPERTY_MGMT"
    name: string;
  }[];
  status: '调解中' | '已化解';
  gridId: string;
  location: string;
  timeline: {
    date: string;
    content: string;
    operator: string;
  }[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// 网格员绩效评分
export interface GridWorkerScore {
  id: string;
  name: string;
  gridId: string;
  communityName: string;
  streetName: string;
  districtName: string;
  // 五维原始数据
  visitCount: number;        // 走访次数
  visitQuality: number;      // 走访质量均分 (0-100)
  infoCompleteness: number;  // 信息完善度 (0-100)
  taskCompleted: number;     // 完成任务数
  avgTaskTime: number;       // 平均任务耗时(小时)
  // 五维标准化得分 (0-100)
  scores: {
    visitFreq: number;
    visitQuality: number;
    infoComplete: number;
    taskCount: number;
    taskSpeed: number;
  };
  totalScore: number;        // 综合得分
}

// 车辆信息
export interface Vehicle {
  id: string;
  personId: string; // 所属人员ID
  houseId?: string; // 所属房屋ID
  brand: string; // 品牌
  type: string; // 车辆类型（三轮车、电动车、轿车、大货车等）
  plateNumber?: string; // 车牌号码
  parkingLocation?: string; // 停放位置
  usageStatus?: string; // 目前使用状态
  updatedAt: string;
}
