// Sends the running test's progress reports one at a time, in order (roadmap 9.5).
// Order matters: the server refuses a timed part before the test began, and a hold out of turn.
// A report that fails is sent again after a short wait, because a lost hold report would leave the
// clinician without Continue and the client waiting. A refused one is dropped: it would never land.

import type { ProgressReport } from "../shared/result-store";
import type { ReportOutcome } from "./report-progress";

export const RETRY_AFTER_MS = 2_000;

type Send = (testId: string, report: ProgressReport) => Promise<ReportOutcome>;

export function createProgressQueue(send: Send, retryAfterMs = RETRY_AFTER_MS) {
  const waiting: { testId: string; report: ProgressReport }[] = [];
  let sending = false;

  async function sendNext() {
    const next = waiting[0];
    if (sending || next === undefined) return;

    sending = true;
    const outcome = await send(next.testId, next.report);
    sending = false;

    if (outcome === "failed") {
      setTimeout(sendNext, retryAfterMs);
      return;
    }

    waiting.shift();
    void sendNext();
  }

  return {
    add(testId: string, report: ProgressReport) {
      waiting.push({ testId, report });
      void sendNext();
    },
  };
}
