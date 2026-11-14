// The window for ending a test or a whole visit (roadmap 9.1, ADR-048). The clinician must choose a reason
// before the end button works, so a stop is never one click. It's the browser's own modal <dialog>: Esc, ✕ or
// Cancel backs out, and focus goes back to the button that opened it. The caller does the saving.

import { useEffect, useId, useRef, useState, type SubmitEvent } from "react";

type Props = {
  open: boolean;
  title: string; // "End Trail Making?" or "End this session?"
  subtitle: string; // "TEST-002 · Nov 13, 2026"
  explanation: string; // what happens on the client's screen
  confirmLabel: string; // "End test" or "End session"
  reasons: Record<string, string>; // database value → label, the shared reasons first
  onConfirm: (reason: string) => Promise<string | null>; // an error to show, or null once saved
  onClosed: () => void;
};

const secondaryButtonClass =
  "h-12 rounded-lg border-2 border-line bg-surface px-6 font-semibold text-ink hover:bg-hover focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";
const dangerButtonClass =
  "h-12 rounded-lg bg-danger px-6 font-semibold text-white hover:bg-danger-strong focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50";

function StopDialog({ open, title, subtitle, explanation, confirmLabel, reasons, onConfirm, onClosed }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [reason, setReason] = useState<string | null>(null); // nothing chosen at first
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => dialogRef.current?.close();

  // Each opening starts fresh: no reason chosen and no error.
  function handleClose() {
    setReason(null);
    setError(null);
    onClosed();
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || reason === null) return;
    setBusy(true);
    setError(null);
    const failed = await onConfirm(reason);
    setBusy(false);
    if (failed) setError(failed);
    else close();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-surface p-8 text-ink backdrop:bg-ink/60"
    >
      {open && (
        <form onSubmit={submit}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-3xl font-semibold">
                {title}
              </h2>
              <p className="mt-1 text-base text-ink-muted">{subtitle}</p>
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

          {/* Radio buttons in a fieldset, so a screen reader hears the question with each choice. */}
          <fieldset className="mt-6">
            <legend className="font-semibold">Why is it ending?</legend>
            <div className="mt-2 flex flex-col">
              {Object.entries(reasons).map(([value, label]) => (
                <label key={value} className="flex h-12 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-hover">
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="size-5 accent-accent"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <p className="mt-4 text-base text-ink-muted">{explanation}</p>
          {error && (
            <p role="alert" className="mt-3">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            {/* The cursor starts on Cancel, so pressing Enter by mistake doesn't end anything. */}
            <button type="button" onClick={close} autoFocus className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="submit" disabled={busy || reason === null} className={dangerButtonClass}>
              {busy ? "Ending…" : confirmLabel}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

export default StopDialog;
