import { VisitRecord, GridWorkerScore } from '../../types/core';

export const SEED_VISITS: VisitRecord[] = [
  {
    id: "v1",
    targetId: "p4",
    targetType: "person",
    gridId: "g2",
    visitorName: "网格员张三",
    date: "2025-12-25",
    content: "入户探访，身体状况良好，药品充足。",
    tags: ["日常走访", "关爱服务"]
  },
  {
    id: "v2",
    targetId: "h6",
    targetType: "house",
    gridId: "g2",
    visitorName: "网格员张三",
    date: "2025-12-26",
    content: "检查消防安全，发现私拉电线，已要求整改。",
    tags: ["安全检查", "消防隐患"]
  },
  {
    id: "v_zw_1",
    targetId: "p1",
    targetType: "person",
    gridId: "g2",
    visitorName: "网格员张三",
    date: "2026-01-10",
    content: "核实家庭成员信息，确认近期购入新能源车一辆，已登记车牌号。",
    tags: ["信息采集", "车辆登记"]
  },
  {
    id: "v_zw_2",
    targetId: "p1",
    targetType: "person",
    gridId: "g2",
    visitorName: "网格员李四",
    date: "2026-01-05",
    content: "送达社区党支部最新学习材料，交流近期社区建设意见。",
    tags: ["党员联系", "社情民意"]
  },
  {
    id: "v_zw_3",
    targetId: "p1",
    targetType: "person",
    gridId: "g2",
    visitorName: "网格员张三",
    date: "2025-12-30",
    content: "动员参加社区周末'清洁家园'志愿服务活动，表示支持并将准时参加。",
    tags: ["志愿服务", "活动动员"]
  },
  {
    id: "v_lj_1",
    targetId: "p4",
    targetType: "person",
    gridId: "g2",
    visitorName: "网格员张三",
    date: "2026-01-12",
    content: "上门测量血压（135/85），询问近期用药情况，身体状况稳定，叮嘱注意防寒保暖。",
    tags: ["健康服务", "慢病管理"]
  },
  {
    id: "v_lj_2",
    targetId: "p4",
    targetType: "person",
    gridId: "g2",
    visitorName: "社区书记王五",
    date: "2026-01-08",
    content: "春节前夕走访慰问，送去米面油等生活物资，了解生活困难需求。",
    tags: ["慰问关怀", "帮扶救助"]
  },
  {
    id: "v_lj_3",
    targetId: "p4",
    targetType: "person",
    gridId: "g2",
    visitorName: "网格员张三",
    date: "2026-01-02",
    content: "重点检查厨房燃气报警器是否正常工作，发现电池电量偏低，已协助更换新电池。",
    tags: ["安全隐患", "消防安全"]
  },
  // ========== g1 网格走访记录 ==========
  { id: "v_g1_01", targetId: "p12", targetType: "person", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-20", content: "入户核实家庭成员信息，确认新增一名婴儿，已登记户口。", tags: ["信息采集", "人口变动"] },
  { id: "v_g1_02", targetId: "p15", targetType: "person", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-19", content: "上门测量血压（142/90），建议尽快就医复查，已记录健康档案。", tags: ["健康服务", "慢病管理"] },
  { id: "v_g1_03", targetId: "h11", targetType: "house", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-18", content: "检查出租房消防设施，灭火器过期，已通知房东限期更换。", tags: ["安全检查", "消防隐患"] },
  { id: "v_g1_04", targetId: "p20", targetType: "person", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-17", content: "走访独居老人，精神状态良好，叮嘱注意用电安全。", tags: ["关爱服务", "独居老人"] },
  { id: "v_g1_05", targetId: "p25", targetType: "person", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-16", content: "动员参加社区义诊活动，已登记报名。", tags: ["活动动员", "健康服务"] },
  { id: "v_g1_06", targetId: "h27", targetType: "house", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-15", content: "核查10号楼1单元住户信息，发现一户未登记流动人口，已补录。", tags: ["信息采集", "流动人口"] },
  { id: "v_g1_07", targetId: "p30", targetType: "person", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-14", content: "了解家庭困难情况，协助申请临时救助。", tags: ["帮扶救助", "民生服务"] },
  { id: "v_g1_08", targetId: "p35", targetType: "person", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-13", content: "走访退役军人家庭，了解就业需求，推荐社区招聘岗位。", tags: ["退役军人", "就业服务"] },
  { id: "v_g1_09", targetId: "p40", targetType: "person", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-12", content: "回访精神障碍患者，服药情况正常，家属照护到位。", tags: ["精神卫生", "回访"] },
  { id: "v_g1_10", targetId: "h33", targetType: "house", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-11", content: "检查楼道杂物堆放，已清理完毕，提醒住户保持通道畅通。", tags: ["安全检查", "消防安全"] },
  { id: "v_g1_11", targetId: "p50", targetType: "person", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-10", content: "送达社区通知，宣传冬季用气安全知识。", tags: ["安全宣传", "日常走访"] },
  { id: "v_g1_12", targetId: "p55", targetType: "person", gridId: "g1", visitorName: "网格员李明辉", date: "2026-01-09", content: "走访低保户家庭，确认补贴已到账，了解生活需求。", tags: ["帮扶救助", "低保核查"] },
];

// ============ 网格员绩效 mock 数据 ============

// 权重常量
export const SCORE_WEIGHTS = {
  visitFreq: 0.25,
  visitQuality: 0.25,
  infoComplete: 0.20,
  taskCount: 0.15,
  taskSpeed: 0.15,
} as const;

// 计算综合得分
function calcTotal(scores: GridWorkerScore['scores']): number {
  return parseFloat((
    scores.visitFreq * SCORE_WEIGHTS.visitFreq +
    scores.visitQuality * SCORE_WEIGHTS.visitQuality +
    scores.infoComplete * SCORE_WEIGHTS.infoComplete +
    scores.taskCount * SCORE_WEIGHTS.taskCount +
    scores.taskSpeed * SCORE_WEIGHTS.taskSpeed
  ).toFixed(1));
}

function worker(
  id: string, name: string, gridId: string,
  communityName: string, streetName: string, districtName: string,
  visitCount: number, visitQuality: number, infoCompleteness: number,
  taskCompleted: number, avgTaskTime: number,
  scores: GridWorkerScore['scores']
): GridWorkerScore {
  return {
    id, name, gridId, communityName, streetName, districtName,
    visitCount, visitQuality, infoCompleteness, taskCompleted, avgTaskTime,
    scores,
    totalScore: calcTotal(scores),
  };
}

export const SEED_GRID_WORKER_SCORES: GridWorkerScore[] = [
  // === 环翠区 - 竹岛街道 ===
  worker('gw01', '张三', 'g1', '海源社区', '竹岛街道', '环翠区',
    42, 88, 92, 18, 2.1, { visitFreq: 84, visitQuality: 88, infoComplete: 92, taskCount: 90, taskSpeed: 85 }),
  worker('gw02', '李四', 'g2', '海源社区', '竹岛街道', '环翠区',
    38, 82, 87, 15, 3.2, { visitFreq: 76, visitQuality: 82, infoComplete: 87, taskCount: 75, taskSpeed: 68 }),
  worker('gw03', '王芳', 'g3', '翠竹社区', '竹岛街道', '环翠区',
    45, 91, 95, 20, 1.8, { visitFreq: 90, visitQuality: 91, infoComplete: 95, taskCount: 95, taskSpeed: 90 }),
  worker('gw04', '赵刚', 'g4', '翠竹社区', '竹岛街道', '环翠区',
    30, 75, 80, 12, 4.0, { visitFreq: 60, visitQuality: 75, infoComplete: 80, taskCount: 60, taskSpeed: 55 }),
  worker('gw05', '刘洋', 'g5', '青竹社区', '竹岛街道', '环翠区',
    36, 85, 88, 16, 2.5, { visitFreq: 72, visitQuality: 85, infoComplete: 88, taskCount: 80, taskSpeed: 78 }),
  worker('gw06', '陈静', 'g6', '四方社区', '竹岛街道', '环翠区',
    40, 90, 91, 17, 2.0, { visitFreq: 80, visitQuality: 90, infoComplete: 91, taskCount: 85, taskSpeed: 88 }),
  worker('gw07', '孙磊', 'g7', '海源一品', '竹岛街道', '环翠区',
    33, 78, 83, 14, 3.5, { visitFreq: 66, visitQuality: 78, infoComplete: 83, taskCount: 70, taskSpeed: 62 }),

  // === 环翠区 - 环翠楼街道 ===
  worker('gw08', '周伟', 'g8', '东北村社区', '环翠楼街道', '环翠区',
    35, 80, 85, 13, 3.0, { visitFreq: 70, visitQuality: 80, infoComplete: 85, taskCount: 65, taskSpeed: 70 }),
  worker('gw09', '吴敏', 'g9', '东南村社区', '环翠楼街道', '环翠区',
    28, 72, 78, 10, 4.5, { visitFreq: 56, visitQuality: 72, infoComplete: 78, taskCount: 50, taskSpeed: 48 }),
  worker('gw10', '郑强', 'g10', '西北村社区', '环翠楼街道', '环翠区',
    41, 86, 90, 19, 2.2, { visitFreq: 82, visitQuality: 86, infoComplete: 90, taskCount: 92, taskSpeed: 82 }),

  // === 环翠区 - 鲸园街道 ===
  worker('gw11', '马丽', 'g11', '古陌社区', '鲸园街道', '环翠区',
    39, 87, 89, 16, 2.3, { visitFreq: 78, visitQuality: 87, infoComplete: 89, taskCount: 80, taskSpeed: 80 }),
  worker('gw12', '何涛', 'g12', '北门外社区', '鲸园街道', '环翠区',
    32, 76, 82, 11, 3.8, { visitFreq: 64, visitQuality: 76, infoComplete: 82, taskCount: 55, taskSpeed: 58 }),
  worker('gw13', '林秀英', 'g13', '花园社区', '鲸园街道', '环翠区',
    44, 92, 94, 21, 1.6, { visitFreq: 88, visitQuality: 92, infoComplete: 94, taskCount: 98, taskSpeed: 92 }),

  // === 环翠区 - 嵩山街道 ===
  worker('gw14', '黄建国', 'g14', '向阳社区', '嵩山街道', '环翠区',
    37, 83, 86, 15, 2.8, { visitFreq: 74, visitQuality: 83, infoComplete: 86, taskCount: 75, taskSpeed: 72 }),
  worker('gw15', '徐丽华', 'g15', '松海社区', '嵩山街道', '环翠区',
    34, 79, 84, 13, 3.3, { visitFreq: 68, visitQuality: 79, infoComplete: 84, taskCount: 65, taskSpeed: 65 }),

  // === 环翠区 - 孙家疃街道 ===
  worker('gw16', '高志远', 'g16', '远遥社区', '孙家疃街道', '环翠区',
    43, 89, 93, 19, 1.9, { visitFreq: 86, visitQuality: 89, infoComplete: 93, taskCount: 92, taskSpeed: 88 }),
  worker('gw17', '朱文娟', 'g17', '安海社区', '孙家疃街道', '环翠区',
    31, 74, 81, 12, 3.6, { visitFreq: 62, visitQuality: 74, infoComplete: 81, taskCount: 60, taskSpeed: 60 }),

  // === 文登区 - 龙山路街道 ===
  worker('gw18', '曹军', 'g18', '龙山社区', '龙山路街道', '文登区',
    40, 88, 90, 17, 2.1, { visitFreq: 80, visitQuality: 88, infoComplete: 90, taskCount: 85, taskSpeed: 85 }),
  worker('gw19', '谢芳', 'g19', '五龙社区', '龙山路街道', '文登区',
    36, 84, 87, 14, 2.9, { visitFreq: 72, visitQuality: 84, infoComplete: 87, taskCount: 70, taskSpeed: 72 }),

  // === 文登区 - 天福路街道 ===
  worker('gw20', '邓超', 'g20', '天福社区', '天福路街道', '文登区',
    29, 71, 76, 10, 4.2, { visitFreq: 58, visitQuality: 71, infoComplete: 76, taskCount: 50, taskSpeed: 50 }),
  worker('gw21', '冯丽', 'g21', '文山社区', '天福路街道', '文登区',
    38, 85, 88, 16, 2.4, { visitFreq: 76, visitQuality: 85, infoComplete: 88, taskCount: 80, taskSpeed: 78 }),

  // === 临港区 - 草庙子镇 ===
  worker('gw22', '蒋大成', 'g22', '草庙子村', '草庙子镇', '临港区',
    35, 81, 84, 14, 3.1, { visitFreq: 70, visitQuality: 81, infoComplete: 84, taskCount: 70, taskSpeed: 68 }),
  worker('gw23', '沈小红', 'g23', '林泉社区', '草庙子镇', '临港区',
    42, 90, 92, 18, 2.0, { visitFreq: 84, visitQuality: 90, infoComplete: 92, taskCount: 90, taskSpeed: 88 }),

  // === 临港区 - 蔄山镇 ===
  worker('gw24', '韩志明', 'g24', '蔄山村', '蔄山镇', '临港区',
    27, 70, 75, 9, 4.8, { visitFreq: 54, visitQuality: 70, infoComplete: 75, taskCount: 45, taskSpeed: 45 }),
  worker('gw25', '唐雪梅', 'g25', '汶口社区', '蔄山镇', '临港区',
    39, 86, 89, 17, 2.3, { visitFreq: 78, visitQuality: 86, infoComplete: 89, taskCount: 85, taskSpeed: 80 }),
];
