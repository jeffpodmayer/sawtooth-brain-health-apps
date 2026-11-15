// This test's identity. index.ts publishes it, every result stores it (ADR-001),
// and the dashboard lists it by name (roadmap 8.4b).

export const testId = "trail-making";
export const testName = "Trail Making";
export const testVersion = "0.1.0";

// The sheets this test saves (SPEC: Recording), labeled and in the order the dashboard shows them (roadmap 8.7).
// The samples are kept too, in case the clinic needs them (ADR-055).
export const sheetLabels: Record<string, string> = {
  sampleA: "Sample A",
  partA: "Part A",
  sampleB: "Sample B",
  partB: "Part B",
};

// Stop reasons the dashboard offers for this test, on top of the shared ones (ADR-049). The database's
// stop-reason check must list each key.
export const stopReasons: Record<string, string> = { alphabet_check_not_passed: "Alphabet check not passed (997)" };

// Short notes beside a shared reason in the Discontinue and End session windows, for the code it records
// here (ADR-049): Unable to complete is 996 only when the stop finds the test at a sample.
export const stopReasonHints: Record<string, string> = { unable_to_complete: "996 during a sample" };

// The timed parts this test reports while running (ADR-048), labeled as in its score table, so the dashboard
// shows the counter in that part's row.
export const timedParts: Record<string, string> = { partA: "Part A", partB: "Part B" };

// The steps this test holds before, in order, waiting for the clinician's Continue (ADR-050). The dashboard's
// button shows the next one, e.g. "▶ Part A".
export const holds: string[] = ["Sample A", "Part A", "Sample B", "Part B"];

// Steps a clinician may skip (ADR-055), by key. Offered while Continue has released any of whileReleased
// holds and the test hasn't reached toHold yet; afterwards the test waits at hold toHold. NACC: if the
// client can't complete Sample A, Part A isn't given (code 996) and Sample B is still given, so Skip Part A
// is offered from Sample A (1 released) until Part A finishes (2 released, until hold 3 is reached).
export const skips: Record<string, { label: string; whileReleased: number[]; toHold: number; explanation: string }> = {
  partA: {
    label: "Skip Part A",
    whileReleased: [1, 2],
    toHold: 3,
    explanation: "Part A is recorded as not given (996), and the client goes on to Sample B.",
  },
};
