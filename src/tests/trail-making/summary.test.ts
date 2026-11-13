import { describe, expect, it } from "vitest";
import type { GivenPartScore, TrailMakingScores } from "./scoring/score-part";
import { detailScores, summarizeScores } from "./summary";

const finished: GivenPartScore = {
  status: "completed", code: null, timeMs: 38000, timeSeconds: 38, correctLines: 24, correctClicks: 25, errors: 0,
};
const passed = { passed: true };

function scores(partA: TrailMakingScores["partA"], partB: TrailMakingScores["partB"]): TrailMakingScores {
  return { partA, partB, sampleA: passed, sampleB: passed };
}

describe("Trail Making score summary", () => {
  it("both parts finished: time, correct lines and errors", () => {
    const partB = { ...finished, timeMs: 91300, timeSeconds: 91.3, errors: 2 };
    expect(summarizeScores(scores(finished, partB))).toEqual([
      "Part A: 38 s, 24 correct lines, 0 errors",
      "Part B: 91.3 s, 24 correct lines, 2 errors",
    ]);
  });

  it("a timed-out part shows the time limit", () => {
    const partB = { ...finished, status: "timedOut" as const, timeMs: 300000, timeSeconds: 300, correctLines: 18, errors: 3 };
    expect(summarizeScores(scores(finished, partB))[1]).toBe("Part B: time limit (300 s), 18 correct lines, 3 errors");
  });

  it("a stopped part shows when it stopped, and the part after it is not given", () => {
    const partA = { ...finished, status: "stopped" as const, timeMs: 31000, timeSeconds: 31, correctLines: 9, errors: 1 };
    expect(summarizeScores(scores(partA, { status: "notGiven", code: null }))).toEqual([
      "Part A: stopped at 31 s, 9 correct lines, 1 error",
      "Part B: not given",
    ]);
  });

  it("a not-given part with a code shows the code", () => {
    expect(summarizeScores(scores(finished, { status: "notGiven", code: 996 }))[1]).toBe("Part B: not given (code 996)");
  });

  it("one correct line is singular", () => {
    const partA = { ...finished, status: "stopped" as const, correctLines: 1, errors: 0 };
    expect(summarizeScores(scores(partA, finished))[0]).toBe("Part A: stopped at 38 s, 1 correct line, 0 errors");
  });
});

describe("Trail Making full scores", () => {
  it("lists every page in the order given, samples included", () => {
    expect(detailScores(scores(finished, finished))).toEqual([
      "Sample A: passed",
      "Part A: 38 s, 24 correct lines, 0 errors",
      "Sample B: passed",
      "Part B: 38 s, 24 correct lines, 0 errors",
    ]);
  });

  it("a sample the clinician ended is not passed, and the parts after it are not given", () => {
    const notGiven = { status: "notGiven" as const, code: null };
    expect(detailScores({ partA: notGiven, partB: notGiven, sampleA: { passed: false }, sampleB: null })).toEqual([
      "Sample A: not passed",
      "Part A: not given",
      "Sample B: not reached",
      "Part B: not given",
    ]);
  });
});
