import { expect, it } from "vitest";
import { rescore } from "./rescore";
import { scoreSwaps, type StopPoint } from "./score-swaps";

const answers = {
  test: [{ timeMs: 1200, item: 7, number: 1 }, { timeMs: 2500, item: 8, number: 4 }],
  recall: [{ timeMs: 3000, symbol: "square", number: 5 }],
};
const stop: StopPoint = { stage: "test", stoppedAtMs: 2000 };
const scores = { practice: { wrongAnswers: 2 } };

it("scores a log the same way the browser does", () => {
  expect(rescore({ answers, stop: null, audio: [] }, scores)).toEqual(scoreSwaps(answers, 2, null));
  expect(rescore({ answers, stop }, scores)).toEqual(scoreSwaps(answers, 2, stop));
});

it.each([
  ["no rawData", null, scores],
  ["no answer logs", { stop: null }, scores],
  ["a missing recall log", { answers: { test: answers.test }, stop: null }, scores],
  ["no stop", { answers }, scores],
  ["a negative time", { answers: { ...answers, test: [{ timeMs: -1, item: 7, number: 1 }] }, stop: null }, scores],
  ["a time as text", { answers: { ...answers, recall: [{ timeMs: "3000", symbol: "square", number: 5 }] }, stop: null }, scores],
  ["a box number as text", { answers: { ...answers, test: [{ timeMs: 1000, item: "7", number: 1 }] }, stop: null }, scores],
  ["a missing symbol", { answers: { ...answers, recall: [{ timeMs: 3000, number: 5 }] }, stop: null }, scores],
  ["an unknown stop stage", { answers, stop: { ...stop, stage: "demo" } }, scores],
  ["a negative stop time", { answers, stop: { ...stop, stoppedAtMs: -5 } }, scores],
  ["no practice count", { answers, stop: null }, {}],
  ["a negative practice count", { answers, stop: null }, { practice: { wrongAnswers: -1 } }],
  ["a practice count that isn't whole", { answers, stop: null }, { practice: { wrongAnswers: 1.5 } }],
])("rejects a result with %s", (_, rawData, clientScores) => {
  expect(rescore(rawData, clientScores)).toBeNull();
});
