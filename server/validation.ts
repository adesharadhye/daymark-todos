// Validate untrusted HTTP input before passing it to the database repository.
import { z } from 'zod';
import { priorities, projects } from '../shared/types.js';

const calendarDate = z
  // Call .string with the values shown here.
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
  .refine((value) => {
    // Calculate or store date.
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Use a real calendar date.');

// Calculate or store editable fields.
const editableFields = {
  title: z
    .string()
    // Call .trim with the values shown here.
    .trim()
    .min(1, 'Give your task a title.')
    .max(200)
    // Add a custom validation rule beyond the base field type.
    .refine((value) => !value.includes('\0'), 'A title cannot contain a null character.'),
  description: z.string().max(5000).optional(),
  priority: z.enum(priorities).optional(),
  // Specify the task category.
  project: z.enum(projects).optional(),
  dueDate: calendarDate.nullable().optional(),
};

// Define createTodoSchema to validate this category of incoming request data.
export const createTodoSchema = z.object(editableFields).strict();
export const updateTodoSchema = z
  .object({ ...editableFields, completed: z.boolean().optional() })
  // Allow partial updates while preserving the field validation rules.
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'Provide at least one field to update.');
// Define todoIdSchema to validate this category of incoming request data.
export const todoIdSchema = z
  .string()
  .uuid('Use a valid todo UUID.')
  // Normalize the validated input into the internal representation.
  .transform((value) => value.toLowerCase());
export const listTodosSchema = z
  .object({
    // Specify the API search text.
    q: z.string().trim().max(200).optional(),
    completed: z
      .enum(['true', 'false'])
      // Normalize the validated input into the internal representation.
      .transform((value) => value === 'true')
      .optional(),
    priority: z.enum(priorities).optional(),
    // Specify the task category.
    project: z.enum(projects).optional(),
    sort: z.enum(['newest', 'oldest', 'dueDate', 'priority']).optional(),
  })
  // Reject fields that are not part of the documented input schema.
  .strict();
