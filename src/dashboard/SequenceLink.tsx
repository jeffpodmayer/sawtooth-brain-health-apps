// The step after Generate Test Sequence (roadmap 8.4b, restyled at 8.9): the client's link, ready to copy.
// The window's title and summary line come from GenerateSequence.

import CopyIcon from "./CopyIcon";
import { clientLink } from "./links";
import type { CreatedSequence } from "./SequenceForm";
import { buttonClass } from "./styles";
import { useCopy } from "./useCopy";

type Props = {
  created: CreatedSequence;
  onDone: () => void;
};

function SequenceLink({ created, onDone }: Props) {
  const link = clientLink(created.linkToken);
  const { status: copyStatus, copy: handleCopy } = useCopy(link);

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
      <p role="status" className="mt-2 min-h-8 text-base">
        {copyStatus === "copied" && "Copied."}
        {copyStatus === "failed" && "Couldn't copy. Select the link and copy it yourself."}
      </p>

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onDone} className={buttonClass("secondary")}>
          Done
        </button>
      </div>
    </div>
  );
}

export default SequenceLink;
