import { loadConfiguration } from './config.js';
import { createDatabase } from './db.js';
import { TodoRepository } from './repository.js';
import type { CreateTodo } from '../shared/types.js';

const { databasePath } = loadConfiguration();
const database = createDatabase(databasePath);
const todos = new TodoRepository(database);

function relativeDate(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const examples: (CreateTodo & { done?: boolean })[] = [
  {
    title: 'Give the portfolio a little polish',
    description:
      'Choose your three favorite projects, tighten up the case studies, and make sure every link works. Progress over perfection.',
    priority: 'high',
    project: 'work',
    dueDate: relativeDate(0),
  },
  {
    title: 'A little fresh air goes a long way',
    description:
      'Take a 30-minute walk. Leave the headphones at home and find a new route through the neighborhood.',
    priority: 'medium',
    project: 'personal',
    dueDate: relativeDate(0),
  },
  {
    title: 'Make room for the next good idea',
    description:
      'Spend 20 minutes clearing your desk and sorting the notes you have collected this week.',
    priority: 'low',
    project: 'personal',
    dueDate: relativeDate(1),
  },
  {
    title: 'Read a chapter of something inspiring',
    description: 'Pick up that book on the bedside table. Jot down one idea you want to remember.',
    priority: 'medium',
    project: 'learning',
    dueDate: relativeDate(1),
  },
  {
    title: 'Sketch out the next product update',
    description:
      'Start with the problem, outline a simple solution, and add a rough sketch. Share a first draft with the team.',
    priority: 'high',
    project: 'work',
    dueDate: relativeDate(2),
  },
  {
    title: 'Plan something good for the weekend',
    description:
      'A new recipe, a trail, or coffee with an old friend. Put one thing on the calendar to look forward to.',
    priority: 'low',
    project: 'personal',
    dueDate: relativeDate(4),
  },
  {
    title: 'Build one tiny thing with TypeScript',
    description:
      'Try out a utility type in a small project. Keep a short note about what you learned.',
    priority: 'medium',
    project: 'learning',
  },
  {
    title: 'Set an intention for the week',
    description:
      'Choose a word that captures how you want this week to feel. Make space for what matters.',
    priority: 'medium',
    project: 'personal',
    dueDate: relativeDate(0),
    done: true,
  },
];

try {
  // A marker makes repeated seeds safe, even after a sample is edited or removed.
  database.exec(
    'CREATE TABLE IF NOT EXISTS seed_history (name TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)',
  );
  database.exec('BEGIN IMMEDIATE');
  const seedName = 'daymark-demo-v1';
  if (database.prepare('SELECT name FROM seed_history WHERE name = ?').get(seedName)) {
    console.log('The Daymark sample tasks have already been added. No changes made.');
  } else {
    for (const { done, ...example } of examples) {
      const todo = todos.create(example);
      if (done) todos.update(todo.id, { completed: true });
    }
    database
      .prepare('INSERT INTO seed_history (name, applied_at) VALUES (?, ?)')
      .run(seedName, new Date().toISOString());
    console.log(`Added ${examples.length} sample tasks to ${databasePath}.`);
  }
  database.exec('COMMIT');
} catch (error) {
  if (database.isTransaction) database.exec('ROLLBACK');
  throw error;
} finally {
  database.close();
}
