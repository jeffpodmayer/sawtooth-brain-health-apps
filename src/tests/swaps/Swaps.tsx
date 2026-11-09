// Runs SWAPS: the introduction and demo, practice, the test, then recall (SPEC: Flow).

import { useEffect, useRef, useState } from "react";
import { createAudioPlayer } from "../../shared/audio-player";
import { realClock } from "../../shared/clock";
import { runScript } from "../../shared/run-script";
import { checkScript, type ActionLine, type SpokenLine } from "../../shared/test-script";
import { recallOrder } from "./form-a";
import NumberPad from "./NumberPad";
import { isRightNumber } from "./practice";
import RecallPage from "./RecallPage";
import { scoreGrid, type LoggedAnswer } from "./score-grid";
import { scoreRecall, type LoggedRecallAnswer } from "./score-recall";
import script from "./script.json";
import { applyScriptAction, splitAfterFinalArrow, startView, type ScriptView } from "./script-view";
import { canSelect, nextEmpty, nextEmptyAfter } from "./selection";
import SwapsPage from "./SwapsPage";
import { timeLimitMs } from "./time-limits";
import { isOnScreen, topRowFor } from "./visible-rows";

const stepPauseMs = 1500;
const arrowHoldMs = 1500;
const wrongShowMs = 500;
const practicePart = { first: 4, last: 6 };
const testPart = { first: 7, last: 81 };
const recallPart = { first: 1, last: 7 };
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
  const [stage, setStage] = useState<"practice" | "test" | "recall" | "ended">("practice");
  const timerStartedAt = useRef<number | null>(null);
  const answerLog = useRef<LoggedAnswer[]>([]);
  const [recallView, setRecallView] = useState<ScriptView | null>(null);
  const recallStartedAt = useRef<number | null>(null);
  const recallLog = useRef<LoggedRecallAnswer[]>([]);
  const topRow = topRowFor(nextEmpty(testPart, view.answers) ?? testPart.last);

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

  // After practice: the test instructions, ending with the pad on and item 7 selected.
  useEffect(() => {
    if (stage !== "test") {
      return;
    }

    let pauseTimer: number | undefined;
    let limitTimer: number | undefined;

    function timeUp() {
      setView((current) => ({ ...current, selected: null, inputOn: false }));
      setStage("recall");
    }

    function pause(ms: number) {
      return new Promise<void>((resolve) => {
        pauseTimer = window.setTimeout(resolve, ms);
      });
    }

    async function handleAction(line: ActionLine) {
      setView((current) => applyScriptAction(current, line));

      if (line.action === "pause") {
        await pause((line as ActionLine & { ms: number }).ms);
      }

      if (line.action === "startTimer") {
        timerStartedAt.current = realClock.now();
        limitTimer = window.setTimeout(timeUp, timeLimitMs.test);
      }
    }

    async function readInstructions() {
      await pause(stepPauseMs);
      await runScript(sections.test, player, handleAction);
    }

    readInstructions();

    return () => {
      window.clearTimeout(pauseTimer);
      window.clearTimeout(limitTimer);
      player.stop();
    };
  }, [player, stage]);

  // After the test: a short pause, then the recall screen, its instruction and its full 60 seconds.
  useEffect(() => {
    if (stage !== "recall") {
      return;
    }

    let pauseTimer: number | undefined;
    let limitTimer: number | undefined;

    function timeUp() {
      setRecallView((current) => current && { ...current, selected: null, inputOn: false });
      setStage("ended");
    }

    function pause(ms: number) {
      return new Promise<void>((resolve) => {
        pauseTimer = window.setTimeout(resolve, ms);
      });
    }

    function handleAction(line: ActionLine) {
      setRecallView((current) => current && applyScriptAction(current, line));

      if (line.action === "startTimer") {
        recallStartedAt.current = realClock.now();
        limitTimer = window.setTimeout(timeUp, timeLimitMs.recall);
      }
    }

    async function readInstructions() {
      await pause(stepPauseMs);
      setRecallView(startView);
      await runScript(sections.recall, player, handleAction);
    }

    readInstructions();

    return () => {
      window.clearTimeout(pauseTimer);
      window.clearTimeout(limitTimer);
      player.stop();
    };
  }, [player, stage]);

  // For checking 6.7 and 6.8 by hand. Goes at 6.9, when the scores go into the result.
  useEffect(() => {
    if (stage === "recall" && timerStartedAt.current !== null) {
      console.info("SWAPS test ended", {
        padOffAtMs: realClock.now() - timerStartedAt.current,
        score: scoreGrid(answerLog.current, null),
      });
    }

    if (stage === "ended" && recallStartedAt.current !== null) {
      console.info("SWAPS recall ended", {
        padOffAtMs: realClock.now() - recallStartedAt.current,
        score: scoreRecall(recallLog.current, null),
      });
    }
  }, [stage]);

  function handleTestPick(item: number, number: number) {
    if (timerStartedAt.current === null) {
      return;
    }

    answerLog.current.push({ timeMs: realClock.now() - timerStartedAt.current, item, number });

    const answers = new Map(view.answers).set(item, number);
    const selected = nextEmpty(testPart, answers);

    setView({ ...view, answers, selected, inputOn: selected !== null });

    if (selected === null) {
      setStage("recall");
    }
  }

  function handleRecallPick(place: number, number: number) {
    if (recallView === null || recallStartedAt.current === null) {
      return;
    }

    recallLog.current.push({ timeMs: realClock.now() - recallStartedAt.current, symbol: recallOrder[place - 1], number });

    const answers = new Map(recallView.answers).set(place, number);

    setRecallView({ ...recallView, answers, selected: nextEmptyAfter(recallPart, answers, place) ?? place });
  }

  function handleSymbolPress(place: number) {
    if (recallView?.inputOn) {
      setRecallView({ ...recallView, selected: place });
    }
  }

  function handlePick(number: number) {
    if (recallView !== null) {
      if (recallView.selected !== null) {
        handleRecallPick(recallView.selected, number);
      }

      return;
    }

    if (view.selected === null) {
      return;
    }

    if (stage === "test") {
      handleTestPick(view.selected, number);
      return;
    }

    const answers = new Map(view.answers).set(view.selected, number);

    if (isRightNumber(view.selected, number)) {
      const selected = nextEmpty(practicePart, answers);

      setView({ ...view, answers, selected, inputOn: selected !== null });

      if (selected === null) {
        setStage("test");
      }
    } else {
      setView({ ...view, answers, inputOn: false });
      setWrongAnswers((count) => count + 1);
    }
  }

  function handleItemPress(item: number) {
    const part = stage === "test" ? testPart : practicePart;

    if (view.inputOn && canSelect(part, view.answers, item) && isOnScreen(item, topRow)) {
      setView({ ...view, selected: item });
    }
  }

  return (
    <div className="flex h-screen flex-col pb-6">
      {recallView === null ? (
        <SwapsPage answers={view.answers} selected={view.highlighted ?? view.selected} topRow={topRow} arrowOn={view.arrowOn} onItemPress={handleItemPress} />
      ) : (
        <RecallPage answers={recallView.answers} selected={recallView.selected} allHighlighted={recallView.allHighlighted} onSymbolPress={handleSymbolPress} />
      )}
      <NumberPad disabled={!(recallView ?? view).inputOn} onPick={handlePick} />
    </div>
  );
}

export default Swaps;
