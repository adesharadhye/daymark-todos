import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  FileText,
  Flag,
  Folder,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { CreateTodo, Todo } from '../../shared/types';
import { api } from './api';
import {
  DeleteDialog,
  ErrorState,
  LoadingState,
  PriorityBadge,
  ProjectBadge,
  Shell,
  TaskForm,
  Toast,
} from './components';
import { dueLabel, messageOf, overdue, timestamp } from './helpers';
import './styles.css';

const id = new URLSearchParams(window.location.search).get('id');
const validId = !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function DetailPage() {
  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(validId);
  const [error, setError] = useState(
    !id
      ? 'This page needs a task ID. Open a task from your list to get started.'
      : !validId
        ? 'This task link has an invalid ID. Open a task from your list.'
        : '',
  );
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const dismissNotice = useCallback(() => setNotice(''), []);
  const load = useCallback(async () => {
    if (!id || !validId) return;
    setLoading(true);
    setError('');
    try {
      const task = await api.get(id);
      setTodo(task);
      document.title = `${task.title} · Daymark`;
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(data: CreateTodo) {
    if (creating) {
      const created = await api.create(data);
      window.location.assign(`/todo.html?id=${created.id}`);
    } else if (todo) {
      const saved = await api.update(todo.id, data);
      setTodo(saved);
      document.title = `${saved.title} · Daymark`;
      setNotice('Task updated. A little more clarity.');
    }
  }
  async function toggle() {
    if (!todo) return;
    setBusy(true);
    setActionError('');
    try {
      const saved = await api.update(todo.id, { completed: !todo.completed });
      setTodo(saved);
      setNotice(saved.completed ? 'A small win. Nicely done.' : 'Task reopened. You’ve got this.');
    } catch (error) {
      setActionError(messageOf(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      detail
      onAdd={() => {
        setCreating(true);
        setEditing(false);
      }}
    >
      <a className="back-link" href="/">
        <ArrowLeft size={16} />
        Back to all tasks
      </a>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={validId ? () => void load() : undefined} />
      ) : (
        todo && (
          <>
            <section className="detail-intro">
              <div className="eyebrow">ONE THING AT A TIME</div>
              <div className="detail-title-row">
                <h1 className={todo.completed ? 'finished-title' : ''}>{todo.title}</h1>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    setCreating(false);
                    setEditing(true);
                  }}
                >
                  <Pencil size={16} />
                  Edit task
                </button>
              </div>
              <div className="detail-tags">
                <ProjectBadge project={todo.project} />
                <PriorityBadge priority={todo.priority} />
                <span className={`status-badge ${todo.completed ? 'done' : ''}`}>
                  {todo.completed ? <CheckCheck size={13} /> : <Clock3 size={13} />}
                  {todo.completed ? 'Completed' : 'In progress'}
                </span>
              </div>
            </section>
            {actionError && (
              <p className="action-error" role="alert">
                {actionError}
              </p>
            )}
            <div className="detail-grid">
              <section className="detail-card">
                <button
                  className={`detail-complete ${todo.completed ? 'done' : ''}`}
                  onClick={() => void toggle()}
                  disabled={busy}
                  aria-pressed={todo.completed}
                >
                  <span className={`completion-control ${todo.completed ? 'checked' : ''}`}>
                    {todo.completed && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span>
                    <strong>
                      {busy
                        ? 'Saving…'
                        : todo.completed
                          ? 'One more thing, done.'
                          : 'Ready for a little win?'}
                    </strong>
                    <small>
                      {todo.completed ? 'Click to reopen this task' : 'Mark this task as complete'}
                    </small>
                  </span>
                  {todo.completed && <CheckCheck size={24} />}
                </button>
                <div className="description-section">
                  <h2>
                    <FileText size={17} />
                    The little details
                  </h2>
                  {todo.description ? (
                    <p className="task-description">{todo.description}</p>
                  ) : (
                    <div className="no-description">
                      <p>A little context can go a long way.</p>
                      <button className="text-button" onClick={() => setEditing(true)}>
                        <Plus size={14} />
                        Add some notes
                      </button>
                    </div>
                  )}
                </div>
                <div className="detail-card-footer">
                  <span>
                    <Clock3 size={14} />
                    Updated {timestamp(todo.updatedAt)}
                  </span>
                </div>
              </section>
              <aside className="detail-card properties">
                <h2>At a glance</h2>
                <dl>
                  <div>
                    <dt>
                      <CalendarDays size={16} />
                      Due date
                    </dt>
                    <dd className={overdue(todo) ? 'overdue' : ''}>
                      {dueLabel(todo.dueDate)}
                      {overdue(todo) && <small>Overdue</small>}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Flag size={16} />
                      Priority
                    </dt>
                    <dd>
                      <PriorityBadge priority={todo.priority} />
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Folder size={16} />
                      Project
                    </dt>
                    <dd>
                      <ProjectBadge project={todo.project} />
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Clock3 size={16} />
                      Created
                    </dt>
                    <dd className="date-property">{timestamp(todo.createdAt)}</dd>
                  </div>
                  {todo.completedAt && (
                    <div>
                      <dt>
                        <CheckCheck size={16} />
                        Completed
                      </dt>
                      <dd className="date-property">{timestamp(todo.completedAt)}</dd>
                    </div>
                  )}
                </dl>
                <button
                  className="delete-task-button"
                  disabled={busy}
                  onClick={() => setDeleting(true)}
                >
                  <Trash2 size={15} />
                  Delete task
                </button>
              </aside>
            </div>
            <div className="detail-encouragement">
              <span>✳</span>
              <p>
                You don’t have to do it all.
                <br />
                <strong>Just the next little thing.</strong>
              </p>
            </div>
          </>
        )
      )}
      <TaskForm
        open={editing || creating}
        todo={creating ? undefined : (todo ?? undefined)}
        onClose={() => {
          setEditing(false);
          setCreating(false);
        }}
        onSave={save}
      />
      <DeleteDialog
        todo={deleting ? todo : null}
        onClose={() => setDeleting(false)}
        onDelete={async () => {
          if (todo) {
            await api.delete(todo.id);
            window.location.assign('/');
          }
        }}
      />
      <Toast message={notice} onClose={dismissNotice} />
    </Shell>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DetailPage />
  </StrictMode>,
);
