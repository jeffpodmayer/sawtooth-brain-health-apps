// Continue and End test, on the running test's row (roadmap 9.1, ADR-048, ADR-049). Continue shows only while
// the test is holding. End test asks for a reason first (StopDialog); the client's tab then answers the stop.

import { useState } from "react";
import { stopReasonLabels } from "./statusLabels";
import StopDialog from "./StopDialog";
import { supabase } from "./supabase";

type Props = {
  sequenceTestId: string;
  testName: string; // "Trail Making"
  subtitle: string; // "TEST-002 · Nov 13, 2026"
  holding: boolean;
  testReasons: Record<string, string>; // this test's own reasons, offered after the shared ones
  onChanged: () => void; // re-reads the visits
};

function RunningTestControls({ sequenceTestId, testName, subtitle, holding, testReasons, onChanged }: Props) {
  const [stopOpen, setStopOpen] = useState(false);
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

  async function endTest(reason: string): Promise<string | null> {
    const { error } = await supabase.rpc("request_test_stop", { sequence_test_id: sequenceTestId, reason });
    if (error?.code === "P0002") return "This test has already ended or isn't running. Reload the page to see where it stands.";
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
          className="flex h-9 items-center rounded-lg bg-accent px-4 text-base font-medium text-white hover:bg-accent-strong focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-70"
        >
          {continuing ? "Continuing…" : "Continue"}
        </button>
      )}
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setStopOpen(true)}
        className="flex h-9 items-center rounded-lg border border-danger bg-surface px-4 text-base font-medium text-danger hover:bg-danger-tint focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        End test
      </button>
      <StopDialog
        open={stopOpen}
        title={`End ${testName}?`}
        subtitle={subtitle}
        explanation="The test stops and the client's screen moves on to the break, or to the end if it's the last test."
        confirmLabel="End test"
        reasons={{ ...stopReasonLabels, ...testReasons }}
        onConfirm={endTest}
        onClosed={() => setStopOpen(false)}
      />
    </div>
  );
}

export default RunningTestControls;
