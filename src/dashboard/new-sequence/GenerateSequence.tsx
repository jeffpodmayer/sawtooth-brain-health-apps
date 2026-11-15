// New Test Sequence (roadmap 8.4b, restyled at 8.9): the "New sequence" button on the Clients and client
// pages and the window it opens. The window is the browser's own modal <dialog>: the page behind can't be
// reached, Esc closes it, and focus goes back to the button afterwards. Create sequence closes it and lands on
// the client's page, where the new visit is open with its Copy link button (no separate "Link ready" step).

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import SequenceForm from "./SequenceForm";
import { buttonClass, dialogBodyClass, dialogClass, dialogCloseClass, dialogHeaderClass } from "../styles";
import { supabase } from "../supabase";

// clientCode, when given, fixes the window to that client (opened from a client's page).
type Props = { onCreated: () => void; clientCode?: string };

function GenerateSequence({ onCreated, clientCode }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Shown once its contents are on the page, so the first field gets the focus.
  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  const close = () => dialogRef.current?.close();

  // Once the visit is created: close, re-read the page, and go to that client's page, where the new visit opens
  // with its Copy link button. From a client's page, that's where we already are. From the Clients list, the
  // client is found by their ID (RLS); if that fails, the clinician stays on the list, which has re-read itself.
  async function handleCreated(code: string) {
    close();
    onCreated();
    if (clientCode) return;
    const { data } = await supabase.from("clients").select("id").eq("code", code).maybeSingle();
    if (data) navigate(`/dashboard/clients/${data.id}`);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("primary")}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New sequence
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-labelledby="generate-heading"
        className={`max-w-xl ${dialogClass}`}
      >
        {open && (
          <>
            <div className={dialogHeaderClass}>
              <h2 id="generate-heading" className="text-3xl font-semibold">
                New Test Sequence
              </h2>
              <button type="button" onClick={close} aria-label="Close" className={dialogCloseClass}>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-ink stroke-2">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className={dialogBodyClass}>
              <SequenceForm
                fixedCode={clientCode}
                onCreated={(sequence) => handleCreated(sequence.code)}
                onCancel={close}
              />
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

export default GenerateSequence;
