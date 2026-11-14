import { describe, expect, it } from "vitest";
import { expectedOrder } from "./order";
import type { LoggedClick, TimedPart } from "./score-part";
import { scoreTest, type SkipPoint, type StopPoint } from "./score-test";

// The first `count` circles of a part, clicked correctly one second apart.
function correctClicks(part: TimedPart, count: number): LoggedClick[] {
  return expectedOrder[part].slice(0, count).map((circle, i) => ({ timeMs: (i + 1) * 1000, circle }));
}

it("scores a full run of both parts", () => {
  const clicks = { partA: correctClicks("partA", 25), partB: correctClicks("partB", 25) };
  const completed = {
    status: "completed",
    code: null,
    timeMs: 25000,
    timeSeconds: 25,
    correctLines: 24,
    correctClicks: 25,
    errors: 0,
  };

  expect(scoreTest(clicks, null)).toMatchObject({
    partA: completed,
    partB: completed,
    sampleA: { passed: true },
    sampleB: { passed: true },
  });
});

it("scores each part from its own clicks", () => {
  const { partA, partB } = scoreTest({ partA: correctClicks("partA", 25), partB: correctClicks("partB", 10) }, null);

  expect(partA.status).toBe("completed");
  expect(partB).toMatchObject({ status: "timedOut", timeMs: 300000, correctClicks: 10 });
});

it("times out a part with no clicks at all", () => {
  const { partA } = scoreTest({ partA: [], partB: correctClicks("partB", 25) }, null);

  expect(partA).toMatchObject({ status: "timedOut", timeMs: 150000, correctLines: 0, correctClicks: 0 });
});

function stopAt(page: StopPoint["page"], phase: StopPoint["phase"], stoppedAtMs: number | null = null): StopPoint {
  return { page, phase, stoppedAtMs };
}

const noClicks = { partA: [], partB: [] };
const notGiven = { status: "notGiven", code: null };
const fullA = correctClicks("partA", 25);
const fullB = correctClicks("partB", 25);

it("keeps the partial score of a part stopped while running", () => {
  const clicks = { partA: correctClicks("partA", 8), partB: [] };

  expect(scoreTest(clicks, stopAt("partA", "test", 5500))).toMatchObject({
    partA: {
      status: "stopped",
      code: null,
      timeMs: 5500,
      timeSeconds: 5.5,
      correctLines: 4,
      correctClicks: 5,
      errors: 0,
    },
    partB: notGiven,
    sampleA: { passed: true },
    sampleB: null,
  });
});

it("keeps Part A's score when Part B is stopped", () => {
  const scores = scoreTest({ partA: fullA, partB: correctClicks("partB", 3) }, stopAt("partB", "test", 3500));

  expect(scores.partA.status).toBe("completed");
  expect(scores.partB).toMatchObject({ status: "stopped", timeMs: 3500, correctClicks: 3 });
  expect(scores.sampleB).toMatchObject({ passed: true });
});

it("keeps a timed-out Part A when Part B is stopped", () => {
  const scores = scoreTest({ partA: correctClicks("partA", 10), partB: [] }, stopAt("partB", "test", 1000));

  expect(scores.partA).toMatchObject({ status: "timedOut", timeMs: 150000, correctClicks: 10 });
});

it("fails Sample A and gives neither part when stopped during Sample A", () => {
  const stopped = { partA: notGiven, partB: notGiven, sampleA: { passed: false }, sampleB: null };

  expect(scoreTest(noClicks, stopAt("sampleA", "practice"))).toMatchObject(stopped);
  expect(scoreTest(noClicks, stopAt("sampleA", "instructions"))).toMatchObject(stopped);
});

it("fails Sample B and keeps Part A when stopped during Sample B", () => {
  const scores = scoreTest({ partA: fullA, partB: [] }, stopAt("sampleB", "practice"));

  expect(scores.partA.status).toBe("completed");
  expect(scores.sampleB).toMatchObject({ passed: false });
  expect(scores.partB).toEqual(notGiven);
});

it("doesn't give a part stopped during its instructions", () => {
  const scores = scoreTest(noClicks, stopAt("partA", "instructions"));

  expect(scores.partA).toEqual(notGiven);
  expect(scores.sampleA).toMatchObject({ passed: true });
});

it("passes a sample whose pause was stopped, without reaching the next page", () => {
  const scores = scoreTest(noClicks, stopAt("sampleA", "finished"));

  expect(scores.sampleA).toMatchObject({ passed: true });
  expect(scores.partA).toEqual(notGiven);
});

it("leaves Sample B empty when stopped in the pause after Part A", () => {
  const scores = scoreTest({ partA: fullA, partB: [] }, stopAt("partA", "finished"));

  expect(scores.partA.status).toBe("completed");
  expect(scores.sampleB).toBeNull();
  expect(scores.partB).toEqual(notGiven);
});

it("counts a page as not reached when stopped at the hold before it, like the pause", () => {
  const scores = scoreTest({ partA: fullA, partB: [] }, stopAt("sampleB", "waiting"));

  expect(scores.partA.status).toBe("completed");
  expect(scores.sampleB).toBeNull();
  expect(scores.partB).toEqual(notGiven);
});

it("passes Sample A and doesn't give Part A when stopped at the hold before Part A", () => {
  const scores = scoreTest(noClicks, stopAt("partA", "waiting"));

  expect(scores.sampleA).toMatchObject({ passed: true });
  expect(scores.partA).toEqual(notGiven);
});

it("reaches nothing when stopped at the first hold", () => {
  expect(scoreTest(noClicks, stopAt("sampleA", "waiting"))).toEqual({
    partA: notGiven,
    partB: notGiven,
    sampleA: null,
    sampleB: null,
  });
});

it("scores a whole test normally when stopped in the last pause", () => {
  const scores = scoreTest({ partA: fullA, partB: fullB }, stopAt("partB", "finished"));

  expect(scores.partA.status).toBe("completed");
  expect(scores.partB.status).toBe("completed");
  expect(scores.sampleB).toMatchObject({ passed: true });
});

// Skip Part A (ADR-055): NACC gives code 996 for a Part A not given because Sample A couldn't be completed.
describe("a skipped Part A", () => {
  const partB = correctClicks("partB", 25);

  it("is not given (996) after a skip during Sample A, which isn't passed; Sample B and Part B score as usual", () => {
    const skip: SkipPoint = { page: "sampleA", phase: "practice", stoppedAtMs: 4000 };

    expect(scoreTest({ partA: [], partB }, null, skip)).toMatchObject({
      partA: { status: "notGiven", code: 996 },
      sampleA: { passed: false, timeMs: 4000 },
      sampleB: { passed: true },
      partB: { status: "completed", correctLines: 24 },
    });
  });

  it("keeps Sample A passed when the skip came at the wait after it", () => {
    const skip: SkipPoint = { page: "partA", phase: "waiting", stoppedAtMs: null };

    expect(scoreTest({ partA: [], partB }, null, skip).sampleA).toMatchObject({ passed: true });
  });

  it("keeps what was done when the skip came during the timed Part A: stopped there, with code 996", () => {
    const skip: SkipPoint = { page: "partA", phase: "test", stoppedAtMs: 10500 };

    expect(scoreTest({ partA: correctClicks("partA", 25), partB }, null, skip)).toMatchObject({
      partA: { status: "stopped", code: 996, timeMs: 10500, correctClicks: 10, correctLines: 9 },
      sampleA: { passed: true },
      partB: { status: "completed" },
    });
  });

  it("is not given (996) when the skip came during Part A's instructions, before its clock started", () => {
    const skip: SkipPoint = { page: "partA", phase: "instructions", stoppedAtMs: null };

    expect(scoreTest({ partA: [], partB }, null, skip).partA).toEqual({ status: "notGiven", code: 996 });
  });

  it("still scores a later stop, at Sample B", () => {
    const skip: SkipPoint = { page: "sampleA", phase: "practice", stoppedAtMs: 4000 };
    const stop: StopPoint = { page: "sampleB", phase: "practice", stoppedAtMs: 3000 };

    expect(scoreTest({ partA: [], partB: [] }, stop, skip)).toMatchObject({
      partA: { status: "notGiven", code: 996 },
      sampleB: { passed: false },
      partB: { status: "notGiven", code: null },
    });
  });
});

// Samples are scored like the timed parts, with no time limit: time from when clicking is allowed to the last
// correct click, lines and errors (Jeff, 2026-11-14). The time and counts so far are kept if a stop or a skip
// cuts a sample short, and it isn't passed.
describe("sample scores", () => {
  // Sample A's eight circles clicked correctly one second apart, with one wrong click on the way.
  const sampleA: LoggedClick[] = [
    { timeMs: 1000, circle: "1" },
    { timeMs: 1500, circle: "5" },
    ...["2", "3", "4", "5", "6", "7", "8"].map((circle, i) => ({ timeMs: (i + 2) * 1000, circle })),
  ];

  it("a finished sample has its time, lines and errors", () => {
    expect(scoreTest({ partA: fullA, partB: fullB, sampleA }, null).sampleA).toEqual({
      passed: true,
      timeMs: 8000,
      timeSeconds: 8,
      correctLines: 7,
      correctClicks: 8,
      errors: 1,
    });
  });

  it("a sample stopped partway keeps its time and counts so far, not passed", () => {
    expect(scoreTest({ partA: [], partB: [], sampleA }, stopAt("sampleA", "practice", 4200)).sampleA).toEqual({
      passed: false,
      timeMs: 4200,
      timeSeconds: 4.2,
      correctLines: 3,
      correctClicks: 4,
      errors: 1,
    });
  });

  it("a sample skipped partway keeps its time and counts so far, not passed", () => {
    const skip: SkipPoint = { page: "sampleA", phase: "practice", stoppedAtMs: 2500 };
    expect(scoreTest({ partA: [], partB: [], sampleA }, null, skip).sampleA).toMatchObject({
      passed: false,
      timeMs: 2500,
      correctClicks: 2,
    });
  });

  it("Sample B is scored from its own clicks", () => {
    const sampleB = ["1", "A", "2", "B", "3", "C", "4", "D"].map((circle, i) => ({ timeMs: (i + 1) * 500, circle }));
    expect(scoreTest({ partA: fullA, partB: fullB, sampleB }, null).sampleB).toMatchObject({
      passed: true,
      timeMs: 4000,
      correctLines: 7,
      errors: 0,
    });
  });
});
