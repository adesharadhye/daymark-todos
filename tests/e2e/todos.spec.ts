// Drive a real browser through task workflows, MPA navigation, error recovery, and mobile layout.
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import type { CreateTodo, Todo } from '../../shared/types';

async function createTask(request: APIRequestContext, data: CreateTodo): Promise<Todo> {
  // Calculate or store response.
  const response = await request.post('/api/todos', { data });
  expect(response.status()).toBe(201);
  return (await response.json()).todo as Todo;
}

// Check that the page fits within the mobile viewport.
async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    // Verify the preceding value using the toBe matcher.
  ).toBe(true);
}

test.beforeEach(async ({ request }) => {
  // The config starts a new server with a unique test database for each run.
  const response = await request.get('/api/todos');
  expect(response.ok()).toBe(true);
  const { todos } = (await response.json()) as { todos: Todo[] };
  // Iterate through const todo of todos.
  for (const todo of todos) {
    expect((await request.delete(`/api/todos/${todo.id}`)).status()).toBe(204);
  }
});

// Define the test case: test('creates, opens a separate document, edits, completes, reopens, and deletes a task', async ({.
test('creates, opens a separate document, edits, completes, reopens, and deletes a task', async ({
  page,
  request,
  // Begin the callback after destructuring its inputs.
}) => {
  await page.goto('/');
  await expect(page.getByText('Good things start with one task.')).toBeVisible();
  // Drive the browser: getByRole('button', { name: 'New task', exact: true }).click().
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Task title').fill('Plan the weekend');
  // Wait for form.getByLabel('Notes').fill('Book a quiet place and invite friends.') to finish.
  await form.getByLabel('Notes').fill('Book a quiet place and invite friends.');
  await form.getByRole('combobox', { name: 'Project', exact: true }).selectOption('personal');
  await form.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('high');
  // Wait for form.getByLabel('Due date').fill('2030-06-15') to finish.
  await form.getByLabel('Due date').fill('2030-06-15');
  await form.getByRole('button', { name: 'Create task' }).click();
  await expect(form).not.toBeVisible();
  // Calculate or store title link.
  const titleLink = page.getByRole('link', { name: 'Plan the weekend', exact: true });
  await expect(titleLink).toBeVisible();

  await page.evaluate(() => {
    // Call Object.assign with the values shown here.
    Object.assign(window, { daymarkNavigationMarker: 'list document' });
  });
  const documentRequest = page.waitForResponse(
    // Inspect a browser response before deciding whether it matches.
    (response) =>
      response.request().isNavigationRequest() &&
      response.request().resourceType() === 'document' &&
      // Require the response to be the separate detail HTML document.
      new URL(response.url()).pathname === '/todo.html',
  );
  await titleLink.click();
  // Assert the observed result for (await documentRequest).status()).toBe(200.
  expect((await documentRequest).status()).toBe(200);
  await expect(page).toHaveURL(/\/todo\.html\?id=[0-9a-f-]{36}$/);
  expect(await page.evaluate(() => 'daymarkNavigationMarker' in window)).toBe(false);
  // Calculate or store the unique task identifier.
  const id = new URL(page.url()).searchParams.get('id')!;
  await expect(page.getByRole('heading', { name: 'Plan the weekend', level: 1 })).toBeVisible();
  await expect(
    // Call page.getByText with the values shown here.
    page.getByText('Book a quiet place and invite friends.', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Edit task', exact: true }).click();
  // Wait for form.getByLabel('Task title').fill('Plan the long weekend') to finish.
  await form.getByLabel('Task title').fill('Plan the long weekend');
  await form.getByLabel('Notes').fill('The booking is confirmed.');
  await form.getByRole('combobox', { name: 'Project', exact: true }).selectOption('work');
  // Wait for form.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('low') to finish.
  await form.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('low');
  await form.getByLabel('Due date').fill('');
  await form.getByRole('button', { name: 'Save changes' }).click();
  // Assert the observed result for form).not.toBeVisible(.
  await expect(form).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Plan the long weekend', level: 1 }),
    // Verify the preceding value using the toBeVisible matcher.
  ).toBeVisible();
  await expect(page).toHaveTitle(/Plan the long weekend/);
  await expect(page.getByText('The booking is confirmed.', { exact: true })).toBeVisible();

  // Drive the browser: getByRole('button', { name: /Mark this task as complete/ }).click().
  await page.getByRole('button', { name: /Mark this task as complete/ }).click();
  await expect(page.getByRole('button', { name: /Click to reopen this task/ })).toHaveAttribute(
    'aria-pressed',
    // Supply the literal value 'true'.
    'true',
  );
  await page.reload();
  // Assert the observed result for page.getByRole('button', { name: /Click to reopen this task/ })).toBeVisible(.
  await expect(page.getByRole('button', { name: /Click to reopen this task/ })).toBeVisible();
  const saved = (await (await request.get(`/api/todos/${id}`)).json()).todo as Todo;
  expect(saved).toMatchObject({
    // Specify the task title.
    title: 'Plan the long weekend',
    description: 'The booking is confirmed.',
    project: 'work',
    // Specify the task urgency.
    priority: 'low',
    dueDate: null,
    completed: true,
  });
  // Assert the observed result for saved.completedAt).toBeTruthy(.
  expect(saved.completedAt).toBeTruthy();

  await page.getByRole('button', { name: /Click to reopen this task/ }).click();
  await expect(page.getByRole('button', { name: /Mark this task as complete/ })).toHaveAttribute(
    // Supply the literal value 'aria-pressed'.
    'aria-pressed',
    'false',
  );
  // Drive the browser: getByRole('button', { name: 'Delete task', exact: true }).click().
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await form.getByRole('button', { name: 'Keep task' }).click();
  await expect(form).not.toBeVisible();
  // Assert the observed result for .
  await expect(
    page.getByRole('heading', { name: 'Plan the long weekend', level: 1 }),
  ).toBeVisible();
  // Drive the browser: getByRole('button', { name: 'Delete task', exact: true }).click().
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  await form.getByRole('button', { name: 'Delete task', exact: true }).click();
  await expect(page).toHaveURL('/');
  // Assert the observed result for page.getByText('Good things start with one task.')).toBeVisible(.
  await expect(page.getByText('Good things start with one task.')).toBeVisible();
  expect((await request.get(`/api/todos/${id}`)).status()).toBe(404);
});

// Iterate through const scenario of [.
for (const scenario of [
  { query: '', message: 'This page needs a task ID.' },
  { query: '?id=invalid', message: 'This task link has an invalid ID.' },
  // Pair this detail-page query string with the error message it should display.
  { query: '?id=00000000-0000-4000-8000-000000000000', message: 'This task could not be found.' },
]) {
  test(`shows an actionable detail error for ${scenario.query || 'a missing id'}`, async ({
    page,
    // Begin the callback after destructuring its inputs.
  }) => {
    await page.goto(`/todo.html${scenario.query}`);
    await expect(page.getByRole('alert')).toContainText(scenario.message);
    // Drive the browser: getByRole('link', { name: 'Back to all tasks' }).click().
    await page.getByRole('link', { name: 'Back to all tasks' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeVisible();
  });
}

// Define the test case: test('combines search, status and priority filters, sorting, and project/date views', async ({.
test('combines search, status and priority filters, sorting, and project/date views', async ({
  page,
  request,
  // Begin the callback after destructuring its inputs.
}) => {
  await page.goto('/');
  const today = await page.evaluate(() => {
    // Calculate or store date.
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  // Wait for createTask(request, { to finish.
  await createTask(request, {
    title: 'Review proposal',
    description: 'Budget review for launch',
    // Specify the task urgency.
    priority: 'high',
    project: 'work',
    dueDate: today,
  });
  // Wait for createTask(request, { to finish.
  await createTask(request, {
    title: 'Read a chapter',
    description: 'Budget for a little quiet time',
    // Specify the task urgency.
    priority: 'low',
    project: 'personal',
    dueDate: '2099-12-31',
  });
  // Calculate or store finished.
  const finished = await createTask(request, {
    title: 'Finish lesson',
    priority: 'medium',
    // Specify the task category.
    project: 'learning',
  });
  expect(
    // Send the completion update and inspect whether the HTTP response succeeded.
    (await request.patch(`/api/todos/${finished.id}`, { data: { completed: true } })).ok(),
  ).toBe(true);
  await page.reload();
  // Calculate or store titles.
  const titles = page.locator('.task-title');
  await expect(titles).toHaveCount(3);
  await page.getByLabel('Search tasks').fill('BUDGET');
  // Assert the observed result for titles).toHaveCount(2.
  await expect(titles).toHaveCount(2);
  await page.getByLabel('Filter priority').selectOption('high');
  await expect(titles).toHaveText(['Review proposal']);
  // Drive the browser: getByRole('button', { name: 'Completed', exact: true }).click().
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(page.getByText('No tasks match this view.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'View all tasks' }).click();
  // Assert the observed result for titles).toHaveCount(3.
  await expect(titles).toHaveCount(3);
  await expect(page.getByLabel('Search tasks')).toHaveValue('');
  await expect(page.getByLabel('Filter priority')).toHaveValue('all');
  // Drive the browser: getByLabel('Sort tasks').selectOption('priority').
  await page.getByLabel('Sort tasks').selectOption('priority');
  await expect(titles).toHaveText(['Review proposal', 'Finish lesson', 'Read a chapter']);
  await page.getByRole('button', { name: 'Active', exact: true }).click();
  // Assert the observed result for titles).toHaveText(['Review proposal', 'Read a chapter'].
  await expect(titles).toHaveText(['Review proposal', 'Read a chapter']);
  await page.getByLabel('Sort tasks').selectOption('dueDate');
  await expect(titles).toHaveText(['Review proposal', 'Read a chapter']);

  // Drive the browser: getByRole('link', { name: 'work', exact: true }).click().
  await page.getByRole('link', { name: 'work', exact: true }).click();
  await expect(page).toHaveURL('/?project=work');
  await expect(titles).toHaveText(['Review proposal']);
  // Drive the browser: getByRole('link', { name: 'Today', exact: true }).click().
  await page.getByRole('link', { name: 'Today', exact: true }).click();
  await expect(titles).toHaveText(['Review proposal']);
  await page.getByRole('link', { name: 'Upcoming', exact: true }).click();
  // Assert the observed result for titles).toHaveText(['Read a chapter'].
  await expect(titles).toHaveText(['Read a chapter']);
  await page.getByRole('link', { name: 'Done', exact: true }).click();
  await expect(titles).toHaveText(['Finish lesson']);
});

// Define the test case: test('supports creating and opening tasks on mobile without horizontal overflow', async ({.
test('supports creating and opening tasks on mobile without horizontal overflow', async ({
  page,
}) => {
  // Drive the browser: setViewportSize({ width: 390, height: 844 }).
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeVisible();
  // Verify that this page state fits the current viewport.
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // Assert the observed result for page.getByLabel('Task title')).toBeFocused(.
  await expect(page.getByLabel('Task title')).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press('Escape');
  // Assert the observed result for page.getByRole('dialog')).not.toBeVisible(.
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  // Calculate or store the task title.
  const title = 'A mobile task with a deliberately long title to check that text wraps comfortably';
  await page.getByLabel('Task title').fill(title);
  await page.getByRole('button', { name: 'Create task' }).click();
  // Assert the observed result for page.getByRole('dialog')).not.toBeVisible(.
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  // Drive the browser: getByRole('link', { name: title, exact: true }).click().
  await page.getByRole('link', { name: title, exact: true }).click();
  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  // Drive the browser: getByRole('link', { name: 'All', exact: true }).click().
  await page.getByRole('link', { name: 'All', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
});

// Define the test case: test('recovers from a failed list request using the retry action', async ({ page }) .
test('recovers from a failed list request using the retry action', async ({ page }) => {
  await page.route('**/api/todos', (route) =>
    // Call route.fulfill with the values shown here.
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      // Specify the JSON request body.
      body: JSON.stringify({ error: { message: 'Temporarily unavailable. Please retry.' } }),
    }),
  );
  // Drive the browser: goto('/').
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Temporarily unavailable. Please retry.');
  await page.unroute('**/api/todos');
  // Drive the browser: getByRole('button', { name: 'Try again' }).click().
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('alert')).not.toBeVisible();
  await expect(page.getByText('Good things start with one task.')).toBeVisible();
});
