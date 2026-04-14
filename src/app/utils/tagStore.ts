// 标签数据存储和共享

// 标签类型定义
export interface TagItem {
  id: string;
  name: string;
  type: '规则标签' | '智能标签';
  category: string;
  coverageCount: number;
  status: '启用' | '禁用';
  createTime: string;
  updateTime: string;
  creator: string;
  description: string;
  riskLevel?: 'High' | 'Medium' | 'Low'; // 风险等级
  rules?: string[];
  judgmentCriteria?: string; // 智能标签的判定描述，AI用来匹配记事内容
}

// 标签版本历史
export interface TagVersion {
  id: string;
  tagId: string;
  version: number;
  updateTime: string;
  operator: string;
  changes: string[];
  coverageCount: number;
  config: Partial<TagItem>;
}

// 初始标签数据
const initialTags: TagItem[] = [
  // === 规则标签 ===

  // High Risk (高危人群)
  {
    id: '101',
    name: '吸毒人员',
    type: '规则标签',
    category: '重点关注',
    coverageCount: 12,
    status: '启用',
    createTime: '2025-12-10 10:00:00',
    updateTime: '2025-12-15 14:30:00',
    creator: '张管理员',
    description: '在册吸毒人员',
    riskLevel: 'High',
    rules: []
  },
  {
    id: '102',
    name: '刑满释放',
    type: '规则标签',
    category: '重点关注',
    coverageCount: 8,
    status: '启用',
    createTime: '2025-12-12 09:30:00',
    updateTime: '2025-12-18 11:20:00',
    creator: '李管理员',
    description: '刑满释放不满5年人员',
    riskLevel: 'High',
    rules: []
  },
  {
    id: '103',
    name: '严重精神障碍',
    type: '规则标签',
    category: '健康状况',
    coverageCount: 15,
    status: '启用',
    createTime: '2025-12-08 15:45:00',
    updateTime: '2026-01-01 09:15:00',
    creator: '王管理员',
    description: '确诊严重精神障碍患者',
    riskLevel: 'High',
    rules: []
  },
  {
    id: '104',
    name: '重点上访',
    type: '规则标签',
    category: '重点关注',
    coverageCount: 5,
    status: '启用',
    createTime: '2025-12-05 11:20:00',
    updateTime: '2025-12-20 16:40:00',
    creator: '张管理员',
    description: '频繁上访人员',
    riskLevel: 'High',
    rules: []
  },
  {
    id: '105',
    name: '社区矫正',
    type: '规则标签',
    category: '重点关注',
    coverageCount: 3,
    status: '启用',
    createTime: '2025-12-15 13:00:00',
    updateTime: '2026-01-05 10:25:00',
    creator: '李管理员',
    description: '正在接受社区矫正人员',
    riskLevel: 'High',
    rules: []
  },

  // Medium Risk (关注人群)
  {
    id: '201',
    name: '空巢老人',
    type: '规则标签',
    category: '居住情况',
    coverageCount: 45,
    status: '启用',
    createTime: '2025-12-10 10:00:00',
    updateTime: '2025-12-15 14:30:00',
    creator: '张管理员',
    description: '子女不在身边的老年人',
    riskLevel: 'Medium',
    rules: ['年龄 >= 60', '同住人数 <= 2']
  },
  {
    id: '202',
    name: '独居老人',
    type: '规则标签',
    category: '居住情况',
    coverageCount: 32,
    status: '启用',
    createTime: '2025-12-12 09:30:00',
    updateTime: '2025-12-18 11:20:00',
    creator: '李管理员',
    description: '独自居住的老年人',
    riskLevel: 'Medium',
    rules: ['年龄 >= 60', '同住人数 = 1']
  },
  {
    id: '203',
    name: '残疾人',
    type: '规则标签',
    category: '健康状况',
    coverageCount: 28,
    status: '启用',
    createTime: '2025-12-08 15:45:00',
    updateTime: '2026-01-01 09:15:00',
    creator: '王管理员',
    description: '持有残疾证人员',
    riskLevel: 'Medium',
    rules: ['残疾证 = 是']
  },
  {
    id: '204',
    name: '低保户',
    type: '规则标签',
    category: '社会保障',
    coverageCount: 19,
    status: '启用',
    createTime: '2025-12-05 11:20:00',
    updateTime: '2025-12-20 16:40:00',
    creator: '张管理员',
    description: '享受低保待遇家庭',
    riskLevel: 'Medium',
    rules: []
  },
  {
    id: '205',
    name: '失业人员',
    type: '规则标签',
    category: '就业状况',
    coverageCount: 56,
    status: '启用',
    createTime: '2025-12-15 13:00:00',
    updateTime: '2026-01-05 10:25:00',
    creator: '李管理员',
    description: '登记失业人员',
    riskLevel: 'Medium',
    rules: ['就业状态 = 失业']
  },
  {
    id: '206',
    name: '群租人员',
    type: '规则标签',
    category: '居住情况',
    coverageCount: 88,
    status: '启用',
    createTime: '2025-12-15 13:00:00',
    updateTime: '2026-01-05 10:25:00',
    creator: '李管理员',
    description: '居住在群租房内的人员',
    riskLevel: 'Medium',
    rules: []
  },

  // Low Risk (正常人群)
  {
    id: '301',
    name: '党员',
    type: '规则标签',
    category: '政治面貌',
    coverageCount: 120,
    status: '启用',
    createTime: '2025-12-10 10:00:00',
    updateTime: '2025-12-15 14:30:00',
    creator: '张管理员',
    description: '中国共产党党员',
    riskLevel: 'Low',
    rules: []
  },
  {
    id: '302',
    name: '退役军人',
    type: '规则标签',
    category: '政治面貌',
    coverageCount: 45,
    status: '启用',
    createTime: '2025-12-12 09:30:00',
    updateTime: '2025-12-18 11:20:00',
    creator: '李管理员',
    description: '退出现役的军人',
    riskLevel: 'Low',
    rules: []
  },
  {
    id: '303',
    name: '志愿者',
    type: '规则标签',
    category: '社会活动',
    coverageCount: 60,
    status: '启用',
    createTime: '2025-12-08 15:45:00',
    updateTime: '2026-01-01 09:15:00',
    creator: '王管理员',
    description: '注册社区志愿者',
    riskLevel: 'Low',
    rules: []
  },
  {
    id: '304',
    name: '学龄儿童',
    type: '规则标签',
    category: '年龄段',
    coverageCount: 85,
    status: '启用',
    createTime: '2025-12-05 11:20:00',
    updateTime: '2025-12-20 16:40:00',
    creator: '张管理员',
    description: '6-14岁儿童',
    riskLevel: 'Low',
    rules: ['年龄 >= 6', '年龄 <= 14']
  },
  {
    id: '305',
    name: '育龄妇女',
    type: '规则标签',
    category: '性别',
    coverageCount: 110,
    status: '启用',
    createTime: '2025-12-15 13:00:00',
    updateTime: '2026-01-05 10:25:00',
    creator: '李管理员',
    description: '15-49岁女性',
    riskLevel: 'Low',
    rules: ['性别 = 女', '年龄 >= 15', '年龄 <= 49']
  },
  {
    id: '306',
    name: '老年人',
    type: '规则标签',
    category: '年龄段',
    coverageCount: 150,
    status: '启用',
    createTime: '2025-12-15 13:00:00',
    updateTime: '2026-01-05 10:25:00',
    creator: '李管理员',
    description: '60岁以上人员',
    riskLevel: 'Low',
    rules: ['年龄 >= 60']
  },
  {
    id: '307',
    name: '流动人口',
    type: '规则标签',
    category: '居住类型',
    coverageCount: 200,
    status: '启用',
    createTime: '2025-12-15 13:00:00',
    updateTime: '2026-01-05 10:25:00',
    creator: '李管理员',
    description: '非本地户籍常住人口',
    riskLevel: 'Low',
    rules: ['居住类型 = 流动']
  },

  // === 智能标签 ===

  // --- 性格特点 ---
  { id: '401', name: '暴躁易怒', type: '智能标签', category: '性格特点', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '情绪容易激动，与他人发生冲突的倾向较高', judgmentCriteria: '走访或纠纷记录中出现争吵、吵架、动手、打人、摔东西、情绪激动、发脾气、骂人等描述', rules: [] },
  { id: '402', name: '热心助人', type: '智能标签', category: '性格特点', coverageCount: 8, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '乐于助人，积极参与社区公共事务', judgmentCriteria: '记录中提及主动帮助邻居、帮忙照看、热心肠、积极参与、志愿服务、义务劳动等', rules: [] },
  { id: '407', name: '内向孤僻', type: '智能标签', category: '性格特点', coverageCount: 4, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '性格内向，不善社交，与外界接触少', judgmentCriteria: '记录中提及不出门、不社交、不参加活动、独来独往、话少、封闭等描述', rules: [] },
  { id: '409', name: '爱占小便宜', type: '智能标签', category: '性格特点', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '喜欢争抢公共资源或占便宜', judgmentCriteria: '记录中提及占公共资源、多拿多占、贪小便宜、争抢、计较得失等描述', rules: [] },
  { id: '410', name: '固执己见', type: '智能标签', category: '性格特点', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '调解中坚持己见，不易妥协', judgmentCriteria: '调解记录中出现拒绝妥协、坚持己见、不接受建议、态度强硬、不让步等描述', rules: [] },
  { id: '411', name: '乐观开朗', type: '智能标签', category: '性格特点', coverageCount: 5, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '性格积极乐观，感染力强', judgmentCriteria: '走访中态度积极、爱说笑、精神状态好、感染力强、开朗健谈等描述', rules: [] },
  { id: '412', name: '多疑敏感', type: '智能标签', category: '性格特点', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '对周围环境警惕，容易产生怀疑', judgmentCriteria: '记录中提及频繁投诉、怀疑邻居、对周围警惕、疑心重、反复确认等描述', rules: [] },
  { id: '413', name: '好面子', type: '智能标签', category: '性格特点', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '在意外人看法，不愿公开暴露问题', judgmentCriteria: '调解中在意面子、不愿公开问题、怕丢人、要求保密、顾及形象等描述', rules: [] },
  { id: '414', name: '爱抱怨', type: '智能标签', category: '性格特点', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '走访中频繁表达不满', judgmentCriteria: '走访中频繁抱怨、表达不满、牢骚多、负面情绪、诉苦等描述', rules: [] },
  { id: '415', name: '脾气温和', type: '智能标签', category: '性格特点', coverageCount: 6, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '即使有矛盾也态度平和', judgmentCriteria: '走访或调解中态度平和、愿意沟通、好说话、通情达理、不计较等描述', rules: [] },

  // --- 生活习惯 ---
  { id: '403', name: '喜欢遛狗', type: '智能标签', category: '生活习惯', coverageCount: 5, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '日常有遛狗习惯', judgmentCriteria: '记录中提及遛狗、养狗、养犬、犬只、宠物狗、牵狗等内容', rules: [] },
  { id: '405', name: '喜欢抽烟', type: '智能标签', category: '生活习惯', coverageCount: 6, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '有日常吸烟习惯', judgmentCriteria: '记录中提及抽烟、吸烟、烟味、烟蒂、烟头等内容', rules: [] },
  { id: '406', name: '早起锻炼', type: '智能标签', category: '生活习惯', coverageCount: 12, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '有早起锻炼身体的习惯', judgmentCriteria: '记录中提及早起、晨练、跑步、太极拳、健身等内容', rules: [] },
  { id: '416', name: '广场舞爱好者', type: '智能标签', category: '生活习惯', coverageCount: 8, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '经常参与广场舞活动', judgmentCriteria: '记录中提及跳广场舞、跳舞、音响、舞蹈队、排练等内容', rules: [] },
  { id: '417', name: '喜欢种菜种花', type: '智能标签', category: '生活习惯', coverageCount: 4, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '有种植花草蔬菜的爱好', judgmentCriteria: '记录中提及种菜、种花、花盆、阳台种植、绿化带种植等内容', rules: [] },
  { id: '418', name: '喜欢打牌下棋', type: '智能标签', category: '生活习惯', coverageCount: 7, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '日常有棋牌娱乐习惯', judgmentCriteria: '记录中提及打牌、下棋、麻将、扑克、象棋、围棋、棋牌室等内容', rules: [] },
  { id: '419', name: '夜间活动多', type: '智能标签', category: '生活习惯', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '深夜活动频繁，作息不规律', judgmentCriteria: '记录中提及深夜活动、晚归、夜间噪音、半夜、凌晨等内容', rules: [] },
  { id: '420', name: '酗酒', type: '智能标签', category: '生活习惯', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '有过度饮酒行为', judgmentCriteria: '记录中提及醉酒、喝多了、饮酒过量、酒后闹事、酗酒等内容', rules: [] },
  { id: '421', name: '囤积杂物', type: '智能标签', category: '生活习惯', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '家中或楼道堆放大量杂物', judgmentCriteria: '走访中发现屋内堆满杂物、楼道堆物、收废品、囤积、凌乱不堪等描述', rules: [] },
  { id: '422', name: '爱养宠物', type: '智能标签', category: '生活习惯', coverageCount: 4, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '饲养宠物（猫、鸟等）', judgmentCriteria: '记录中提及养猫、养鸟、宠物、猫粮、鸟笼等内容', rules: [] },
  { id: '423', name: '作息规律', type: '智能标签', category: '生活习惯', coverageCount: 5, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '生活自律，早睡早起', judgmentCriteria: '走访中体现早睡早起、作息规律、生活自律、按时吃饭等描述', rules: [] },

  // --- 社交特征 ---
  { id: '404', name: '邻里关系差', type: '智能标签', category: '社交特征', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '与邻居关系紧张，频繁产生矛盾', judgmentCriteria: '多次出现与邻居产生矛盾、投诉邻居、被邻居投诉、邻里纠纷、不和睦等描述', rules: [] },
  { id: '424', name: '邻里关系好', type: '智能标签', category: '社交特征', coverageCount: 6, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '与邻居关系融洽', judgmentCriteria: '记录中提及互帮互助、邻居关系好、关系融洽、邻里和睦等描述', rules: [] },
  { id: '425', name: '社区活跃分子', type: '智能标签', category: '社交特征', coverageCount: 5, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '积极参与社区活动和公共事务', judgmentCriteria: '记录中提及积极参与社区活动、业委会、议事会、组织活动、带头参加等描述', rules: [] },
  { id: '426', name: '不合群', type: '智能标签', category: '社交特征', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '不愿参与集体活动', judgmentCriteria: '记录中提及拒绝参与活动、不合群、与周围人缺乏往来、不参加等描述', rules: [] },
  { id: '427', name: '爱管闲事', type: '智能标签', category: '社交特征', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '喜欢参与他人事务', judgmentCriteria: '记录中提及频繁反映他人问题、主动干预别人家事、爱管闲事、多管闲事等描述', rules: [] },
  { id: '428', name: '影响力大', type: '智能标签', category: '社交特征', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '在邻里中有号召力', judgmentCriteria: '记录中提及有号召力、说话有分量、大家都听他的、带头作用、意见领袖等描述', rules: [] },
  { id: '429', name: '爱串门', type: '智能标签', category: '社交特征', coverageCount: 4, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '社交频繁，经常走访邻居', judgmentCriteria: '走访中经常在邻居家、串门、社交频繁、到处聊天等描述', rules: [] },
  { id: '430', name: '经常与人起冲突', type: '智能标签', category: '社交特征', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '多次出现在纠纷记录中', judgmentCriteria: '多次出现在纠纷记录中作为当事方、频繁发生冲突、与多人产生矛盾等描述', rules: [] },
  { id: '431', name: '喜欢拉帮结派', type: '智能标签', category: '社交特征', coverageCount: 1, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '在矛盾中组织人员施压', judgmentCriteria: '矛盾中组织其他居民施压、拉帮结派、串联、联名投诉等描述', rules: [] },

  // --- 家庭状况 ---
  { id: '408', name: '亲子关系紧张', type: '智能标签', category: '家庭状况', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '与子女关系不和，存在家庭矛盾', judgmentCriteria: '记录中提及子女不探望、不赡养、亲子矛盾、和孩子吵、子女不管等描述', rules: [] },
  { id: '432', name: '夫妻关系紧张', type: '智能标签', category: '家庭状况', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '夫妻之间存在矛盾', judgmentCriteria: '记录中提及夫妻争吵、冷战、分居、闹离婚、家庭不和等描述', rules: [] },
  { id: '433', name: '婆媳关系差', type: '智能标签', category: '家庭状况', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '婆媳之间关系紧张', judgmentCriteria: '记录中提及婆媳矛盾、婆媳不和、婆婆和媳妇吵架、家庭纠纷涉及婆媳等描述', rules: [] },
  { id: '434', name: '家庭和睦', type: '智能标签', category: '家庭状况', coverageCount: 8, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '家庭关系和谐融洽', judgmentCriteria: '走访中家庭氛围好、关系融洽、一家人和和气气、家庭幸福等描述', rules: [] },
  { id: '435', name: '子女不在身边', type: '智能标签', category: '家庭状况', coverageCount: 5, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '子女在外地工作或定居', judgmentCriteria: '记录中提及子女外地工作、子女不在身边、缺少照料、孩子不在家等描述', rules: [] },
  { id: '436', name: '家庭经济困难', type: '智能标签', category: '家庭状况', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '家庭经济压力较大', judgmentCriteria: '走访中反映经济压力大、需要救助、生活困难、缺钱看病等描述', rules: [] },
  { id: '437', name: '家有病患', type: '智能标签', category: '家庭状况', coverageCount: 4, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '家中有需要长期照护的病患', judgmentCriteria: '记录中提及家人卧床、长期照护、陪护病人、家有病患等描述', rules: [] },
  { id: '438', name: '单亲家庭', type: '智能标签', category: '家庭状况', coverageCount: 2, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '独自抚养子女', judgmentCriteria: '记录中提及单亲、独自带孩子、离异带娃、一个人养孩子等描述', rules: [] },
  { id: '439', name: '隔代抚养', type: '智能标签', category: '家庭状况', coverageCount: 3, status: '启用', createTime: '2026-01-10 10:00:00', updateTime: '2026-01-10 10:00:00', creator: '系统', description: '老人带孙辈，父母不在身边', judgmentCriteria: '记录中提及老人带孙子、隔代抚养、爷爷奶奶带、父母外出打工等描述', rules: [] }
];

// 标签存储类
class TagStore {
  private tags: TagItem[] = [...initialTags];
  private versions: TagVersion[] = [];

  // 获取所有标签
  getTags(): TagItem[] {
    return [...this.tags];
  }

  // 获取单个标签
  getTag(id: string): TagItem | undefined {
    return this.tags.find(tag => tag.id === id);
  }

  // 获取所有智能标签（供 QuickNote 使用）
  getSmartTags(): TagItem[] {
    return this.tags.filter(tag => tag.type === '智能标签' && tag.status === '启用');
  }

  // 添加标签
  addTag(tag: TagItem): void {
    this.tags = [tag, ...this.tags];
    this.addVersion({
      id: Date.now().toString(),
      tagId: tag.id,
      version: 1,
      updateTime: tag.createTime,
      operator: tag.creator,
      changes: ['创建标签'],
      coverageCount: tag.coverageCount,
      config: tag
    });
  }

  // 更新标签
  updateTag(id: string, data: Partial<TagItem>, operator: string = '系统'): void {
    const oldTag = this.tags.find(t => t.id === id);
    if (!oldTag) return;

    const changes: string[] = [];
    if (data.name && data.name !== oldTag.name) {
      changes.push(`修改名称：${oldTag.name} -> ${data.name}`);
    }
    if (data.description && data.description !== oldTag.description) {
      changes.push('修改描述信息');
    }
    if (data.rules && JSON.stringify(data.rules) !== JSON.stringify(oldTag.rules)) {
      changes.push('修改规则条件');
    }
    if (data.status && data.status !== oldTag.status) {
      changes.push(`修改状态：${oldTag.status} -> ${data.status}`);
    }
    if (data.judgmentCriteria && data.judgmentCriteria !== oldTag.judgmentCriteria) {
      changes.push('修改判定描述');
    }

    this.tags = this.tags.map(tag =>
      tag.id === id ? { ...tag, ...data, updateTime: new Date().toLocaleString('zh-CN') } : tag
    );

    // 记录版本
    const versions = this.versions.filter(v => v.tagId === id);
    const newVersion = versions.length + 1;
    this.addVersion({
      id: Date.now().toString(),
      tagId: id,
      version: newVersion,
      updateTime: new Date().toLocaleString('zh-CN'),
      operator,
      changes,
      coverageCount: data.coverageCount || oldTag.coverageCount,
      config: { ...oldTag, ...data }
    });
  }

  // 删除标签
  deleteTag(id: string): void {
    this.tags = this.tags.filter(tag => tag.id !== id);
    this.versions = this.versions.filter(v => v.tagId !== id);
  }

  // 切换标签状态
  toggleStatus(id: string): void {
    const tag = this.tags.find(t => t.id === id);
    if (tag) {
      const newStatus = tag.status === '启用' ? '禁用' : '启用';
      this.updateTag(id, { status: newStatus }, '系统');
    }
  }

  // 添加版本记录
  addVersion(version: TagVersion): void {
    this.versions = [version, ...this.versions];
  }

  // 获取标签版本历史
  getVersionHistory(tagId: string): TagVersion[] {
    return this.versions
      .filter(v => v.tagId === tagId)
      .sort((a, b) => b.version - a.version);
  }

  // 恢复到指定版本
  restoreVersion(tagId: string, version: number, operator: string): void {
    const versionData = this.versions.find(v => v.tagId === tagId && v.version === version);
    if (!versionData) return;

    this.updateTag(tagId, versionData.config, operator);
  }

  // 获取统计信息
  getStats() {
    const enabledTags = this.tags.filter(t => t.status === '启用');
    return {
      total: this.tags.length,
      enabled: enabledTags.length,
      totalCoverage: enabledTags.reduce((sum, t) => sum + t.coverageCount, 0),
      avgCoverage: Math.round(enabledTags.reduce((sum, t) => sum + t.coverageCount, 0) / enabledTags.length),
      byType: {
        rule: this.tags.filter(t => t.type === '规则标签').length,
        smart: this.tags.filter(t => t.type === '智能标签').length,
      },
      byCategory: this.getCategoryStats()
    };
  }

  // 按分类统计
  private getCategoryStats() {
    const stats: Record<string, number> = {};
    this.tags.forEach(tag => {
      stats[tag.category] = (stats[tag.category] || 0) + 1;
    });
    return stats;
  }

  // 搜索标签
  searchTags(keyword: string): TagItem[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.tags.filter(tag =>
      tag.name.toLowerCase().includes(lowerKeyword) ||
      tag.description.toLowerCase().includes(lowerKeyword) ||
      tag.category.toLowerCase().includes(lowerKeyword)
    );
  }

  // 按类型筛选
  filterByType(type: string): TagItem[] {
    if (type === 'all') return this.tags;
    return this.tags.filter(tag => tag.type === type);
  }

  // 按分类筛选
  filterByCategory(category: string): TagItem[] {
    if (category === 'all') return this.tags;
    return this.tags.filter(tag => tag.category === category);
  }

  // 按状态筛选
  filterByStatus(status: string): TagItem[] {
    if (status === 'all') return this.tags;
    return this.tags.filter(tag => tag.status === status);
  }
}

// 创建单例实例
export const tagStore = new TagStore();
