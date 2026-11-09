import { describe, expect, it } from "vitest";
import { isScreenLargeEnough } from "./screen-check";

describe("isScreenLargeEnough", () => {
  it("accepts common laptop screens", () => {
    expect(isScreenLargeEnough(1440, 900)).toBe(true);
    expect(isScreenLargeEnough(1366, 768)).toBe(true);
    expect(isScreenLargeEnough(1280, 720)).toBe(true);
  });

  it("uses the height when the height is what limits the page", () => {
    expect(isScreenLargeEnough(1440, 710)).toBe(true);
    expect(isScreenLargeEnough(1440, 709)).toBe(false);
  });

  it("uses the width when the width is what limits the page", () => {
    expect(isScreenLargeEnough(549, 900)).toBe(true);
    expect(isScreenLargeEnough(548, 900)).toBe(false);
  });
});
