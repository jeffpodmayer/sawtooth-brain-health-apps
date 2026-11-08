// Turns the recall part's answer log into its score (SPEC: Recall screen, Scoring).
// Pure: replays every answer, so the server can re-check it from the raw log.

import { keyNumbers } from "./form-a";
import { timeLimitMs } from "./time-limits";

// What scoring reads from a recall log entry. timeMs counts from the end of the instruction.
export type LoggedRecallAnswer = {
  timeMs: number;
  symbol: string;
  number: number;
};

export type GivenRecallScore = {
  status: "completed" | "stopped";
  correct: number;
  blank: number;
};

export type RecallScore = GivenRecallScore | { status: "notGiven" };

const correctNumbers = new Map<string, number>(Object.entries(keyNumbers));

export function scoreRecall(
  answers: readonly LoggedRecallAnswer[],
  stoppedAtMs: number | null,
): GivenRecallScore {
  const stopped = stoppedAtMs !== null && stoppedAtMs < timeLimitMs.recall;
  const cutoffMs = stopped ? stoppedAtMs : timeLimitMs.recall;

  const finalAnswers = new Map<string, number>();

  for (const answer of answers) {
    if (answer.timeMs > cutoffMs || !correctNumbers.has(answer.symbol)) {
      continue;
    }

    finalAnswers.set(answer.symbol, answer.number);
  }

  let correct = 0;

  for (const [symbol, number] of finalAnswers) {
    if (number === correctNumbers.get(symbol)) {
      correct += 1;
    }
  }

  return {
    status: stopped ? "stopped" : "completed",
    correct,
    blank: correctNumbers.size - finalAnswers.size,
  };
}
