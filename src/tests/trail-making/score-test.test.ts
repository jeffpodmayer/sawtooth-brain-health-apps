import { expect, it } from "vitest";
import { expectedOrder } from "./order";
import type { LoggedClick, TimedPart } from "./score-part";
import { scoreTest } from "./score-test";

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

  expect(scoreTest(clicks)).toEqual({
    partA: completed,
    partB: completed,
    sampleA: { passed: true },
    sampleB: { passed: true },
  });
});

it("scores each part from its own clicks", () => {
  const { partA, partB } = scoreTest({ partA: correctClicks("partA", 25), partB: correctClicks("partB", 10) });

  expect(partA.status).toBe("completed");
  expect(partB).toMatchObject({ status: "timedOut", timeMs: 300000, correctClicks: 10 });
});

it("times out a part with no clicks at all", () => {
  const { partA } = scoreTest({ partA: [], partB: correctClicks("partB", 25) });

  expect(partA).toMatchObject({ status: "timedOut", timeMs: 150000, correctLines: 0, correctClicks: 0 });
});
