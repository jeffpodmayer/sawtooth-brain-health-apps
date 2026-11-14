// Asks the check-status Edge Function about the test the tab is on (roadmap 9.3, ADR-051):
// on each "check now" ping, and every few seconds as the fallback (9.4).
// The token goes in the body, never in the address (ADR-037).

import { env } from "../shared/env";
import type { TestStatus } from "../shared/result-store";

// "notValid": the link is unknown, or this test already has a result.
// "failed": no answer (no connection, or a fault on our side). The next ping or check asks again.
export type StatusCheck =
  | { status: "ok"; test: TestStatus }
  | { status: "notValid" }
  | { status: "failed" };

// Longer than any normal answer, shorter than a client would wait for Continue.
const CHECK_TIME_LIMIT_MS = 10_000;

export async function checkStatus(token: string, testId: string): Promise<StatusCheck> {
  try {
    const response = await fetch(`${env.supabaseUrl}/functions/v1/check-status`, {
      method: "POST",
      headers: {
        apikey: env.supabasePublishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, testId }),
      signal: AbortSignal.timeout(CHECK_TIME_LIMIT_MS),
    });
    if (response.status === 404) return { status: "notValid" };
    if (!response.ok) return { status: "failed" };

    const body = await response.json();
    return {
      status: "ok",
      test: {
        stopRequested: body.stopRequested,
        holdsReleased: body.holdsReleased,
        sequenceOpen: body.sequenceOpen,
      },
    };
  } catch {
    return { status: "failed" };
  }
}
