import { z } from 'zod';
import { priorities, projects } from '../shared/types.js';

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Use a real calendar date.');

const editableFields = {
  title: z
    .string()
    .trim()
    .min(1, 'Give your task a title.')
    .max(200)
    .refine((value) => !value.includes('\0'), 'A title cannot contain a null character.'),
  description: z.string().max(5000).optional(),
  priority: z.enum(priorities).optional(),
  project: z.enum(projects).optional(),
  dueDate: calendarDate.nullable().optional(),
};

export const createTodoSchema = z.object(editableFields).strict();
export const updateTodoSchema = z
  .object({ ...editableFields, completed: z.boolean().optional() })
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'Provide at least one field to update.');
export const todoIdSchema = z
  .string()
  .uuid('Use a valid todo UUID.')
  .transform((value) => value.toLowerCase());
export const listTodosSchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    completed: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    priority: z.enum(priorities).optional(),
    project: z.enum(projects).optional(),
    sort: z.enum(['newest', 'oldest', 'dueDate', 'priority']).optional(),
  })
  .strict();
