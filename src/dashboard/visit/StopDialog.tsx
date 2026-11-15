// The window for ending a test or a whole visit (roadmap 9.1, ADR-048). The clinician must choose a reason
// before the end button works, so a stop is never one click. It's the browser's own modal <dialog>: Esc, ✕ or
// Cancel backs out, and focus goes back to the button that opened it. The caller does the saving.

import { useEffect, useId, useRef, useState, type SubmitEvent } from "react";
import { buttonClass, dialogBodyClass, dialogClass, dialogCloseClass, dialogHeaderClass } from "../styles";

type Props = {
  open: boolean;
  title: string; // "End Trail Making?" or "End this session?"
  subtitle: string; // "TEST-002 · Nov 13, 2026"
  explanation: string; // what happens on the client's screen
  confirmLabel: string; // "Discontinue" or "End session"
  reasons: Record<string, string>; // database value → label, the shared reasons first
  hints?: Record<string, string>; // database value → a grey note beside its label, e.g. "996 during a sample"
  onConfirm: (reason: string) => Promise<string | null>; // an error to show, or null once saved
  onClosed: () => void;
};

function StopDialog({
  open,
  title,
  subtitle,
  explanation,
  confirmLabel,
  reasons,
  hints = {},
  onConfirm,
  onClosed,
}: Props) {
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
    <dialog ref={dialogRef} onClose={handleClose} aria-labelledby={titleId} className={`max-w-xl ${dialogClass}`}>
      {open && (
        <form onSubmit={submit}>
          <div className={dialogHeaderClass}>
            <div>
              <h2 id={titleId} className="text-3xl font-semibold">
                {title}
              </h2>
              <p className="mt-1 text-base text-ink-muted">{subtitle}</p>
            </div>
            <button type="button" onClick={close} aria-label="Close" className={dialogCloseClass}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-ink stroke-2">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className={dialogBodyClass}>
            {/* Radio buttons in a fieldset, so a screen reader hears the question with each choice. */}
            <fieldset className="mt-6">
              <legend className="font-semibold">Why is it ending?</legend>
              <div className="mt-2 flex flex-col">
                {Object.entries(reasons).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-hover"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={reason === value}
                      onChange={() => setReason(value)}
                      className="size-5 accent-accent"
                    />
                    <span>
                      {label}
                      {hints[value] && <span className="text-base text-ink-muted"> ({hints[value]})</span>}
                    </span>
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
              <button type="button" onClick={close} autoFocus className={buttonClass("secondary")}>
                Cancel
              </button>
              <button type="submit" disabled={busy || reason === null} className={buttonClass("danger")}>
                {busy ? "Ending…" : confirmLabel}
              </button>
            </div>
          </div>
        </form>
      )}
    </dialog>
  );
}

export default StopDialog;
