// save-result: saves what the client's tab hands over for one test (roadmap 7.5, 9.5):
// - a result, finished or stopped. The scores are worked out again here from the raw log, with the
//   same scoring code the browser used (ADR-007, ADR-040).
// - "not begun", the answer to a stop that came before the test began (ADR-049).
// The link token says which sequence it belongs to. The reply says whether the visit is still open,
// so the client knows whether to go on to the next test or to the end screen.

import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import type { Database, Json } from "../_shared/database.types.ts";
import { rescore as rescoreSwaps } from "../../../src/tests/swaps/scoring/rescore.ts";
import * as swaps from "../../../src/tests/swaps/test-info.ts";
import { rescore as rescoreTrailMaking } from "../../../src/tests/trail-making/scoring/rescore.ts";
import * as trailMaking from "../../../src/tests/trail-making/test-info.ts";

// A link token is 32 random bytes as 64 hex characters (see the sequences migration).
const TOKEN_FORMAT = /^[0-9a-f]{64}$/;

// What the server knows about each test, by test id:
// - rescore works the scores out again. null means the raw log isn't one the test could have written.
// - sheetNames are the only sheets the test hands over (each test's sheetLabels). Any other name is
//   rejected, so the browser can't choose where a file goes. A finished test hands over all of them.
const tests = new Map<string, {
  rescore: (rawData: unknown, scores: unknown) => Json | null;
  sheetNames: string[];
}>([
  [trailMaking.testId, {
    rescore: (rawData) => rescoreTrailMaking(rawData),
    sheetNames: Object.keys(trailMaking.sheetLabels),
  }],
  [swaps.testId, {
    rescore: (rawData, scores) => rescoreSwaps(rawData, scores),
    sheetNames: Object.keys(swaps.sheetLabels),
  }],
]);

// The sheets bucket's own limit (see the sheets bucket migration).
const MAX_SHEET_BYTES = 5_242_880;

// One reply for every refusal, so a caller can't tell an unknown link from an ended one.
function refused(): Response {
  return Response.json({ error: "link_not_valid" }, { status: 404 });
}

// The test was saved already, e.g. the reply to an earlier try was lost (ADR-042).
// The client counts this as saved, and moves on or ends as sequenceOpen says.
function alreadySaved(sequenceOpen: boolean): Response {
  return Response.json({ error: "not_pending", sequenceOpen }, { status: 409 });
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

// The result's sheets: names this test hands over, each SVG text within the bucket's limit.
function isSheets(value: unknown, sheetNames: string[]): value is Record<string, string> {
  return isRecord(value) && Object.entries(value).every(([name, svg]) =>
    sheetNames.includes(name)
    && typeof svg === "string"
    && svg.startsWith("<svg ")
    && new TextEncoder().encode(svg).length <= MAX_SHEET_BYTES);
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
    // Any status: a completed sequence answers a retried last save (ADR-042), and after End whole
    // sequence the running test's answer is still saved (ADR-049).
    const { data: sequence, error: sequenceError } = await ctx.supabaseAdmin
      .from("sequences")
      .select("id, status")
      .eq("link_token", token)
      .maybeSingle();
    if (sequenceError) return failed("sequence lookup", sequenceError.message);
    if (!sequence) return refused();

    // A completed sequence has no pending tests left, so this is a retry of a save that landed.
    if (sequence.status === "completed") return alreadySaved(false);

    // Whether the visit is still open once this save is in. The last save closes it (ADR-042).
    async function sequenceOpenNow(): Promise<boolean | Response> {
      const { data, error } = await ctx.supabaseAdmin
        .from("sequences")
        .select("status")
        .eq("id", sequence!.id)
        .single();
      if (error) return failed("sequence recheck", error.message);
      return data.status === "open";
    }

    // The test's row, whatever its status. Its stop request comes from the dashboard (ADR-049).
    // The sequence comes from the token, never from the browser, so the result's sequenceId isn't read.
    async function findRow(testId: string) {
      return await ctx.supabaseAdmin
        .from("sequence_tests")
        .select("id, practice_id, status, stop_requested_at, holds_released")
        .eq("sequence_id", sequence!.id)
        .eq("test_id", testId)
        .maybeSingle();
    }

    // "Not begun": a stop came before the test began, so there's no result. Saved as not given,
    // keeping the clinician's reason (ADR-049). Only for a test with a stop request.
    if (isRecord(body.notBegun)) {
      const testId = body.notBegun.testId;
      if (typeof testId !== "string" || !tests.has(testId)) {
        return rejected("bad_result", "not begun: unknown test");
      }

      const { data: row, error: rowError } = await findRow(testId);
      if (rowError) return failed("test lookup", rowError.message);
      if (!row) return rejected("bad_result", "not begun: test not in this sequence");
      if (row.status !== "pending") return alreadySaved(sequence.status === "open");
      if (row.stop_requested_at === null) return rejected("bad_result", "not begun: no stop request");
      // Once Continue released the first hold the test began, and its answer is a result.
      if (row.holds_released > 0) return rejected("bad_result", "not begun: test began");

      const { data: saved, error: saveError } = await ctx.supabaseAdmin
        .from("sequence_tests")
        .update({ status: "not_given" })
        .eq("id", row.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (saveError) return failed("not begun save", saveError.message);
      if (!saved) return alreadySaved(sequence.status === "open");

      const open = await sequenceOpenNow();
      if (open instanceof Response) return open;
      return Response.json({ saved: true, sequenceOpen: open });
    }

    const result: unknown = body.result;
    const screen: unknown = body.screen;
    if (!isRecord(result) || !isRecord(screen)) {
      return rejected("bad_result", "no result or screen");
    }

    const { testId, testVersion, scores: browserScores, rawData, sheets } = result;
    const test = typeof testId === "string" ? tests.get(testId) : undefined;
    const startedAt = parseTime(result.startedAt);
    const completedAt = parseTime(result.completedAt);
    const { width, height } = screen;

    if (typeof testId !== "string" || !test || typeof testVersion !== "string" || testVersion === ""
      || startedAt === null || completedAt === null || completedAt < startedAt
      || !isRecord(browserScores) || !isRecord(rawData) || !isSheets(sheets, test.sheetNames)
      || !isSize(width) || !isSize(height)) {
      return rejected("bad_result", "result fields");
    }

    // Both tests record where a stop found them as rawData.stop, null when nothing stopped them.
    // A test that ran to its end hands over every sheet.
    const stoppedEarly = rawData.stop !== null;
    if (!stoppedEarly && !test.sheetNames.every((name) => name in sheets)) {
      return rejected("bad_result", "finished test missing a sheet");
    }

    const scores = test.rescore(rawData, browserScores);
    if (scores === null) {
      return rejected("bad_result", "raw log");
    }

    // scores always holds the server's. The browser's are kept only when they differ, as a flag.
    // Both come from the same code, so when they agree their fields are in the same order.
    const scoresDiffer = JSON.stringify(browserScores) !== JSON.stringify(scores);

    // The test's row gives the folder (ADR-003, ADR-033). Only a pending test is saved, and only once (ADR-008).
    const { data: row, error: rowError } = await findRow(testId);
    if (rowError) return failed("test lookup", rowError.message);
    if (!row || row.status !== "pending") return alreadySaved(sequence.status === "open");

    // A closed visit takes only the running test's answer to End whole sequence (ADR-049).
    if (sequence.status !== "open" && row.stop_requested_at === null) return refused();

    // A test only stops when the server tells it to.
    if (stoppedEarly && row.stop_requested_at === null) {
      return rejected("bad_result", "stopped test with no stop request");
    }

    // Sheets go up before the row is saved, so a saved result always has its files. Each try gets its
    // own folder, <practice_id>/<sequence_test_id>/<try>/, so two tabs saving the same test can't
    // overwrite each other's files: only the save that lands points to its files.
    const folder = `${row.practice_id}/${row.id}/${crypto.randomUUID()}`;
    const sheetPaths: Record<string, string> = {};

    // Removes this try's files when its save doesn't land. Best effort: an orphan file is harmless.
    async function removeSheets() {
      const paths = Object.values(sheetPaths);
      if (paths.length === 0) return;
      const { error } = await ctx.supabaseAdmin.storage.from("sheets").remove(paths);
      if (error) console.error(`save-result: sheet cleanup failed: ${error.message}`);
    }

    for (const [name, svg] of Object.entries(sheets)) {
      const path = `${folder}/${name}.svg`;
      const { error: uploadError } = await ctx.supabaseAdmin.storage
        .from("sheets")
        .upload(path, new Blob([svg], { type: "image/svg+xml" }), {
          contentType: "image/svg+xml",
          upsert: false,
        });
      if (uploadError) {
        await removeSheets();
        return failed("sheet upload", uploadError.message);
      }
      sheetPaths[name] = path;
    }

    // With a stop request the test is saved as stopped, even if it ran to its end first (ADR-049).
    // Its reason and clinician are on the row already. Each save also matches the stop state it
    // expects and the pending status, in case a stop or another save lands in between.
    // rawData arrived as JSON, so it can be stored as JSON.
    async function saveAs(stopped: boolean) {
      const update = ctx.supabaseAdmin
        .from("sequence_tests")
        .update({
          status: stopped ? "stopped" : "completed",
          test_version: testVersion as string,
          started_at: new Date(startedAt!).toISOString(),
          completed_at: new Date(completedAt!).toISOString(),
          scores,
          browser_scores: scoresDiffer ? (browserScores as Json) : null,
          raw_data: rawData as Json,
          screen_width: width as number,
          screen_height: height as number,
          sheets: sheetPaths,
        })
        .eq("id", row!.id)
        .eq("status", "pending");
      const matched = stopped ? update.not("stop_requested_at", "is", null) : update.is("stop_requested_at", null);
      return await matched.select("id").maybeSingle();
    }

    let { data: saved, error: saveError } = await saveAs(row.stop_requested_at !== null);

    // Nothing matched as completed: a stop may have landed since the row was read. Save it as stopped.
    if (!saveError && !saved && row.stop_requested_at === null) {
      ({ data: saved, error: saveError } = await saveAs(true));
    }

    if (saveError) {
      await removeSheets();
      return failed("save", saveError.message);
    }

    // Saved already, by another try that got there first.
    if (!saved) {
      await removeSheets();
      return alreadySaved(sequence.status === "open");
    }

    const open = await sequenceOpenNow();
    if (open instanceof Response) return open;
    return Response.json({ saved: true, sequenceOpen: open });
  }),
};
