// "Copy link" on an open visit's header (8.9), in case the link from Generate Test Sequence was lost.
// Shown only while the visit is open, since a finished or discontinued visit's link no longer works (ADR-008).

import CopyIcon from "./CopyIcon";
import { clientLink } from "./links";
import { useCopy } from "./useCopy";

function CopyLinkButton({ linkToken }: { linkToken: string }) {
  const { status, copy } = useCopy(clientLink(linkToken));

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="flex h-12 shrink-0 items-center gap-2 rounded-lg px-3 text-base text-accent hover:bg-surface focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <CopyIcon copied={status === "copied"} />
      {status === "copied" ? "Copied" : status === "failed" ? "Couldn't copy" : "Copy link"}
    </button>
  );
}

export default CopyLinkButton;
