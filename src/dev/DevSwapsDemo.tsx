// Development only (roadmap 6.5): plays the SWAPS introduction and demo, to check by hand.
// The sound check comes first, because browsers block sound until a click.

import { useEffect, useState } from "react";
import SoundCheck from "../client/sound-check/SoundCheck";
import { createAudioPlayer } from "../shared/audio-player";
import { runScript } from "../shared/run-script";
import { checkScript, type SpokenLine } from "../shared/test-script";
import { applyDemoAction, startDemoView } from "../tests/swaps/demo-view";
import NumberPad from "../tests/swaps/NumberPad";
import script from "../tests/swaps/script.json";
import SwapsPage from "../tests/swaps/SwapsPage";

const { intro, demo } = checkScript(script).sections;
const lines = [...intro, ...demo];
const spokenLines = lines.filter((line): line is SpokenLine => line.type === "spoken");

function DemoRun() {
  const [player] = useState(() => createAudioPlayer("swaps", spokenLines));
  const [view, setView] = useState(startDemoView);

  useEffect(() => {
    let cancelled = false;

    async function play() {
      await player.ready;

      if (!cancelled) {
        await runScript(lines, player, (line) => setView((current) => applyDemoAction(current, line)));
      }
    }

    play();

    return () => {
      cancelled = true;
      player.stop();
    };
  }, [player]);

  return (
    <div className="flex h-screen flex-col pb-6">
      <SwapsPage answers={view.answers} selected={view.highlighted} arrowOn={view.arrowOn} />
      <NumberPad disabled onPick={() => {}} />
    </div>
  );
}

function DevSwapsDemo() {
  const [heard, setHeard] = useState(false);

  return heard ? <DemoRun /> : <SoundCheck onHeard={() => setHeard(true)} />;
}

export default DevSwapsDemo;
