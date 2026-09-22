// Build the Express application without starting a listener, so tests can supply their own database.
import express, { type ErrorRequestHandler } from 'express';
import { join, resolve } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
// Import the requried exports from zod.
import { ZodError } from 'zod';
import { TodoRepository } from './repository.js';
import { createTodoSchema, listTodosSchema, todoIdSchema, updateTodoSchema } from './validation.js';

// Describe the compile-time fields of AppOptions.
interface AppOptions {
  clientDirectory?: string;
}

// Assemble the API, static pages, and error middleware around the supplied database.
export function createApp(database: DatabaseSync, options: AppOptions = {}) {
  const app = express();
  const todos = new TodoRepository(database);
  // Omit the framework-identifying X-Powered-By response header.
  app.disable('x-powered-by');

  app.use('/api', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    // Continue to the next Express middleware.
    next();
  });
  app.use('/api/todos', (request, response, next) => {
    // Take this branch when the condition holds: ['POST', 'PATCH'].includes(request.method) && !request.is('application/json').
    if (['POST', 'PATCH'].includes(request.method) && !request.is('application/json')) {
      response
        .status(415)
        // Serialize the response body as JSON.
        .json({ error: { message: 'Send the request body as application/json.' } });
      return;
    }
    // Continue to the next Express middleware.
    next();
  });
  app.use(express.json({ limit: '32kb' }));

  // Handle GET requests for '/api/health'.
  app.get('/api/health', (_request, response) => {
    database.prepare('SELECT 1').get();
    response.json({ status: 'ok' });
  });

  // Handle GET requests for '/api/todos'.
  app.get('/api/todos', (request, response) => {
    const filters = listTodosSchema.parse(request.query);
    response.json({ todos: todos.list(filters) });
  });

  // Handle POST requests for '/api/todos'.
  app.post('/api/todos', (request, response) => {
    const input = createTodoSchema.parse(request.body);
    const todo = todos.create(input);
    // Send the HTTP response using response.location.
    response.location(`/api/todos/${todo.id}`).status(201).json({ todo });
  });

  app.get('/api/todos/:id', (request, response) => {
    // Validate and read the unique task identifier; invalid input throws a Zod error.
    const id = todoIdSchema.parse(request.params.id);
    const todo = todos.find(id);
    if (!todo) {
      // Send the HTTP response using response.status.
      response.status(404).json({ error: { message: 'This task could not be found.' } });
      return;
    }
    // Send the HTTP response using response.json.
    response.json({ todo });
  });

  app.patch('/api/todos/:id', (request, response) => {
    // Validate and read the unique task identifier; invalid input throws a Zod error.
    const id = todoIdSchema.parse(request.params.id);
    const input = updateTodoSchema.parse(request.body);
    const todo = todos.update(id, input);
    // Return a not-found response when the requested task does not exist.
    if (!todo) {
      response.status(404).json({ error: { message: 'This task could not be found.' } });
      return;
    }
    // Send the HTTP response using response.json.
    response.json({ todo });
  });

  app.delete('/api/todos/:id', (request, response) => {
    // Validate and read the unique task identifier; invalid input throws a Zod error.
    const id = todoIdSchema.parse(request.params.id);
    if (!todos.delete(id)) {
      response.status(404).json({ error: { message: 'This task could not be found.' } });
      // Stop this handler after it has completed its response.
      return;
    }
    response.status(204).end();
  });

  // Register middleware for '/api', (_request, response) .
  app.use('/api', (_request, response) => {
    response.status(404).json({ error: { message: 'API endpoint not found.' } });
  });

  // Serve the built pages only when a client output directory was supplied.
  if (options.clientDirectory) {
    const clientDirectory = resolve(options.clientDirectory);
    app.get(['/', '/index.html'], (_request, response) =>
      // Send the HTTP response using response.sendFile.
      response.sendFile(join(clientDirectory, 'index.html')),
    );
    app.get('/todo.html', (_request, response) =>
      // Send the HTTP response using response.sendFile.
      response.sendFile(join(clientDirectory, 'todo.html')),
    );
    app.use(express.static(clientDirectory, { index: false, dotfiles: 'deny' }));
  }
  // Unknown URLs must not silently return a client application shell: this is an MPA.
  app.use((_request, response) => {
    response.status(404).json({ error: { message: 'Page not found.' } });
  });

  // Calculate or store handle error.
  const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      // Stop this handler after it has completed its response.
      return;
    }
    if (error instanceof ZodError) {
      // Send the HTTP response using response.status.
      response.status(400).json({
        error: {
          message: 'Please check the request fields.',
          // Specify the field-level validation errors.
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
      // Stop this handler after it has completed its response.
      return;
    }
    if (error && typeof error === 'object' && 'status' in error) {
      // Report a request body larger than the configured limit.
      if (error.status === 413) {
        response.status(413).json({ error: { message: 'The request body is too large.' } });
        return;
      }
      // Report malformed JSON or other unparsable request input.
      if (error.status === 400) {
        response.status(400).json({
          error: { message: 'The request could not be parsed. Send valid JSON and a valid URL.' },
        });
        // Stop this handler after it has completed its response.
        return;
      }
      if (error.status === 415) {
        response
          // Set HTTP status 415.
          .status(415)
          .json({ error: { message: 'Use application/json with UTF-8 encoding.' } });
        return;
      }
      // Report a missing static page without exposing server details.
      if (error.status === 404) {
        response.status(404).json({ error: { message: 'Page not found.' } });
        return;
      }
    }
    // Write useful startup, seed, or failure information to the server console.
    console.error('Request failed:', error);
    response.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
  };
  // Register middleware for handleError);.
  app.use(handleError);
  return app;
}
