// Reusable React UI: navigation, dialogs, forms, badges, and request feedback.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Check, CircleHelp, Flag, Layers3, Plus, X } from 'lucide-react';
import type { CreateTodo, Priority, Project, Todo } from '../../shared/types';
// Import the requried exports from ./helpers.
import { messageOf } from './helpers';

export function Shell({
  children,
  // Update active with the result of this expression.
  active = 'all',
  onAdd,
  detail = false,
  // Describe the types of the destructured component properties.
}: {
  children: ReactNode;
  active?: string;
  // Optionally provide on add.
  onAdd?: () => void;
  detail?: boolean;
}) {
  // Track whether the help dialog is open; setHelpOpen changes that value.
  const [helpOpen, setHelpOpen] = useState(false);
  const links = [
    { key: 'all', text: 'All', href: '/' },
    // Define the Today navigation link to /?view=today.
    { key: 'today', text: 'Today', href: '/?view=today' },
    { key: 'upcoming', text: 'Upcoming', href: '/?view=upcoming' },
    { key: 'completed', text: 'Done', href: '/?view=completed' },
  ];

  // Return the following React markup or multiline result.
  return (
    <div className="app-shell simple-shell">
      <a className="skip-link" href="#main">
        {/* Display the text: Skip to content. */}
        Skip to content
      </a>

      <header className="simple-header">
        {/* Render the div element. */}
        <div className="brand-row">
          <a href="/" className="brand-inline">
            <Check size={18} strokeWidth={3} />
            {/* Display the text: Todo. */}
            Todo
          </a>
        </div>

        {/* Render the nav element. */}
        <nav className="simple-nav" aria-label="Main navigation">
          {links.map(({ key, text, href }) => (
            <a
              // Give React a stable identity for this item or form.
              key={key}
              href={href}
              className={active === key && !detail ? 'active' : ''}
              // Identify the active navigation destination.
              aria-current={active === key && !detail ? 'page' : undefined}
            >
              {text}
            </a>
          ))}
        </nav>

        {/* Render the div element. */}
        <div className="header-actions">
          {onAdd && (
            <button className="button primary" onClick={onAdd}>
              {/* Render the reusable Plus component. */}
              <Plus size={16} /> Add task
            </button>
          )}
          {/* Render the button element. */}
          <button className="button secondary" onClick={() => setHelpOpen(true)}>
            Help
          </button>
        </div>
      </header>

      {/* Render the main element. */}
      <main id="main" className="simple-main">
        {children}
      </main>

      {/* Render the footer element. */}
      <footer className="page-footer">
        <span>Made for daily focus</span>
      </footer>

      {/* Render the reusable Modal component. */}
      <Modal open={helpOpen} title="Quick help" onClose={() => setHelpOpen(false)}>
        <div className="help-content">
          <p>
            {/* Display the text: Add a task, set a due date, and keep your list focused. Click any task to view details.. */}
            Add a task, set a due date, and keep your list focused. Click any task to view details.
          </p>
          <ul>
            {/* Render the li element. */}
            <li>Use Today and Upcoming to plan your day.</li>
            <li>Complete tasks when done, or reopen them later.</li>
            <li>Search and filter to stay focused on what matters now.</li>
          </ul>
        </div>
        {/* Render the div element. */}
        <div className="modal-actions">
          <button className="button primary" onClick={() => setHelpOpen(false)}>
            Got it
          </button>
        </div>
      </Modal>
    </div>
  );
}

// Coordinate the native dialog with React state and keyboard focus.
export function Modal({
  open,
  title,
  onClose,
  children,
  // Describe the types of the destructured component properties.
}: {
  open: boolean;
  title: string;
  // Specify on close.
  onClose: () => void;
  children: ReactNode;
}) {
  // Calculate or store ref.
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) {
      // Open the native modal dialog, enabling its focus trap and backdrop.
      ref.current?.showModal();
      ref.current?.querySelector<HTMLInputElement>('[data-autofocus]')?.focus();
    }
    if (!open && ref.current?.open) ref.current?.close();
    // Use open as the dependencies that trigger this React hook to update.
  }, [open]);
  return (
    <dialog
      // Attach the DOM element to this React reference.
      ref={ref}
      className="modal"
      aria-label={title}
      // Handle Escape without letting dialog state drift out of sync.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {/* Render the div element. */}
      <div className="modal-heading">
        <div>
          <span className="eyebrow">A LITTLE MORE CLARITY</span>
          {/* Render the h2 element. */}
          <h2>{title}</h2>
        </div>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          {/* Render the reusable X component. */}
          <X size={20} />
        </button>
      </div>
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {children}
    </dialog>
  );
}

// Collect and validate editable task fields before saving.
export function TaskForm({
  open,
  todo,
  onClose,
  onSave,
  // Describe the types of the destructured component properties.
}: {
  open: boolean;
  todo?: Todo;
  // Specify on close.
  onClose: () => void;
  onSave: (data: CreateTodo) => Promise<void>;
}) {
  // Track whether a save or delete is in progress; setBusy changes that value.
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    // Clear old form errors when the dialog is opened.
    if (open) setError('');
  }, [open]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser’s default action so this handler controls the interaction.
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    // Update the error message or error object in React state.
    setError('');
    try {
      const title = String(form.get('title')).trim();
      // Reject a title that is empty after trimming.
      if (!title) throw new Error('Give your task a title.');
      await onSave({
        title,
        // Specify the task notes.
        description: String(form.get('description')).trim(),
        priority: form.get('priority') as Priority,
        project: form.get('project') as Project,
        // Specify the optional calendar due date.
        dueDate: String(form.get('dueDate')) || null,
      });
      onClose();
      // Handle a failure from the preceding operation.
    } catch (error) {
      setError(messageOf(error));
    } finally {
      // Update whether a save or delete is in progress in React state.
      setBusy(false);
    }
  }
  // Return the following React markup or multiline result.
  return (
    <Modal
      open={open}
      // Supply the heading or descriptive text for this component.
      title={todo ? 'Make it your own.' : 'What’s on your mind?'}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {open && (
        <form key={todo?.id ?? 'new'} onSubmit={submit}>
          <fieldset disabled={busy} className="form-fields">
            {/* Render the label element. */}
            <label>
              Task title <span className="required">*</span>
              <input
                // Identify this form field when FormData reads it.
                name="title"
                placeholder="A small step toward something good…"
                defaultValue={todo?.title}
                required
                // Limit the amount of text accepted by the field.
                maxLength={200}
                data-autofocus
              />
            </label>
            {/* Render the label element. */}
            <label>
              Notes <span className="optional">optional</span>
              <textarea
                // Identify this form field when FormData reads it.
                name="description"
                placeholder="Add a little context, a link, or a plan."
                defaultValue={todo?.description}
                // Limit the amount of text accepted by the field.
                maxLength={5000}
                rows={4}
              />
            </label>
            {/* Render the div element. */}
            <div className="form-grid">
              <label>
                Project
                {/* Render the select element. */}
                <select name="project" defaultValue={todo?.project ?? 'personal'}>
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  {/* Render the option element. */}
                  <option value="learning">Learning</option>
                </select>
              </label>
              {/* Render the label element. */}
              <label>
                Priority
                <select name="priority" defaultValue={todo?.priority ?? 'medium'}>
                  {/* Render the option element. */}
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>
              </label>
            </div>
            {/* Render the label element. */}
            <label>
              Due date <span className="optional">optional</span>
              <input
                // Select the native input or button behavior.
                type="date"
                name="dueDate"
                min="0001-01-01"
                // Set the max attribute or component property.
                max="9999-12-31"
                defaultValue={todo?.dueDate ?? ''}
              />
            </label>
          </fieldset>
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {/* Render the div element. */}
          <div className="modal-actions">
            <button type="button" className="button secondary" disabled={busy} onClick={onClose}>
              Cancel
            </button>
            {/* Render the button element. */}
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

// Ask for confirmation and keep deletion errors in the dialog.
export function DeleteDialog({
  todo,
  onClose,
  onDelete,
  // Describe the types of the destructured component properties.
}: {
  todo: Todo | null;
  onClose: () => void;
  // Specify on delete.
  onDelete: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  // Track the error message or error object; setError changes that value.
  const [error, setError] = useState('');
  useEffect(() => {
    setError('');
    // Use todo as the dependencies that trigger this React hook to update.
  }, [todo]);
  return (
    <Modal
      // Control whether the dialog should be visible.
      open={!!todo}
      title="Let this one go?"
      onClose={() => {
        // Allow closing only when no save or delete is in progress.
        if (!busy) onClose();
      }}
    >
      {/* Render the p element. */}
      <p className="delete-copy">“{todo?.title}” will be permanently deleted.</p>
      {error && (
        <p role="alert" className="form-error">
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {error}
        </p>
      )}
      {/* Render the div element. */}
      <div className="modal-actions">
        <button className="button secondary" disabled={busy} onClick={onClose}>
          Keep task
        </button>
        {/* Render the button element. */}
        <button
          className="button danger"
          disabled={busy}
          // Run this handler when the user activates the control.
          onClick={async () => {
            setBusy(true);
            setError('');
            // Attempt the operation so failures can be handled below.
            try {
              await onDelete();
              onClose();
              // Handle a failure from the preceding operation.
            } catch (error) {
              setError(messageOf(error));
            } finally {
              // Update whether a save or delete is in progress in React state.
              setBusy(false);
            }
          }}
        >
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {busy ? 'Deleting…' : 'Delete task'}
        </button>
      </div>
    </Modal>
  );
}

// Display the task’s priority with its matching visual style.
export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`priority-badge ${priority}`}>
      {/* Render the reusable Flag component. */}
      <Flag size={11} />
      {priority}
    </span>
  );
}

// Link the project label to that project’s task-list document.
export function ProjectBadge({ project }: { project: Project }) {
  return (
    <a className={`project-badge ${project}`} href={`/?project=${project}`}>
      {/* Render the span element. */}
      <span className={`project-dot ${project}`} />
      {project}
    </a>
  );
}

// Show accessible feedback while a request is pending.
export function LoadingState() {
  return (
    <div className="loading-state" role="status">
      {/* Render the span element. */}
      <span className="spinner" />
      Making a little space for your tasks…
    </div>
  );
}

// Explain a request failure and offer retry or navigation.
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      {/* Render the reusable CircleHelp component. */}
      <CircleHelp size={28} />
      <h2>Something needs a moment.</h2>
      <p>{message}</p>
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {onRetry ? (
        <button className="button secondary" onClick={onRetry}>
          Try again
        </button>
      ) : (
        // Render the alternative content when the condition is false.
        <a className="button secondary" href="/">
          Back to tasks
        </a>
      )}
    </div>
  );
}

// Display a temporary success notification.
export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    if (message) {
      // Calculate or store timer.
      const timer = window.setTimeout(onClose, 4500);
      return () => window.clearTimeout(timer);
    }
    // Use message, onClose as the dependencies that trigger this React hook to update.
  }, [message, onClose]);
  return message ? (
    <div className="toast" role="status">
      {/* Render the reusable Check component. */}
      <Check size={17} />
      <span>{message}</span>
      <button aria-label="Dismiss notification" onClick={onClose}>
        {/* Render the reusable X component. */}
        <X size={16} />
      </button>
    </div>
  ) : null;
}

// Explain an empty result and offer an appropriate next action.
export function EmptyState({
  filtered,
  onAdd,
  onReset,
  // Describe the types of the destructured component properties.
}: {
  filtered: boolean;
  onAdd: () => void;
  // Specify on reset.
  onReset: () => void;
}) {
  return (
    // Render the div element.
    <div className="empty-state">
      <div className="empty-icon">
        <Layers3 size={30} strokeWidth={1.4} />
        {/* Render the span element. */}
        <span>
          <Check size={12} />
        </span>
      </div>
      {/* Render the h3 element. */}
      <h3>{filtered ? 'A little breathing room.' : 'Good things start with one task.'}</h3>
      <p>
        {filtered
          ? 'No tasks match this view. Try another filter or make a little plan.'
          : 'Clear your head. Write it down. Take it one step at a time.'}
      </p>
      {/* Render the button element. */}
      <button className="button secondary" onClick={filtered ? onReset : onAdd}>
        {filtered ? 'View all tasks' : 'Add your first task'}
        <Plus size={16} />
      </button>
    </div>
  );
}
