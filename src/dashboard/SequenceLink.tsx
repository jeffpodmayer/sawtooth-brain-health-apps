// The screen after Generate Test Sequence (roadmap 8.4b): the client's link, ready to copy.

import { useState } from "react";
import { formatDate } from "./formatDate";
import type { CreatedSequence } from "./SequenceForm";

const fieldClass =
  "mt-2 block h-14 w-full rounded-lg border-2 border-ink-muted bg-white px-4 text-ink focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent";
const copyButtonClass =
  "h-14 rounded-lg bg-accent px-8 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";
const doneButtonClass =
  "h-14 rounded-lg border-2 border-accent px-8 font-bold text-accent focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent";

type Props = {
  created: CreatedSequence;
  onDone: () => void;
};

function SequenceLink({ created, onDone }: Props) {
  const [copyStatus, setCopyStatus] = useState("");

  // The address this dashboard is on, so development makes development links and production makes production ones.
  const link = `${window.location.origin}/t/${created.linkToken}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus("Copied.");
    } catch {
      setCopyStatus("Couldn't copy. Select the link and copy it yourself.");
    }
  }

  return (
    <div className="mt-6">
      <p className="font-bold">
        {created.code}:{" "}
        {created.clientIsNew ? "new client" : `existing client, added ${formatDate(created.clientAddedAt)}`}
      </p>
      <p className="mt-2">Tests: {created.testNames.join(", ")}</p>

      <label className="mt-6 block font-bold">
        Link
        <input readOnly value={link} onFocus={(event) => event.currentTarget.select()} className={fieldClass} />
      </label>
      <p role="status" className="mt-2 min-h-8">
        {copyStatus}
      </p>

      <div className="mt-4 flex flex-wrap justify-end gap-4">
        <button type="button" onClick={onDone} className={doneButtonClass}>
          Done
        </button>
        <button type="button" onClick={handleCopy} autoFocus className={copyButtonClass}>
          Copy link
        </button>
      </div>
    </div>
  );
}

export default SequenceLink;
