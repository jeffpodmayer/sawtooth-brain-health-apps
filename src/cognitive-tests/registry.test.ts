import { expect, it } from "vitest";
import { testsForIds } from "./registry";

it("returns the tests a sequence asks for, in that order", () => {
  const tests = testsForIds(["swaps", "trail-making"]);
  expect(tests?.map((test) => test.id)).toEqual(["swaps", "trail-making"]);
});

it("returns null if the app doesn't have one of the tests", () => {
  expect(testsForIds(["swaps", "no-such-test"])).toBeNull();
});
