// Turns one page's click log into its score (SPEC: Scoring, Timing): a timed part, or a sample.
// Pure: replays every click through judgeClick, so the server can re-check it from the raw log.

import { judgeClick } from "./judge-click.ts";
import { expectedOrder } from "./order.ts";
import { timeLimitMs } from "./time-limits.ts";

export type TimedPart = "partA" | "partB";
export type SampleName = "sampleA" | "sampleB";

// What scoring reads from a click log entry. timeMs counts from the end of "Begin."
export type LoggedClick = {
  timeMs: number;
  circle: string | null;
};

export type GivenPartScore = {
  status: "completed" | "timedOut" | "stopped";
  code: null | 996; // 996 only on a part the clinician skipped partway (ADR-055)
  timeMs: number;
  timeSeconds: number;
  correctLines: number;
  correctClicks: number;
  errors: number;
};

export type PartScore = GivenPartScore | { status: "notGiven"; code: 996 | 997 | null };

// A sample's numbers: scored like a timed part, with no time limit (Jeff, 2026-11-14).
export type SampleCounts = {
  timeMs: number;
  timeSeconds: number;
  correctLines: number;
  correctClicks: number;
  errors: number;
};

// Whether the sample was finished, and its numbers. Results saved before samples were scored have only passed.
export type SampleScore = { passed: boolean } & Partial<SampleCounts>;

// A sample is null if the test ended before reaching it.
export type TrailMakingScores = {
  partA: PartScore;
  partB: PartScore;
  sampleA: SampleScore | null;
  sampleB: SampleScore | null;
};

// What a page's clicks add up to, up to a cutoff: the same click rules for samples and timed parts.
function replay(page: TimedPart | SampleName, clicks: readonly LoggedClick[], cutoffMs: number) {
  const order = expectedOrder[page];
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

  return { correctClicks, errors, endClickMs };
}

// Milliseconds as seconds, to the nearest tenth (e.g. 28.3).
function seconds(ms: number): number {
  return Math.round(ms / 100) / 10;
}

export function scorePart(
  part: TimedPart,
  clicks: readonly LoggedClick[],
  stoppedAtMs: number | null,
): GivenPartScore {
  const limitMs = timeLimitMs[part];
  const stopped = stoppedAtMs !== null && stoppedAtMs < limitMs;
  const cutoffMs = stopped ? stoppedAtMs : limitMs;
  const { correctClicks, errors, endClickMs } = replay(part, clicks, cutoffMs);
  const timeMs = endClickMs ?? cutoffMs;

  return {
    status: endClickMs !== null ? "completed" : stopped ? "stopped" : "timedOut",
    code: null,
    timeMs,
    timeSeconds: seconds(timeMs),
    correctLines: Math.max(correctClicks - 1, 0),
    correctClicks,
    errors,
  };
}

// A sample's numbers. With no time limit, its time runs from when clicking is allowed to the last correct
// click, or to the stop or skip that cut it short (stoppedAtMs).
export function scoreSampleClicks(
  sample: SampleName,
  clicks: readonly LoggedClick[],
  stoppedAtMs: number | null,
): SampleCounts {
  const { correctClicks, errors, endClickMs } = replay(sample, clicks, stoppedAtMs ?? Infinity);
  const timeMs = endClickMs ?? stoppedAtMs ?? 0;

  return {
    timeMs,
    timeSeconds: seconds(timeMs),
    correctLines: Math.max(correctClicks - 1, 0),
    correctClicks,
    errors,
  };
}
