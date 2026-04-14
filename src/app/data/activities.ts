import { addDays, subDays, subHours, format } from 'date-fns';

export interface ActivityTimelineItem {
  timestamp: string;
  operatorName: string;
  action: 'create' | 'approve' | 'reject' | 'modify' | 'cancel' | 'finish' | 'start';
  comment?: string;
}

export interface Activity {
  id: string;
  gridId: string;
  creatorId: string;
  creatorName: string; // Added for display
  
  // Basic Info
  title: string;
  category: 'volunteer' | 'entertainment'; 
  subcategory: string;
  description?: string;
  applicationDetails?: string; 
  location: string;
  
  // Time
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  
  // Status
  approvalStatus: 'pending' | 'approved' | 'rejected';
  executionStatus: 'to_start' | 'in_progress' | 'ended' | 'cancelled'; 
  
  // Stats
  expectedParticipants: number; 
  predictionText?: string;
  attendeeIds: string[];
  
  // Media & Audit
  media: { type: 'image' | 'video'; url: string; uploadedAt: string }[];
  timeline: ActivityTimelineItem[];
  
  createdAt: string;
  updatedAt: string;
}

export interface PotentialParticipant {
  id: string;
  name: string;
  address: string;
  tag: string;
}

export interface SubcategoryOption {
  value: string;
  label: string;
  predictedCount: number;
  matchedTags: string[];
  potentialParticipants: PotentialParticipant[];
}

export interface CategoryOption {
  value: string;
  label: string;
  subcategories: SubcategoryOption[];
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: 'volunteer',
    label: '志愿服务',
    subcategories: [
      { value: 'environment', label: '环境整治', predictedCount: 12, matchedTags: ['热心公益', '党员'], potentialParticipants: [
        { id: 'p1', name: '张伟', address: '1号楼101', tag: '热心公益' },
        { id: 'p2', name: '王秀兰', address: '2号楼302', tag: '热心公益' },
        { id: 'p3', name: '刘建国', address: '3号楼201', tag: '党员' },
        { id: 'p6', name: '赵志强', address: '5号楼101', tag: '热心公益' },
        { id: 'p8', name: '周明', address: '1号楼302', tag: '党员' },
      ]},
      { value: 'elderly_care', label: '助老扶弱', predictedCount: 8, matchedTags: ['热心公益', '志愿者'], potentialParticipants: [
        { id: 'p1', name: '张伟', address: '1号楼101', tag: '热心公益' },
        { id: 'p9', name: '陈丽', address: '6号楼401', tag: '志愿者' },
        { id: 'p10', name: '吴芳', address: '7号楼102', tag: '志愿者' },
      ]},
      { value: 'policy', label: '政策宣传', predictedCount: 20, matchedTags: ['中老年', '党员'], potentialParticipants: [
        { id: 'p3', name: '刘建国', address: '3号楼201', tag: '党员' },
        { id: 'p8', name: '周明', address: '1号楼302', tag: '党员' },
        { id: 'p11', name: '孙大爷', address: '4号楼101', tag: '中老年' },
        { id: 'p12', name: '李阿姨', address: '4号楼203', tag: '中老年' },
        { id: 'p13', name: '黄叔', address: '8号楼301', tag: '中老年' },
      ]},
      { value: 'community_service', label: '便民服务', predictedCount: 15, matchedTags: ['热心公益', '志愿者'], potentialParticipants: [
        { id: 'p1', name: '张伟', address: '1号楼101', tag: '热心公益' },
        { id: 'p6', name: '赵志强', address: '5号楼101', tag: '热心公益' },
        { id: 'p9', name: '陈丽', address: '6号楼401', tag: '志愿者' },
      ]},
    ]
  },
  {
    value: 'entertainment',
    label: '文娱活动',
    subcategories: [
      { value: 'sports', label: '趣味运动会', predictedCount: 30, matchedTags: ['运动爱好者', '青年'], potentialParticipants: [
        { id: 'p14', name: '小王', address: '2号楼101', tag: '运动爱好者' },
        { id: 'p15', name: '小李', address: '3号楼102', tag: '青年' },
        { id: 'p16', name: '张强', address: '6号楼201', tag: '运动爱好者' },
      ]},
      { value: 'music', label: '社区音乐会', predictedCount: 45, matchedTags: ['文艺爱好者', '中老年'], potentialParticipants: [
        { id: 'p17', name: '刘阿姨', address: '1号楼201', tag: '文艺爱好者' },
        { id: 'p11', name: '孙大爷', address: '4号楼101', tag: '中老年' },
        { id: 'p18', name: '何婆婆', address: '5号楼302', tag: '文艺爱好者' },
        { id: 'p12', name: '李阿姨', address: '4号楼203', tag: '中老年' },
      ]},
      { value: 'movie', label: '露天电影', predictedCount: 50, matchedTags: ['家庭用户', '中老年'], potentialParticipants: [
        { id: 'p19', name: '陈家明', address: '7号楼201', tag: '家庭用户' },
        { id: 'p11', name: '孙大爷', address: '4号楼101', tag: '中老年' },
        { id: 'p20', name: '林晓', address: '8号楼102', tag: '家庭用户' },
      ]},
      { value: 'crafts', label: '手工制作', predictedCount: 10, matchedTags: ['儿童家庭', '文艺爱好者'], potentialParticipants: [
        { id: 'p21', name: '王妈妈', address: '2号楼401', tag: '儿童家庭' },
        { id: 'p22', name: '张妈妈', address: '3号楼301', tag: '儿童家庭' },
        { id: 'p17', name: '刘阿姨', address: '1号楼201', tag: '文艺爱好者' },
      ]},
    ]
  }
];

// Helper to create timestamp
const now = new Date();
const getDaysAgo = (days: number) => format(subDays(now, days), 'yyyy-MM-dd HH:mm:ss');
const getFutureDate = (days: number) => format(addDays(now, days), 'yyyy-MM-dd');

// Mock Data
export const MOCK_ACTIVITIES: Activity[] = [
  // 1. Approved & In Progress (Should be top of "Grid Activities")
  {
    id: 'a1',
    gridId: 'g1',
    creatorId: 'u1',
    creatorName: '张网格',
    title: '社区环境大扫除',
    category: 'volunteer',
    subcategory: '环境整治',
    description: '清理社区主干道及花坛杂物，美化环境。',
    applicationDetails: '需要提前准备扫帚、垃圾袋等工具，预计持续2小时。',
    location: '幸福社区中心广场',
    date: format(now, 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '11:00',
    approvalStatus: 'approved',
    executionStatus: 'in_progress',
    expectedParticipants: 12,
    predictionText: '系统根据‘热心公益’标签匹配到约 12 名居民。实际到场人数通常低于此数值，仅供参考。',
    attendeeIds: ['p1', 'p2', 'p3'],
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1558008258-3256797b43f3?w=800&q=80', uploadedAt: getDaysAgo(0) }
    ],
    timeline: [
      { timestamp: getDaysAgo(2), operatorName: '张网格', action: 'create' },
      { timestamp: getDaysAgo(1), operatorName: '李书记', action: 'approve', comment: '活动很有意义，批准。' },
      { timestamp: getDaysAgo(0), operatorName: '张网格', action: 'start' }
    ],
    createdAt: getDaysAgo(2),
    updatedAt: getDaysAgo(0)
  },

  // 2. Approved & To Start (Should be second in "Grid Activities" if date is soon)
  {
    id: 'a2',
    gridId: 'g1',
    creatorId: 'u1',
    creatorName: '张网格',
    title: '老年人健康讲座',
    category: 'volunteer',
    subcategory: '助老扶弱',
    description: '邀请社区医生讲解高血压预防知识。',
    applicationDetails: '需协调会议室，准备投影仪。',
    location: '社区会议室',
    date: getFutureDate(1),
    startTime: '14:00',
    endTime: '15:30',
    approvalStatus: 'approved',
    executionStatus: 'to_start',
    expectedParticipants: 20,
    predictionText: '系统根据‘老年人’及‘慢病’标签匹配到约 20 名居民。',
    attendeeIds: [],
    media: [],
    timeline: [
      { timestamp: getDaysAgo(3), operatorName: '张网格', action: 'create' },
      { timestamp: getDaysAgo(2), operatorName: '李书记', action: 'approve' }
    ],
    createdAt: getDaysAgo(3),
    updatedAt: getDaysAgo(2)
  },

  // 3. Approved & Ended (Should be last in "Grid Activities")
  {
    id: 'a3',
    gridId: 'g1',
    creatorId: 'u1',
    creatorName: '张网格',
    title: '儿童手工剪纸比赛',
    category: 'entertainment',
    subcategory: '手工制作',
    description: '非遗文化传承，教小朋友剪窗花。',
    applicationDetails: '需要购买红纸和剪刀。',
    location: '社区活动室',
    date: getFutureDate(-5),
    startTime: '10:00',
    endTime: '11:30',
    approvalStatus: 'approved',
    executionStatus: 'ended',
    expectedParticipants: 15,
    predictionText: '系统根据‘儿童’标签匹配到约 15 名居民。',
    attendeeIds: ['p4', 'p5', 'p6', 'p7'],
    media: [
        { type: 'image', url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80', uploadedAt: getDaysAgo(5) }
    ],
    timeline: [
      { timestamp: getDaysAgo(7), operatorName: '张网格', action: 'create' },
      { timestamp: getDaysAgo(6), operatorName: '李书记', action: 'approve' },
      { timestamp: getDaysAgo(5), operatorName: '张网格', action: 'finish' }
    ],
    createdAt: getDaysAgo(7),
    updatedAt: getDaysAgo(5)
  },

  // 4. Rejected (Should be top of "My Applications", most recent update)
  {
    id: 'a4',
    gridId: 'g1',
    creatorId: 'u1', // My application
    creatorName: '张网格',
    title: '社区卡拉OK大赛',
    category: 'entertainment',
    subcategory: '社区音乐会',
    description: '丰富居民夜生活，举办歌唱比赛。',
    applicationDetails: '需要租用专业音响设备，预算较高。',
    location: '社区广场',
    date: getFutureDate(3),
    startTime: '19:00',
    endTime: '22:00',
    approvalStatus: 'rejected',
    executionStatus: 'to_start', // execution status is irrelevant/disabled when rejected
    expectedParticipants: 50,
    predictionText: '系统根据‘音乐’爱好标签匹配到约 50 名居民。',
    attendeeIds: [],
    media: [],
    timeline: [
      { timestamp: getDaysAgo(1), operatorName: '张网格', action: 'create' },
      { timestamp: getDaysAgo(0), operatorName: '李书记', action: 'reject', comment: '预算过高，且晚上噪音可能扰民，建议调整方案。' }
    ],
    createdAt: getDaysAgo(1),
    updatedAt: getDaysAgo(0) // Just updated
  },

  // 5. Pending (Should be middle of "My Applications")
  {
    id: 'a5',
    gridId: 'g1',
    creatorId: 'u1', // My application
    creatorName: '张网格',
    title: '防诈骗宣传讲座',
    category: 'volunteer',
    subcategory: '政策宣传',
    description: '联合片警进行反诈宣传。',
    applicationDetails: '需要制作横幅和宣传单。',
    location: '社区入口',
    date: getFutureDate(2),
    startTime: '09:30',
    endTime: '11:00',
    approvalStatus: 'pending',
    executionStatus: 'to_start',
    expectedParticipants: 30,
    predictionText: '系统根据‘中老年’标签匹配到约 30 名居民。',
    attendeeIds: [],
    media: [],
    timeline: [
      { timestamp: getDaysAgo(1), operatorName: '张网格', action: 'create' }
    ],
    createdAt: getDaysAgo(1),
    updatedAt: getDaysAgo(1)
  },
  
  // 6. Approved (My Application, old update)
  {
     id: 'a6',
     gridId: 'g1',
     creatorId: 'u1',
     creatorName: '张网格',
     title: '旧衣物回收',
     category: 'volunteer',
     subcategory: '便民服务',
     location: '2号楼下',
     date: getFutureDate(-10),
     startTime: '09:00',
     endTime: '17:00',
     approvalStatus: 'approved',
     executionStatus: 'ended',
     expectedParticipants: 10,
     attendeeIds: [],
     media: [],
     timeline: [
       { timestamp: getDaysAgo(12), operatorName: '张网格', action: 'create' },
       { timestamp: getDaysAgo(11), operatorName: '李书记', action: 'approve' }
     ],
     createdAt: getDaysAgo(12),
     updatedAt: getDaysAgo(11)
  }
];
