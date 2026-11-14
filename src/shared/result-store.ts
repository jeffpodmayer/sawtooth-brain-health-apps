// Where the running test talks to the server (ADR-001): its result, where it is for the dashboard,
// and the clinician's Stop and Continue. Shared code goes only through this, so it never knows about
// Edge Functions or real-time, and the development pages can swap in a fake.

import type { TestResult } from "./test-module";

// CSS pixels, in full screen (ADR-024).
export type ScreenSize = {
  width: number;
  height: number;
};

// What the server says once a save lands. sequenceOpen is false once the visit has closed: the last
// test was saved, or the clinician ended the whole sequence (ADR-049). Either way the client is done.
export type SaveOutcome = {
  sequenceOpen: boolean;
};

// Where the running test is, for the dashboard only (ADR-048). Never part of the result.
export type ProgressReport =
  | { event: "began" }
  | { event: "holdReached"; hold: number }
  | { event: "timedPartStarted"; part: string }
  | { event: "timedPartEnded"; part: string };

// The clinician's controls for the running test, as the server last told them (ADR-049).
export type TestStatus = {
  stopRequested: boolean;
  holdsReleased: number;
  sequenceOpen: boolean;
};

export type ResultStore = {
  // Resolves once the result is saved. Rejects if it couldn't be saved, so the caller can offer Try again.
  saveResult: (result: TestResult, screen: ScreenSize) => Promise<SaveOutcome>;

  // Answers a stop that came before the test began: saved as not given, keeping the clinician's
  // reason (ADR-049). Resolves and rejects like saveResult.
  saveNotBegun: (testId: string) => Promise<SaveOutcome>;

  // Sends a report in the background, in order. Retries by itself until it lands, so the caller never waits.
  reportProgress: (testId: string, report: ProgressReport) => void;

  // Calls onStatus with each answer about this test until the returned function is called.
  watchTest: (testId: string, onStatus: (status: TestStatus) => void) => () => void;
};
