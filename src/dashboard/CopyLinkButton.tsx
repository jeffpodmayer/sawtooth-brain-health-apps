// "Copy link" on an open visit's header (8.9), in case the link from Generate Test Sequence was lost.
// Shown only while the visit is open, since a finished or discontinued visit's link no longer works (ADR-008).

import { useState } from "react";
import { clientLink } from "./links";

function CopyLinkButton({ linkToken }: { linkToken: string }) {
  const [status, setStatus] = useState<"copied" | "failed" | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(clientLink(linkToken));
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="flex h-12 shrink-0 items-center gap-2 rounded-lg px-3 text-base text-accent hover:bg-surface focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      </svg>
      {status === "copied" ? "Copied ✓" : status === "failed" ? "Couldn't copy" : "Copy link"}
    </button>
  );
}

export default CopyLinkButton;
