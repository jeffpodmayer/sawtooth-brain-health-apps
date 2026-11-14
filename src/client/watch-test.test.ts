import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StatusCheck } from "./check-status";
import { watchTest } from "./watch-test";

const ok: StatusCheck = { status: "ok", test: { stopRequested: false, holdsReleased: 0, sequenceOpen: true } };

// A check that answers only when the test says so, so a check can be "on its way".
function controlledCheck() {
  const pending: Array<(result: StatusCheck) => void> = [];
  const check = vi.fn(() => new Promise<StatusCheck>((resolve) => pending.push(resolve)));
  const answer = async (result: StatusCheck = ok) => {
    pending.shift()!(result);
    await vi.advanceTimersByTimeAsync(0);
  };
  return { check, answer };
}

// A fake channel: ping() is a "check now" arriving.
function fakeListen() {
  let onCheck = () => {};
  const stopListening = vi.fn();
  const listen = vi.fn((callback: () => void) => {
    onCheck = callback;
    return stopListening;
  });
  return { listen, stopListening, ping: () => onCheck() };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("watchTest", () => {
  it("checks at the start, then again each interval after an answer", async () => {
    const { check, answer } = controlledCheck();
    const onStatus = vi.fn();
    watchTest({ check, listen: fakeListen().listen, onStatus, intervalMs: 3000 });

    expect(check).toHaveBeenCalledTimes(1);
    await answer();
    expect(onStatus).toHaveBeenCalledWith(ok);

    await vi.advanceTimersByTimeAsync(2999);
    expect(check).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("checks on a ping without waiting for the interval", async () => {
    const { check, answer } = controlledCheck();
    const channel = fakeListen();
    watchTest({ check, listen: channel.listen, onStatus: vi.fn(), intervalMs: 3000 });
    await answer();

    channel.ping();
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("runs one check at a time, and once more after a ping that came during a check", async () => {
    const { check, answer } = controlledCheck();
    const channel = fakeListen();
    watchTest({ check, listen: channel.listen, onStatus: vi.fn(), intervalMs: 3000 });

    channel.ping();
    channel.ping();
    expect(check).toHaveBeenCalledTimes(1);

    await answer();
    expect(check).toHaveBeenCalledTimes(2);
    await answer();
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("keeps polling after a failed check", async () => {
    const { check, answer } = controlledCheck();
    watchTest({ check, listen: fakeListen().listen, onStatus: vi.fn(), intervalMs: 3000 });

    await answer({ status: "failed" });
    await vi.advanceTimersByTimeAsync(3000);
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("stops polling and listening after notValid", async () => {
    const { check, answer } = controlledCheck();
    const channel = fakeListen();
    watchTest({ check, listen: channel.listen, onStatus: vi.fn(), intervalMs: 3000 });

    await answer({ status: "notValid" });
    expect(channel.stopListening).toHaveBeenCalled();
    channel.ping();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("after stop, checks no more and drops an answer still on its way", async () => {
    const { check, answer } = controlledCheck();
    const channel = fakeListen();
    const onStatus = vi.fn();
    const stop = watchTest({ check, listen: channel.listen, onStatus, intervalMs: 3000 });

    stop();
    await answer();
    expect(onStatus).not.toHaveBeenCalled();
    expect(channel.stopListening).toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(check).toHaveBeenCalledTimes(1);
  });
});
