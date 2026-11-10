// Turns the test part's answer log into its score (SPEC: Scoring, Timing).
// Pure: replays every answer, so the server can re-check it from the raw log.

import { gridItems } from "./form-a";
import type { RecallScore } from "./score-recall";
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
  recall: RecallScore;
  practice: PracticeScore;
};

const correctNumbers = new Map(
  gridItems
    .filter((item) => item.part === "test")
    .map((item) => [item.item, item.correctNumber]),
);

// What the log comes to once the rules are applied. history holds each answered box's numbers
// in order: the last is the final answer, and each one before it was replaced by a correction.
export type GridReplay = {
  status: GivenGridScore["status"];
  timeMs: number;
  history: ReadonlyMap<number, readonly number[]>;
};

export function replayGrid(
  answers: readonly LoggedAnswer[],
  stoppedAtMs: number | null,
): GridReplay {
  const stopped = stoppedAtMs !== null && stoppedAtMs < timeLimitMs.test;
  const cutoffMs = stopped ? stoppedAtMs : timeLimitMs.test;

  const history = new Map<number, number[]>();
  let endAnswerMs: number | null = null;

  for (const answer of answers) {
    if (endAnswerMs !== null || answer.timeMs > cutoffMs || !correctNumbers.has(answer.item)) {
      continue;
    }

    const numbers = history.get(answer.item) ?? [];

    if (numbers.at(-1) !== answer.number) {
      history.set(answer.item, [...numbers, answer.number]);
    }

    if (history.size === correctNumbers.size) {
      endAnswerMs = answer.timeMs;
    }
  }

  return {
    status: endAnswerMs !== null ? "completed" : stopped ? "stopped" : "timedOut",
    timeMs: endAnswerMs ?? cutoffMs,
    history,
  };
}

export function scoreGrid(
  answers: readonly LoggedAnswer[],
  stoppedAtMs: number | null,
): GivenGridScore {
  const { status, timeMs, history } = replayGrid(answers, stoppedAtMs);

  let correct = 0;
  let corrections = 0;

  for (const [item, numbers] of history) {
    corrections += numbers.length - 1;

    if (numbers.at(-1) === correctNumbers.get(item)) {
      correct += 1;
    }
  }

  return {
    status,
    timeMs,
    attempted: history.size,
    correct,
    errors: history.size - correct,
    corrections,
  };
}
