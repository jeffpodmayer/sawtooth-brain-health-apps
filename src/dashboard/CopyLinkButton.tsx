// "Copy link" on an open visit's header (8.9), in case the link from Generate Test Sequence was lost.
// Shown only while the visit is open, since a finished or discontinued visit's link no longer works (ADR-008).

import CopyIcon from "./CopyIcon";
import { clientLink } from "./links";
import { buttonClass } from "./styles";
import { useCopy } from "./useCopy";

function CopyLinkButton({ linkToken }: { linkToken: string }) {
  const { status, copy } = useCopy(clientLink(linkToken));

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={`shrink-0 ${buttonClass("secondary")}`}
    >
      <CopyIcon copied={status === "copied"} />
      {status === "copied" ? "Copied" : status === "failed" ? "Couldn't copy" : "Copy link"}
    </button>
  );
}

export default CopyLinkButton;
