import { describe, expect, it } from "vitest";
import { arrowTo, slashAcross } from "./marks";
import { pageLayouts, pageSize } from "./page-layouts";

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
  it("comes from the middle of the page, for a circle on the left", () => {
    expect(arrowTo({ x: 125, y: 550 })).toEqual({
      shaft: { x1: 187, y1: 550, x2: 233, y2: 550 },
      head: "163,550 187,566 187,534",
    });
  });

  it("comes from the middle of the page, for a circle near the top", () => {
    expect(arrowTo({ x: 425, y: 150 })).toEqual({
      shaft: { x1: 425, y1: 212, x2: 425, y2: 258 },
      head: "425,188 409,212 441,212",
    });
  });

  it("stays on the page for every real circle", () => {
    for (const { circles } of Object.values(pageLayouts)) {
      for (const circle of circles) {
        const { shaft } = arrowTo(circle);

        expect(shaft.x2).toBeGreaterThanOrEqual(0);
        expect(shaft.x2).toBeLessThanOrEqual(pageSize.width);
        expect(shaft.y2).toBeGreaterThanOrEqual(0);
        expect(shaft.y2).toBeLessThanOrEqual(pageSize.height);
      }
    }
  });
});
