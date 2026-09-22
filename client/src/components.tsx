// Reusable React UI: navigation, dialogs, forms, badges, and request feedback.
// Import the required exports from react.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
// Import the required exports from lucide-react.
import { Check, CircleHelp, Flag, Layers3, Plus, X } from 'lucide-react';
// Import compile-time types from ../../shared/types.
import type { CreateTodo, Priority, Project, Todo } from '../../shared/types';
// Import the required exports from ./helpers.
import { messageOf } from './helpers';

// Render the shared page layout and normal document-navigation links.
export function Shell({
  // Supply children to the enclosing expression.
  children,
  // Update active with the result of this expression.
  active = 'all',
  // Supply on add to the enclosing expression.
  onAdd,
  // Update detail with the result of this expression.
  detail = false,
  // Describe the types of the destructured component properties.
}: {
  // Specify children.
  children: ReactNode;
  // Optionally provide active.
  active?: string;
  // Optionally provide on add.
  onAdd?: () => void;
  // Optionally provide detail.
  detail?: boolean;
  // Begin the function body after its parameter list.
}) {
  // Track whether the help dialog is open; setHelpOpen changes that value.
  const [helpOpen, setHelpOpen] = useState(false);
  // Calculate or store links.
  const links = [
    // Define the All navigation link to /.
    { key: 'all', text: 'All', href: '/' },
    // Define the Today navigation link to /?view=today.
    { key: 'today', text: 'Today', href: '/?view=today' },
    // Define the Upcoming navigation link to /?view=upcoming.
    { key: 'upcoming', text: 'Upcoming', href: '/?view=upcoming' },
    // Define the Done navigation link to /?view=completed.
    { key: 'completed', text: 'Done', href: '/?view=completed' },
    // Finish the array of values.
  ];

  // Return the following React markup or multiline result.
  return (
    // Render the div element.
    <div className="app-shell simple-shell">
      {/* Render the a element. */}
      <a className="skip-link" href="#main">
        {/* Display the text: Skip to content. */}
        Skip to content
        {/* Finish the a element. */}
      </a>

      {/* Render the header element. */}
      <header className="simple-header">
        {/* Render the div element. */}
        <div className="brand-row">
          {/* Render the a element. */}
          <a href="/" className="brand-inline">
            {/* Render the reusable Check component. */}
            <Check size={18} strokeWidth={3} />
            {/* Display the text: Todo. */}
            Todo
            {/* Finish the a element. */}
          </a>
          {/* Finish the div element. */}
        </div>

        {/* Render the nav element. */}
        <nav className="simple-nav" aria-label="Main navigation">
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {links.map(({ key, text, href }) => (
            // Render the a element.
            <a
              // Give React a stable identity for this item or form.
              key={key}
              // Set the normal document-navigation destination.
              href={href}
              // Choose the CSS classes for this element.
              className={active === key && !detail ? 'active' : ''}
              // Identify the active navigation destination.
              aria-current={active === key && !detail ? 'page' : undefined}
              // Finish the opening tag and begin its child content.
            >
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {text}
              {/* Finish the a element. */}
            </a>
            // Close the current block or object.
          ))}
          {/* Finish the nav element. */}
        </nav>

        {/* Render the div element. */}
        <div className="header-actions">
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {onAdd && (
            // Render the button element.
            <button className="button primary" onClick={onAdd}>
              {/* Render the reusable Plus component. */}
              <Plus size={16} /> Add task
              {/* Finish the button element. */}
            </button>
            // Close the current block or object.
          )}
          {/* Render the button element. */}
          <button className="button secondary" onClick={() => setHelpOpen(true)}>
            {/* Display the text: Help. */}
            Help
            {/* Finish the button element. */}
          </button>
          {/* Finish the div element. */}
        </div>
        {/* Finish the header element. */}
      </header>

      {/* Render the main element. */}
      <main id="main" className="simple-main">
        {/* Evaluate this JavaScript expression inside the React markup. */}
        {children}
        {/* Finish the main element. */}
      </main>

      {/* Render the footer element. */}
      <footer className="page-footer">
        {/* Render the span element. */}
        <span>Keep it simple.</span>
        {/* Render the span element. */}
        <span>Made for daily focus</span>
        {/* Finish the footer element. */}
      </footer>

      {/* Render the reusable Modal component. */}
      <Modal open={helpOpen} title="Quick help" onClose={() => setHelpOpen(false)}>
        {/* Render the div element. */}
        <div className="help-content">
          {/* Render the p element. */}
          <p>
            {/* Display the text: Add a task, set a due date, and keep your list focused. Click any task to view details.. */}
            Add a task, set a due date, and keep your list focused. Click any task to view details.
            {/* Finish the p element. */}
          </p>
          {/* Render the ul element. */}
          <ul>
            {/* Render the li element. */}
            <li>Use Today and Upcoming to plan your day.</li>
            {/* Render the li element. */}
            <li>Complete tasks when done, or reopen them later.</li>
            {/* Render the li element. */}
            <li>Search and filter to stay focused on what matters now.</li>
            {/* Finish the ul element. */}
          </ul>
          {/* Finish the div element. */}
        </div>
        {/* Render the div element. */}
        <div className="modal-actions">
          {/* Render the button element. */}
          <button className="button primary" onClick={() => setHelpOpen(false)}>
            {/* Display the text: Got it. */}
            Got it
            {/* Finish the button element. */}
          </button>
          {/* Finish the div element. */}
        </div>
        {/* Finish the Modal element. */}
      </Modal>
      {/* Finish the div element. */}
    </div>
    // Finish the current expression or function call.
  );
  // Close the current block or object.
}

// Coordinate the native dialog with React state and keyboard focus.
export function Modal({
  // Supply open to the enclosing expression.
  open,
  // Supply the task title to the enclosing expression.
  title,
  // Supply on close to the enclosing expression.
  onClose,
  // Supply children to the enclosing expression.
  children,
  // Describe the types of the destructured component properties.
}: {
  // Specify open.
  open: boolean;
  // Specify the task title.
  title: string;
  // Specify on close.
  onClose: () => void;
  // Specify children.
  children: ReactNode;
  // Begin the function body after its parameter list.
}) {
  // Calculate or store ref.
  const ref = useRef<HTMLDialogElement>(null);
  // Synchronize browser side effects with the component’s dependencies.
  useEffect(() => {
    // Open the native dialog only when React requests it and it is not already open.
    if (open && !ref.current?.open) {
      // Open the native modal dialog, enabling its focus trap and backdrop.
      ref.current?.showModal();
      // Focus the title field after the dialog becomes visible.
      ref.current?.querySelector<HTMLInputElement>('[data-autofocus]')?.focus();
      // Close the current block or object.
    }
    // Close the native dialog when the parent hides it.
    if (!open && ref.current?.open) ref.current?.close();
    // Use open as the dependencies that trigger this React hook to update.
  }, [open]);
  // Return the following React markup or multiline result.
  return (
    // Render the dialog element.
    <dialog
      // Attach the DOM element to this React reference.
      ref={ref}
      // Choose the CSS classes for this element.
      className="modal"
      // Provide a readable name for assistive technology.
      aria-label={title}
      // Handle Escape without letting dialog state drift out of sync.
      onCancel={(event) => {
        // Prevent the browser’s default action so this handler controls the interaction.
        event.preventDefault();
        // Ask the parent component to close this dialog.
        onClose();
        // Close the current block or object.
      }}
      // Finish the opening tag and begin its child content.
    >
      {/* Render the div element. */}
      <div className="modal-heading">
        {/* Render the div element. */}
        <div>
          {/* Render the span element. */}
          <span className="eyebrow">A LITTLE MORE CLARITY</span>
          {/* Render the h2 element. */}
          <h2>{title}</h2>
          {/* Finish the div element. */}
        </div>
        {/* Render the button element. */}
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          {/* Render the reusable X component. */}
          <X size={20} />
          {/* Finish the button element. */}
        </button>
        {/* Finish the div element. */}
      </div>
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {children}
      {/* Finish the dialog element. */}
    </dialog>
    // Finish the current expression or function call.
  );
  // Close the current block or object.
}

// Collect and validate editable task fields before saving.
export function TaskForm({
  // Supply open to the enclosing expression.
  open,
  // Supply the current task object to the enclosing expression.
  todo,
  // Supply on close to the enclosing expression.
  onClose,
  // Supply on save to the enclosing expression.
  onSave,
  // Describe the types of the destructured component properties.
}: {
  // Specify open.
  open: boolean;
  // Optionally provide the current task object.
  todo?: Todo;
  // Specify on close.
  onClose: () => void;
  // Specify on save.
  onSave: (data: CreateTodo) => Promise<void>;
  // Begin the function body after its parameter list.
}) {
  // Track whether a save or delete is in progress; setBusy changes that value.
  const [busy, setBusy] = useState(false);
  // Track the error message or error object; setError changes that value.
  const [error, setError] = useState('');
  // Synchronize browser side effects with the component’s dependencies.
  useEffect(() => {
    // Clear old form errors when the dialog is opened.
    if (open) setError('');
    // Use open as the dependencies that trigger this React hook to update.
  }, [open]);
  // Translate the form fields into the typed save request.
  async function submit(event: FormEvent<HTMLFormElement>) {
    // Prevent the browser’s default action so this handler controls the interaction.
    event.preventDefault();
    // Calculate or store form.
    const form = new FormData(event.currentTarget);
    // Update whether a save or delete is in progress in React state.
    setBusy(true);
    // Update the error message or error object in React state.
    setError('');
    // Attempt the operation so failures can be handled below.
    try {
      // Calculate or store the task title.
      const title = String(form.get('title')).trim();
      // Reject a title that is empty after trimming.
      if (!title) throw new Error('Give your task a title.');
      // Wait for the parent page to persist the form before closing it.
      await onSave({
        // Supply the task title to the enclosing expression.
        title,
        // Specify the task notes.
        description: String(form.get('description')).trim(),
        // Specify the task urgency.
        priority: form.get('priority') as Priority,
        // Specify the task category.
        project: form.get('project') as Project,
        // Specify the optional calendar due date.
        dueDate: String(form.get('dueDate')) || null,
        // Close the current block or object.
      });
      // Ask the parent component to close this dialog.
      onClose();
      // Handle a failure from the preceding operation.
    } catch (error) {
      // Update the error message or error object in React state.
      setError(messageOf(error));
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
    // Render the reusable Modal component.
    <Modal
      // Control whether the dialog should be visible.
      open={open}
      // Supply the heading or descriptive text for this component.
      title={todo ? 'Make it your own.' : 'What’s on your mind?'}
      // Tell the parent component how to close this dialog.
      onClose={() => {
        // Allow closing only when no save or delete is in progress.
        if (!busy) onClose();
        // Close the current block or object.
      }}
      // Finish the opening tag and begin its child content.
    >
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {open && (
        // Render the form element.
        <form key={todo?.id ?? 'new'} onSubmit={submit}>
          {/* Render the fieldset element. */}
          <fieldset disabled={busy} className="form-fields">
            {/* Render the label element. */}
            <label>
              {/* Display the text: Task title <span className="required">*</span>. */}
              Task title <span className="required">*</span>
              {/* Render the input element. */}
              <input
                // Identify this form field when FormData reads it.
                name="title"
                // Show a hint while the input is empty.
                placeholder="A small step toward something good…"
                // Set the initial field value from the selected task or its default.
                defaultValue={todo?.title}
                // Supply required to the enclosing expression.
                required
                // Limit the amount of text accepted by the field.
                maxLength={200}
                // Mark this field for focus after the native dialog opens.
                data-autofocus
                // Finish this self-closing React element.
              />
              {/* Finish the label element. */}
            </label>
            {/* Render the label element. */}
            <label>
              {/* Display the text: Notes <span className="optional">optional</span>. */}
              Notes <span className="optional">optional</span>
              {/* Render the textarea element. */}
              <textarea
                // Identify this form field when FormData reads it.
                name="description"
                // Show a hint while the input is empty.
                placeholder="Add a little context, a link, or a plan."
                // Set the initial field value from the selected task or its default.
                defaultValue={todo?.description}
                // Limit the amount of text accepted by the field.
                maxLength={5000}
                // Set the rows attribute or component property.
                rows={4}
                // Finish this self-closing React element.
              />
              {/* Finish the label element. */}
            </label>
            {/* Render the div element. */}
            <div className="form-grid">
              {/* Render the label element. */}
              <label>
                {/* Display the text: Project. */}
                Project
                {/* Render the select element. */}
                <select name="project" defaultValue={todo?.project ?? 'personal'}>
                  {/* Render the option element. */}
                  <option value="personal">Personal</option>
                  {/* Render the option element. */}
                  <option value="work">Work</option>
                  {/* Render the option element. */}
                  <option value="learning">Learning</option>
                  {/* Finish the select element. */}
                </select>
                {/* Finish the label element. */}
              </label>
              {/* Render the label element. */}
              <label>
                {/* Display the text: Priority. */}
                Priority
                {/* Render the select element. */}
                <select name="priority" defaultValue={todo?.priority ?? 'medium'}>
                  {/* Render the option element. */}
                  <option value="low">Low priority</option>
                  {/* Render the option element. */}
                  <option value="medium">Medium priority</option>
                  {/* Render the option element. */}
                  <option value="high">High priority</option>
                  {/* Finish the select element. */}
                </select>
                {/* Finish the label element. */}
              </label>
              {/* Finish the div element. */}
            </div>
            {/* Render the label element. */}
            <label>
              {/* Display the text: Due date <span className="optional">optional</span>. */}
              Due date <span className="optional">optional</span>
              {/* Render the input element. */}
              <input
                // Select the native input or button behavior.
                type="date"
                // Identify this form field when FormData reads it.
                name="dueDate"
                // Set the min attribute or component property.
                min="0001-01-01"
                // Set the max attribute or component property.
                max="9999-12-31"
                // Set the initial field value from the selected task or its default.
                defaultValue={todo?.dueDate ?? ''}
                // Finish this self-closing React element.
              />
              {/* Finish the label element. */}
            </label>
            {/* Finish the fieldset element. */}
          </fieldset>
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {error && (
            // Render the p element.
            <p role="alert" className="form-error">
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {error}
              {/* Finish the p element. */}
            </p>
            // Close the current block or object.
          )}
          {/* Render the div element. */}
          <div className="modal-actions">
            {/* Render the button element. */}
            <button type="button" className="button secondary" disabled={busy} onClick={onClose}>
              {/* Display the text: Cancel. */}
              Cancel
              {/* Finish the button element. */}
            </button>
            {/* Render the button element. */}
            <button className="button primary" disabled={busy} type="submit">
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {busy ? 'Saving…' : todo ? 'Save changes' : 'Create task'}
              {/* Evaluate this JavaScript expression inside the React markup. */}
              {!busy && <Check size={16} />}
              {/* Finish the button element. */}
            </button>
            {/* Finish the div element. */}
          </div>
          {/* Finish the form element. */}
        </form>
        // Close the current block or object.
      )}
      {/* Finish the Modal element. */}
    </Modal>
    // Finish the current expression or function call.
  );
  // Close the current block or object.
}

// Ask for confirmation and keep deletion errors in the dialog.
export function DeleteDialog({
  // Supply the current task object to the enclosing expression.
  todo,
  // Supply on close to the enclosing expression.
  onClose,
  // Supply on delete to the enclosing expression.
  onDelete,
  // Describe the types of the destructured component properties.
}: {
  // Specify the current task object.
  todo: Todo | null;
  // Specify on close.
  onClose: () => void;
  // Specify on delete.
  onDelete: () => Promise<void>;
  // Begin the function body after its parameter list.
}) {
  // Track whether a save or delete is in progress; setBusy changes that value.
  const [busy, setBusy] = useState(false);
  // Track the error message or error object; setError changes that value.
  const [error, setError] = useState('');
  // Synchronize browser side effects with the component’s dependencies.
  useEffect(() => {
    // Update the error message or error object in React state.
    setError('');
    // Use todo as the dependencies that trigger this React hook to update.
  }, [todo]);
  // Return the following React markup or multiline result.
  return (
    // Render the reusable Modal component.
    <Modal
      // Control whether the dialog should be visible.
      open={!!todo}
      // Supply the heading or descriptive text for this component.
      title="Let this one go?"
      // Tell the parent component how to close this dialog.
      onClose={() => {
        // Allow closing only when no save or delete is in progress.
        if (!busy) onClose();
        // Close the current block or object.
      }}
      // Finish the opening tag and begin its child content.
    >
      {/* Render the p element. */}
      <p className="delete-copy">“{todo?.title}” will be permanently deleted.</p>
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {error && (
        // Render the p element.
        <p role="alert" className="form-error">
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {error}
          {/* Finish the p element. */}
        </p>
        // Close the current block or object.
      )}
      {/* Render the div element. */}
      <div className="modal-actions">
        {/* Render the button element. */}
        <button className="button secondary" disabled={busy} onClick={onClose}>
          {/* Display the text: Keep task. */}
          Keep task
          {/* Finish the button element. */}
        </button>
        {/* Render the button element. */}
        <button
          // Choose the CSS classes for this element.
          className="button danger"
          // Prevent this action while its request is already in progress.
          disabled={busy}
          // Run this handler when the user activates the control.
          onClick={async () => {
            // Update whether a save or delete is in progress in React state.
            setBusy(true);
            // Update the error message or error object in React state.
            setError('');
            // Attempt the operation so failures can be handled below.
            try {
              // Wait for the parent page to delete the selected task.
              await onDelete();
              // Ask the parent component to close this dialog.
              onClose();
              // Handle a failure from the preceding operation.
            } catch (error) {
              // Update the error message or error object in React state.
              setError(messageOf(error));
              // Run cleanup whether the operation succeeds or fails.
            } finally {
              // Update whether a save or delete is in progress in React state.
              setBusy(false);
              // Close the current block or object.
            }
            // Close the current block or object.
          }}
          // Finish the opening tag and begin its child content.
        >
          {/* Evaluate this JavaScript expression inside the React markup. */}
          {busy ? 'Deleting…' : 'Delete task'}
          {/* Finish the button element. */}
        </button>
        {/* Finish the div element. */}
      </div>
      {/* Finish the Modal element. */}
    </Modal>
    // Finish the current expression or function call.
  );
  // Close the current block or object.
}

// Display the task’s priority with its matching visual style.
export function PriorityBadge({ priority }: { priority: Priority }) {
  // Return the following React markup or multiline result.
  return (
    // Render the span element.
    <span className={`priority-badge ${priority}`}>
      {/* Render the reusable Flag component. */}
      <Flag size={11} />
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {priority}
      {/* Finish the span element. */}
    </span>
    // Finish the current expression or function call.
  );
  // Close the current block or object.
}

// Link the project label to that project’s task-list document.
export function ProjectBadge({ project }: { project: Project }) {
  // Return the following React markup or multiline result.
  return (
    // Render the a element.
    <a className={`project-badge ${project}`} href={`/?project=${project}`}>
      {/* Render the span element. */}
      <span className={`project-dot ${project}`} />
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {project}
      {/* Finish the a element. */}
    </a>
    // Finish the current expression or function call.
  );
  // Close the current block or object.
}

// Show accessible feedback while a request is pending.
export function LoadingState() {
  // Return the following React markup or multiline result.
  return (
    // Render the div element.
    <div className="loading-state" role="status">
      {/* Render the span element. */}
      <span className="spinner" />
      {/* Display the text: Making a little space for your tasks…. */}
      Making a little space for your tasks…
      {/* Finish the div element. */}
    </div>
    // Finish the current expression or function call.
  );
  // Close the current block or object.
}

// Explain a request failure and offer retry or navigation.
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  // Return the following React markup or multiline result.
  return (
    // Render the div element.
    <div className="error-state" role="alert">
      {/* Render the reusable CircleHelp component. */}
      <CircleHelp size={28} />
      {/* Render the h2 element. */}
      <h2>Something needs a moment.</h2>
      {/* Render the p element. */}
      <p>{message}</p>
      {/* Evaluate this JavaScript expression inside the React markup. */}
      {onRetry ? (
        // Render the button element.
        <button className="button secondary" onClick={onRetry}>
          {/* Display the text: Try again. */}
          Try again
          {/* Finish the button element. */}
        </button>
      ) : (
        // Render the alternative content when the condition is false.
        // Render the a element.
        <a className="button secondary" href="/">
          {/* Display the text: Back to tasks. */}
          Back to tasks
          {/* Finish the a element. */}
        </a>
        // Close the current block or object.
      )}
      {/* Finish the div element. */}
    </div>
    // Finish the current expression or function call.
  );
  // Close the current block or object.
}

// Display a temporary success notification.
export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  // Synchronize browser side effects with the component’s dependencies.
  useEffect(() => {
    // Schedule dismissal only when a success message is visible.
    if (message) {
      // Calculate or store timer.
      const timer = window.setTimeout(onClose, 4500);
      // Cancel the dismissal timer when this effect cleans up.
      return () => window.clearTimeout(timer);
      // Close the current block or object.
    }
    // Use message, onClose as the dependencies that trigger this React hook to update.
  }, [message, onClose]);
  // Return the computed result to the caller.
  return message ? (
    // Render the div element.
    <div className="toast" role="status">
      {/* Render the reusable Check component. */}
      <Check size={17} />
      {/* Render the span element. */}
      <span>{message}</span>
      {/* Render the button element. */}
      <button aria-label="Dismiss notification" onClick={onClose}>
        {/* Render the reusable X component. */}
        <X size={16} />
        {/* Finish the button element. */}
      </button>
      {/* Finish the div element. */}
    </div>
  ) : // Render nothing when there is no notification message.
  null;
  // Close the current block or object.
}

// Explain an empty result and offer an appropriate next action.
export function EmptyState({
  // Supply filtered to the enclosing expression.
  filtered,
  // Supply on add to the enclosing expression.
  onAdd,
  // Supply on reset to the enclosing expression.
  onReset,
  // Describe the types of the destructured component properties.
}: {
  // Specify filtered.
  filtered: boolean;
  // Specify on add.
  onAdd: () => void;
  // Specify on reset.
  onReset: () => void;
  // Begin the function body after its parameter list.
}) {
  // Return the following React markup or multiline result.
  return (
    // Render the div element.
    <div className="empty-state">
      {/* Render the div element. */}
      <div className="empty-icon">
        {/* Render the reusable Layers3 component. */}
        <Layers3 size={30} strokeWidth={1.4} />
        {/* Render the span element. */}
        <span>
          {/* Render the reusable Check component. */}
          <Check size={12} />
          {/* Finish the span element. */}
        </span>
        {/* Finish the div element. */}
      </div>
      {/* Render the h3 element. */}
      <h3>{filtered ? 'A little breathing room.' : 'Good things start with one task.'}</h3>
      {/* Render the p element. */}
      <p>
        {/* Evaluate this JavaScript expression inside the React markup. */}
        {filtered
          ? // Use this value when the preceding condition is true.
            'No tasks match this view. Try another filter or make a little plan.'
          : // Use this alternative when the preceding condition is false.
            'Clear your head. Write it down. Take it one step at a time.'}
        {/* Finish the p element. */}
      </p>
      {/* Render the button element. */}
      <button className="button secondary" onClick={filtered ? onReset : onAdd}>
        {/* Evaluate this JavaScript expression inside the React markup. */}
        {filtered ? 'View all tasks' : 'Add your first task'}
        {/* Render the reusable Plus component. */}
        <Plus size={16} />
        {/* Finish the button element. */}
      </button>
      {/* Finish the div element. */}
    </div>
    // Finish the current expression or function call.
  );
  // Close the current block or object.
}
