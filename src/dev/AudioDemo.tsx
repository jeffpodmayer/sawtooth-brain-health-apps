import { useState } from "react";
import { createAudioPlayer } from "../shared/audio-player";
import { checkScript, type SpokenLine } from "../shared/test-script";
import script from "../tests/trail-making/script.json";
import SoundCheck from "../client/sound-check/SoundCheck";

const lineIds = ["sa-01", "sa-02", "sa-03"];
const lines = Object.values(checkScript(script).sections)
  .flat()
  .filter((line): line is SpokenLine => lineIds.includes(line.id));
const player = createAudioPlayer("trail-making", lines);

function AudioDemo() {
  const [current, setCurrent] = useState<string | null>(null);
  const [heard, setHeard] = useState(false);

  async function playAll() {
    await player.ready;
    for (const lineId of lineIds) {
      setCurrent(lineId);
      await player.play(lineId);
    }
    setCurrent(null);
  }

  if (!heard) return <SoundCheck onHeard={() => setHeard(true)} />;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-5xl font-bold">Audio demo</h1>
      <p className="mt-4">{current ? `Playing ${current}` : "Not playing"}</p>
      <button
        type="button"
        disabled={current !== null}
        onClick={playAll}
        className="mt-8 h-14 rounded-lg bg-accent px-8 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50"
      >
        Play three clips
      </button>
    </main>
  );
}

export default AudioDemo;
