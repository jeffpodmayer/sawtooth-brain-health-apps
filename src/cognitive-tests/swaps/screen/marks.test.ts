import { expect, it } from "vitest";
import { keyPrintedOrder } from "../scoring/form-a";
import { itemPosition, keyPosition, keySymbolSize, selectionSize, visibleArea, type Point } from "./form-layout";
import { arrowTo, arrowToItem, arrowToKey } from "./marks";

type Arrow = ReturnType<typeof arrowToKey>;

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

// What matters about an arrow, not its exact pixels: its tip stops just outside the target (clearance from the
// target's center, plus a small gap), and its shaft runs straight back from the tip, away from the target.
function expectPointsAt(arrow: Arrow, target: Point, clearance: number) {
  const [x, y] = arrow.head.split(" ")[0].split(",").map(Number);
  const tip = { x, y };
  const headBase = { x: arrow.shaft.x1, y: arrow.shaft.y1 };
  const tail = { x: arrow.shaft.x2, y: arrow.shaft.y2 };

  const gap = distance(tip, target) - clearance;
  expect(gap).toBeGreaterThan(0);
  expect(gap).toBeLessThanOrEqual(15);

  // In line with the target's center: the tip, head and tail all sit on one straight line through it.
  for (const point of [headBase, tail]) {
    const cross = (tip.x - target.x) * (point.y - target.y) - (tip.y - target.y) * (point.x - target.x);
    expect(Math.abs(cross)).toBeLessThan(0.001);
  }
  expect(distance(headBase, target)).toBeGreaterThan(distance(tip, target));
  expect(distance(tail, target)).toBeGreaterThan(distance(headBase, target));
}

it("points at every key symbol from just outside it", () => {
  keyPrintedOrder.forEach((symbol, index) => {
    expectPointsAt(arrowToKey(symbol), keyPosition(index), keySymbolSize / 2);
  });
});

it("points at every grid item from just outside its selection square", () => {
  for (let item = 1; item <= 81; item++) {
    expectPointsAt(arrowToItem(item), itemPosition(item), selectionSize / 2);
  }
});

it("points at item 1 from the left, since the Demo label is above it", () => {
  const { shaft } = arrowToItem(1);
  expect(shaft.y1).toBe(itemPosition(1).y);
  expect(shaft.x2).toBeLessThan(itemPosition(1).x);
});

it("keeps every key arrow inside the part of the page that shows", () => {
  for (const symbol of keyPrintedOrder) {
    expect(arrowToKey(symbol).shaft.y2).toBeGreaterThanOrEqual(visibleArea.y);
  }
});

it("reads a target as the script writes it", () => {
  expect(arrowTo("item:2")).toEqual(arrowToItem(2));
  expect(arrowTo("key:heart")).toEqual(arrowToKey("heart"));
});

it("rejects a target it doesn't know", () => {
  expect(() => arrowTo("key:star")).toThrow();
});
