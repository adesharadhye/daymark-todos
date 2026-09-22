// Keep local calendar dates, display labels, and readable error messages consistent.
import type { Todo } from '../../shared/types';

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Produce a friendly due-date label without shifting the calendar day.
export function dueLabel(value: string | null): string {
  if (!value) return 'No due date';
  if (value === localDate()) return 'Today';
  // Calculate or store tomorrow.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === localDate(tomorrow)) return 'Tomorrow';
  // Format a calendar date for display, using noon to avoid midnight timezone shifts.
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    // Copy the existing fields before applying the more specific values.
    ...(value.slice(0, 4) !== String(new Date().getFullYear()) ? { year: 'numeric' } : {}),
  });
}

// Check whether an unfinished task has a date before today.
export function overdue(todo: Todo): boolean {
  return !todo.completed && !!todo.dueDate && todo.dueDate < localDate();
}

// Convert an unknown thrown value into readable feedback.
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

// Format UTC metadata in the user’s local time.
export function timestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
