// Mount the seperate detail document and load the task identified by its URL query parameter.
import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  // Bring ArrowLeft into scope from lucide-react.
  ArrowLeft,
  CalendarDays,
  Check,
  // Bring CheckCheck into scope from lucide-react.
  CheckCheck,
  Clock3,
  FileText,
  // Bring Flag into scope from lucide-react.
  Flag,
  Folder,
  Pencil,
  // Bring Plus into scope from lucide-react.
  Plus,
  Trash2,
} from 'lucide-react';
// Import compile-time types from ../../shared/types.
import type { CreateTodo, Todo } from '../../shared/types';
import { api } from './api';
import {
  // Bring DeleteDialog into scope from ./components.
  DeleteDialog,
  ErrorState,
  LoadingState,
  // Bring PriorityBadge into scope from ./components.
  PriorityBadge,
  ProjectBadge,
  Shell,
  // Bring TaskForm into scope from ./components.
  TaskForm,
  Toast,
} from './components';
// Import the required exports from ./helpers.
import { dueLabel, messageOf, overdue, timestamp } from './helpers';
import './styles.css';

const id = new URLSearchParams(window.location.search).get('id');
// Check that the detail URL contains a plausible UUID before fetching it.
const validId = !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function DetailPage() {
  const [todo, setTodo] = useState<Todo | null>(null);
  // Track whether data is still loading; setLoading changes that value.
  const [loading, setLoading] = useState(validId);
  const [error, setError] = useState(
    !id
      ? 'This page needs a task ID. Open a task from your list to get started.'
      : !validId
        ? 'This task link has an invalid ID. Open a task from your list.'
        : '',
  );
  // Track the task or state selected for editing; setEditing changes that value.
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Track whether a save or delete is in progress; setBusy changes that value.
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  // Keep the dismissNotice callback stable until its dependencies change.
  const dismissNotice = useCallback(() => setNotice(''), []);
  const load = useCallback(async () => {
    if (!id || !validId) return;
    // Update whether data is still loading in React state.
    setLoading(true);
    setError('');
    try {
      // Calculate or store task.
      const task = await api.get(id);
      setTodo(task);
      document.title = `${task.title} · Daymark`;
      // Handle a failure from the preceding operation.
    } catch (error) {
      setError(messageOf(error));
    } finally {
      // Update whether data is still loading in React state.
      setLoading(false);
    }
  }, []);
  // Synchronize browser side effects with the component’s dependencies.
  useEffect(() => {
    void load();
  }, [load]);
  // Save form data and navigate when a new task is created.
  async function save(data: CreateTodo) {
    if (creating) {
      const created = await api.create(data);
      // Load the destination as a new document, preserving MPA navigation.
      window.location.assign(`/todo.html?id=${created.id}`);
    } else if (todo) {
      const saved = await api.update(todo.id, data);
      // Update the current task object in React state.
      setTodo(saved);
      document.title = `${saved.title} · Daymark`;
      setNotice('Task updated. A little more clarity.');
    }
  }
  // Persist the opposite completion state and update the interface.
  async function toggle() {
    if (!todo) return;
    setBusy(true);
    // Update the message from a failed task action in React state.
    setActionError('');
    try {
      const saved = await api.update(todo.id, { completed: !todo.completed });
      // Update the current task object in React state.
      setTodo(saved);
      setNotice(saved.completed ? 'A small win. Nicely done.' : 'Task reopened. You’ve got this.');
    } catch (error) {
      // Update the message from a failed task action in React state.
      setActionError(messageOf(error));
    } finally {
      setBusy(false);
    }
  }
  // Return the following React markup or multiline result.
  return (
    <Shell
      detail
      // Give this control a way to open a new-task form.
      onAdd={() => {
        setCreating(true);
        setEditing(false);
      }}
    >
      {/* Render the a element. */}
      <a className="back-link" href="/">
        <ArrowLeft size={16} />
        Back to all tasks
      </a>
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        // Render the reusable ErrorState component.
        <ErrorState message={error} onRetry={validId ? () => void load() : undefined} />
      ) : (
        todo && (
          // Group these React children without adding a wrapper element.
          <>
            <section className="detail-intro">
              <div className="eyebrow">ONE THING AT A TIME</div>
              {/* Render the div element. */}
              <div className="detail-title-row">
                <h1 className={todo.completed ? 'finished-title' : ''}>{todo.title}</h1>
                <button
                  // Choose the CSS classes for this element.
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    // Update whether the detail page is creating a new task in React state.
                    setCreating(false);
                    setEditing(true);
                  }}
                >
                  {/* Render the reusable Pencil component. */}
                  <Pencil size={16} />
                  Edit task
                </button>
              </div>
              {/* Render the div element. */}
              <div className="detail-tags">
                <ProjectBadge project={todo.project} />
                <PriorityBadge priority={todo.priority} />
                {/* Render the span element. */}
                <span className={`status-badge ${todo.completed ? 'done' : ''}`}>
                  {todo.completed ? <CheckCheck size={13} /> : <Clock3 size={13} />}
                  {todo.completed ? 'Completed' : 'In progress'}
                </span>
              </div>
            </section>
            {/* Evaluate this JavaScript expression inside the React markup. */}
            {actionError && (
              <p className="action-error" role="alert">
                {actionError}
              </p>
            )}
            {/* Render the div element. */}
            <div className="detail-grid">
              <section className="detail-card">
                <button
                  // Choose the CSS classes for this element.
                  className={`detail-complete ${todo.completed ? 'done' : ''}`}
                  onClick={() => void toggle()}
                  disabled={busy}
                  // Expose the current toggle state to assistive technology.
                  aria-pressed={todo.completed}
                >
                  <span className={`completion-control ${todo.completed ? 'checked' : ''}`}>
                    {/* Evaluate this JavaScript expression inside the React markup. */}
                    {todo.completed && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span>
                    {/* Render the strong element. */}
                    <strong>
                      {busy
                        ? 'Saving…'
                        : todo.completed
                          ? 'One more thing, done.'
                          : 'Ready for a little win?'}
                    </strong>
                    {/* Render the small element. */}
                    <small>
                      {todo.completed ? 'Click to reopen this task' : 'Mark this task as complete'}
                    </small>
                  </span>
                  {/* Evaluate this JavaScript expression inside the React markup. */}
                  {todo.completed && <CheckCheck size={24} />}
                </button>
                <div className="description-section">
                  {/* Render the h2 element. */}
                  <h2>
                    <FileText size={17} />
                    The little details
                  </h2>
                  {/* Evaluate this JavaScript expression inside the React markup. */}
                  {todo.description ? (
                    <p className="task-description">{todo.description}</p>
                  ) : (
                    // Render the alternative content when the condition is false.
                    <div className="no-description">
                      <p>A little context can go a long way.</p>
                      <button className="text-button" onClick={() => setEditing(true)}>
                        {/* Render the reusable Plus component. */}
                        <Plus size={14} />
                        Add some notes
                      </button>
                    </div>
                  )}
                </div>
                {/* Render the div element. */}
                <div className="detail-card-footer">
                  <span>
                    <Clock3 size={14} />
                    {/* Display the text: Updated {timestamp(todo.updatedAt)}. */}
                    Updated {timestamp(todo.updatedAt)}
                  </span>
                </div>
              </section>
              {/* Render the aside element. */}
              <aside className="detail-card properties">
                <h2>At a glance</h2>
                <dl>
                  {/* Render the div element. */}
                  <div>
                    <dt>
                      <CalendarDays size={16} />
                      {/* Display the text: Due date. */}
                      Due date
                    </dt>
                    <dd className={overdue(todo) ? 'overdue' : ''}>
                      {/* Evaluate this JavaScript expression inside the React markup. */}
                      {dueLabel(todo.dueDate)}
                      {overdue(todo) && <small>Overdue</small>}
                    </dd>
                  </div>
                  {/* Render the div element. */}
                  <div>
                    <dt>
                      <Flag size={16} />
                      {/* Display the text: Priority. */}
                      Priority
                    </dt>
                    <dd>
                      {/* Render the reusable PriorityBadge component. */}
                      <PriorityBadge priority={todo.priority} />
                    </dd>
                  </div>
                  {/* Render the div element. */}
                  <div>
                    <dt>
                      <Folder size={16} />
                      {/* Display the text: Project. */}
                      Project
                    </dt>
                    <dd>
                      {/* Render the reusable ProjectBadge component. */}
                      <ProjectBadge project={todo.project} />
                    </dd>
                  </div>
                  {/* Render the div element. */}
                  <div>
                    <dt>
                      <Clock3 size={16} />
                      {/* Display the text: Created. */}
                      Created
                    </dt>
                    <dd className="date-property">{timestamp(todo.createdAt)}</dd>
                  </div>
                  {/* Evaluate this JavaScript expression inside the React markup. */}
                  {todo.completedAt && (
                    <div>
                      <dt>
                        {/* Render the reusable CheckCheck component. */}
                        <CheckCheck size={16} />
                        Completed
                      </dt>
                      {/* Render the dd element. */}
                      <dd className="date-property">{timestamp(todo.completedAt)}</dd>
                    </div>
                  )}
                </dl>
                {/* Render the button element. */}
                <button
                  className="delete-task-button"
                  disabled={busy}
                  // Run this handler when the user activates the control.
                  onClick={() => setDeleting(true)}
                >
                  <Trash2 size={15} />
                  {/* Display the text: Delete task. */}
                  Delete task
                </button>
              </aside>
            </div>
            {/* Render the div element. */}
            <div className="detail-encouragement">
              <span>✳</span>
              <p>
                {/* Display the text: You don’t have to do it all.. */}
                You don’t have to do it all.
                <br />
                <strong>Just the next little thing.</strong>
              </p>
            </div>
          </>
        )
      )}
      {/* Render the reusable TaskForm component. */}
      <TaskForm
        open={editing || creating}
        todo={creating ? undefined : (todo ?? undefined)}
        // Tell the parent component how to close this dialog.
        onClose={() => {
          setEditing(false);
          setCreating(false);
        }}
        // Give the form the asynchronous task-saving callback.
        onSave={save}
      />
      <DeleteDialog
        // Pass the task being displayed, edited, or deleted.
        todo={deleting ? todo : null}
        onClose={() => setDeleting(false)}
        onDelete={async () => {
          // Take this branch when the condition holds: todo.
          if (todo) {
            await api.delete(todo.id);
            window.location.assign('/');
          }
        }}
      />
      {/* Render the reusable Toast component. */}
      <Toast message={notice} onClose={dismissNotice} />
    </Shell>
  );
}

// Mount this document’s independent React root.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DetailPage />
  </StrictMode>,
);
