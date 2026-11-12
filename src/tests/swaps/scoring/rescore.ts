// Re-scores a finished test from its raw logs, for the save-result Edge Function (roadmap 7.5).
// rawData comes from the browser, so its shape is checked before anything is scored.

import type { LoggedAnswer, SwapsScores } from "./score-grid.ts";
import type { LoggedRecallAnswer } from "./score-recall.ts";
import { scoreSwaps, type StopPoint } from "./score-swaps.ts";

const stages: readonly StopPoint["stage"][] = ["practice", "test", "recall"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// A time in ms from the start of a part: a real number, never negative.
function isTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isAnswerLog(value: unknown): value is LoggedAnswer[] {
  return Array.isArray(value) && value.every((answer) =>
    isRecord(answer) && isTime(answer.timeMs) && Number.isInteger(answer.item) && Number.isInteger(answer.number));
}

function isRecallLog(value: unknown): value is LoggedRecallAnswer[] {
  return Array.isArray(value) && value.every((answer) =>
    isRecord(answer) && isTime(answer.timeMs) && typeof answer.symbol === "string" && Number.isInteger(answer.number));
}

function isStopPoint(value: unknown): value is StopPoint {
  return isRecord(value)
    && stages.some((stage) => stage === value.stage)
    && (value.stoppedAtMs === null || isTime(value.stoppedAtMs));
}

// No practice log is kept, so the browser's count of wrong practice answers is taken
// as sent, once it's a whole number, 0 or more (SPEC: Scoring).
function practiceCount(scores: unknown): number | null {
  if (!isRecord(scores) || !isRecord(scores.practice)) {
    return null;
  }

  const { wrongAnswers } = scores.practice;

  return typeof wrongAnswers === "number" && Number.isInteger(wrongAnswers) && wrongAnswers >= 0
    ? wrongAnswers
    : null;
}

// The scores, or null if rawData isn't a log this test could have written.
// scores is the browser's own, read only for the practice count.
export function rescore(rawData: unknown, scores: unknown): SwapsScores | null {
  if (!isRecord(rawData) || !isRecord(rawData.answers)) {
    return null;
  }

  const { test, recall } = rawData.answers;
  const { stop } = rawData;
  const wrongAnswers = practiceCount(scores);

  if (!isAnswerLog(test) || !isRecallLog(recall) || !(stop === null || isStopPoint(stop)) || wrongAnswers === null) {
    return null;
  }

  return scoreSwaps({ test, recall }, wrongAnswers, stop);
}
