// Build the Express application without starting a listener, so tests can supply their own database.
// Import the required exports from express.
import express, { type ErrorRequestHandler } from 'express';
// Import the required exports from node:path.
import { join, resolve } from 'node:path';
// Import compile-time types from node:sqlite.
import type { DatabaseSync } from 'node:sqlite';
// Import the required exports from zod.
import { ZodError } from 'zod';
// Import the required exports from ./repository.js.
import { TodoRepository } from './repository.js';
// Import the required exports from ./validation.js.
import { createTodoSchema, listTodosSchema, todoIdSchema, updateTodoSchema } from './validation.js';

// Describe the compile-time fields of AppOptions.
interface AppOptions {
  // Optionally provide the directory containing built HTML and assets.
  clientDirectory?: string;
  // Close the current block or object.
}

// Assemble the API, static pages, and error middleware around the supplied database.
export function createApp(database: DatabaseSync, options: AppOptions = {}) {
  // Calculate or store the Express application.
  const app = express();
  // Create a task repository around the selected SQLite connection.
  const todos = new TodoRepository(database);
  // Omit the framework-identifying X-Powered-By response header.
  app.disable('x-powered-by');

  // Register middleware for '/api', (_request, response, next) .
  app.use('/api', (_request, response, next) => {
    // Prevent clients from caching task API responses.
    response.setHeader('Cache-Control', 'no-store');
    // Continue to the next Express middleware.
    next();
    // Close the current block or object.
  });
  // Register middleware for '/api/todos', (request, response, next) .
  app.use('/api/todos', (request, response, next) => {
    // Take this branch when the condition holds: ['POST', 'PATCH'].includes(request.method) && !request.is('application/json').
    if (['POST', 'PATCH'].includes(request.method) && !request.is('application/json')) {
      // Supply response to the enclosing expression.
      response
        // Set HTTP status 415.
        .status(415)
        // Serialize the response body as JSON.
        .json({ error: { message: 'Send the request body as application/json.' } });
      // Stop this handler after it has completed its response.
      return;
      // Close the current block or object.
    }
    // Continue to the next Express middleware.
    next();
    // Close the current block or object.
  });
  // Register middleware for express.json({ limit: '32kb' }));.
  app.use(express.json({ limit: '32kb' }));

  // Handle GET requests for '/api/health'.
  app.get('/api/health', (_request, response) => {
    // Call database.prepare with the values shown here.
    database.prepare('SELECT 1').get();
    // Send the HTTP response using response.json.
    response.json({ status: 'ok' });
    // Close the current block or object.
  });

  // Handle GET requests for '/api/todos'.
  app.get('/api/todos', (request, response) => {
    // Validate and read the requested task filters; invalid input throws a Zod error.
    const filters = listTodosSchema.parse(request.query);
    // Send the HTTP response using response.json.
    response.json({ todos: todos.list(filters) });
    // Close the current block or object.
  });

  // Handle POST requests for '/api/todos'.
  app.post('/api/todos', (request, response) => {
    // Validate and read the validated input fields; invalid input throws a Zod error.
    const input = createTodoSchema.parse(request.body);
    // Calculate or store the current task object.
    const todo = todos.create(input);
    // Send the HTTP response using response.location.
    response.location(`/api/todos/${todo.id}`).status(201).json({ todo });
    // Close the current block or object.
  });

  // Handle GET requests for '/api/todos/:id'.
  app.get('/api/todos/:id', (request, response) => {
    // Validate and read the unique task identifier; invalid input throws a Zod error.
    const id = todoIdSchema.parse(request.params.id);
    // Calculate or store the current task object.
    const todo = todos.find(id);
    // Return a not-found response when the requested task does not exist.
    if (!todo) {
      // Send the HTTP response using response.status.
      response.status(404).json({ error: { message: 'This task could not be found.' } });
      // Stop this handler after it has completed its response.
      return;
      // Close the current block or object.
    }
    // Send the HTTP response using response.json.
    response.json({ todo });
    // Close the current block or object.
  });

  // Handle PATCH requests for '/api/todos/:id'.
  app.patch('/api/todos/:id', (request, response) => {
    // Validate and read the unique task identifier; invalid input throws a Zod error.
    const id = todoIdSchema.parse(request.params.id);
    // Validate and read the validated input fields; invalid input throws a Zod error.
    const input = updateTodoSchema.parse(request.body);
    // Calculate or store the current task object.
    const todo = todos.update(id, input);
    // Return a not-found response when the requested task does not exist.
    if (!todo) {
      // Send the HTTP response using response.status.
      response.status(404).json({ error: { message: 'This task could not be found.' } });
      // Stop this handler after it has completed its response.
      return;
      // Close the current block or object.
    }
    // Send the HTTP response using response.json.
    response.json({ todo });
    // Close the current block or object.
  });

  // Handle DELETE requests for '/api/todos/:id'.
  app.delete('/api/todos/:id', (request, response) => {
    // Validate and read the unique task identifier; invalid input throws a Zod error.
    const id = todoIdSchema.parse(request.params.id);
    // Take this branch when the condition holds: !todos.delete(id).
    if (!todos.delete(id)) {
      // Send the HTTP response using response.status.
      response.status(404).json({ error: { message: 'This task could not be found.' } });
      // Stop this handler after it has completed its response.
      return;
      // Close the current block or object.
    }
    // Send the HTTP response using response.status.
    response.status(204).end();
    // Close the current block or object.
  });

  // Register middleware for '/api', (_request, response) .
  app.use('/api', (_request, response) => {
    // Send the HTTP response using response.status.
    response.status(404).json({ error: { message: 'API endpoint not found.' } });
    // Close the current block or object.
  });

  // Serve the built pages only when a client output directory was supplied.
  if (options.clientDirectory) {
    // Calculate or store the directory containing built HTML and assets.
    const clientDirectory = resolve(options.clientDirectory);
    // Handle GET requests for ['/'.
    app.get(
      ['/', '/index.html'],
      (_request, response) =>
        // Send the HTTP response using response.sendFile.
        response.sendFile(join(clientDirectory, 'index.html')),
      // Finish the current expression or function call.
    );
    // Handle GET requests for '/todo.html'.
    app.get(
      '/todo.html',
      (_request, response) =>
        // Send the HTTP response using response.sendFile.
        response.sendFile(join(clientDirectory, 'todo.html')),
      // Finish the current expression or function call.
    );
    // Register middleware for express.static(clientDirectory, { index: false, dotfiles: 'deny' }));.
    app.use(express.static(clientDirectory, { index: false, dotfiles: 'deny' }));
    // Close the current block or object.
  }
  // Unknown URLs must not silently return a client application shell: this is an MPA.
  // Register middleware for (_request, response) .
  app.use((_request, response) => {
    // Send the HTTP response using response.status.
    response.status(404).json({ error: { message: 'Page not found.' } });
    // Close the current block or object.
  });

  // Calculate or store handle error.
  const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
    // Delegate the error if response headers were already sent.
    if (response.headersSent) {
      // Forward the error to the remaining Express error handling.
      next(error);
      // Stop this handler after it has completed its response.
      return;
      // Close the current block or object.
    }
    // Convert validation failures into a structured HTTP 400 response.
    if (error instanceof ZodError) {
      // Send the HTTP response using response.status.
      response.status(400).json({
        // Specify the error message or error object.
        error: {
          // Specify the human-readable feedback.
          message: 'Please check the request fields.',
          // Specify the field-level validation errors.
          details: error.issues.map((issue) => ({
            // Specify the file location or invalid field path.
            path: issue.path.join('.'),
            // Specify the human-readable feedback.
            message: issue.message,
            // Close the current block or object.
          })),
          // Close the current block or object.
        },
        // Close the current block or object.
      });
      // Stop this handler after it has completed its response.
      return;
      // Close the current block or object.
    }
    // Take this branch when the condition holds: error && typeof error === 'object' && 'status' in error.
    if (error && typeof error === 'object' && 'status' in error) {
      // Report a request body larger than the configured limit.
      if (error.status === 413) {
        // Send the HTTP response using response.status.
        response.status(413).json({ error: { message: 'The request body is too large.' } });
        // Stop this handler after it has completed its response.
        return;
        // Close the current block or object.
      }
      // Report malformed JSON or other unparsable request input.
      if (error.status === 400) {
        // Send the HTTP response using response.status.
        response.status(400).json({
          // Specify the error message or error object.
          error: { message: 'The request could not be parsed. Send valid JSON and a valid URL.' },
          // Close the current block or object.
        });
        // Stop this handler after it has completed its response.
        return;
        // Close the current block or object.
      }
      // Report an unsupported content type or encoding.
      if (error.status === 415) {
        // Supply response to the enclosing expression.
        response
          // Set HTTP status 415.
          .status(415)
          // Serialize the response body as JSON.
          .json({ error: { message: 'Use application/json with UTF-8 encoding.' } });
        // Stop this handler after it has completed its response.
        return;
        // Close the current block or object.
      }
      // Report a missing static page without exposing server details.
      if (error.status === 404) {
        // Send the HTTP response using response.status.
        response.status(404).json({ error: { message: 'Page not found.' } });
        // Stop this handler after it has completed its response.
        return;
        // Close the current block or object.
      }
      // Close the current block or object.
    }
    // Write useful startup, seed, or failure information to the server console.
    console.error('Request failed:', error);
    // Send the HTTP response using response.status.
    response.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
    // Close the current block or object.
  };
  // Register middleware for handleError);.
  app.use(handleError);
  // Return the configured app without starting an HTTP listener.
  return app;
  // Close the current block or object.
}
