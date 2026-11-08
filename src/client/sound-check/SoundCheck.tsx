// The client's first sound (ADR-006). The Start click unlocks audio in the browser.

import { useState } from "react";
import { createAudioPlayer } from "../../shared/audio-player";
import type { SpokenLine } from "../../shared/test-script";
import script from "./script.json";

const line = script.sections.check[0] as SpokenLine;
const buttonClass =
  "h-14 rounded-lg bg-accent px-8 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50";

// Moves keyboard and screen reader users to the question when it appears.
const focusOnShow = (element: HTMLElement | null) => element?.focus();

type SoundCheckProps = {
  onHeard: () => void;
};

function SoundCheck({ onHeard }: SoundCheckProps) {
  const [player] = useState(() => createAudioPlayer("sound-check", [line]));
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);

  async function playClip() {
    setStarted(true);
    setPlaying(true);
    try {
      await player.ready;
      await player.play(line.id);
    } finally {
      setPlaying(false);
    }
  }

  if (!started) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <button type="button" onClick={playClip} className={buttonClass}>
          Start sound check
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 ref={focusOnShow} tabIndex={-1} className="text-5xl font-bold outline-none">
        {line.text}
      </h1>
      <div className="mt-8 flex flex-wrap gap-4">
        <button type="button" disabled={playing} onClick={onHeard} className={buttonClass}>
          Yes, I can hear it
        </button>
        <button type="button" disabled={playing} onClick={playClip} className={buttonClass}>
          Play it again
        </button>
      </div>
    </main>
  );
}

export default SoundCheck;
