// The client's first sound (ADR-006). The Start click unlocks audio in the browser.

import { useState, type ReactNode } from "react";
import { createAudioPlayer, readyInTime } from "../../shared/audio-player";
import ClientScreen from "../../shared/ClientScreen";
import type { SpokenLine } from "../../shared/test-script";
import TryAgainScreen from "../../shared/TryAgainScreen";
import script from "./script.json";

const line = script.sections.check[0] as SpokenLine;
const buttonClass =
  "h-14 rounded-lg bg-accent px-8 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50 aria-disabled:opacity-50";

// Moves keyboard and screen reader users to the question when it appears.
const focusOnShow = (element: HTMLElement | null) => element?.focus();

// A computer's sound output can take a moment to wake up, which clipped the first word.
const WAKE_PAUSE_MS = 500;

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

  async function start() {
    onStart?.();
    setStarted(true);
    setPlaying(true);
    await new Promise((resolve) => setTimeout(resolve, WAKE_PAUSE_MS));
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
      <ClientScreen>
        {children}
        <button type="button" onClick={start} className={buttonClass}>
          {startLabel}
        </button>
      </ClientScreen>
    );
  }

  return (
    <ClientScreen>
      <h1 ref={focusOnShow} tabIndex={-1} className="text-5xl font-bold outline-none">
        {line.text}
      </h1>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
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
    </ClientScreen>
  );
}

export default SoundCheck;
