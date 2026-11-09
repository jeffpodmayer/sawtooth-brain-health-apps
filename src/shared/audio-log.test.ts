import { expect, it } from "vitest";
import { withAudioLog } from "./audio-log";
import type { AudioPlayer } from "./audio-player";
import { createFakeClock } from "./clock";

function setUp() {
  const clock = createFakeClock();
  let finishClip: (playedToEnd: boolean) => void = () => {};
  const player: AudioPlayer = {
    ready: Promise.resolve(),
    play: () =>
      new Promise((resolve) => {
        finishClip = resolve;
      }),
    stop: () => {},
  };

  return { clock, logged: withAudioLog(player, clock), finish: (playedToEnd: boolean) => finishClip(playedToEnd) };
}

it("records when a clip starts and ends", async () => {
  const { clock, logged, finish } = setUp();
  clock.advance(100);
  const playing = logged.play("sa-01");
  clock.advance(2000);
  finish(true);

  await expect(playing).resolves.toBe(true);
  expect(logged.log).toEqual([{ lineId: "sa-01", startedMs: 100, endedMs: 2100, playedToEnd: true }]);
});

it("records a clip that was stopped partway", async () => {
  const { logged, finish } = setUp();
  const playing = logged.play("er-02");
  finish(false);

  await expect(playing).resolves.toBe(false);
  expect(logged.log[0].playedToEnd).toBe(false);
});

it("shows a clip still playing as not ended", () => {
  const { logged } = setUp();
  logged.play("sa-01");

  expect(logged.log[0].endedMs).toBeNull();
});
