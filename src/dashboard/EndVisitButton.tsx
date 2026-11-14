// End session (roadmap 9.1, ADR-048, ADR-049): on an open visit's row, next to Copy link. Ends the running test
// with a reason, marks every later test not given and closes the link, all in one save (end_sequence).

import { useState } from "react";
import { stopReasonLabels } from "./statusLabels";
import StopDialog from "./StopDialog";
import { buttonClass } from "./styles";
import { supabase } from "./supabase";

type Props = {
  sequenceId: string;
  subtitle: string; // "TEST-002 · Nov 13, 2026"
  onEnded: () => void;
};

function EndVisitButton({ sequenceId, subtitle, onEnded }: Props) {
  const [open, setOpen] = useState(false);

  async function endVisit(reason: string): Promise<string | null> {
    const { error } = await supabase.rpc("end_sequence", { sequence_id: sequenceId, reason });
    if (error?.code === "P0002") return "This session has already ended. Reload the page to see where it stands.";
    if (error) return "Couldn't end the session. Check your internet connection and try again.";
    onEnded();
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={buttonClass("dangerOutline")}
      >
        End session
      </button>
      <StopDialog
        open={open}
        title="End this session?"
        subtitle={subtitle}
        explanation="The running test stops, every test after it is marked not given, and the client's link stops working."
        confirmLabel="End session"
        // Only the shared reasons: a test's own reasons and codes (Trail Making's 996 and 997) belong to
        // Discontinue on that test's row, not to ending the whole visit.
        reasons={stopReasonLabels}
        onConfirm={endVisit}
        onClosed={() => setOpen(false)}
      />
    </>
  );
}

export default EndVisitButton;
