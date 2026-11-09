import { expect, it } from "vitest";
import { nextFlow, startFlow, type Flow } from "./page-flow";

function at(pageIndex: number, phase: Flow["phase"]): Flow {
  return { pageIndex, phase };
}

it("starts with the instructions on Sample A", () => {
  expect(startFlow).toEqual(at(0, "instructions"));
});

it("goes from instructions to practice on a sample page", () => {
  expect(nextFlow(at(0, "instructions"), "clicksEnabled")).toEqual(at(0, "practice"));
  expect(nextFlow(at(2, "instructions"), "clicksEnabled")).toEqual(at(2, "practice"));
});

it("goes from instructions to test on a timed page", () => {
  expect(nextFlow(at(1, "instructions"), "clicksEnabled")).toEqual(at(1, "test"));
  expect(nextFlow(at(3, "instructions"), "clicksEnabled")).toEqual(at(3, "test"));
});

it("finishes a page when its last circle is reached", () => {
  expect(nextFlow(at(0, "practice"), "pageCompleted")).toEqual(at(0, "finished"));
  expect(nextFlow(at(1, "test"), "pageCompleted")).toEqual(at(1, "finished"));
});

it("moves to the next page's instructions after the pause", () => {
  expect(nextFlow(at(0, "finished"), "pauseOver")).toEqual(at(1, "instructions"));
});

// Placeholder until 5.9, when finishing Part B ends the test.
it("loops back to Sample A after Part B", () => {
  expect(nextFlow(at(3, "finished"), "pauseOver")).toEqual(at(0, "instructions"));
});

it("ignores an event that doesn't fit the current stage", () => {
  expect(nextFlow(at(0, "instructions"), "pageCompleted")).toEqual(at(0, "instructions"));
  expect(nextFlow(at(1, "test"), "clicksEnabled")).toEqual(at(1, "test"));
  expect(nextFlow(at(0, "practice"), "pauseOver")).toEqual(at(0, "practice"));
});
