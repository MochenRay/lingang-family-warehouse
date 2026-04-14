import { Notification } from '../../types/core';

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "关于开展冬季消防安全大检查的通知",
    content: "请各位网格员重点关注辖区内群租房、九小场所的消防安全...",
    date: "2026-01-07 09:00",
    read: false,
    type: "system"
  },
  {
    id: "n2",
    title: "待办任务：高龄老人月度探访",
    content: "本月高龄老人探访任务完成率需达到100%，请及时处理。",
    date: "2026-01-06 14:30",
    read: true,
    type: "task"
  }
];
