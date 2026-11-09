import { expect, it } from "vitest";
import { runScript } from "./run-script";
import type { ScriptLine } from "./test-script";

const lines: ScriptLine[] = [
  { id: "one", type: "spoken", text: "First." },
  { id: "two", type: "action", action: "arrow" },
  { id: "three", type: "spoken", text: "Second." },
  { id: "four", type: "action", action: "enableClicks" },
];

it("runs spoken and action lines in script order", async () => {
  const seen: string[] = [];
  const player = {
    play: async (lineId: string) => {
      seen.push(lineId);
      return true;
    },
  };

  const finished = await runScript(lines, player, (line) => seen.push(line.id));

  expect(seen).toEqual(["one", "two", "three", "four"]);
  expect(finished).toBe(true);
});

it("waits for a clip to end before the next line", async () => {
  const seen: string[] = [];
  let endClip: (playedToEnd: boolean) => void = () => {};
  const player = {
    play: () =>
      new Promise<boolean>((resolve) => {
        endClip = resolve;
      }),
  };

  const running = runScript(lines.slice(0, 2), player, (line) => seen.push(line.id));
  await Promise.resolve();
  expect(seen).toEqual([]);

  endClip(true);
  await running;
  expect(seen).toEqual(["two"]);
});

it("stops at a clip that was cut off, and runs nothing after it", async () => {
  const seen: string[] = [];
  const player = { play: async (lineId: string) => lineId !== "three" };

  const finished = await runScript(lines, player, (line) => seen.push(line.id));

  expect(seen).toEqual(["two"]);
  expect(finished).toBe(false);
});

it("waits for an action that hands back a promise", async () => {
  const seen: string[] = [];
  let endPause: () => void = () => {};
  const player = {
    play: async (lineId: string) => {
      seen.push(lineId);
      return true;
    },
  };

  const running = runScript(lines.slice(1, 3), player, () => new Promise<void>((resolve) => {
    endPause = resolve;
  }));
  await Promise.resolve();
  expect(seen).toEqual([]);

  endPause();
  await running;
  expect(seen).toEqual(["three"]);
});
