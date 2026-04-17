import { VisitRecord } from '../../types/core';

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
