// Provide a typed fetch wrapper shared by the two independent React pages.
import type { CreateTodo, Todo, UpdateTodo } from '../../shared/types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  // Attempt the operation so failures can be handled below.
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      // Specify the HTTP headers.
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    // Reject this operation with an error the caller can handle.
    throw new Error('Unable to connect. Check your connection and try again.');
  }
  if (!response.ok) {
    // Calculate or store the JSON request body.
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error?.message ?? `Request failed (${response.status}). Please try again.`,
    );
  }
  // Skip JSON parsing for an empty 204 response; parse other succesful responses.
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

export const api = {
  // Specify list.
  list: () => request<{ todos: Todo[] }>('/todos').then((data) => data.todos),
  get: (id: string) =>
    request<{ todo: Todo }>(`/todos/${encodeURIComponent(id)}`).then((data) => data.todo),
  // Specify create.
  create: (data: CreateTodo) =>
    request<{ todo: Todo }>('/todos', { method: 'POST', body: JSON.stringify(data) }).then(
      (data) => data.todo,
    ),
  // Specify update.
  update: (id: string, data: UpdateTodo) =>
    request<{ todo: Todo }>(`/todos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      // Specify the JSON request body.
      body: JSON.stringify(data),
    }).then((data) => data.todo),
  delete: (id: string) => request<void>(`/todos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
