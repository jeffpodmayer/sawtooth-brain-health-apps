import { describe, expect, it } from "vitest";
import { findCircleAt } from "./find-circle";
import { pageLayouts } from "./page-layouts";

const circles = [
  { id: "1", x: 100, y: 100 },
  { id: "A", x: 300, y: 100 },
];

describe("findCircleAt", () => {
  it("finds the circle at its center", () => {
    expect(findCircleAt(circles, 100, 100)).toBe("1");
  });

  it("picks the right circle when there are several", () => {
    expect(findCircleAt(circles, 300, 100)).toBe("A");
  });

  it("counts anywhere inside the circle", () => {
    expect(findCircleAt(circles, 120, 120)).toBe("1");
  });

  it("counts the outer edge of the outline", () => {
    expect(findCircleAt(circles, 132, 100)).toBe("1");
  });

  it("does not count just past the outline", () => {
    expect(findCircleAt(circles, 132.5, 100)).toBeNull();
  });

  it("treats the circle as round, not square", () => {
    expect(findCircleAt(circles, 125, 125)).toBeNull();
  });

  it("returns null away from every circle", () => {
    expect(findCircleAt(circles, 500, 500)).toBeNull();
  });

  it("finds every real circle at its own center, on all four pages", () => {
    for (const { circles: pageCircles } of Object.values(pageLayouts)) {
      for (const circle of pageCircles) {
        expect(findCircleAt(pageCircles, circle.x, circle.y)).toBe(circle.id);
      }
    }
  });
});
