// Add optional example tasks once per database without deleting existing tasks.
// Import the required exports from ./config.js.
import { loadConfiguration } from './config.js';
// Import the required exports from ./db.js.
import { createDatabase } from './db.js';
// Import the required exports from ./repository.js.
import { TodoRepository } from './repository.js';
// Import compile-time types from ../shared/types.js.
import type { CreateTodo } from '../shared/types.js';

// Extract the named values from the returned configuration or API object.
const { databasePath } = loadConfiguration();
// Calculate or store the SQLite connection.
const database = createDatabase(databasePath);
// Create a task repository around the selected SQLite connection.
const todos = new TodoRepository(database);

// Create a sample due date relative to today.
function relativeDate(offset: number): string {
  // Calculate or store date.
  const date = new Date();
  // Call date.setDate with the values shown here.
  date.setDate(date.getDate() + offset);
  // Calculate or store year.
  const year = date.getFullYear();
  // Calculate or store month.
  const month = String(date.getMonth() + 1).padStart(2, '0');
  // Calculate or store day.
  const day = String(date.getDate()).padStart(2, '0');
  // Build the YYYY-MM-DD string from local calendar components.
  return `${year}-${month}-${day}`;
  // Close the current block or object.
}

// Calculate or store examples.
const examples: (CreateTodo & { done?: boolean })[] = [
  // Begin this object of related settings or sample task fields.
  {
    // Specify the task title.
    title: 'Give the portfolio a little polish',
    // Specify the task notes.
    description:
      // Supply the literal value 'Choose your three favorite projects, tighten up the case studies, and make sure every link works. Progress over perfect.
      'Choose your three favorite projects, tighten up the case studies, and make sure every link works. Progress over perfection.',
    // Specify the task urgency.
    priority: 'high',
    // Specify the task category.
    project: 'work',
    // Specify the optional calendar due date.
    dueDate: relativeDate(0),
    // Close the current block or object.
  },
  // Begin this object of related settings or sample task fields.
  {
    // Specify the task title.
    title: 'A little fresh air goes a long way',
    // Specify the task notes.
    description:
      // Supply the literal value 'Take a 30-minute walk. Leave the headphones at home and find a new route through the neighborhood.'.
      'Take a 30-minute walk. Leave the headphones at home and find a new route through the neighborhood.',
    // Specify the task urgency.
    priority: 'medium',
    // Specify the task category.
    project: 'personal',
    // Specify the optional calendar due date.
    dueDate: relativeDate(0),
    // Close the current block or object.
  },
  // Begin this object of related settings or sample task fields.
  {
    // Specify the task title.
    title: 'Make room for the next good idea',
    // Specify the task notes.
    description:
      // Supply the literal value 'Spend 20 minutes clearing your desk and sorting the notes you have collected this week.'.
      'Spend 20 minutes clearing your desk and sorting the notes you have collected this week.',
    // Specify the task urgency.
    priority: 'low',
    // Specify the task category.
    project: 'personal',
    // Specify the optional calendar due date.
    dueDate: relativeDate(1),
    // Close the current block or object.
  },
  // Begin this object of related settings or sample task fields.
  {
    // Specify the task title.
    title: 'Read a chapter of something inspiring',
    // Specify the task notes.
    description: 'Pick up that book on the bedside table. Jot down one idea you want to remember.',
    // Specify the task urgency.
    priority: 'medium',
    // Specify the task category.
    project: 'learning',
    // Specify the optional calendar due date.
    dueDate: relativeDate(1),
    // Close the current block or object.
  },
  // Begin this object of related settings or sample task fields.
  {
    // Specify the task title.
    title: 'Sketch out the next product update',
    // Specify the task notes.
    description:
      // Supply the literal value 'Start with the problem, outline a simple solution, and add a rough sketch. Share a first draft with the team.'.
      'Start with the problem, outline a simple solution, and add a rough sketch. Share a first draft with the team.',
    // Specify the task urgency.
    priority: 'high',
    // Specify the task category.
    project: 'work',
    // Specify the optional calendar due date.
    dueDate: relativeDate(2),
    // Close the current block or object.
  },
  // Begin this object of related settings or sample task fields.
  {
    // Specify the task title.
    title: 'Plan something good for the weekend',
    // Specify the task notes.
    description:
      // Supply the literal value 'A new recipe, a trail, or coffee with an old friend. Put one thing on the calendar to look forward to.'.
      'A new recipe, a trail, or coffee with an old friend. Put one thing on the calendar to look forward to.',
    // Specify the task urgency.
    priority: 'low',
    // Specify the task category.
    project: 'personal',
    // Specify the optional calendar due date.
    dueDate: relativeDate(4),
    // Close the current block or object.
  },
  // Begin this object of related settings or sample task fields.
  {
    // Specify the task title.
    title: 'Build one tiny thing with TypeScript',
    // Specify the task notes.
    description:
      // Supply the literal value 'Try out a utility type in a small project. Keep a short note about what you learned.'.
      'Try out a utility type in a small project. Keep a short note about what you learned.',
    // Specify the task urgency.
    priority: 'medium',
    // Specify the task category.
    project: 'learning',
    // Close the current block or object.
  },
  // Begin this object of related settings or sample task fields.
  {
    // Specify the task title.
    title: 'Set an intention for the week',
    // Specify the task notes.
    description:
      // Supply the literal value 'Choose a word that captures how you want this week to feel. Make space for what matters.'.
      'Choose a word that captures how you want this week to feel. Make space for what matters.',
    // Specify the task urgency.
    priority: 'medium',
    // Specify the task category.
    project: 'personal',
    // Specify the optional calendar due date.
    dueDate: relativeDate(0),
    // Specify done.
    done: true,
    // Close the current block or object.
  },
  // Finish the array of values.
];

// Attempt the operation so failures can be handled below.
try {
  // A marker makes repeated seeds safe, even after a sample is edited or removed.
  // Execute the schema or transaction-control SQL on this connection.
  database.exec(
    // Supply the literal value 'CREATE TABLE IF NOT EXISTS seed_history (name TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)'.
    'CREATE TABLE IF NOT EXISTS seed_history (name TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)',
    // Finish the current expression or function call.
  );
  // Execute the schema or transaction-control SQL on this connection.
  database.exec('BEGIN IMMEDIATE');
  // Calculate or store seed name.
  const seedName = 'daymark-demo-v1';
  // Take this branch when the condition holds: database.prepare('SELECT name FROM seed_history WHERE name = ?').get(seedName).
  if (database.prepare('SELECT name FROM seed_history WHERE name = ?').get(seedName)) {
    // Write useful startup, seed, or failure information to the server console.
    console.log('The Daymark sample tasks have already been added. No changes made.');
    // Handle the alternative condition.
  } else {
    // Iterate through const { done, ...example } of examples.
    for (const { done, ...example } of examples) {
      // Calculate or store the current task object.
      const todo = todos.create(example);
      // Mark this example complete when its seed definition requests it.
      if (done) todos.update(todo.id, { completed: true });
      // Close the current block or object.
    }
    // Supply the SQLite connection to the enclosing expression.
    database
      // Prepare the SQL statement; bind user values separately.
      .prepare('INSERT INTO seed_history (name, applied_at) VALUES (?, ?)')
      // Execute this write statement with the following bound parameter values.
      .run(seedName, new Date().toISOString());
    // Write useful startup, seed, or failure information to the server console.
    console.log(`Added ${examples.length} sample tasks to ${databasePath}.`);
    // Close the current block or object.
  }
  // Execute the schema or transaction-control SQL on this connection.
  database.exec('COMMIT');
  // Handle a failure from the preceding operation.
} catch (error) {
  // Roll back only if this seed operation still has an open transaction.
  if (database.isTransaction) database.exec('ROLLBACK');
  // Reject this operation with an error the caller can handle.
  throw error;
  // Run cleanup whether the operation succeeds or fails.
} finally {
  // Close this SQLite connection and release its file handles.
  database.close();
  // Close the current block or object.
}
