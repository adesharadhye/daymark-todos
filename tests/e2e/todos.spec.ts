import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import type { CreateTodo, Todo } from '../../shared/types';

async function createTask(request: APIRequestContext, data: CreateTodo): Promise<Todo> {
  const response = await request.post('/api/todos', { data });
  expect(response.status()).toBe(201);
  return (await response.json()).todo as Todo;
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
}

test.beforeEach(async ({ request }) => {
  // The config starts a new server with a unique test database for each run.
  const response = await request.get('/api/todos');
  expect(response.ok()).toBe(true);
  const { todos } = (await response.json()) as { todos: Todo[] };
  for (const todo of todos) {
    expect((await request.delete(`/api/todos/${todo.id}`)).status()).toBe(204);
  }
});

test('creates, opens a separate document, edits, completes, reopens, and deletes a task', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page.getByText('Good things start with one task.')).toBeVisible();
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Task title').fill('Plan the weekend');
  await form.getByLabel('Notes').fill('Book a quiet place and invite friends.');
  await form.getByRole('combobox', { name: 'Project', exact: true }).selectOption('personal');
  await form.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('high');
  await form.getByLabel('Due date').fill('2030-06-15');
  await form.getByRole('button', { name: 'Create task' }).click();
  await expect(form).not.toBeVisible();
  const titleLink = page.getByRole('link', { name: 'Plan the weekend', exact: true });
  await expect(titleLink).toBeVisible();

  // A real navigation request and a fresh window prove this is an MPA transition.
  await page.evaluate(() => {
    Object.assign(window, { daymarkNavigationMarker: 'list document' });
  });
  const documentRequest = page.waitForResponse(
    (response) =>
      response.request().isNavigationRequest() &&
      response.request().resourceType() === 'document' &&
      new URL(response.url()).pathname === '/todo.html',
  );
  await titleLink.click();
  expect((await documentRequest).status()).toBe(200);
  await expect(page).toHaveURL(/\/todo\.html\?id=[0-9a-f-]{36}$/);
  expect(await page.evaluate(() => 'daymarkNavigationMarker' in window)).toBe(false);
  const id = new URL(page.url()).searchParams.get('id')!;
  await expect(page.getByRole('heading', { name: 'Plan the weekend', level: 1 })).toBeVisible();
  await expect(
    page.getByText('Book a quiet place and invite friends.', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Edit task', exact: true }).click();
  await form.getByLabel('Task title').fill('Plan the long weekend');
  await form.getByLabel('Notes').fill('The booking is confirmed.');
  await form.getByRole('combobox', { name: 'Project', exact: true }).selectOption('work');
  await form.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('low');
  await form.getByLabel('Due date').fill('');
  await form.getByRole('button', { name: 'Save changes' }).click();
  await expect(form).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Plan the long weekend', level: 1 }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/Plan the long weekend/);
  await expect(page.getByText('The booking is confirmed.', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Mark this task as complete/ }).click();
  await expect(page.getByRole('button', { name: /Click to reopen this task/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.reload();
  await expect(page.getByRole('button', { name: /Click to reopen this task/ })).toBeVisible();
  const saved = (await (await request.get(`/api/todos/${id}`)).json()).todo as Todo;
  expect(saved).toMatchObject({
    title: 'Plan the long weekend',
    description: 'The booking is confirmed.',
    project: 'work',
    priority: 'low',
    dueDate: null,
    completed: true,
  });
  expect(saved.completedAt).toBeTruthy();

  await page.getByRole('button', { name: /Click to reopen this task/ }).click();
  await expect(page.getByRole('button', { name: /Mark this task as complete/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await form.getByRole('button', { name: 'Keep task' }).click();
  await expect(form).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Plan the long weekend', level: 1 }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await form.getByRole('button', { name: 'Delete task', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Good things start with one task.')).toBeVisible();
  expect((await request.get(`/api/todos/${id}`)).status()).toBe(404);
});

for (const scenario of [
  { query: '', message: 'This page needs a task ID.' },
  { query: '?id=invalid', message: 'This task link has an invalid ID.' },
  { query: '?id=00000000-0000-4000-8000-000000000000', message: 'This task could not be found.' },
]) {
  test(`shows an actionable detail error for ${scenario.query || 'a missing id'}`, async ({
    page,
  }) => {
    await page.goto(`/todo.html${scenario.query}`);
    await expect(page.getByRole('alert')).toContainText(scenario.message);
    await page.getByRole('link', { name: 'Back to all tasks' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeVisible();
  });
}

test('combines search, status and priority filters, sorting, and project/date views', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const today = await page.evaluate(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  await createTask(request, {
    title: 'Review proposal',
    description: 'Budget review for launch',
    priority: 'high',
    project: 'work',
    dueDate: today,
  });
  await createTask(request, {
    title: 'Read a chapter',
    description: 'Budget for a little quiet time',
    priority: 'low',
    project: 'personal',
    dueDate: '2099-12-31',
  });
  const finished = await createTask(request, {
    title: 'Finish lesson',
    priority: 'medium',
    project: 'learning',
  });
  expect(
    (await request.patch(`/api/todos/${finished.id}`, { data: { completed: true } })).ok(),
  ).toBe(true);
  await page.reload();
  const titles = page.locator('.task-title');
  await expect(titles).toHaveCount(3);
  await page.getByLabel('Search tasks').fill('BUDGET');
  await expect(titles).toHaveCount(2);
  await page.getByLabel('Filter priority').selectOption('high');
  await expect(titles).toHaveText(['Review proposal']);
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(page.getByText('No tasks match this view.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'View all tasks' }).click();
  await expect(titles).toHaveCount(3);
  await expect(page.getByLabel('Search tasks')).toHaveValue('');
  await expect(page.getByLabel('Filter priority')).toHaveValue('all');
  await page.getByLabel('Sort tasks').selectOption('priority');
  await expect(titles).toHaveText(['Review proposal', 'Finish lesson', 'Read a chapter']);
  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await expect(titles).toHaveText(['Review proposal', 'Read a chapter']);
  await page.getByLabel('Sort tasks').selectOption('dueDate');
  await expect(titles).toHaveText(['Review proposal', 'Read a chapter']);

  await page.getByRole('link', { name: 'work', exact: true }).click();
  await expect(page).toHaveURL('/?project=work');
  await expect(titles).toHaveText(['Review proposal']);
  await page.getByRole('link', { name: 'Today', exact: true }).click();
  await expect(titles).toHaveText(['Review proposal']);
  await page.getByRole('link', { name: 'Upcoming', exact: true }).click();
  await expect(titles).toHaveText(['Read a chapter']);
  await page.getByRole('link', { name: 'Done', exact: true }).click();
  await expect(titles).toHaveText(['Finish lesson']);
});

test('supports creating and opening tasks on mobile without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Task title')).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  const title = 'A mobile task with a deliberately long title to check that text wraps comfortably';
  await page.getByLabel('Task title').fill(title);
  await page.getByRole('button', { name: 'Create task' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('link', { name: title, exact: true }).click();
  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('link', { name: 'All', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
});

test('recovers from a failed list request using the retry action', async ({ page }) => {
  await page.route('**/api/todos', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Temporarily unavailable. Please retry.' } }),
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Temporarily unavailable. Please retry.');
  await page.unroute('**/api/todos');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('alert')).not.toBeVisible();
  await expect(page.getByText('Good things start with one task.')).toBeVisible();
});
