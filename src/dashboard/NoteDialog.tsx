// The window for adding, editing or deleting a note (redesigned at 8.9). It's the browser's own modal
// <dialog>: the page behind can't be reached, Esc closes it, and focus goes back to the button that opened it.
// TestNotes does the saving; this only shows what it's given.

import { useEffect, useId, useRef, type ChangeEvent, type SubmitEvent } from "react";
import { formatDateTime } from "./formatDate";
import {
  buttonClass,
  dialogBodyClass,
  dialogClass,
  dialogCloseClass,
  dialogHeaderClass,
  textAreaClass,
} from "./styles";

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
    <dialog ref={dialogRef} onClose={props.onClosed} aria-labelledby={titleId} className={`max-w-xl ${dialogClass}`}>
      {state && state.mode !== "delete" && (
        <form onSubmit={props.onSave}>
          <div className={dialogHeaderClass}>
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
            <button type="button" onClick={close} aria-label="Close" className={dialogCloseClass}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-ink stroke-2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className={dialogBodyClass}>
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
              className={`mt-2 ${textAreaClass}`}
            />
            <p id={hintId} className="mt-2 flex gap-2 text-base text-ink-muted">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="mt-0.5 size-4 shrink-0 fill-none stroke-current stroke-2"
              >
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
                  className="flex size-12 items-center justify-center rounded-lg text-danger hover:bg-danger-tint focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-accent"
                >
                  <TrashIcon />
                </button>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={close} className={buttonClass("secondary")}>
                  Cancel
                </button>
                <button type="submit" disabled={busy} className={buttonClass("primary")}>
                  {busy ? "Saving…" : state.mode === "add" ? "Save note" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {state?.mode === "delete" && (
        <>
          <div className={dialogHeaderClass}>
            <div>
              <h2 id={titleId} className="text-3xl font-semibold">
                Delete this note?
              </h2>
              <p className="mt-1 text-base text-ink-muted">{subtitle}. Other clinicians will no longer see it.</p>
            </div>
          </div>
          <div className={dialogBodyClass}>
            <div className="mt-6 rounded-lg border border-line bg-surface p-4">
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
              <button type="button" onClick={props.onKeep} autoFocus className={buttonClass("secondary")}>
                Keep note
              </button>
              <button type="button" onClick={props.onConfirmDelete} disabled={busy} className={buttonClass("danger")}>
                {busy ? "Deleting…" : "Delete note"}
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}

export default NoteDialog;
