import { expect, it } from "vitest";
import { expectedOrder } from "./order";
import type { LoggedClick } from "./score-part";
import { rescore } from "./rescore";
import { scoreTest, type StopPoint } from "./score-test";

// Part A clicked correctly one second apart, with the extra fields the browser logs.
const partA = expectedOrder.partA.map((circle, i) => ({ timeMs: (i + 1) * 1000, circle, x: 10, y: 20, outcome: "correct" }));
const partB: LoggedClick[] = [{ timeMs: 1500, circle: "1" }, { timeMs: 2500, circle: null }];
const stop: StopPoint = { page: "partB", phase: "test", stoppedAtMs: 3000 };

it("scores a log the same way the browser does", () => {
  expect(rescore({ clicks: { partA, partB }, stop: null, audio: [] })).toEqual(scoreTest({ partA, partB }, null));
  expect(rescore({ clicks: { partA, partB }, stop })).toEqual(scoreTest({ partA, partB }, stop));
});

it("accepts a stop at a hold", () => {
  const atHold: StopPoint = { page: "sampleB", phase: "waiting", stoppedAtMs: null };

  expect(rescore({ clicks: { partA, partB: [] }, stop: atHold })).toEqual(scoreTest({ partA, partB: [] }, atHold));
});

it.each([
  ["no rawData", null],
  ["no click logs", { stop: null }],
  ["a missing part", { clicks: { partA }, stop: null }],
  ["no stop", { clicks: { partA, partB } }],
  ["a negative time", { clicks: { partA, partB: [{ timeMs: -1, circle: "1" }] }, stop: null }],
  ["a time as text", { clicks: { partA, partB: [{ timeMs: "1000", circle: "1" }] }, stop: null }],
  ["a missing time", { clicks: { partA, partB: [{ circle: "1" }] }, stop: null }],
  ["a circle as a number", { clicks: { partA, partB: [{ timeMs: 1000, circle: 1 }] }, stop: null }],
  ["an unknown stop page", { clicks: { partA, partB }, stop: { ...stop, page: "partC" } }],
  ["a negative stop time", { clicks: { partA, partB }, stop: { ...stop, stoppedAtMs: -5 } }],
])("rejects a log with %s", (_, rawData) => {
  expect(rescore(rawData)).toBeNull();
});
