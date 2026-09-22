// Mount the task-list document and manage its local filters and CRUD interactions.
// Import the required exports from react.
import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
// Import the required exports from react-dom/client.
import { createRoot } from 'react-dom/client';
// Import the required exports from lucide-react.
import {
  // Bring ArrowDownWideNarrow into scope from lucide-react.
  ArrowDownWideNarrow,
  // Bring ArrowRight into scope from lucide-react.
  ArrowRight,
  // Bring CalendarDays into scope from lucide-react.
  CalendarDays,
  // Bring Check into scope from lucide-react.
  Check,
  // Bring CheckCheck into scope from lucide-react.
  CheckCheck,
  // Bring ChevronRight into scope from lucide-react.
  ChevronRight,
  // Bring Circle into scope from lucide-react.
  Circle,
  // Bring ListTodo into scope from lucide-react.
  ListTodo,
  // Bring Pencil into scope from lucide-react.
  Pencil,
  // Bring Plus into scope from lucide-react.
  Plus,
  // Bring Search into scope from lucide-react.
  Search,
  // Bring Sparkles into scope from lucide-react.
  Sparkles,
  // Bring Trash2 into scope from lucide-react.
  Trash2,
  // Bring X into scope from lucide-react.
  X,
  // Finish selecting the exports from lucide-react.
} from 'lucide-react';
// Import compile-time types from ../../shared/types.
import type { CreateTodo, Priority, Todo } from '../../shared/types';
// Import the required exports from ./api.
import { api } from './api';
// Import the required exports from ./components.
import {
  // Bring DeleteDialog into scope from ./components.
  DeleteDialog,
  // Bring EmptyState into scope from ./components.
  EmptyState,
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
import { dueLabel, localDate, messageOf, overdue } from './helpers';
// Import the required exports from ./styles.css.
import './styles.css';

// Read the current document’s URL query parameters.
const params = new URLSearchParams(window.location.search);
// Calculate or store the selected date or completion view.
const view = ['today', 'upcoming', 'completed'].includes(params.get('view') ?? '')
  ? // Use this value when the preceding condition is true.
    params.get('view')!
  : // Use this alternative when the preceding condition is false.
    'all';
// Calculate or store the task category.
const project = ['personal', 'work', 'learning'].includes(params.get('project') ?? '')
  ? // Use this value when the preceding condition is true.
    params.get('project')
  : // Use this alternative when the preceding condition is false.
    null;
// Calculate or store view names.
const viewNames: Record<string, string> = {
  // Specify all.
  all: 'Your tasks',
  // Specify today.
  today: 'A plan for today',
  // Specify upcoming.
  upcoming: 'On the horizon',
  // Specify whether the task is finished.
  completed: 'Look how far you’ve come',
  // Close the current block or object.
};
// Map priority names to numbers so high priority sorts first.
const priorityRank = { high: 0, medium: 1, low: 2 };

// Load the task collection and coordinate list filters and task actions.
function ListPage() {
  // Track the collection of tasks; setTodos changes that value.
  const [todos, setTodos] = useState<Todo[]>([]);
  // Track whether data is still loading; setLoading changes that value.
  const [loading, setLoading] = useState(true);
  // Track the error message or error object; setError changes that value.
  const [error, setError] = useState('');
  // Track the search text; setQuery changes that value.
  const [query, setQuery] = useState('');
  // Track the completion filter or HTTP status; setStatus changes that value.
  const [status, setStatus] = useState('all');
  // Track the task urgency; setPriority changes that value.
  const [priority, setPriority] = useState('all');
  // Track the requested ordering; setSort changes that value.
  const [sort, setSort] = useState('newest');
  // Track whether the task form is open; setFormOpen changes that value.
  const [formOpen, setFormOpen] = useState(false);
  // Track the task or state selected for editing; setEditing changes that value.
  const [editing, setEditing] = useState<Todo>();
  // Track the task or state awaiting delete confirmation; setDeleting changes that value.
  const [deleting, setDeleting] = useState<Todo | null>(null);
  // Track the IDs with completion requests in progress; setPending changes that value.
  const [pending, setPending] = useState<Set<string>>(new Set());
  // Track the success notification text; setNotice changes that value.
  const [notice, setNotice] = useState('');
  // Track the message from a failed task action; setActionError changes that value.
  const [actionError, setActionError] = useState('');
  // Keep the dismissNotice callback stable until its dependencies change.
  const dismissNotice = useCallback(() => setNotice(''), []);

  // Keep the refresh callback stable until its dependencies change.
  const refresh = useCallback(async () => {
    // Update whether data is still loading in React state.
    setLoading(true);
    // Update the error message or error object in React state.
    setError('');
    // Attempt the operation so failures can be handled below.
    try {
      // Update the collection of tasks in React state.
      setTodos(await api.list());
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
    void refresh();
    // Use refresh as the dependencies that trigger this React hook to update.
  }, [refresh]);

  // Calculate or store whether the task is finished.
  const completed = todos.filter((todo) => todo.completed).length;
  // Calculate or store today.
  const today = todos.filter((todo) => !todo.completed && todo.dueDate === localDate()).length;
  // Calculate the percentage of all tasks that are complete, handling an empty list.
  const progress = todos.length ? Math.round((completed / todos.length) * 100) : 0;
  // Recompute tasks belonging to the current view only when the relevant dependencies change.
  const inView = useMemo(
    // Provide a callback that computes the following value.
    () =>
      // Call todos.filter with the values shown here.
      todos.filter((todo) => {
        // Take this branch when the condition holds: project && todo.project !== project.
        if (project && todo.project !== project) return false;
        // Take this branch when the condition holds: view === 'today'.
        if (view === 'today') return !todo.completed && todo.dueDate === localDate();
        // Take this branch when the condition holds: view === 'upcoming'.
        if (view === 'upcoming')
          // Return whether this unfinished task meets the required date condition.
          return !todo.completed && !!todo.dueDate && todo.dueDate > localDate();
        // Take this branch when the condition holds: view === 'completed'.
        if (view === 'completed') return todo.completed;
        // Keep this item when no earlier filter rejected it.
        return true;
        // Close the current block or object.
      }),
    // Use todos as the dependencies that trigger this React hook to update.
    [todos],
    // Finish the current expression or function call.
  );
  // Recompute tasks remaining after search, filtering, and sorting only when the relevant dependencies change.
  const visible = useMemo(
    // Provide a callback that computes the following value.
    () =>
      // Supply tasks belonging to the current view to the enclosing expression.
      inView
        // Keep only the entries that satisfy this filter.
        .filter((todo) => {
          // Take this branch when the condition holds: status === 'active' && todo.completed.
          if (status === 'active' && todo.completed) return false;
          // Take this branch when the condition holds: status === 'completed' && !todo.completed.
          if (status === 'completed' && !todo.completed) return false;
          // Take this branch when the condition holds: priority !== 'all' && todo.priority !== priority.
          if (priority !== 'all' && todo.priority !== priority) return false;
          // Calculate or store needle.
          const needle = query.trim().toLowerCase();
          // Keep tasks whose title or notes contain the case-normalized search text.
          return `${todo.title} ${todo.description}`.toLowerCase().includes(needle);
          // Close the current block or object.
        })
        // Order the retained entries using this comparison.
        .sort((a, b) => {
          // Take this branch when the condition holds: sort === 'priority'.
          if (sort === 'priority')
            // Return the following React markup or multiline result.
            return (
              // Compare priority ranks first and use the next comparison to break ties.
              priorityRank[a.priority] - priorityRank[b.priority] ||
              // Call b.createdAt.localeCompare with the values shown here.
              b.createdAt.localeCompare(a.createdAt)
              // Finish the current expression or function call.
            );
          // Take this branch when the condition holds: sort === 'dueDate'.
          if (sort === 'dueDate')
            // Return the following React markup or multiline result.
            return (
              // Compare due dates, treating missing dates as last, then break ties below.
              (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99') ||
              // Call b.createdAt.localeCompare with the values shown here.
              b.createdAt.localeCompare(a.createdAt)
              // Finish the current expression or function call.
            );
          // Return the computed result to the caller.
          return sort === 'oldest'
            ? // Use this value when the preceding condition is true.
              a.createdAt.localeCompare(b.createdAt)
            : // Use this alternative when the preceding condition is false.
              b.createdAt.localeCompare(a.createdAt);
          // Close the current block or object.
        }),
    // Use inView, status, priority, query, sort as the dependencies that trigger this React hook to update.
    [inView, status, priority, query, sort],
    // Finish the current expression or function call.
  );

  // Open a blank task form.
  function addTask() {
    // Update the task or state selected for editing in React state.
    setEditing(undefined);
    // Update whether the task form is open in React state.
    setFormOpen(true);
    // Close the current block or object.
  }
  // Create or update a task, then synchronize the list.
  async function saveTask(data: CreateTodo) {
    // Calculate or store the task returned after a successful save.
    const saved = editing ? await api.update(editing.id, data) : await api.create(data);
    // Update the collection of tasks in React state.
    setTodos(
      (current) =>
        // Replace the edited task or prepend a newly created task without mutating the old list.
        editing
          ? current.map((todo) => (todo.id === saved.id ? saved : todo))
          : [saved, ...current],
      // Finish the current expression or function call.
    );
    // Update the success notification text in React state.
    setNotice(
      // Choose a success message that distinguishes editing from creating.
      editing ? 'A little clearer. Task updated.' : 'One less thing on your mind. Task added.',
      // Finish the current expression or function call.
    );
    // Close the current block or object.
  }
  // Persist the opposite completion state and update the interface.
  async function toggle(todo: Todo) {
    // Update the IDs with completion requests in progress in React state.
    setPending((current) => new Set(current).add(todo.id));
    // Update the message from a failed task action in React state.
    setActionError('');
    // Attempt the operation so failures can be handled below.
    try {
      // Calculate or store the task returned after a successful save.
      const saved = await api.update(todo.id, { completed: !todo.completed });
      // Update the collection of tasks in React state.
      setTodos((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      // Update the success notification text in React state.
      setNotice(
        // Choose feedback for completing versus reopening the task.
        saved.completed ? 'A small win. Nicely done.' : 'Task reopened. Take it at your pace.',
        // Finish the current expression or function call.
      );
      // Handle a failure from the preceding operation.
    } catch (error) {
      // Update the message from a failed task action in React state.
      setActionError(messageOf(error));
      // Run cleanup whether the operation succeeds or fails.
    } finally {
      // Update the IDs with completion requests in progress in React state.
      setPending((current) => {
        // Calculate or store next.
        const next = new Set(current);
        // Call next.delete with the values shown here.
        next.delete(todo.id);
        // Use the copied set with the completed request removed.
        return next;
        // Close the current block or object.
      });
      // Close the current block or object.
    }
    // Close the current block or object.
  }

  // Return the following React markup or multiline result.
  return (
    // Render the reusable Shell component.
    <Shell active={project ?? view} onAdd={addTask}>
      {/* Render the section element. */}
      <section className="page-intro">
        {/* Render the div element. */}
        <div>
          {/* Render the div element. */}
          <div className="eyebrow">
            {/* Render the span element. */}
            <span className="tiny-sun">✳</span> ROOM TO FOCUS
            {/* Finish the div element. */}
          </div>
          {/* Render the h1 element. */}
          <h1>
            {/* Display the text: A little focus.. */}A little focus.
            {/* Render the br element. */}
            <br />
            {/* Render the span element. */}
            <span>A lot of possibility.</span>
            {/* Finish the h1 element. */}
          </h1>
          {/* Render the p element. */}
          <p>Get it out of your head and into your day.</p>
          {/* Finish the div element. */}
        </div>
        {/* Render the button element. */}
        <button className="button primary add-main" onClick={addTask}>
          {/* Render the reusable Plus component. */}
          <Plus size={18} />
          {/* Display the text: New task. */}
          New task
          {/* Finish the button element. */}
        </button>
        {/* Finish the section element. */}
      </section>
      {/* Render the section element. */}
      <section className="overview" aria-label="Task overview">
        {/* Render the div element. */}
        <div className="stat-card">
          {/* Render the div element. */}
          <div>
            {/* Render the span element. */}
            <span className="stat-label">All tasks</span>
            {/* Render the strong element. */}
            <strong>
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {loading || error ? '—' : todos.length}
              {/* Render the span element. */}
              <span>things on your mind</span>
              {/* Finish the strong element. */}
            </strong>
            {/* Finish the div element. */}
          </div>
          {/* Render the span element. */}
          <span className="stat-icon sage">
            {/* Render the reusable ListTodo component. */}
            <ListTodo size={22} />
            {/* Finish the span element. */}
          </span>
          {/* Finish the div element. */}
        </div>
        {/* Render the div element. */}
        <div className="stat-card">
          {/* Render the div element. */}
          <div>
            {/* Render the span element. */}
            <span className="stat-label">Completed</span>
            {/* Render the strong element. */}
            <strong>
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {loading || error ? '—' : completed}
              {/* Render the span element. */}
              <span>little wins, big progress</span>
              {/* Finish the strong element. */}
            </strong>
            {/* Finish the div element. */}
          </div>
          {/* Render the span element. */}
          <span className="stat-icon lavender">
            {/* Render the reusable CheckCheck component. */}
            <CheckCheck size={22} />
            {/* Finish the span element. */}
          </span>
          {/* Finish the div element. */}
        </div>
        {/* Render the div element. */}
        <div className="stat-card">
          {/* Render the div element. */}
          <div>
            {/* Render the span element. */}
            <span className="stat-label">Due today</span>
            {/* Render the strong element. */}
            <strong>
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {loading || error ? '—' : today}
              {/* Render the span element. */}
              <span>a good place to start</span>
              {/* Finish the strong element. */}
            </strong>
            {/* Finish the div element. */}
          </div>
          {/* Render the span element. */}
          <span className="stat-icon peach">
            {/* Render the reusable CalendarDays component. */}
            <CalendarDays size={21} />
            {/* Finish the span element. */}
          </span>
          {/* Finish the div element. */}
        </div>
        {/* Finish the section element. */}
      </section>
      {/* Render the section element. */}
      <section className="task-section" aria-labelledby="task-heading">
        {/* Render the div element. */}
        <div className="section-heading">
          {/* Render the div element. */}
          <div>
            {/* Render the h2 element. */}
            <h2 id="task-heading">
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {project ? `${project[0].toUpperCase()}${project.slice(1)} tasks` : viewNames[view]}
              {/* Render the span element. */}
              <span className="count-badge">{loading || error ? '—' : inView.length}</span>
              {/* Finish the h2 element. */}
            </h2>
            {/* Render the p element. */}
            <p>
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {view === 'completed'
                ? // Use this value when the preceding condition is true.
                  'Every checkmark is a step forward.'
                : // Use this alternative when the preceding condition is false.
                  'One thing at a time. You’ve got this.'}
              {/* Finish the p element. */}
            </p>
            {/* Finish the div element. */}
          </div>
          {/* Render the span element. */}
          <span className="section-decoration">
            {/* Render the reusable Sparkles component. */}
            <Sparkles size={17} /> Make room for what matters
            {/* Finish the span element. */}
          </span>
          {/* Finish the div element. */}
        </div>
        {/* Render the div element. */}
        <div className="task-panel">
          {/* Render the div element. */}
          <div className="task-toolbar">
            {/* Render the div element. */}
            <div className="status-tabs" aria-label="Filter by status">
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {[
                // Evaluate this JavaScript expression inside the React markup.
                { key: 'all', label: 'All tasks', icon: ListTodo },
                // Evaluate this JavaScript expression inside the React markup.
                { key: 'active', label: 'Active', icon: Circle },
                // Evaluate this JavaScript expression inside the React markup.
                { key: 'completed', label: 'Completed', icon: CheckCheck },
                // Render one control for each entry in the preceding options list.
              ].map(({ key, label, icon: Icon }) => (
                // Render the button element.
                <button
                  // Give React a stable identity for this item or form.
                  key={key}
                  // Run this handler when the user activates the control.
                  onClick={() => setStatus(key)}
                  // Expose the current toggle state to assistive technology.
                  aria-pressed={status === key}
                  // Choose the CSS classes for this element.
                  className={status === key ? 'selected' : ''}
                  // Finish the opening tag and begin its child content.
                >
                  {/* Render the reusable Icon component. */}
                  <Icon size={15} />
                  {/* Evaluate this JavaScript expression inside the React markup. */}
                  {label}
                  {/* Finish the button element. */}
                </button>
                // Close the current block or object.
              ))}
              {/* Finish the div element. */}
            </div>
            {/* Render the label element. */}
            <label className="sort-control">
              {/* Render the reusable ArrowDownWideNarrow component. */}
              <ArrowDownWideNarrow size={16} />
              {/* Render the select element. */}
              <select
                // Provide a readable name for assistive technology.
                aria-label="Sort tasks"
                // Keep the control synchronized with React state.
                value={sort}
                // Update state when the user changes this control.
                onChange={(event) => setSort(event.target.value)}
                // Finish the opening tag and begin its child content.
              >
                {/* Render the option element. */}
                <option value="newest">Newest first</option>
                {/* Render the option element. */}
                <option value="oldest">Oldest first</option>
                {/* Render the option element. */}
                <option value="dueDate">Due date</option>
                {/* Render the option element. */}
                <option value="priority">Priority</option>
                {/* Finish the select element. */}
              </select>
              {/* Finish the label element. */}
            </label>
            {/* Finish the div element. */}
          </div>
          {/* Render the div element. */}
          <div className="filter-row">
            {/* Render the label element. */}
            <label className="search-field">
              {/* Render the reusable Search component. */}
              <Search size={17} />
              {/* Render the input element. */}
              <input
                // Provide a readable name for assistive technology.
                aria-label="Search tasks"
                // Show a hint while the input is empty.
                placeholder="Find a little something…"
                // Keep the control synchronized with React state.
                value={query}
                // Update state when the user changes this control.
                onChange={(event) => setQuery(event.target.value)}
                // Finish this self-closing React element.
              />
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {query && (
                // Render the button element.
                <button
                  // Choose the CSS classes for this element.
                  className="icon-button"
                  // Provide a readable name for assistive technology.
                  aria-label="Clear search"
                  // Run this handler when the user activates the control.
                  onClick={() => setQuery('')}
                  // Finish the opening tag and begin its child content.
                >
                  {/* Render the reusable X component. */}
                  <X size={15} />
                  {/* Finish the button element. */}
                </button>
                // Close the current block or object.
              )}
              {/* Finish the label element. */}
            </label>
            {/* Render the label element. */}
            <label className="priority-filter">
              {/* Render the span element. */}
              <span className="sr-only">Filter priority</span>
              {/* Render the select element. */}
              <select
                // Provide a readable name for assistive technology.
                aria-label="Filter priority"
                // Keep the control synchronized with React state.
                value={priority}
                // Update state when the user changes this control.
                onChange={(event) => setPriority(event.target.value)}
                // Finish the opening tag and begin its child content.
              >
                {/* Render the option element. */}
                <option value="all">All priorities</option>
                {/* Render the option element. */}
                <option value="high">High priority</option>
                {/* Render the option element. */}
                <option value="medium">Medium priority</option>
                {/* Render the option element. */}
                <option value="low">Low priority</option>
                {/* Finish the select element. */}
              </select>
              {/* Finish the label element. */}
            </label>
            {/* Finish the div element. */}
          </div>
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {actionError && (
            // Render the div element.
            <div className="action-error" role="alert">
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {actionError}
              {/* Render the button element. */}
              <button
                // Choose the CSS classes for this element.
                className="icon-button"
                // Provide a readable name for assistive technology.
                aria-label="Dismiss error"
                // Run this handler when the user activates the control.
                onClick={() => setActionError('')}
                // Finish the opening tag and begin its child content.
              >
                {/* Render the reusable X component. */}
                <X size={16} />
                {/* Finish the button element. */}
              </button>
              {/* Finish the div element. */}
            </div>
            // Close the current block or object.
          )}
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {loading ? (
            // Render the reusable LoadingState component.
            <LoadingState />
          ) : // If loading has finished, display a request error when present.
          error ? (
            // Render the reusable ErrorState component.
            <ErrorState message={error} onRetry={() => void refresh()} />
          ) : // Show task rows when there are matching results; otherwise show the empty state.
          visible.length ? (
            // Group these React children without adding a wrapper element.
            <>
              {/* Render the div element. */}
              <div className="list-column-labels" aria-hidden="true">
                {/* Render the span element. */}
                <span>TASK</span>
                {/* Render the span element. */}
                <span>PROJECT</span>
                {/* Render the span element. */}
                <span>PRIORITY</span>
                {/* Render the span element. */}
                <span>DUE DATE</span>
                {/* Render the span element. */}
                <span />
                {/* Finish the div element. */}
              </div>
              {/* Render the ul element. */}
              <ul className="task-list">
                {/* Evaluate this JavaScript expression inside the React markup. */}
                {visible.map((todo) => (
                  // Render the li element.
                  <li key={todo.id} className={`task-row ${todo.completed ? 'is-completed' : ''}`}>
                    {/* Render the div element. */}
                    <div className="task-main">
                      {/* Render the button element. */}
                      <button
                        // Choose the CSS classes for this element.
                        className={`completion-control ${todo.completed ? 'checked' : ''}`}
                        // Provide a readable name for assistive technology.
                        aria-label={`${todo.completed ? 'Reopen' : 'Complete'} ${todo.title}`}
                        // Expose the current toggle state to assistive technology.
                        aria-pressed={todo.completed}
                        // Prevent this action while its request is already in progress.
                        disabled={pending.has(todo.id)}
                        // Run this handler when the user activates the control.
                        onClick={() => void toggle(todo)}
                        // Finish the opening tag and begin its child content.
                      >
                        {/* Evaluate this JavaScript expression inside the React markup. */}
                        {todo.completed && <Check size={13} strokeWidth={3} />}
                        {/* Finish the button element. */}
                      </button>
                      {/* Render the div element. */}
                      <div className="task-text">
                        {/* Render the a element. */}
                        <a
                          // Choose the CSS classes for this element.
                          className="task-title"
                          // Set the normal document-navigation destination.
                          href={`/todo.html?id=${encodeURIComponent(todo.id)}`}
                          // Finish the opening tag and begin its child content.
                        >
                          {/* Evaluate this JavaScript expression inside the React markup. */}
                          {todo.title}
                          {/* Finish the a element. */}
                        </a>
                        {/* Evaluate this JavaScript expression inside the React markup. */}
                        {todo.description && <p>{todo.description}</p>}
                        {/* Render the div element. */}
                        <div className="mobile-task-meta">
                          {/* Render the reusable ProjectBadge component. */}
                          <ProjectBadge project={todo.project} />
                          {/* Render the span element. */}
                          <span>{dueLabel(todo.dueDate)}</span>
                          {/* Finish the div element. */}
                        </div>
                        {/* Finish the div element. */}
                      </div>
                      {/* Finish the div element. */}
                    </div>
                    {/* Render the div element. */}
                    <div className="row-project">
                      {/* Render the reusable ProjectBadge component. */}
                      <ProjectBadge project={todo.project} />
                      {/* Finish the div element. */}
                    </div>
                    {/* Render the div element. */}
                    <div className="row-priority">
                      {/* Render the reusable PriorityBadge component. */}
                      <PriorityBadge priority={todo.priority as Priority} />
                      {/* Finish the div element. */}
                    </div>
                    {/* Render the div element. */}
                    <div
                      // Choose the CSS classes for this element.
                      className={`row-date ${overdue(todo) ? 'overdue' : ''} ${todo.dueDate === localDate() && !todo.completed ? 'due-today' : ''}`}
                      // Finish the opening tag and begin its child content.
                    >
                      {/* Render the reusable CalendarDays component. */}
                      <CalendarDays size={13} />
                      {/* Render the span element. */}
                      <span>
                        {/* Evaluate this JavaScript expression inside the React markup. */}
                        {dueLabel(todo.dueDate)}
                        {/* Evaluate this JavaScript expression inside the React markup. */}
                        {overdue(todo) && <small>Overdue</small>}
                        {/* Finish the span element. */}
                      </span>
                      {/* Finish the div element. */}
                    </div>
                    {/* Render the div element. */}
                    <div className="row-actions">
                      {/* Render the button element. */}
                      <button
                        // Choose the CSS classes for this element.
                        className="icon-button"
                        // Provide a readable name for assistive technology.
                        aria-label={`Edit ${todo.title}`}
                        // Prevent this action while its request is already in progress.
                        disabled={pending.has(todo.id)}
                        // Run this handler when the user activates the control.
                        onClick={() => {
                          // Update the task or state selected for editing in React state.
                          setEditing(todo);
                          // Update whether the task form is open in React state.
                          setFormOpen(true);
                          // Close the current block or object.
                        }}
                        // Finish the opening tag and begin its child content.
                      >
                        {/* Render the reusable Pencil component. */}
                        <Pencil size={15} />
                        {/* Finish the button element. */}
                      </button>
                      {/* Render the button element. */}
                      <button
                        // Choose the CSS classes for this element.
                        className="icon-button delete-action"
                        // Provide a readable name for assistive technology.
                        aria-label={`Delete ${todo.title}`}
                        // Prevent this action while its request is already in progress.
                        disabled={pending.has(todo.id)}
                        // Run this handler when the user activates the control.
                        onClick={() => setDeleting(todo)}
                        // Finish the opening tag and begin its child content.
                      >
                        {/* Render the reusable Trash2 component. */}
                        <Trash2 size={15} />
                        {/* Finish the button element. */}
                      </button>
                      {/* Render the a element. */}
                      <a
                        // Choose the CSS classes for this element.
                        className="icon-button open-task"
                        // Provide a readable name for assistive technology.
                        aria-label={`View ${todo.title}`}
                        // Set the normal document-navigation destination.
                        href={`/todo.html?id=${encodeURIComponent(todo.id)}`}
                        // Finish the opening tag and begin its child content.
                      >
                        {/* Render the reusable ChevronRight component. */}
                        <ChevronRight size={16} />
                        {/* Finish the a element. */}
                      </a>
                      {/* Finish the div element. */}
                    </div>
                    {/* Finish the li element. */}
                  </li>
                  // Close the current block or object.
                ))}
                {/* Finish the ul element. */}
              </ul>
              {/* Render the button element. */}
              <button className="inline-add" onClick={addTask}>
                {/* Render the reusable Plus component. */}
                <Plus size={17} />
                {/* Display the text: Add another task<span>A fresh start, one line at a time</span>. */}
                Add another task<span>A fresh start, one line at a time</span>
                {/* Finish the button element. */}
              </button>
              {/* Finish the React fragment element. */}
            </>
          ) : (
            // Render the alternative content when the condition is false.
            // Render the reusable EmptyState component.
            <EmptyState
              // Choose whether the empty state represents filtering or a fresh list.
              filtered={
                // Treat an empty result as filtered when the collection itself is not empty.
                todos.length > 0 ||
                // Also treat it as filtered when search text has been entered.
                !!query ||
                // Also treat it as filtered when a project view is selected.
                !!project ||
                // Also treat it as filtered when a date or completion view is selected.
                view !== 'all' ||
                // Also treat it as filtered when a completion tab narrows the results.
                status !== 'all' ||
                // Also treat it as filtered when a specific priority is selected.
                priority !== 'all'
                // Close the current block or object.
              }
              // Give this control a way to open a new-task form.
              onAdd={addTask}
              // Provide an action that clears filters or returns to the full list.
              onReset={() => {
                // Take this branch when the condition holds: view !== 'all' || project.
                if (view !== 'all' || project) window.location.assign('/');
                // Handle the alternative case when the previous condition is false.
                else {
                  // Update the search text in React state.
                  setQuery('');
                  // Update the completion filter or HTTP status in React state.
                  setStatus('all');
                  // Update the task urgency in React state.
                  setPriority('all');
                  // Close the current block or object.
                }
                // Close the current block or object.
              }}
              // Finish this self-closing React element.
            />
            // Close the current block or object.
          )}
          {/* Render the div element. */}
          <div className="list-footer">
            {/* Render the span element. */}
            <span>
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {loading || error
                ? // Use this value when the preceding condition is true.
                  'Your space to get things done'
                : // Use this alternative when the preceding condition is false.
                  `${visible.length} ${visible.length === 1 ? 'task' : 'tasks'} in this view`}
              {/* Finish the span element. */}
            </span>
            {/* Render the span element. */}
            <span>
              {/* Render the span element. */}
              <span className="saved-dot" />
              {/* Display the text: Saved as you go. */}
              Saved as you go
              {/* Finish the span element. */}
            </span>
            {/* Finish the div element. */}
          </div>
          {/* Finish the div element. */}
        </div>
        {/* Finish the section element. */}
      </section>
      {/* Render the section element. */}
      <section className="progress-note">
        {/* Render the div element. */}
        <div
          // Choose the CSS classes for this element.
          className="progress-ring"
          // Compute inline styling from the current task data.
          style={{ background: `conic-gradient(var(--olive) ${progress}%, #e5e7db 0)` }}
          // Finish the opening tag and begin its child content.
        >
          {/* Render the span element. */}
          <span>
            {/* Evaluate this JavaScript expression inside the React markup. */}
            {progress}
            {/* Render the small element. */}
            <small>%</small>
            {/* Finish the span element. */}
          </span>
          {/* Finish the div element. */}
        </div>
        {/* Render the div element. */}
        <div>
          {/* Render the h3 element. */}
          <h3>
            {/* Evaluate this JavaScript expression inside the React markup. */}
            {progress === 100 && todos.length
              ? // Use this value when the preceding condition is true.
                'Look at you. All done!'
              : // Use this alternative when the preceding condition is false.
                'Every little step counts.'}
            {/* Finish the h3 element. */}
          </h3>
          {/* Render the p element. */}
          <p>
            {/* Evaluate this JavaScript expression inside the React markup. */}
            {completed
              ? // Use this value when the preceding condition is true.
                `${completed} of ${todos.length} tasks complete. Keep going at your own pace.`
              : // Use this alternative when the preceding condition is false.
                'There’s no rush. Just a little more progress than yesterday.'}
            {/* Finish the p element. */}
          </p>
          {/* Finish the div element. */}
        </div>
        {/* Render the a element. */}
        <a href="/?view=completed">
          {/* Display the text: See your progress <ArrowRight size={17} />. */}
          See your progress <ArrowRight size={17} />
          {/* Finish the a element. */}
        </a>
        {/* Finish the section element. */}
      </section>
      {/* Render the reusable TaskForm component. */}
      <TaskForm
        // Control whether the dialog should be visible.
        open={formOpen}
        // Pass the task being displayed, edited, or deleted.
        todo={editing}
        // Tell the parent component how to close this dialog.
        onClose={() => setFormOpen(false)}
        // Give the form the asynchronous task-saving callback.
        onSave={saveTask}
        // Finish this self-closing React element.
      />
      {/* Render the reusable DeleteDialog component. */}
      <DeleteDialog
        // Pass the task being displayed, edited, or deleted.
        todo={deleting}
        // Tell the parent component how to close this dialog.
        onClose={() => setDeleting(null)}
        // Give the confirmation dialog the asynchronous deletion callback.
        onDelete={async () => {
          // Take this branch when the condition holds: !deleting.
          if (!deleting) return;
          // Wait for the API to confirm permanent deletion.
          await api.delete(deleting.id);
          // Update the collection of tasks in React state.
          setTodos((current) => current.filter((todo) => todo.id !== deleting.id));
          // Update the success notification text in React state.
          setNotice('Task deleted. A little more breathing room.');
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
    {/* Render the reusable ListPage component. */}
    <ListPage />
    {/* Finish the StrictMode element. */}
  </StrictMode>,
  // Finish the current expression or function call.
);
