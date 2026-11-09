import { expect, it } from "vitest";
import { itemPosition, keyPosition } from "./form-layout";

it("puts item 1 in the top left of the grid", () => {
  expect(itemPosition(1)).toEqual({ x: 128, y: 249 });
});

it("ends a row at item 9 and starts the next at item 10", () => {
  expect(itemPosition(9)).toEqual({ x: 726, y: 249 });
  expect(itemPosition(10)).toEqual({ x: 128, y: 339 });
});

it("puts item 81 in the bottom right", () => {
  expect(itemPosition(81)).toEqual({ x: 726, y: 969 });
});

it("spaces the key along one line", () => {
  expect(keyPosition(0)).toEqual({ x: 202, y: 140 });
  expect(keyPosition(6)).toEqual({ x: 652, y: 140 });
});
