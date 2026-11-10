import { describe, expect, it } from "vitest";
import { gridItems } from "./form-a";
import { replayGrid, scoreGrid, type LoggedAnswer } from "./score-grid";

function answer(timeMs: number, item: number, number: number): LoggedAnswer {
  return { timeMs, item, number };
}

// The first `count` test boxes, answered correctly half a second apart.
function correctAnswers(count: number): LoggedAnswer[] {
  return gridItems
    .filter((item) => item.part === "test")
    .slice(0, count)
    .map((item, i) => answer((i + 1) * 500, item.item, item.correctNumber));
}

// Item 7 is a triangle, so 1 is right and 2 is wrong.
describe("scoreGrid", () => {
  it("scores all 75 answered before the limit", () => {
    expect(scoreGrid(correctAnswers(75), null)).toEqual({
      status: "completed",
      timeMs: 37500,
      attempted: 75,
      correct: 75,
      errors: 0,
      corrections: 0,
    });
  });

  it("scores a full 60 s run", () => {
    expect(scoreGrid(correctAnswers(40), null)).toEqual({
      status: "timedOut",
      timeMs: 60000,
      attempted: 40,
      correct: 40,
      errors: 0,
      corrections: 0,
    });
  });

  it("counts a wrong answer as an error", () => {
    const score = scoreGrid([answer(1000, 7, 2), answer(2000, 8, 4)], 3000);
    expect(score.attempted).toBe(2);
    expect(score.correct).toBe(1);
    expect(score.errors).toBe(1);
  });

  it("scores the final answer after a correction from wrong to right", () => {
    const score = scoreGrid([answer(1000, 7, 2), answer(2000, 7, 1)], 3000);
    expect(score.attempted).toBe(1);
    expect(score.correct).toBe(1);
    expect(score.errors).toBe(0);
    expect(score.corrections).toBe(1);
  });

  it("scores the final answer after a correction from right to wrong", () => {
    const score = scoreGrid([answer(1000, 7, 1), answer(2000, 7, 2)], 3000);
    expect(score.attempted).toBe(1);
    expect(score.correct).toBe(0);
    expect(score.errors).toBe(1);
    expect(score.corrections).toBe(1);
  });

  it("doesn't count choosing the same number again as a correction", () => {
    const score = scoreGrid([answer(1000, 7, 2), answer(2000, 7, 2)], 3000);
    expect(score.attempted).toBe(1);
    expect(score.corrections).toBe(0);
  });

  it("counts every change when an answer is changed and changed back", () => {
    const answers = [answer(1000, 7, 1), answer(2000, 7, 2), answer(3000, 7, 1)];
    const score = scoreGrid(answers, 4000);
    expect(score.correct).toBe(1);
    expect(score.corrections).toBe(2);
  });

  it("keeps the partial score when a clinician stops the test", () => {
    expect(scoreGrid(correctAnswers(10), 12345)).toEqual({
      status: "stopped",
      timeMs: 12345,
      attempted: 10,
      correct: 10,
      errors: 0,
      corrections: 0,
    });
  });

  it("gives zero counts when stopped before any answer", () => {
    expect(scoreGrid([], 5000)).toEqual({
      status: "stopped",
      timeMs: 5000,
      attempted: 0,
      correct: 0,
      errors: 0,
      corrections: 0,
    });
  });

  it("doesn't count an answer after the stop", () => {
    const score = scoreGrid([answer(1000, 7, 1), answer(6000, 8, 4)], 5000);
    expect(score.attempted).toBe(1);
  });

  it("counts a 75th answer exactly at the limit", () => {
    const answers = [...correctAnswers(74), answer(60000, 81, 6)];
    const score = scoreGrid(answers, null);
    expect(score.status).toBe("completed");
    expect(score.timeMs).toBe(60000);
  });

  it("times out if the 75th answer lands after the limit", () => {
    const answers = [...correctAnswers(74), answer(60005, 81, 6)];
    const score = scoreGrid(answers, null);
    expect(score.status).toBe("timedOut");
    expect(score.timeMs).toBe(60000);
    expect(score.attempted).toBe(74);
  });

  it("treats a stop after the limit as a timeout", () => {
    expect(scoreGrid([], 60003).status).toBe("timedOut");
  });

  it("keeps a finished run finished if a stop arrives afterwards", () => {
    const score = scoreGrid(correctAnswers(75), 50000);
    expect(score.status).toBe("completed");
    expect(score.timeMs).toBe(37500);
  });

  it("ignores anything logged after the 75th answer", () => {
    const score = scoreGrid([...correctAnswers(75), answer(38000, 7, 2)], null);
    expect(score.correct).toBe(75);
    expect(score.corrections).toBe(0);
  });

  it("ignores boxes outside the test", () => {
    const score = scoreGrid([answer(1000, 3, 6), answer(2000, 82, 1)], 3000);
    expect(score.attempted).toBe(0);
  });

  it("treats a number not on the pad as a wrong answer", () => {
    const score = scoreGrid([answer(1000, 7, 9)], 2000);
    expect(score.attempted).toBe(1);
    expect(score.errors).toBe(1);
  });

  it("counts answers as logged if one jumps ahead", () => {
    const score = scoreGrid([answer(1000, 7, 1), answer(2000, 20, 4)], 3000);
    expect(score.attempted).toBe(2);
    expect(score.correct).toBe(2);
  });
});

// Item 7 is a triangle (1) and item 8 is a pentagon (4).
describe("replayGrid", () => {
  it("keeps each box's numbers in the order they were given", () => {
    const { history } = replayGrid([answer(1000, 7, 2), answer(2000, 8, 4), answer(3000, 7, 1)], null);
    expect(history).toEqual(
      new Map([
        [7, [2, 1]],
        [8, [4]],
      ]),
    );
  });

  it("doesn't add the same number twice in a row", () => {
    const { history } = replayGrid([answer(1000, 7, 1), answer(2000, 7, 1)], null);
    expect(history.get(7)).toEqual([1]);
  });

  it("keeps a change back to an earlier number", () => {
    const { history } = replayGrid([answer(1000, 7, 2), answer(2000, 7, 1), answer(3000, 7, 2)], null);
    expect(history.get(7)).toEqual([2, 1, 2]);
  });
});
