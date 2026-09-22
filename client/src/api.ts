import type { CreateTodo, Todo, UpdateTodo } from '../../shared/types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    throw new Error('Unable to connect. Check your connection and try again.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error?.message ?? `Request failed (${response.status}). Please try again.`,
    );
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

export const api = {
  list: () => request<{ todos: Todo[] }>('/todos').then((data) => data.todos),
  get: (id: string) =>
    request<{ todo: Todo }>(`/todos/${encodeURIComponent(id)}`).then((data) => data.todo),
  create: (data: CreateTodo) =>
    request<{ todo: Todo }>('/todos', { method: 'POST', body: JSON.stringify(data) }).then(
      (data) => data.todo,
    ),
  update: (id: string, data: UpdateTodo) =>
    request<{ todo: Todo }>(`/todos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then((data) => data.todo),
  delete: (id: string) => request<void>(`/todos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
