// Generate Test Sequence (roadmap 8.4b, restyled at 8.9): the "New sequence" button on the Clients and client
// pages and the window it opens. The window is the browser's own modal <dialog>: the page behind can't be
// reached, Esc closes it, and focus goes back to the button afterwards.

import { useEffect, useRef, useState } from "react";
import SequenceForm, { type CreatedSequence } from "./SequenceForm";
import SequenceLink from "./SequenceLink";

const buttonClasses = {
  solid:
    "flex h-12 items-center gap-2 rounded-lg bg-accent px-6 font-semibold text-white hover:bg-accent-strong focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent",
  outline:
    "flex h-12 items-center gap-2 rounded-lg border border-accent bg-surface px-6 font-medium text-accent hover:bg-hover focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent",
};

// clientCode, when given, fixes the window to that client (opened from a client's page).
type Props = { onCreated: () => void; clientCode?: string; look: "solid" | "outline" };

function GenerateSequence({ onCreated, clientCode, look }: Props) {
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

  const close = () => dialogRef.current?.close();

  let subtitle = clientCode ? `New visit for ${clientCode}` : "A link the client opens at home.";
  if (created) {
    const client = created.clientIsNew ? "New client" : "Existing client";
    subtitle = `${created.code} · ${client} · ${created.testNames.join(", ")}`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCreated(null); // a link that finished saving after the window closed isn't shown again
          setOpen(true);
        }}
        className={buttonClasses[look]}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New sequence
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        aria-labelledby="generate-heading"
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-surface p-8 text-ink backdrop:bg-ink/60"
      >
        {open && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="generate-heading" className="text-3xl font-semibold">
                  {created ? "Link ready" : "Generate Test Sequence"}
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
            {created === null ? (
              <SequenceForm
                fixedCode={clientCode}
                onCreated={(sequence) => {
                  setCreated(sequence);
                  onCreated();
                }}
                onCancel={close}
              />
            ) : (
              <SequenceLink created={created} onDone={close} />
            )}
          </>
        )}
      </dialog>
    </>
  );
}

export default GenerateSequence;
