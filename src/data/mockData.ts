import type { Member, Goal, Schedule } from '@/types';

export const mockMembers: Member[] = [
  {
    id: '1',
    name: '爸爸',
    avatar: 'https://picsum.photos/id/1005/200/200',
    role: 'owner'
  },
  {
    id: '2',
    name: '妈妈',
    avatar: 'https://picsum.photos/id/1011/200/200',
    role: 'owner'
  },
  {
    id: '3',
    name: '小明',
    avatar: 'https://picsum.photos/id/1012/200/200',
    role: 'member'
  },
  {
    id: '4',
    name: '小红',
    avatar: 'https://picsum.photos/id/1027/200/200',
    role: 'member'
  }
];

export const mockGoals: Goal[] = [
  {
    id: '1',
    title: '暑假日本旅行',
    description: '全家一起去日本东京、大阪、京都旅行一周，体验日本文化和美食',
    category: 'travel',
    budget: 30000,
    usedBudget: 15600,
    deadline: '2026-08-15',
    startDate: '2026-06-01',
    completionCriteria: '完成所有行程安排，在预算内完成旅行',
    visibleMemberIds: ['1', '2', '3', '4'],
    createdBy: '1',
    status: 'in_progress',
    progress: 55,
    tasks: [
      {
        id: 't1',
        title: '办理护照和签证',
        description: '全家四口人的护照和日本旅游签证',
        assigneeId: '1',
        status: 'completed',
        deadline: '2026-06-20',
        priority: 'high',
        createdAt: '2026-06-01',
        completedAt: '2026-06-10'
      },
      {
        id: 't2',
        title: '预订机票',
        description: '预订往返东京的机票',
        assigneeId: '2',
        status: 'completed',
        deadline: '2026-06-25',
        priority: 'high',
        createdAt: '2026-06-01',
        completedAt: '2026-06-15'
      },
      {
        id: 't3',
        title: '预订酒店',
        description: '东京3晚、大阪2晚、京都2晚',
        assigneeId: '2',
        status: 'in_progress',
        deadline: '2026-07-01',
        priority: 'high',
        createdAt: '2026-06-05'
      },
      {
        id: 't4',
        title: '制定详细行程',
        description: '包括景点、餐厅、交通安排',
        assigneeId: '3',
        status: 'in_progress',
        deadline: '2026-07-10',
        priority: 'medium',
        createdAt: '2026-06-10'
      },
      {
        id: 't5',
        title: '兑换日元',
        description: '兑换50万日元现金',
        assigneeId: '1',
        status: 'pending',
        deadline: '2026-08-01',
        priority: 'medium',
        createdAt: '2026-06-15'
      },
      {
        id: 't6',
        title: '准备旅行用品',
        description: '行李箱、转换插头、常用药品等',
        assigneeId: '4',
        status: 'pending',
        deadline: '2026-08-10',
        priority: 'low',
        createdAt: '2026-06-15'
      }
    ],
    expenses: [
      {
        id: 'e1',
        title: '机票费用',
        amount: 12000,
        payerId: '1',
        date: '2026-06-15',
        photoUrl: 'https://picsum.photos/id/1048/400/300',
        note: '四人往返东京机票',
        createdAt: '2026-06-15'
      },
      {
        id: 'e2',
        title: '签证费用',
        amount: 3600,
        payerId: '2',
        date: '2026-06-10',
        note: '四人日本签证费',
        createdAt: '2026-06-10'
      }
    ],
    comments: [
      {
        id: 'c1',
        authorId: '2',
        content: '大家有什么特别想去的景点吗？我来安排行程',
        createdAt: '2026-06-10 10:30'
      },
      {
        id: 'c2',
        authorId: '3',
        content: '我想去迪士尼乐园！',
        createdAt: '2026-06-10 11:00'
      },
      {
        id: 'c3',
        authorId: '4',
        content: '我想去环球影城看哈利波特',
        createdAt: '2026-06-10 11:30'
      }
    ],
    rewards: [
      {
        id: 'r1',
        title: '迪士尼乐园',
        description: '行程完成30%时去东京迪士尼',
        condition: '完成机票酒店预订',
        achieved: false
      },
      {
        id: 'r2',
        title: '温泉体验',
        description: '去箱根泡温泉',
        condition: '完成详细行程规划',
        achieved: false
      }
    ],
    createdAt: '2026-06-01',
    updatedAt: '2026-06-15'
  },
  {
    id: '2',
    title: '家庭储蓄计划',
    description: '年底前储蓄10万元，用于明年的教育和生活备用金',
    category: 'saving',
    budget: 100000,
    usedBudget: 0,
    deadline: '2026-12-31',
    startDate: '2026-06-01',
    completionCriteria: '到12月31日储蓄账户余额达到10万元',
    visibleMemberIds: ['1', '2'],
    createdBy: '2',
    status: 'in_progress',
    progress: 35,
    tasks: [
      {
        id: 't7',
        title: '开设定期储蓄账户',
        assigneeId: '1',
        status: 'completed',
        deadline: '2026-06-10',
        priority: 'high',
        createdAt: '2026-06-01',
        completedAt: '2026-06-05'
      },
      {
        id: 't8',
        title: '制定每月储蓄计划',
        description: '每月至少存15000元',
        assigneeId: '2',
        status: 'completed',
        deadline: '2026-06-10',
        priority: 'high',
        createdAt: '2026-06-01',
        completedAt: '2026-06-08'
      },
      {
        id: 't9',
        title: '6月份储蓄',
        description: '存入15000元',
        assigneeId: '1',
        status: 'completed',
        deadline: '2026-06-30',
        priority: 'high',
        createdAt: '2026-06-10',
        completedAt: '2026-06-20'
      },
      {
        id: 't10',
        title: '7月份储蓄',
        description: '存入15000元',
        assigneeId: '2',
        status: 'pending',
        deadline: '2026-07-31',
        priority: 'high',
        createdAt: '2026-06-15'
      }
    ],
    expenses: [],
    comments: [
      {
        id: 'c4',
        authorId: '1',
        content: '这个月已经存了35000了，继续加油！',
        createdAt: '2026-06-20 18:00'
      }
    ],
    rewards: [
      {
        id: 'r3',
        title: '达成50%',
        description: '储蓄达到5万时',
        condition: '储蓄余额≥50000',
        achieved: false
      },
      {
        id: 'r4',
        title: '达成100%',
        description: '完成储蓄目标',
        condition: '储蓄余额≥100000',
        achieved: false
      }
    ],
    createdAt: '2026-06-01',
    updatedAt: '2026-06-20'
  },
  {
    id: '3',
    title: '周末大扫除',
    description: '全家一起整理房间，清洁卫生',
    category: 'organizing',
    budget: 500,
    usedBudget: 150,
    deadline: '2026-06-21',
    startDate: '2026-06-20',
    completionCriteria: '所有房间清洁完成，物品整理完毕',
    visibleMemberIds: ['1', '2', '3', '4'],
    createdBy: '2',
    status: 'in_progress',
    progress: 60,
    tasks: [
      {
        id: 't11',
        title: '清洁客厅',
        assigneeId: '1',
        status: 'completed',
        deadline: '2026-06-21',
        priority: 'medium',
        createdAt: '2026-06-20',
        completedAt: '2026-06-21'
      },
      {
        id: 't12',
        title: '清洁厨房',
        assigneeId: '2',
        status: 'completed',
        deadline: '2026-06-21',
        priority: 'medium',
        createdAt: '2026-06-20',
        completedAt: '2026-06-21'
      },
      {
        id: 't13',
        title: '清洁卧室',
        assigneeId: '3',
        status: 'in_progress',
        deadline: '2026-06-21',
        priority: 'medium',
        createdAt: '2026-06-20'
      },
      {
        id: 't14',
        title: '清洁卫生间',
        assigneeId: '4',
        status: 'pending',
        deadline: '2026-06-21',
        priority: 'medium',
        createdAt: '2026-06-20'
      },
      {
        id: 't15',
        title: '整理杂物间',
        assigneeId: '1',
        status: 'pending',
        deadline: '2026-06-21',
        priority: 'low',
        createdAt: '2026-06-20'
      }
    ],
    expenses: [
      {
        id: 'e3',
        title: '清洁用品',
        amount: 150,
        payerId: '2',
        date: '2026-06-20',
        note: '清洁剂、拖把、抹布等',
        createdAt: '2026-06-20'
      }
    ],
    comments: [],
    rewards: [
      {
        id: 'r5',
        title: '奖励大餐',
        description: '打扫完出去吃火锅',
        condition: '所有任务完成',
        achieved: false
      }
    ],
    createdAt: '2026-06-20',
    updatedAt: '2026-06-21'
  },
  {
    id: '4',
    title: '健身计划',
    description: '全家每周运动3次，保持健康生活方式',
    category: 'health',
    budget: 2000,
    usedBudget: 0,
    deadline: '2026-12-31',
    startDate: '2026-06-15',
    completionCriteria: '每周至少运动3次，坚持到年底',
    visibleMemberIds: ['1', '2', '3', '4'],
    createdBy: '1',
    status: 'planning',
    progress: 0,
    tasks: [
      {
        id: 't16',
        title: '办理健身卡',
        assigneeId: '1',
        status: 'pending',
        deadline: '2026-06-25',
        priority: 'high',
        createdAt: '2026-06-15'
      },
      {
        id: 't17',
        title: '制定运动计划',
        assigneeId: '3',
        status: 'pending',
        deadline: '2026-06-30',
        priority: 'medium',
        createdAt: '2026-06-15'
      }
    ],
    expenses: [],
    comments: [],
    rewards: [
      {
        id: 'r6',
        title: '坚持一个月',
        condition: '连续运动4周',
        achieved: false
      }
    ],
    createdAt: '2026-06-15',
    updatedAt: '2026-06-15'
  },
  {
    id: '5',
    title: '学习英语',
    description: '小明和小红每天学习英语30分钟，提高英语水平',
    category: 'study',
    budget: 1000,
    usedBudget: 0,
    deadline: '2026-12-31',
    startDate: '2026-06-20',
    completionCriteria: '每天坚持学习，年底能进行日常英语对话',
    visibleMemberIds: ['2', '3', '4'],
    createdBy: '2',
    status: 'planning',
    progress: 0,
    tasks: [
      {
        id: 't18',
        title: '购买学习资料',
        assigneeId: '2',
        status: 'pending',
        deadline: '2026-06-22',
        priority: 'high',
        createdAt: '2026-06-20'
      },
      {
        id: 't19',
        title: '制定学习计划',
        assigneeId: '2',
        status: 'pending',
        deadline: '2026-06-25',
        priority: 'high',
        createdAt: '2026-06-20'
      }
    ],
    expenses: [],
    comments: [],
    rewards: [],
    createdAt: '2026-06-20',
    updatedAt: '2026-06-20'
  },
  {
    id: '6',
    title: '购买新车',
    description: '年底前攒够钱买一辆家用SUV',
    category: 'other',
    budget: 200000,
    usedBudget: 80000,
    deadline: '2026-12-01',
    startDate: '2026-01-01',
    completionCriteria: '攒够20万购车款，选购合适的车型',
    visibleMemberIds: ['1', '2'],
    createdBy: '1',
    status: 'in_progress',
    progress: 40,
    tasks: [
      {
        id: 't20',
        title: '研究车型',
        assigneeId: '1',
        status: 'completed',
        deadline: '2026-03-01',
        priority: 'high',
        createdAt: '2026-01-15',
        completedAt: '2026-02-28'
      },
      {
        id: 't21',
        title: '试驾',
        assigneeId: '1',
        status: 'completed',
        deadline: '2026-04-01',
        priority: 'high',
        createdAt: '2026-03-10',
        completedAt: '2026-03-25'
      },
      {
        id: 't22',
        title: '凑齐首付款',
        description: '准备12万首付款',
        assigneeId: '1',
        status: 'in_progress',
        deadline: '2026-11-01',
        priority: 'high',
        createdAt: '2026-04-01'
      }
    ],
    expenses: [
      {
        id: 'e4',
        title: '定金',
        amount: 50000,
        payerId: '1',
        date: '2026-05-15',
        note: '订车定金',
        createdAt: '2026-05-15'
      },
      {
        id: 'e5',
        title: '车险',
        amount: 30000,
        payerId: '2',
        date: '2026-06-01',
        note: '全险一年',
        createdAt: '2026-06-01'
      }
    ],
    comments: [],
    rewards: [
      {
        id: 'r7',
        title: '提车庆祝',
        description: '提车后全家自驾游',
        condition: '成功提车',
        achieved: false
      }
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-06-01'
  },
  {
    id: '7',
    title: '完成春季大扫除',
    description: '全家一起完成春季大扫除，包括擦窗户、清洗窗帘等',
    category: 'organizing',
    budget: 300,
    usedBudget: 280,
    deadline: '2026-05-31',
    startDate: '2026-05-01',
    completionCriteria: '所有清洁任务完成',
    visibleMemberIds: ['1', '2', '3', '4'],
    createdBy: '2',
    status: 'completed',
    progress: 100,
    tasks: [
      {
        id: 't23',
        title: '擦窗户',
        assigneeId: '1',
        status: 'completed',
        deadline: '2026-05-15',
        priority: 'medium',
        createdAt: '2026-05-01',
        completedAt: '2026-05-10'
      },
      {
        id: 't24',
        title: '清洗窗帘',
        assigneeId: '2',
        status: 'completed',
        deadline: '2026-05-20',
        priority: 'medium',
        createdAt: '2026-05-01',
        completedAt: '2026-05-18'
      },
      {
        id: 't25',
        title: '整理衣柜',
        assigneeId: '3',
        status: 'completed',
        deadline: '2026-05-25',
        priority: 'low',
        createdAt: '2026-05-10',
        completedAt: '2026-05-22'
      },
      {
        id: 't26',
        title: '清理阳台',
        assigneeId: '4',
        status: 'completed',
        deadline: '2026-05-30',
        priority: 'low',
        createdAt: '2026-05-15',
        completedAt: '2026-05-28'
      }
    ],
    expenses: [
      {
        id: 'e6',
        title: '清洁工具',
        amount: 280,
        payerId: '2',
        date: '2026-05-05',
        note: '玻璃清洁剂、伸缩杆等',
        createdAt: '2026-05-05'
      }
    ],
    comments: [],
    rewards: [
      {
        id: 'r8',
        title: '大扫除奖励',
        description: '完成后去游乐园',
        condition: '所有任务完成',
        achieved: true,
        achievedAt: '2026-05-30'
      }
    ],
    review: {
      id: 'rev1',
      summary: '这次大扫除全家配合得很好，效率很高！',
      highlights: ['大家分工明确', '提前完成了任务', '家里焕然一新'],
      improvements: ['可以准备更好的清洁工具', '下次可以分两天进行，不要太累'],
      createdAt: '2026-05-31'
    },
    createdAt: '2026-05-01',
    updatedAt: '2026-05-31'
  },
  {
    id: '8',
    title: '寒假东北看雪',
    description: '全家去哈尔滨看冰雕、滑雪',
    category: 'travel',
    budget: 25000,
    usedBudget: 0,
    deadline: '2027-01-20',
    startDate: '2027-01-10',
    completionCriteria: '顺利完成旅行',
    visibleMemberIds: ['1', '2', '3', '4'],
    createdBy: '3',
    status: 'planning',
    progress: 0,
    tasks: [],
    expenses: [],
    comments: [],
    rewards: [],
    createdAt: '2026-06-10',
    updatedAt: '2026-06-10'
  }
];

export const mockSchedules: Schedule[] = [
  {
    id: 's1',
    title: '日本旅行 - 预订酒店截止',
    date: '2026-07-01',
    time: '18:00',
    type: 'deadline',
    goalId: '1',
    taskId: 't3'
  },
  {
    id: 's2',
    title: '大扫除 - 清洁卫生间',
    date: '2026-06-21',
    time: '14:00',
    type: 'reminder',
    goalId: '3',
    taskId: 't14'
  },
  {
    id: 's3',
    title: '大扫除 - 整理杂物间',
    date: '2026-06-21',
    time: '15:00',
    type: 'reminder',
    goalId: '3',
    taskId: 't15',
    conflict: true
  },
  {
    id: 's4',
    title: '7月份储蓄',
    date: '2026-07-31',
    type: 'deadline',
    goalId: '2',
    taskId: 't10'
  },
  {
    id: 's5',
    title: '办理健身卡',
    date: '2026-06-25',
    type: 'deadline',
    goalId: '4',
    taskId: 't16'
  },
  {
    id: 's6',
    title: '家庭会议 - 讨论旅行行程',
    date: '2026-06-25',
    time: '20:00',
    type: 'meeting',
    goalId: '1'
  },
  {
    id: 's7',
    title: '兑换日元',
    date: '2026-08-01',
    type: 'deadline',
    goalId: '1',
    taskId: 't5'
  }
];

export const categoryLabels: Record<string, string> = {
  travel: '旅行',
  saving: '储蓄',
  organizing: '整理',
  health: '健康',
  study: '学习',
  other: '其他'
};

export const categoryColors: Record<string, string> = {
  travel: '#FF7A59',
  saving: '#36B37E',
  organizing: '#5D5FEF',
  health: '#00B42A',
  study: '#FF9F43',
  other: '#86909C'
};

export const statusLabels: Record<string, string> = {
  planning: '计划中',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
};

export const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高'
};

export const categoryIcons: Record<string, string> = {
  travel: '✈️',
  saving: '💰',
  organizing: '🏠',
  health: '💪',
  study: '📚',
  other: '📌'
};

export const memberNameById = (id: string): string => {
  const member = mockMembers.find(m => m.id === id);
  return member?.name || '未知';
};

export const memberAvatarById = (id: string): string => {
  const member = mockMembers.find(m => m.id === id);
  return member?.avatar || 'https://picsum.photos/200/200';
};
