// Wraps an audio player so each clip's start and end are recorded (rawData's audio log).

import type { AudioPlayer } from "./audio-player";
import type { Clock } from "./clock";

// endedMs stays null if the clip never finished, for example if the browser refused to play it.
export type AudioLogEntry = {
  lineId: string;
  startedMs: number;
  endedMs: number | null;
  playedToEnd: boolean;
};

export function withAudioLog(player: AudioPlayer, clock: Clock): AudioPlayer & { log: AudioLogEntry[] } {
  const log: AudioLogEntry[] = [];

  async function play(lineId: string) {
    const entry: AudioLogEntry = { lineId, startedMs: clock.now(), endedMs: null, playedToEnd: false };
    log.push(entry);

    const playedToEnd = await player.play(lineId);
    entry.endedMs = clock.now();
    entry.playedToEnd = playedToEnd;

    return playedToEnd;
  }

  return { ...player, play, log };
}
