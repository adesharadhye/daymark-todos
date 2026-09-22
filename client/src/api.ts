// Provide a typed fetch wrapper shared by the two independent React pages.
// Import compile-time types from ../../shared/types.
import type { CreateTodo, Todo, UpdateTodo } from '../../shared/types';

// Send an API request and normalize network and HTTP errors.
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Reserve a variable for response.
  let response: Response;
  // Attempt the operation so failures can be handled below.
  try {
    // Update response with the result of this expression.
    response = await fetch(`/api${path}`, {
      // Copy the existing fields before applying the more specific values.
      ...options,
      // Specify the HTTP headers.
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      // Close the current block or object.
    });
    // Handle a failure from the preceding operation.
  } catch {
    // Reject this operation with an error the caller can handle.
    throw new Error('Unable to connect. Check your connection and try again.');
    // Close the current block or object.
  }
  // Turn an unsuccessful HTTP response into an error the UI can display.
  if (!response.ok) {
    // Calculate or store the JSON request body.
    const body = await response.json().catch(() => null);
    // Reject this operation with an error the caller can handle.
    throw new Error(
      // Prefer the server error message, falling back to the HTTP status when it is missing.
      body?.error?.message ?? `Request failed (${response.status}). Please try again.`,
      // Finish the current expression or function call.
    );
    // Close the current block or object.
  }
  // Skip JSON parsing for an empty 204 response; parse other successful responses.
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
  // Close the current block or object.
}

// Calculate or store api.
export const api = {
  // Specify list.
  list: () => request<{ todos: Todo[] }>('/todos').then((data) => data.todos),
  // Specify get.
  get: (id: string) =>
    // Send the typed API request and unwrap the saved task from its JSON envelope.
    request<{ todo: Todo }>(`/todos/${encodeURIComponent(id)}`).then((data) => data.todo),
  // Specify create.
  create: (data: CreateTodo) =>
    // Send the typed API request and unwrap the saved task from its JSON envelope.
    request<{ todo: Todo }>('/todos', { method: 'POST', body: JSON.stringify(data) }).then(
      // Unwrap the task from the API response envelope.
      (data) => data.todo,
      // Finish the current expression or function call.
    ),
  // Specify update.
  update: (id: string, data: UpdateTodo) =>
    // Send the typed API request and unwrap the saved task from its JSON envelope.
    request<{ todo: Todo }>(`/todos/${encodeURIComponent(id)}`, {
      // Specify the HTTP request method.
      method: 'PATCH',
      // Specify the JSON request body.
      body: JSON.stringify(data),
      // After the request succeeds, extract its task from the response object.
    }).then((data) => data.todo),
  // Specify delete.
  delete: (id: string) => request<void>(`/todos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // Close the current block or object.
};
