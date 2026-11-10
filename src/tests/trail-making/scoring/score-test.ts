// Turns the whole test's click logs into its scores (SPEC: Scoring, Stopped by the clinician). Pure, like scorePart.

import { pages, type Flow } from "./page-flow";
import {
  scorePart,
  type LoggedClick,
  type PartScore,
  type SampleScore,
  type TimedPart,
  type TrailMakingScores,
} from "./score-part";

export type ClickLogs = Record<TimedPart, readonly LoggedClick[]>;

type Page = (typeof pages)[number];

// Where a clinician's stop found the test. Saved in rawData, so the server can re-score it.
// stoppedAtMs counts from the end of "Begin." It's null unless a timed part's clock was running.
export type StopPoint = {
  page: Page;
  phase: Flow["phase"];
  stoppedAtMs: number | null;
};

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

  return pageIndex === stopIndex ? "current" : "notReached";
}

function scoreSample(page: Page, stop: StopPoint | null): SampleScore | null {
  const progress = pageProgress(page, stop);

  return progress === "notReached" ? null : { passed: progress === "finished" };
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

export function scoreTest(clicks: ClickLogs, stop: StopPoint | null): TrailMakingScores {
  return {
    partA: scoreTimedPart("partA", clicks.partA, stop),
    partB: scoreTimedPart("partB", clicks.partB, stop),
    sampleA: scoreSample("sampleA", stop),
    sampleB: scoreSample("sampleB", stop),
  };
}
