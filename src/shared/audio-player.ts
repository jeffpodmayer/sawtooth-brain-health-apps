// Plays a test's pre-generated clips (ADR-006). A clip ending triggers the next step.

import { Howl } from "howler";

export type AudioPlayer = {
  // Finishes when every clip has downloaded. Fails if any clip can't load.
  ready: Promise<void>;
  // Finishes when the clip has played to its end.
  play: (lineId: string) => Promise<void>;
};

export function createAudioPlayer(testName: string, lineIds: string[]): AudioPlayer {
  const clips = new Map<string, Howl>();

  const loading = lineIds.map(
    (lineId) =>
      new Promise<void>((resolve, reject) => {
        const clip = new Howl({
          src: [`/audio/${testName}/${lineId}.mp3`],
          onload: () => resolve(),
          onloaderror: (_soundId, error) => reject(new Error(`${lineId}: ${error}`)),
        });
        clips.set(lineId, clip);
      }),
  );

  function play(lineId: string): Promise<void> {
    const clip = clips.get(lineId);
    if (!clip) throw new Error(`${lineId}: clip was not preloaded`);

    return new Promise((resolve, reject) => {
      clip.once("end", () => resolve());
      clip.once("playerror", (_soundId, error) => reject(new Error(`${lineId}: ${error}`)));
      clip.play();
    });
  }

  return { ready: Promise.all(loading).then(() => undefined), play };
}
