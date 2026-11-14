// The client's ResultStore: everything the running test sends to or hears from the server, all through
// Edge Functions checked by the link token, plus the visit's "check now" channel (ADR-002, ADR-051).
// Saves go through save-result (roadmap 7.7, 9.5); the server checks and re-scores each result (ADR-040).

import { env } from "../shared/env";
import type { ResultStore, SaveOutcome } from "../shared/result-store";
import { checkStatus } from "./check-status";
import { listenForChecks } from "./listen-for-checks";
import { createProgressQueue } from "./progress-queue";
import { reportProgress } from "./report-progress";
import { watchTest } from "./watch-test";

// The same limit as clip downloads (ADR-039). After this, the client is offered Try again.
const SAVE_TIME_LIMIT_MS = 30_000;

// The token goes in the body, never in the address (ADR-037).
async function save(body: Record<string, unknown>): Promise<SaveOutcome> {
  const response = await fetch(`${env.supabaseUrl}/functions/v1/save-result`, {
    method: "POST",
    headers: {
      apikey: env.supabasePublishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(SAVE_TIME_LIMIT_MS),
  });

  // 409: this test was saved already, e.g. the reply to an earlier try was lost.
  // The first saved result is kept (ADR-008), so this counts as saved.
  if (response.ok || response.status === 409) {
    const answer = await response.json().catch(() => null);
    // Only a clear "closed" ends the visit on this screen; anything else carries on to the next test.
    return { sequenceOpen: answer?.sequenceOpen !== false };
  }

  throw new Error(`save-result answered ${response.status}`);
}

export function createResultStore(token: string): ResultStore {
  const progress = createProgressQueue((testId, report) => reportProgress(token, testId, report));

  return {
    saveResult: (result, screen) => save({ token, result, screen }),

    saveNotBegun: (testId) => save({ token, notBegun: { testId } }),

    reportProgress: (testId, report) => progress.add(testId, report),

    watchTest: (testId, onStatus) =>
      watchTest({
        check: () => checkStatus(token, testId),
        listen: (onCheck) => listenForChecks(token, onCheck),
        onStatus: (answer) => {
          if (answer.status === "ok") onStatus(answer.test);
        },
      }),
  };
}
