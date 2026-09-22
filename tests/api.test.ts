import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { DatabaseSync } from 'node:sqlite';
import type { Express } from 'express';
import { createApp } from '../server/app.js';
import { createDatabase } from '../server/db.js';

describe('todo HTTP API', () => {
  let db: DatabaseSync;
  let app: Express;

  beforeEach(() => {
    db = createDatabase();
    app = createApp(db);
  });

  afterEach(() => db.close());

  it('starts with an empty collection and exposes a health check', async () => {
    await request(app).get('/api/health').expect(200);
    const response = await request(app).get('/api/todos').expect(200);
    expect(response.body).toEqual({ todos: [] });
  });

  it('creates, reads, edits, and deletes a persisted todo', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: '  Plan the week  ' })
      .expect(201);
    const todo = created.body.todo;
    expect(todo).toMatchObject({
      title: 'Plan the week',
      description: '',
      completed: false,
      priority: 'medium',
      project: 'personal',
      dueDate: null,
      completedAt: null,
    });
    expect(todo.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(Number.isNaN(Date.parse(todo.createdAt))).toBe(false);
    expect(todo.updatedAt).toBe(todo.createdAt);

    const found = await request(app).get(`/api/todos/${todo.id}`).expect(200);
    expect(found.body).toEqual(created.body);

    const updated = await request(app)
      .patch(`/api/todos/${todo.id}`)
      .send({
        title: 'Plan the launch',
        description: 'Write a short checklist',
        priority: 'high',
        project: 'work',
        dueDate: '2028-02-29',
      })
      .expect(200);
    expect(updated.body.todo).toMatchObject({
      id: todo.id,
      title: 'Plan the launch',
      description: 'Write a short checklist',
      priority: 'high',
      project: 'work',
      dueDate: '2028-02-29',
      createdAt: todo.createdAt,
    });
    const reread = await request(app).get(`/api/todos/${todo.id}`).expect(200);
    expect(reread.body).toEqual(updated.body);

    await request(app).delete(`/api/todos/${todo.id}`).expect(204);
    await request(app).get(`/api/todos/${todo.id}`).expect(404);
    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.todos).toEqual([]);
  });

  it('records completion, preserves it for unrelated edits, and clears it on reopening', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Ship it' }).expect(201);
    const url = `/api/todos/${created.body.todo.id}`;
    const completed = await request(app).patch(url).send({ completed: true }).expect(200);
    expect(completed.body.todo.completed).toBe(true);
    expect(Number.isNaN(Date.parse(completed.body.todo.completedAt))).toBe(false);
    const edited = await request(app)
      .patch(url)
      .send({ description: 'Released today' })
      .expect(200);
    expect(edited.body.todo.completedAt).toBe(completed.body.todo.completedAt);
    const reopened = await request(app).patch(url).send({ completed: false }).expect(200);
    expect(reopened.body.todo).toMatchObject({ completed: false, completedAt: null });
  });

  it('can explicitly clear a due date without clearing other fields', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({
        title: 'Flexible task',
        dueDate: '2027-06-15',
        description: 'Keep this description',
      })
      .expect(201);
    const response = await request(app)
      .patch(`/api/todos/${created.body.todo.id}`)
      .send({ dueDate: null })
      .expect(200);
    expect(response.body.todo).toMatchObject({
      dueDate: null,
      description: 'Keep this description',
    });
  });

  it.each([
    {},
    { title: '' },
    { title: '   ' },
    { title: 17 },
    { title: 'x'.repeat(201) },
    { title: 'Task', description: 'x'.repeat(5001) },
    { title: 'Task', description: null },
    { title: 'Task', priority: 'urgent' },
    { title: 'Task', project: 'unknown' },
    { title: 'Task', dueDate: '2027-02-29' },
    { title: 'Task', dueDate: '2026-04-31' },
    { title: 'Task', dueDate: '2026-1-01' },
    { title: 'Task', dueDate: '2026-01-01T12:00:00Z' },
    { title: 'Task', completed: true },
    { title: 'Task', id: 'client-owned-id' },
  ])('rejects invalid creation input without changing the collection: %j', async (input) => {
    const response = await request(app).post('/api/todos').send(input).expect(400);
    expect(response.body.error.message).toEqual(expect.any(String));
    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.todos).toHaveLength(0);
  });

  it.each([
    {},
    { completed: 'true' },
    { title: null },
    { createdAt: '2026-01-01' },
    { typo: 'value' },
  ])('rejects invalid patches without partially updating a todo: %j', async (patch) => {
    const created = await request(app).post('/api/todos').send({ title: 'Original' }).expect(201);
    const url = `/api/todos/${created.body.todo.id}`;
    await request(app).patch(url).send(patch).expect(400);
    const found = await request(app).get(url).expect(200);
    expect(found.body).toEqual(created.body);
  });

  it('rejects malformed JSON with the documented error shape', async () => {
    const response = await request(app)
      .post('/api/todos')
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400);
    expect(response.body.error.message).toEqual(expect.any(String));
  });

  it('rejects unsupported media types and oversized JSON bodies', async () => {
    const unsupported = await request(app)
      .post('/api/todos')
      .type('form')
      .send({ title: 'Task' })
      .expect(415);
    expect(unsupported.body.error.message).toEqual(expect.any(String));
    const oversized = await request(app)
      .post('/api/todos')
      .send({ title: 'Task', description: 'x'.repeat(40_000) })
      .expect(413);
    expect(oversized.body.error.message).toEqual(expect.any(String));
  });

  it('returns JSON for unknown API routes', async () => {
    const response = await request(app).get('/api/does-not-exist').expect(404);
    expect(response.body.error.message).toEqual(expect.any(String));
  });

  it('distinguishes malformed ids from missing todos', async () => {
    await request(app).get('/api/todos/not-a-uuid').expect(400);
    const missing = '/api/todos/00000000-0000-4000-8000-000000000000';
    await request(app).get(missing).expect(404);
    await request(app).patch(missing).send({ title: 'Missing' }).expect(404);
    await request(app).delete(missing).expect(404);
  });

  it('combines text, completion, project, and priority filters', async () => {
    await request(app)
      .post('/api/todos')
      .send({
        title: 'Write report',
        description: 'Quarterly review',
        project: 'work',
        priority: 'high',
      })
      .expect(201);
    await request(app)
      .post('/api/todos')
      .send({ title: 'Read report', project: 'learning', priority: 'low' })
      .expect(201);
    const done = await request(app)
      .post('/api/todos')
      .send({ title: 'Old report', project: 'work', priority: 'high' })
      .expect(201);
    await request(app)
      .patch(`/api/todos/${done.body.todo.id}`)
      .send({ completed: true })
      .expect(200);
    const filtered = await request(app)
      .get('/api/todos')
      .query({ q: 'REPORT', project: 'work', priority: 'high', completed: 'false' })
      .expect(200);
    expect(filtered.body.todos.map((todo: { title: string }) => todo.title)).toEqual([
      'Write report',
    ]);
    const descriptionMatch = await request(app)
      .get('/api/todos')
      .query({ q: 'quarterly' })
      .expect(200);
    expect(descriptionMatch.body.todos.map((todo: { title: string }) => todo.title)).toEqual([
      'Write report',
    ]);
  });

  it.each([
    'completed=maybe',
    'priority=urgent',
    'project=missing',
    'sort=random',
    'unknown=value',
  ])('rejects invalid query parameters: %s', async (query) => {
    const response = await request(app).get(`/api/todos?${query}`).expect(400);
    expect(response.body.error.message).toEqual(expect.any(String));
  });

  it('stores SQL-like text as data and leaves the collection usable', async () => {
    const title = "Robert'); DROP TABLE todos;--";
    const created = await request(app).post('/api/todos').send({ title }).expect(201);
    const found = await request(app).get(`/api/todos/${created.body.todo.id}`).expect(200);
    expect(found.body.todo.title).toBe(title);
    await request(app).post('/api/todos').send({ title: 'Still working' }).expect(201);
    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.todos).toHaveLength(2);
  });

  it('keeps independently constructed databases isolated', async () => {
    await request(app).post('/api/todos').send({ title: 'Private to this database' }).expect(201);
    const separate = createDatabase();
    try {
      const response = await request(createApp(separate)).get('/api/todos').expect(200);
      expect(response.body.todos).toEqual([]);
    } finally {
      separate.close();
    }
  });
});
