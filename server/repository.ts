// Translate task operations into parameterized SQLite queries and map rows to API objects.
import { randomUUID } from 'node:crypto';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { CreateTodo, Priority, Project, Todo, UpdateTodo } from '../shared/types.js';

// Describe the compile-time fields of TodoFilters.
export interface TodoFilters {
  q?: string;
  completed?: boolean;
  // Optionally provide the task urgency.
  priority?: Priority;
  project?: Project;
  sort?: 'newest' | 'oldest' | 'dueDate' | 'priority';
}

// Describe the compile-time fields of TodoRow.
interface TodoRow {
  id: string;
  title: string;
  // Specify the task notes.
  description: string;
  completed: number;
  priority: Priority;
  // Specify the task category.
  project: Project;
  due_date: string | null;
  created_at: string;
  // Specify the SQLite update timestamp.
  updated_at: string;
  completed_at: string | null;
}

// Convert snake_case SQLite columns and numeric completion flags into the shared Todo shape.
function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    // Specify the task title.
    title: row.title,
    description: row.description,
    completed: row.completed === 1,
    // Specify the task urgency.
    priority: row.priority,
    project: row.project,
    dueDate: row.due_date,
    // Specify the creation timestamp.
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

// SQL fragments only ever come from this closed set, never from request values.
const sortOrders = {
  newest: 'created_at DESC, id ASC',
  oldest: 'created_at ASC, id ASC',
  // Specify the optional calendar due date.
  dueDate: 'due_date IS NULL ASC, due_date ASC, created_at DESC, id ASC',
  priority:
    "CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END ASC, created_at DESC, id ASC",
  // Keep these values as literal types instead of widening them to strings.
} as const;

export class TodoRepository {
  constructor(private readonly database: DatabaseSync) {}

  // Return tasks matching the requested filters and ordering.
  list(filters: TodoFilters = {}): Todo[] {
    const conditions: string[] = [];
    const values: SQLInputValue[] = [];
    // Add a text-search condition only when search text is supplied.
    if (filters.q) {
      const search = `%${filters.q.replace(/[\\%_]/g, '\\$&')}%`;
      conditions.push("(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
      // Call values.push with the values shown here.
      values.push(search, search);
    }
    if (filters.completed !== undefined) {
      // Call conditions.push with the values shown here.
      conditions.push('completed = ?');
      values.push(Number(filters.completed));
    }
    // Narrow the query to the requested priority.
    if (filters.priority !== undefined) {
      conditions.push('priority = ?');
      values.push(filters.priority);
    }
    // Narrow the query to the requested project.
    if (filters.project !== undefined) {
      conditions.push('project = ?');
      values.push(filters.project);
    }
    // Calculate or store the combined SQL WHERE clause.
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const order = sortOrders[filters.sort ?? 'newest'];
    const rows = this.database
      // Prepare the SQL statement; bind user values separately.
      .prepare(`SELECT * FROM todos ${where} ORDER BY ${order}`)
      .all(...values);
    return (rows as unknown as TodoRow[]).map(toTodo);
  }

  // Look up one task by its UUID.
  find(id: string): Todo | undefined {
    const row = this.database.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    return row ? toTodo(row as unknown as TodoRow) : undefined;
  }

  // Insert a new task with defaults and timestamps.
  create(input: CreateTodo): Todo {
    const now = new Date().toISOString();
    const todo: Todo = {
      // Specify the unique task identifier.
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description ?? '',
      // Specify whether the task is finished.
      completed: false,
      priority: input.priority ?? 'medium',
      project: input.project ?? 'personal',
      // Specify the optional calendar due date.
      dueDate: input.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
      // Specify the completion timestamp, or null while open.
      completedAt: null,
    };
    this.database
      // Prepare the SQL statement; bind user values separately.
      .prepare(
        `
      INSERT INTO todos (id, title, description, completed, priority, project,
                         -- Continue the SQL column list in the same order as the bound values.
                         due_date, created_at, updated_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      // Execute this write statement with the following bound parameter values.
      .run(
        todo.id,
        todo.title,
        todo.description,
        // Call Number with the values shown here.
        Number(todo.completed),
        todo.priority,
        todo.project,
        todo.dueDate,
        todo.createdAt,
        todo.updatedAt,
        todo.completedAt,
      );
    // Return the task exactly as it was persisted.
    return todo;
  }

  update(id: string, input: UpdateTodo): Todo | undefined {
    // Calculate or store the previously stored value.
    const current = this.find(id);
    if (!current) return undefined;

    const now = new Date().toISOString();
    // Calculate or store whether the task is finished.
    const completed = input.completed ?? current.completed;
    const todo: Todo = {
      ...current,
      // Specify the task title.
      title: input.title === undefined ? current.title : input.title.trim(),
      description: input.description ?? current.description,
      priority: input.priority ?? current.priority,
      // Specify the task category.
      project: input.project ?? current.project,
      dueDate: input.dueDate === undefined ? current.dueDate : input.dueDate,
      completed,
      // Repeated completion requests retain the actual first completion time.
      completedAt: completed ? (current.completedAt ?? now) : null,
      updatedAt: now,
    };
    this.database
      // Prepare the SQL statement; bind user values separately.
      .prepare(
        `
      UPDATE todos SET title = ?, description = ?, completed = ?, priority = ?,
        -- Update the remaining metadata and restrict the change to the matching UUID.
        project = ?, due_date = ?, updated_at = ?, completed_at = ? WHERE id = ?
    `,
      )
      // Execute this write statement with the following bound parameter values.
      .run(
        todo.title,
        todo.description,
        // Call Number with the values shown here.
        Number(todo.completed),
        todo.priority,
        todo.project,
        todo.dueDate,
        todo.updatedAt,
        todo.completedAt,
        id,
      );
    // Return the task exactly as it was persisted.
    return todo;
  }

  delete(id: string): boolean {
    // Report true only when DELETE actually removed a row.
    return this.database.prepare('DELETE FROM todos WHERE id = ?').run(id).changes > 0;
  }
}
