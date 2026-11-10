// The client's first sound (ADR-006). The Start click unlocks audio in the browser.

import { useState, type ReactNode } from "react";
import { createAudioPlayer, type AudioPlayer } from "../../shared/audio-player";
import type { SpokenLine } from "../../shared/test-script";
import TryAgainScreen from "../TryAgainScreen";
import script from "./script.json";

const line = script.sections.check[0] as SpokenLine;
const buttonClass =
  "h-14 rounded-lg bg-accent px-8 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50 aria-disabled:opacity-50";

// Moves keyboard and screen reader users to the question when it appears.
const focusOnShow = (element: HTMLElement | null) => element?.focus();

const LOAD_TIME_LIMIT_MS = 15_000;

// Fails if the clip hasn't downloaded in time, so a stalled download can't hang the screen.
function readyInTime(player: AudioPlayer): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("Clip download timed out")), LOAD_TIME_LIMIT_MS);
    player.ready.then(resolve, reject);
  });
}

type SoundCheckProps = {
  // Shown above the first button, e.g. the welcome text.
  children?: ReactNode;
  startLabel?: string;
  // Runs inside the first click, for things browsers only allow from a click.
  onStart?: () => void;
  onHeard: () => void;
};

function SoundCheck({
  children,
  startLabel = "Start sound check",
  onStart,
  onHeard,
}: SoundCheckProps) {
  const [player, setPlayer] = useState(() => createAudioPlayer("sound-check", [line]));
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [clipPlayed, setClipPlayed] = useState(false);

  async function playClip(current = player) {
    setStarted(true);
    setFailed(false);
    setPlaying(true);
    try {
      await readyInTime(current);
      await current.play(line.id);
      setClipPlayed(true);
    } catch {
      setFailed(true);
    } finally {
      setPlaying(false);
    }
  }

  // A player remembers a failed download, so another try needs a new one.
  function tryAgain() {
    const fresh = createAudioPlayer("sound-check", [line]);
    setPlayer(fresh);
    playClip(fresh);
  }

  function start() {
    onStart?.();
    playClip();
  }

  // Ignored while the clip plays. The button stays focusable, so a keyboard user keeps their place.
  function playAgain() {
    if (playing) return;
    playClip();
  }

  if (failed) return <TryAgainScreen onTryAgain={tryAgain} />;

  if (!started) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        {children}
        <button type="button" onClick={start} className={buttonClass}>
          {startLabel}
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
        <button
          type="button"
          disabled={playing || !clipPlayed}
          onClick={onHeard}
          className={buttonClass}
        >
          Yes, I can hear it
        </button>
        <button type="button" aria-disabled={playing} onClick={playAgain} className={buttonClass}>
          Play it again
        </button>
      </div>
    </main>
  );
}

export default SoundCheck;
