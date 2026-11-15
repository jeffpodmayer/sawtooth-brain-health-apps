import { describe, expect, it } from "vitest";
import { lineBetween } from "./line-between";

describe("lineBetween", () => {
  it("stops at the outer edge of both circles", () => {
    const line = lineBetween({ x: 100, y: 100 }, { x: 300, y: 100 });

    expect(line).toEqual({ x1: 132, y1: 100, x2: 268, y2: 100 });
  });

  it("works when the line runs up the page", () => {
    const line = lineBetween({ x: 100, y: 300 }, { x: 100, y: 100 });

    expect(line).toEqual({ x1: 100, y1: 268, x2: 100, y2: 132 });
  });

  it("follows the direction of a diagonal", () => {
    const line = lineBetween({ x: 0, y: 0 }, { x: 300, y: 400 });

    expect(line.x1).toBeCloseTo(19.2);
    expect(line.y1).toBeCloseTo(25.6);
    expect(line.x2).toBeCloseTo(280.8);
    expect(line.y2).toBeCloseTo(374.4);
  });
});
