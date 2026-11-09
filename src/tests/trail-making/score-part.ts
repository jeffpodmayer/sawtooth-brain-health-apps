// Turns one timed part's click log into its score (SPEC: Scoring, Timing).
// Pure: replays every click through judgeClick, so the server can re-check it from the raw log.

import { judgeClick } from "./judge-click";
import { expectedOrder } from "./order";
import { timeLimitMs } from "./time-limits";

export type TimedPart = "partA" | "partB";

// What scoring reads from a click log entry. timeMs counts from the end of "Begin."
export type LoggedClick = {
  timeMs: number;
  circle: string | null;
};

export type GivenPartScore = {
  status: "completed" | "timedOut" | "stopped";
  code: null;
  timeMs: number;
  timeSeconds: number;
  correctLines: number;
  correctClicks: number;
  errors: number;
};

export type PartScore = GivenPartScore | { status: "notGiven"; code: 996 | 997 | null };

export type SampleScore = {
  passed: boolean;
  tries: number;
};

// A sample is null if the test ended before that sample's outcome was known.
export type TrailMakingScores = {
  partA: PartScore;
  partB: PartScore;
  sampleA: SampleScore | null;
  sampleB: SampleScore | null;
};

export function scorePart(
  part: TimedPart,
  clicks: readonly LoggedClick[],
  stoppedAtMs: number | null,
): GivenPartScore {
  const order = expectedOrder[part];
  const limitMs = timeLimitMs[part];
  const stopped = stoppedAtMs !== null && stoppedAtMs < limitMs;
  const cutoffMs = stopped ? stoppedAtMs : limitMs;

  let correctClicks = 0;
  let errors = 0;
  let endClickMs: number | null = null;
  let lastWrong: string | null = null;

  for (const click of clicks) {
    if (click.circle === null || click.timeMs > cutoffMs) {
      continue;
    }

    const outcome = judgeClick(order, correctClicks, click.circle, lastWrong);

    if (outcome === "error") {
      errors += 1;
      lastWrong = click.circle;
    }

    if (outcome === "correct") {
      correctClicks += 1;
      lastWrong = null;

      if (correctClicks === order.length) {
        endClickMs = click.timeMs;
      }
    }
  }

  const timeMs = endClickMs ?? cutoffMs;

  return {
    status: endClickMs !== null ? "completed" : stopped ? "stopped" : "timedOut",
    code: null,
    timeMs,
    timeSeconds: Math.round(timeMs / 100) / 10,
    correctLines: Math.max(correctClicks - 1, 0),
    correctClicks,
    errors,
  };
}
