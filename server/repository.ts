// Translate task operations into parameterized SQLite queries and map rows to API objects.
// Import the required exports from node:crypto.
import { randomUUID } from 'node:crypto';
// Import compile-time types from node:sqlite.
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
// Import compile-time types from ../shared/types.js.
import type { CreateTodo, Priority, Project, Todo, UpdateTodo } from '../shared/types.js';

// Describe the compile-time fields of TodoFilters.
export interface TodoFilters {
  // Optionally provide the API search text.
  q?: string;
  // Optionally provide whether the task is finished.
  completed?: boolean;
  // Optionally provide the task urgency.
  priority?: Priority;
  // Optionally provide the task category.
  project?: Project;
  // Optionally provide the requested ordering.
  sort?: 'newest' | 'oldest' | 'dueDate' | 'priority';
  // Close the current block or object.
}

// Describe the compile-time fields of TodoRow.
interface TodoRow {
  // Specify the unique task identifier.
  id: string;
  // Specify the task title.
  title: string;
  // Specify the task notes.
  description: string;
  // Specify whether the task is finished.
  completed: number;
  // Specify the task urgency.
  priority: Priority;
  // Specify the task category.
  project: Project;
  // Specify the SQLite due-date column.
  due_date: string | null;
  // Specify the SQLite creation timestamp.
  created_at: string;
  // Specify the SQLite update timestamp.
  updated_at: string;
  // Specify the nullable SQLite completion timestamp.
  completed_at: string | null;
  // Close the current block or object.
}

// Convert snake_case SQLite columns and numeric completion flags into the shared Todo shape.
function toTodo(row: TodoRow): Todo {
  // Build the object returned to the caller from the fields below.
  return {
    // Specify the unique task identifier.
    id: row.id,
    // Specify the task title.
    title: row.title,
    // Specify the task notes.
    description: row.description,
    // Specify whether the task is finished.
    completed: row.completed === 1,
    // Specify the task urgency.
    priority: row.priority,
    // Specify the task category.
    project: row.project,
    // Specify the optional calendar due date.
    dueDate: row.due_date,
    // Specify the creation timestamp.
    createdAt: row.created_at,
    // Specify the last-change timestamp.
    updatedAt: row.updated_at,
    // Specify the completion timestamp, or null while open.
    completedAt: row.completed_at,
    // Close the current block or object.
  };
  // Close the current block or object.
}

// SQL fragments only ever come from this closed set, never from request values.
// Allow only these SQL ordering fragments; request text is never inserted as SQL.
const sortOrders = {
  // Specify newest.
  newest: 'created_at DESC, id ASC',
  // Specify oldest.
  oldest: 'created_at ASC, id ASC',
  // Specify the optional calendar due date.
  dueDate: 'due_date IS NULL ASC, due_date ASC, created_at DESC, id ASC',
  // Specify the task urgency.
  priority:
    // Supply the literal value "CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END ASC, created_at DESC, id ASC".
    "CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END ASC, created_at DESC, id ASC",
  // Keep these values as literal types instead of widening them to strings.
} as const;

// Group the SQLite task operations behind one repository interface.
export class TodoRepository {
  // Keep the supplied database connection on this repository instance.
  constructor(private readonly database: DatabaseSync) {}

  // Return tasks matching the requested filters and ordering.
  list(filters: TodoFilters = {}): Todo[] {
    // Calculate or store the SQL WHERE conditions.
    const conditions: string[] = [];
    // Calculate or store the bound SQL parameter values.
    const values: SQLInputValue[] = [];
    // Add a text-search condition only when search text is supplied.
    if (filters.q) {
      // Treat wildcard characters as text so searches for '%' and '_' are useful.
      // Calculate or store the escaped search pattern.
      const search = `%${filters.q.replace(/[\\%_]/g, '\\$&')}%`;
      // Call conditions.push with the values shown here.
      conditions.push("(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
      // Call values.push with the values shown here.
      values.push(search, search);
      // Close the current block or object.
    }
    // Filter completion explicitly so false is not mistaken for an omitted value.
    if (filters.completed !== undefined) {
      // Call conditions.push with the values shown here.
      conditions.push('completed = ?');
      // Call values.push with the values shown here.
      values.push(Number(filters.completed));
      // Close the current block or object.
    }
    // Narrow the query to the requested priority.
    if (filters.priority !== undefined) {
      // Call conditions.push with the values shown here.
      conditions.push('priority = ?');
      // Call values.push with the values shown here.
      values.push(filters.priority);
      // Close the current block or object.
    }
    // Narrow the query to the requested project.
    if (filters.project !== undefined) {
      // Call conditions.push with the values shown here.
      conditions.push('project = ?');
      // Call values.push with the values shown here.
      values.push(filters.project);
      // Close the current block or object.
    }
    // Calculate or store the combined SQL WHERE clause.
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    // Calculate or store the allowlisted SQL ordering.
    const order = sortOrders[filters.sort ?? 'newest'];
    // Calculate or store the matching database rows.
    const rows = this.database
      // Prepare the SQL statement; bind user values separately.
      .prepare(`SELECT * FROM todos ${where} ORDER BY ${order}`)
      // Execute the query and collect all matching rows.
      .all(...values);
    // Convert each database row into the shared task response shape.
    return (rows as unknown as TodoRow[]).map(toTodo);
    // Close the current block or object.
  }

  // Look up one task by its UUID.
  find(id: string): Todo | undefined {
    // Calculate or store one database row.
    const row = this.database.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    // Return the mapped task when found, otherwise undefined.
    return row ? toTodo(row as unknown as TodoRow) : undefined;
    // Close the current block or object.
  }

  // Insert a new task with defaults and timestamps.
  create(input: CreateTodo): Todo {
    // Calculate or store the current UTC timestamp.
    const now = new Date().toISOString();
    // Calculate or store the current task object.
    const todo: Todo = {
      // Specify the unique task identifier.
      id: randomUUID(),
      // Specify the task title.
      title: input.title.trim(),
      // Specify the task notes.
      description: input.description ?? '',
      // Specify whether the task is finished.
      completed: false,
      // Specify the task urgency.
      priority: input.priority ?? 'medium',
      // Specify the task category.
      project: input.project ?? 'personal',
      // Specify the optional calendar due date.
      dueDate: input.dueDate ?? null,
      // Specify the creation timestamp.
      createdAt: now,
      // Specify the last-change timestamp.
      updatedAt: now,
      // Specify the completion timestamp, or null while open.
      completedAt: null,
      // Close the current block or object.
    };
    // Supply this.database to the enclosing expression.
    this.database
      // Prepare the SQL statement; bind user values separately.
      .prepare(
        // Supply the literal value `.
        `
      -- List the task columns populated by this insert.
      INSERT INTO todos (id, title, description, completed, priority, project,
                         -- Continue the SQL column list in the same order as the bound values.
                         due_date, created_at, updated_at, completed_at)
      -- Use placeholders so task values remain data rather than executable SQL.
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    -- End this SQL statement block.
    `,
        // Finish the current expression or function call.
      )
      // Execute this write statement with the following bound parameter values.
      .run(
        // Supply todo.id to the enclosing expression.
        todo.id,
        // Supply todo.title to the enclosing expression.
        todo.title,
        // Supply todo.description to the enclosing expression.
        todo.description,
        // Call Number with the values shown here.
        Number(todo.completed),
        // Supply todo.priority to the enclosing expression.
        todo.priority,
        // Supply todo.project to the enclosing expression.
        todo.project,
        // Supply todo.due date to the enclosing expression.
        todo.dueDate,
        // Supply todo.created at to the enclosing expression.
        todo.createdAt,
        // Supply todo.updated at to the enclosing expression.
        todo.updatedAt,
        // Supply todo.completed at to the enclosing expression.
        todo.completedAt,
        // Finish the current expression or function call.
      );
    // Return the task exactly as it was persisted.
    return todo;
    // Close the current block or object.
  }

  // Merge supplied fields into an existing task.
  update(id: string, input: UpdateTodo): Todo | undefined {
    // Calculate or store the previously stored value.
    const current = this.find(id);
    // Stop an update when its target task does not exist.
    if (!current) return undefined;

    // Calculate or store the current UTC timestamp.
    const now = new Date().toISOString();
    // Calculate or store whether the task is finished.
    const completed = input.completed ?? current.completed;
    // Calculate or store the current task object.
    const todo: Todo = {
      // Copy the existing fields before applying the more specific values.
      ...current,
      // Specify the task title.
      title: input.title === undefined ? current.title : input.title.trim(),
      // Specify the task notes.
      description: input.description ?? current.description,
      // Specify the task urgency.
      priority: input.priority ?? current.priority,
      // Specify the task category.
      project: input.project ?? current.project,
      // Specify the optional calendar due date.
      dueDate: input.dueDate === undefined ? current.dueDate : input.dueDate,
      // Supply whether the task is finished to the enclosing expression.
      completed,
      // Repeated completion requests retain the actual first completion time.
      // Specify the completion timestamp, or null while open.
      completedAt: completed ? (current.completedAt ?? now) : null,
      // Specify the last-change timestamp.
      updatedAt: now,
      // Close the current block or object.
    };
    // Supply this.database to the enclosing expression.
    this.database
      // Prepare the SQL statement; bind user values separately.
      .prepare(
        // Supply the literal value `.
        `
      -- Update the editable task columns using bound values.
      UPDATE todos SET title = ?, description = ?, completed = ?, priority = ?,
        -- Update the remaining metadata and restrict the change to the matching UUID.
        project = ?, due_date = ?, updated_at = ?, completed_at = ? WHERE id = ?
    -- End this SQL statement block.
    `,
        // Finish the current expression or function call.
      )
      // Execute this write statement with the following bound parameter values.
      .run(
        // Supply todo.title to the enclosing expression.
        todo.title,
        // Supply todo.description to the enclosing expression.
        todo.description,
        // Call Number with the values shown here.
        Number(todo.completed),
        // Supply todo.priority to the enclosing expression.
        todo.priority,
        // Supply todo.project to the enclosing expression.
        todo.project,
        // Supply todo.due date to the enclosing expression.
        todo.dueDate,
        // Supply todo.updated at to the enclosing expression.
        todo.updatedAt,
        // Supply todo.completed at to the enclosing expression.
        todo.completedAt,
        // Supply the unique task identifier to the enclosing expression.
        id,
        // Finish the current expression or function call.
      );
    // Return the task exactly as it was persisted.
    return todo;
    // Close the current block or object.
  }

  // Remove a task and report whether a row existed.
  delete(id: string): boolean {
    // Report true only when DELETE actually removed a row.
    return this.database.prepare('DELETE FROM todos WHERE id = ?').run(id).changes > 0;
    // Close the current block or object.
  }
  // Close the current block or object.
}
