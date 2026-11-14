// The ⋯ menu next to New sequence on the Clients list (roadmap 10.1). Export CSV downloads every completed or
// stopped test of the clients the search shows, one row per part. Reads go through RLS, so only this practice's
// results are exported. A plain show/hide panel of real buttons: Tab reaches them, Esc or a click outside closes it.

import { useId, useRef, useState } from "react";
import { buildCsv } from "./csv-export";
import { saveFile } from "./save-file";
import { sequenceTests } from "./sequence-tests";
import { supabase } from "./supabase";
import { useDismiss } from "./useDismiss";

const menuButtonClass =
  "flex size-12 items-center justify-center rounded-lg border border-accent bg-surface text-accent hover:bg-hover focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";
const itemClass =
  "block w-full px-4 py-3 text-left hover:bg-hover focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-accent disabled:opacity-70";

// matches says whether a client ID is shown by the Clients list's search, so the export matches the screen.
function ClientsMenu({ matches }: { matches: (code: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  useDismiss(open, setOpen, wrapperRef, buttonRef);

  async function exportCsv() {
    setBusy(true);
    setFailed(false);
    const { data, error } = await supabase
      .from("clients")
      .select("code, sequences(created_at, sequence_tests(test_id, status, scores))");
    setBusy(false);
    setOpen(false);
    buttonRef.current?.focus();
    if (error) {
      setFailed(true);
      return;
    }
    const csv = buildCsv(
      data.filter((client) => matches(client.code)),
      sequenceTests,
    );
    // The byte-order mark tells Excel the file is UTF-8.
    const file = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
    saveFile(file, `Results ${new Date().toLocaleDateString("en-CA")}.csv`);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={menuButtonClass}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute right-0 top-full z-10 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
      >
        <button type="button" onClick={exportCsv} disabled={busy} className={itemClass}>
          {busy ? "Exporting…" : "Export CSV"}
        </button>
      </div>
      {failed && (
        <p role="alert" className="absolute right-0 top-full mt-2 whitespace-nowrap text-base">
          Couldn't export. Try again.
        </p>
      )}
    </div>
  );
}

export default ClientsMenu;
