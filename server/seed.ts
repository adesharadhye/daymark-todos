// Add optional example tasks once per database without deleting existing tasks.
import { loadConfiguration } from './config.js';
import { createDatabase } from './db.js';
import { TodoRepository } from './repository.js';
// Import compile-time types from ../shared/types.js.
import type { CreateTodo } from '../shared/types.js';

const { databasePath } = loadConfiguration();
const database = createDatabase(databasePath);
// Create a task repository around the selected SQLite connection.
const todos = new TodoRepository(database);

function relativeDate(offset: number): string {
  const date = new Date();
  // Call date.setDate with the values shown here.
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  // Calculate or store day.
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate or store examples.
const examples: (CreateTodo & { done?: boolean })[] = [
  {
    title: 'Give the portfolio a little polish',
    // Specify the task notes.
    description:
      'Choose your three favorite projects, tighten up the case studies, and make sure every link works. Progress over perfection.',
    priority: 'high',
    // Specify the task category.
    project: 'work',
    dueDate: relativeDate(0),
  },
  // Begin this object of related settings or sample task fields.
  {
    title: 'A little fresh air goes a long way',
    description:
      // Supply the literal value 'Take a 30-minute walk. Leave the headphones at home and find a new route through the neighborhood.'.
      'Take a 30-minute walk. Leave the headphones at home and find a new route through the neighborhood.',
    priority: 'medium',
    project: 'personal',
    // Specify the optional calendar due date.
    dueDate: relativeDate(0),
  },
  {
    // Specify the task title.
    title: 'Make room for the next good idea',
    description:
      'Spend 20 minutes clearing your desk and sorting the notes you have collected this week.',
    // Specify the task urgency.
    priority: 'low',
    project: 'personal',
    dueDate: relativeDate(1),
  },
  // Begin this object of related settings or sample task fields.
  {
    title: 'Read a chapter of something inspiring',
    description: 'Pick up that book on the bedside table. Jot down one idea you want to remember.',
    // Specify the task urgency.
    priority: 'medium',
    project: 'learning',
    dueDate: relativeDate(1),
  },
  // Begin this object of related settings or sample task fields.
  {
    title: 'Sketch out the next product update',
    description:
      // Supply the literal value 'Start with the problem, outline a simple solution, and add a rough sketch. Share a first draft with the team.'.
      'Start with the problem, outline a simple solution, and add a rough sketch. Share a first draft with the team.',
    priority: 'high',
    project: 'work',
    // Specify the optional calendar due date.
    dueDate: relativeDate(2),
  },
  {
    // Specify the task title.
    title: 'Plan something good for the weekend',
    description:
      'A new recipe, a trail, or coffee with an old friend. Put one thing on the calendar to look forward to.',
    // Specify the task urgency.
    priority: 'low',
    project: 'personal',
    dueDate: relativeDate(4),
  },
  // Begin this object of related settings or sample task fields.
  {
    title: 'Build one tiny thing with TypeScript',
    description:
      // Supply the literal value 'Try out a utility type in a small project. Keep a short note about what you learned.'.
      'Try out a utility type in a small project. Keep a short note about what you learned.',
    priority: 'medium',
    project: 'learning',
  },
  // Begin this object of related settings or sample task fields.
  {
    title: 'Set an intention for the week',
    description:
      // Supply the literal value 'Choose a word that captures how you want this week to feel. Make space for what matters.'.
      'Choose a word that captures how you want this week to feel. Make space for what matters.',
    priority: 'medium',
    project: 'personal',
    // Specify the optional calendar due date.
    dueDate: relativeDate(0),
    done: true,
  },
];

// Attempt the operation so failures can be handled below.
try {
  database.exec(
    'CREATE TABLE IF NOT EXISTS seed_history (name TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)',
  );
  // Execute the schema or transaction-control SQL on this connection.
  database.exec('BEGIN IMMEDIATE');
  const seedName = 'daymark-demo-v1';
  if (database.prepare('SELECT name FROM seed_history WHERE name = ?').get(seedName)) {
    // Write useful startup, seed, or failure information to the server console.
    console.log('The Daymark sample tasks have already been added. No changes made.');
  } else {
    for (const { done, ...example } of examples) {
      // Calculate or store the current task object.
      const todo = todos.create(example);
      if (done) todos.update(todo.id, { completed: true });
    }
    database
      // Prepare the SQL statement; bind user values separately.
      .prepare('INSERT INTO seed_history (name, applied_at) VALUES (?, ?)')
      .run(seedName, new Date().toISOString());
    console.log(`Added ${examples.length} sample tasks to ${databasePath}.`);
  }
  // Execute the schema or transaction-control SQL on this connection.
  database.exec('COMMIT');
} catch (error) {
  if (database.isTransaction) database.exec('ROLLBACK');
  // Reject this operation with an error the caller can handle.
  throw error;
} finally {
  database.close();
}
