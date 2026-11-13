// Generate Test Sequence (roadmap 8.4b): the top-bar button and the window it opens.
// The window is the browser's own modal <dialog>: the page behind can't be reached,
// Esc closes it, and focus goes back to the button afterwards.

import { useEffect, useRef, useState } from "react";
import SequenceForm, { type CreatedSequence } from "./SequenceForm";
import SequenceLink from "./SequenceLink";

const openButtonClass =
  "h-12 rounded-lg bg-accent px-6 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

type Props = { onCreated: () => void };

function GenerateSequence({ onCreated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<CreatedSequence | null>(null);

  // Shown once its contents are on the page, so the first field gets the focus.
  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  function handleClose() {
    setOpen(false);
    setCreated(null);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={openButtonClass}>
        Generate Test Sequence
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        aria-labelledby="generate-heading"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl bg-page p-8 text-ink backdrop:bg-ink/60"
      >
        {open && (
          <>
            <h2 id="generate-heading" className="text-3xl font-bold">
              Generate Test Sequence
            </h2>
            {created === null ? (
              <SequenceForm
                onCreated={(sequence) => {
                  setCreated(sequence);
                  onCreated();
                }}
                onCancel={() => dialogRef.current?.close()}
              />
            ) : (
              <SequenceLink created={created} onDone={() => dialogRef.current?.close()} />
            )}
          </>
        )}
      </dialog>
    </>
  );
}

export default GenerateSequence;
