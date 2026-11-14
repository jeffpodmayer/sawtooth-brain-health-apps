// The window for adding, editing or deleting a note (redesigned at 8.9). It's the browser's own modal
// <dialog>: the page behind can't be reached, Esc closes it, and focus goes back to the button that opened it.
// TestNotes does the saving; this only shows what it's given.

import { useEffect, useId, useRef, type ChangeEvent, type SubmitEvent } from "react";
import { formatDateTime } from "./formatDate";

export type Note = {
  id: string;
  body: string;
  created_by: string;
  created_at: string;
  updated_at: string | null; // empty until the text is first changed
  clinicians: { display_name: string } | null; // the author
};

// Delete is opened only from Edit; editDraft is Edit's unsaved text, to go back to on Keep note.
export type NoteDialogState =
  | { mode: "add"; draft: string }
  | { mode: "edit"; note: Note; draft: string }
  | { mode: "delete"; note: Note; editDraft: string }
  | null;

type Props = {
  state: NoteDialogState;
  subtitle: string; // e.g. "Trail Making · TEST-001 · Nov 11, 2026"
  savingAs: string | null;
  busy: boolean;
  error: string | null;
  onDraftChange: (draft: string) => void;
  onSave: (event: SubmitEvent<HTMLFormElement>) => void;
  onAskDelete: () => void;
  onKeep: () => void;
  onConfirmDelete: () => void;
  onClosed: () => void;
};

const fieldClass =
  "mt-2 block w-full rounded-lg border border-field-line bg-white p-4 text-ink placeholder:text-ink-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent";
const primaryButtonClass =
  "h-12 rounded-lg bg-accent px-6 font-semibold text-white hover:bg-accent-strong focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-70";
const secondaryButtonClass =
  "h-12 rounded-lg border-2 border-line bg-surface px-6 font-semibold text-ink hover:bg-hover focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";
const dangerButtonClass =
  "h-12 rounded-lg bg-danger px-6 font-semibold text-white hover:bg-danger-strong focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-70";

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  );
}

function NoteDialog(props: Props) {
  const { state, subtitle, savingAs, busy, error } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const fieldId = useId();
  const hintId = useId();
  const open = state !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      onClose={props.onClosed}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-surface p-8 text-ink backdrop:bg-ink/60"
    >
      {state && state.mode !== "delete" && (
        <form onSubmit={props.onSave}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-3xl font-semibold">
                {state.mode === "add" ? "Add note" : "Edit note"}
              </h2>
              <p className="mt-1 text-base text-ink-muted">{subtitle}</p>
              {state.mode === "edit" && (
                <p className="text-base text-ink-muted">
                  Last saved by {state.note.clinicians?.display_name ?? "—"} ·{" "}
                  {formatDateTime(state.note.updated_at ?? state.note.created_at)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="-mr-3 -mt-2 flex size-12 shrink-0 items-center justify-center rounded-lg hover:bg-hover focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-accent"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-ink stroke-2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <label htmlFor={fieldId} className="mt-6 block font-semibold">
            Note
          </label>
          <textarea
            id={fieldId}
            aria-describedby={hintId}
            autoFocus
            rows={5}
            value={state.draft}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => props.onDraftChange(event.target.value)}
            placeholder="What happened during this test?"
            className={fieldClass}
          />
          <p id={hintId} className="mt-2 flex gap-2 text-base text-ink-muted">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 fill-none stroke-current stroke-2">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Only clinicians see notes. Don't include the client's name or other identifying details.
          </p>
          {error && (
            <p role="alert" className="mt-3">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            {state.mode === "add" ? (
              <p className="text-base text-ink-muted">{savingAs && `Saving as ${savingAs}`}</p>
            ) : (
              <button
                type="button"
                onClick={props.onAskDelete}
                aria-label="Delete note"
                className="flex size-12 items-center justify-center rounded-lg text-danger hover:bg-danger-tint focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-accent"
              >
                <TrashIcon />
              </button>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={close} className={secondaryButtonClass}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={primaryButtonClass}>
                {busy ? "Saving…" : state.mode === "add" ? "Save note" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      )}

      {state?.mode === "delete" && (
        <>
          <h2 id={titleId} className="text-3xl font-semibold">
            Delete this note?
          </h2>
          <p className="mt-2 text-base text-ink-muted">{subtitle}. Other clinicians will no longer see it.</p>
          <div className="mt-4 rounded-lg bg-page p-4">
            <p className="whitespace-pre-wrap break-words">{state.note.body}</p>
            <p className="mt-2 text-base text-ink-muted">
              {state.note.clinicians?.display_name ?? "—"} · {formatDateTime(state.note.created_at)}
            </p>
          </div>
          {error && (
            <p role="alert" className="mt-3">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            {/* The cursor starts on Keep note, so pressing Enter by mistake doesn't delete. */}
            <button type="button" onClick={props.onKeep} autoFocus className={secondaryButtonClass}>
              Keep note
            </button>
            <button type="button" onClick={props.onConfirmDelete} disabled={busy} className={dangerButtonClass}>
              {busy ? "Deleting…" : "Delete note"}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}

export default NoteDialog;
