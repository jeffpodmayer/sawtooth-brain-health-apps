import { describe, expect, it, vi } from "vitest";
import { createFakeClock, realClock } from "./clock";

describe("realClock", () => {
  it("reads performance.now()", () => {
    vi.spyOn(performance, "now").mockReturnValue(1234.5);
    expect(realClock.now()).toBe(1234.5);
    vi.restoreAllMocks();
  });
});

describe("createFakeClock", () => {
  it("starts at 0", () => {
    expect(createFakeClock().now()).toBe(0);
  });

  it("stays still until told to move", () => {
    const clock = createFakeClock();
    clock.advance(500);
    expect(clock.now()).toBe(500);
    expect(clock.now()).toBe(500);
  });

  it("adds up each advance", () => {
    const clock = createFakeClock();
    clock.advance(1000);
    clock.advance(500);
    expect(clock.now()).toBe(1500);
  });

  it("measures the same elapsed time every run", () => {
    const clock = createFakeClock();
    const start = clock.now();
    clock.advance(150000);
    expect(clock.now() - start).toBe(150000);
  });
});
