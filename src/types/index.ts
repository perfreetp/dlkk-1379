export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'member';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  status: 'pending' | 'in_progress' | 'completed';
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  date: string;
  photoUrl?: string;
  note?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  replyTo?: string;
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  condition: string;
  achieved: boolean;
  achievedAt?: string;
}

export interface Review {
  id: string;
  summary: string;
  highlights: string[];
  improvements: string[];
  photos: string[];
  createdAt: string;
}

export interface Schedule {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'deadline' | 'reminder' | 'meeting';
  goalId?: string;
  taskId?: string;
  conflict?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'travel' | 'saving' | 'organizing' | 'health' | 'study' | 'other';
  budget: number;
  usedBudget: number;
  deadline: string;
  startDate: string;
  completionCriteria: string;
  visibleMemberIds: string[];
  createdBy: string;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  tasks: Task[];
  expenses: ExpenseRecord[];
  comments: Comment[];
  rewards: Reward[];
  review?: Review;
  createdAt: string;
  updatedAt: string;
}

export interface Contribution {
  memberId: string;
  completedTasks: number;
  totalTasks: number;
  expensesPaid: number;
  commentsCount: number;
  score: number;
}

export interface GoalStatistics {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  totalBudget: number;
  totalSpent: number;
  memberContributions: Contribution[];
}

export type GoalCategory = Goal['category'];
export type GoalStatus = Goal['status'];
