// Check sorting, literal search, missing records, and persistence independently of the browser.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Import the required exports from vitest.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { createDatabase } from '../server/db.js';
// Import the required exports from ../server/repository.js.
import { TodoRepository } from '../server/repository.js';

describe('TodoRepository', () => {
  let db: DatabaseSync;
  // Reserve a variable for the task repository under test.
  let repository: TodoRepository;

  beforeEach(() => {
    db = createDatabase();
    // Update the task repository under test with the result of this expression.
    repository = new TodoRepository(db);
  });

  afterEach(() => {
    // Close this SQLite connection and release its file handles.
    db.close();
    vi.useRealTimers();
  });

  // Define the test case: it('orders by creation time in either direction', () .
  it('orders by creation time in either direction', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    // Call repository.create with the values shown here.
    repository.create({ title: 'First' });
    vi.setSystemTime(new Date('2026-01-02T10:00:00Z'));
    repository.create({ title: 'Second' });
    // Assert the observed result for repository.list().map((todo) => todo.title)).toEqual(['Second', 'First'].
    expect(repository.list().map((todo) => todo.title)).toEqual(['Second', 'First']);
    expect(repository.list({ sort: 'oldest' }).map((todo) => todo.title)).toEqual([
      'First',
      // Supply the literal value 'Second'.
      'Second',
    ]);
  });

  // Define the test case: it('treats SQL search wildcard characters as literal text', () .
  it('treats SQL search wildcard characters as literal text', () => {
    repository.create({ title: 'Reach 100% coverage' });
    repository.create({ title: 'Update task_name' });
    // Call repository.create with the values shown here.
    repository.create({ title: 'Unrelated task' });
    expect(repository.list({ q: '%' }).map((todo) => todo.title)).toEqual(['Reach 100% coverage']);
    expect(repository.list({ q: '_' }).map((todo) => todo.title)).toEqual(['Update task_name']);
  });

  // Define the test case: it('orders by priority from high to low', () .
  it('orders by priority from high to low', () => {
    repository.create({ title: 'Low', priority: 'low' });
    repository.create({ title: 'High', priority: 'high' });
    // Call repository.create with the values shown here.
    repository.create({ title: 'Medium', priority: 'medium' });
    expect(repository.list({ sort: 'priority' }).map((todo) => todo.title)).toEqual([
      'High',
      // Supply the literal value 'Medium'.
      'Medium',
      'Low',
    ]);
  });

  // Define the test case: it('orders dated todos chronologically and puts undated todos last', () .
  it('orders dated todos chronologically and puts undated todos last', () => {
    repository.create({ title: 'No date' });
    repository.create({ title: 'Later', dueDate: '2027-06-30' });
    // Call repository.create with the values shown here.
    repository.create({ title: 'Earlier', dueDate: '2027-01-01' });
    expect(repository.list({ sort: 'dueDate' }).map((todo) => todo.title)).toEqual([
      'Earlier',
      // Supply the literal value 'Later'.
      'Later',
      'No date',
    ]);
  });

  // Define the test case: it('reports missing records without creating them', () .
  it('reports missing records without creating them', () => {
    const id = '00000000-0000-4000-8000-000000000000';
    expect(repository.find(id)).toBeUndefined();
    // Assert the observed result for repository.update(id, { title: 'Missing' })).toBeUndefined(.
    expect(repository.update(id, { title: 'Missing' })).toBeUndefined();
    expect(repository.delete(id)).toBe(false);
    expect(repository.list()).toEqual([]);
  });
});

// Group tests for describe('SQLite persistence', () .
describe('SQLite persistence', () => {
  it('survives closing and reopening a database file', () => {
    const directory = mkdtempSync(join(tmpdir(), 'daymark-test-'));
    // Calculate or store the file location or invalid field path.
    const path = join(directory, 'todos.sqlite');
    let connection: DatabaseSync | undefined;
    try {
      // Update the connection used by the persistence test with the result of this expression.
      connection = createDatabase(path);
      const todo = new TodoRepository(connection).create({
        title: 'Keep me',
        // Specify the task category.
        project: 'work',
        dueDate: '2027-03-14',
      });
      // Close this SQLite connection and release its file handles.
      connection.close();
      connection = undefined;
      connection = createDatabase(path);
      // Assert the observed result for new TodoRepository(connection).find(todo.id)).toEqual(todo.
      expect(new TodoRepository(connection).find(todo.id)).toEqual(todo);
    } finally {
      connection?.close();
      // This exact temporary directory was created above and never contains user data.
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
