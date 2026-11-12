// save-result: saves one finished test's result (roadmap 7.5).
// The link token says which sequence it belongs to, and the scores are worked out
// again here from the raw log, with the same scoring code the browser used (ADR-007).

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database, Json } from "../_shared/database.types.ts";
import { rescore as rescoreSwaps } from "../../../src/tests/swaps/scoring/rescore.ts";
import { rescore as rescoreTrailMaking } from "../../../src/tests/trail-making/scoring/rescore.ts";

// A link token is 32 random bytes as 64 hex characters (see the sequences migration).
const TOKEN_FORMAT = /^[0-9a-f]{64}$/;

// Each test's re-scoring, by test id. null means the raw log isn't one the test could have written.
const rescorers = new Map<string, (rawData: unknown, scores: unknown) => Json | null>([
  ["trail-making", (rawData) => rescoreTrailMaking(rawData)],
  ["swaps", (rawData, scores) => rescoreSwaps(rawData, scores)],
]);

// One reply for every refusal, so a caller can't tell an unknown link from an ended one.
function refused(): Response {
  return Response.json({ error: "link_not_valid" }, { status: 404 });
}

// The result can't be saved as sent. The reason goes to the function's log, never with any data.
function rejected(error: string, reason: string): Response {
  console.warn(`save-result: rejected: ${reason}`);
  return Response.json({ error }, { status: 400 });
}

// Something broke on our side. The details go to the function's log, never to the caller.
function failed(step: string, message: string): Response {
  console.error(`save-result: ${step} failed: ${message}`);
  return Response.json({ error: "server_error" }, { status: 500 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// A calendar time as text (ADR-028), as ms since 1970, or null if it isn't one.
function parseTime(value: unknown): number | null {
  const time = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? null : time;
}

// A screen side in CSS pixels: a whole number above 0.
function isSize(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export default {
  // The caller must send the project's publishable key (the app's public key).
  fetch: withSupabase<Database>({ auth: "publishable" }, async (req, ctx) => {
    const body = await req.json().catch(() => null);
    const token = body?.token;
    if (typeof token !== "string" || !TOKEN_FORMAT.test(token)) {
      return refused();
    }

    // supabaseAdmin uses the secret key and skips row-level security,
    // so every query here names exactly the columns it needs.
    const { data: sequence, error: sequenceError } = await ctx.supabaseAdmin
      .from("sequences")
      .select("id")
      .eq("link_token", token)
      .eq("status", "open")
      .maybeSingle();
    if (sequenceError) return failed("sequence lookup", sequenceError.message);
    if (!sequence) return refused();

    // The sequence comes from the token, never from the browser, so the result's sequenceId isn't read.
    const result: unknown = body.result;
    const screen: unknown = body.screen;
    if (!isRecord(result) || !isRecord(screen)) {
      return rejected("bad_result", "no result or screen");
    }

    const { testId, testVersion, scores: browserScores, rawData } = result;
    const rescore = typeof testId === "string" ? rescorers.get(testId) : undefined;
    const startedAt = parseTime(result.startedAt);
    const completedAt = parseTime(result.completedAt);
    const { width, height } = screen;

    if (typeof testId !== "string" || !rescore || typeof testVersion !== "string" || testVersion === ""
      || startedAt === null || completedAt === null || completedAt < startedAt
      || !isRecord(browserScores) || !isRecord(rawData) || !isSize(width) || !isSize(height)) {
      return rejected("bad_result", "result fields");
    }

    // A stopped test needs a reason and a clinician, which come from the dashboard (roadmap 9.1).
    // Both tests record where a stop found them as rawData.stop, null when nothing stopped them.
    if (rawData.stop !== null) {
      return rejected("stopped_not_supported_yet", "stopped test");
    }

    const scores = rescore(rawData, browserScores);
    if (scores === null) {
      return rejected("bad_result", "raw log");
    }

    // scores always holds the server's. The browser's are kept only when they differ, as a flag.
    // Both come from the same code, so when they agree their fields are in the same order.
    const scoresDiffer = JSON.stringify(browserScores) !== JSON.stringify(scores);

    // Only a pending test in this sequence is saved, and only once (ADR-008).
    // rawData arrived as JSON, so it can be stored as JSON.
    const { data: saved, error: saveError } = await ctx.supabaseAdmin
      .from("sequence_tests")
      .update({
        status: "completed",
        test_version: testVersion,
        started_at: new Date(startedAt).toISOString(),
        completed_at: new Date(completedAt).toISOString(),
        scores,
        browser_scores: scoresDiffer ? (browserScores as Json) : null,
        raw_data: rawData as Json,
        screen_width: width,
        screen_height: height,
      })
      .eq("sequence_id", sequence.id)
      .eq("test_id", testId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (saveError) return failed("save", saveError.message);

    // Not part of this sequence, or saved already.
    if (!saved) {
      return Response.json({ error: "not_pending" }, { status: 409 });
    }

    return Response.json({ saved: true });
  }),
};
