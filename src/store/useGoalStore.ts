import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  Goal,
  Member,
  Schedule,
  Task,
  ExpenseRecord,
  Comment,
  Reward,
  Review,
  MemberPermission,
  GoalPermission
} from '@/types';
import { mockGoals, mockMembers, mockSchedules } from '@/data/mockData';
import dayjs from 'dayjs';

const STORAGE_KEY = 'family_goals_data';

interface PersistedState {
  goals: Goal[];
  members: Member[];
  schedules: Schedule[];
  currentUserId: string;
  lastReminderFilter: string;
}

const normalizeGoals = (goals: Goal[]): Goal[] => {
  return goals.map(g => ({
    ...g,
    memberPermissions: g.memberPermissions || g.visibleMemberIds.map(mid => ({
      memberId: mid,
      permission: (g.createdBy === mid ? 'edit' : 'view') as GoalPermission
    })),
    tasks: g.tasks.map(t => ({ ...t, remind: t.remind !== false }))
  }));
};

const normalizeSchedules = (schedules: Schedule[]): Schedule[] => {
  return schedules.map(s => ({
    ...s,
    read: s.read !== undefined ? s.read : false,
    remindEnabled: s.remindEnabled !== undefined ? s.remindEnabled : true
  }));
};

const loadFromStorage = (): PersistedState | null => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY);
    if (data) {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return {
        ...parsed,
        goals: normalizeGoals(parsed.goals || []),
        schedules: normalizeSchedules(parsed.schedules || [])
      };
    }
  } catch (e) {
    console.warn('[GoalStore] Failed to load from storage:', e);
  }
  return null;
};

const saveToStorage = (state: PersistedState) => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[GoalStore] Failed to save to storage:', e);
  }
};

const clearStorage = () => {
  try {
    Taro.removeStorageSync(STORAGE_KEY);
  } catch (e) {
    console.warn('[GoalStore] Failed to clear storage:', e);
  }
};

const getInitialState = (): PersistedState => {
  const persisted = loadFromStorage();
  if (persisted) {
    console.log('[GoalStore] Loaded data from storage');
    return persisted;
  }
  console.log('[GoalStore] Using mock data');
  return {
    goals: normalizeGoals(mockGoals),
    members: mockMembers,
    schedules: normalizeSchedules(mockSchedules),
    currentUserId: '1',
    lastReminderFilter: 'unread'
  };
};

const persistState = (state: PersistedState) => {
  saveToStorage({
    goals: state.goals,
    members: state.members,
    schedules: state.schedules,
    currentUserId: state.currentUserId,
    lastReminderFilter: state.lastReminderFilter
  });
};

type ReminderFilter = 'unread' | 'today' | 'week' | 'conflict' | 'all';

interface GoalStore {
  goals: Goal[];
  members: Member[];
  schedules: Schedule[];
  currentUserId: string;
  lastReminderFilter: string;
  selectedGoal: Goal | null;

  setSelectedGoal: (goal: Goal | null) => void;
  setLastReminderFilter: (filter: string) => void;

  getGoalById: (id: string) => Goal | undefined;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> & { memberPermissions?: MemberPermission[] }) => void;
  updateGoal: (id: string, updates: Partial<Goal> & { tasks?: Task[] }) => void;
  deleteGoal: (id: string) => void;

  addTask: (goalId: string, task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (goalId: string, taskId: string, updates: Partial<Task>) => void;
  toggleTaskStatus: (goalId: string, taskId: string) => void;
  deleteTask: (goalId: string, taskId: string) => void;

  addExpense: (goalId: string, expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  addComment: (goalId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;

  addReward: (goalId: string, reward: Omit<Reward, 'id'>) => void;
  updateReward: (goalId: string, rewardId: string, updates: Partial<Reward>) => void;
  deleteReward: (goalId: string, rewardId: string) => void;
  toggleRewardAchieved: (goalId: string, rewardId: string) => void;

  saveReview: (goalId: string, review: Omit<Review, 'id' | 'createdAt'>) => void;

  getMemberById: (id: string) => Member | undefined;
  getGoalsByStatus: (status: Goal['status']) => Goal[];
  getGoalsByMember: (memberId: string) => Goal[];
  calculateProgress: (tasks: Task[]) => number;
  getSchedulesByDate: (date: string) => Schedule[];
  checkDateConflict: (date: string, time?: string) => boolean;
  hasScheduleOnDate: (date: string) => boolean;
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  getSchedulesFiltered: (filters: { memberId?: string; goalId?: string }) => Schedule[];

  hasGoalPermission: (goalId: string, userId: string, permission: GoalPermission) => boolean;
  canEditGoal: (goalId: string) => boolean;
  canEditExpense: (goalId: string) => boolean;
  canEditReward: (goalId: string) => boolean;
  canEditReview: (goalId: string) => boolean;
  canViewGoal: (goalId: string) => boolean;

  getReminders: (filter: ReminderFilter) => Schedule[];
  getUnreadCount: () => number;
  markReminderRead: (id: string, read?: boolean) => void;
  markAllRemindersRead: () => void;
  snoozeReminder: (id: string, untilDate: string) => void;
  toggleReminderEnabled: (id: string, enabled: boolean) => void;

  exportGoalsCSV: () => string;
  handleExport: () => void;

  resetToMockData: () => void;
}

const initialState = getInitialState();

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: initialState.goals,
  members: initialState.members,
  schedules: initialState.schedules,
  currentUserId: initialState.currentUserId,
  lastReminderFilter: initialState.lastReminderFilter || 'unread',
  selectedGoal: null,

  setSelectedGoal: (goal) => set({ selectedGoal: goal }),
  setLastReminderFilter: (filter) => {
    set({ lastReminderFilter: filter });
    persistState(get());
  },

  getGoalById: (id) => get().goals.find(g => g.id === id),

  addGoal: (goal) => {
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
      memberPermissions: goal.memberPermissions || goal.visibleMemberIds.map(mid => ({
        memberId: mid,
        permission: mid === goal.createdBy ? 'edit' : 'view' as GoalPermission
      }))
    };
    const goalId = newGoal.id;

    set(state => {
      const ns = { ...state, goals: [...state.goals, newGoal] };
      persistState(ns);
      return ns;
    });

    get().addSchedule({
      title: `目标截止: ${newGoal.title}`,
      date: newGoal.deadline,
      type: 'deadline',
      goalId,
      remindEnabled: true,
      read: false
    });

    if (newGoal.startDate !== newGoal.deadline) {
      get().addSchedule({
        title: `目标开始: ${newGoal.title}`,
        date: newGoal.startDate,
        type: 'reminder',
        goalId,
        remindEnabled: true,
        read: false
      });
    }

    newGoal.tasks.forEach(t => {
      if (t.deadline && t.remind) {
        get().addSchedule({
          title: `任务: ${t.title}`,
          date: t.deadline,
          type: 'reminder',
          goalId,
          taskId: t.id,
          remindEnabled: true,
          read: false
        });
      }
    });

    console.log('[GoalStore] Added new goal:', newGoal.title);
  },

  updateGoal: (id, updates) => {
    const state = get();
    const oldGoal = state.getGoalById(id);
    if (!oldGoal) return;

    let newTasks = oldGoal.tasks;
    if (updates.tasks) {
      newTasks = oldGoal.tasks.map(oldTask => {
        const newTask = updates.tasks!.find(t => t.id === oldTask.id);
        if (!newTask) return oldTask;
        return {
          ...oldTask,
          title: newTask.title,
          priority: newTask.priority,
          assigneeId: newTask.assigneeId,
          deadline: newTask.deadline,
          remind: newTask.remind
        };
      });

      const newTaskIds = updates.tasks.map(t => t.id);
      const addedTasks = updates.tasks.filter(t => !oldGoal!.tasks.find(ot => ot.id === t.id));
      newTasks = [...newTasks, ...addedTasks];
      const removedTaskIds = oldGoal.tasks.filter(t => !newTaskIds.includes(t.id)).map(t => t.id);

      if (removedTaskIds.length > 0) {
        set(s => {
          const ns = { ...s, schedules: s.schedules.filter(sc => !removedTaskIds.includes(sc.taskId || '')) };
          return ns;
        });
      }

      addedTasks.forEach(t => {
        if (t.deadline && t.remind) {
          get().addSchedule({
            title: `任务: ${t.title}`,
            date: t.deadline,
            type: 'reminder',
            goalId: id,
            taskId: t.id,
            remindEnabled: true,
            read: false
          });
        }
      });

      updates.tasks.forEach(newTask => {
        const oldTask = oldGoal.tasks.find(ot => ot.id === newTask.id);
        if (oldTask && oldTask.deadline !== newTask.deadline) {
          const taskSchedules = state.schedules.filter(s => s.taskId === newTask.id);
          taskSchedules.forEach(ts => {
            get().updateSchedule(ts.id, { date: newTask.deadline || ts.date, title: `任务: ${newTask.title}` });
          });
        }
        if (oldTask && oldTask.remind !== newTask.remind) {
          const taskSchedules = state.schedules.filter(s => s.taskId === newTask.id);
          taskSchedules.forEach(ts => {
            get().toggleReminderEnabled(ts.id, newTask.remind !== false);
          });
        }
      });
    }

    const newGoalData = { ...updates };
    delete (newGoalData as any).tasks;

    if (updates.deadline && updates.deadline !== oldGoal.deadline) {
      const deadlineSchedules = state.schedules.filter(s => s.goalId === id && s.type === 'deadline');
      deadlineSchedules.forEach(s => {
        get().updateSchedule(s.id, { date: updates.deadline! });
      });
    }
    if (updates.startDate && updates.startDate !== oldGoal.startDate) {
      const startSchedules = state.schedules.filter(s =>
        s.goalId === id && s.type === 'reminder' && !s.taskId && s.title.includes('目标开始')
      );
      startSchedules.forEach(s => {
        get().updateSchedule(s.id, { date: updates.startDate! });
      });
    }

    set(s => {
      const ns = {
        ...s,
        goals: s.goals.map(g =>
          g.id === id
            ? { ...g, ...newGoalData, tasks: newTasks, updatedAt: new Date().toISOString() }
            : g
        )
      };
      persistState(ns);
      return ns;
    });

    console.log('[GoalStore] Updated goal:', id);
  },

  updateSchedule: (id, updates) => {
    set(state => {
      const ns = {
        ...state,
        schedules: state.schedules.map(s =>
          s.id === id ? { ...s, ...updates } : s
        )
      };
      persistState(ns);
      return ns;
    });
  },

  deleteGoal: (id) => {
    set(state => {
      const ns = {
        ...state,
        goals: state.goals.filter(g => g.id !== id),
        schedules: state.schedules.filter(s => s.goalId !== id)
      };
      persistState(ns);
      return ns;
    });
    console.log('[GoalStore] Deleted goal:', id);
  },

  addTask: (goalId, task) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      remind: task.remind !== false
    };
    set(state => {
      const ns = {
        ...state,
        goals: state.goals.map(g => {
          if (g.id === goalId) {
            const newTasks = [...g.tasks, newTask];
            return {
              ...g,
              tasks: newTasks,
              progress: get().calculateProgress(newTasks),
              updatedAt: new Date().toISOString()
            };
          }
          return g;
        })
      };
      persistState(ns);
      return ns;
    });

    if (task.deadline && newTask.remind) {
      get().addSchedule({
        title: `任务: ${task.title}`,
        date: task.deadline,
        type: 'reminder',
        goalId,
        taskId: newTask.id,
        remindEnabled: true,
        read: false
      });
    }

    console.log('[GoalStore] Added task:', newTask.title, 'to goal:', goalId);
  },

  updateTask: (goalId, taskId, updates) => {
    const state = get();
    const oldGoal = state.getGoalById(goalId);
    const oldTask = oldGoal?.tasks.find(t => t.id === taskId);

    set(state => {
      const ns = {
        ...state,
        goals: state.goals.map(g => {
          if (g.id === goalId) {
            const newTasks = g.tasks.map(t =>
              t.id === taskId ? { ...t, ...updates } : t
            );
            return {
              ...g,
              tasks: newTasks,
              progress: get().calculateProgress(newTasks),
              updatedAt: new Date().toISOString()
            };
          }
          return g;
        })
      };
      persistState(ns);
      return ns;
    });

    if (updates.deadline && oldTask && updates.deadline !== oldTask.deadline) {
      const taskSchedules = state.schedules.filter(s => s.taskId === taskId);
      taskSchedules.forEach(ts => {
        get().updateSchedule(ts.id, { date: updates.deadline! });
      });
    }

    if (updates.remind !== undefined && oldTask && updates.remind !== oldTask.remind) {
      const taskSchedules = state.schedules.filter(s => s.taskId === taskId);
      taskSchedules.forEach(ts => {
        get().toggleReminderEnabled(ts.id, updates.remind!);
      });
    }

    console.log('[GoalStore] Updated task:', taskId);
  },

  toggleTaskStatus: (goalId, taskId) => {
    const goal = get().getGoalById(goalId);
    const task = goal?.tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    get().updateTask(goalId, taskId, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
    });
  },

  deleteTask: (goalId, taskId) => {
    set(state => {
      const ns = {
        ...state,
        goals: state.goals.map(g => {
          if (g.id === goalId) {
            const newTasks = g.tasks.filter(t => t.id !== taskId);
            return {
              ...g,
              tasks: newTasks,
              progress: get().calculateProgress(newTasks),
              updatedAt: new Date().toISOString()
            };
          }
          return g;
        }),
        schedules: state.schedules.filter(s => s.taskId !== taskId)
      };
      persistState(ns);
      return ns;
    });
    console.log('[GoalStore] Deleted task:', taskId);
  },

  addExpense: (goalId, expense) => {
    const newExpense: ExpenseRecord = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    set(state => {
      const ns = {
        ...state,
        goals: state.goals.map(g => {
          if (g.id === goalId) {
            const newExpenses = [...g.expenses, newExpense];
            return {
              ...g,
              expenses: newExpenses,
              usedBudget: newExpenses.reduce((sum, e) => sum + e.amount, 0),
              updatedAt: new Date().toISOString()
            };
          }
          return g;
        })
      };
      persistState(ns);
      return ns;
    });
    console.log('[GoalStore] Added expense:', newExpense.title);
  },

  addComment: (goalId, comment) => {
    const newComment: Comment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleString()
    };
    set(state => {
      const ns = {
        ...state,
        goals: state.goals.map(g => {
          if (g.id === goalId) {
            return { ...g, comments: [...g.comments, newComment], updatedAt: new Date().toISOString() };
          }
          return g;
        })
      };
      persistState(ns);
      return ns;
    });
    console.log('[GoalStore] Added comment to goal:', goalId);
  },

  addReward: (goalId, reward) => {
    const newReward: Reward = { ...reward, id: Date.now().toString() };
    set(state => {
      const ns = {
        ...state,
        goals: state.goals.map(g => {
          if (g.id === goalId) {
            return { ...g, rewards: [...g.rewards, newReward], updatedAt: new Date().toISOString() };
          }
          return g;
        })
      };
      persistState(ns);
      return ns;
    });
    console.log('[GoalStore] Added reward:', newReward.title);
  },

  updateReward: (goalId, rewardId, updates) => {
    set(state => {
      const ns = {
        ...state,
        goals: state.goals.map(g => {
          if (g.id === goalId) {
            return {
              ...g,
              rewards: g.rewards.map(r =>
                r.id === rewardId
                  ? { ...r, ...updates, achievedAt: updates.achieved && !r.achieved ? new Date().toISOString() : r.achievedAt }
                  : r
              ),
              updatedAt: new Date().toISOString()
            };
          }
          return g;
        })
      };
      persistState(ns);
      return ns;
    });
  },

  deleteReward: (goalId, rewardId) => {
    set(state => {
      const ns = {
        ...state,
        goals: state.goals.map(g => {
          if (g.id === goalId) {
            return { ...g, rewards: g.rewards.filter(r => r.id !== rewardId), updatedAt: new Date().toISOString() };
          }
          return g;
        })
      };
      persistState(ns);
      return ns;
    });
  },

  toggleRewardAchieved: (goalId, rewardId) => {
    const goal = get().getGoalById(goalId);
    const reward = goal?.rewards.find(r => r.id === rewardId);
    if (!reward) return;
    get().updateReward(goalId, rewardId, { achieved: !reward.achieved });
  },

  saveReview: (goalId, review) => {
    const newReview: Review = { ...review, id: Date.now().toString(), createdAt: new Date().toISOString() };
    set(state => ({
      goals: state.goals.map(g => {
        if (g.id === goalId) {
          return { ...g, status: 'completed' as const, review: newReview, updatedAt: new Date().toISOString() };
        }
        return g;
      })
    }));
    persistState(get());
    console.log('[GoalStore] Saved review for goal:', goalId);
  },

  getMemberById: (id) => get().members.find(m => m.id === id),
  getGoalsByStatus: (status) => get().goals.filter(g => g.status === status),
  getGoalsByMember: (memberId) => get().goals.filter(g => g.visibleMemberIds.includes(memberId)),

  calculateProgress: (tasks) => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);
  },

  getSchedulesByDate: (date) => get().schedules.filter(s => s.date === date),
  hasScheduleOnDate: (date) => get().schedules.some(s => s.date === date),
  checkDateConflict: (date, time) => {
    return get().schedules.some(s => s.date === date && (!time || s.time === time));
  },

  addSchedule: (schedule) => {
    const newSchedule: Schedule = {
      ...schedule,
      id: Date.now().toString(),
      read: schedule.read !== undefined ? schedule.read : false,
      remindEnabled: schedule.remindEnabled !== undefined ? schedule.remindEnabled : true
    };
    set(state => {
      const dateSchedules = state.schedules.filter(s => s.date === schedule.date);
      let ns = { ...state, schedules: [...state.schedules, { ...newSchedule, conflict: dateSchedules.length > 0 }] };
      if (dateSchedules.length > 0 && !dateSchedules.some(s => s.conflict)) {
        ns.schedules = ns.schedules.map(s =>
          s.date === schedule.date ? { ...s, conflict: true } : s
        );
      }
      persistState(ns);
      return ns;
    });
  },

  getSchedulesFiltered: (filters) => {
    const { schedules, goals } = get();
    let result = schedules;

    if (filters.goalId) {
      result = result.filter(s => s.goalId === filters.goalId);
    }

    if (filters.memberId) {
      const mid = filters.memberId;
      const taskIds = goals.flatMap(g => g.tasks.filter(t => t.assigneeId === mid).map(t => t.id));
      const goalIds = goals.filter(g => g.createdBy === mid || g.visibleMemberIds.includes(mid)).map(g => g.id);
      result = result.filter(s =>
        (s.goalId && goalIds.includes(s.goalId)) || (s.taskId && taskIds.includes(s.taskId))
      );
    }

    return result;
  },

  hasGoalPermission: (goalId, userId, permission) => {
    const goal = get().getGoalById(goalId);
    const member = get().getMemberById(userId);
    if (!goal || !member) return false;

    if (member.role === 'owner') return true;

    const perm = goal.memberPermissions?.find(p => p.memberId === userId);
    if (!perm) return false;

    if (permission === 'view') return true;
    return perm.permission === 'edit';
  },

  canEditGoal: (goalId) => get().hasGoalPermission(goalId, get().currentUserId, 'edit'),
  canEditExpense: (goalId) => get().hasGoalPermission(goalId, get().currentUserId, 'edit'),
  canEditReward: (goalId) => get().hasGoalPermission(goalId, get().currentUserId, 'edit'),
  canEditReview: (goalId) => get().hasGoalPermission(goalId, get().currentUserId, 'edit'),

  canViewGoal: (goalId) => {
    const goal = get().getGoalById(goalId);
    if (!goal) return false;
    return goal.visibleMemberIds.includes(get().currentUserId);
  },

  getReminders: (filter) => {
    const { schedules } = get();
    const now = dayjs();
    const today = now.format('YYYY-MM-DD');
    const weekEnd = now.endOf('week').format('YYYY-MM-DD');

    return schedules.filter(s => {
      if (!s.remindEnabled) return false;
      if (s.snoozeUntil && dayjs(s.snoozeUntil).isAfter(now)) return false;

      switch (filter) {
        case 'unread':
          return !s.read;
        case 'today':
          return s.date === today;
        case 'week':
          return s.date >= today && s.date <= weekEnd;
        case 'conflict':
          return s.conflict;
        case 'all':
          return true;
        default:
          return true;
      }
    }).sort((a, b) => a.date.localeCompare(b.date));
  },

  getUnreadCount: () => {
    return get().schedules.filter(s => !s.read && s.remindEnabled && (!s.snoozeUntil || dayjs(s.snoozeUntil).isBefore(dayjs()))).length;
  },

  markReminderRead: (id, read = true) => {
    set(state => {
      const ns = {
        ...state,
        schedules: state.schedules.map(s => s.id === id ? { ...s, read } : s)
      };
      persistState(ns);
      return ns;
    });
  },

  markAllRemindersRead: () => {
    set(state => {
      const ns = {
        ...state,
        schedules: state.schedules.map(s => ({ ...s, read: true }))
      };
      persistState(ns);
      return ns;
    });
  },

  snoozeReminder: (id, untilDate) => {
    set(state => {
      const ns = {
        ...state,
        schedules: state.schedules.map(s => s.id === id ? { ...s, snoozeUntil: untilDate, read: false } : s)
      };
      persistState(ns);
      return ns;
    });
  },

  toggleReminderEnabled: (id, enabled) => {
    set(state => {
      const ns = {
        ...state,
        schedules: state.schedules.map(s => s.id === id ? { ...s, remindEnabled: enabled } : s)
      };
      persistState(ns);
      return ns;
    });
  },

  exportGoalsCSV: () => {
    const state = get();
    const goals = state.goals;
    const lines: string[] = [];

    lines.push('=== 目标清单 ===');
    lines.push(['目标名称', '分类', '状态', '预算', '已花费', '进度', '开始日期', '截止日期', '创建人', '任务数', '完成任务数', '奖励达成/总数', '复盘摘要', '照片数'].join(','));

    goals.forEach(g => {
      const achievedRewards = g.rewards.filter(r => r.achieved).length;
      lines.push([
        g.title, g.category, g.status, g.budget, g.usedBudget, `${g.progress}%`,
        g.startDate, g.deadline,
        state.getMemberById(g.createdBy)?.name || '',
        g.tasks.length,
        g.tasks.filter(t => t.status === 'completed').length,
        `${achievedRewards}/${g.rewards.length}`,
        g.review ? g.review.summary.substring(0, 30) : '',
        g.review ? g.review.photos.length : 0
      ].join(','));
    });

    lines.push('');
    lines.push('=== 任务详情 ===');
    lines.push(['目标名称', '任务名称', '负责人', '状态', '优先级', '截止日期', '完成时间', '提醒'].join(','));
    goals.forEach(g => {
      g.tasks.forEach(t => {
        lines.push([
          g.title, t.title, state.getMemberById(t.assigneeId)?.name || '',
          t.status, t.priority, t.deadline || '', t.completedAt || '',
          t.remind ? '开' : '关'
        ].join(','));
      });
    });

    lines.push('');
    lines.push('=== 费用记录 ===');
    lines.push(['目标名称', '费用名称', '金额', '支付人', '日期', '备注'].join(','));
    goals.forEach(g => {
      g.expenses.forEach(e => {
        lines.push([
          g.title, e.title, e.amount,
          state.getMemberById(e.payerId)?.name || '',
          e.date, e.note || ''
        ].join(','));
      });
    });

    lines.push('');
    lines.push('=== 奖励清单 ===');
    lines.push(['目标名称', '奖励名称', '达成条件', '状态', '达成时间'].join(','));
    goals.forEach(g => {
      g.rewards.forEach(r => {
        lines.push([g.title, r.title, r.condition, r.achieved ? '已达成' : '待达成', r.achievedAt || ''].join(','));
      });
    });

    lines.push('');
    lines.push('=== 成员信息 ===');
    lines.push(['成员名称', '角色', '负责任务数', '完成任务数', '支付总额', '评论数'].join(','));
    state.members.forEach(m => {
      const mt = goals.flatMap(g => g.tasks).filter(t => t.assigneeId === m.id);
      const me = goals.flatMap(g => g.expenses).filter(e => e.payerId === m.id);
      const mc = goals.flatMap(g => g.comments).filter(c => c.authorId === m.id);
      lines.push([
        m.name, m.role, mt.length,
        mt.filter(t => t.status === 'completed').length,
        me.reduce((s, e) => s + e.amount, 0), mc.length
      ].join(','));
    });

    return lines.join('\n');
  },

  handleExport: () => {
    const csvContent = get().exportGoalsCSV();
    if (typeof document !== 'undefined') {
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `家庭目标清单_${new Date().toLocaleDateString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      Taro.showToast({ title: '下载成功', icon: 'success' });
    } else {
      Taro.setClipboardData({
        data: csvContent,
        success: () => Taro.showToast({ title: '已复制到剪贴板', icon: 'success' }),
        fail: () => Taro.showToast({ title: '复制失败', icon: 'none' })
      });
    }
  },

  resetToMockData: () => {
    set({
      goals: normalizeGoals(mockGoals),
      members: mockMembers,
      schedules: normalizeSchedules(mockSchedules),
      currentUserId: '1',
      lastReminderFilter: 'unread'
    });
    clearStorage();
    console.log('[GoalStore] Reset to mock data');
  }
}));
