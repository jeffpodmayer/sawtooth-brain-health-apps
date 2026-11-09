import { describe, expect, it } from "vitest";
import { canSelect, nextEmpty } from "./selection";

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
