import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { CreateTodo, Priority, Todo } from '../../shared/types';
import { api } from './api';
import {
  DeleteDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PriorityBadge,
  ProjectBadge,
  Shell,
  TaskForm,
  Toast,
} from './components';
import { dueLabel, localDate, messageOf, overdue } from './helpers';
import './styles.css';

const params = new URLSearchParams(window.location.search);
const view = ['today', 'upcoming', 'completed'].includes(params.get('view') ?? '')
  ? params.get('view')!
  : 'all';
const project = ['personal', 'work', 'learning'].includes(params.get('project') ?? '')
  ? params.get('project')
  : null;
const viewNames: Record<string, string> = {
  all: 'Your tasks',
  today: 'A plan for today',
  upcoming: 'On the horizon',
  completed: 'Look how far you’ve come',
};
const priorityRank = { high: 0, medium: 1, low: 2 };

function ListPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [sort, setSort] = useState('newest');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo>();
  const [deleting, setDeleting] = useState<Todo | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const dismissNotice = useCallback(() => setNotice(''), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTodos(await api.list());
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completed = todos.filter((todo) => todo.completed).length;
  const today = todos.filter((todo) => !todo.completed && todo.dueDate === localDate()).length;
  const progress = todos.length ? Math.round((completed / todos.length) * 100) : 0;
  const inView = useMemo(
    () =>
      todos.filter((todo) => {
        if (project && todo.project !== project) return false;
        if (view === 'today') return !todo.completed && todo.dueDate === localDate();
        if (view === 'upcoming')
          return !todo.completed && !!todo.dueDate && todo.dueDate > localDate();
        if (view === 'completed') return todo.completed;
        return true;
      }),
    [todos],
  );
  const visible = useMemo(
    () =>
      inView
        .filter((todo) => {
          if (status === 'active' && todo.completed) return false;
          if (status === 'completed' && !todo.completed) return false;
          if (priority !== 'all' && todo.priority !== priority) return false;
          const needle = query.trim().toLowerCase();
          return `${todo.title} ${todo.description}`.toLowerCase().includes(needle);
        })
        .sort((a, b) => {
          if (sort === 'priority')
            return (
              priorityRank[a.priority] - priorityRank[b.priority] ||
              b.createdAt.localeCompare(a.createdAt)
            );
          if (sort === 'dueDate')
            return (
              (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99') ||
              b.createdAt.localeCompare(a.createdAt)
            );
          return sort === 'oldest'
            ? a.createdAt.localeCompare(b.createdAt)
            : b.createdAt.localeCompare(a.createdAt);
        }),
    [inView, status, priority, query, sort],
  );

  function addTask() {
    setEditing(undefined);
    setFormOpen(true);
  }
  async function saveTask(data: CreateTodo) {
    const saved = editing ? await api.update(editing.id, data) : await api.create(data);
    setTodos((current) =>
      editing ? current.map((todo) => (todo.id === saved.id ? saved : todo)) : [saved, ...current],
    );
    setNotice(
      editing ? 'A little clearer. Task updated.' : 'One less thing on your mind. Task added.',
    );
  }
  async function toggle(todo: Todo) {
    setPending((current) => new Set(current).add(todo.id));
    setActionError('');
    try {
      const saved = await api.update(todo.id, { completed: !todo.completed });
      setTodos((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setNotice(
        saved.completed ? 'A small win. Nicely done.' : 'Task reopened. Take it at your pace.',
      );
    } catch (error) {
      setActionError(messageOf(error));
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(todo.id);
        return next;
      });
    }
  }

  return (
    <Shell active={project ?? view} onAdd={addTask}>
      <section className="page-intro">
        <div>
          <div className="eyebrow">
            <span className="tiny-sun">✳</span> ROOM TO FOCUS
          </div>
          <h1>
            A little focus.
            <br />
            <span>A lot of possibility.</span>
          </h1>
          <p>Get it out of your head and into your day.</p>
        </div>
        <button className="button primary add-main" onClick={addTask}>
          <Plus size={18} />
          New task
        </button>
      </section>
      <section className="overview" aria-label="Task overview">
        <div className="stat-card">
          <div>
            <span className="stat-label">All tasks</span>
            <strong>
              {loading || error ? '—' : todos.length}
              <span>things on your mind</span>
            </strong>
          </div>
          <span className="stat-icon sage">
            <ListTodo size={22} />
          </span>
        </div>
        <div className="stat-card">
          <div>
            <span className="stat-label">Completed</span>
            <strong>
              {loading || error ? '—' : completed}
              <span>little wins, big progress</span>
            </strong>
          </div>
          <span className="stat-icon lavender">
            <CheckCheck size={22} />
          </span>
        </div>
        <div className="stat-card">
          <div>
            <span className="stat-label">Due today</span>
            <strong>
              {loading || error ? '—' : today}
              <span>a good place to start</span>
            </strong>
          </div>
          <span className="stat-icon peach">
            <CalendarDays size={21} />
          </span>
        </div>
      </section>
      <section className="task-section" aria-labelledby="task-heading">
        <div className="section-heading">
          <div>
            <h2 id="task-heading">
              {project ? `${project[0].toUpperCase()}${project.slice(1)} tasks` : viewNames[view]}
              <span className="count-badge">{loading || error ? '—' : inView.length}</span>
            </h2>
            <p>
              {view === 'completed'
                ? 'Every checkmark is a step forward.'
                : 'One thing at a time. You’ve got this.'}
            </p>
          </div>
          <span className="section-decoration">
            <Sparkles size={17} /> Make room for what matters
          </span>
        </div>
        <div className="task-panel">
          <div className="task-toolbar">
            <div className="status-tabs" aria-label="Filter by status">
              {[
                { key: 'all', label: 'All tasks', icon: ListTodo },
                { key: 'active', label: 'Active', icon: Circle },
                { key: 'completed', label: 'Completed', icon: CheckCheck },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setStatus(key)}
                  aria-pressed={status === key}
                  className={status === key ? 'selected' : ''}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
            <label className="sort-control">
              <ArrowDownWideNarrow size={16} />
              <select
                aria-label="Sort tasks"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="dueDate">Due date</option>
                <option value="priority">Priority</option>
              </select>
            </label>
          </div>
          <div className="filter-row">
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Search tasks"
                placeholder="Find a little something…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button
                  className="icon-button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <label className="priority-filter">
              <span className="sr-only">Filter priority</span>
              <select
                aria-label="Filter priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="all">All priorities</option>
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
            </label>
          </div>
          {actionError && (
            <div className="action-error" role="alert">
              {actionError}
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setActionError('')}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
          ) : visible.length ? (
            <>
              <div className="list-column-labels" aria-hidden="true">
                <span>TASK</span>
                <span>PROJECT</span>
                <span>PRIORITY</span>
                <span>DUE DATE</span>
                <span />
              </div>
              <ul className="task-list">
                {visible.map((todo) => (
                  <li key={todo.id} className={`task-row ${todo.completed ? 'is-completed' : ''}`}>
                    <div className="task-main">
                      <button
                        className={`completion-control ${todo.completed ? 'checked' : ''}`}
                        aria-label={`${todo.completed ? 'Reopen' : 'Complete'} ${todo.title}`}
                        aria-pressed={todo.completed}
                        disabled={pending.has(todo.id)}
                        onClick={() => void toggle(todo)}
                      >
                        {todo.completed && <Check size={13} strokeWidth={3} />}
                      </button>
                      <div className="task-text">
                        <a
                          className="task-title"
                          href={`/todo.html?id=${encodeURIComponent(todo.id)}`}
                        >
                          {todo.title}
                        </a>
                        {todo.description && <p>{todo.description}</p>}
                        <div className="mobile-task-meta">
                          <ProjectBadge project={todo.project} />
                          <span>{dueLabel(todo.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="row-project">
                      <ProjectBadge project={todo.project} />
                    </div>
                    <div className="row-priority">
                      <PriorityBadge priority={todo.priority as Priority} />
                    </div>
                    <div
                      className={`row-date ${overdue(todo) ? 'overdue' : ''} ${todo.dueDate === localDate() && !todo.completed ? 'due-today' : ''}`}
                    >
                      <CalendarDays size={13} />
                      <span>
                        {dueLabel(todo.dueDate)}
                        {overdue(todo) && <small>Overdue</small>}
                      </span>
                    </div>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label={`Edit ${todo.title}`}
                        disabled={pending.has(todo.id)}
                        onClick={() => {
                          setEditing(todo);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button delete-action"
                        aria-label={`Delete ${todo.title}`}
                        disabled={pending.has(todo.id)}
                        onClick={() => setDeleting(todo)}
                      >
                        <Trash2 size={15} />
                      </button>
                      <a
                        className="icon-button open-task"
                        aria-label={`View ${todo.title}`}
                        href={`/todo.html?id=${encodeURIComponent(todo.id)}`}
                      >
                        <ChevronRight size={16} />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
              <button className="inline-add" onClick={addTask}>
                <Plus size={17} />
                Add another task<span>A fresh start, one line at a time</span>
              </button>
            </>
          ) : (
            <EmptyState
              filtered={
                todos.length > 0 ||
                !!query ||
                !!project ||
                view !== 'all' ||
                status !== 'all' ||
                priority !== 'all'
              }
              onAdd={addTask}
              onReset={() => {
                if (view !== 'all' || project) window.location.assign('/');
                else {
                  setQuery('');
                  setStatus('all');
                  setPriority('all');
                }
              }}
            />
          )}
          <div className="list-footer">
            <span>
              {loading || error
                ? 'Your space to get things done'
                : `${visible.length} ${visible.length === 1 ? 'task' : 'tasks'} in this view`}
            </span>
            <span>
              <span className="saved-dot" />
              Saved as you go
            </span>
          </div>
        </div>
      </section>
      <section className="progress-note">
        <div
          className="progress-ring"
          style={{ background: `conic-gradient(var(--olive) ${progress}%, #e5e7db 0)` }}
        >
          <span>
            {progress}
            <small>%</small>
          </span>
        </div>
        <div>
          <h3>
            {progress === 100 && todos.length
              ? 'Look at you. All done!'
              : 'Every little step counts.'}
          </h3>
          <p>
            {completed
              ? `${completed} of ${todos.length} tasks complete. Keep going at your own pace.`
              : 'There’s no rush. Just a little more progress than yesterday.'}
          </p>
        </div>
        <a href="/?view=completed">
          See your progress <ArrowRight size={17} />
        </a>
      </section>
      <TaskForm
        open={formOpen}
        todo={editing}
        onClose={() => setFormOpen(false)}
        onSave={saveTask}
      />
      <DeleteDialog
        todo={deleting}
        onClose={() => setDeleting(null)}
        onDelete={async () => {
          if (!deleting) return;
          await api.delete(deleting.id);
          setTodos((current) => current.filter((todo) => todo.id !== deleting.id));
          setNotice('Task deleted. A little more breathing room.');
        }}
      />
      <Toast message={notice} onClose={dismissNotice} />
    </Shell>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ListPage />
  </StrictMode>,
);
