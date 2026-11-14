import { expect, it } from "vitest";
import { nextFlow, startFlow, type Flow } from "./page-flow";

function at(pageIndex: number, phase: Flow["phase"]): Flow {
  return { pageIndex, phase };
}

it("starts waiting at the hold before Sample A", () => {
  expect(startFlow).toEqual(at(0, "waiting"));
});

it("goes from a hold to that page's instructions when released", () => {
  expect(nextFlow(at(0, "waiting"), "released")).toEqual(at(0, "instructions"));
  expect(nextFlow(at(3, "waiting"), "released")).toEqual(at(3, "instructions"));
});

it("ignores a release anywhere but a hold", () => {
  expect(nextFlow(at(0, "instructions"), "released")).toEqual(at(0, "instructions"));
  expect(nextFlow(at(1, "test"), "released")).toEqual(at(1, "test"));
  expect(nextFlow(at(1, "finished"), "released")).toEqual(at(1, "finished"));
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

it("moves to the hold before the next page after the pause", () => {
  expect(nextFlow(at(0, "finished"), "pauseOver")).toEqual(at(1, "waiting"));
  expect(nextFlow(at(2, "finished"), "pauseOver")).toEqual(at(3, "waiting"));
});

it("ends the test after Part B's pause", () => {
  expect(nextFlow(at(3, "finished"), "pauseOver")).toEqual(at(3, "done"));
});

it("finishes a timed page when time runs out", () => {
  expect(nextFlow(at(1, "test"), "timeUp")).toEqual(at(1, "finished"));
  expect(nextFlow(at(3, "test"), "timeUp")).toEqual(at(3, "finished"));
});

it("ignores time running out once a page is finished", () => {
  expect(nextFlow(at(1, "finished"), "timeUp")).toEqual(at(1, "finished"));
});

it("stays done whatever happens next", () => {
  expect(nextFlow(at(3, "done"), "clicksEnabled")).toEqual(at(3, "done"));
  expect(nextFlow(at(3, "done"), "pageCompleted")).toEqual(at(3, "done"));
  expect(nextFlow(at(3, "done"), "timeUp")).toEqual(at(3, "done"));
  expect(nextFlow(at(3, "done"), "pauseOver")).toEqual(at(3, "done"));
  expect(nextFlow(at(3, "done"), "stopped")).toEqual(at(3, "done"));
  expect(nextFlow(at(3, "done"), "released")).toEqual(at(3, "done"));
});

it("ends the test from any stage when stopped", () => {
  expect(nextFlow(at(0, "waiting"), "stopped")).toEqual(at(0, "done"));
  expect(nextFlow(at(0, "instructions"), "stopped")).toEqual(at(0, "done"));
  expect(nextFlow(at(0, "practice"), "stopped")).toEqual(at(0, "done"));
  expect(nextFlow(at(1, "test"), "stopped")).toEqual(at(1, "done"));
  expect(nextFlow(at(1, "finished"), "stopped")).toEqual(at(1, "done"));
});

it("ignores an event that doesn't fit the current stage", () => {
  expect(nextFlow(at(0, "instructions"), "pageCompleted")).toEqual(at(0, "instructions"));
  expect(nextFlow(at(1, "test"), "clicksEnabled")).toEqual(at(1, "test"));
  expect(nextFlow(at(0, "practice"), "pauseOver")).toEqual(at(0, "practice"));
  expect(nextFlow(at(1, "waiting"), "clicksEnabled")).toEqual(at(1, "waiting"));
});
