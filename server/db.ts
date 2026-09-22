// Open SQLite and create the schema; callers close the returned connection.
// Import the required exports from node:sqlite.
import { DatabaseSync } from 'node:sqlite';

/** Each caller owns its connection and must close it when finished. */
// Open a connection and initialize the SQLite tables and indexes.
export function createDatabase(path = ':memory:'): DatabaseSync {
  // Calculate or store the SQLite connection.
  const database = new DatabaseSync(path);
  // Attempt the operation so failures can be handled below.
  try {
    // Execute the schema or transaction-control SQL on this connection.
    database.exec(`
      -- Use write-ahead logging for the file-backed database.
      PRAGMA journal_mode = WAL;
      -- Enable foreign-key enforcement on this connection.
      PRAGMA foreign_keys = ON;
      -- Wait up to five seconds for a temporary database lock.
      PRAGMA busy_timeout = 5000;

      -- Create the task table only when it does not already exist.
      CREATE TABLE IF NOT EXISTS todos (
        -- Store the unique task identifier.
        id TEXT PRIMARY KEY NOT NULL,
        -- Store the task title and enforce its allowed values or length.
        title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
        -- Store the task notes and enforce its allowed values or length.
        description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 5000),
        -- Store whether the task is finished and enforce its allowed values or length.
        completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
        -- Store the task urgency and enforce its allowed values or length.
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        -- Store the task category and enforce its allowed values or length.
        project TEXT NOT NULL DEFAULT 'personal' CHECK (project IN ('personal', 'work', 'learning')),
        -- Store the SQLite due-date column.
        due_date TEXT,
        -- Store the SQLite creation timestamp.
        created_at TEXT NOT NULL,
        -- Store the SQLite update timestamp.
        updated_at TEXT NOT NULL,
        -- Store the nullable SQLite completion timestamp.
        completed_at TEXT,
        -- Require open tasks to have no completion timestamp.
        CHECK ((completed = 0 AND completed_at IS NULL) OR
               -- Require completed tasks to have a completion timestamp.
               (completed = 1 AND completed_at IS NOT NULL))
      -- Finish the table definition and its integrity checks.
      );
      -- Index creation timestamps to support newest-first queries.
      CREATE INDEX IF NOT EXISTS todos_created_at ON todos(created_at DESC);
      -- Index due dates to support date-based queries.
      CREATE INDEX IF NOT EXISTS todos_due_date ON todos(due_date);
      -- Index project and completion together to support filtered queries.
      CREATE INDEX IF NOT EXISTS todos_project_completed ON todos(project, completed);
    -- End this SQL statement block.
    `);
    // Give the caller the initialized SQLite connection.
    return database;
    // Handle a failure from the preceding operation.
  } catch (error) {
    // Close this SQLite connection and release its file handles.
    database.close();
    // Reject this operation with an error the caller can handle.
    throw error;
    // Close the current block or object.
  }
  // Close the current block or object.
}
