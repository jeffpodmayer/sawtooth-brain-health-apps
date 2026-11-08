import { describe, expect, it } from "vitest";
import { expectedOrder } from "./order";
import { scorePart, type LoggedClick } from "./score-part";

function click(timeMs: number, circle: string | null): LoggedClick {
  return { timeMs, circle };
}

// The first `count` circles of a part, clicked correctly one second apart.
function correctClicks(part: "partA" | "partB", count: number): LoggedClick[] {
  return expectedOrder[part].slice(0, count).map((circle, i) => click((i + 1) * 1000, circle));
}

describe("scorePart", () => {
  it("scores a full run of Part A", () => {
    expect(scorePart("partA", correctClicks("partA", 25), null)).toEqual({
      status: "completed",
      code: null,
      timeMs: 25000,
      timeSeconds: 25,
      correctLines: 24,
      correctClicks: 25,
      errors: 0,
    });
  });

  it("scores a full run of Part B", () => {
    const score = scorePart("partB", correctClicks("partB", 25), null);
    expect(score.status).toBe("completed");
    expect(score.correctClicks).toBe(25);
  });

  it("reports seconds to the nearest tenth", () => {
    const clicks = [...correctClicks("partA", 24), click(28340, "25")];
    expect(scorePart("partA", clicks, null).timeSeconds).toBe(28.3);
  });

  it("counts errors and keeps going", () => {
    const clicks = [click(1000, "1"), click(2000, "5"), click(3000, "2")];
    const score = scorePart("partA", clicks, 4000);
    expect(score.errors).toBe(1);
    expect(score.correctClicks).toBe(2);
  });

  it("doesn't count a double-click as an error", () => {
    const clicks = [click(1000, "1"), click(1100, "1")];
    expect(scorePart("partA", clicks, 2000).errors).toBe(0);
  });

  it("skips clicks outside a circle", () => {
    const clicks = [click(1000, null), click(3000, "1")];
    const score = scorePart("partA", clicks, 4000);
    expect(score.errors).toBe(0);
    expect(score.correctClicks).toBe(1);
  });

  it("records the 150 s limit when Part A times out", () => {
    expect(scorePart("partA", correctClicks("partA", 10), null)).toEqual({
      status: "timedOut",
      code: null,
      timeMs: 150000,
      timeSeconds: 150,
      correctLines: 9,
      correctClicks: 10,
      errors: 0,
    });
  });

  it("records the 300 s limit when Part B times out", () => {
    const score = scorePart("partB", correctClicks("partB", 10), null);
    expect(score.status).toBe("timedOut");
    expect(score.timeMs).toBe(300000);
  });

  it("counts an End click exactly at the limit", () => {
    const clicks = [...correctClicks("partA", 24), click(150000, "25")];
    expect(scorePart("partA", clicks, null).status).toBe("completed");
  });

  it("times out if the End click lands after the limit", () => {
    const clicks = [...correctClicks("partA", 24), click(150005, "25")];
    const score = scorePart("partA", clicks, null);
    expect(score.status).toBe("timedOut");
    expect(score.timeMs).toBe(150000);
    expect(score.correctClicks).toBe(24);
  });

  it("keeps the partial score when a clinician stops the part", () => {
    expect(scorePart("partA", correctClicks("partA", 10), 12345)).toEqual({
      status: "stopped",
      code: null,
      timeMs: 12345,
      timeSeconds: 12.3,
      correctLines: 9,
      correctClicks: 10,
      errors: 0,
    });
  });

  it("gives zero lines when stopped before any click", () => {
    const score = scorePart("partA", [], 5000);
    expect(score.correctLines).toBe(0);
    expect(score.correctClicks).toBe(0);
  });

  it("doesn't count a click after the stop", () => {
    const clicks = [click(1000, "1"), click(6000, "2")];
    expect(scorePart("partA", clicks, 5000).correctClicks).toBe(1);
  });

  it("treats a stop after the limit as a timeout", () => {
    expect(scorePart("partA", [], 150003).status).toBe("timedOut");
  });

  it("keeps a finished run finished if a stop arrives afterwards", () => {
    const score = scorePart("partA", correctClicks("partA", 25), 30000);
    expect(score.status).toBe("completed");
    expect(score.timeMs).toBe(25000);
  });
});
