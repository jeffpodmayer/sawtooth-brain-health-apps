// Continue, a skip and Discontinue, on the running test's row (roadmap 9.1, ADR-048 to ADR-050, ADR-055).
// Continue shows only while the test is holding, labeled with the step it starts ("▶ Part A"). A skip (such as
// Skip Part A) shows only where the test allows it, and asks to confirm (SkipDialog). Discontinue asks for a
// reason first (StopDialog); the client's tab then answers the stop.

import { useState } from "react";
import SkipDialog from "./SkipDialog";
import { stopReasonLabels } from "./statusLabels";
import StopDialog from "./StopDialog";
import { buttonClass } from "./styles";
import { supabase } from "./supabase";

type Props = {
  sequenceTestId: string;
  testName: string; // "Trail Making"
  subtitle: string; // "TEST-002 · Nov 13, 2026"
  holding: boolean;
  nextStep: string | null; // the step Continue starts, from the test's holds list (ADR-050)
  testReasons: Record<string, string>; // this test's own reasons, offered after the shared ones
  reasonHints: Record<string, string>; // notes beside reasons, such as the code they record
  // The test's skip that fits where it is now, or null (ADR-055).
  skip: { key: string; label: string; whileReleased: number[]; toHold: number; explanation: string } | null;
  holdsReleased: number; // sent with a skip, so the database can check it's still the right moment
  onChanged: () => void; // re-reads the visits
};

function RunningTestControls({
  sequenceTestId,
  testName,
  subtitle,
  holding,
  nextStep,
  testReasons,
  reasonHints,
  skip,
  holdsReleased,
  onChanged,
}: Props) {
  const [stopOpen, setStopOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState(false);

  // Clicking twice is harmless: the database releases only holds the client has reached.
  async function handleContinue() {
    setContinuing(true);
    setContinueError(false);
    const { error } = await supabase.rpc("continue_test", { sequence_test_id: sequenceTestId });
    setContinuing(false);
    if (error) setContinueError(true);
    else onChanged();
  }

  // The database checks it's still the right moment (the same released holds) and that nothing else ended
  // or skipped the test first, so a late or repeated click changes nothing.
  async function skipStep(): Promise<string | null> {
    if (!skip) return null;
    const { error } = await supabase.rpc("request_skip", {
      sequence_test_id: sequenceTestId,
      skip: skip.key,
      while_released: holdsReleased,
      to_hold: skip.toHold,
    });
    if (error) return "Couldn't skip. Check your internet connection and try again.";
    onChanged();
    return null;
  }

  async function endTest(reason: string): Promise<string | null> {
    const { error } = await supabase.rpc("request_test_stop", { sequence_test_id: sequenceTestId, reason });
    if (error?.code === "P0002")
      return "This test has already ended or isn't running. Reload the page to see where it stands.";
    if (error) return "Couldn't end the test. Check your internet connection and try again.";
    onChanged();
    return null;
  }

  return (
    <div className="ml-auto flex items-center gap-3">
      {continueError && (
        <p role="alert" className="text-base">
          Couldn't continue. Check your connection and try again.
        </p>
      )}
      {holding && (
        <button
          type="button"
          onClick={handleContinue}
          disabled={continuing}
          // Heard as "Continue to Part A"; seen as "▶ Part A".
          aria-label={nextStep ? `Continue to ${nextStep}` : undefined}
          className={buttonClass("primary", "small")}
        >
          {continuing ? (
            "Continuing…"
          ) : (
            <>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
                <path d="M7 4.5v15l12-7.5z" />
              </svg>
              {nextStep ?? "Continue"}
            </>
          )}
        </button>
      )}
      {skip && (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setSkipOpen(true)}
          className={buttonClass("secondary", "small")}
        >
          {skip.label}
        </button>
      )}
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setStopOpen(true)}
        className={buttonClass("dangerOutline", "small")}
      >
        Discontinue
      </button>
      {skip && (
        <SkipDialog
          open={skipOpen}
          title={`${skip.label}?`}
          subtitle={`${testName} · ${subtitle}`}
          explanation={skip.explanation}
          confirmLabel={skip.label}
          onConfirm={skipStep}
          onClosed={() => setSkipOpen(false)}
        />
      )}
      <StopDialog
        open={stopOpen}
        title={`Discontinue ${testName}?`}
        subtitle={subtitle}
        explanation="The test stops and the client's screen moves on to the break, or to the end if it's the last test."
        confirmLabel="Discontinue"
        reasons={{ ...stopReasonLabels, ...testReasons }}
        hints={reasonHints}
        onConfirm={endTest}
        onClosed={() => setStopOpen(false)}
      />
    </div>
  );
}

export default RunningTestControls;
