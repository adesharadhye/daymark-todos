# Features and behavior

## Task list

The list page is `/` (also available as `/index.html`). The first run starts empty; **New task** opens a form. Optional example data can be added with `npm run seed`.

### Views and organization

| View                     | Included tasks                                                                   |
| ------------------------ | -------------------------------------------------------------------------------- |
| All tasks                | All tasks, including completed tasks.                                            |
| Today                    | Incomplete tasks due on the user's current local calendar date.                  |
| Upcoming                 | Incomplete tasks with a date strictly after today; there is no upper date limit. |
| Completed                | Completed tasks.                                                                 |
| Personal, Work, Learning | Tasks in that project.                                                           |

The All, Active, and Completed list tabs further filter the current view. Search matches title and description. The priority selector limits results to one priority. Sorting supports newest first, oldest first, earliest due date, and highest priority; undated tasks appear last when sorting by due date. Search and filters combine.

The header links All, Today, Upcoming, and Done select the corresponding views. Select a task's project label to view that project's tasks. View and project selection are represented in the page URL. Search, priority, sort, and list-tab choices live in the current page state and reset on a full page navigation or reload.

The overview shows the total number of tasks, the completed count, and incomplete tasks due today. Counts describe the full collection. Task rows show task information and completion state; selecting a title opens its individual page. Due-date labels distinguish overdue, today, and other dates. Today excludes overdue tasks; those remain available in All tasks or their project.

### Creating and editing

The task form contains:

- A required title, up to 200 characters after trimming.
- Optional notes, up to 5,000 characters.
- An optional due date.
- Low, Medium, or High priority; Medium is the default.
- Personal, Work, or Learning project; Personal is the default.

The same form is used for creation and editing. The server validates all fields as well as the browser form. Saving updates the interface after the API confirms success. A failed request displays an error so the user can retry.

### Completion and deletion

Tasks can be completed or reopened. Completing a task records a timestamp; reopening clears that timestamp. Editing a completed task retains its completion time.

Deleting requires confirmation in a dialog. Cancellation keeps the task. Confirmed deletion permanently removes the task from SQLite. Completion, editing, and deletion are available from both the list and the detail page.

## Individual task page

The second document is `/todo.html?id=<uuid>`. It reads the todo ID from the `id` query parameter and fetches that task from the API. This URL can be bookmarked, copied, or loaded directly.

The page displays the task's title, notes, completion state, project, priority, due date, and creation/update/completion information. It supports editing, completing/reopening, and confirmed deletion. Navigation back to the list loads the list document.

A missing or malformed ID produces a clear error state. A well-formed ID for a deleted or nonexistent task produces a not-found state. Loading and request errors have dedicated feedback.

## Usability

- Responsive layout supports narrow and wide screens.
- Form controls have labels and action buttons have accessible names.
- Native dialogs support keyboard interaction and focus management.
- Loading, empty-list, no-search-results, and request-error states explain what is happening.
- Error states provide a retry action where appropriate.
- Status messages confirm successful changes.

## Persistence and API

Tasks are stored in SQLite at `data/daymark.sqlite` by default. They persist across page reloads and server restarts. `DATABASE_PATH` selects another database file; the parent directory is created when needed. Run the app from the repository root so the default relative paths remain consistent.

The API provides create, list, fetch, partial update, delete, filtering, sorting, and a health endpoint. It validates UUIDs, field lengths, enum values, JSON types, and actual calendar dates. Unsupported fields and query keys are rejected. See [API.md](API.md) for the complete contract and [todos.http](todos.http) for runnable examples.

Optional sample data is explicit: `npm run seed` appends eight example tasks once per database, including one completed task. A seed-history marker prevents duplicates on repeated runs, including when an example has since been edited or deleted. Seeding does not clear existing tasks.

## Limits

This is a single-user application. There are no accounts, authentication, team workspaces, custom projects, recurring tasks, reminders, attachments, or offline sync. Deletion has no undo. There is no pagination, and the UI loads the collection into memory. Two tabs can read and change the same data, but changes are not pushed to other tabs automatically; reload to see external changes.

The project and priority model, date-based views, and search were inspired by [Todoist's task-management features](https://www.todoist.com/task-management).
