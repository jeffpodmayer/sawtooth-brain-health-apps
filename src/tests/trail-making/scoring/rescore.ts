// Re-scores a finished test from its raw log, for the save-result Edge Function (roadmap 7.5).
// rawData comes from the browser, so its shape is checked before anything is scored.

import { canSkipPartA, pages, type Flow } from "./page-flow.ts";
import type { LoggedClick, TrailMakingScores } from "./score-part.ts";
import { scoreTest, type SkipPoint, type StopPoint } from "./score-test.ts";

const phases: readonly Flow["phase"][] = ["waiting", "instructions", "practice", "test", "finished", "done"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// A time in ms from the start of a part: a real number, never negative.
function isTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isClickLog(value: unknown): value is LoggedClick[] {
  return Array.isArray(value) && value.every((click) =>
    isRecord(click) && isTime(click.timeMs) && (click.circle === null || typeof click.circle === "string"));
}

function isStopPoint(value: unknown): value is StopPoint {
  return isRecord(value)
    && pages.some((page) => page === value.page)
    && phases.some((phase) => phase === value.phase)
    && (value.stoppedAtMs === null || isTime(value.stoppedAtMs));
}

// A skip comes only from Sample A until Part A finishes (ADR-055). It has a stop time exactly when a clock
// was running: during Sample A's clicks or the timed Part A.
function isSkipPoint(value: unknown): value is SkipPoint {
  if (!isRecord(value) || !(value.page === "sampleA" || value.page === "partA")) return false;
  if (!phases.some((phase) => phase === value.phase)) return false;
  const clockRunning = value.phase === "practice" || value.phase === "test";
  return canSkipPartA({ pageIndex: pages.indexOf(value.page), phase: value.phase as Flow["phase"] })
    && (clockRunning ? isTime(value.stoppedAtMs) : value.stoppedAtMs === null);
}

// The scores, or null if rawData isn't a log this test could have written.
export function rescore(rawData: unknown): TrailMakingScores | null {
  if (!isRecord(rawData) || !isRecord(rawData.clicks)) {
    return null;
  }

  // Logs saved before samples were scored have no sample clicks: they count as empty.
  const { partA, partB, sampleA = [], sampleB = [] } = rawData.clicks;
  const { stop } = rawData;
  // Logs saved before skips existed have no skip at all.
  const skip = rawData.skip ?? null;

  if (!isClickLog(partA) || !isClickLog(partB) || !isClickLog(sampleA) || !isClickLog(sampleB)
    || !(stop === null || isStopPoint(stop))
    || !(skip === null || isSkipPoint(skip))) {
    return null;
  }

  return scoreTest({ partA, partB, sampleA, sampleB }, stop, skip);
}
