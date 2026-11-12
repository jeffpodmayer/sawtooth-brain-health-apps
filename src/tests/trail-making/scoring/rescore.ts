// Re-scores a finished test from its raw log, for the save-result Edge Function (roadmap 7.5).
// rawData comes from the browser, so its shape is checked before anything is scored.

import { pages, type Flow } from "./page-flow.ts";
import type { LoggedClick, TrailMakingScores } from "./score-part.ts";
import { scoreTest, type StopPoint } from "./score-test.ts";

const phases: readonly Flow["phase"][] = ["instructions", "practice", "test", "finished", "done"];

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

// The scores, or null if rawData isn't a log this test could have written.
export function rescore(rawData: unknown): TrailMakingScores | null {
  if (!isRecord(rawData) || !isRecord(rawData.clicks)) {
    return null;
  }

  const { partA, partB } = rawData.clicks;
  const { stop } = rawData;

  if (!isClickLog(partA) || !isClickLog(partB) || !(stop === null || isStopPoint(stop))) {
    return null;
  }

  return scoreTest({ partA, partB }, stop);
}
