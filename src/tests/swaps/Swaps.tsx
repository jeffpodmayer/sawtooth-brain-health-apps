// Runs SWAPS: the introduction and demo, then practice (SPEC: Flow).

import { useEffect, useState } from "react";
import { createAudioPlayer } from "../../shared/audio-player";
import { runScript } from "../../shared/run-script";
import { checkScript, type ActionLine, type SpokenLine } from "../../shared/test-script";
import NumberPad from "./NumberPad";
import { isRightNumber } from "./practice";
import script from "./script.json";
import { applyScriptAction, splitAfterFinalArrow, startView } from "./script-view";
import { canSelect, nextEmpty } from "./selection";
import SwapsPage from "./SwapsPage";

const stepPauseMs = 1500;
const arrowHoldMs = 1500;
const wrongShowMs = 500;
const practicePart = { first: 4, last: 6 };
const sections = checkScript(script).sections;
const demoLines = [...sections.intro, ...sections.demo];
const [practiceLines, practiceAfterHold] = splitAfterFinalArrow(sections.practice);
const spokenLines = Object.values(sections)
  .flat()
  .filter((line): line is SpokenLine => line.type === "spoken");

function Swaps() {
  const [player] = useState(() => createAudioPlayer("swaps", spokenLines));
  const [view, setView] = useState(startView);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  // A wrong practice answer stays on screen for a moment, then the feedback plays.
  useEffect(() => {
    if (wrongAnswers === 0) {
      return;
    }

    const showTimer = window.setTimeout(() => {
      runScript(sections.practiceFeedback, player, (line) => setView((current) => applyScriptAction(current, line)));
    }, wrongShowMs);

    return () => {
      window.clearTimeout(showTimer);
      player.stop();
    };
  }, [player, wrongAnswers]);

  useEffect(() => {
    let cancelled = false;
    let pauseTimer: number | undefined;

    function pause(ms: number) {
      return new Promise<void>((resolve) => {
        pauseTimer = window.setTimeout(resolve, ms);
      });
    }

    function applyAction(line: ActionLine) {
      setView((current) => applyScriptAction(current, line));
    }

    async function play() {
      await player.ready;

      if (cancelled || !(await runScript(demoLines, player, applyAction))) {
        return;
      }

      await pause(stepPauseMs);

      if (cancelled || !(await runScript(practiceLines, player, applyAction))) {
        return;
      }

      await pause(arrowHoldMs);

      if (!cancelled) {
        practiceAfterHold.forEach((line) => applyAction(line as ActionLine));
      }
    }

    play();

    return () => {
      cancelled = true;
      window.clearTimeout(pauseTimer);
      player.stop();
    };
  }, [player]);

  function handlePick(number: number) {
    if (view.selected === null) {
      return;
    }

    const answers = new Map(view.answers).set(view.selected, number);

    if (isRightNumber(view.selected, number)) {
      const selected = nextEmpty(practicePart, answers);

      setView({ ...view, answers, selected, inputOn: selected !== null });
    } else {
      setView({ ...view, answers, inputOn: false });
      setWrongAnswers((count) => count + 1);
    }
  }

  function handleItemPress(item: number) {
    if (view.inputOn && canSelect(practicePart, view.answers, item)) {
      setView({ ...view, selected: item });
    }
  }

  return (
    <div className="flex h-screen flex-col pb-6">
      <SwapsPage answers={view.answers} selected={view.highlighted ?? view.selected} arrowOn={view.arrowOn} onItemPress={handleItemPress} />
      <NumberPad disabled={!view.inputOn} onPick={handlePick} />
    </div>
  );
}

export default Swaps;
