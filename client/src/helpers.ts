import type { Todo } from '../../shared/types';

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dueLabel(value: string | null): string {
  if (!value) return 'No due date';
  if (value === localDate()) return 'Today';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === localDate(tomorrow)) return 'Tomorrow';
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(value.slice(0, 4) !== String(new Date().getFullYear()) ? { year: 'numeric' } : {}),
  });
}

export function overdue(todo: Todo): boolean {
  return !todo.completed && !!todo.dueDate && todo.dueDate < localDate();
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function timestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
