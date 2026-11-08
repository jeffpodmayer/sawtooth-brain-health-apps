// Turns the test part's answer log into its score (SPEC: Scoring, Timing).
// Pure: replays every answer, so the server can re-check it from the raw log.

import { gridItems } from "./form-a";
import { timeLimitMs } from "./time-limits";

// What scoring reads from an answer log entry. timeMs counts from the end of "Begin!"
export type LoggedAnswer = {
  timeMs: number;
  item: number;
  number: number;
};

export type GivenGridScore = {
  status: "completed" | "timedOut" | "stopped";
  timeMs: number;
  attempted: number;
  correct: number;
  errors: number;
  corrections: number;
};

export type GridScore = GivenGridScore | { status: "notGiven" };

export type PracticeScore = {
  wrongAnswers: number;
};

export type SwapsScores = {
  test: GridScore;
  practice: PracticeScore;
};

const correctNumbers = new Map(
  gridItems
    .filter((item) => item.part === "test")
    .map((item) => [item.item, item.correctNumber]),
);

export function scoreGrid(
  answers: readonly LoggedAnswer[],
  stoppedAtMs: number | null,
): GivenGridScore {
  const stopped = stoppedAtMs !== null && stoppedAtMs < timeLimitMs.test;
  const cutoffMs = stopped ? stoppedAtMs : timeLimitMs.test;

  const finalAnswers = new Map<number, number>();
  let corrections = 0;
  let endAnswerMs: number | null = null;

  for (const answer of answers) {
    if (endAnswerMs !== null || answer.timeMs > cutoffMs || !correctNumbers.has(answer.item)) {
      continue;
    }

    const previous = finalAnswers.get(answer.item);

    if (previous !== undefined && previous !== answer.number) {
      corrections += 1;
    }

    finalAnswers.set(answer.item, answer.number);

    if (finalAnswers.size === correctNumbers.size) {
      endAnswerMs = answer.timeMs;
    }
  }

  let correct = 0;

  for (const [item, number] of finalAnswers) {
    if (number === correctNumbers.get(item)) {
      correct += 1;
    }
  }

  return {
    status: endAnswerMs !== null ? "completed" : stopped ? "stopped" : "timedOut",
    timeMs: endAnswerMs ?? cutoffMs,
    attempted: finalAnswers.size,
    correct,
    errors: finalAnswers.size - correct,
    corrections,
  };
}
