// Tells the report-progress Edge Function where the running test is (roadmap 9.3, ADR-048, ADR-049).
// For the dashboard only; nothing here is part of the result. The part key is passed along unread.

import type { ProgressReport } from "../shared/result-store";
import { env } from "../shared/env";

const REPORT_TIME_LIMIT_MS = 10_000;

// "saved": saved, or nothing needed saving (a repeat, or after a stop request).
// "refused": the server won't take it, now or later (the test already has a result, or the report
// doesn't fit where the test is). Sending it again would get the same answer.
// "failed": no answer, or a fault on our side. Worth sending again.
export type ReportOutcome = "saved" | "refused" | "failed";

export async function reportProgress(
  token: string,
  testId: string,
  report: ProgressReport,
): Promise<ReportOutcome> {
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
    if (response.ok) return "saved";
    return response.status === 400 || response.status === 404 ? "refused" : "failed";
  } catch {
    return "failed";
  }
}
