import { expect, it } from "vitest";
import { isRightNumber } from "./practice";

it("accepts the number that goes with the symbol", () => {
  expect(isRightNumber(4, 2)).toBe(true);
  expect(isRightNumber(5, 7)).toBe(true);
  expect(isRightNumber(6, 5)).toBe(true);
});

it("rejects any other number", () => {
  expect(isRightNumber(4, 7)).toBe(false);
});
