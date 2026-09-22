// Drive a real browser through task workflows, MPA navigation, error recovery, and mobile layout.
// Import the required exports from @playwright/test.
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
// Import compile-time types from ../../shared/types.
import type { CreateTodo, Todo } from '../../shared/types';

// Create a test task through the API and return its saved fields.
async function createTask(request: APIRequestContext, data: CreateTodo): Promise<Todo> {
  // Calculate or store response.
  const response = await request.post('/api/todos', { data });
  // Assert the observed result for response.status()).toBe(201.
  expect(response.status()).toBe(201);
  // Return the computed result to the caller.
  return (await response.json()).todo as Todo;
  // Close the current block or object.
}

// Check that the page fits within the mobile viewport.
async function expectNoHorizontalOverflow(page: Page) {
  // Assert the observed result for .
  expect(
    // Drive the browser: evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),.
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    // Verify the preceding value using the toBe matcher.
  ).toBe(true);
  // Close the current block or object.
}

// Call test.beforeEach with the values shown here.
test.beforeEach(async ({ request }) => {
  // The config starts a new server with a unique test database for each run.
  // Calculate or store response.
  const response = await request.get('/api/todos');
  // Assert the observed result for response.ok()).toBe(true.
  expect(response.ok()).toBe(true);
  // Extract the named values from the returned configuration or API object.
  const { todos } = (await response.json()) as { todos: Todo[] };
  // Iterate through const todo of todos.
  for (const todo of todos) {
    // Assert the observed result for (await request.delete(`/api/todos/${todo.id}`)).status()).toBe(204.
    expect((await request.delete(`/api/todos/${todo.id}`)).status()).toBe(204);
    // Close the current block or object.
  }
  // Close the current block or object.
});

// Define the test case: test('creates, opens a separate document, edits, completes, reopens, and deletes a task', async ({.
test('creates, opens a separate document, edits, completes, reopens, and deletes a task', async ({
  // Supply page to the enclosing expression.
  page,
  // Supply request to the enclosing expression.
  request,
  // Begin the callback after destructuring its inputs.
}) => {
  // Drive the browser: goto('/').
  await page.goto('/');
  // Assert the observed result for page.getByText('Good things start with one task.')).toBeVisible(.
  await expect(page.getByText('Good things start with one task.')).toBeVisible();
  // Drive the browser: getByRole('button', { name: 'New task', exact: true }).click().
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  // Calculate or store form.
  const form = page.getByRole('dialog');
  // Wait for form.getByLabel('Task title').fill('Plan the weekend') to finish.
  await form.getByLabel('Task title').fill('Plan the weekend');
  // Wait for form.getByLabel('Notes').fill('Book a quiet place and invite friends.') to finish.
  await form.getByLabel('Notes').fill('Book a quiet place and invite friends.');
  // Wait for form.getByRole('combobox', { name: 'Project', exact: true }).selectOption('personal') to finish.
  await form.getByRole('combobox', { name: 'Project', exact: true }).selectOption('personal');
  // Wait for form.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('high') to finish.
  await form.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('high');
  // Wait for form.getByLabel('Due date').fill('2030-06-15') to finish.
  await form.getByLabel('Due date').fill('2030-06-15');
  // Wait for form.getByRole('button', { name: 'Create task' }).click() to finish.
  await form.getByRole('button', { name: 'Create task' }).click();
  // Assert the observed result for form).not.toBeVisible(.
  await expect(form).not.toBeVisible();
  // Calculate or store title link.
  const titleLink = page.getByRole('link', { name: 'Plan the weekend', exact: true });
  // Assert the observed result for titleLink).toBeVisible(.
  await expect(titleLink).toBeVisible();

  // A real navigation request and a fresh window prove this is an MPA transition.
  // Drive the browser: evaluate(() => {.
  await page.evaluate(() => {
    // Call Object.assign with the values shown here.
    Object.assign(window, { daymarkNavigationMarker: 'list document' });
    // Close the current block or object.
  });
  // Calculate or store document request.
  const documentRequest = page.waitForResponse(
    // Inspect a browser response before deciding whether it matches.
    (response) =>
      // Send the HTTP response using response.request.
      response.request().isNavigationRequest() &&
      // Send the HTTP response using response.request.
      response.request().resourceType() === 'document' &&
      // Require the response to be the separate detail HTML document.
      new URL(response.url()).pathname === '/todo.html',
    // Finish the current expression or function call.
  );
  // Wait for titleLink.click() to finish.
  await titleLink.click();
  // Assert the observed result for (await documentRequest).status()).toBe(200.
  expect((await documentRequest).status()).toBe(200);
  // Assert the observed result for page).toHaveURL(/\/todo\.html\?id=[0-9a-f-]{36}$/.
  await expect(page).toHaveURL(/\/todo\.html\?id=[0-9a-f-]{36}$/);
  // Assert the observed result for await page.evaluate(() => 'daymarkNavigationMarker' in window)).toBe(false.
  expect(await page.evaluate(() => 'daymarkNavigationMarker' in window)).toBe(false);
  // Calculate or store the unique task identifier.
  const id = new URL(page.url()).searchParams.get('id')!;
  // Assert the observed result for page.getByRole('heading', { name: 'Plan the weekend', level: 1 })).toBeVisible(.
  await expect(page.getByRole('heading', { name: 'Plan the weekend', level: 1 })).toBeVisible();
  // Assert the observed result for .
  await expect(
    // Call page.getByText with the values shown here.
    page.getByText('Book a quiet place and invite friends.', { exact: true }),
    // Verify the preceding value using the toBeVisible matcher.
  ).toBeVisible();

  // Drive the browser: getByRole('button', { name: 'Edit task', exact: true }).click().
  await page.getByRole('button', { name: 'Edit task', exact: true }).click();
  // Wait for form.getByLabel('Task title').fill('Plan the long weekend') to finish.
  await form.getByLabel('Task title').fill('Plan the long weekend');
  // Wait for form.getByLabel('Notes').fill('The booking is confirmed.') to finish.
  await form.getByLabel('Notes').fill('The booking is confirmed.');
  // Wait for form.getByRole('combobox', { name: 'Project', exact: true }).selectOption('work') to finish.
  await form.getByRole('combobox', { name: 'Project', exact: true }).selectOption('work');
  // Wait for form.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('low') to finish.
  await form.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('low');
  // Wait for form.getByLabel('Due date').fill('') to finish.
  await form.getByLabel('Due date').fill('');
  // Wait for form.getByRole('button', { name: 'Save changes' }).click() to finish.
  await form.getByRole('button', { name: 'Save changes' }).click();
  // Assert the observed result for form).not.toBeVisible(.
  await expect(form).not.toBeVisible();
  // Assert the observed result for .
  await expect(
    // Call page.getByRole with the values shown here.
    page.getByRole('heading', { name: 'Plan the long weekend', level: 1 }),
    // Verify the preceding value using the toBeVisible matcher.
  ).toBeVisible();
  // Assert the observed result for page).toHaveTitle(/Plan the long weekend/.
  await expect(page).toHaveTitle(/Plan the long weekend/);
  // Assert the observed result for page.getByText('The booking is confirmed.', { exact: true })).toBeVisible(.
  await expect(page.getByText('The booking is confirmed.', { exact: true })).toBeVisible();

  // Drive the browser: getByRole('button', { name: /Mark this task as complete/ }).click().
  await page.getByRole('button', { name: /Mark this task as complete/ }).click();
  // Assert the observed result for page.getByRole('button', { name: /Click to reopen this task/ })).toHaveAttribute(.
  await expect(page.getByRole('button', { name: /Click to reopen this task/ })).toHaveAttribute(
    // Supply the literal value 'aria-pressed'.
    'aria-pressed',
    // Supply the literal value 'true'.
    'true',
    // Finish the current expression or function call.
  );
  // Drive the browser: reload().
  await page.reload();
  // Assert the observed result for page.getByRole('button', { name: /Click to reopen this task/ })).toBeVisible(.
  await expect(page.getByRole('button', { name: /Click to reopen this task/ })).toBeVisible();
  // Calculate or store the task returned after a successful save.
  const saved = (await (await request.get(`/api/todos/${id}`)).json()).todo as Todo;
  // Assert the observed result for saved).toMatchObject({.
  expect(saved).toMatchObject({
    // Specify the task title.
    title: 'Plan the long weekend',
    // Specify the task notes.
    description: 'The booking is confirmed.',
    // Specify the task category.
    project: 'work',
    // Specify the task urgency.
    priority: 'low',
    // Specify the optional calendar due date.
    dueDate: null,
    // Specify whether the task is finished.
    completed: true,
    // Close the current block or object.
  });
  // Assert the observed result for saved.completedAt).toBeTruthy(.
  expect(saved.completedAt).toBeTruthy();

  // Drive the browser: getByRole('button', { name: /Click to reopen this task/ }).click().
  await page.getByRole('button', { name: /Click to reopen this task/ }).click();
  // Assert the observed result for page.getByRole('button', { name: /Mark this task as complete/ })).toHaveAttribute(.
  await expect(page.getByRole('button', { name: /Mark this task as complete/ })).toHaveAttribute(
    // Supply the literal value 'aria-pressed'.
    'aria-pressed',
    // Supply the literal value 'false'.
    'false',
    // Finish the current expression or function call.
  );
  // Drive the browser: getByRole('button', { name: 'Delete task', exact: true }).click().
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  // Wait for form.getByRole('button', { name: 'Keep task' }).click() to finish.
  await form.getByRole('button', { name: 'Keep task' }).click();
  // Assert the observed result for form).not.toBeVisible(.
  await expect(form).not.toBeVisible();
  // Assert the observed result for .
  await expect(
    // Call page.getByRole with the values shown here.
    page.getByRole('heading', { name: 'Plan the long weekend', level: 1 }),
    // Verify the preceding value using the toBeVisible matcher.
  ).toBeVisible();
  // Drive the browser: getByRole('button', { name: 'Delete task', exact: true }).click().
  await page.getByRole('button', { name: 'Delete task', exact: true }).click();
  // Wait for form.getByRole('button', { name: 'Delete task', exact: true }).click() to finish.
  await form.getByRole('button', { name: 'Delete task', exact: true }).click();
  // Assert the observed result for page).toHaveURL('/'.
  await expect(page).toHaveURL('/');
  // Assert the observed result for page.getByText('Good things start with one task.')).toBeVisible(.
  await expect(page.getByText('Good things start with one task.')).toBeVisible();
  // Assert the observed result for (await request.get(`/api/todos/${id}`)).status()).toBe(404.
  expect((await request.get(`/api/todos/${id}`)).status()).toBe(404);
  // Close the current block or object.
});

// Iterate through const scenario of [.
for (const scenario of [
  // Pair this detail-page query string with the error message it should display.
  { query: '', message: 'This page needs a task ID.' },
  // Pair this detail-page query string with the error message it should display.
  { query: '?id=invalid', message: 'This task link has an invalid ID.' },
  // Pair this detail-page query string with the error message it should display.
  { query: '?id=00000000-0000-4000-8000-000000000000', message: 'This task could not be found.' },
  // Begin the loop body for each scenario in the preceding table.
]) {
  // Define the test case: test(`shows an actionable detail error for ${scenario.query || 'a missing id'}`, async ({.
  test(`shows an actionable detail error for ${scenario.query || 'a missing id'}`, async ({
    // Supply page to the enclosing expression.
    page,
    // Begin the callback after destructuring its inputs.
  }) => {
    // Drive the browser: goto(`/todo.html${scenario.query}`).
    await page.goto(`/todo.html${scenario.query}`);
    // Assert the observed result for page.getByRole('alert')).toContainText(scenario.message.
    await expect(page.getByRole('alert')).toContainText(scenario.message);
    // Drive the browser: getByRole('link', { name: 'Back to all tasks' }).click().
    await page.getByRole('link', { name: 'Back to all tasks' }).click();
    // Assert the observed result for page).toHaveURL('/'.
    await expect(page).toHaveURL('/');
    // Assert the observed result for page.getByRole('button', { name: 'New task', exact: true })).toBeVisible(.
    await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeVisible();
    // Close the current block or object.
  });
  // Close the current block or object.
}

// Define the test case: test('combines search, status and priority filters, sorting, and project/date views', async ({.
test('combines search, status and priority filters, sorting, and project/date views', async ({
  // Supply page to the enclosing expression.
  page,
  // Supply request to the enclosing expression.
  request,
  // Begin the callback after destructuring its inputs.
}) => {
  // Drive the browser: goto('/').
  await page.goto('/');
  // Calculate or store today.
  const today = await page.evaluate(() => {
    // Calculate or store date.
    const date = new Date();
    // Build the YYYY-MM-DD string from local calendar components.
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    // Close the current block or object.
  });
  // Wait for createTask(request, { to finish.
  await createTask(request, {
    // Specify the task title.
    title: 'Review proposal',
    // Specify the task notes.
    description: 'Budget review for launch',
    // Specify the task urgency.
    priority: 'high',
    // Specify the task category.
    project: 'work',
    // Specify the optional calendar due date.
    dueDate: today,
    // Close the current block or object.
  });
  // Wait for createTask(request, { to finish.
  await createTask(request, {
    // Specify the task title.
    title: 'Read a chapter',
    // Specify the task notes.
    description: 'Budget for a little quiet time',
    // Specify the task urgency.
    priority: 'low',
    // Specify the task category.
    project: 'personal',
    // Specify the optional calendar due date.
    dueDate: '2099-12-31',
    // Close the current block or object.
  });
  // Calculate or store finished.
  const finished = await createTask(request, {
    // Specify the task title.
    title: 'Finish lesson',
    // Specify the task urgency.
    priority: 'medium',
    // Specify the task category.
    project: 'learning',
    // Close the current block or object.
  });
  // Assert the observed result for .
  expect(
    // Send the completion update and inspect whether the HTTP response succeeded.
    (await request.patch(`/api/todos/${finished.id}`, { data: { completed: true } })).ok(),
    // Verify the preceding value using the toBe matcher.
  ).toBe(true);
  // Drive the browser: reload().
  await page.reload();
  // Calculate or store titles.
  const titles = page.locator('.task-title');
  // Assert the observed result for titles).toHaveCount(3.
  await expect(titles).toHaveCount(3);
  // Drive the browser: getByLabel('Search tasks').fill('BUDGET').
  await page.getByLabel('Search tasks').fill('BUDGET');
  // Assert the observed result for titles).toHaveCount(2.
  await expect(titles).toHaveCount(2);
  // Drive the browser: getByLabel('Filter priority').selectOption('high').
  await page.getByLabel('Filter priority').selectOption('high');
  // Assert the observed result for titles).toHaveText(['Review proposal'].
  await expect(titles).toHaveText(['Review proposal']);
  // Drive the browser: getByRole('button', { name: 'Completed', exact: true }).click().
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  // Assert the observed result for page.getByText('No tasks match this view.', { exact: false })).toBeVisible(.
  await expect(page.getByText('No tasks match this view.', { exact: false })).toBeVisible();
  // Drive the browser: getByRole('button', { name: 'View all tasks' }).click().
  await page.getByRole('button', { name: 'View all tasks' }).click();
  // Assert the observed result for titles).toHaveCount(3.
  await expect(titles).toHaveCount(3);
  // Assert the observed result for page.getByLabel('Search tasks')).toHaveValue(''.
  await expect(page.getByLabel('Search tasks')).toHaveValue('');
  // Assert the observed result for page.getByLabel('Filter priority')).toHaveValue('all'.
  await expect(page.getByLabel('Filter priority')).toHaveValue('all');
  // Drive the browser: getByLabel('Sort tasks').selectOption('priority').
  await page.getByLabel('Sort tasks').selectOption('priority');
  // Assert the observed result for titles).toHaveText(['Review proposal', 'Finish lesson', 'Read a chapter'].
  await expect(titles).toHaveText(['Review proposal', 'Finish lesson', 'Read a chapter']);
  // Drive the browser: getByRole('button', { name: 'Active', exact: true }).click().
  await page.getByRole('button', { name: 'Active', exact: true }).click();
  // Assert the observed result for titles).toHaveText(['Review proposal', 'Read a chapter'].
  await expect(titles).toHaveText(['Review proposal', 'Read a chapter']);
  // Drive the browser: getByLabel('Sort tasks').selectOption('dueDate').
  await page.getByLabel('Sort tasks').selectOption('dueDate');
  // Assert the observed result for titles).toHaveText(['Review proposal', 'Read a chapter'].
  await expect(titles).toHaveText(['Review proposal', 'Read a chapter']);

  // Drive the browser: getByRole('link', { name: 'work', exact: true }).click().
  await page.getByRole('link', { name: 'work', exact: true }).click();
  // Assert the observed result for page).toHaveURL('/?project=work'.
  await expect(page).toHaveURL('/?project=work');
  // Assert the observed result for titles).toHaveText(['Review proposal'].
  await expect(titles).toHaveText(['Review proposal']);
  // Drive the browser: getByRole('link', { name: 'Today', exact: true }).click().
  await page.getByRole('link', { name: 'Today', exact: true }).click();
  // Assert the observed result for titles).toHaveText(['Review proposal'].
  await expect(titles).toHaveText(['Review proposal']);
  // Drive the browser: getByRole('link', { name: 'Upcoming', exact: true }).click().
  await page.getByRole('link', { name: 'Upcoming', exact: true }).click();
  // Assert the observed result for titles).toHaveText(['Read a chapter'].
  await expect(titles).toHaveText(['Read a chapter']);
  // Drive the browser: getByRole('link', { name: 'Done', exact: true }).click().
  await page.getByRole('link', { name: 'Done', exact: true }).click();
  // Assert the observed result for titles).toHaveText(['Finish lesson'].
  await expect(titles).toHaveText(['Finish lesson']);
  // Close the current block or object.
});

// Define the test case: test('supports creating and opening tasks on mobile without horizontal overflow', async ({.
test('supports creating and opening tasks on mobile without horizontal overflow', async ({
  // Supply page to the enclosing expression.
  page,
  // Begin the callback after destructuring its inputs.
}) => {
  // Drive the browser: setViewportSize({ width: 390, height: 844 }).
  await page.setViewportSize({ width: 390, height: 844 });
  // Drive the browser: goto('/').
  await page.goto('/');
  // Assert the observed result for page.getByRole('button', { name: 'New task', exact: true })).toBeVisible(.
  await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeVisible();
  // Verify that this page state fits the current viewport.
  await expectNoHorizontalOverflow(page);
  // Drive the browser: getByRole('button', { name: 'New task', exact: true }).click().
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  // Assert the observed result for page.getByRole('dialog')).toBeVisible(.
  await expect(page.getByRole('dialog')).toBeVisible();
  // Assert the observed result for page.getByLabel('Task title')).toBeFocused(.
  await expect(page.getByLabel('Task title')).toBeFocused();
  // Verify that this page state fits the current viewport.
  await expectNoHorizontalOverflow(page);
  // Drive the browser: keyboard.press('Escape').
  await page.keyboard.press('Escape');
  // Assert the observed result for page.getByRole('dialog')).not.toBeVisible(.
  await expect(page.getByRole('dialog')).not.toBeVisible();
  // Assert the observed result for page.getByRole('button', { name: 'New task', exact: true })).toBeFocused(.
  await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeFocused();
  // Drive the browser: getByRole('button', { name: 'New task', exact: true }).click().
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  // Calculate or store the task title.
  const title = 'A mobile task with a deliberately long title to check that text wraps comfortably';
  // Drive the browser: getByLabel('Task title').fill(title).
  await page.getByLabel('Task title').fill(title);
  // Drive the browser: getByRole('button', { name: 'Create task' }).click().
  await page.getByRole('button', { name: 'Create task' }).click();
  // Assert the observed result for page.getByRole('dialog')).not.toBeVisible(.
  await expect(page.getByRole('dialog')).not.toBeVisible();
  // Assert the observed result for page.getByRole('link', { name: title, exact: true })).toBeVisible(.
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
  // Verify that this page state fits the current viewport.
  await expectNoHorizontalOverflow(page);
  // Drive the browser: getByRole('link', { name: title, exact: true }).click().
  await page.getByRole('link', { name: title, exact: true }).click();
  // Assert the observed result for page.getByRole('heading', { name: title, level: 1 })).toBeVisible(.
  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
  // Verify that this page state fits the current viewport.
  await expectNoHorizontalOverflow(page);
  // Drive the browser: getByRole('link', { name: 'All', exact: true }).click().
  await page.getByRole('link', { name: 'All', exact: true }).click();
  // Assert the observed result for page).toHaveURL('/'.
  await expect(page).toHaveURL('/');
  // Assert the observed result for page.getByRole('link', { name: title, exact: true })).toBeVisible(.
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
  // Close the current block or object.
});

// Define the test case: test('recovers from a failed list request using the retry action', async ({ page }) .
test('recovers from a failed list request using the retry action', async ({ page }) => {
  // Drive the browser: route('** /api/todos', (route) =>.
  await page.route(
    '**/api/todos',
    (route) =>
      // Call route.fulfill with the values shown here.
      route.fulfill({
        // Specify the completion filter or HTTP status.
        status: 503,
        // Specify content type.
        contentType: 'application/json',
        // Specify the JSON request body.
        body: JSON.stringify({ error: { message: 'Temporarily unavailable. Please retry.' } }),
        // Close the current block or object.
      }),
    // Finish the current expression or function call.
  );
  // Drive the browser: goto('/').
  await page.goto('/');
  // Assert the observed result for page.getByRole('alert')).toContainText('Temporarily unavailable. Please retry.'.
  await expect(page.getByRole('alert')).toContainText('Temporarily unavailable. Please retry.');
  // Drive the browser: unroute('** /api/todos').
  await page.unroute('**/api/todos');
  // Drive the browser: getByRole('button', { name: 'Try again' }).click().
  await page.getByRole('button', { name: 'Try again' }).click();
  // Assert the observed result for page.getByRole('alert')).not.toBeVisible(.
  await expect(page.getByRole('alert')).not.toBeVisible();
  // Assert the observed result for page.getByText('Good things start with one task.')).toBeVisible(.
  await expect(page.getByText('Good things start with one task.')).toBeVisible();
  // Close the current block or object.
});
