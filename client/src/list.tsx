// Mount the task-list document and manage its local filters and CRUD interactions.
import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  // Bring ArrowDownWideNarrow into scope from lucide-react.
  ArrowDownWideNarrow,
  ArrowRight,
  CalendarDays,
  // Bring Check into scope from lucide-react.
  Check,
  CheckCheck,
  ChevronRight,
  // Bring Circle into scope from lucide-react.
  Circle,
  ListTodo,
  Pencil,
  // Bring Plus into scope from lucide-react.
  Plus,
  Search,
  Sparkles,
  // Bring Trash2 into scope from lucide-react.
  Trash2,
  X,
} from 'lucide-react';
// Import compile-time types from ../../shared/types.
import type { CreateTodo, Priority, Todo } from '../../shared/types';
import { api } from './api';
import {
  // Bring DeleteDialog into scope from ./components.
  DeleteDialog,
  EmptyState,
  ErrorState,
  // Bring LoadingState into scope from ./components.
  LoadingState,
  PriorityBadge,
  ProjectBadge,
  // Bring Shell into scope from ./components.
  Shell,
  TaskForm,
  Toast,
  // Finish selecting the exports from ./components.
} from './components';
import { dueLabel, localDate, messageOf, overdue } from './helpers';
import './styles.css';

// Read the current document’s URL query parameters.
const params = new URLSearchParams(window.location.search);
const view = ['today', 'upcoming', 'completed'].includes(params.get('view') ?? '')
  ? params.get('view')!
  : 'all';
// Calculate or store the task category.
const project = ['personal', 'work', 'learning'].includes(params.get('project') ?? '')
  ? params.get('project')
  : null;
// Calculate or store view names.
const viewNames: Record<string, string> = {
  all: 'Your tasks',
  today: 'A plan for today',
  // Specify upcoming.
  upcoming: 'On the horizon',
  completed: 'Look how far you’ve come',
};
// Map priority names to numbers so high priority sorts first.
const priorityRank = { high: 0, medium: 1, low: 2 };

function ListPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  // Track whether data is still loading; setLoading changes that value.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  // Track the completion filter or HTTP status; setStatus changes that value.
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [sort, setSort] = useState('newest');
  // Track whether the task form is open; setFormOpen changes that value.
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo>();
  const [deleting, setDeleting] = useState<Todo | null>(null);
  // Track the IDs with completion requests in progress; setPending changes that value.
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  // Keep the dismissNotice callback stable until its dependencies change.
  const dismissNotice = useCallback(() => setNotice(''), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    // Update the error message or error object in React state.
    setError('');
    try {
      setTodos(await api.list());
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
    void refresh();
  }, [refresh]);

  // Calculate or store whether the task is finished.
  const completed = todos.filter((todo) => todo.completed).length;
  const today = todos.filter((todo) => !todo.completed && todo.dueDate === localDate()).length;
  const progress = todos.length ? Math.round((completed / todos.length) * 100) : 0;
  // Recompute tasks belonging to the current view only when the relevant dependencies change.
  const inView = useMemo(
    () =>
      todos.filter((todo) => {
        // Take this branch when the condition holds: project && todo.project !== project.
        if (project && todo.project !== project) return false;
        if (view === 'today') return !todo.completed && todo.dueDate === localDate();
        if (view === 'upcoming')
          // Return whether this unfinished task meets the requried date condition.
          return !todo.completed && !!todo.dueDate && todo.dueDate > localDate();
        if (view === 'completed') return todo.completed;
        return true;
      }),
    // Use todos as the dependencies that trigger this React hook to update.
    [todos],
  );
  const visible = useMemo(
    // Provide a callback that computes the following value.
    () =>
      inView
        .filter((todo) => {
          // Take this branch when the condition holds: status === 'active' && todo.completed.
          if (status === 'active' && todo.completed) return false;
          if (status === 'completed' && !todo.completed) return false;
          if (priority !== 'all' && todo.priority !== priority) return false;
          // Calculate or store needle.
          const needle = query.trim().toLowerCase();
          return `${todo.title} ${todo.description}`.toLowerCase().includes(needle);
        })
        // Order the retained entries using this comparison.
        .sort((a, b) => {
          if (sort === 'priority')
            return (
              // Compare priority ranks first and use the next comparison to break ties.
              priorityRank[a.priority] - priorityRank[b.priority] ||
              b.createdAt.localeCompare(a.createdAt)
            );
          // Take this branch when the condition holds: sort === 'dueDate'.
          if (sort === 'dueDate')
            return (
              (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99') ||
              // Call b.createdAt.localeCompare with the values shown here.
              b.createdAt.localeCompare(a.createdAt)
            );
          return sort === 'oldest'
            ? a.createdAt.localeCompare(b.createdAt)
            : b.createdAt.localeCompare(a.createdAt);
        }),
    // Use inView, status, priority, query, sort as the dependencies that trigger this React hook to update.
    [inView, status, priority, query, sort],
  );

  function addTask() {
    // Update the task or state selected for editing in React state.
    setEditing(undefined);
    setFormOpen(true);
  }
  // Create or update a task, then synchronize the list.
  async function saveTask(data: CreateTodo) {
    const saved = editing ? await api.update(editing.id, data) : await api.create(data);
    setTodos((current) =>
      // Replace the edited task or prepend a newly created task without mutating the old list.
      editing ? current.map((todo) => (todo.id === saved.id ? saved : todo)) : [saved, ...current],
    );
    // Update the success notification text in React state.
    setNotice(
      editing ? 'A little clearer. Task updated.' : 'One less thing on your mind. Task added.',
    );
  }
  // Persist the opposite completion state and update the interface.
  async function toggle(todo: Todo) {
    setPending((current) => new Set(current).add(todo.id));
    setActionError('');
    // Attempt the operation so failures can be handled below.
    try {
      const saved = await api.update(todo.id, { completed: !todo.completed });
      setTodos((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      // Update the success notification text in React state.
      setNotice(
        saved.completed ? 'A small win. Nicely done.' : 'Task reopened. Take it at your pace.',
      );
      // Handle a failure from the preceding operation.
    } catch (error) {
      setActionError(messageOf(error));
    } finally {
      // Update the IDs with completion requests in progress in React state.
      setPending((current) => {
        const next = new Set(current);
        next.delete(todo.id);
        // Use the copied set with the completed request removed.
        return next;
      });
    }
  }

  // Return the following React markup or multiline result.
  return (
    <Shell active={project ?? view} onAdd={addTask}>
      <section className="page-intro">
        {/* Render the div element. */}
        <div>
          <div className="eyebrow">
            <span className="tiny-sun">✳</span> ROOM TO FOCUS
          </div>
          {/* Render the h1 element. */}
          <h1>
            A little focus.
            <br />
            {/* Render the span element. */}
            <span>A lot of possibility.</span>
          </h1>
          <p>Get it out of your head and into your day.</p>
        </div>
        {/* Render the button element. */}
        <button className="button primary add-main" onClick={addTask}>
          <Plus size={18} />
          New task
        </button>
      </section>
      {/* Render the section element. */}
      <section className="overview" aria-label="Task overview">
        <div className="stat-card">
          <div>
            {/* Render the span element. */}
            <span className="stat-label">All tasks</span>
            <strong>
              {loading || error ? '—' : todos.length}
              {/* Render the span element. */}
              <span>things on your mind</span>
            </strong>
          </div>
          {/* Render the span element. */}
          <span className="stat-icon sage">
            <ListTodo size={22} />
          </span>
        </div>
        {/* Render the div element. */}
        <div className="stat-card">
          <div>
            <span className="stat-label">Completed</span>
            {/* Render the strong element. */}
            <strong>
              {loading || error ? '—' : completed}
              <span>little wins, big progress</span>
            </strong>
          </div>
          {/* Render the span element. */}
          <span className="stat-icon lavender">
            <CheckCheck size={22} />
          </span>
        </div>
        {/* Render the div element. */}
        <div className="stat-card">
          <div>
            <span className="stat-label">Due today</span>
            {/* Render the strong element. */}
            <strong>
              {loading || error ? '—' : today}
              <span>a good place to start</span>
            </strong>
          </div>
          {/* Render the span element. */}
          <span className="stat-icon peach">
            <CalendarDays size={21} />
          </span>
        </div>
      </section>
      {/* Render the section element. */}
      <section className="task-section" aria-labelledby="task-heading">
        <div className="section-heading">
          <div>
            {/* Render the h2 element. */}
            <h2 id="task-heading">
              {project ? `${project[0].toUpperCase()}${project.slice(1)} tasks` : viewNames[view]}
              <span className="count-badge">{loading || error ? '—' : inView.length}</span>
            </h2>
            {/* Render the p element. */}
            <p>
              {view === 'completed'
                ? 'Every checkmark is a step forward.'
                : 'One thing at a time. You’ve got this.'}
            </p>
          </div>
          {/* Render the span element. */}
          <span className="section-decoration">
            <Sparkles size={17} /> Make room for what matters
          </span>
        </div>
        {/* Render the div element. */}
        <div className="task-panel">
          <div className="task-toolbar">
            <div className="status-tabs" aria-label="Filter by status">
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {[
                { key: 'all', label: 'All tasks', icon: ListTodo },
                { key: 'active', label: 'Active', icon: Circle },
                // Evaluate this JavaScript expression inside the React markup.
                { key: 'completed', label: 'Completed', icon: CheckCheck },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  // Give React a stable identity for this item or form.
                  key={key}
                  onClick={() => setStatus(key)}
                  aria-pressed={status === key}
                  // Choose the CSS classes for this element.
                  className={status === key ? 'selected' : ''}
                >
                  <Icon size={15} />
                  {/* Evaluate this JavaScript expression inside the React markup. */}
                  {label}
                </button>
              ))}
            </div>
            {/* Render the label element. */}
            <label className="sort-control">
              <ArrowDownWideNarrow size={16} />
              <select
                // Provide a readable name for assistive technology.
                aria-label="Sort tasks"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {/* Render the option element. */}
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="dueDate">Due date</option>
                {/* Render the option element. */}
                <option value="priority">Priority</option>
              </select>
            </label>
          </div>
          {/* Render the div element. */}
          <div className="filter-row">
            <label className="search-field">
              <Search size={17} />
              {/* Render the input element. */}
              <input
                aria-label="Search tasks"
                placeholder="Find a little something…"
                // Keep the control synchronized with React state.
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {query && (
                <button
                  className="icon-button"
                  // Provide a readable name for assistive technology.
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                >
                  {/* Render the reusable X component. */}
                  <X size={15} />
                </button>
              )}
            </label>
            {/* Render the label element. */}
            <label className="priority-filter">
              <span className="sr-only">Filter priority</span>
              <select
                // Provide a readable name for assistive technology.
                aria-label="Filter priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                {/* Render the option element. */}
                <option value="all">All priorities</option>
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                {/* Render the option element. */}
                <option value="low">Low priority</option>
              </select>
            </label>
          </div>
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {actionError && (
            <div className="action-error" role="alert">
              {actionError}
              {/* Render the button element. */}
              <button
                className="icon-button"
                aria-label="Dismiss error"
                // Run this handler when the user activates the control.
                onClick={() => setActionError('')}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {loading ? (
            <LoadingState />
          ) : error ? (
            // Render the reusable ErrorState component.
            <ErrorState message={error} onRetry={() => void refresh()} />
          ) : visible.length ? (
            // Group these React children without adding a wrapper element.
            <>
              <div className="list-column-labels" aria-hidden="true">
                <span>TASK</span>
                {/* Render the span element. */}
                <span>PROJECT</span>
                <span>PRIORITY</span>
                <span>DUE DATE</span>
                {/* Render the span element. */}
                <span />
              </div>
              <ul className="task-list">
                {/* Evaluate this JavaScript expression inside the React markup. */}
                {visible.map((todo) => (
                  <li key={todo.id} className={`task-row ${todo.completed ? 'is-completed' : ''}`}>
                    <div className="task-main">
                      {/* Render the button element. */}
                      <button
                        className={`completion-control ${todo.completed ? 'checked' : ''}`}
                        aria-label={`${todo.completed ? 'Reopen' : 'Complete'} ${todo.title}`}
                        // Expose the current toggle state to assistive technology.
                        aria-pressed={todo.completed}
                        disabled={pending.has(todo.id)}
                        onClick={() => void toggle(todo)}
                      >
                        {/* Evaluate this JavaScript expression inside the React markup. */}
                        {todo.completed && <Check size={13} strokeWidth={3} />}
                      </button>
                      <div className="task-text">
                        {/* Render the a element. */}
                        <a
                          className="task-title"
                          href={`/todo.html?id=${encodeURIComponent(todo.id)}`}
                        >
                          {/* Evaluate this JavaScript expression inside the React markup. */}
                          {todo.title}
                        </a>
                        {todo.description && <p>{todo.description}</p>}
                        {/* Render the div element. */}
                        <div className="mobile-task-meta">
                          <ProjectBadge project={todo.project} />
                          <span>{dueLabel(todo.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                    {/* Render the div element. */}
                    <div className="row-project">
                      <ProjectBadge project={todo.project} />
                    </div>
                    {/* Render the div element. */}
                    <div className="row-priority">
                      <PriorityBadge priority={todo.priority as Priority} />
                    </div>
                    {/* Render the div element. */}
                    <div
                      className={`row-date ${overdue(todo) ? 'overdue' : ''} ${todo.dueDate === localDate() && !todo.completed ? 'due-today' : ''}`}
                    >
                      {/* Render the reusable CalendarDays component. */}
                      <CalendarDays size={13} />
                      <span>
                        {dueLabel(todo.dueDate)}
                        {/* Evaluate this JavaScript expression inside the React markup. */}
                        {overdue(todo) && <small>Overdue</small>}
                      </span>
                    </div>
                    {/* Render the div element. */}
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        // Provide a readable name for assistive technology.
                        aria-label={`Edit ${todo.title}`}
                        disabled={pending.has(todo.id)}
                        onClick={() => {
                          // Update the task or state selected for editing in React state.
                          setEditing(todo);
                          setFormOpen(true);
                        }}
                      >
                        {/* Render the reusable Pencil component. */}
                        <Pencil size={15} />
                      </button>
                      <button
                        // Choose the CSS classes for this element.
                        className="icon-button delete-action"
                        aria-label={`Delete ${todo.title}`}
                        disabled={pending.has(todo.id)}
                        // Run this handler when the user activates the control.
                        onClick={() => setDeleting(todo)}
                      >
                        <Trash2 size={15} />
                      </button>
                      {/* Render the a element. */}
                      <a
                        className="icon-button open-task"
                        aria-label={`View ${todo.title}`}
                        // Set the normal document-navigation destination.
                        href={`/todo.html?id=${encodeURIComponent(todo.id)}`}
                      >
                        <ChevronRight size={16} />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
              {/* Render the button element. */}
              <button className="inline-add" onClick={addTask}>
                <Plus size={17} />
                Add another task<span>A fresh start, one line at a time</span>
              </button>
            </>
          ) : (
            // Render the alternative content when the condition is false.
            <EmptyState
              filtered={
                todos.length > 0 ||
                // Also treat it as filtered when search text has been entered.
                !!query ||
                !!project ||
                view !== 'all' ||
                // Also treat it as filtered when a completion tab narrows the results.
                status !== 'all' ||
                priority !== 'all'
              }
              // Give this control a way to open a new-task form.
              onAdd={addTask}
              onReset={() => {
                if (view !== 'all' || project) window.location.assign('/');
                // Handle the alternative case when the previous condition is false.
                else {
                  setQuery('');
                  setStatus('all');
                  // Update the task urgency in React state.
                  setPriority('all');
                }
              }}
            />
          )}
          {/* Render the div element. */}
          <div className="list-footer">
            <span>
              {loading || error
                ? 'Your space to get things done'
                : `${visible.length} ${visible.length === 1 ? 'task' : 'tasks'} in this view`}
            </span>
            {/* Render the span element. */}
            <span>
              <span className="saved-dot" />
              Saved as you go
            </span>
          </div>
        </div>
      </section>
      {/* Render the section element. */}
      <section className="progress-note">
        <div
          className="progress-ring"
          // Compute inline styling from the current task data.
          style={{ background: `conic-gradient(var(--olive) ${progress}%, #e5e7db 0)` }}
        >
          <span>
            {/* Evaluate this JavaScript expression inside the React markup. */}
            {progress}
            <small>%</small>
          </span>
        </div>
        {/* Render the div element. */}
        <div>
          <h3>
            {progress === 100 && todos.length
              ? 'Look at you. All done!'
              : 'Every little step counts.'}
          </h3>
          {/* Render the p element. */}
          <p>
            {completed
              ? `${completed} of ${todos.length} tasks complete. Keep going at your own pace.`
              : 'There’s no rush. Just a little more progress than yesterday.'}
          </p>
        </div>
        {/* Render the a element. */}
        <a href="/?view=completed">
          See your progress <ArrowRight size={17} />
        </a>
      </section>
      {/* Render the reusable TaskForm component. */}
      <TaskForm
        open={formOpen}
        todo={editing}
        // Tell the parent component how to close this dialog.
        onClose={() => setFormOpen(false)}
        onSave={saveTask}
      />
      {/* Render the reusable DeleteDialog component. */}
      <DeleteDialog
        todo={deleting}
        onClose={() => setDeleting(null)}
        // Give the confirmation dialog the asynchronous deletion callback.
        onDelete={async () => {
          if (!deleting) return;
          await api.delete(deleting.id);
          // Update the collection of tasks in React state.
          setTodos((current) => current.filter((todo) => todo.id !== deleting.id));
          setNotice('Task deleted. A little more breathing room.');
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
    <ListPage />
  </StrictMode>,
);
