// Check sorting, literal search, missing records, and persistence independently of the browser.
// Import the required exports from node:fs.
import { mkdtempSync, rmSync } from 'node:fs';
// Import the required exports from node:os.
import { tmpdir } from 'node:os';
// Import the required exports from node:path.
import { join } from 'node:path';
// Import the required exports from vitest.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Import compile-time types from node:sqlite.
import type { DatabaseSync } from 'node:sqlite';
// Import the required exports from ../server/db.js.
import { createDatabase } from '../server/db.js';
// Import the required exports from ../server/repository.js.
import { TodoRepository } from '../server/repository.js';

// Group tests for describe('TodoRepository', () .
describe('TodoRepository', () => {
  // Reserve a variable for the isolated test database.
  let db: DatabaseSync;
  // Reserve a variable for the task repository under test.
  let repository: TodoRepository;

  // Prepare fresh test state before each case.
  beforeEach(() => {
    // Update the isolated test database with the result of this expression.
    db = createDatabase();
    // Update the task repository under test with the result of this expression.
    repository = new TodoRepository(db);
    // Close the current block or object.
  });

  // Clean up resources after each test case.
  afterEach(() => {
    // Close this SQLite connection and release its file handles.
    db.close();
    // Restore the real clock for later tests.
    vi.useRealTimers();
    // Close the current block or object.
  });

  // Define the test case: it('orders by creation time in either direction', () .
  it('orders by creation time in either direction', () => {
    // Control Date in this test so chronological ordering is deterministic.
    vi.useFakeTimers({ toFake: ['Date'] });
    // Set the simulated clock before creating the next task.
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    // Call repository.create with the values shown here.
    repository.create({ title: 'First' });
    // Set the simulated clock before creating the next task.
    vi.setSystemTime(new Date('2026-01-02T10:00:00Z'));
    // Call repository.create with the values shown here.
    repository.create({ title: 'Second' });
    // Assert the observed result for repository.list().map((todo) => todo.title)).toEqual(['Second', 'First'].
    expect(repository.list().map((todo) => todo.title)).toEqual(['Second', 'First']);
    // Assert the observed result for repository.list({ sort: 'oldest' }).map((todo) => todo.title)).toEqual([.
    expect(repository.list({ sort: 'oldest' }).map((todo) => todo.title)).toEqual([
      // Supply the literal value 'First'.
      'First',
      // Supply the literal value 'Second'.
      'Second',
      // Finish the array of values.
    ]);
    // Close the current block or object.
  });

  // Define the test case: it('treats SQL search wildcard characters as literal text', () .
  it('treats SQL search wildcard characters as literal text', () => {
    // Call repository.create with the values shown here.
    repository.create({ title: 'Reach 100% coverage' });
    // Call repository.create with the values shown here.
    repository.create({ title: 'Update task_name' });
    // Call repository.create with the values shown here.
    repository.create({ title: 'Unrelated task' });
    // Assert the observed result for repository.list({ q: '%' }).map((todo) => todo.title)).toEqual(['Reach 100% coverage'].
    expect(repository.list({ q: '%' }).map((todo) => todo.title)).toEqual(['Reach 100% coverage']);
    // Assert the observed result for repository.list({ q: '_' }).map((todo) => todo.title)).toEqual(['Update task_name'].
    expect(repository.list({ q: '_' }).map((todo) => todo.title)).toEqual(['Update task_name']);
    // Close the current block or object.
  });

  // Define the test case: it('orders by priority from high to low', () .
  it('orders by priority from high to low', () => {
    // Call repository.create with the values shown here.
    repository.create({ title: 'Low', priority: 'low' });
    // Call repository.create with the values shown here.
    repository.create({ title: 'High', priority: 'high' });
    // Call repository.create with the values shown here.
    repository.create({ title: 'Medium', priority: 'medium' });
    // Assert the observed result for repository.list({ sort: 'priority' }).map((todo) => todo.title)).toEqual([.
    expect(repository.list({ sort: 'priority' }).map((todo) => todo.title)).toEqual([
      // Supply the literal value 'High'.
      'High',
      // Supply the literal value 'Medium'.
      'Medium',
      // Supply the literal value 'Low'.
      'Low',
      // Finish the array of values.
    ]);
    // Close the current block or object.
  });

  // Define the test case: it('orders dated todos chronologically and puts undated todos last', () .
  it('orders dated todos chronologically and puts undated todos last', () => {
    // Call repository.create with the values shown here.
    repository.create({ title: 'No date' });
    // Call repository.create with the values shown here.
    repository.create({ title: 'Later', dueDate: '2027-06-30' });
    // Call repository.create with the values shown here.
    repository.create({ title: 'Earlier', dueDate: '2027-01-01' });
    // Assert the observed result for repository.list({ sort: 'dueDate' }).map((todo) => todo.title)).toEqual([.
    expect(repository.list({ sort: 'dueDate' }).map((todo) => todo.title)).toEqual([
      // Supply the literal value 'Earlier'.
      'Earlier',
      // Supply the literal value 'Later'.
      'Later',
      // Supply the literal value 'No date'.
      'No date',
      // Finish the array of values.
    ]);
    // Close the current block or object.
  });

  // Define the test case: it('reports missing records without creating them', () .
  it('reports missing records without creating them', () => {
    // Calculate or store the unique task identifier.
    const id = '00000000-0000-4000-8000-000000000000';
    // Assert the observed result for repository.find(id)).toBeUndefined(.
    expect(repository.find(id)).toBeUndefined();
    // Assert the observed result for repository.update(id, { title: 'Missing' })).toBeUndefined(.
    expect(repository.update(id, { title: 'Missing' })).toBeUndefined();
    // Assert the observed result for repository.delete(id)).toBe(false.
    expect(repository.delete(id)).toBe(false);
    // Assert the observed result for repository.list()).toEqual([].
    expect(repository.list()).toEqual([]);
    // Close the current block or object.
  });
  // Close the current block or object.
});

// Group tests for describe('SQLite persistence', () .
describe('SQLite persistence', () => {
  // Define the test case: it('survives closing and reopening a database file', () .
  it('survives closing and reopening a database file', () => {
    // Calculate or store directory.
    const directory = mkdtempSync(join(tmpdir(), 'daymark-test-'));
    // Calculate or store the file location or invalid field path.
    const path = join(directory, 'todos.sqlite');
    // Reserve a variable for the connection used by the persistence test.
    let connection: DatabaseSync | undefined;
    // Attempt the operation so failures can be handled below.
    try {
      // Update the connection used by the persistence test with the result of this expression.
      connection = createDatabase(path);
      // Create a task repository around the selected SQLite connection.
      const todo = new TodoRepository(connection).create({
        // Specify the task title.
        title: 'Keep me',
        // Specify the task category.
        project: 'work',
        // Specify the optional calendar due date.
        dueDate: '2027-03-14',
        // Close the current block or object.
      });
      // Close this SQLite connection and release its file handles.
      connection.close();
      // Update the connection used by the persistence test with the result of this expression.
      connection = undefined;
      // Update the connection used by the persistence test with the result of this expression.
      connection = createDatabase(path);
      // Assert the observed result for new TodoRepository(connection).find(todo.id)).toEqual(todo.
      expect(new TodoRepository(connection).find(todo.id)).toEqual(todo);
      // Run cleanup whether the operation succeeds or fails.
    } finally {
      // Close this SQLite connection and release its file handles.
      connection?.close();
      // This exact temporary directory was created above and never contains user data.
      // Remove only the temporary directory created by this persistence test.
      rmSync(directory, { recursive: true, force: true });
      // Close the current block or object.
    }
    // Close the current block or object.
  });
  // Close the current block or object.
});
