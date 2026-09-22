export const priorities = ['low', 'medium', 'high'] as const;
export const projects = ['personal', 'work', 'learning'] as const;
export type Priority = (typeof priorities)[number];
export type Project = (typeof projects)[number];

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  project: Project;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateTodo {
  title: string;
  description?: string;
  priority?: Priority;
  project?: Project;
  dueDate?: string | null;
}
export type UpdateTodo = Partial<CreateTodo> & { completed?: boolean };
export interface ApiError {
  error: { message: string; details?: unknown };
}
