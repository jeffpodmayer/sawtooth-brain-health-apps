import { expect, it } from "vitest";
import { keyPrintedOrder } from "./form-a";
import { visibleArea } from "./form-layout";
import { arrowTo, arrowToItem, arrowToKey } from "./marks";

it("points down at a key symbol from above", () => {
  expect(arrowToKey("heart")).toEqual({
    shaft: { x1: 502, y1: 94.5, x2: 502, y2: 72.5 },
    head: "502,112.5 514,94.5 490,94.5",
  });
});

it("points down at a grid item from above", () => {
  expect(arrowToItem(2)).toEqual({
    shaft: { x1: 199, y1: 194, x2: 199, y2: 172 },
    head: "199,212 211,194 187,194",
  });
});

it("points right at item 1 from the left margin", () => {
  expect(arrowToItem(1)).toEqual({
    shaft: { x1: 73, y1: 249, x2: 51, y2: 249 },
    head: "91,249 73,237 73,261",
  });
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
