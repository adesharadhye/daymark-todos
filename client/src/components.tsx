import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Check, CircleHelp, Flag, Layers3, Plus, X } from 'lucide-react';
import type { CreateTodo, Priority, Project, Todo } from '../../shared/types';
import { messageOf } from './helpers';

export function Shell({
  children,
  active = 'all',
  onAdd,
  detail = false,
}: {
  children: ReactNode;
  active?: string;
  onAdd?: () => void;
  detail?: boolean;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const links = [
    { key: 'all', text: 'All', href: '/' },
    { key: 'today', text: 'Today', href: '/?view=today' },
    { key: 'upcoming', text: 'Upcoming', href: '/?view=upcoming' },
    { key: 'completed', text: 'Done', href: '/?view=completed' },
  ];

  return (
    <div className="app-shell simple-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="simple-header">
        <div className="brand-row">
          <a href="/" className="brand-inline">
            <Check size={18} strokeWidth={3} />
            Todo
          </a>
        </div>

        <nav className="simple-nav" aria-label="Main navigation">
          {links.map(({ key, text, href }) => (
            <a
              key={key}
              href={href}
              className={active === key && !detail ? 'active' : ''}
              aria-current={active === key && !detail ? 'page' : undefined}
            >
              {text}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          {onAdd && (
            <button className="button primary" onClick={onAdd}>
              <Plus size={16} /> Add task
            </button>
          )}
          <button className="button secondary" onClick={() => setHelpOpen(true)}>
            Help
          </button>
        </div>
      </header>

      <main id="main" className="simple-main">
        {children}
      </main>

      <footer className="page-footer">
        <span>Keep it simple.</span>
        <span>Made for daily focus</span>
      </footer>

      <Modal open={helpOpen} title="Quick help" onClose={() => setHelpOpen(false)}>
        <div className="help-content">
          <p>
            Add a task, set a due date, and keep your list focused. Click any task to view details.
          </p>
          <ul>
            <li>Use Today and Upcoming to plan your day.</li>
            <li>Complete tasks when done, or reopen them later.</li>
            <li>Search and filter to stay focused on what matters now.</li>
          </ul>
        </div>
        <div className="modal-actions">
          <button className="button primary" onClick={() => setHelpOpen(false)}>
            Got it
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) {
      ref.current?.showModal();
      ref.current?.querySelector<HTMLInputElement>('[data-autofocus]')?.focus();
    }
    if (!open && ref.current?.open) ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-heading">
        <div>
          <span className="eyebrow">A LITTLE MORE CLARITY</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function TaskForm({
  open,
  todo,
  onClose,
  onSave,
}: {
  open: boolean;
  todo?: Todo;
  onClose: () => void;
  onSave: (data: CreateTodo) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) setError('');
  }, [open]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const title = String(form.get('title')).trim();
      if (!title) throw new Error('Give your task a title.');
      await onSave({
        title,
        description: String(form.get('description')).trim(),
        priority: form.get('priority') as Priority,
        project: form.get('project') as Project,
        dueDate: String(form.get('dueDate')) || null,
      });
      onClose();
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open={open}
      title={todo ? 'Make it your own.' : 'What’s on your mind?'}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {open && (
        <form key={todo?.id ?? 'new'} onSubmit={submit}>
          <fieldset disabled={busy} className="form-fields">
            <label>
              Task title <span className="required">*</span>
              <input
                name="title"
                placeholder="A small step toward something good…"
                defaultValue={todo?.title}
                required
                maxLength={200}
                data-autofocus
              />
            </label>
            <label>
              Notes <span className="optional">optional</span>
              <textarea
                name="description"
                placeholder="Add a little context, a link, or a plan."
                defaultValue={todo?.description}
                maxLength={5000}
                rows={4}
              />
            </label>
            <div className="form-grid">
              <label>
                Project
                <select name="project" defaultValue={todo?.project ?? 'personal'}>
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="learning">Learning</option>
                </select>
              </label>
              <label>
                Priority
                <select name="priority" defaultValue={todo?.priority ?? 'medium'}>
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>
              </label>
            </div>
            <label>
              Due date <span className="optional">optional</span>
              <input
                type="date"
                name="dueDate"
                min="0001-01-01"
                max="9999-12-31"
                defaultValue={todo?.dueDate ?? ''}
              />
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="button secondary" disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button className="button primary" disabled={busy} type="submit">
              {busy ? 'Saving…' : todo ? 'Save changes' : 'Create task'}
              {!busy && <Check size={16} />}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function DeleteDialog({
  todo,
  onClose,
  onDelete,
}: {
  todo: Todo | null;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setError('');
  }, [todo]);
  return (
    <Modal
      open={!!todo}
      title="Let this one go?"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="delete-copy">“{todo?.title}” will be permanently deleted.</p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button className="button secondary" disabled={busy} onClick={onClose}>
          Keep task
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              await onDelete();
              onClose();
            } catch (error) {
              setError(messageOf(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Deleting…' : 'Delete task'}
        </button>
      </div>
    </Modal>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`priority-badge ${priority}`}>
      <Flag size={11} />
      {priority}
    </span>
  );
}

export function ProjectBadge({ project }: { project: Project }) {
  return (
    <a className={`project-badge ${project}`} href={`/?project=${project}`}>
      <span className={`project-dot ${project}`} />
      {project}
    </a>
  );
}

export function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      Making a little space for your tasks…
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <CircleHelp size={28} />
      <h2>Something needs a moment.</h2>
      <p>{message}</p>
      {onRetry ? (
        <button className="button secondary" onClick={onRetry}>
          Try again
        </button>
      ) : (
        <a className="button secondary" href="/">
          Back to tasks
        </a>
      )}
    </div>
  );
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    if (message) {
      const timer = window.setTimeout(onClose, 4500);
      return () => window.clearTimeout(timer);
    }
  }, [message, onClose]);
  return message ? (
    <div className="toast" role="status">
      <Check size={17} />
      <span>{message}</span>
      <button aria-label="Dismiss notification" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  ) : null;
}

export function EmptyState({
  filtered,
  onAdd,
  onReset,
}: {
  filtered: boolean;
  onAdd: () => void;
  onReset: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Layers3 size={30} strokeWidth={1.4} />
        <span>
          <Check size={12} />
        </span>
      </div>
      <h3>{filtered ? 'A little breathing room.' : 'Good things start with one task.'}</h3>
      <p>
        {filtered
          ? 'No tasks match this view. Try another filter or make a little plan.'
          : 'Clear your head. Write it down. Take it one step at a time.'}
      </p>
      <button className="button secondary" onClick={filtered ? onReset : onAdd}>
        {filtered ? 'View all tasks' : 'Add your first task'}
        <Plus size={16} />
      </button>
    </div>
  );
}
