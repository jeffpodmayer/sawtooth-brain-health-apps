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

it("re-scores the samples from their own clicks, and treats an older log with none as empty", () => {
  const sampleA = [{ timeMs: 900, circle: "1" }, { timeMs: 1800, circle: "2" }];
  const withSamples = { clicks: { partA, partB, sampleA, sampleB: [] }, stop: null };

  expect(rescore(withSamples)).toEqual(scoreTest({ partA, partB, sampleA, sampleB: [] }, null));
  expect(rescore({ clicks: { partA, partB }, stop: null })).toEqual(scoreTest({ partA, partB }, null));
});

it("rejects a sample log with a bad click", () => {
  expect(rescore({ clicks: { partA, partB, sampleA: [{ timeMs: -1, circle: "1" }] }, stop: null })).toBeNull();
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

it("re-scores a skipped Part A, and treats an older log with no skip as none", () => {
  const skip = { page: "sampleA", phase: "practice", stoppedAtMs: 2000 } as const;

  const skipped = { clicks: { partA: [], partB }, stop: null, skip };

  expect(rescore(skipped)).toEqual(scoreTest({ partA: [], partB }, null, skip));
  expect(rescore({ clicks: { partA, partB }, stop: null })).toEqual(scoreTest({ partA, partB }, null, null));
});

it("re-scores a skip during the timed Part A from its stop time", () => {
  const skip = { page: "partA", phase: "test", stoppedAtMs: 4500 } as const;
  const skipped = { clicks: { partA, partB }, stop: null, skip };

  expect(rescore(skipped)).toEqual(scoreTest({ partA, partB }, null, skip));
});

it.each([
  ["a skip after Part A finished", { page: "partA", phase: "finished", stoppedAtMs: null }],
  ["a skip during Part A with no stop time", { page: "partA", phase: "test", stoppedAtMs: null }],
  ["a skip during Sample A with no time", { page: "sampleA", phase: "practice", stoppedAtMs: null }],
  ["a skip at Sample A's instructions with a time", { page: "sampleA", phase: "instructions", stoppedAtMs: 100 }],
  ["a skip at Sample B", { page: "sampleB", phase: "practice", stoppedAtMs: null }],
  ["a skip that isn't a place", "partA"],
])("rejects %s", (_, skip) => {
  expect(rescore({ clicks: { partA: [], partB }, stop: null, skip })).toBeNull();
});
