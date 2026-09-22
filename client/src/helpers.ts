// Keep local calendar dates, display labels, and readable error messages consistent.
// Import compile-time types from ../../shared/types.
import type { Todo } from '../../shared/types';

// Format a date as a local YYYY-MM-DD calendar value.
export function localDate(date = new Date()): string {
  // Build the YYYY-MM-DD string from local calendar components.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  // Close the current block or object.
}

// Produce a friendly due-date label without shifting the calendar day.
export function dueLabel(value: string | null): string {
  // Show an undated label when there is no due date.
  if (!value) return 'No due date';
  // Use the Today label for the current local calendar date.
  if (value === localDate()) return 'Today';
  // Calculate or store tomorrow.
  const tomorrow = new Date();
  // Call tomorrow.setDate with the values shown here.
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Use the Tomorrow label for the next local calendar date.
  if (value === localDate(tomorrow)) return 'Tomorrow';
  // Format a calendar date for display, using noon to avoid midnight timezone shifts.
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    // Specify month.
    month: 'short',
    // Specify day.
    day: 'numeric',
    // Copy the existing fields before applying the more specific values.
    ...(value.slice(0, 4) !== String(new Date().getFullYear()) ? { year: 'numeric' } : {}),
    // Close the current block or object.
  });
  // Close the current block or object.
}

// Check whether an unfinished task has a date before today.
export function overdue(todo: Todo): boolean {
  // Return whether this unfinished task meets the required date condition.
  return !todo.completed && !!todo.dueDate && todo.dueDate < localDate();
  // Close the current block or object.
}

// Convert an unknown thrown value into readable feedback.
export function messageOf(error: unknown): string {
  // Use a real Error message or a safe fallback for unknown thrown values.
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  // Close the current block or object.
}

// Format UTC metadata in the user’s local time.
export function timestamp(value: string): string {
  // Display the timestamp using the user’s locale and local timezone.
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  // Close the current block or object.
}
