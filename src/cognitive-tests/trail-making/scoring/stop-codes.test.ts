import { describe, expect, it } from "vitest";
import type { GivenPartScore, TrailMakingScores } from "./score-part";
import type { StopPoint } from "./score-test";
import { withStopCodes } from "./stop-codes";

const done: GivenPartScore = {
  status: "completed", code: null, timeMs: 38000, timeSeconds: 38, correctLines: 24, correctClicks: 25, errors: 0,
};
const notGiven = { status: "notGiven" as const, code: null };

function scores(partA: TrailMakingScores["partA"], partB: TrailMakingScores["partB"]): TrailMakingScores {
  return { partA, partB, sampleA: { passed: true }, sampleB: null };
}

function at(page: StopPoint["page"], phase: StopPoint["phase"]): StopPoint {
  return { page, phase, stoppedAtMs: null };
}

describe("Unable to complete at a sample: 996 on the timed part after it", () => {
  it.each([
    ["Sample A's instructions", at("sampleA", "instructions")],
    ["Sample A itself", at("sampleA", "practice")],
    ["the pause after Sample A", at("sampleA", "finished")],
    ["the wait after Sample A", at("partA", "waiting")],
  ])("during %s, Part A is 996", (_, stop) => {
    expect(withStopCodes(scores(notGiven, notGiven), stop, "unable_to_complete")).toEqual(
      scores({ status: "notGiven", code: 996 }, notGiven),
    );
  });

  it("during Sample B, Part B is 996 and Part A keeps its score", () => {
    expect(withStopCodes(scores(done, notGiven), at("sampleB", "practice"), "unable_to_complete")).toEqual(
      scores(done, { status: "notGiven", code: 996 }),
    );
  });

  it("during the wait after Sample B, Part B is 996", () => {
    expect(withStopCodes(scores(done, notGiven), at("partB", "waiting"), "unable_to_complete")).toEqual(
      scores(done, { status: "notGiven", code: 996 }),
    );
  });
});

describe("no code", () => {
  it("before a sample starts (the wait before it)", () => {
    const before = scores(done, notGiven);
    expect(withStopCodes(before, at("sampleB", "waiting"), "unable_to_complete")).toEqual(before);
  });

  it("during a timed part", () => {
    const during = scores(done, notGiven);
    expect(withStopCodes(during, at("partA", "test"), "unable_to_complete")).toEqual(during);
  });

  it("for another reason at a sample", () => {
    const gaveUp = scores(notGiven, notGiven);
    expect(withStopCodes(gaveUp, at("sampleA", "practice"), "gave_up")).toEqual(gaveUp);
  });

  it("when nothing stopped the test", () => {
    const finished = scores(done, done);
    expect(withStopCodes(finished, null, "unable_to_complete")).toEqual(finished);
  });
});

describe("Alphabet check not passed: 997 on Part B", () => {
  it("at the wait before Sample B, after Part A", () => {
    expect(withStopCodes(scores(done, notGiven), at("sampleB", "waiting"), "alphabet_check_not_passed")).toEqual(
      scores(done, { status: "notGiven", code: 997 }),
    );
  });

  it("not on a Part B that was given", () => {
    const stoppedInB = scores(done, { ...done, status: "stopped" });
    expect(withStopCodes(stoppedInB, at("partB", "test"), "alphabet_check_not_passed")).toEqual(stoppedInB);
  });
});

it("never changes the scores it was given", () => {
  const before = scores(notGiven, notGiven);
  withStopCodes(before, at("sampleA", "practice"), "unable_to_complete");
  expect(before.partA).toEqual(notGiven);
});
