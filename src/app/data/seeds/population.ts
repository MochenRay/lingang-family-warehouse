import { Person } from '../../types/core';
import { SEED_HOUSES } from './housing';

export const SEED_PEOPLE: Person[] = [
  // 原有人员 (p1-p11) 移至 g2
  {
    id: "p1",
    gridId: "g2",
    name: "张伟",
    idCard: "37100219890101001X",
    gender: "男",
    age: 35,
    phone: "13800138000",
    address: "海梦苑1号楼1单元101",
    houseId: "h1",
    tags: ["党员", "青年", "热心助人", "作息规律", "邻里关系好", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "本科",
    updatedAt: "2025-12-20",
    familyRelations: [
      { relatedPersonId: "p3", relationType: "配偶" },
      { relatedPersonId: "p2", relationType: "子女" },
      { relatedPersonId: "p_father", relationType: "父亲" },
      { relatedPersonId: "p_mother", relationType: "母亲" },
      { relatedPersonId: "p_brother", relationType: "兄弟" }
    ],
    // 详细信息
    birthDate: "1989-01",
    birthplace: "山东烟台",
    maritalStatus: "已婚",
    politicalStatus: "中共党员",
    militaryService: false,
    graduationInfo: "山东大学 计算机科学与技术专业",
    workplace: "蓬莱区某科技公司 技术总监",
    communityVolunteer: true,
    skills: "编程、羽毛球、摄影",
    pets: "无",
    categoryLabels: {
      isUnitLeader: true,
      isFloorLeader: false,
      isAssistant: false
    },
    biography: "2007-2011年，在山东大学学习计算机科学与技术专业。2011-2015年，在北京某互联网公司从事软件开发工作，担任高级工程师。2015年至今，在蓬莱区某科技公司担任技术总监，负责公司核心产品研发。",
    activityParticipation: {
      activities: "定期参加社区志愿服务活动，担任单元长，协助社区开展居民服务工作。积极参与社区文化活动和体育活动。",
      needs: "希望社区能够提供更多儿童活动空间和设施，丰富孩子的课余生活。"
    },
    healthRecord: {
      hasChronic: false,
      needsRegularMedicine: false,
      isSeverePatient: false,
      isPregnant: false
    }
  },
  {
    id: "p2",
    gridId: "g2",
    name: "张小明",
    idCard: "371002201506010031",
    gender: "男",
    age: 9,
    address: "海梦苑1号楼1单元101",
    houseId: "h1",
    tags: ["学龄儿童", "乐观开朗", "邻里关系好", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "小学",
    updatedAt: "2025-12-20",
    familyRelations: [
      { relatedPersonId: "p1", relationType: "父亲" },
      { relatedPersonId: "p3", relationType: "母亲" },
      { relatedPersonId: "p_father", relationType: "祖父母" },
      { relatedPersonId: "p_mother", relationType: "祖父母" }
    ]
  },
  {
    id: "p3",
    gridId: "g2",
    name: "刘芳",
    idCard: "371002199002150022",
    gender: "女",
    age: 34,
    address: "海梦苑1号楼1单元101",
    houseId: "h1",
    tags: ["育龄妇女", "脾气温和", "喜欢种菜种花", "社区活跃分子", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "大专",
    updatedAt: "2025-12-20",
    familyRelations: [
      { relatedPersonId: "p1", relationType: "配偶" },
      { relatedPersonId: "p2", relationType: "子女" }
    ],
    // 详细信息
    birthDate: "1990-02",
    birthplace: "山东济南",
    maritalStatus: "已婚",
    politicalStatus: "群众",
    militaryService: false,
    graduationInfo: "济南职业学院 会计专业",
    workplace: "蓬莱区某贸易公司 财务主管",
    communityVolunteer: true,
    skills: "绘画、烹饪、瑜伽",
    pets: "无",
    categoryLabels: {
      isFloorLeader: false,
      isUnitLeader: false,
      isAssistant: false
    },
    biography: "2008-2011年，在济南职业学院学习会计专业。2011-2015年，在济南某企业从事会计工作。2015年随丈夫迁至烟台蓬莱，在蓬莱区某贸易公司担任财务主管。",
    activityParticipation: {
      activities: "积极参加社区文艺活动，曾参与社区春节联欢会节目表演。参与社区志愿服务。",
      needs: "希望社区能够组织更多亲子活动，增进家长与孩子的互动。"
    },
    healthRecord: {
      hasChronic: false,
      needsRegularMedicine: false,
      isSeverePatient: false,
      isPregnant: false
    }
  },
  {
    id: "p4",
    gridId: "g2",
    name: "李军",
    idCard: "371002195203030015",
    gender: "男",
    age: 72,
    address: "海梦苑1号楼1单元102",
    houseId: "h2",
    tags: ["空巢老人", "低保人群", "高血压", "固执己见", "喜欢打牌下棋", "不合群", "子女不在身边", "家庭经济困难", "家有病患"],
    type: "户籍",
    risk: "High",
    nation: "汉族",
    education: "初中",
    updatedAt: "2025-12-21",
    // 详细信息
    birthDate: "1952-03",
    birthplace: "山东烟台",
    maritalStatus: "丧偶",
    politicalStatus: "群众",
    militaryService: true,
    graduationInfo: "初中毕业",
    workplace: "已退休，原烟台某工厂工人",
    communityVolunteer: false,
    skills: "象棋",
    pets: "无",
    careLabels: ["独居老人", "低保户"],
    biography: "1968-1970年服兵役，在山东某部队服役。1970-2012年在烟台某工厂工作，担任车间工人。2012年退休后随子女迁至蓬莱居住。配偶于2018年去世，目前独居。",
    activityParticipation: {
      activities: "偶尔参加社区组织的老年活动，喜欢在社区活动室下象棋。",
      needs: "需要定期体检服务和购药帮助，希望社区能够提供更多关怀和探访。"
    },
    healthRecord: {
      hasChronic: true,
      chronicDetails: "高血压、轻度糖尿病",
      needsRegularMedicine: true,
      medicineFrequency: "每月一次，需购买降压药和降糖药",
      medicalVisitFrequency: "每季度一次到社区医院复查",
      isSeverePatient: false,
      isPregnant: false,
      specialNotes: "血压控制尚可，需要定期监测血糖和血压。行动不便，上下楼需要帮助。"
    },
    importantEvents: "2023年10月因跌倒住院治疗一周，目前已康复。社区已安排定期探访。"
  },
  {
    id: "p5",
    gridId: "g2",
    name: "陈强",
    idCard: "371002199608080019",
    gender: "男",
    age: 28,
    address: "海梦苑8号楼2单元101",
    houseId: "h3",
    tags: ["流动人口", "内向孤僻", "夜间活动多", "不合群"],
    type: "流动",
    risk: "Medium",
    nation: "满族",
    education: "高中",
    updatedAt: "2025-12-22"
  },
  {
    id: "p6",
    gridId: "g2",
    name: "赵敏",
    idCard: "371002198511200028",
    gender: "女",
    age: 39,
    address: "海梦苑2号楼3单元602",
    houseId: "h4",
    tags: ["妇女主任", "热心助人", "爱管闲事", "影响力大", "社区活跃分子", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "大专",
    updatedAt: "2025-12-23"
  },
  {
    id: "p7",
    gridId: "g2",
    name: "王强",
    idCard: "371002198309100017",
    gender: "男",
    age: 41,
    address: "海梦苑2号楼3单元602",
    houseId: "h4",
    tags: ["退役军人", "固执己见", "早起锻炼", "作息规律", "邻里关系好", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "高中",
    updatedAt: "2025-12-23"
  },
  {
    id: "p8",
    gridId: "g2",
    name: "周杰",
    idCard: "37100219981212001X",
    gender: "男",
    age: 26,
    address: "海梦苑5号楼2单元404",
    houseId: "h6",
    tags: ["流动人口", "租客", "乐观开朗", "爱串门"],
    type: "流动",
    risk: "Medium",
    nation: "汉族",
    education: "本科",
    updatedAt: "2025-12-24"
  },
  {
    id: "p9",
    gridId: "g2",
    name: "吴刚",
    idCard: "371002197505050011",
    gender: "男",
    age: 49,
    address: "海梦苑6号楼1单元101",
    houseId: "h7",
    tags: ["个体工商户", "信访人员", "暴躁易怒", "爱抱怨", "经常与人起冲突", "邻里关系差", "夫妻关系紧张"],
    type: "户籍",
    risk: "High",
    nation: "回族",
    education: "初中",
    updatedAt: "2025-12-25"
  },
  {
    id: "p10",
    gridId: "g2",
    name: "孙奶奶",
    idCard: "371002194501010022",
    gender: "女",
    age: 79,
    address: "海梦苑7号楼3单元502",
    houseId: "h8",
    tags: ["高龄老人", "独居", "脾气温和", "早起锻炼", "广场舞爱好者", "邻里关系好", "子女不在身边"],
    type: "户籍",
    risk: "Medium",
    nation: "汉族",
    education: "小学",
    updatedAt: "2025-12-26"
  },
  {
    id: "p11",
    gridId: "g2",
    name: "郑强",
    idCard: "371002197808080013",
    gender: "男",
    age: 46,
    address: "海梦苑7号楼3单元502",
    houseId: "h8",
    tags: ["残疾人", "低保户", "内向孤僻", "多疑敏感", "不合群", "家庭经济困难"],
    type: "户籍",
    risk: "High",
    nation: "汉族",
    education: "初中",
    updatedAt: "2025-12-26"
  },
  // 新增人员 (p12-p112) - 生成 100 人，填充到 9/10 号楼
  ...Array.from({ length: 100 }, (_, i) => {
    const id = `p${i + 12}`;
    const familyNames = ["赵", "钱", "孙", "李", "周", "吴", "郑", "王", "冯", "陈", "褚", "卫", "蒋", "沈", "韩", "杨"];
    const givenNames = ["铁柱", "淑芬", "志刚", "秀英", "建国", "桂兰", "伟", "丽", "军", "红", "明", "芳", "杰", "敏", "强", "刚"];
    const name = `${familyNames[i % familyNames.length]}${givenNames[i % givenNames.length]}`;
    const gender = i % 2 === 0 ? "男" : "女";
    const age = Math.floor(Math.random() * 70) + 5; 
    
    // 关联到新增的房屋 (h9-h56)
    // 我们有 48 个新房子 (h9 - h56)
    // 让人均匀分布，排除空置的房子(虽然简化逻辑可以不管)
    const houseIndex = i % 48; 
    const houseId = `h${houseIndex + 9}`;
    const house = SEED_HOUSES.find(h => h.id === houseId) || SEED_HOUSES[SEED_HOUSES.length - 1]; 
    
    const type = i % 5 === 0 ? "流动" : "户籍";
    const risk = i % 20 === 0 ? "High" : (i % 10 === 0 ? "Medium" : "Low");
    
    // 标签池 - 根据年龄和性别动态调整
    const tags: string[] = [];
    
    // 根据风险等级和年龄分配合理的标签
    if (risk === "High") {
      // 高风险标签 - 必须是成年人（18岁以上）
      if (age >= 18) {
        const tagsHighAdult = ['刑满释放', '严重精神障碍', '重点上访', '社区矫正'];
        if (age >= 14) tagsHighAdult.unshift('吸毒人员'); // 14岁以上可能涉毒
        const randomTag = tagsHighAdult[Math.floor(Math.random() * tagsHighAdult.length)];
        tags.push(randomTag);
      } else {
        // 未成年高风险：改为中等风险标签
        if (age >= 6 && age <= 14) tags.push('学龄儿童');
      }
    } else if (risk === "Medium") {
      // 中等风险标签 - 根据年龄分配
      if (age >= 60) {
        const tagsElderly = ['空巢老人', '独居老人'];
        tags.push(tagsElderly[Math.floor(Math.random() * tagsElderly.length)]);
      } else if (age >= 16) {
        const tagsMediumAdult = ['残疾人', '低保户', '失业人员', '群租人员'];
        tags.push(tagsMediumAdult[Math.floor(Math.random() * tagsMediumAdult.length)]);
      } else {
        // 未成年中风险
        if (age >= 6 && age <= 14) tags.push('学龄儿童');
      }
    } else {
      // Low risk - 常规标签，根据年龄和性别分配
      const tagsLowPool: string[] = [];
      if (age >= 18) tagsLowPool.push('党员', '志愿者');
      if (age >= 18 && gender === '男') tagsLowPool.push('退役军人');
      if (type === "流动") tagsLowPool.push('流动人口');
      
      if (tagsLowPool.length > 0 && Math.random() > 0.3) {
        const randomTag = tagsLowPool[Math.floor(Math.random() * tagsLowPool.length)];
        tags.push(randomTag);
      }
    }
    
    // 补充规则类标签逻辑，确保数据合理性
    if (age >= 60 && !tags.includes('老年人')) tags.push("老年人");
    if (age >= 6 && age <= 14 && !tags.includes('学龄儿童')) tags.push("学龄儿童");
    if (gender === '女' && age >= 15 && age <= 49 && !tags.includes('育龄妇女')) tags.push("育龄妇女");
    if (type === "流动" && !tags.includes('流动人口')) tags.push("流动人口");
    
    // 智能标签 - 根据年龄、性别合理分配
    const smartTagPool: string[] = [];

    // 性格特点 - 大部分适用所有年龄
    const personalityTags = ['乐观开朗', '脾气温和', '好面子'];
    if (age >= 14) personalityTags.push('暴躁易怒', '固执己见', '多疑敏感', '爱抱怨', '内向孤僻', '爱占小便宜');
    if (age >= 6) personalityTags.push('热心助人');

    // 生活习惯 - 需要年龄限制
    const habitTags: string[] = [];
    if (age >= 6) habitTags.push('早起锻炼', '作息规律', '爱养宠物');
    if (age >= 14) habitTags.push('喜欢遛狗');
    if (age >= 18) habitTags.push('喜欢抽烟', '喜欢打牌下棋', '夜间活动多', '囤积杂物');
    if (age >= 30) habitTags.push('喜欢种菜种花');
    if (age >= 40 && gender === '女') habitTags.push('广场舞爱好者');
    if (age >= 18) habitTags.push('酗酒');

    // 社交特征 - 需要一定社交能力
    const socialTags: string[] = [];
    if (age >= 10) socialTags.push('邻里关系好', '邻里关系差', '不合群');
    if (age >= 14) socialTags.push('爱管闲事', '爱串门');
    if (age >= 18) socialTags.push('社区活跃分子', '影响力大', '经常与人起冲突', '喜欢拉帮结派');

    // 家庭状况 - 需要对应家庭角色
    const familyTags: string[] = ['家庭和睦'];
    if (age >= 18) familyTags.push('家庭经济困难');
    if (age >= 22) familyTags.push('夫妻关系紧张');
    if (age >= 25) familyTags.push('亲子关系紧张');
    if (age >= 40 && gender === '女') familyTags.push('婆媳关系差');
    if (age >= 55) familyTags.push('子女不在身边');
    if (age >= 18) familyTags.push('家有病患', '单亲家庭');
    if (age >= 55) familyTags.push('隔代抚养');

    // 从各池中随机选 0-2 个
    const pickRandom = (pool: string[], max: number) => {
      const count = Math.floor(Math.random() * (max + 1));
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    smartTagPool.push(...pickRandom(personalityTags, 2));
    smartTagPool.push(...pickRandom(habitTags, 2));
    smartTagPool.push(...pickRandom(socialTags, 1));
    smartTagPool.push(...pickRandom(familyTags, 1));

    // 避免矛盾标签共存
    if (smartTagPool.includes('暴躁易怒') && smartTagPool.includes('脾气温和')) {
      smartTagPool.splice(smartTagPool.indexOf('脾气温和'), 1);
    }
    if (smartTagPool.includes('邻里关系好') && smartTagPool.includes('邻里关系差')) {
      smartTagPool.splice(smartTagPool.indexOf('邻里关系差'), 1);
    }
    if (smartTagPool.includes('不合群') && smartTagPool.includes('社区活跃分子')) {
      smartTagPool.splice(smartTagPool.indexOf('社区活跃分子'), 1);
    }
    if (smartTagPool.includes('家庭和睦') && (smartTagPool.includes('夫妻关系紧张') || smartTagPool.includes('亲子关系紧张') || smartTagPool.includes('婆媳关系差'))) {
      smartTagPool.splice(smartTagPool.indexOf('家庭和睦'), 1);
    }

    tags.push(...smartTagPool);

    // 去重
    const uniqueTags = [...new Set(tags)];
    
    // 烟台人口统计模拟：汉族占绝大多数(>99%)，少数民族主要为朝鲜族、满族、回族
    let nation = '汉族';
    const rand = Math.random();
    if (rand > 0.99) nation = '朝鲜族'; // 靠近韩国，有一定比例
    else if (rand > 0.985) nation = '满族';
    else if (rand > 0.98) nation = '回族';

    // 教育程度与年龄逻辑强相关
    let education = '其他';
    if (age < 6) {
      education = '学龄前';
    } else if (age >= 6 && age <= 12) {
      education = '小学';
    } else if (age >= 13 && age <= 15) {
      education = '初中';
    } else if (age >= 16 && age <= 18) {
      education = '高中'; // 包含中专
    } else {
      // 19岁以上，根据年龄段分布学历
      // 烟台作为沿海开放城市，受教育程度较高
      const eduRand = Math.random();
      if (age <= 35) {
         // 年轻一代：本科/大专比例高
         if (eduRand > 0.97) education = '博士';
         else if (eduRand > 0.92) education = '硕士';
         else if (eduRand > 0.50) education = '本科';
         else if (eduRand > 0.25) education = '大专';
         else education = '高中';
      } else if (age <= 55) {
         // 中年：高中/大专/本科均衡
         if (eduRand > 0.98) education = '博士';
         else if (eduRand > 0.95) education = '硕士';
         else if (eduRand > 0.70) education = '本科';
         else if (eduRand > 0.40) education = '大专';
         else if (eduRand > 0.15) education = '高中';
         else education = '初中';
      } else {
         // 老年：初中/小学为主
         if (eduRand > 0.90) education = '本科'; // 极少数高知
         else if (eduRand > 0.75) education = '大专';
         else if (eduRand > 0.50) education = '高中';
         else if (eduRand > 0.20) education = '初中';
         else education = '小学';
      }
    }

    return {
      id,
      gridId: "g1", // 都在 g1
      name,
      idCard: `371002${1950 + (100 - age)}${String(Math.floor(Math.random()*12)+1).padStart(2, '0')}${String(Math.floor(Math.random()*28)+1).padStart(2, '0')}00${i%10}X`,
      gender: gender as any,
      age,
      nation,
      education,
      phone: `13${Math.floor(Math.random()*10)}0000${String(i).padStart(4, '0')}`,
      address: house ? house.address : "海梦苑",
      houseId: house ? house.id : undefined,
      tags: uniqueTags,
      type: type as any,
      risk: risk as any,
      updatedAt: "2025-12-27"
    };
  }),
  // 张伟的父母
  {
    id: "p_father",
    gridId: "g2",
    name: "张建国",
    idCard: "371002195605120011",
    gender: "男",
    age: 68,
    phone: "13800138100",
    address: "海梦苑4号楼2单元301",
    houseId: "h_parents",
    tags: ["老年人", "党员", "固执己见", "早起锻炼", "喜欢打牌下棋", "邻里关系好", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "高中",
    updatedAt: "2025-12-28",
    familyRelations: [
      { relatedPersonId: "p_mother", relationType: "配偶" },
      { relatedPersonId: "p1", relationType: "子女" },
      { relatedPersonId: "p_brother", relationType: "子女" }
    ]
  },
  {
    id: "p_mother",
    gridId: "g2",
    name: "王秀兰",
    idCard: "371002195803280022",
    gender: "女",
    age: 66,
    phone: "13800138101",
    address: "海梦苑4号楼2单元301",
    houseId: "h_parents",
    tags: ["老年人", "育龄妇女", "脾气温和", "喜欢种菜种花", "广场舞爱好者", "爱串门", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "初中",
    updatedAt: "2025-12-28",
    familyRelations: [
      { relatedPersonId: "p_father", relationType: "配偶" },
      { relatedPersonId: "p1", relationType: "子女" },
      { relatedPersonId: "p_brother", relationType: "子女" }
    ]
  },
  // 张伟的兄弟一家
  {
    id: "p_brother",
    gridId: "g2",
    name: "张磊",
    idCard: "371002199203150033",
    gender: "男",
    age: 32,
    phone: "13800138200",
    address: "海梦苑4号楼1单元502",
    houseId: "h_brother",
    tags: ["青年", "乐观开朗", "喜欢遛狗", "邻里关系好", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "本科",
    updatedAt: "2025-12-29",
    familyRelations: [
      { relatedPersonId: "p_sister_in_law", relationType: "配偶" },
      { relatedPersonId: "p_nephew1", relationType: "子女" },
      { relatedPersonId: "p_nephew2", relationType: "子女" },
      { relatedPersonId: "p1", relationType: "兄弟" },
      { relatedPersonId: "p_father", relationType: "父亲" },
      { relatedPersonId: "p_mother", relationType: "母亲" }
    ]
  },
  {
    id: "p_sister_in_law",
    gridId: "g2",
    name: "李娜",
    idCard: "371002199305200044",
    gender: "女",
    age: 31,
    phone: "13800138201",
    address: "海梦苑4号楼1单元502",
    houseId: "h_brother",
    tags: ["育龄妇女", "青年", "脾气温和", "爱养宠物", "社区活跃分子", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "大专",
    updatedAt: "2025-12-29",
    familyRelations: [
      { relatedPersonId: "p_brother", relationType: "配偶" },
      { relatedPersonId: "p_nephew1", relationType: "子女" },
      { relatedPersonId: "p_nephew2", relationType: "子女" }
    ]
  },
  {
    id: "p_nephew1",
    gridId: "g2",
    name: "张小宇",
    idCard: "371002201801100055",
    gender: "男",
    age: 6,
    address: "海梦苑4号楼1单元502",
    houseId: "h_brother",
    tags: ["学龄儿童", "乐观开朗", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "学龄前",
    updatedAt: "2025-12-29",
    familyRelations: [
      { relatedPersonId: "p_brother", relationType: "父亲" },
      { relatedPersonId: "p_sister_in_law", relationType: "母亲" },
      { relatedPersonId: "p_nephew2", relationType: "兄弟" }
    ]
  },
  {
    id: "p_nephew2",
    gridId: "g2",
    name: "张小雨",
    idCard: "371002202105150066",
    gender: "女",
    age: 3,
    address: "海梦苑4号楼1单元502",
    houseId: "h_brother",
    tags: ["学龄前", "乐观开朗", "家庭和睦"],
    type: "户籍",
    risk: "Low",
    nation: "汉族",
    education: "学龄前",
    updatedAt: "2025-12-29",
    familyRelations: [
      { relatedPersonId: "p_brother", relationType: "父亲" },
      { relatedPersonId: "p_sister_in_law", relationType: "母亲" },
      { relatedPersonId: "p_nephew1", relationType: "兄弟" }
    ]
  }
];
