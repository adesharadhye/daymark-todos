// Shared TypeScript contracts keep the browser and API consistent about task fields.
// Calculate or store priorities.
export const priorities = ['low', 'medium', 'high'] as const;
// Calculate or store projects.
export const projects = ['personal', 'work', 'learning'] as const;
// Define the reusable Priority type without adding runtime code.
export type Priority = (typeof priorities)[number];
// Define the reusable Project type without adding runtime code.
export type Project = (typeof projects)[number];

// Describe the compile-time fields of Todo.
export interface Todo {
  // Specify the unique task identifier.
  id: string;
  // Specify the task title.
  title: string;
  // Specify the task notes.
  description: string;
  // Specify whether the task is finished.
  completed: boolean;
  // Specify the task urgency.
  priority: Priority;
  // Specify the task category.
  project: Project;
  // Specify the optional calendar due date.
  dueDate: string | null;
  // Specify the creation timestamp.
  createdAt: string;
  // Specify the last-change timestamp.
  updatedAt: string;
  // Specify the completion timestamp, or null while open.
  completedAt: string | null;
  // Close the current block or object.
}

// Describe the compile-time fields of CreateTodo.
export interface CreateTodo {
  // Specify the task title.
  title: string;
  // Optionally provide the task notes.
  description?: string;
  // Optionally provide the task urgency.
  priority?: Priority;
  // Optionally provide the task category.
  project?: Project;
  // Optionally provide the optional calendar due date.
  dueDate?: string | null;
  // Close the current block or object.
}
// Define the reusable UpdateTodo type without adding runtime code.
export type UpdateTodo = Partial<CreateTodo> & { completed?: boolean };
// Describe the compile-time fields of ApiError.
export interface ApiError {
  // Specify the error message or error object.
  error: { message: string; details?: unknown };
  // Close the current block or object.
}
