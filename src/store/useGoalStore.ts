import { create } from 'zustand';
import type { Goal, Member, Schedule, Task, ExpenseRecord, Comment, Reward } from '@/types';
import { mockGoals, mockMembers, mockSchedules } from '@/data/mockData';

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
  
  addExpense: (goalId: string, expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  
  addComment: (goalId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  
  addReward: (goalId: string, reward: Omit<Reward, 'id'>) => void;
  updateReward: (goalId: string, rewardId: string, updates: Partial<Reward>) => void;
  
  getMemberById: (id: string) => Member | undefined;
  getGoalsByStatus: (status: Goal['status']) => Goal[];
  getGoalsByMember: (memberId: string) => Goal[];
  calculateProgress: (tasks: Task[]) => number;
  getSchedulesByDate: (date: string) => Schedule[];
  checkDateConflict: (date: string, time?: string) => boolean;
  
  exportGoals: () => string;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: mockGoals,
  members: mockMembers,
  schedules: mockSchedules,
  currentUserId: '1',
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
    set(state => ({ goals: [...state.goals, newGoal] }));
    console.log('[GoalStore] Added new goal:', newGoal.title);
  },
  
  updateGoal: (id, updates) => {
    set(state => ({
      goals: state.goals.map(g => 
        g.id === id 
          ? { ...g, ...updates, updatedAt: new Date().toISOString() }
          : g
      )
    }));
    console.log('[GoalStore] Updated goal:', id);
  },
  
  deleteGoal: (id) => {
    set(state => ({
      goals: state.goals.filter(g => g.id !== id)
    }));
    console.log('[GoalStore] Deleted goal:', id);
  },
  
  addTask: (goalId, task) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    set(state => ({
      goals: state.goals.map(g => {
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
      })
    }));
    console.log('[GoalStore] Added task:', newTask.title, 'to goal:', goalId);
  },
  
  updateTask: (goalId, taskId, updates) => {
    set(state => ({
      goals: state.goals.map(g => {
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
      })
    }));
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
  
  addExpense: (goalId, expense) => {
    const newExpense: ExpenseRecord = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    set(state => ({
      goals: state.goals.map(g => {
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
      })
    }));
    console.log('[GoalStore] Added expense:', newExpense.title, 'amount:', newExpense.amount);
  },
  
  addComment: (goalId, comment) => {
    const newComment: Comment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleString()
    };
    set(state => ({
      goals: state.goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            comments: [...g.comments, newComment],
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      })
    }));
    console.log('[GoalStore] Added comment to goal:', goalId);
  },
  
  addReward: (goalId, reward) => {
    const newReward: Reward = {
      ...reward,
      id: Date.now().toString()
    };
    set(state => ({
      goals: state.goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            rewards: [...g.rewards, newReward],
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      })
    }));
    console.log('[GoalStore] Added reward:', newReward.title);
  },
  
  updateReward: (goalId, rewardId, updates) => {
    set(state => ({
      goals: state.goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            rewards: g.rewards.map(r => 
              r.id === rewardId 
                ? { ...r, ...updates, achievedAt: updates.achieved ? new Date().toISOString() : undefined }
                : r
            ),
            updatedAt: new Date().toISOString()
          };
        }
        return g;
      })
    }));
    console.log('[GoalStore] Updated reward:', rewardId);
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
  
  checkDateConflict: (date, time) => {
    const schedules = get().schedules.filter(s => s.date === date && s.time === time);
    return schedules.length > 1;
  },
  
  exportGoals: () => {
    const goals = get().goals;
    const csvContent = [
      ['目标名称', '分类', '状态', '预算', '已花费', '进度', '开始日期', '截止日期', '创建人'].join(','),
      ...goals.map(g => [
        g.title,
        g.category,
        g.status,
        g.budget,
        g.usedBudget,
        `${g.progress}%`,
        g.startDate,
        g.deadline,
        get().getMemberById(g.createdBy)?.name || ''
      ].join(','))
    ].join('\n');
    
    console.log('[GoalStore] Exported', goals.length, 'goals');
    return csvContent;
  }
}));
