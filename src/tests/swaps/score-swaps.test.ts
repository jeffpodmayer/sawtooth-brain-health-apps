import { expect, it } from "vitest";
import { gridItems } from "./form-a";
import type { LoggedAnswer } from "./score-grid";
import type { LoggedRecallAnswer } from "./score-recall";
import { scoreSwaps, type StopPoint } from "./score-swaps";

// The first 40 test boxes, answered correctly half a second apart, so the last is at 20 s.
const testAnswers: LoggedAnswer[] = gridItems
  .filter((item) => item.part === "test")
  .slice(0, 40)
  .map((item, i) => ({ timeMs: (i + 1) * 500, item: item.item, number: item.correctNumber }));

// Square is 5 and flag is 6, so both are right.
const recallAnswers: LoggedRecallAnswer[] = [
  { timeMs: 2000, symbol: "square", number: 5 },
  { timeMs: 8000, symbol: "flag", number: 6 },
];

const answers = { test: testAnswers, recall: recallAnswers };
const noAnswers = { test: [], recall: [] };
const notGiven = { status: "notGiven" };

function stopAt(stage: StopPoint["stage"], stoppedAtMs: number | null = null): StopPoint {
  return { stage, stoppedAtMs };
}

it("scores both parts when the test wasn't stopped", () => {
  expect(scoreSwaps(answers, 2, null)).toMatchObject({
    test: { status: "timedOut", attempted: 40 },
    recall: { status: "completed", correct: 2, blank: 5 },
    practice: { wrongAnswers: 2 },
  });
});

it("gives neither part when stopped before the test timer starts", () => {
  const neither = { test: notGiven, recall: notGiven, practice: { wrongAnswers: 1 } };

  expect(scoreSwaps(noAnswers, 1, stopAt("practice"))).toEqual(neither);
  expect(scoreSwaps(noAnswers, 1, stopAt("test"))).toEqual(neither);
});

it("keeps the partial test score when stopped during the test", () => {
  const { test, recall } = scoreSwaps({ test: testAnswers, recall: [] }, 0, stopAt("test", 5200));

  expect(test).toMatchObject({ status: "stopped", timeMs: 5200, attempted: 10 });
  expect(recall).toEqual(notGiven);
});

it("lets the test result stand when stopped during the recall instruction", () => {
  const { test, recall } = scoreSwaps({ test: testAnswers, recall: [] }, 0, stopAt("recall"));

  expect(test).toMatchObject({ status: "timedOut", attempted: 40 });
  expect(recall).toEqual(notGiven);
});

it("keeps the recall answers so far when stopped during recall", () => {
  const { test, recall } = scoreSwaps(answers, 0, stopAt("recall", 5000));

  expect(test).toMatchObject({ status: "timedOut", attempted: 40 });
  expect(recall).toEqual({ status: "stopped", correct: 1, blank: 6 });
});
