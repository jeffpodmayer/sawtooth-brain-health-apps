import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ProgressReport } from "../shared/result-store";
import { createProgressQueue } from "./progress-queue";
import type { ReportOutcome } from "./report-progress";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const began: ProgressReport = { event: "began" };
const hold1: ProgressReport = { event: "holdReached", hold: 1 };

// A send that answers each call with the next outcome given, and records what it was sent.
function fakeSend(outcomes: ReportOutcome[]) {
  const sent: ProgressReport[] = [];
  const send = vi.fn(async (_testId: string, report: ProgressReport) => {
    sent.push(report);
    return outcomes.shift() ?? "saved";
  });
  return { send, sent };
}

it("sends reports one at a time, in order", async () => {
  const { send, sent } = fakeSend([]);
  const queue = createProgressQueue(send);

  queue.add("swaps", began);
  queue.add("swaps", hold1);
  expect(send).toHaveBeenCalledTimes(1);

  await vi.runAllTimersAsync();
  expect(sent).toEqual([began, hold1]);
});

it("sends a failed report again after the wait, before the next one", async () => {
  const { send, sent } = fakeSend(["failed", "failed"]);
  const queue = createProgressQueue(send, 2000);

  queue.add("swaps", began);
  queue.add("swaps", hold1);
  await vi.advanceTimersByTimeAsync(1999);
  expect(sent).toEqual([began]);

  await vi.advanceTimersByTimeAsync(1);
  expect(sent).toEqual([began, began]);

  await vi.runAllTimersAsync();
  expect(sent).toEqual([began, began, began, hold1]);
});

it("drops a refused report and moves on", async () => {
  const { send, sent } = fakeSend(["refused"]);
  const queue = createProgressQueue(send);

  queue.add("swaps", began);
  queue.add("swaps", hold1);
  await vi.runAllTimersAsync();

  expect(sent).toEqual([began, hold1]);
});

it("sends a report added later, once the queue is empty", async () => {
  const { send, sent } = fakeSend([]);
  const queue = createProgressQueue(send);

  queue.add("swaps", began);
  await vi.runAllTimersAsync();
  queue.add("swaps", hold1);
  await vi.runAllTimersAsync();

  expect(sent).toEqual([began, hold1]);
});

it("gives up a failing report once a report for another test waits behind it", async () => {
  const { send, sent } = fakeSend(["failed", "failed"]);
  const queue = createProgressQueue(send, 2000);

  queue.add("trail-making", { event: "timedPartEnded", part: "partB" });
  await vi.advanceTimersByTimeAsync(2000);
  queue.add("swaps", began);
  await vi.runAllTimersAsync();

  expect(sent).toEqual([{ event: "timedPartEnded", part: "partB" }, { event: "timedPartEnded", part: "partB" }, began]);
});

it("keeps retrying a failing report while only its own test's reports wait behind it", async () => {
  const { send, sent } = fakeSend(["failed", "failed"]);
  const queue = createProgressQueue(send, 2000);

  queue.add("swaps", began);
  queue.add("swaps", hold1);
  await vi.runAllTimersAsync();

  expect(sent).toEqual([began, began, began, hold1]);
});
