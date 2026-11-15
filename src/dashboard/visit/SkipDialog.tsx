// The window for skipping a step of the running test (ADR-055), such as Trail Making's Skip Part A. The
// clinician confirms, so a step is never skipped by one click. It's the browser's own modal <dialog>: Esc,
// ✕ or Cancel backs out, and focus goes back to the button that opened it. The caller does the saving.

import { useEffect, useId, useRef, useState, type SubmitEvent } from "react";
import { buttonClass, dialogBodyClass, dialogClass, dialogCloseClass, dialogHeaderClass } from "../styles";

type Props = {
  open: boolean;
  title: string; // "Skip Part A?"
  subtitle: string; // "Trail Making · 1234 · Nov 14, 2026"
  explanation: string; // what happens, from the test's skips
  confirmLabel: string; // "Skip Part A"
  onConfirm: () => Promise<string | null>; // an error to show, or null once saved
  onClosed: () => void;
};

function SkipDialog({ open, title, subtitle, explanation, confirmLabel, onConfirm, onClosed }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => dialogRef.current?.close();

  function handleClose() {
    setError(null);
    onClosed();
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const failed = await onConfirm();
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
            <p className="mt-6">{explanation}</p>
            {error && (
              <p role="alert" className="mt-3">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              {/* The cursor starts on Cancel, so pressing Enter by mistake doesn't skip anything. */}
              <button type="button" onClick={close} autoFocus className={buttonClass("secondary")}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={buttonClass("primary")}>
                {busy ? "Skipping…" : confirmLabel}
              </button>
            </div>
          </div>
        </form>
      )}
    </dialog>
  );
}

export default SkipDialog;
