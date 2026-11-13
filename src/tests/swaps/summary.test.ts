import { describe, expect, it } from "vitest";
import type { GivenGridScore, SwapsScores } from "./scoring/score-grid";
import { summarizeScores } from "./summary";

const timedOut: GivenGridScore = { status: "timedOut", timeMs: 60000, attempted: 24, correct: 23, errors: 1, corrections: 1 };
const practice = { wrongAnswers: 0 };

function scores(test: SwapsScores["test"], recall: SwapsScores["recall"]): SwapsScores {
  return { test, recall, practice };
}

describe("SWAPS score summary", () => {
  it("the usual run: test to 60 s, then recall", () => {
    expect(summarizeScores(scores(timedOut, { status: "completed", correct: 5, blank: 1 }))).toEqual([
      "Test: 23 correct, 24 attempted, 1 error, 1 correction",
      "Recall: 5 of 7 correct, 1 blank",
    ]);
  });

  it("all 75 done before 60 s shows how long it took", () => {
    const test = { ...timedOut, status: "completed" as const, timeMs: 52340, attempted: 75, correct: 74, errors: 1, corrections: 0 };
    expect(summarizeScores(scores(test, { status: "completed", correct: 7, blank: 0 }))[0]).toBe(
      "Test: 74 correct, 75 attempted, 1 error, 0 corrections, all done in 52.3 s",
    );
  });

  it("stopped during the test: when it stopped, and recall not given", () => {
    const test = { ...timedOut, status: "stopped" as const, timeMs: 31000 };
    expect(summarizeScores(scores(test, { status: "notGiven" }))).toEqual([
      "Test: stopped at 31 s, 23 correct, 24 attempted, 1 error, 1 correction",
      "Recall: not given",
    ]);
  });

  it("stopped during recall", () => {
    expect(summarizeScores(scores(timedOut, { status: "stopped", correct: 3, blank: 4 }))[1]).toBe(
      "Recall: stopped, 3 of 7 correct, 4 blank",
    );
  });

  it("stopped before the test began: neither part given", () => {
    expect(summarizeScores(scores({ status: "notGiven" }, { status: "notGiven" }))).toEqual([
      "Test: not given",
      "Recall: not given",
    ]);
  });

  it("two errors and two corrections are plural", () => {
    const test = { ...timedOut, errors: 2, corrections: 2 };
    expect(summarizeScores(scores(test, { status: "notGiven" }))[0]).toBe(
      "Test: 23 correct, 24 attempted, 2 errors, 2 corrections",
    );
  });
});
