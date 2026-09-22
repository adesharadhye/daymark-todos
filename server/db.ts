import { DatabaseSync } from 'node:sqlite';

/** Each caller owns its connection and must close it when finished. */
export function createDatabase(path = ':memory:'): DatabaseSync {
  const database = new DatabaseSync(path);
  try {
    database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
        description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 5000),
        completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        project TEXT NOT NULL DEFAULT 'personal' CHECK (project IN ('personal', 'work', 'learning')),
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        CHECK ((completed = 0 AND completed_at IS NULL) OR
               (completed = 1 AND completed_at IS NOT NULL))
      );
      CREATE INDEX IF NOT EXISTS todos_created_at ON todos(created_at DESC);
      CREATE INDEX IF NOT EXISTS todos_due_date ON todos(due_date);
      CREATE INDEX IF NOT EXISTS todos_project_completed ON todos(project, completed);
    `);
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}
