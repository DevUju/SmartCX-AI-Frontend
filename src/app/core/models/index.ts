export interface User {
  id: string;
  fullName: string;
  email: string;
  persona: string;
  token?: string;
}

export interface SignUpRequest {
  fullName: string;
  email: string;
  password: string;
  persona: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  fullName: string;
  email: string;
  persona: string;
  token: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: string; // 'low', 'medium', 'high'
  status: string; // 'pending', 'in-progress', 'completed'
  userId: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  tag?: string; // For display purposes (derived from priority/status)
  date?: string; // For display purposes (formatted dueDate)
  time?: string; // For display purposes (time component of dueDate)
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: string;
  projectId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: Date;
  priority?: string;
  status?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string; // 'active', 'archived', 'completed'
  progress: number; // 0-100
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  progress?: number;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  progress?: number;
  status?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  date: Date;
  time?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  date?: Date;
  time?: string;
}

export interface ProductivityMetrics {
  overallProgress: number;
  completedTasks: number;
  totalTasks: number;
  streak: number;
  weeklyImprovement: number;
  weeklyData: number[];
  todaysCompletedTasks: number;
  achievement: string;
  categoryBreakdown: {
    work: number;
    personalDevelopment: number;
    health: number;
  };
}

export interface TaskSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number;
}
