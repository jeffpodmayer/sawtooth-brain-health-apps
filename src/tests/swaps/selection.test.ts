import { describe, expect, it } from "vitest";
import { canSelect, nextEmpty, nextEmptyAfter } from "./selection";

// The practice boxes: items 4 to 6.
const practice = { first: 4, last: 6 };

function answered(...items: number[]) {
  return new Map(items.map((item) => [item, 1]));
}

describe("nextEmpty", () => {
  it("starts on the first box of the part", () => {
    expect(nextEmpty(practice, answered())).toBe(4);
  });

  it("moves to the next box after an answer", () => {
    expect(nextEmpty(practice, answered(4))).toBe(5);
  });

  it("ignores answers outside the part", () => {
    expect(nextEmpty(practice, answered(1, 2, 3))).toBe(4);
  });

  it("is null when every box is filled", () => {
    expect(nextEmpty(practice, answered(4, 5, 6))).toBeNull();
  });
});

describe("canSelect", () => {
  it("allows a filled box in this part", () => {
    expect(canSelect(practice, answered(4, 5), 4)).toBe(true);
  });

  it("allows the next empty box", () => {
    expect(canSelect(practice, answered(4), 5)).toBe(true);
  });

  it("does not allow an empty box further ahead", () => {
    expect(canSelect(practice, answered(4), 6)).toBe(false);
  });

  it("does not allow a box before this part, even if filled", () => {
    expect(canSelect(practice, answered(3, 4), 3)).toBe(false);
  });

  it("does not allow a box after this part", () => {
    expect(canSelect(practice, answered(4, 5, 6), 7)).toBe(false);
  });
});

describe("nextEmptyAfter", () => {
  // The recall symbols: 1 to 7.
  const recall = { first: 1, last: 7 };

  it("moves to the next symbol after an answer", () => {
    expect(nextEmptyAfter(recall, answered(1), 1)).toBe(2);
  });

  it("moves forward past a skipped symbol, not back to it", () => {
    expect(nextEmptyAfter(recall, answered(1, 2, 4), 4)).toBe(5);
  });

  it("goes round to the first empty symbol after the last one", () => {
    expect(nextEmptyAfter(recall, answered(1, 2, 4, 5, 6, 7), 7)).toBe(3);
  });

  it("is null when every symbol is filled", () => {
    expect(nextEmptyAfter(recall, answered(1, 2, 3, 4, 5, 6, 7), 3)).toBeNull();
  });
});
