export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes?: number | null;
  deadline?: string | null;
  completedAt?: string | null;
  remindHourly?: boolean;
  goalId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Schedule {
  id: string;
  startTime: string;
  endTime: string;
  taskId?: string | null;
  task?: Task | null;
}

export interface Goal {
  id: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  progress: number;
  tasks?: Task[];
}

export interface TaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  deadline?: string;
  estimatedMinutes?: number;
  goalId?: string;
  remindHourly?: boolean;
}

export interface ScheduleInput {
  startTime: string;
  endTime: string;
  taskId?: string;
}

export interface GoalInput {
  title: string;
  description?: string;
  targetDate?: string;
  progress?: number;
}

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data as T;
}

export const api = {
  dashboard: () => request<{ stats: DashboardStats }>("/dashboard"),

  tasks: {
    list: () => request<{ tasks: Task[] }>("/tasks"),
    create: (body: TaskInput) =>
      request<{ task: Task }>("/tasks", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: TaskInput) =>
      request<{ task: Task }>(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    complete: (id: string) =>
      request<{ task: Task }>(`/tasks/${id}/complete`, { method: "PATCH" }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
  },

  schedules: {
    list: () => request<{ schedules: Schedule[] }>("/schedules"),
    create: (body: ScheduleInput) =>
      request<{ schedule: Schedule }>("/schedules", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/schedules/${id}`, { method: "DELETE" }),
  },

  goals: {
    list: () => request<{ goals: Goal[] }>("/goals"),
    create: (body: GoalInput) =>
      request<{ goal: Goal }>("/goals", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/goals/${id}`, { method: "DELETE" }),
  },
};
