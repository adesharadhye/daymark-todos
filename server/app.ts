import express, { type ErrorRequestHandler } from 'express';
import { join, resolve } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { ZodError } from 'zod';
import { TodoRepository } from './repository.js';
import { createTodoSchema, listTodosSchema, todoIdSchema, updateTodoSchema } from './validation.js';

interface AppOptions {
  clientDirectory?: string;
}

export function createApp(database: DatabaseSync, options: AppOptions = {}) {
  const app = express();
  const todos = new TodoRepository(database);
  app.disable('x-powered-by');

  app.use('/api', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/todos', (request, response, next) => {
    if (['POST', 'PATCH'].includes(request.method) && !request.is('application/json')) {
      response
        .status(415)
        .json({ error: { message: 'Send the request body as application/json.' } });
      return;
    }
    next();
  });
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_request, response) => {
    database.prepare('SELECT 1').get();
    response.json({ status: 'ok' });
  });

  app.get('/api/todos', (request, response) => {
    const filters = listTodosSchema.parse(request.query);
    response.json({ todos: todos.list(filters) });
  });

  app.post('/api/todos', (request, response) => {
    const input = createTodoSchema.parse(request.body);
    const todo = todos.create(input);
    response.location(`/api/todos/${todo.id}`).status(201).json({ todo });
  });

  app.get('/api/todos/:id', (request, response) => {
    const id = todoIdSchema.parse(request.params.id);
    const todo = todos.find(id);
    if (!todo) {
      response.status(404).json({ error: { message: 'This task could not be found.' } });
      return;
    }
    response.json({ todo });
  });

  app.patch('/api/todos/:id', (request, response) => {
    const id = todoIdSchema.parse(request.params.id);
    const input = updateTodoSchema.parse(request.body);
    const todo = todos.update(id, input);
    if (!todo) {
      response.status(404).json({ error: { message: 'This task could not be found.' } });
      return;
    }
    response.json({ todo });
  });

  app.delete('/api/todos/:id', (request, response) => {
    const id = todoIdSchema.parse(request.params.id);
    if (!todos.delete(id)) {
      response.status(404).json({ error: { message: 'This task could not be found.' } });
      return;
    }
    response.status(204).end();
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: { message: 'API endpoint not found.' } });
  });

  if (options.clientDirectory) {
    const clientDirectory = resolve(options.clientDirectory);
    app.get(['/', '/index.html'], (_request, response) =>
      response.sendFile(join(clientDirectory, 'index.html')),
    );
    app.get('/todo.html', (_request, response) =>
      response.sendFile(join(clientDirectory, 'todo.html')),
    );
    app.use(express.static(clientDirectory, { index: false, dotfiles: 'deny' }));
  }
  // Unknown URLs must not silently return a client application shell: this is an MPA.
  app.use((_request, response) => {
    response.status(404).json({ error: { message: 'Page not found.' } });
  });

  const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    if (error instanceof ZodError) {
      response.status(400).json({
        error: {
          message: 'Please check the request fields.',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
      return;
    }
    if (error && typeof error === 'object' && 'status' in error) {
      if (error.status === 413) {
        response.status(413).json({ error: { message: 'The request body is too large.' } });
        return;
      }
      if (error.status === 400) {
        response.status(400).json({
          error: { message: 'The request could not be parsed. Send valid JSON and a valid URL.' },
        });
        return;
      }
      if (error.status === 415) {
        response
          .status(415)
          .json({ error: { message: 'Use application/json with UTF-8 encoding.' } });
        return;
      }
      if (error.status === 404) {
        response.status(404).json({ error: { message: 'Page not found.' } });
        return;
      }
    }
    console.error('Request failed:', error);
    response.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
  };
  app.use(handleError);
  return app;
}
