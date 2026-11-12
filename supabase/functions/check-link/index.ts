// check-link: the first thing a client's browser calls (roadmap 7.1).
// Given a link token, it returns the practice name and the tests still to run.
// Clients never query tables (ADR-002); this function does it for them.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database } from "../_shared/database.types.ts";

// A link token is 32 random bytes as 64 hex characters (see the sequences migration).
const TOKEN_FORMAT = /^[0-9a-f]{64}$/;

// One reply for every refusal, so a caller can't tell an unknown link from an ended one.
function refused(): Response {
  return Response.json({ error: "link_not_valid" }, { status: 404 });
}

// Something broke on our side. The details go to the function's log, never to the caller.
function failed(step: string, message: string): Response {
  console.error(`check-link: ${step} failed: ${message}`);
  return Response.json({ error: "server_error" }, { status: 500 });
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
      .select("id, practices (name)")
      .eq("link_token", token)
      .eq("status", "open")
      .maybeSingle();
    if (sequenceError) return failed("sequence lookup", sequenceError.message);
    if (!sequence) return refused();

    // Only the tests with no result yet, in the order they are given.
    // A reopened link carries on from the first one.
    const { data: tests, error: testsError } = await ctx.supabaseAdmin
      .from("sequence_tests")
      .select("test_id")
      .eq("sequence_id", sequence.id)
      .eq("status", "pending")
      .order("position");
    if (testsError) return failed("tests lookup", testsError.message);

    return Response.json({
      sequenceId: sequence.id,
      practiceName: sequence.practices.name,
      tests: tests.map((test) => test.test_id),
    });
  }),
};
