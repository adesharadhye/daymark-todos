import { randomUUID } from 'node:crypto';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { CreateTodo, Priority, Project, Todo, UpdateTodo } from '../shared/types.js';

export interface TodoFilters {
  q?: string;
  completed?: boolean;
  priority?: Priority;
  project?: Project;
  sort?: 'newest' | 'oldest' | 'dueDate' | 'priority';
}

interface TodoRow {
  id: string;
  title: string;
  description: string;
  completed: number;
  priority: Priority;
  project: Project;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed === 1,
    priority: row.priority,
    project: row.project,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

// SQL fragments only ever come from this closed set, never from request values.
const sortOrders = {
  newest: 'created_at DESC, id ASC',
  oldest: 'created_at ASC, id ASC',
  dueDate: 'due_date IS NULL ASC, due_date ASC, created_at DESC, id ASC',
  priority:
    "CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END ASC, created_at DESC, id ASC",
} as const;

export class TodoRepository {
  constructor(private readonly database: DatabaseSync) {}

  list(filters: TodoFilters = {}): Todo[] {
    const conditions: string[] = [];
    const values: SQLInputValue[] = [];
    if (filters.q) {
      // Treat wildcard characters as text so searches for '%' and '_' are useful.
      const search = `%${filters.q.replace(/[\\%_]/g, '\\$&')}%`;
      conditions.push("(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
      values.push(search, search);
    }
    if (filters.completed !== undefined) {
      conditions.push('completed = ?');
      values.push(Number(filters.completed));
    }
    if (filters.priority !== undefined) {
      conditions.push('priority = ?');
      values.push(filters.priority);
    }
    if (filters.project !== undefined) {
      conditions.push('project = ?');
      values.push(filters.project);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const order = sortOrders[filters.sort ?? 'newest'];
    const rows = this.database
      .prepare(`SELECT * FROM todos ${where} ORDER BY ${order}`)
      .all(...values);
    return (rows as unknown as TodoRow[]).map(toTodo);
  }

  find(id: string): Todo | undefined {
    const row = this.database.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    return row ? toTodo(row as unknown as TodoRow) : undefined;
  }

  create(input: CreateTodo): Todo {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description ?? '',
      completed: false,
      priority: input.priority ?? 'medium',
      project: input.project ?? 'personal',
      dueDate: input.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    this.database
      .prepare(
        `
      INSERT INTO todos (id, title, description, completed, priority, project,
                         due_date, created_at, updated_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        todo.id,
        todo.title,
        todo.description,
        Number(todo.completed),
        todo.priority,
        todo.project,
        todo.dueDate,
        todo.createdAt,
        todo.updatedAt,
        todo.completedAt,
      );
    return todo;
  }

  update(id: string, input: UpdateTodo): Todo | undefined {
    const current = this.find(id);
    if (!current) return undefined;

    const now = new Date().toISOString();
    const completed = input.completed ?? current.completed;
    const todo: Todo = {
      ...current,
      title: input.title === undefined ? current.title : input.title.trim(),
      description: input.description ?? current.description,
      priority: input.priority ?? current.priority,
      project: input.project ?? current.project,
      dueDate: input.dueDate === undefined ? current.dueDate : input.dueDate,
      completed,
      // Repeated completion requests retain the actual first completion time.
      completedAt: completed ? (current.completedAt ?? now) : null,
      updatedAt: now,
    };
    this.database
      .prepare(
        `
      UPDATE todos SET title = ?, description = ?, completed = ?, priority = ?,
        project = ?, due_date = ?, updated_at = ?, completed_at = ? WHERE id = ?
    `,
      )
      .run(
        todo.title,
        todo.description,
        Number(todo.completed),
        todo.priority,
        todo.project,
        todo.dueDate,
        todo.updatedAt,
        todo.completedAt,
        id,
      );
    return todo;
  }

  delete(id: string): boolean {
    return this.database.prepare('DELETE FROM todos WHERE id = ?').run(id).changes > 0;
  }
}
