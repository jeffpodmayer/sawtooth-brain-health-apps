// Sends the running test's progress reports one at a time, in order (roadmap 9.5).
// Order matters: the server refuses a timed part before the test began, and a hold out of turn.
// A report that fails is sent again after a short wait, because a lost hold report would leave the
// clinician without Continue and the client waiting. A refused one is dropped: it would never land.
// A failing report is also given up once a report for another test waits behind it: its test is over,
// and it mustn't hold back the next test's reports.

import type { ProgressReport } from "../shared/result-store";
import type { ReportOutcome } from "./report-progress";

export const RETRY_AFTER_MS = 2_000;

type Send = (testId: string, report: ProgressReport) => Promise<ReportOutcome>;

export function createProgressQueue(send: Send, retryAfterMs = RETRY_AFTER_MS) {
  const waiting: { testId: string; report: ProgressReport }[] = [];
  let sending = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let headFailed = false;

  async function sendNext() {
    retryTimer = undefined;
    if (sending) return;

    // A report that failed before, for a test that's over: give it up.
    if (headFailed && waiting.some(({ testId }) => testId !== waiting[0].testId)) {
      waiting.shift();
      headFailed = false;
    }

    const next = waiting[0];
    if (next === undefined) return;

    sending = true;
    const outcome = await send(next.testId, next.report);
    sending = false;

    if (outcome === "failed") {
      headFailed = true;
      retryTimer = setTimeout(sendNext, retryAfterMs);
      return;
    }

    waiting.shift();
    headFailed = false;
    void sendNext();
  }

  return {
    add(testId: string, report: ProgressReport) {
      waiting.push({ testId, report });
      // While a failed report waits to be retried, the new one waits its turn.
      if (retryTimer === undefined) void sendNext();
    },
  };
}
