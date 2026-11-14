// New Test Sequence (roadmap 8.4b, restyled at 8.9): the "New sequence" button on the Clients and client
// pages and the window it opens. The window is the browser's own modal <dialog>: the page behind can't be
// reached, Esc closes it, and focus goes back to the button afterwards.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import SequenceForm, { type CreatedSequence } from "./SequenceForm";
import SequenceLink from "./SequenceLink";
import { buttonClass, dialogBodyClass, dialogClass, dialogCloseClass, dialogHeaderClass } from "./styles";
import { supabase } from "./supabase";

// A pipe between parts of a line. Seen only; a screen reader hears a comma instead of "vertical bar".
function Pipe() {
  return (
    <>
      <span aria-hidden="true"> | </span>
      <span className="sr-only">, </span>
    </>
  );
}

// clientCode, when given, fixes the window to that client (opened from a client's page).
type Props = { onCreated: () => void; clientCode?: string };

function GenerateSequence({ onCreated, clientCode }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
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

  // After the link is copied: close, then go to that client's page, where the new visit shows live.
  // From a client's page, that's where we already are. From the Clients list, the client is found by
  // their ID (RLS); if that fails, the clinician stays on the list, which has re-read itself.
  async function handleCopied(code: string) {
    close();
    if (clientCode) return;
    const { data } = await supabase.from("clients").select("id").eq("code", code).maybeSingle();
    if (data) navigate(`/dashboard/clients/${data.id}`);
  }

  // No subtitle on the form: opened from a client's page, the form itself shows the client ID.
  let subtitle: ReactNode = null;
  if (created) {
    subtitle = (
      <>
        {created.code}
        <Pipe />
        {created.clientIsNew ? "New client" : "Existing client"}
        <Pipe />
        {created.testNames.join(", ")}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCreated(null); // a link that finished saving after the window closed isn't shown again
          setOpen(true);
        }}
        className={buttonClass("primary")}
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
        className={`max-w-xl ${dialogClass}`}
      >
        {open && (
          <>
            <div className={dialogHeaderClass}>
              <div>
                <h2 id="generate-heading" className="text-3xl font-semibold">
                  {created ? "Link ready" : "New Test Sequence"}
                </h2>
                {subtitle && <p className="mt-1 text-base text-ink-muted">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className={dialogCloseClass}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-ink stroke-2">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className={dialogBodyClass}>
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
                <SequenceLink created={created} onCopied={() => handleCopied(created.code)} />
              )}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

export default GenerateSequence;
