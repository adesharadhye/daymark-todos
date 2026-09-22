# HTTP API

Default API origin: `http://127.0.0.1:3001`. Development browser requests use relative `/api` URLs through Vite's proxy. Requests and responses use JSON; send `Content-Type: application/json` for POST and PATCH.

## Endpoints

| Method | Path             | Success                  | Behavior                                         |
| ------ | ---------------- | ------------------------ | ------------------------------------------------ |
| GET    | `/api/health`    | 200                      | Server health check.                             |
| GET    | `/api/todos`     | 200 `{ "todos": [...] }` | List todos with optional filters and sorting.    |
| POST   | `/api/todos`     | 201 `{ "todo": {...} }`  | Create a todo; `Location` points to its API URL. |
| GET    | `/api/todos/:id` | 200 `{ "todo": {...} }`  | Fetch one todo by UUID.                          |
| PATCH  | `/api/todos/:id` | 200 `{ "todo": {...} }`  | Update only the supplied fields.                 |
| DELETE | `/api/todos/:id` | 204, empty body          | Permanently delete one todo.                     |

## Todo schema

```json
{
  "id": "ae267e89-c0df-41fb-a8f5-184cabce40ef",
  "title": "Prepare launch checklist",
  "description": "Review the release notes and screenshots.",
  "completed": false,
  "priority": "high",
  "project": "work",
  "dueDate": "2027-06-15",
  "createdAt": "2027-06-01T09:00:00.000Z",
  "updatedAt": "2027-06-01T09:00:00.000Z",
  "completedAt": null
}
```

| Field         | Create           | Update    | Rules and defaults                                                       |
| ------------- | ---------------- | --------- | ------------------------------------------------------------------------ |
| `title`       | Required         | Optional  | String, 1–200 characters after trimming; cannot be blank.                |
| `description` | Optional         | Optional  | String, up to 5,000 characters; defaults to `""`.                        |
| `priority`    | Optional         | Optional  | `low`, `medium`, or `high`; defaults to `medium`.                        |
| `project`     | Optional         | Optional  | `personal`, `work`, or `learning`; defaults to `personal`.               |
| `dueDate`     | Optional         | Optional  | Real calendar date in `YYYY-MM-DD` format or `null`; defaults to `null`. |
| `completed`   | Not accepted     | Optional  | Boolean; newly created todos start incomplete.                           |
| `id`          | Server generated | Read-only | UUID.                                                                    |
| `createdAt`   | Server generated | Read-only | UTC ISO timestamp.                                                       |
| `updatedAt`   | Server generated | Read-only | UTC ISO timestamp.                                                       |
| `completedAt` | Server generated | Read-only | UTC ISO timestamp when completed; `null` when open.                      |

PATCH requires at least one supported field. Omitted fields retain their values. Use `dueDate: null` to remove a date and `description: ""` to clear notes. Completing a todo sets `completedAt`; unrelated edits retain it, and reopening clears it. Unknown fields are rejected, including attempts to supply server-managed fields.

Dates are calendar dates, not timestamps. `2028-02-29` is accepted; `2027-02-29` and `2026-04-31` are rejected.

## List queries

| Parameter   | Values                                    | Behavior                                                                                                                                                      |
| ----------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `q`         | String, up to 200 characters              | Search title and description; surrounding whitespace is ignored. SQL wildcard characters `%` and `_` are treated literally. ASCII search is case-insensitive. |
| `completed` | `true` or `false`                         | Select one completion state; omitted returns both.                                                                                                            |
| `priority`  | `low`, `medium`, `high`                   | Select a priority.                                                                                                                                            |
| `project`   | `personal`, `work`, `learning`            | Select a project.                                                                                                                                             |
| `sort`      | `newest`, `oldest`, `dueDate`, `priority` | Defaults to `newest`; due dates ascend with undated items last; priority is high to low.                                                                      |

Filters combine with AND. Unsupported parameters and invalid values return 400. There is no pagination; the endpoint returns all matching tasks. The browser's Today and Upcoming views apply date filtering to the loaded tasks.

Example:

```http
GET /api/todos?q=release&completed=false&project=work&priority=high&sort=dueDate
```

## Errors

```json
{
  "error": {
    "message": "A human-readable explanation"
  }
}
```

Validation responses may additionally include `error.details`. Clients should branch on HTTP status and display the message rather than depend on exact error wording.

| Status | Meaning                                                                           |
| ------ | --------------------------------------------------------------------------------- |
| 400    | Invalid input, malformed JSON, malformed UUID, or invalid query parameters.       |
| 404    | Well-formed UUID does not identify an existing todo, or API route does not exist. |
| 413    | Request body exceeds the 32 KB JSON limit.                                        |
| 415    | POST or PATCH body is not sent as `application/json`.                             |
| 500    | Unexpected server failure.                                                        |

## Try it

The complete request collection is [todos.http](todos.http). It demonstrates create, list, combined filters, fetch, edit, complete, reopen, clear a due date, delete, and validation errors. The generated ID from the named creation request is reused automatically by subsequent requests.
