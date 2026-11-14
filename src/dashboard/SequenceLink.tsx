// The step after New Test Sequence (roadmap 8.4b, restyled at 8.9): the client's link, ready to copy.
// The window's title and summary line come from GenerateSequence. Copy link copies and closes the window;
// if the browser blocks copying, the window stays open so the link isn't lost.

import CopyIcon from "./CopyIcon";
import { clientLink } from "./links";
import type { CreatedSequence } from "./SequenceForm";
import { buttonClass } from "./styles";
import { useCopy } from "./useCopy";

type Props = {
  created: CreatedSequence;
  onCopied: () => void;
};

function SequenceLink({ created, onCopied }: Props) {
  const link = clientLink(created.linkToken);
  const { status: copyStatus, copy } = useCopy(link);

  async function handleCopy() {
    if (await copy()) onCopied();
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2 pl-4">
        <input
          readOnly
          aria-label="Link"
          value={link}
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1 bg-transparent text-base text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <button type="button" onClick={handleCopy} autoFocus className={`shrink-0 ${buttonClass("primary")}`}>
          <CopyIcon copied={copyStatus === "copied"} />
          {copyStatus === "copied" ? "Copied" : "Copy link"}
        </button>
      </div>
      {copyStatus === "failed" && (
        <p role="alert" className="mt-3 text-base">
          Couldn't copy. Select the link and copy it yourself.
        </p>
      )}
    </div>
  );
}

export default SequenceLink;
