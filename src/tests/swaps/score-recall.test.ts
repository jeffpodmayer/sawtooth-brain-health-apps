import { describe, expect, it } from "vitest";
import { keyNumbers, keyPrintedOrder } from "./form-a";
import { scoreRecall, type LoggedRecallAnswer } from "./score-recall";

function answer(timeMs: number, symbol: string, number: number): LoggedRecallAnswer {
  return { timeMs, symbol, number };
}

// All 7 symbols answered correctly, one second apart.
const allCorrect = keyPrintedOrder.map((symbol, i) =>
  answer((i + 1) * 1000, symbol, keyNumbers[symbol]),
);

// All 7 answered, each with the next number up, so every one is wrong.
const allWrong = keyPrintedOrder.map((symbol, i) =>
  answer((i + 1) * 1000, symbol, (keyNumbers[symbol] % 7) + 1),
);

// Square is 5, so 2 is wrong.
describe("scoreRecall", () => {
  it("scores 7 out of 7", () => {
    expect(scoreRecall(allCorrect, null)).toEqual({
      status: "completed",
      correct: 7,
      blank: 0,
    });
  });

  it("scores 0 out of 7", () => {
    expect(scoreRecall(allWrong, null)).toEqual({
      status: "completed",
      correct: 0,
      blank: 0,
    });
  });

  it("scores a mix of right, wrong and blank", () => {
    const answers = [
      answer(1000, "square", 5),
      answer(2000, "flag", 6),
      answer(3000, "triangle", 1),
      answer(4000, "pentagon", 1),
      answer(5000, "circle", 1),
    ];
    expect(scoreRecall(answers, null)).toEqual({
      status: "completed",
      correct: 3,
      blank: 2,
    });
  });

  it("counts every symbol as blank when nothing is answered", () => {
    expect(scoreRecall([], null)).toEqual({
      status: "completed",
      correct: 0,
      blank: 7,
    });
  });

  it("scores the final answer after a change from wrong to right", () => {
    const score = scoreRecall([answer(1000, "square", 2), answer(2000, "square", 5)], null);
    expect(score.correct).toBe(1);
    expect(score.blank).toBe(6);
  });

  it("scores the final answer after a change from right to wrong", () => {
    const score = scoreRecall([answer(1000, "square", 5), answer(2000, "square", 2)], null);
    expect(score.correct).toBe(0);
    expect(score.blank).toBe(6);
  });

  it("keeps counting changes after all 7 are answered", () => {
    const score = scoreRecall([...allCorrect, answer(30000, "square", 2)], null);
    expect(score.correct).toBe(6);
  });

  it("counts an answer exactly at the limit", () => {
    expect(scoreRecall([answer(60000, "square", 5)], null).correct).toBe(1);
  });

  it("doesn't count an answer after the limit", () => {
    const score = scoreRecall([answer(60005, "square", 5)], null);
    expect(score.correct).toBe(0);
    expect(score.blank).toBe(7);
  });

  it("keeps the answers so far when a clinician stops recall", () => {
    const answers = [answer(1000, "square", 5), answer(2000, "flag", 6)];
    expect(scoreRecall(answers, 5000)).toEqual({
      status: "stopped",
      correct: 2,
      blank: 5,
    });
  });

  it("doesn't count an answer after the stop", () => {
    const score = scoreRecall([answer(1000, "square", 5), answer(6000, "flag", 6)], 5000);
    expect(score.correct).toBe(1);
  });

  it("treats a stop at or after the limit as completed", () => {
    expect(scoreRecall([], 60000).status).toBe("completed");
    expect(scoreRecall([], 60003).status).toBe("completed");
  });

  it("treats a number not on the pad as a wrong answer, not a blank", () => {
    const score = scoreRecall([answer(1000, "square", 9)], null);
    expect(score.correct).toBe(0);
    expect(score.blank).toBe(6);
  });

  it("ignores a symbol that isn't in the key", () => {
    const score = scoreRecall([answer(1000, "star", 1)], null);
    expect(score.correct).toBe(0);
    expect(score.blank).toBe(7);
  });
});
