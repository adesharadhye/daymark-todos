# Daymark

A focused todo application built with React, TypeScript, Express, and SQLite. Two separately served HTML pages provide the task list and an individual task view. Tasks survive server restarts.

Public repository: [adesharadhye/daymark-todos](https://github.com/adesharadhye/daymark-todos).

## Run locally

Requires **Node.js 24 or newer** and npm. No database server or Python environment is required.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Vite serves the React pages and forwards `/api` requests to Express at `http://127.0.0.1:3001`.

The first run creates an empty SQLite database at `data/daymark.sqlite`. To add the optional example tasks, stop the app and run:

```sh
npm run seed
npm run dev
```

Local configuration is documented in [.env.example](.env.example). To customize it, copy that file to `.env` and edit `PORT`, `HOST`, or `DATABASE_PATH`. The server and seed script load `.env` automatically; existing environment variables take precedence. The default configuration works without an `.env` file. Keep the API on port `3001` during development unless you also change the Vite proxy target.

## Production build

```sh
npm run build
npm start
```

Open **http://127.0.0.1:3001**. Express serves both built HTML pages, their assets, and the API from one origin. Keep `data/` on persistent storage when hosting the app. The database file and local configuration are excluded from Git.

## Features

- Create tasks with a title, notes, due date, priority, and project.
- Search, filter, and sort the list; use All tasks, Today, Upcoming, and Completed views.
- Mark tasks complete, reopen them, edit their details, and delete with confirmation.
- Open a shareable task URL: `/todo.html?id=<todo-uuid>`.
- See task totals and completion progress in a responsive interface.
- Use a validated JSON CRUD API backed by SQLite.

Every implemented feature and its behavior is documented in [FEATURES.md](docs/FEATURES.md). API schemas, errors, and examples are in [API.md](docs/API.md). Design decisions and the code organization are in [ARCHITECTURE.md](docs/ARCHITECTURE.md).

The handwritten source includes line-by-line explanatory comments. [CODE_GUIDE.md](docs/CODE_GUIDE.md) gives a reading order and explains strict JSON configuration and request-body fields that cannot contain inline comments. Generated files and installed dependencies remain unchanged.

## Why this is an MPA

`client/index.html` and `client/todo.html` are separate Vite build inputs, each mounting its own React entry point. A task link performs a normal browser navigation to `todo.html?id=...`; the detail page reads the query parameter and requests that task from the API. There is no client-side router or universal HTML fallback. Refreshing a detail URL works directly.

To verify, open browser developer tools → Network, filter to **Doc**, then click a task title. The browser requests a new `todo.html` document. The production build emits both `dist/client/index.html` and `dist/client/todo.html`.

## Checks and API requests

```sh
npm run typecheck
npm test
npm run build
# Formatting checks, tests, and build (including type checks):
npm run check
```

Vitest and Supertest cover CRUD, validation, filtering, completion timestamps, missing records, database isolation, ordering, and persistence after reopening a database file. Tests use isolated databases and never touch the app database.

Browser tests are available with:

```sh
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts its own production server on port 3101 with an isolated database. It checks CRUD, persistence, full document navigation, invalid task links, filters, mobile layout, dialog focus, and failed-request recovery. To use an already installed Chrome browser instead of downloading Chromium, set `PLAYWRIGHT_CHANNEL=chrome` before running it. In PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm.cmd run test:e2e
```

Use `npm run format` to format the code and `npm run format:check` to check formatting. On Windows with restricted PowerShell scripts, use `npm.cmd` and `npx.cmd` in place of `npm` and `npx`.

[docs/todos.http](docs/todos.http) contains runnable REST Client requests. Start the API, open this file in VS Code with the REST Client extension, and run the named `createTodo` request before the requests that use its generated ID.

GitHub Actions runs formatting and type checks, backend tests, the production build, and Chromium browser tests on pushes and pull requests.

## Scope

Daymark is a single-user challenge application. It has no accounts, authentication, team sharing, reminders, recurring tasks, or offline synchronization. Anyone with access to its API can read and change its tasks. The default server binds to localhost.
