import { describe, expect, it } from "vitest";
import { isOnScreen, rowOf, topRowFor } from "./visible-rows";

describe("rowOf", () => {
  it("counts rows from 1", () => {
    expect(rowOf(1)).toBe(1);
    expect(rowOf(9)).toBe(1);
    expect(rowOf(10)).toBe(2);
    expect(rowOf(81)).toBe(9);
  });
});

// The first item of each row: 1, 10, 19, 28, 37, 46, 55, 64, 73.
describe("topRowFor", () => {
  it("shows rows 1 to 6 at the start", () => {
    expect(topRowFor(7)).toBe(1);
  });

  it("does not move through row 4", () => {
    expect(topRowFor(36)).toBe(1);
  });

  it("moves up one row when the selector reaches row 5", () => {
    expect(topRowFor(37)).toBe(2);
  });

  it("moves up one more row for each new row after that", () => {
    expect(topRowFor(46)).toBe(3);
    expect(topRowFor(55)).toBe(4);
  });

  it("stops once the last row is showing", () => {
    expect(topRowFor(64)).toBe(4);
    expect(topRowFor(81)).toBe(4);
  });
});

describe("isOnScreen", () => {
  it("includes the six rows from the top row down", () => {
    expect(isOnScreen(10, 2)).toBe(true);
    expect(isOnScreen(63, 2)).toBe(true);
  });

  it("excludes a row that has scrolled off", () => {
    expect(isOnScreen(9, 2)).toBe(false);
  });

  it("excludes a row not yet showing", () => {
    expect(isOnScreen(64, 2)).toBe(false);
  });
});
