// Validate untrusted HTTP input before passing it to the database repository.
// Import the required exports from zod.
import { z } from 'zod';
// Import the required exports from ../shared/types.js.
import { priorities, projects } from '../shared/types.js';

// Require a YYYY-MM-DD string that represents a real calendar date.
const calendarDate = z
  // Call .string with the values shown here.
  .string()
  // Call .regex with the values shown here.
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
  // Add a custom validation rule beyond the base field type.
  .refine((value) => {
    // Calculate or store date.
    const date = new Date(`${value}T00:00:00.000Z`);
    // Reject invalid or normalized-overflow dates by comparing the parsed day with the input.
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
    // Use this validation message when the calendar-date check fails.
  }, 'Use a real calendar date.');

// Calculate or store editable fields.
const editableFields = {
  // Specify the task title.
  title: z
    // Call .string with the values shown here.
    .string()
    // Call .trim with the values shown here.
    .trim()
    // Call .min with the values shown here.
    .min(1, 'Give your task a title.')
    // Call .max with the values shown here.
    .max(200)
    // Add a custom validation rule beyond the base field type.
    .refine((value) => !value.includes('\0'), 'A title cannot contain a null character.'),
  // Specify the task notes.
  description: z.string().max(5000).optional(),
  // Specify the task urgency.
  priority: z.enum(priorities).optional(),
  // Specify the task category.
  project: z.enum(projects).optional(),
  // Specify the optional calendar due date.
  dueDate: calendarDate.nullable().optional(),
  // Close the current block or object.
};

// Define createTodoSchema to validate this category of incoming request data.
export const createTodoSchema = z.object(editableFields).strict();
// Define updateTodoSchema to validate this category of incoming request data.
export const updateTodoSchema = z
  // Call .object with the values shown here.
  .object({ ...editableFields, completed: z.boolean().optional() })
  // Allow partial updates while preserving the field validation rules.
  .partial()
  // Reject fields that are not part of the documented input schema.
  .strict()
  // Add a custom validation rule beyond the base field type.
  .refine((input) => Object.keys(input).length > 0, 'Provide at least one field to update.');
// Define todoIdSchema to validate this category of incoming request data.
export const todoIdSchema = z
  // Call .string with the values shown here.
  .string()
  // Call .uuid with the values shown here.
  .uuid('Use a valid todo UUID.')
  // Normalize the validated input into the internal representation.
  .transform((value) => value.toLowerCase());
// Define listTodosSchema to validate this category of incoming request data.
export const listTodosSchema = z
  // Call .object with the values shown here.
  .object({
    // Specify the API search text.
    q: z.string().trim().max(200).optional(),
    // Specify whether the task is finished.
    completed: z
      // Call .enum with the values shown here.
      .enum(['true', 'false'])
      // Normalize the validated input into the internal representation.
      .transform((value) => value === 'true')
      // Allow this input field to be omitted.
      .optional(),
    // Specify the task urgency.
    priority: z.enum(priorities).optional(),
    // Specify the task category.
    project: z.enum(projects).optional(),
    // Specify the requested ordering.
    sort: z.enum(['newest', 'oldest', 'dueDate', 'priority']).optional(),
    // Close the current block or object.
  })
  // Reject fields that are not part of the documented input schema.
  .strict();
