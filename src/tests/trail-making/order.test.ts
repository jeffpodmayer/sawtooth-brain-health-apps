import { describe, expect, it } from "vitest";
import { expectedOrder } from "./order";

// numbers(3) gives ["1", "2", "3"].
function numbers(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

// alternating(4) gives ["1", "A", "2", "B"].
function alternating(circles: number): string[] {
  return Array.from({ length: circles }, (_, i) =>
    i % 2 === 0 ? String(i / 2 + 1) : "ABCDEFGHIJKL"[(i - 1) / 2],
  );
}

describe("expectedOrder", () => {
  it("has Sample A as 1 to 8", () => {
    expect(expectedOrder.sampleA).toEqual(numbers(8));
  });

  it("has Part A as 1 to 25", () => {
    expect(expectedOrder.partA).toEqual(numbers(25));
  });

  it("has Sample B as 1-A through 4-D", () => {
    expect(expectedOrder.sampleB).toEqual(alternating(8));
    expect(expectedOrder.sampleB.at(-1)).toBe("D");
  });

  it("has Part B as 1-A through L-13", () => {
    expect(expectedOrder.partB).toEqual(alternating(25));
    expect(expectedOrder.partB.slice(-2)).toEqual(["L", "13"]);
  });

  it("never repeats a circle on a page", () => {
    for (const order of Object.values(expectedOrder)) {
      expect(new Set(order).size).toBe(order.length);
    }
  });
});
