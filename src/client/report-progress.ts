// Tells the report-progress Edge Function where the running test is (roadmap 9.3, ADR-048, ADR-049).
// For the dashboard only; nothing here is part of the result. The part key is passed along unread.

import { env } from "../shared/env";

export type ProgressReport =
  | { event: "began" }
  | { event: "holdReached"; hold: number }
  | { event: "timedPartStarted"; part: string }
  | { event: "timedPartEnded"; part: string };

const REPORT_TIME_LIMIT_MS = 10_000;

// true: saved, or nothing needed saving (a repeat, or after a stop request).
// false: not saved (no connection, refused, or a fault). A lost hold report leaves the clinician
// without Continue, so the caller should try a hold again (settled when the tests use it, 9.5).
export async function reportProgress(
  token: string,
  testId: string,
  report: ProgressReport,
): Promise<boolean> {
  try {
    const response = await fetch(`${env.supabaseUrl}/functions/v1/report-progress`, {
      method: "POST",
      headers: {
        apikey: env.supabasePublishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, testId, ...report }),
      signal: AbortSignal.timeout(REPORT_TIME_LIMIT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}
