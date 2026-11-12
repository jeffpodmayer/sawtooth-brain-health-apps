// Turns the whole test's answer logs into its scores (SPEC: Scoring, Stopped by the clinician).
// Pure, like scoreGrid.

import { scoreGrid, type GridScore, type LoggedAnswer, type SwapsScores } from "./score-grid.ts";
import { scoreRecall, type LoggedRecallAnswer, type RecallScore } from "./score-recall.ts";

export type AnswerLogs = {
  test: readonly LoggedAnswer[];
  recall: readonly LoggedRecallAnswer[];
};

// Where a clinician's stop found the test. Saved in rawData, so the server can re-score it.
// stoppedAtMs counts from the start of that stage's 60 seconds. It's null unless that clock was running.
export type StopPoint = {
  stage: "practice" | "test" | "recall";
  stoppedAtMs: number | null;
};

function scoreTestPart(answers: readonly LoggedAnswer[], stop: StopPoint | null): GridScore {
  if (stop === null || stop.stage === "recall") {
    return scoreGrid(answers, null);
  }

  return stop.stage === "test" && stop.stoppedAtMs !== null
    ? scoreGrid(answers, stop.stoppedAtMs)
    : { status: "notGiven" };
}

function scoreRecallPart(answers: readonly LoggedRecallAnswer[], stop: StopPoint | null): RecallScore {
  if (stop === null) {
    return scoreRecall(answers, null);
  }

  return stop.stage === "recall" && stop.stoppedAtMs !== null
    ? scoreRecall(answers, stop.stoppedAtMs)
    : { status: "notGiven" };
}

export function scoreSwaps(answers: AnswerLogs, wrongAnswers: number, stop: StopPoint | null): SwapsScores {
  return {
    test: scoreTestPart(answers.test, stop),
    recall: scoreRecallPart(answers.recall, stop),
    practice: { wrongAnswers },
  };
}
