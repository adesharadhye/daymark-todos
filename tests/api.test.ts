// Exercise the HTTP contract against an isolated database, including invalid requests.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { DatabaseSync } from 'node:sqlite';
// Import compile-time types from express.
import type { Express } from 'express';
import { createApp } from '../server/app.js';
import { createDatabase } from '../server/db.js';

// Group tests for describe('todo HTTP API', () .
describe('todo HTTP API', () => {
  let db: DatabaseSync;
  let app: Express;

  // Prepare fresh test state before each case.
  beforeEach(() => {
    db = createDatabase();
    app = createApp(db);
  });

  // Clean up resources after each test case.
  afterEach(() => db.close());

  it('starts with an empty collection and exposes a health check', async () => {
    await request(app).get('/api/health').expect(200);
    // Calculate or store response.
    const response = await request(app).get('/api/todos').expect(200);
    expect(response.body).toEqual({ todos: [] });
  });

  // Define the test case: it('creates, reads, edits, and deletes a persisted todo', async () .
  it('creates, reads, edits, and deletes a persisted todo', async () => {
    const created = await request(app)
      .post('/api/todos')
      // Call .send with the values shown here.
      .send({ title: '  Plan the week  ' })
      .expect(201);
    const todo = created.body.todo;
    // Assert the observed result for todo).toMatchObject({.
    expect(todo).toMatchObject({
      title: 'Plan the week',
      description: '',
      // Specify whether the task is finished.
      completed: false,
      priority: 'medium',
      project: 'personal',
      // Specify the optional calendar due date.
      dueDate: null,
      completedAt: null,
    });
    // Assert the observed result for todo.id).toMatch(/^[0-9a-f-]{36}$/i.
    expect(todo.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(Number.isNaN(Date.parse(todo.createdAt))).toBe(false);
    expect(todo.updatedAt).toBe(todo.createdAt);

    // Calculate or store found.
    const found = await request(app).get(`/api/todos/${todo.id}`).expect(200);
    expect(found.body).toEqual(created.body);

    const updated = await request(app)
      // Call .patch with the values shown here.
      .patch(`/api/todos/${todo.id}`)
      .send({
        title: 'Plan the launch',
        // Specify the task notes.
        description: 'Write a short checklist',
        priority: 'high',
        project: 'work',
        // Specify the optional calendar due date.
        dueDate: '2028-02-29',
      })
      .expect(200);
    // Assert the observed result for updated.body.todo).toMatchObject({.
    expect(updated.body.todo).toMatchObject({
      id: todo.id,
      title: 'Plan the launch',
      // Specify the task notes.
      description: 'Write a short checklist',
      priority: 'high',
      project: 'work',
      // Specify the optional calendar due date.
      dueDate: '2028-02-29',
      createdAt: todo.createdAt,
    });
    // Calculate or store reread.
    const reread = await request(app).get(`/api/todos/${todo.id}`).expect(200);
    expect(reread.body).toEqual(updated.body);

    await request(app).delete(`/api/todos/${todo.id}`).expect(204);
    // Wait for request(app).get(`/api/todos/${todo.id}`).expect(404) to finish.
    await request(app).get(`/api/todos/${todo.id}`).expect(404);
    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.todos).toEqual([]);
  });

  // Define the test case: it('records completion, preserves it for unrelated edits, and clears it on reopening', async () .
  it('records completion, preserves it for unrelated edits, and clears it on reopening', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Ship it' }).expect(201);
    const url = `/api/todos/${created.body.todo.id}`;
    // Calculate or store whether the task is finished.
    const completed = await request(app).patch(url).send({ completed: true }).expect(200);
    expect(completed.body.todo.completed).toBe(true);
    expect(Number.isNaN(Date.parse(completed.body.todo.completedAt))).toBe(false);
    // Calculate or store edited.
    const edited = await request(app)
      .patch(url)
      .send({ description: 'Released today' })
      // Call .expect with the values shown here.
      .expect(200);
    expect(edited.body.todo.completedAt).toBe(completed.body.todo.completedAt);
    const reopened = await request(app).patch(url).send({ completed: false }).expect(200);
    // Assert the observed result for reopened.body.todo).toMatchObject({ completed: false, completedAt: null }.
    expect(reopened.body.todo).toMatchObject({ completed: false, completedAt: null });
  });

  it('can explicitly clear a due date without clearing other fields', async () => {
    // Calculate or store created.
    const created = await request(app)
      .post('/api/todos')
      .send({
        // Specify the task title.
        title: 'Flexible task',
        dueDate: '2027-06-15',
        description: 'Keep this description',
      })
      // Call .expect with the values shown here.
      .expect(201);
    const response = await request(app)
      .patch(`/api/todos/${created.body.todo.id}`)
      // Call .send with the values shown here.
      .send({ dueDate: null })
      .expect(200);
    expect(response.body.todo).toMatchObject({
      // Specify the optional calendar due date.
      dueDate: null,
      description: 'Keep this description',
    });
  });

  // Call it.each with the values shown here.
  it.each([
    {},
    { title: '' },
    // Test a title that becomes empty after trimming its spaces.
    { title: '   ' },
    { title: 17 },
    { title: 'x'.repeat(201) },
    // Test notes that exceed the 5,000-character limit.
    { title: 'Task', description: 'x'.repeat(5001) },
    { title: 'Task', description: null },
    { title: 'Task', priority: 'urgent' },
    // Test an unsupported project value.
    { title: 'Task', project: 'unknown' },
    { title: 'Task', dueDate: '2027-02-29' },
    { title: 'Task', dueDate: '2026-04-31' },
    // Test a date that does not use the required two-digit month.
    { title: 'Task', dueDate: '2026-1-01' },
    { title: 'Task', dueDate: '2026-01-01T12:00:00Z' },
    { title: 'Task', completed: true },
    // Test rejection of a client-supplied ID; the server generates UUIDs.
    { title: 'Task', id: 'client-owned-id' },
  ])('rejects invalid creation input without changing the collection: %j', async (input) => {
    const response = await request(app).post('/api/todos').send(input).expect(400);
    // Assert the observed result for response.body.error.message).toEqual(expect.any(String).
    expect(response.body.error.message).toEqual(expect.any(String));
    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.todos).toHaveLength(0);
  });

  // Call it.each with the values shown here.
  it.each([
    {},
    { completed: 'true' },
    // Test rejection of a null title.
    { title: null },
    { createdAt: '2026-01-01' },
    { typo: 'value' },
    // Run this named test once for every input in the table above.
  ])('rejects invalid patches without partially updating a todo: %j', async (patch) => {
    const created = await request(app).post('/api/todos').send({ title: 'Original' }).expect(201);
    const url = `/api/todos/${created.body.todo.id}`;
    // Wait for request(app).patch(url).send(patch).expect(400) to finish.
    await request(app).patch(url).send(patch).expect(400);
    const found = await request(app).get(url).expect(200);
    expect(found.body).toEqual(created.body);
  });

  // Define the test case: it('rejects malformed JSON with the documented error shape', async () .
  it('rejects malformed JSON with the documented error shape', async () => {
    const response = await request(app)
      .post('/api/todos')
      // Call .set with the values shown here.
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400);
    // Assert the observed result for response.body.error.message).toEqual(expect.any(String).
    expect(response.body.error.message).toEqual(expect.any(String));
  });

  it('rejects unsupported media types and oversized JSON bodies', async () => {
    // Calculate or store unsupported.
    const unsupported = await request(app)
      .post('/api/todos')
      .type('form')
      // Call .send with the values shown here.
      .send({ title: 'Task' })
      .expect(415);
    expect(unsupported.body.error.message).toEqual(expect.any(String));
    // Calculate or store oversized.
    const oversized = await request(app)
      .post('/api/todos')
      .send({ title: 'Task', description: 'x'.repeat(40_000) })
      // Call .expect with the values shown here.
      .expect(413);
    expect(oversized.body.error.message).toEqual(expect.any(String));
  });

  // Define the test case: it('returns JSON for unknown API routes', async () .
  it('returns JSON for unknown API routes', async () => {
    const response = await request(app).get('/api/does-not-exist').expect(404);
    expect(response.body.error.message).toEqual(expect.any(String));
  });

  // Define the test case: it('distinguishes malformed ids from missing todos', async () .
  it('distinguishes malformed ids from missing todos', async () => {
    await request(app).get('/api/todos/not-a-uuid').expect(400);
    const missing = '/api/todos/00000000-0000-4000-8000-000000000000';
    // Wait for request(app).get(missing).expect(404) to finish.
    await request(app).get(missing).expect(404);
    await request(app).patch(missing).send({ title: 'Missing' }).expect(404);
    await request(app).delete(missing).expect(404);
  });

  // Define the test case: it('combines text, completion, project, and priority filters', async () .
  it('combines text, completion, project, and priority filters', async () => {
    await request(app)
      .post('/api/todos')
      // Call .send with the values shown here.
      .send({
        title: 'Write report',
        description: 'Quarterly review',
        // Specify the task category.
        project: 'work',
        priority: 'high',
      })
      // Call .expect with the values shown here.
      .expect(201);
    await request(app)
      .post('/api/todos')
      // Call .send with the values shown here.
      .send({ title: 'Read report', project: 'learning', priority: 'low' })
      .expect(201);
    const done = await request(app)
      // Call .post with the values shown here.
      .post('/api/todos')
      .send({ title: 'Old report', project: 'work', priority: 'high' })
      .expect(201);
    // Wait for request(app) to finish.
    await request(app)
      .patch(`/api/todos/${done.body.todo.id}`)
      .send({ completed: true })
      // Call .expect with the values shown here.
      .expect(200);
    const filtered = await request(app)
      .get('/api/todos')
      // Call .query with the values shown here.
      .query({ q: 'REPORT', project: 'work', priority: 'high', completed: 'false' })
      .expect(200);
    expect(filtered.body.todos.map((todo: { title: string }) => todo.title)).toEqual([
      // Supply the literal value 'Write report'.
      'Write report',
    ]);
    const descriptionMatch = await request(app)
      // Call .get with the values shown here.
      .get('/api/todos')
      .query({ q: 'quarterly' })
      .expect(200);
    // Assert the observed result for descriptionMatch.body.todos.map((todo: { title: string }) => todo.title)).toEqual([.
    expect(descriptionMatch.body.todos.map((todo: { title: string }) => todo.title)).toEqual([
      'Write report',
    ]);
  });

  // Call it.each with the values shown here.
  it.each([
    'completed=maybe',
    'priority=urgent',
    // Supply the literal value 'project=missing'.
    'project=missing',
    'sort=random',
    'unknown=value',
    // Run this named test once for every input in the table above.
  ])('rejects invalid query parameters: %s', async (query) => {
    const response = await request(app).get(`/api/todos?${query}`).expect(400);
    expect(response.body.error.message).toEqual(expect.any(String));
  });

  // Define the test case: it('stores SQL-like text as data and leaves the collection usable', async () .
  it('stores SQL-like text as data and leaves the collection usable', async () => {
    const title = "Robert'); DROP TABLE todos;--";
    const created = await request(app).post('/api/todos').send({ title }).expect(201);
    // Calculate or store found.
    const found = await request(app).get(`/api/todos/${created.body.todo.id}`).expect(200);
    expect(found.body.todo.title).toBe(title);
    await request(app).post('/api/todos').send({ title: 'Still working' }).expect(201);
    // Calculate or store list.
    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.todos).toHaveLength(2);
  });

  // Define the test case: it('keeps independently constructed databases isolated', async () .
  it('keeps independently constructed databases isolated', async () => {
    await request(app).post('/api/todos').send({ title: 'Private to this database' }).expect(201);
    const separate = createDatabase();
    // Attempt the operation so failures can be handled below.
    try {
      const response = await request(createApp(separate)).get('/api/todos').expect(200);
      expect(response.body.todos).toEqual([]);
      // Run cleanup whether the operation succeeds or fails.
    } finally {
      separate.close();
    }
  });
});
