# Reading the commented source

The handwritten TypeScript, React markup, SQL, CSS, HTML, SVG, CI workflow, environment example, ignore rules, and REST requests contain line-by-line explanations. Comments explain the purpose of statements, fields, controls, style declarations, and closing boundaries. The existing feature and API documentation remains prose rather than commented executable code.

Generated files are deliberately excluded: `package-lock.json`, `node_modules/`, `dist/`, database files, browser reports, temporary files, and the pre-existing Python environment. The comments do not change application behavior.

## Comment syntax

| File or context                                                                    | Comment form           | Why                                                                                        |
| ---------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| TypeScript and JavaScript expressions                                              | `// explanation`       | The compiler ignores the rest of the line.                                                 |
| React child markup                                                                 | `{/* explanation */}`  | A JavaScript comment inside a JSX expression adds no visible text.                         |
| CSS                                                                                | `/* explanation */`    | CSS does not support JavaScript-style line comments.                                       |
| SQL inside a template string                                                       | `-- explanation`       | SQLite ignores the comment when it executes the SQL string.                                |
| HTML and SVG                                                                       | `<!-- explanation -->` | Comments stay outside tags and their attributes.                                           |
| YAML, environment examples, ignore files, Git attributes, and REST request headers | `# explanation`        | These formats support hash-prefixed comments in the annotated positions.                   |
| Strict JSON and `.nvmrc`                                                           | Explained below        | Adding comments directly would make these files incompatible with some of their consumers. |

Blank lines only separate related code. Closing braces, parentheses, and tags finish the block introduced above them. A formatter may wrap a single explained statement across several physical lines; its comment applies to that whole statement.

## Suggested reading order

1. [shared/types.ts](../shared/types.ts): the task fields shared between the browser and server.
2. [server/db.ts](../server/db.ts): SQLite connection, table, constraints, and indexes.
3. [server/repository.ts](../server/repository.ts): task queries and changes.
4. [server/validation.ts](../server/validation.ts): allowed request values.
5. [server/app.ts](../server/app.ts): HTTP routes and error responses.
6. [server/config.ts](../server/config.ts) and [server/index.ts](../server/index.ts): settings, startup, and shutdown.
7. [client/src/api.ts](../client/src/api.ts): browser requests to those routes.
8. [client/src/components.tsx](../client/src/components.tsx): shared forms, dialogs, and feedback.
9. [client/src/list.tsx](../client/src/list.tsx) and [client/src/detail.tsx](../client/src/detail.tsx): the two independent React pages.
10. [tests](../tests): API, repository, persistence, and browser expectations.

## `package.json`

This is handwritten configuration, but npm expects strict JSON. Each setting is explained here instead of adding invalid inline comments. An opening `{` starts an object, `}` ends it, `:` associates a key with a value, and commas separate entries. Quoted keys and values are JSON strings.

| Setting                                | Explanation                                                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                                 | Identifies this npm project as `daymark-todos`.                                                                                        |
| `version`                              | Records the project's initial version, `1.0.0`.                                                                                        |
| `private`                              | Prevents accidental publication to the npm package registry. It does **not** make the GitHub repository private.                       |
| `description`                          | Summarizes the application and its stack.                                                                                              |
| `type`                                 | Selects ECMAScript modules, enabling `import` and `export` in JavaScript.                                                              |
| `engines`                              | Groups supported runtime versions.                                                                                                     |
| `engines.node`                         | Requires Node 24 or newer for the runtime and built-in SQLite API.                                                                     |
| `scripts`                              | Groups commands invoked with `npm run <name>`.                                                                                         |
| `scripts.dev`                          | Starts both development processes. `-k` stops the other process when one exits; `-n api,web` labels their output.                      |
| `scripts.dev:server`                   | Runs the TypeScript server through `tsx watch`, restarting when source changes.                                                        |
| `scripts.dev:client`                   | Starts Vite on localhost for the React documents.                                                                                      |
| `scripts.typecheck`                    | Checks the browser/test configuration and then the server configuration without emitting files. `&&` stops if the first command fails. |
| `scripts.build`                        | Type-checks, builds the two browser pages, then compiles the server.                                                                   |
| `scripts.start`                        | Runs the compiled production server from `dist/server/index.js`.                                                                       |
| `scripts.test`                         | Runs the Vitest tests once.                                                                                                            |
| `scripts.test:watch`                   | Keeps Vitest running while code changes.                                                                                               |
| `scripts.test:e2e`                     | Runs the Playwright browser suite against its isolated server.                                                                         |
| `scripts.check`                        | Runs formatting checks, backend tests, and the production build, which also type-checks.                                               |
| `scripts.format`                       | Formats supported handwritten files in place using Prettier.                                                                           |
| `scripts.format:check`                 | Checks formatting without rewriting files.                                                                                             |
| `scripts.seed`                         | Runs the optional, non-destructive SQLite demo-data script.                                                                            |
| `dependencies`                         | Groups packages used by the application.                                                                                               |
| `dependencies.express`                 | Provides HTTP routing, JSON parsing, and production static-file serving.                                                               |
| `dependencies.lucide-react`            | Supplies the React icon components.                                                                                                    |
| `dependencies.react`                   | Supplies components, state, and effects.                                                                                               |
| `dependencies.react-dom`               | Mounts each React tree into its HTML document.                                                                                         |
| `dependencies.zod`                     | Validates incoming API bodies and query parameters.                                                                                    |
| `devDependencies`                      | Groups development, compilation, formatting, and testing tools.                                                                        |
| `devDependencies.@playwright/test`     | Runs real-browser tests and manages browser-test fixtures.                                                                             |
| `devDependencies.@types/express`       | Provides Express's TypeScript declarations.                                                                                            |
| `devDependencies.@types/node`          | Provides declarations for Node APIs such as filesystem access and SQLite.                                                              |
| `devDependencies.@types/react`         | Provides React's TypeScript declarations.                                                                                              |
| `devDependencies.@types/react-dom`     | Provides types for browser mounting APIs.                                                                                              |
| `devDependencies.@types/supertest`     | Provides types for the HTTP-testing helper.                                                                                            |
| `devDependencies.@vitejs/plugin-react` | Connects React transformation and development refresh to Vite.                                                                         |
| `devDependencies.concurrently`         | Runs the API and browser development processes together.                                                                               |
| `devDependencies.prettier`             | Formats the project's source and documentation.                                                                                        |
| `devDependencies.supertest`            | Sends test HTTP requests directly to the Express app.                                                                                  |
| `devDependencies.tsx`                  | Executes TypeScript development and seed entry points.                                                                                 |
| `devDependencies.typescript`           | Checks types and compiles the server.                                                                                                  |
| `devDependencies.vite`                 | Serves and builds the multi-page browser application.                                                                                  |
| `devDependencies.vitest`               | Runs backend and repository tests.                                                                                                     |

Dependency values beginning with `^` allow compatible versions under npm's version rules. The generated lockfile records the exact versions used by `npm ci`; it is intentionally not annotated.

## `tsconfig.json`

This configuration checks browser code, shared types, tool configuration, and tests. The server has its own output-producing configuration below.

| Setting                                | Explanation                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `compilerOptions`                      | Groups TypeScript language, module, and checking settings.                       |
| `target: ES2022`                       | Uses the ES2022 language level.                                                  |
| `lib: [ES2022, DOM, DOM.Iterable]`     | Includes standard JavaScript, browser DOM, and iterable DOM type definitions.    |
| `module: ESNext`                       | Keeps modern module syntax for Vite to bundle.                                   |
| `moduleResolution: Bundler`            | Resolves imports using conventions supported by the browser bundler.             |
| `jsx: react-jsx`                       | Uses React's automatic JSX transform.                                            |
| `strict: true`                         | Enables strict type and null checks.                                             |
| `noUnusedLocals: true`                 | Reports unused local variables and imports.                                      |
| `noUnusedParameters: true`             | Reports unused parameters, with TypeScript's underscore-name exception.          |
| `skipLibCheck: true`                   | Skips checking the internals of dependency declaration files.                    |
| `esModuleInterop: true`                | Supports conventional imports from CommonJS packages.                            |
| `resolveJsonModule: true`              | Allows typed JSON imports if needed.                                             |
| `noEmit: true`                         | Checks types without generating browser JavaScript; Vite performs that build.    |
| `types: [vite/client, node]`           | Includes Vite client and Node global declarations.                               |
| `include`                              | Lists the source folders and tool configuration files this configuration checks. |
| `include` entry `client`               | Includes both React pages, their helpers, and shared UI.                         |
| `include` entry `shared`               | Includes the task contracts used on both sides of the API.                       |
| `include` entry `vite.config.ts`       | Checks the multiple-page build and proxy configuration.                          |
| `include` entry `vitest.config.ts`     | Checks the backend test-runner configuration.                                    |
| `include` entry `playwright.config.ts` | Checks the browser test-runner configuration.                                    |
| `include` entry `tests`                | Checks all handwritten test source.                                              |

Square brackets delimit arrays of allowed libraries, global types, or included files; commas separate their entries.

## `tsconfig.server.json`

| Setting                      | Explanation                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `compilerOptions`            | Groups the server compilation settings.                                                 |
| `target: ES2022`             | Emits JavaScript for the ES2022 language level.                                         |
| `lib: [ES2022]`              | Includes standard JavaScript types without browser DOM globals.                         |
| `module: NodeNext`           | Uses Node's ECMAScript/CommonJS module rules.                                           |
| `moduleResolution: NodeNext` | Checks imports the way Node resolves them, including `.js` extensions in server source. |
| `rootDir: .`                 | Preserves the relative `server/` and `shared/` directory structure in output.           |
| `outDir: dist`               | Writes compiled server and shared modules into `dist/`.                                 |
| `strict: true`               | Enables strict type and null checks.                                                    |
| `noUnusedLocals: true`       | Reports unused server variables and imports.                                            |
| `noUnusedParameters: true`   | Reports unused server parameters, except deliberately underscore-prefixed names.        |
| `skipLibCheck: true`         | Avoids rechecking dependency declaration internals.                                     |
| `esModuleInterop: true`      | Supports imports from CommonJS packages such as Express.                                |
| `sourceMap: true`            | Emits source maps for tracing compiled code back to TypeScript.                         |
| `include: [server, shared]`  | Compiles the server and its shared contracts, excluding the React UI and tests.         |

## `.prettierrc.json` and `.nvmrc`

| File and setting                          | Explanation                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `.prettierrc.json` / `singleQuote: true`  | Prefers single quotes in languages where the formatter allows them; JSON remains double-quoted.              |
| `.prettierrc.json` / `trailingComma: all` | Adds trailing commas where supported to make multiline edits easier to review.                               |
| `.prettierrc.json` / `printWidth: 100`    | Uses 100 characters as the preferred wrapping width.                                                         |
| `.nvmrc` / `24`                           | Requests Node major version 24 in compatible Node version managers. This file remains a plain version value. |

## JSON bodies in `docs/todos.http`

REST Client sends these bodies to the API as strict JSON. Comments inside a body would cause the server to reject it, so the body fields are explained here. The surrounding request methods, URLs, and headers are commented in the request file itself.

| Request                 | Body line or value                                   | Explanation                                                              |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Create                  | `title: Prepare launch checklist`                    | Sets the required title of the new task.                                 |
| Create                  | `description: Review screenshots and release notes.` | Stores optional notes.                                                   |
| Create                  | `priority: high`                                     | Chooses the highest of the three supported priorities.                   |
| Create                  | `project: work`                                      | Places the task in the Work project.                                     |
| Create                  | `dueDate: 2027-06-15`                                | Sets a date without a time or timezone.                                  |
| Edit                    | `title: Finalize launch checklist`                   | Replaces only the title while preserving unspecified fields.             |
| Edit                    | `description: All screenshots have been reviewed.`   | Replaces the notes.                                                      |
| Edit                    | `priority: medium`                                   | Changes urgency to Medium.                                               |
| Complete                | `completed: true`                                    | Marks the task complete and records its completion timestamp.            |
| Reopen                  | `completed: false`                                   | Reopens the task and clears its completion timestamp.                    |
| Clear due date          | `dueDate: null`                                      | Explicitly removes the date; omission would preserve the existing value. |
| Blank-title validation  | `title` containing only spaces                       | Demonstrates a 400 response after the title becomes empty when trimmed.  |
| Invalid-date validation | `title: Invalid date example`                        | Supplies a valid title so the date is the reason the request fails.      |
| Invalid-date validation | `dueDate: 2027-02-29`                                | Demonstrates rejection of February 29 in a non-leap year.                |

Each body's `{` and `}` delimit the JSON object. The `# @name createTodo` directive stores the create response; later URLs extract `todo.id` from that response. Run creation before requests that depend on its ID.
