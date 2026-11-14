// Turns the whole test's click logs into its scores (SPEC: Scoring, Stopped by the clinician). Pure, like scorePart.

import { pages, type Flow } from "./page-flow.ts";
import {
  scorePart,
  scoreSampleClicks,
  type LoggedClick,
  type PartScore,
  type SampleName,
  type SampleScore,
  type TimedPart,
  type TrailMakingScores,
} from "./score-part.ts";

// Each page's clicks. Logs saved before samples were scored have none for the samples.
export type ClickLogs = Record<TimedPart, readonly LoggedClick[]> & Partial<Record<SampleName, readonly LoggedClick[]>>;

type Page = (typeof pages)[number];

// Where a clinician's stop found the test. Saved in rawData, so the server can re-score it.
// stoppedAtMs counts from the end of "Begin." on a timed part, or from when clicking was allowed on a sample.
// It's null unless a clock was running: a timed part's, or a sample's once its clicks were allowed.
export type StopPoint = {
  page: Page;
  phase: Flow["phase"];
  stoppedAtMs: number | null;
};

// Where the clinician's Skip Part A found the test (ADR-055): from Sample A until Part A finishes. Saved in
// rawData, so the server can re-score it. NACC: Part A isn't given (code 996), and Sample B is still given.
// A skip during the timed Part A keeps what was done, as if stopped there, with code 996. stoppedAtMs is
// counted like a stop's: it's set during Sample A's clicks or the timed Part A, and null otherwise.
export type SkipPoint = {
  page: "sampleA" | "partA";
  phase: Flow["phase"];
  stoppedAtMs: number | null;
};

// Part A after a skip: what was done if its clock was running, otherwise not given. Code 996 either way.
function skippedPartA(clicks: readonly LoggedClick[], skip: SkipPoint): PartScore {
  if (skip.page === "partA" && skip.phase === "test" && skip.stoppedAtMs !== null) {
    return { ...scorePart("partA", clicks, skip.stoppedAtMs), code: 996 };
  }
  return { status: "notGiven", code: 996 };
}

// How far the test got with one page. With no stop, every page was finished.
function pageProgress(page: Page, stop: StopPoint | null): "finished" | "current" | "notReached" {
  if (stop === null) {
    return "finished";
  }

  const pageIndex = pages.indexOf(page);
  const stopIndex = pages.indexOf(stop.page);

  if (pageIndex < stopIndex || (pageIndex === stopIndex && stop.phase === "finished")) {
    return "finished";
  }

  // The hold before a page comes after the pause, so the page itself wasn't reached (SPEC).
  return pageIndex === stopIndex && stop.phase !== "waiting" ? "current" : "notReached";
}

// A sample's outcome and numbers. One cut short keeps its time and counts so far, and isn't passed.
function scoreSample(sample: SampleName, clicks: readonly LoggedClick[], stop: StopPoint | null): SampleScore | null {
  const progress = pageProgress(sample, stop);

  if (progress === "notReached") return null;
  if (progress === "finished") return { passed: true, ...scoreSampleClicks(sample, clicks, null) };
  return { passed: false, ...scoreSampleClicks(sample, clicks, stop?.stoppedAtMs ?? null) };
}

// Sample A after Skip Part A: cut short if the skip came while it was on screen, otherwise finished.
function skippedSampleA(clicks: readonly LoggedClick[], skip: SkipPoint): SampleScore {
  const cutShort = skip.page === "sampleA" && skip.phase !== "finished";
  return cutShort
    ? { passed: false, ...scoreSampleClicks("sampleA", clicks, skip.stoppedAtMs) }
    : { passed: true, ...scoreSampleClicks("sampleA", clicks, null) };
}

function scoreTimedPart(part: TimedPart, clicks: readonly LoggedClick[], stop: StopPoint | null): PartScore {
  const progress = pageProgress(part, stop);
  const stoppedAtMs = stop?.stoppedAtMs ?? null;

  if (progress === "finished") {
    return scorePart(part, clicks, null);
  }

  return progress === "current" && stoppedAtMs !== null
    ? scorePart(part, clicks, stoppedAtMs)
    : { status: "notGiven", code: null };
}

// The finished sections so far, for the dashboard's live table while the test runs (ADR-058): every page up to
// and including the one just finished, scored exactly as it will be saved. Display only; the saved result is
// re-checked on the server as always.
export function sectionScores(clicks: ClickLogs, upTo: Page, skip: SkipPoint | null): Partial<TrailMakingScores> {
  const all = scoreTest(clicks, { page: upTo, phase: "finished", stoppedAtMs: null }, skip);
  const done = pages.slice(0, pages.indexOf(upTo) + 1);
  return Object.fromEntries(done.map((page) => [page, all[page]])) as Partial<TrailMakingScores>;
}

// A skip settles Part A and Sample A; the rest is scored from the stop, if any, as usual. Sample A counts as
// passed only if the skip came once it was finished (its pause, or any point in Part A).
export function scoreTest(clicks: ClickLogs, stop: StopPoint | null, skip: SkipPoint | null = null): TrailMakingScores {
  return {
    partA: skip ? skippedPartA(clicks.partA, skip) : scoreTimedPart("partA", clicks.partA, stop),
    partB: scoreTimedPart("partB", clicks.partB, stop),
    sampleA: skip ? skippedSampleA(clicks.sampleA ?? [], skip) : scoreSample("sampleA", clicks.sampleA ?? [], stop),
    sampleB: scoreSample("sampleB", clicks.sampleB ?? [], stop),
  };
}
