// Shared TypeScript contracts keep the browser and API consistent about task fields.
export const priorities = ['low', 'medium', 'high'] as const;
export const projects = ['personal', 'work', 'learning'] as const;
export type Priority = (typeof priorities)[number];
// Define the reusable Project type without adding runtime code.
export type Project = (typeof projects)[number];

export interface Todo {
  id: string;
  // Specify the task title.
  title: string;
  description: string;
  completed: boolean;
  // Specify the task urgency.
  priority: Priority;
  project: Project;
  dueDate: string | null;
  // Specify the creation timestamp.
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// Describe the compile-time fields of CreateTodo.
export interface CreateTodo {
  title: string;
  description?: string;
  // Optionally provide the task urgency.
  priority?: Priority;
  project?: Project;
  dueDate?: string | null;
}
// Define the reusable UpdateTodo type without adding runtime code.
export type UpdateTodo = Partial<CreateTodo> & { completed?: boolean };
export interface ApiError {
  error: { message: string; details?: unknown };
}
