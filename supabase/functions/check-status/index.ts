// check-status: what the client's tab asks when a "check now" ping arrives (roadmap 9.3, ADR-051),
// and every few seconds as the fallback (9.4). Given a link token and the test the tab is on,
// it says whether a stop was requested and how many holds Continue has released.
// Read only: it never changes anything.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../_shared/database.types.ts";

// A link token is 32 random bytes as 64 hex characters (see the sequences migration).
const TOKEN_FORMAT = /^[0-9a-f]{64}$/;

// One reply for every refusal, so a caller can't tell an unknown link from a finished test.
function refused(): Response {
  return Response.json({ error: "link_not_valid" }, { status: 404 });
}

// Something broke on our side. The details go to the function's log, never to the caller.
function failed(step: string, message: string): Response {
  console.error(`check-status: ${step} failed: ${message}`);
  return Response.json({ error: "server_error" }, { status: 500 });
}

export default {
  // The caller must send the project's publishable key (the app's public key).
  fetch: withSupabase<Database>({ auth: "publishable" }, async (req, ctx) => {
    const body = await req.json().catch(() => null);
    const token = body?.token;
    const testId = body?.testId;
    if (typeof token !== "string" || !TOKEN_FORMAT.test(token) || typeof testId !== "string") {
      return refused();
    }

    // supabaseAdmin uses the secret key and skips row-level security,
    // so every query here names exactly the columns it needs.

    // The visit, open or not: after End whole sequence it's closed,
    // but its running test still waits for the tab to answer the stop (ADR-049).
    const { data: sequence, error: sequenceError } = await ctx.supabaseAdmin
      .from("sequences")
      .select("id, status")
      .eq("link_token", token)
      .maybeSingle();
    if (sequenceError) return failed("sequence lookup", sequenceError.message);
    if (!sequence) return refused();

    // The test the tab is on, only while it has no result. Once saved, there's nothing to tell.
    const { data: test, error: testError } = await ctx.supabaseAdmin
      .from("sequence_tests")
      .select("stop_requested_at, holds_released")
      .eq("sequence_id", sequence.id)
      .eq("test_id", testId)
      .eq("status", "pending")
      .maybeSingle();
    if (testError) return failed("test lookup", testError.message);
    if (!test) return refused();

    return Response.json({
      stopRequested: test.stop_requested_at !== null,
      holdsReleased: test.holds_released,
      sequenceOpen: sequence.status === "open",
    });
  }),
};
