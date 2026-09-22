import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { createDatabase } from '../server/db.js';
import { TodoRepository } from '../server/repository.js';

describe('TodoRepository', () => {
  let db: DatabaseSync;
  let repository: TodoRepository;

  beforeEach(() => {
    db = createDatabase();
    repository = new TodoRepository(db);
  });

  afterEach(() => {
    db.close();
    vi.useRealTimers();
  });

  it('orders by creation time in either direction', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T10:00:00Z'));
    repository.create({ title: 'First' });
    vi.setSystemTime(new Date('2026-01-02T10:00:00Z'));
    repository.create({ title: 'Second' });
    expect(repository.list().map((todo) => todo.title)).toEqual(['Second', 'First']);
    expect(repository.list({ sort: 'oldest' }).map((todo) => todo.title)).toEqual([
      'First',
      'Second',
    ]);
  });

  it('treats SQL search wildcard characters as literal text', () => {
    repository.create({ title: 'Reach 100% coverage' });
    repository.create({ title: 'Update task_name' });
    repository.create({ title: 'Unrelated task' });
    expect(repository.list({ q: '%' }).map((todo) => todo.title)).toEqual(['Reach 100% coverage']);
    expect(repository.list({ q: '_' }).map((todo) => todo.title)).toEqual(['Update task_name']);
  });

  it('orders by priority from high to low', () => {
    repository.create({ title: 'Low', priority: 'low' });
    repository.create({ title: 'High', priority: 'high' });
    repository.create({ title: 'Medium', priority: 'medium' });
    expect(repository.list({ sort: 'priority' }).map((todo) => todo.title)).toEqual([
      'High',
      'Medium',
      'Low',
    ]);
  });

  it('orders dated todos chronologically and puts undated todos last', () => {
    repository.create({ title: 'No date' });
    repository.create({ title: 'Later', dueDate: '2027-06-30' });
    repository.create({ title: 'Earlier', dueDate: '2027-01-01' });
    expect(repository.list({ sort: 'dueDate' }).map((todo) => todo.title)).toEqual([
      'Earlier',
      'Later',
      'No date',
    ]);
  });

  it('reports missing records without creating them', () => {
    const id = '00000000-0000-4000-8000-000000000000';
    expect(repository.find(id)).toBeUndefined();
    expect(repository.update(id, { title: 'Missing' })).toBeUndefined();
    expect(repository.delete(id)).toBe(false);
    expect(repository.list()).toEqual([]);
  });
});

describe('SQLite persistence', () => {
  it('survives closing and reopening a database file', () => {
    const directory = mkdtempSync(join(tmpdir(), 'daymark-test-'));
    const path = join(directory, 'todos.sqlite');
    let connection: DatabaseSync | undefined;
    try {
      connection = createDatabase(path);
      const todo = new TodoRepository(connection).create({
        title: 'Keep me',
        project: 'work',
        dueDate: '2027-03-14',
      });
      connection.close();
      connection = undefined;
      connection = createDatabase(path);
      expect(new TodoRepository(connection).find(todo.id)).toEqual(todo);
    } finally {
      connection?.close();
      // This exact temporary directory was created above and never contains user data.
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
