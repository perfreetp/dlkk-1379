import { create } from 'zustand';
import type { Goal, Member, Schedule, Task, ExpenseRecord, Comment, Reward, Review } from '@/types';
import { mockGoals, mockMembers, mockSchedules } from '@/data/mockData';

const STORAGE_KEY = 'family_goals_data';

interface PersistedState {
  goals: Goal[];
  members: Member[];
  schedules: Schedule[];
  currentUserId: string;
}

const loadFromStorage = (): PersistedState | null => {
  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (e) {
    console.warn('[GoalStore] Failed to load from storage:', e);
  }
  return null;
};

const saveToStorage = (state: PersistedState) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.warn('[GoalStore] Failed to save to storage:', e);
  }
};

const getInitialState = (): PersistedState => {
  const persisted = loadFromStorage();
  if (persisted) {
    console.log('[GoalStore] Loaded data from local storage');
    return persisted;
  }
  console.log('[GoalStore] Using mock data');
  return {
    goals: mockGoals,
    members: mockMembers,
    schedules: mockSchedules,
    currentUserId: '1'
  };
};

interface GoalStore {
  goals: Goal[];
  members: Member[];
  schedules: Schedule[];
  currentUserId: string;
  selectedGoal: Goal | null;
  
  setSelectedGoal: (goal: Goal | null) => void;
  getGoalById: (id: string) => Goal | undefined;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
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
  
  exportGoalsCSV: () => string;
  downloadCSV: () => void;
  copyToClipboard: () => Promise<boolean>;
  
  resetToMockData: () => void;
}

const initialState = getInitialState();

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: initialState.goals,
  members: initialState.members,
  schedules: initialState.schedules,
  currentUserId: initialState.currentUserId,
  selectedGoal: null,
  
  setSelectedGoal: (goal) => set({ selectedGoal: goal }),
  
  getGoalById: (id) => get().goals.find(g => g.id === id),
  
  addGoal: (goal) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const goalId = newGoal.id;
    
    set(state => {
      const newState = { goals: [...state.goals, newGoal] };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    
    get().addSchedule({
      title: `目标截止: ${newGoal.title}`,
      date: newGoal.deadline,
      type: 'deadline',
      goalId
    });
    
    if (newGoal.startDate !== newGoal.deadline) {
      get().addSchedule({
        title: `目标开始: ${newGoal.title}`,
        date: newGoal.startDate,
        type: 'reminder',
        goalId
      });
    }
    
    console.log('[GoalStore] Added new goal:', newGoal.title);
  },
  
  updateGoal: (id, updates) => {
    set(state => {
      const newGoals = state.goals.map(g => 
        g.id === id 
          ? { ...g, ...updates, updatedAt: new Date().toISOString() }
          : g
      );
      const newState = { goals: newGoals };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    console.log('[GoalStore] Updated goal:', id);
  },
  
  deleteGoal: (id) => {
    set(state => {
      const newGoals = state.goals.filter(g => g.id !== id);
      const newState = { goals: newGoals };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    console.log('[GoalStore] Deleted goal:', id);
  },
  
  addTask: (goalId, task) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    set(state => {
      const newGoals = state.goals.map(g => {
        if (g.id === goalId) {
          const newTasks = [...g.tasks, newTask];
          const progress = get().calculateProgress(newTasks);
          return { 
            ...g, 
            tasks: newTasks,
            progress,
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      });
      const newState = { goals: newGoals };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    
    if (task.deadline) {
      get().addSchedule({
        title: `任务: ${task.title}`,
        date: task.deadline,
        type: 'reminder',
        goalId,
        taskId: newTask.id
      });
    }
    
    console.log('[GoalStore] Added task:', newTask.title, 'to goal:', goalId);
  },
  
  updateTask: (goalId, taskId, updates) => {
    set(state => {
      const newGoals = state.goals.map(g => {
        if (g.id === goalId) {
          const newTasks = g.tasks.map(t => 
            t.id === taskId ? { ...t, ...updates } : t
          );
          const progress = get().calculateProgress(newTasks);
          return {
            ...g,
            tasks: newTasks,
            progress,
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      });
      const newState = { goals: newGoals };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    console.log('[GoalStore] Updated task:', taskId);
  },
  
  toggleTaskStatus: (goalId, taskId) => {
    const goal = get().getGoalById(goalId);
    const task = goal?.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updates: Partial<Task> = {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
    };
    get().updateTask(goalId, taskId, updates);
    
    if (newStatus === 'completed') {
      console.log('[GoalStore] Task completed:', task.title);
    }
  },
  
  deleteTask: (goalId, taskId) => {
    set(state => {
      const newGoals = state.goals.map(g => {
        if (g.id === goalId) {
          const newTasks = g.tasks.filter(t => t.id !== taskId);
          const progress = get().calculateProgress(newTasks);
          return {
            ...g,
            tasks: newTasks,
            progress,
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      });
      const newState = { goals: newGoals };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    
    set(state => {
      const newSchedules = state.schedules.filter(s => s.taskId !== taskId);
      const newState = { schedules: newSchedules };
      saveToStorage({ ...state, ...newState });
      return newState;
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
      const newGoals = state.goals.map(g => {
        if (g.id === goalId) {
          const newExpenses = [...g.expenses, newExpense];
          const usedBudget = newExpenses.reduce((sum, e) => sum + e.amount, 0);
          return {
            ...g,
            expenses: newExpenses,
            usedBudget,
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      });
      const newState = { goals: newGoals };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    console.log('[GoalStore] Added expense:', newExpense.title, 'amount:', newExpense.amount);
  },
  
  addComment: (goalId, comment) => {
    const newComment: Comment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleString()
    };
    set(state => {
      const newGoals = state.goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            comments: [...g.comments, newComment],
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      });
      const newState = { goals: newGoals };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    console.log('[GoalStore] Added comment to goal:', goalId);
  },
  
  addReward: (goalId, reward) => {
    const newReward: Reward = {
      ...reward,
      id: Date.now().toString()
    };
    set(state => {
      const newGoals = state.goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            rewards: [...g.rewards, newReward],
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      });
      const newState = { goals: newGoals };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    console.log('[GoalStore] Added reward:', newReward.title);
  },
  
  updateReward: (goalId, rewardId, updates) => {
    set(state => {
      const newGoals = state.goals.map(g => {
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
      });
      const newState = { goals: newGoals };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    console.log('[GoalStore] Updated reward:', rewardId);
  },
  
  deleteReward: (goalId, rewardId) => {
    set(state => {
      const newGoals = state.goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            rewards: g.rewards.filter(r => r.id !== rewardId),
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      });
      const newState = { goals: newGoals };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    console.log('[GoalStore] Deleted reward:', rewardId);
  },
  
  toggleRewardAchieved: (goalId, rewardId) => {
    const goal = get().getGoalById(goalId);
    const reward = goal?.rewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    get().updateReward(goalId, rewardId, { achieved: !reward.achieved });
  },
  
  saveReview: (goalId, review) => {
    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    set(state => ({
      goals: state.goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            status: 'completed' as const,
            review: newReview,
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      })
    }));
    const state = get();
    saveToStorage({
      goals: state.goals,
      members: state.members,
      schedules: state.schedules,
      currentUserId: state.currentUserId
    });
    console.log('[GoalStore] Saved review for goal:', goalId);
  },
  
  getMemberById: (id) => get().members.find(m => m.id === id),
  
  getGoalsByStatus: (status) => get().goals.filter(g => g.status === status),
  
  getGoalsByMember: (memberId) => 
    get().goals.filter(g => g.visibleMemberIds.includes(memberId)),
  
  calculateProgress: (tasks) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  },
  
  getSchedulesByDate: (date) => 
    get().schedules.filter(s => s.date === date),
  
  hasScheduleOnDate: (date) => 
    get().schedules.some(s => s.date === date),
  
  checkDateConflict: (date, time) => {
    const schedules = get().schedules.filter(s => s.date === date && (!time || s.time === time));
    return schedules.length >= 1;
  },
  
  addSchedule: (schedule) => {
    const newSchedule: Schedule = {
      ...schedule,
      id: Date.now().toString()
    };
    set(state => {
      const newSchedules = [...state.schedules, newSchedule];
      const newState = { schedules: newSchedules };
      saveToStorage({ ...state, ...newState });
      return newState;
    });
    console.log('[GoalStore] Added schedule:', newSchedule.title);
  },
  
  exportGoalsCSV: () => {
    const state = get();
    const goals = state.goals;
    const lines: string[] = [];
    
    lines.push('=== 目标清单 ===');
    lines.push(['目标名称', '分类', '状态', '预算', '已花费', '进度', '开始日期', '截止日期', '创建人', '任务数', '完成任务数'].join(','));
    
    goals.forEach(g => {
      lines.push([
        g.title,
        g.category,
        g.status,
        g.budget,
        g.usedBudget,
        `${g.progress}%`,
        g.startDate,
        g.deadline,
        state.getMemberById(g.createdBy)?.name || '',
        g.tasks.length,
        g.tasks.filter(t => t.status === 'completed').length
      ].join(','));
    });
    
    lines.push('');
    lines.push('=== 任务详情 ===');
    lines.push(['目标名称', '任务名称', '负责人', '状态', '优先级', '截止日期', '完成时间'].join(','));
    
    goals.forEach(g => {
      g.tasks.forEach(t => {
        lines.push([
          g.title,
          t.title,
          state.getMemberById(t.assigneeId)?.name || '',
          t.status,
          t.priority,
          t.deadline || '',
          t.completedAt || ''
        ].join(','));
      });
    });
    
    lines.push('');
    lines.push('=== 费用记录 ===');
    lines.push(['目标名称', '费用名称', '金额', '支付人', '日期', '备注'].join(','));
    
    goals.forEach(g => {
      g.expenses.forEach(e => {
        lines.push([
          g.title,
          e.title,
          e.amount,
          state.getMemberById(e.payerId)?.name || '',
          e.date,
          e.note || ''
        ].join(','));
      });
    });
    
    lines.push('');
    lines.push('=== 成员信息 ===');
    lines.push(['成员名称', '角色', '负责任务数', '完成任务数', '支付总额', '评论数'].join(','));
    
    state.members.forEach(m => {
      const memberTasks = goals.flatMap(g => g.tasks).filter(t => t.assigneeId === m.id);
      const memberExpenses = goals.flatMap(g => g.expenses).filter(e => e.payerId === m.id);
      const memberComments = goals.flatMap(g => g.comments).filter(c => c.authorId === m.id);
      
      lines.push([
        m.name,
        m.role,
        memberTasks.length,
        memberTasks.filter(t => t.status === 'completed').length,
        memberExpenses.reduce((sum, e) => sum + e.amount, 0),
        memberComments.length
      ].join(','));
    });
    
    console.log('[GoalStore] Exported CSV with', goals.length, 'goals');
    return lines.join('\n');
  },
  
  downloadCSV: () => {
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
      console.log('[GoalStore] CSV downloaded');
    } else {
      console.warn('[GoalStore] downloadCSV only available in H5');
    }
  },
  
  copyToClipboard: async () => {
    const csvContent = get().exportGoalsCSV();
    
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(csvContent);
        console.log('[GoalStore] Copied to clipboard');
        return true;
      }
    } catch (e) {
      console.warn('[GoalStore] Clipboard API failed, trying fallback:', e);
    }
    
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = csvContent;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        console.log('[GoalStore] Copied to clipboard (fallback):', success);
        return success;
      } catch (e) {
        document.body.removeChild(textarea);
        console.warn('[GoalStore] Fallback copy failed:', e);
        return false;
      }
    }
    
    return false;
  },
  
  resetToMockData: () => {
    set({
      goals: mockGoals,
      members: mockMembers,
      schedules: mockSchedules,
      currentUserId: '1'
    });
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[GoalStore] Failed to clear storage:', e);
    }
    console.log('[GoalStore] Reset to mock data');
  }
}));
