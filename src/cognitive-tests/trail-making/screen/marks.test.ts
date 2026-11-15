import { describe, expect, it } from "vitest";
import { arrowTo, slashAcross } from "./marks";
import { circleOuterRadius, pageLayouts, pageSize, type Point } from "./page-layouts";

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const allCircles = Object.values(pageLayouts).flatMap((layout) => layout.circles);

describe("slashAcross", () => {
  it("crosses the middle of the line at an angle", () => {
    const slash = slashAcross({ x1: 0, y1: 100, x2: 200, y2: 100 });

    expect(slash.x1).toBeCloseTo(90);
    expect(slash.y1).toBeCloseTo(82.68);
    expect(slash.x2).toBeCloseTo(110);
    expect(slash.y2).toBeCloseTo(117.32);
  });
});

describe("arrowTo", () => {
  // What matters about an arrow, not its exact pixels: its tip stops just outside the circle, and its shaft runs
  // straight back from the tip, away from the circle and toward the middle of the page.
  it("points at every real circle from just outside it, on the side facing the middle of the page", () => {
    const middle = { x: pageSize.width / 2, y: pageSize.height / 2 };

    for (const circle of allCircles) {
      const arrow = arrowTo(circle);
      const [x, y] = arrow.head.split(" ")[0].split(",").map(Number);
      const tip = { x, y };
      const headBase = { x: arrow.shaft.x1, y: arrow.shaft.y1 };
      const tail = { x: arrow.shaft.x2, y: arrow.shaft.y2 };

      const gap = distance(tip, circle) - circleOuterRadius;
      expect(gap).toBeGreaterThan(0);
      expect(gap).toBeLessThanOrEqual(15);

      for (const point of [headBase, tail]) {
        const cross = (tip.x - circle.x) * (point.y - circle.y) - (tip.y - circle.y) * (point.x - circle.x);
        expect(Math.abs(cross)).toBeLessThan(0.001);
      }
      expect(distance(headBase, circle)).toBeGreaterThan(distance(tip, circle));
      expect(distance(tail, circle)).toBeGreaterThan(distance(headBase, circle));
      expect(distance(tail, middle)).toBeLessThan(distance(circle, middle));
    }
  });

  it("stays on the page for every real circle", () => {
    for (const circle of allCircles) {
      const { shaft } = arrowTo(circle);

      expect(shaft.x2).toBeGreaterThanOrEqual(0);
      expect(shaft.x2).toBeLessThanOrEqual(pageSize.width);
      expect(shaft.y2).toBeGreaterThanOrEqual(0);
      expect(shaft.y2).toBeLessThanOrEqual(pageSize.height);
    }
  });
});
