import { expect, it } from "vitest";
import { expectedOrder } from "./order";
import type { LoggedClick, TimedPart } from "./score-part";
import { scoreTest, type StopPoint } from "./score-test";

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

  expect(scoreTest(clicks, null)).toEqual({
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

  expect(scoreTest(clicks, stopAt("partA", "test", 5500))).toEqual({
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
  expect(scores.sampleB).toEqual({ passed: true });
});

it("keeps a timed-out Part A when Part B is stopped", () => {
  const scores = scoreTest({ partA: correctClicks("partA", 10), partB: [] }, stopAt("partB", "test", 1000));

  expect(scores.partA).toMatchObject({ status: "timedOut", timeMs: 150000, correctClicks: 10 });
});

it("fails Sample A and gives neither part when stopped during Sample A", () => {
  const stopped = { partA: notGiven, partB: notGiven, sampleA: { passed: false }, sampleB: null };

  expect(scoreTest(noClicks, stopAt("sampleA", "practice"))).toEqual(stopped);
  expect(scoreTest(noClicks, stopAt("sampleA", "instructions"))).toEqual(stopped);
});

it("fails Sample B and keeps Part A when stopped during Sample B", () => {
  const scores = scoreTest({ partA: fullA, partB: [] }, stopAt("sampleB", "practice"));

  expect(scores.partA.status).toBe("completed");
  expect(scores.sampleB).toEqual({ passed: false });
  expect(scores.partB).toEqual(notGiven);
});

it("doesn't give a part stopped during its instructions", () => {
  const scores = scoreTest(noClicks, stopAt("partA", "instructions"));

  expect(scores.partA).toEqual(notGiven);
  expect(scores.sampleA).toEqual({ passed: true });
});

it("passes a sample whose pause was stopped, without reaching the next page", () => {
  const scores = scoreTest(noClicks, stopAt("sampleA", "finished"));

  expect(scores.sampleA).toEqual({ passed: true });
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

  expect(scores.sampleA).toEqual({ passed: true });
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
  expect(scores.sampleB).toEqual({ passed: true });
});
