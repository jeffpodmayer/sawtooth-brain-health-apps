// Plays a test's pre-generated clips (ADR-006). A clip ending triggers the next step.

import { Howl } from "howler";
import { spokenText, type SpokenLine } from "./test-script";

export type AudioPlayer = {
  // Finishes when every clip has downloaded. Fails if any clip can't load.
  ready: Promise<void>;
  // Finishes when the clip is over: true if it played to its end, false if it was stopped.
  play: (lineId: string) => Promise<boolean>;
  // Silences the clip that is playing, if there is one.
  stop: () => void;
};

// Development only: reads a line aloud when its clip doesn't exist yet (roadmap 4.8).
function speakWithBrowserVoice(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error(`Browser voice failed: ${text}`));
    speechSynthesis.speak(utterance);
  });
}

export function createAudioPlayer(testName: string, lines: SpokenLine[]): AudioPlayer {
  const clips = new Map<string, Howl>();
  const browserVoiceLines = new Map<string, string>();
  let silenceCurrent: (() => void) | null = null;

  const loading = lines.map(
    (line) =>
      new Promise<void>((resolve, reject) => {
        const clip = new Howl({
          src: [`/audio/${testName}/${line.id}.mp3`],
          onload: () => resolve(),
          onloaderror: (_soundId, error) => {
            if (import.meta.env.DEV) {
              console.warn(`${line.id}: no clip, using the browser voice`);
              browserVoiceLines.set(line.id, spokenText(line));
              resolve();
            } else {
              reject(new Error(`${line.id}: ${error}`));
            }
          },
        });
        clips.set(line.id, clip);
      }),
  );

  function play(lineId: string): Promise<boolean> {
    if (import.meta.env.DEV) {
      const browserVoiceText = browserVoiceLines.get(lineId);
      if (browserVoiceText) {
        return new Promise((resolve, reject) => {
          silenceCurrent = () => {
            speechSynthesis.cancel();
            resolve(false);
          };
          speakWithBrowserVoice(browserVoiceText).then(() => resolve(true), reject);
        });
      }
    }

    const clip = clips.get(lineId);
    if (!clip) throw new Error(`${lineId}: clip was not preloaded`);

    return new Promise((resolve, reject) => {
      silenceCurrent = () => {
        clip.off("end");
        clip.off("playerror");
        clip.stop();
        resolve(false);
      };
      clip.once("end", () => resolve(true));
      clip.once("playerror", (_soundId, error) => reject(new Error(`${lineId}: ${error}`)));
      clip.play();
    });
  }

  function stop() {
    silenceCurrent?.();
    silenceCurrent = null;
  }

  return { ready: Promise.all(loading).then(() => undefined), play, stop };
}
