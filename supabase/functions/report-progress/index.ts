// report-progress: the client's tab reports where the running test is (roadmap 9.3, ADR-048, ADR-049):
// it began, it reached a hold, or a timed part started or ended. Times come from the server's clock and
// are for the dashboard only; nothing here is part of the result.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../_shared/database.types.ts";
import * as swaps from "../../../src/tests/swaps/test-info.ts";
import * as trailMaking from "../../../src/tests/trail-making/test-info.ts";

// A link token is 32 random bytes as 64 hex characters (see the sequences migration).
const TOKEN_FORMAT = /^[0-9a-f]{64}$/;

// What a report is checked against, by test id: how many holds the test has and its timed parts' keys.
// Read from each test's own lists, so the two can't drift apart.
const tests = new Map([swaps, trailMaking].map((test) => [test.testId, {
  holdCount: test.holds.length,
  timedParts: Object.keys(test.timedParts),
}]));

// One reply for every refusal, so a caller can't tell an unknown link from an ended one.
function refused(): Response {
  return Response.json({ error: "link_not_valid" }, { status: 404 });
}

// The report doesn't fit where the test is. The reason goes to the function's log.
function rejected(reason: string): Response {
  console.warn(`report-progress: rejected: ${reason}`);
  return Response.json({ error: "report_not_valid" }, { status: 400 });
}

// Something broke on our side. The details go to the function's log, never to the caller.
function failed(step: string, message: string): Response {
  console.error(`report-progress: ${step} failed: ${message}`);
  return Response.json({ error: "server_error" }, { status: 500 });
}

// Saved, or nothing needed saving (a repeat, or a report after a stop request).
function done(): Response {
  return new Response(null, { status: 204 });
}

export default {
  // The caller must send the project's publishable key (the app's public key).
  fetch: withSupabase<Database>({ auth: "publishable" }, async (req, ctx) => {
    const body = await req.json().catch(() => null);
    const token = body?.token;
    const testId = body?.testId;
    const event = body?.event;
    if (typeof token !== "string" || !TOKEN_FORMAT.test(token) || typeof testId !== "string") {
      return refused();
    }
    const test = tests.get(testId);
    if (!test) return refused();

    // supabaseAdmin uses the secret key and skips row-level security,
    // so every query here names exactly the columns it needs.

    // The visit. While it's open, any report. After End whole sequence, only a timed part's end, so the
    // dashboard's counter stops while the stopped test's result is on its way (ADR-049).
    const { data: sequence, error: sequenceError } = await ctx.supabaseAdmin
      .from("sequences")
      .select("id, status")
      .eq("link_token", token)
      .maybeSingle();
    if (sequenceError) return failed("sequence lookup", sequenceError.message);
    if (!sequence) return refused();
    if (sequence.status !== "open" && event !== "timedPartEnded") return refused();

    // The running test: the first one still pending. Reports for any other test are refused.
    const { data: running, error: runningError } = await ctx.supabaseAdmin
      .from("sequence_tests")
      .select("id, test_id, stop_requested_at, began_at, holds_reached, timed_part")
      .eq("sequence_id", sequence.id)
      .eq("status", "pending")
      .order("position")
      .limit(1)
      .maybeSingle();
    if (runningError) return failed("running test lookup", runningError.message);
    if (!running || running.test_id !== testId) return refused();

    // After a stop request, only a timed part's end still counts (it clears the dashboard's counter).
    // The tab learns of the stop from check-status.
    if (running.stop_requested_at !== null && event !== "timedPartEnded") return done();

    const now = new Date().toISOString();
    const rows = () => ctx.supabaseAdmin.from("sequence_tests");

    // Each update also matches the state it expects, so a repeated or late report changes nothing.
    if (event === "began") {
      if (running.began_at !== null) return done();
      const { error } = await rows().update({ began_at: now })
        .eq("id", running.id).is("began_at", null).is("stop_requested_at", null);
      return error ? failed("began", error.message) : done();
    }

    if (event === "holdReached") {
      const hold = body?.hold;
      if (!Number.isInteger(hold) || hold < 1 || hold > test.holdCount) return rejected("hold out of range");
      if (hold === running.holds_reached) return done();
      if (hold !== running.holds_reached + 1) return rejected("hold skipped");
      const { error } = await rows().update({ holds_reached: hold })
        .eq("id", running.id).eq("holds_reached", hold - 1).is("stop_requested_at", null);
      return error ? failed("hold", error.message) : done();
    }

    const part = body?.part;
    if (typeof part !== "string" || !test.timedParts.includes(part)) return rejected("unknown timed part");

    if (event === "timedPartStarted") {
      if (running.began_at === null) return rejected("timed part before the test began");
      if (running.timed_part === part) return done();
      const { error } = await rows().update({ timed_part: part, timed_part_started_at: now })
        .eq("id", running.id).is("stop_requested_at", null);
      return error ? failed("timed part start", error.message) : done();
    }

    if (event === "timedPartEnded") {
      const { error } = await rows().update({ timed_part: null, timed_part_started_at: null })
        .eq("id", running.id).eq("timed_part", part);
      return error ? failed("timed part end", error.message) : done();
    }

    return rejected("unknown event");
  }),
};
