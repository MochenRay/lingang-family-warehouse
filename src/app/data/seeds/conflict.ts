import { ConflictRecord } from '../../types/core';

export const SEED_CONFLICTS: ConflictRecord[] = [
  {
    id: 'c_001',
    source: '上级下派',
    title: '海源一品1号楼噪音扰民投诉',
    type: '邻里纠纷',
    description: '接到12345热线转办，1号楼3单元502住户反映楼上装修噪音过大，休息时间仍在施工。请网格员核实并协调。',
    involvedParties: [
      { type: 'resident', id: 'p1', name: '张伟' },
      { type: 'resident', id: 'p2', name: '张小明' }
    ],
    status: '调解中',
    gridId: 'g2',
    location: '海源一品1号楼3单元',
    timeline: [
      { date: '2025-12-25 10:00', content: '街道综治中心接单并下派', operator: '系统管理员' },
    ],
    images: [],
    createdAt: '2025-12-25 10:00:00',
    updatedAt: '2025-12-25 10:00:00'
  },
  {
    id: 'c_002',
    source: '上级下派',
    title: '小区公共绿地种菜问题',
    type: '物业纠纷',
    description: '接社区转办，2号楼南侧绿地有居民私自开垦种菜，破坏绿化。请网格员联系物业协同处理。',
    involvedParties: [
      { type: 'organization', id: 'PROPERTY_MGMT', name: '海源物业' }
    ],
    status: '已化解',
    gridId: 'g2',
    location: '海源一品2号楼南侧绿地',
    timeline: [
      { date: '2025-12-20 09:30', content: '接到社区派单', operator: '系统管理员' },
      { date: '2025-12-20 14:00', content: '联合物业进行清理，并教育当事人', operator: '王网格' },
      { date: '2025-12-20 14:30', content: '问题已解决，恢复绿化', operator: '王网格' }
    ],
    images: [],
    createdAt: '2025-12-20 09:30:00',
    updatedAt: '2025-12-20 14:30:00'
  },
  {
    id: 'c_003',
    source: '上级下派',
    title: '海源三期夫妻争吵扰民',
    type: '家庭纠纷',
    description: '接110转办，海源三期5号楼居民报警称邻居夫妻深夜争吵，影响休息。请网格员上门了解情况并进行调解。',
    involvedParties: [
      { type: 'resident', id: 'p5', name: '李强' },
      { type: 'resident', id: 'p6', name: '刘芳' }
    ],
    status: '调解中',
    gridId: 'g2',
    location: '海源三期5号楼2单元',
    timeline: [
      { date: '2026-01-02 22:30', content: '公安部门转派单', operator: '系统管理员' },
      { date: '2026-01-03 09:00', content: '网格员上门了解情况', operator: '王网格' },
    ],
    images: [],
    createdAt: '2026-01-02 22:30:00',
    updatedAt: '2026-01-03 09:00:00'
  },
  {
    id: 'c_004',
    source: '上级下派',
    title: '车位归属权纠纷',
    type: '物业纠纷',
    description: '接物业公司报告，海源一品地下车库34号车位产权归属存在争议，两户业主均声称拥有该车位。请网格员协助核实产权并调解。',
    involvedParties: [
      { type: 'resident', id: 'p7', name: '赵明' },
      { type: 'resident', id: 'p8', name: '周涛' },
      { type: 'organization', id: 'PROPERTY_MGMT', name: '海源物业' }
    ],
    status: '调解中',
    gridId: 'g2',
    location: '海源一品地下车库',
    timeline: [
      { date: '2025-12-28 15:00', content: '街道综治办下派任务', operator: '系统管理员' },
      { date: '2025-12-28 16:30', content: '联系双方了解情况', operator: '王网格' },
      { date: '2025-12-29 10:00', content: '调取产权证明材料', operator: '王网格' },
    ],
    images: [],
    createdAt: '2025-12-28 15:00:00',
    updatedAt: '2025-12-29 10:00:00'
  },
  {
    id: 'c_005',
    source: '上级下派',
    title: '楼道堆放杂物引发火灾隐患',
    type: '邻里纠纷',
    description: '接消防部门转办，海源二期3号楼多户居民在楼道堆放杂物，存在严重消防安全隐患。请网格员督促清理并做好宣传教育。',
    involvedParties: [
      { type: 'resident', id: 'p9', name: '孙婷' },
      { type: 'resident', id: 'p10', name: '钱勇' },
      { type: 'organization', id: 'PROPERTY_MGMT', name: '海源物业' }
    ],
    status: '已化解',
    gridId: 'g2',
    location: '海源二期3号楼',
    timeline: [
      { date: '2025-12-15 09:00', content: '消防部门转派', operator: '系统管理员' },
      { date: '2025-12-15 14:00', content: '逐户上门沟通并下发整改通知', operator: '王网格' },
      { date: '2025-12-17 16:00', content: '复查确认杂物已清理完毕', operator: '王网格' },
      { date: '2025-12-17 16:30', content: '组织消防安全宣传', operator: '王网格' }
    ],
    images: [],
    createdAt: '2025-12-15 09:00:00',
    updatedAt: '2025-12-17 16:30:00'
  },
  {
    id: 'c_006',
    source: '上级下派',
    title: '老人赡养纠纷',
    type: '家庭纠纷',
    description: '接民政部门转办，海源一品独居老人反映子女长期不探望、不尽赡养义务。请网格员介入调解。',
    involvedParties: [
      { type: 'resident', id: 'p11', name: '吴大爷' },
      { type: 'resident', id: 'p12', name: '吴小华' }
    ],
    status: '调解中',
    gridId: 'g2',
    location: '海源一品6号楼',
    timeline: [
      { date: '2025-12-30 10:00', content: '民政部门转派', operator: '系统管理员' },
      { date: '2025-12-30 15:00', content: '上门了解老人情况', operator: '王网格' },
      { date: '2025-12-31 10:00', content: '联系子女进行沟通', operator: '王网格' },
    ],
    images: [],
    createdAt: '2025-12-30 10:00:00',
    updatedAt: '2025-12-31 10:00:00'
  },
  {
    id: 'c_007',
    source: '上级下派',
    title: '宠物扰民投诉',
    type: '邻里纠纷',
    description: '接12345热线转办，海源三期居民投诉邻居饲养大型犬只，经常吠叫扰民且未拴绳，存在安全隐患。请网格员核实处理。',
    involvedParties: [
      { type: 'resident', id: 'p13', name: '郑雨' },
      { type: 'resident', id: 'p14', name: '陈建' }
    ],
    status: '已化解',
    gridId: 'g2',
    location: '海源三期7号楼',
    timeline: [
      { date: '2025-12-22 16:00', content: '街道综治中心下派', operator: '系统管理员' },
      { date: '2025-12-23 09:00', content: '上门核实情况', operator: '王网格' },
      { date: '2025-12-23 14:00', content: '协调双方达成和解，要求养犬户文明养犬', operator: '王网格' },
      { date: '2025-12-24 10:00', content: '回访确认问题解决', operator: '王网格' }
    ],
    images: [],
    createdAt: '2025-12-22 16:00:00',
    updatedAt: '2025-12-24 10:00:00'
  },
  {
    id: 'c_008',
    source: '上级下派',
    title: '物业费收取争议',
    type: '物业纠纷',
    description: '接区信访办转办，海源二期业主对物业费标准及服务质量不满，拒缴物业费。请网格员协调物业公司与业主沟通。',
    involvedParties: [
      { type: 'resident', id: 'p15', name: '冯丽' },
      { type: 'organization', id: 'PROPERTY_MGMT', name: '海源物业' }
    ],
    status: '调解中',
    gridId: 'g2',
    location: '海源二期',
    timeline: [
      { date: '2026-01-04 11:00', content: '区信访办转派', operator: '系统管理员' },
      { date: '2026-01-04 15:00', content: '了解业主诉求', operator: '王网格' },
      { date: '2026-01-05 09:00', content: '协调物业公司说明服务内容', operator: '王网格' },
    ],
    images: [],
    createdAt: '2026-01-04 11:00:00',
    updatedAt: '2026-01-05 09:00:00'
  },
  // ========== g1 网格矛盾纠纷 ==========
  {
    id: 'c_g1_001',
    source: '上级下派',
    title: '9号楼装修时间违规',
    type: '邻里纠纷',
    description: '接12345热线转办，9号楼2单元住户投诉楼上午休时间装修，噪音严重影响生活。请网格员核实并协调。',
    involvedParties: [
      { type: 'resident', id: 'p18', name: '柳杰' },
      { type: 'resident', id: 'p16', name: '任婷' }
    ],
    status: '调解中',
    gridId: 'g1',
    location: '海源一品9号楼2单元',
    timeline: [
      { date: '2026-01-18 10:00', content: '街道综治中心接单并下派', operator: '系统管理员' },
      { date: '2026-01-18 14:00', content: '上门核实情况，确认装修方在午休时间施工', operator: '网格员李明辉' },
    ],
    images: [],
    createdAt: '2026-01-18 10:00:00',
    updatedAt: '2026-01-18 14:00:00'
  },
  {
    id: 'c_g1_002',
    source: '上级下派',
    title: '10号楼高空抛物',
    type: '邻里纠纷',
    description: '接社区转办，10号楼3单元有高空抛物现象，底层住户多次反映，存在安全隐患。请网格员调查并处理。',
    involvedParties: [
      { type: 'resident', id: 'p42', name: '巫刚' }
    ],
    status: '已化解',
    gridId: 'g1',
    location: '海源一品10号楼3单元',
    timeline: [
      { date: '2026-01-10 09:00', content: '社区派单', operator: '系统管理员' },
      { date: '2026-01-10 15:00', content: '逐户走访排查，锁定抛物楼层', operator: '网格员李明辉' },
      { date: '2026-01-11 10:00', content: '约谈当事人，签署承诺书', operator: '网格员李明辉' },
      { date: '2026-01-15 09:00', content: '回访确认问题未再发生', operator: '网格员李明辉' }
    ],
    images: [],
    createdAt: '2026-01-10 09:00:00',
    updatedAt: '2026-01-15 09:00:00'
  },
  {
    id: 'c_g1_003',
    source: '上级下派',
    title: '流动人口群租扰民',
    type: '物业纠纷',
    description: '接物业报告，9号楼3单元出租房疑似群租，人员频繁进出，邻居多次投诉。请网格员核查并处理。',
    involvedParties: [
      { type: 'resident', id: 'p23', name: '苗刚' },
      { type: 'organization', id: 'PROPERTY_MGMT', name: '海源物业' }
    ],
    status: '调解中',
    gridId: 'g1',
    location: '海源一品9号楼3单元301',
    timeline: [
      { date: '2026-01-15 11:00', content: '物业报告群租问题', operator: '系统管理员' },
      { date: '2026-01-15 16:00', content: '上门核查，确认实际居住5人', operator: '网格员李明辉' },
    ],
    images: [],
    createdAt: '2026-01-15 11:00:00',
    updatedAt: '2026-01-15 16:00:00'
  }
];
