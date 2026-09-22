// Exercise the HTTP contract against an isolated database, including invalid requests.
// Import the required exports from vitest.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// Import the required exports from supertest.
import request from 'supertest';
// Import compile-time types from node:sqlite.
import type { DatabaseSync } from 'node:sqlite';
// Import compile-time types from express.
import type { Express } from 'express';
// Import the required exports from ../server/app.js.
import { createApp } from '../server/app.js';
// Import the required exports from ../server/db.js.
import { createDatabase } from '../server/db.js';

// Group tests for describe('todo HTTP API', () .
describe('todo HTTP API', () => {
  // Reserve a variable for the isolated test database.
  let db: DatabaseSync;
  // Reserve a variable for the Express application.
  let app: Express;

  // Prepare fresh test state before each case.
  beforeEach(() => {
    // Update the isolated test database with the result of this expression.
    db = createDatabase();
    // Update the Express application with the result of this expression.
    app = createApp(db);
    // Close the current block or object.
  });

  // Clean up resources after each test case.
  afterEach(() => db.close());

  // Define the test case: it('starts with an empty collection and exposes a health check', async () .
  it('starts with an empty collection and exposes a health check', async () => {
    // Wait for request(app).get('/api/health').expect(200) to finish.
    await request(app).get('/api/health').expect(200);
    // Calculate or store response.
    const response = await request(app).get('/api/todos').expect(200);
    // Assert the observed result for response.body).toEqual({ todos: [] }.
    expect(response.body).toEqual({ todos: [] });
    // Close the current block or object.
  });

  // Define the test case: it('creates, reads, edits, and deletes a persisted todo', async () .
  it('creates, reads, edits, and deletes a persisted todo', async () => {
    // Calculate or store created.
    const created = await request(app)
      // Call .post with the values shown here.
      .post('/api/todos')
      // Call .send with the values shown here.
      .send({ title: '  Plan the week  ' })
      // Call .expect with the values shown here.
      .expect(201);
    // Calculate or store the current task object.
    const todo = created.body.todo;
    // Assert the observed result for todo).toMatchObject({.
    expect(todo).toMatchObject({
      // Specify the task title.
      title: 'Plan the week',
      // Specify the task notes.
      description: '',
      // Specify whether the task is finished.
      completed: false,
      // Specify the task urgency.
      priority: 'medium',
      // Specify the task category.
      project: 'personal',
      // Specify the optional calendar due date.
      dueDate: null,
      // Specify the completion timestamp, or null while open.
      completedAt: null,
      // Close the current block or object.
    });
    // Assert the observed result for todo.id).toMatch(/^[0-9a-f-]{36}$/i.
    expect(todo.id).toMatch(/^[0-9a-f-]{36}$/i);
    // Assert the observed result for Number.isNaN(Date.parse(todo.createdAt))).toBe(false.
    expect(Number.isNaN(Date.parse(todo.createdAt))).toBe(false);
    // Assert the observed result for todo.updatedAt).toBe(todo.createdAt.
    expect(todo.updatedAt).toBe(todo.createdAt);

    // Calculate or store found.
    const found = await request(app).get(`/api/todos/${todo.id}`).expect(200);
    // Assert the observed result for found.body).toEqual(created.body.
    expect(found.body).toEqual(created.body);

    // Calculate or store updated.
    const updated = await request(app)
      // Call .patch with the values shown here.
      .patch(`/api/todos/${todo.id}`)
      // Call .send with the values shown here.
      .send({
        // Specify the task title.
        title: 'Plan the launch',
        // Specify the task notes.
        description: 'Write a short checklist',
        // Specify the task urgency.
        priority: 'high',
        // Specify the task category.
        project: 'work',
        // Specify the optional calendar due date.
        dueDate: '2028-02-29',
        // Close the current block or object.
      })
      // Call .expect with the values shown here.
      .expect(200);
    // Assert the observed result for updated.body.todo).toMatchObject({.
    expect(updated.body.todo).toMatchObject({
      // Specify the unique task identifier.
      id: todo.id,
      // Specify the task title.
      title: 'Plan the launch',
      // Specify the task notes.
      description: 'Write a short checklist',
      // Specify the task urgency.
      priority: 'high',
      // Specify the task category.
      project: 'work',
      // Specify the optional calendar due date.
      dueDate: '2028-02-29',
      // Specify the creation timestamp.
      createdAt: todo.createdAt,
      // Close the current block or object.
    });
    // Calculate or store reread.
    const reread = await request(app).get(`/api/todos/${todo.id}`).expect(200);
    // Assert the observed result for reread.body).toEqual(updated.body.
    expect(reread.body).toEqual(updated.body);

    // Wait for request(app).delete(`/api/todos/${todo.id}`).expect(204) to finish.
    await request(app).delete(`/api/todos/${todo.id}`).expect(204);
    // Wait for request(app).get(`/api/todos/${todo.id}`).expect(404) to finish.
    await request(app).get(`/api/todos/${todo.id}`).expect(404);
    // Calculate or store list.
    const list = await request(app).get('/api/todos').expect(200);
    // Assert the observed result for list.body.todos).toEqual([].
    expect(list.body.todos).toEqual([]);
    // Close the current block or object.
  });

  // Define the test case: it('records completion, preserves it for unrelated edits, and clears it on reopening', async () .
  it('records completion, preserves it for unrelated edits, and clears it on reopening', async () => {
    // Calculate or store created.
    const created = await request(app).post('/api/todos').send({ title: 'Ship it' }).expect(201);
    // Calculate or store the requested URL.
    const url = `/api/todos/${created.body.todo.id}`;
    // Calculate or store whether the task is finished.
    const completed = await request(app).patch(url).send({ completed: true }).expect(200);
    // Assert the observed result for completed.body.todo.completed).toBe(true.
    expect(completed.body.todo.completed).toBe(true);
    // Assert the observed result for Number.isNaN(Date.parse(completed.body.todo.completedAt))).toBe(false.
    expect(Number.isNaN(Date.parse(completed.body.todo.completedAt))).toBe(false);
    // Calculate or store edited.
    const edited = await request(app)
      // Call .patch with the values shown here.
      .patch(url)
      // Call .send with the values shown here.
      .send({ description: 'Released today' })
      // Call .expect with the values shown here.
      .expect(200);
    // Assert the observed result for edited.body.todo.completedAt).toBe(completed.body.todo.completedAt.
    expect(edited.body.todo.completedAt).toBe(completed.body.todo.completedAt);
    // Calculate or store reopened.
    const reopened = await request(app).patch(url).send({ completed: false }).expect(200);
    // Assert the observed result for reopened.body.todo).toMatchObject({ completed: false, completedAt: null }.
    expect(reopened.body.todo).toMatchObject({ completed: false, completedAt: null });
    // Close the current block or object.
  });

  // Define the test case: it('can explicitly clear a due date without clearing other fields', async () .
  it('can explicitly clear a due date without clearing other fields', async () => {
    // Calculate or store created.
    const created = await request(app)
      // Call .post with the values shown here.
      .post('/api/todos')
      // Call .send with the values shown here.
      .send({
        // Specify the task title.
        title: 'Flexible task',
        // Specify the optional calendar due date.
        dueDate: '2027-06-15',
        // Specify the task notes.
        description: 'Keep this description',
        // Close the current block or object.
      })
      // Call .expect with the values shown here.
      .expect(201);
    // Calculate or store response.
    const response = await request(app)
      // Call .patch with the values shown here.
      .patch(`/api/todos/${created.body.todo.id}`)
      // Call .send with the values shown here.
      .send({ dueDate: null })
      // Call .expect with the values shown here.
      .expect(200);
    // Assert the observed result for response.body.todo).toMatchObject({.
    expect(response.body.todo).toMatchObject({
      // Specify the optional calendar due date.
      dueDate: null,
      // Specify the task notes.
      description: 'Keep this description',
      // Close the current block or object.
    });
    // Close the current block or object.
  });

  // Call it.each with the values shown here.
  it.each([
    // Test an empty input object, which is missing required creation fields or update changes.
    {},
    // Test a title with no characters.
    { title: '' },
    // Test a title that becomes empty after trimming its spaces.
    { title: '   ' },
    // Test rejection of a numeric title instead of a string.
    { title: 17 },
    // Test a title that exceeds the 200-character limit.
    { title: 'x'.repeat(201) },
    // Test notes that exceed the 5,000-character limit.
    { title: 'Task', description: 'x'.repeat(5001) },
    // Test rejection of null notes; clearing notes requires an empty string.
    { title: 'Task', description: null },
    // Test an unsupported priority value.
    { title: 'Task', priority: 'urgent' },
    // Test an unsupported project value.
    { title: 'Task', project: 'unknown' },
    // Test February 29 in a non-leap year.
    { title: 'Task', dueDate: '2027-02-29' },
    // Test a date in a month that has only 30 days.
    { title: 'Task', dueDate: '2026-04-31' },
    // Test a date that does not use the required two-digit month.
    { title: 'Task', dueDate: '2026-1-01' },
    // Test rejection of a timestamp where only a calendar date is allowed.
    { title: 'Task', dueDate: '2026-01-01T12:00:00Z' },
    // Test rejection of a client-supplied completion flag during creation.
    { title: 'Task', completed: true },
    // Test rejection of a client-supplied ID; the server generates UUIDs.
    { title: 'Task', id: 'client-owned-id' },
    // Run this named test once for every input in the table above.
  ])('rejects invalid creation input without changing the collection: %j', async (input) => {
    // Calculate or store response.
    const response = await request(app).post('/api/todos').send(input).expect(400);
    // Assert the observed result for response.body.error.message).toEqual(expect.any(String).
    expect(response.body.error.message).toEqual(expect.any(String));
    // Calculate or store list.
    const list = await request(app).get('/api/todos').expect(200);
    // Assert the observed result for list.body.todos).toHaveLength(0.
    expect(list.body.todos).toHaveLength(0);
    // Close the current block or object.
  });

  // Call it.each with the values shown here.
  it.each([
    // Test an empty input object, which is missing required creation fields or update changes.
    {},
    // Test a string in place of a real boolean completion flag.
    { completed: 'true' },
    // Test rejection of a null title.
    { title: null },
    // Test rejection of a client change to server-managed metadata.
    { createdAt: '2026-01-01' },
    // Test rejection of an unrecognized field.
    { typo: 'value' },
    // Run this named test once for every input in the table above.
  ])('rejects invalid patches without partially updating a todo: %j', async (patch) => {
    // Calculate or store created.
    const created = await request(app).post('/api/todos').send({ title: 'Original' }).expect(201);
    // Calculate or store the requested URL.
    const url = `/api/todos/${created.body.todo.id}`;
    // Wait for request(app).patch(url).send(patch).expect(400) to finish.
    await request(app).patch(url).send(patch).expect(400);
    // Calculate or store found.
    const found = await request(app).get(url).expect(200);
    // Assert the observed result for found.body).toEqual(created.body.
    expect(found.body).toEqual(created.body);
    // Close the current block or object.
  });

  // Define the test case: it('rejects malformed JSON with the documented error shape', async () .
  it('rejects malformed JSON with the documented error shape', async () => {
    // Calculate or store response.
    const response = await request(app)
      // Call .post with the values shown here.
      .post('/api/todos')
      // Call .set with the values shown here.
      .set('Content-Type', 'application/json')
      // Call .send with the values shown here.
      .send('{')
      // Call .expect with the values shown here.
      .expect(400);
    // Assert the observed result for response.body.error.message).toEqual(expect.any(String).
    expect(response.body.error.message).toEqual(expect.any(String));
    // Close the current block or object.
  });

  // Define the test case: it('rejects unsupported media types and oversized JSON bodies', async () .
  it('rejects unsupported media types and oversized JSON bodies', async () => {
    // Calculate or store unsupported.
    const unsupported = await request(app)
      // Call .post with the values shown here.
      .post('/api/todos')
      // Call .type with the values shown here.
      .type('form')
      // Call .send with the values shown here.
      .send({ title: 'Task' })
      // Call .expect with the values shown here.
      .expect(415);
    // Assert the observed result for unsupported.body.error.message).toEqual(expect.any(String).
    expect(unsupported.body.error.message).toEqual(expect.any(String));
    // Calculate or store oversized.
    const oversized = await request(app)
      // Call .post with the values shown here.
      .post('/api/todos')
      // Call .send with the values shown here.
      .send({ title: 'Task', description: 'x'.repeat(40_000) })
      // Call .expect with the values shown here.
      .expect(413);
    // Assert the observed result for oversized.body.error.message).toEqual(expect.any(String).
    expect(oversized.body.error.message).toEqual(expect.any(String));
    // Close the current block or object.
  });

  // Define the test case: it('returns JSON for unknown API routes', async () .
  it('returns JSON for unknown API routes', async () => {
    // Calculate or store response.
    const response = await request(app).get('/api/does-not-exist').expect(404);
    // Assert the observed result for response.body.error.message).toEqual(expect.any(String).
    expect(response.body.error.message).toEqual(expect.any(String));
    // Close the current block or object.
  });

  // Define the test case: it('distinguishes malformed ids from missing todos', async () .
  it('distinguishes malformed ids from missing todos', async () => {
    // Wait for request(app).get('/api/todos/not-a-uuid').expect(400) to finish.
    await request(app).get('/api/todos/not-a-uuid').expect(400);
    // Calculate or store missing.
    const missing = '/api/todos/00000000-0000-4000-8000-000000000000';
    // Wait for request(app).get(missing).expect(404) to finish.
    await request(app).get(missing).expect(404);
    // Wait for request(app).patch(missing).send({ title: 'Missing' }).expect(404) to finish.
    await request(app).patch(missing).send({ title: 'Missing' }).expect(404);
    // Wait for request(app).delete(missing).expect(404) to finish.
    await request(app).delete(missing).expect(404);
    // Close the current block or object.
  });

  // Define the test case: it('combines text, completion, project, and priority filters', async () .
  it('combines text, completion, project, and priority filters', async () => {
    // Wait for request(app) to finish.
    await request(app)
      // Call .post with the values shown here.
      .post('/api/todos')
      // Call .send with the values shown here.
      .send({
        // Specify the task title.
        title: 'Write report',
        // Specify the task notes.
        description: 'Quarterly review',
        // Specify the task category.
        project: 'work',
        // Specify the task urgency.
        priority: 'high',
        // Close the current block or object.
      })
      // Call .expect with the values shown here.
      .expect(201);
    // Wait for request(app) to finish.
    await request(app)
      // Call .post with the values shown here.
      .post('/api/todos')
      // Call .send with the values shown here.
      .send({ title: 'Read report', project: 'learning', priority: 'low' })
      // Call .expect with the values shown here.
      .expect(201);
    // Calculate or store done.
    const done = await request(app)
      // Call .post with the values shown here.
      .post('/api/todos')
      // Call .send with the values shown here.
      .send({ title: 'Old report', project: 'work', priority: 'high' })
      // Call .expect with the values shown here.
      .expect(201);
    // Wait for request(app) to finish.
    await request(app)
      // Call .patch with the values shown here.
      .patch(`/api/todos/${done.body.todo.id}`)
      // Call .send with the values shown here.
      .send({ completed: true })
      // Call .expect with the values shown here.
      .expect(200);
    // Calculate or store filtered.
    const filtered = await request(app)
      // Call .get with the values shown here.
      .get('/api/todos')
      // Call .query with the values shown here.
      .query({ q: 'REPORT', project: 'work', priority: 'high', completed: 'false' })
      // Call .expect with the values shown here.
      .expect(200);
    // Assert the observed result for filtered.body.todos.map((todo: { title: string }) => todo.title)).toEqual([.
    expect(filtered.body.todos.map((todo: { title: string }) => todo.title)).toEqual([
      // Supply the literal value 'Write report'.
      'Write report',
      // Finish the array of values.
    ]);
    // Calculate or store description match.
    const descriptionMatch = await request(app)
      // Call .get with the values shown here.
      .get('/api/todos')
      // Call .query with the values shown here.
      .query({ q: 'quarterly' })
      // Call .expect with the values shown here.
      .expect(200);
    // Assert the observed result for descriptionMatch.body.todos.map((todo: { title: string }) => todo.title)).toEqual([.
    expect(descriptionMatch.body.todos.map((todo: { title: string }) => todo.title)).toEqual([
      // Supply the literal value 'Write report'.
      'Write report',
      // Finish the array of values.
    ]);
    // Close the current block or object.
  });

  // Call it.each with the values shown here.
  it.each([
    // Supply the literal value 'completed=maybe'.
    'completed=maybe',
    // Supply the literal value 'priority=urgent'.
    'priority=urgent',
    // Supply the literal value 'project=missing'.
    'project=missing',
    // Supply the literal value 'sort=random'.
    'sort=random',
    // Supply the literal value 'unknown=value'.
    'unknown=value',
    // Run this named test once for every input in the table above.
  ])('rejects invalid query parameters: %s', async (query) => {
    // Calculate or store response.
    const response = await request(app).get(`/api/todos?${query}`).expect(400);
    // Assert the observed result for response.body.error.message).toEqual(expect.any(String).
    expect(response.body.error.message).toEqual(expect.any(String));
    // Close the current block or object.
  });

  // Define the test case: it('stores SQL-like text as data and leaves the collection usable', async () .
  it('stores SQL-like text as data and leaves the collection usable', async () => {
    // Calculate or store the task title.
    const title = "Robert'); DROP TABLE todos;--";
    // Calculate or store created.
    const created = await request(app).post('/api/todos').send({ title }).expect(201);
    // Calculate or store found.
    const found = await request(app).get(`/api/todos/${created.body.todo.id}`).expect(200);
    // Assert the observed result for found.body.todo.title).toBe(title.
    expect(found.body.todo.title).toBe(title);
    // Wait for request(app).post('/api/todos').send({ title: 'Still working' }).expect(201) to finish.
    await request(app).post('/api/todos').send({ title: 'Still working' }).expect(201);
    // Calculate or store list.
    const list = await request(app).get('/api/todos').expect(200);
    // Assert the observed result for list.body.todos).toHaveLength(2.
    expect(list.body.todos).toHaveLength(2);
    // Close the current block or object.
  });

  // Define the test case: it('keeps independently constructed databases isolated', async () .
  it('keeps independently constructed databases isolated', async () => {
    // Wait for request(app).post('/api/todos').send({ title: 'Private to this database' }).expect(201) to finish.
    await request(app).post('/api/todos').send({ title: 'Private to this database' }).expect(201);
    // Calculate or store separate.
    const separate = createDatabase();
    // Attempt the operation so failures can be handled below.
    try {
      // Calculate or store response.
      const response = await request(createApp(separate)).get('/api/todos').expect(200);
      // Assert the observed result for response.body.todos).toEqual([].
      expect(response.body.todos).toEqual([]);
      // Run cleanup whether the operation succeeds or fails.
    } finally {
      // Call separate.close with the values shown here.
      separate.close();
      // Close the current block or object.
    }
    // Close the current block or object.
  });
  // Close the current block or object.
});
