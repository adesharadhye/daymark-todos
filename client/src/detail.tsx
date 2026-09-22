// Mount the separate detail document and load the task identified by its URL query parameter.
// Import the required exports from react.
import { StrictMode, useCallback, useEffect, useState } from 'react';
// Import the required exports from react-dom/client.
import { createRoot } from 'react-dom/client';
// Import the required exports from lucide-react.
import {
  // Bring ArrowLeft into scope from lucide-react.
  ArrowLeft,
  // Bring CalendarDays into scope from lucide-react.
  CalendarDays,
  // Bring Check into scope from lucide-react.
  Check,
  // Bring CheckCheck into scope from lucide-react.
  CheckCheck,
  // Bring Clock3 into scope from lucide-react.
  Clock3,
  // Bring FileText into scope from lucide-react.
  FileText,
  // Bring Flag into scope from lucide-react.
  Flag,
  // Bring Folder into scope from lucide-react.
  Folder,
  // Bring Pencil into scope from lucide-react.
  Pencil,
  // Bring Plus into scope from lucide-react.
  Plus,
  // Bring Trash2 into scope from lucide-react.
  Trash2,
  // Finish selecting the exports from lucide-react.
} from 'lucide-react';
// Import compile-time types from ../../shared/types.
import type { CreateTodo, Todo } from '../../shared/types';
// Import the required exports from ./api.
import { api } from './api';
// Import the required exports from ./components.
import {
  // Bring DeleteDialog into scope from ./components.
  DeleteDialog,
  // Bring ErrorState into scope from ./components.
  ErrorState,
  // Bring LoadingState into scope from ./components.
  LoadingState,
  // Bring PriorityBadge into scope from ./components.
  PriorityBadge,
  // Bring ProjectBadge into scope from ./components.
  ProjectBadge,
  // Bring Shell into scope from ./components.
  Shell,
  // Bring TaskForm into scope from ./components.
  TaskForm,
  // Bring Toast into scope from ./components.
  Toast,
  // Finish selecting the exports from ./components.
} from './components';
// Import the required exports from ./helpers.
import { dueLabel, messageOf, overdue, timestamp } from './helpers';
// Import the required exports from ./styles.css.
import './styles.css';

// Calculate or store the unique task identifier.
const id = new URLSearchParams(window.location.search).get('id');
// Check that the detail URL contains a plausible UUID before fetching it.
const validId = !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Load and manage the task referenced in this document’s query string.
function DetailPage() {
  // Track the current task object; setTodo changes that value.
  const [todo, setTodo] = useState<Todo | null>(null);
  // Track whether data is still loading; setLoading changes that value.
  const [loading, setLoading] = useState(validId);
  // Track the error message or error object; setError changes that value.
  const [error, setError] = useState(
    // Choose the missing-ID error before checking the UUID format.
    !id
      ? // Use this value when the preceding condition is true.
        'This page needs a task ID. Open a task from your list to get started.'
      : // Use this alternative when the preceding condition is false.
        !validId
        ? // Use this value when the preceding condition is true.
          'This task link has an invalid ID. Open a task from your list.'
        : // Use this alternative when the preceding condition is false.
          '',
    // Finish the current expression or function call.
  );
  // Track the task or state selected for editing; setEditing changes that value.
  const [editing, setEditing] = useState(false);
  // Track whether the detail page is creating a new task; setCreating changes that value.
  const [creating, setCreating] = useState(false);
  // Track the task or state awaiting delete confirmation; setDeleting changes that value.
  const [deleting, setDeleting] = useState(false);
  // Track whether a save or delete is in progress; setBusy changes that value.
  const [busy, setBusy] = useState(false);
  // Track the message from a failed task action; setActionError changes that value.
  const [actionError, setActionError] = useState('');
  // Track the success notification text; setNotice changes that value.
  const [notice, setNotice] = useState('');
  // Keep the dismissNotice callback stable until its dependencies change.
  const dismissNotice = useCallback(() => setNotice(''), []);
  // Keep the load callback stable until its dependencies change.
  const load = useCallback(async () => {
    // Avoid making an API request when the detail link has no valid ID.
    if (!id || !validId) return;
    // Update whether data is still loading in React state.
    setLoading(true);
    // Update the error message or error object in React state.
    setError('');
    // Attempt the operation so failures can be handled below.
    try {
      // Calculate or store task.
      const task = await api.get(id);
      // Update the current task object in React state.
      setTodo(task);
      // Show the current task name in the browser tab.
      document.title = `${task.title} · Daymark`;
      // Handle a failure from the preceding operation.
    } catch (error) {
      // Update the error message or error object in React state.
      setError(messageOf(error));
      // Run cleanup whether the operation succeeds or fails.
    } finally {
      // Update whether data is still loading in React state.
      setLoading(false);
      // Close the current block or object.
    }
    // Use an empty dependency list so this callback remains stable across renders.
  }, []);
  // Synchronize browser side effects with the component’s dependencies.
  useEffect(() => {
    // Start the asynchronous load; its own handler reports failures to the interface.
    void load();
    // Use load as the dependencies that trigger this React hook to update.
  }, [load]);
  // Save form data and navigate when a new task is created.
  async function save(data: CreateTodo) {
    // Take this branch when the condition holds: creating.
    if (creating) {
      // Calculate or store created.
      const created = await api.create(data);
      // Load the destination as a new document, preserving MPA navigation.
      window.location.assign(`/todo.html?id=${created.id}`);
      // Handle the alternative condition.
    } else if (todo) {
      // Calculate or store the task returned after a successful save.
      const saved = await api.update(todo.id, data);
      // Update the current task object in React state.
      setTodo(saved);
      // Show the current task name in the browser tab.
      document.title = `${saved.title} · Daymark`;
      // Update the success notification text in React state.
      setNotice('Task updated. A little more clarity.');
      // Close the current block or object.
    }
    // Close the current block or object.
  }
  // Persist the opposite completion state and update the interface.
  async function toggle() {
    // Return a not-found response when the requested task does not exist.
    if (!todo) return;
    // Update whether a save or delete is in progress in React state.
    setBusy(true);
    // Update the message from a failed task action in React state.
    setActionError('');
    // Attempt the operation so failures can be handled below.
    try {
      // Calculate or store the task returned after a successful save.
      const saved = await api.update(todo.id, { completed: !todo.completed });
      // Update the current task object in React state.
      setTodo(saved);
      // Update the success notification text in React state.
      setNotice(saved.completed ? 'A small win. Nicely done.' : 'Task reopened. You’ve got this.');
      // Handle a failure from the preceding operation.
    } catch (error) {
      // Update the message from a failed task action in React state.
      setActionError(messageOf(error));
      // Run cleanup whether the operation succeeds or fails.
    } finally {
      // Update whether a save or delete is in progress in React state.
      setBusy(false);
      // Close the current block or object.
    }
    // Close the current block or object.
  }
  // Return the following React markup or multiline result.
  return (
    // Render the reusable Shell component.
    <Shell
      // Supply detail to the enclosing expression.
      detail
      // Give this control a way to open a new-task form.
      onAdd={() => {
        // Update whether the detail page is creating a new task in React state.
        setCreating(true);
        // Update the task or state selected for editing in React state.
        setEditing(false);
        // Close the current block or object.
      }}
      // Finish the opening tag and begin its child content.
    >
      {/* Render the a element. */}
      <a className="back-link" href="/">
        {/* Render the reusable ArrowLeft component. */}
        <ArrowLeft size={16} />
        {/* Display the text: Back to all tasks. */}
        Back to all tasks
        {/* Finish the a element. */}
      </a>
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {loading ? (
        // Render the reusable LoadingState component.
        <LoadingState />
      ) : // If loading has finished, display a request error when present.
      error ? (
        // Render the reusable ErrorState component.
        <ErrorState message={error} onRetry={validId ? () => void load() : undefined} />
      ) : (
        // Render the alternative content when the condition is false.
        // Render task details only after a task has been loaded.
        todo && (
          // Group these React children without adding a wrapper element.
          <>
            {/* Render the section element. */}
            <section className="detail-intro">
              {/* Render the div element. */}
              <div className="eyebrow">ONE THING AT A TIME</div>
              {/* Render the div element. */}
              <div className="detail-title-row">
                {/* Render the h1 element. */}
                <h1 className={todo.completed ? 'finished-title' : ''}>{todo.title}</h1>
                {/* Render the button element. */}
                <button
                  // Choose the CSS classes for this element.
                  className="button secondary"
                  // Prevent this action while its request is already in progress.
                  disabled={busy}
                  // Run this handler when the user activates the control.
                  onClick={() => {
                    // Update whether the detail page is creating a new task in React state.
                    setCreating(false);
                    // Update the task or state selected for editing in React state.
                    setEditing(true);
                    // Close the current block or object.
                  }}
                  // Finish the opening tag and begin its child content.
                >
                  {/* Render the reusable Pencil component. */}
                  <Pencil size={16} />
                  {/* Display the text: Edit task. */}
                  Edit task
                  {/* Finish the button element. */}
                </button>
                {/* Finish the div element. */}
              </div>
              {/* Render the div element. */}
              <div className="detail-tags">
                {/* Render the reusable ProjectBadge component. */}
                <ProjectBadge project={todo.project} />
                {/* Render the reusable PriorityBadge component. */}
                <PriorityBadge priority={todo.priority} />
                {/* Render the span element. */}
                <span className={`status-badge ${todo.completed ? 'done' : ''}`}>
                  {/* Evaluate this JavaScript expression inside the React markup. */}
                  {todo.completed ? <CheckCheck size={13} /> : <Clock3 size={13} />}
                  {/* Evaluate this JavaScript expression inside the React markup. */}
                  {todo.completed ? 'Completed' : 'In progress'}
                  {/* Finish the span element. */}
                </span>
                {/* Finish the div element. */}
              </div>
              {/* Finish the section element. */}
            </section>
            {/* Evaluate this JavaScript expression inside the React markup. */}
            {actionError && (
              // Render the p element.
              <p className="action-error" role="alert">
                {/* Evaluate this JavaScript expression inside the React markup. */}
                {actionError}
                {/* Finish the p element. */}
              </p>
              // Close the current block or object.
            )}
            {/* Render the div element. */}
            <div className="detail-grid">
              {/* Render the section element. */}
              <section className="detail-card">
                {/* Render the button element. */}
                <button
                  // Choose the CSS classes for this element.
                  className={`detail-complete ${todo.completed ? 'done' : ''}`}
                  // Run this handler when the user activates the control.
                  onClick={() => void toggle()}
                  // Prevent this action while its request is already in progress.
                  disabled={busy}
                  // Expose the current toggle state to assistive technology.
                  aria-pressed={todo.completed}
                  // Finish the opening tag and begin its child content.
                >
                  {/* Render the span element. */}
                  <span className={`completion-control ${todo.completed ? 'checked' : ''}`}>
                    {/* Evaluate this JavaScript expression inside the React markup. */}
                    {todo.completed && <Check size={14} strokeWidth={3} />}
                    {/* Finish the span element. */}
                  </span>
                  {/* Render the span element. */}
                  <span>
                    {/* Render the strong element. */}
                    <strong>
                      {/* Evaluate this JavaScript expression inside the React markup. */}
                      {busy
                        ? // Use this value when the preceding condition is true.
                          'Saving…'
                        : // Use this alternative when the preceding condition is false.
                          todo.completed
                          ? // Use this value when the preceding condition is true.
                            'One more thing, done.'
                          : // Use this alternative when the preceding condition is false.
                            'Ready for a little win?'}
                      {/* Finish the strong element. */}
                    </strong>
                    {/* Render the small element. */}
                    <small>
                      {/* Evaluate this JavaScript expression inside the React markup. */}
                      {todo.completed ? 'Click to reopen this task' : 'Mark this task as complete'}
                      {/* Finish the small element. */}
                    </small>
                    {/* Finish the span element. */}
                  </span>
                  {/* Evaluate this JavaScript expression inside the React markup. */}
                  {todo.completed && <CheckCheck size={24} />}
                  {/* Finish the button element. */}
                </button>
                {/* Render the div element. */}
                <div className="description-section">
                  {/* Render the h2 element. */}
                  <h2>
                    {/* Render the reusable FileText component. */}
                    <FileText size={17} />
                    {/* Display the text: The little details. */}
                    The little details
                    {/* Finish the h2 element. */}
                  </h2>
                  {/* Evaluate this JavaScript expression inside the React markup. */}
                  {todo.description ? (
                    // Render the p element.
                    <p className="task-description">{todo.description}</p>
                  ) : (
                    // Render the alternative content when the condition is false.
                    // Render the div element.
                    <div className="no-description">
                      {/* Render the p element. */}
                      <p>A little context can go a long way.</p>
                      {/* Render the button element. */}
                      <button className="text-button" onClick={() => setEditing(true)}>
                        {/* Render the reusable Plus component. */}
                        <Plus size={14} />
                        {/* Display the text: Add some notes. */}
                        Add some notes
                        {/* Finish the button element. */}
                      </button>
                      {/* Finish the div element. */}
                    </div>
                    // Close the current block or object.
                  )}
                  {/* Finish the div element. */}
                </div>
                {/* Render the div element. */}
                <div className="detail-card-footer">
                  {/* Render the span element. */}
                  <span>
                    {/* Render the reusable Clock3 component. */}
                    <Clock3 size={14} />
                    {/* Display the text: Updated {timestamp(todo.updatedAt)}. */}
                    Updated {timestamp(todo.updatedAt)}
                    {/* Finish the span element. */}
                  </span>
                  {/* Finish the div element. */}
                </div>
                {/* Finish the section element. */}
              </section>
              {/* Render the aside element. */}
              <aside className="detail-card properties">
                {/* Render the h2 element. */}
                <h2>At a glance</h2>
                {/* Render the dl element. */}
                <dl>
                  {/* Render the div element. */}
                  <div>
                    {/* Render the dt element. */}
                    <dt>
                      {/* Render the reusable CalendarDays component. */}
                      <CalendarDays size={16} />
                      {/* Display the text: Due date. */}
                      Due date
                      {/* Finish the dt element. */}
                    </dt>
                    {/* Render the dd element. */}
                    <dd className={overdue(todo) ? 'overdue' : ''}>
                      {/* Evaluate this JavaScript expression inside the React markup. */}
                      {dueLabel(todo.dueDate)}
                      {/* Evaluate this JavaScript expression inside the React markup. */}
                      {overdue(todo) && <small>Overdue</small>}
                      {/* Finish the dd element. */}
                    </dd>
                    {/* Finish the div element. */}
                  </div>
                  {/* Render the div element. */}
                  <div>
                    {/* Render the dt element. */}
                    <dt>
                      {/* Render the reusable Flag component. */}
                      <Flag size={16} />
                      {/* Display the text: Priority. */}
                      Priority
                      {/* Finish the dt element. */}
                    </dt>
                    {/* Render the dd element. */}
                    <dd>
                      {/* Render the reusable PriorityBadge component. */}
                      <PriorityBadge priority={todo.priority} />
                      {/* Finish the dd element. */}
                    </dd>
                    {/* Finish the div element. */}
                  </div>
                  {/* Render the div element. */}
                  <div>
                    {/* Render the dt element. */}
                    <dt>
                      {/* Render the reusable Folder component. */}
                      <Folder size={16} />
                      {/* Display the text: Project. */}
                      Project
                      {/* Finish the dt element. */}
                    </dt>
                    {/* Render the dd element. */}
                    <dd>
                      {/* Render the reusable ProjectBadge component. */}
                      <ProjectBadge project={todo.project} />
                      {/* Finish the dd element. */}
                    </dd>
                    {/* Finish the div element. */}
                  </div>
                  {/* Render the div element. */}
                  <div>
                    {/* Render the dt element. */}
                    <dt>
                      {/* Render the reusable Clock3 component. */}
                      <Clock3 size={16} />
                      {/* Display the text: Created. */}
                      Created
                      {/* Finish the dt element. */}
                    </dt>
                    {/* Render the dd element. */}
                    <dd className="date-property">{timestamp(todo.createdAt)}</dd>
                    {/* Finish the div element. */}
                  </div>
                  {/* Evaluate this JavaScript expression inside the React markup. */}
                  {todo.completedAt && (
                    // Render the div element.
                    <div>
                      {/* Render the dt element. */}
                      <dt>
                        {/* Render the reusable CheckCheck component. */}
                        <CheckCheck size={16} />
                        {/* Display the text: Completed. */}
                        Completed
                        {/* Finish the dt element. */}
                      </dt>
                      {/* Render the dd element. */}
                      <dd className="date-property">{timestamp(todo.completedAt)}</dd>
                      {/* Finish the div element. */}
                    </div>
                    // Close the current block or object.
                  )}
                  {/* Finish the dl element. */}
                </dl>
                {/* Render the button element. */}
                <button
                  // Choose the CSS classes for this element.
                  className="delete-task-button"
                  // Prevent this action while its request is already in progress.
                  disabled={busy}
                  // Run this handler when the user activates the control.
                  onClick={() => setDeleting(true)}
                  // Finish the opening tag and begin its child content.
                >
                  {/* Render the reusable Trash2 component. */}
                  <Trash2 size={15} />
                  {/* Display the text: Delete task. */}
                  Delete task
                  {/* Finish the button element. */}
                </button>
                {/* Finish the aside element. */}
              </aside>
              {/* Finish the div element. */}
            </div>
            {/* Render the div element. */}
            <div className="detail-encouragement">
              {/* Render the span element. */}
              <span>✳</span>
              {/* Render the p element. */}
              <p>
                {/* Display the text: You don’t have to do it all.. */}
                You don’t have to do it all.
                {/* Render the br element. */}
                <br />
                {/* Render the strong element. */}
                <strong>Just the next little thing.</strong>
                {/* Finish the p element. */}
              </p>
              {/* Finish the div element. */}
            </div>
            {/* Finish the React fragment element. */}
          </>
          // Finish the current expression or function call.
        )
        // Close the current block or object.
      )}
      {/* Render the reusable TaskForm component. */}
      <TaskForm
        // Control whether the dialog should be visible.
        open={editing || creating}
        // Pass the task being displayed, edited, or deleted.
        todo={creating ? undefined : (todo ?? undefined)}
        // Tell the parent component how to close this dialog.
        onClose={() => {
          // Update the task or state selected for editing in React state.
          setEditing(false);
          // Update whether the detail page is creating a new task in React state.
          setCreating(false);
          // Close the current block or object.
        }}
        // Give the form the asynchronous task-saving callback.
        onSave={save}
        // Finish this self-closing React element.
      />
      {/* Render the reusable DeleteDialog component. */}
      <DeleteDialog
        // Pass the task being displayed, edited, or deleted.
        todo={deleting ? todo : null}
        // Tell the parent component how to close this dialog.
        onClose={() => setDeleting(false)}
        // Give the confirmation dialog the asynchronous deletion callback.
        onDelete={async () => {
          // Take this branch when the condition holds: todo.
          if (todo) {
            // Wait for the API to confirm permanent deletion.
            await api.delete(todo.id);
            // Load the destination as a new document, preserving MPA navigation.
            window.location.assign('/');
            // Close the current block or object.
          }
          // Close the current block or object.
        }}
        // Finish this self-closing React element.
      />
      {/* Render the reusable Toast component. */}
      <Toast message={notice} onClose={dismissNotice} />
      {/* Finish the Shell element. */}
    </Shell>
    // Finish the current expression or function call.
  );
  // Close the current block or object.
}

// Mount this document’s independent React root.
createRoot(document.getElementById('root')!).render(
  // Render the reusable StrictMode component.
  <StrictMode>
    {/* Render the reusable DetailPage component. */}
    <DetailPage />
    {/* Finish the StrictMode element. */}
  </StrictMode>,
  // Finish the current expression or function call.
);
