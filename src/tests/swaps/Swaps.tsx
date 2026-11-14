// Runs SWAPS: the introduction and demo, practice, the test, then recall (SPEC: Flow).
// Each of the three waits at a hold until the clinician's Continue (ADR-050). The finished practice
// stays on screen at the hold before the test; the hold before recall, right after the timed test,
// shows the break screen.

import { useEffect, useRef, useState } from "react";
import { withAudioLog } from "../../shared/audio-log";
import BreakScreen from "../../shared/BreakScreen";
import { createAudioPlayer, readyInTime } from "../../shared/audio-player";
import { browserFrom } from "../../shared/browser-info";
import { elapsedClock, realClock } from "../../shared/clock";
import { recordFocus, type FocusLogEntry } from "../../shared/focus-log";
import { runScript } from "../../shared/run-script";
import type { TestProps } from "../../shared/test-module";
import { checkScript, type ActionLine, type SpokenLine } from "../../shared/test-script";
import { buildSheet } from "./sheet/build-sheet";
import { recallOrder } from "./scoring/form-a";
import { pageSize, visibleArea } from "./screen/form-layout";
import NumberPad from "./screen/NumberPad";
import { isRightNumber } from "./screen/practice";
import RecallPage from "./screen/RecallPage";
import { replayGrid, type LoggedAnswer } from "./scoring/score-grid";
import { replayRecall, type LoggedRecallAnswer } from "./scoring/score-recall";
import { scoreSwaps, type StopPoint } from "./scoring/score-swaps";
import script from "./script.json";
import { applyScriptAction, splitAfterFinalArrow, startView, type ScriptView } from "./screen/script-view";
import { canSelect, nextEmpty, nextEmptyAfter } from "./screen/selection";
import SwapsPage from "./screen/SwapsPage";
import { testId, testVersion } from "./test-info";
import { timeLimitMs } from "./scoring/time-limits";
import { isOnScreen, topRowFor } from "./screen/visible-rows";

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

type ScreenNote = { width: number; height: number; scale: number };

// The hold before each stage is its number in the test's holds list (test-info.ts):
// Introduction, Test, Recall.
const holdBefore = { practice: 1, test: 2, recall: 3 } as const;

// The window's size, and how big the form is drawn in it: pixels per form unit.
function measureScreen(page: HTMLElement | null): ScreenNote | undefined {
  const drawn = page?.querySelector("svg")?.getBoundingClientRect();

  if (!drawn) {
    return undefined;
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scale: Math.min(drawn.width / pageSize.width, drawn.height / visibleArea.height),
  };
}

function Swaps({
  sequenceId,
  stopRequested,
  holdsReleased,
  onHoldReached,
  onTimedPartStarted,
  onTimedPartEnded,
  onComplete,
  onLoadFailed,
}: TestProps) {
  const [startedAt] = useState(() => new Date().toISOString());
  const handedOver = useRef(false);
  const [testClock] = useState(() => elapsedClock(realClock));
  const [player] = useState(() => withAudioLog(createAudioPlayer("swaps", spokenLines), testClock));
  const pageRef = useRef<HTMLDivElement>(null);
  const screens = useRef<Partial<Record<"test" | "recall", ScreenNote>>>({});
  const focusLog = useRef<FocusLogEntry[]>([]);
  const [view, setView] = useState(startView);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [stage, setStage] = useState<"practice" | "test" | "recall" | "ended">("practice");

  // The stage waits at its hold until Continue releases it.
  const hold = stage === "ended" ? null : holdBefore[stage];
  const holding = hold !== null && holdsReleased < hold;

  // A clinician's stop ends the test wherever it is. The effects read this, so a stop clears
  // their timers and silences the voice. stage itself still says where the test was.
  const activeStage = stopRequested ? "ended" : holding ? "holding" : stage;

  // The timed part whose clock started, while its stage is still running.
  const [clockStarted, setClockStarted] = useState<"test" | "recall" | null>(null);
  const timedPart = clockStarted !== null && activeStage === clockStarted ? clockStarted : null;
  const timerStartedAt = useRef<number | null>(null);
  const answerLog = useRef<LoggedAnswer[]>([]);
  const [recallView, setRecallView] = useState<ScriptView | null>(null);
  const recallStartedAt = useRef<number | null>(null);
  const recallLog = useRef<LoggedRecallAnswer[]>([]);
  const topRow = topRowFor(nextEmpty(testPart, view.answers) ?? testPart.last);

  // A wrong practice answer stays on screen for a moment, then the feedback plays.
  useEffect(() => {
    if (wrongAnswers === 0 || activeStage !== "practice") {
      return;
    }

    const showTimer = window.setTimeout(() => {
      runScript(sections.practiceFeedback, player, (line) => setView((current) => applyScriptAction(current, line)));
    }, wrongShowMs);

    return () => {
      window.clearTimeout(showTimer);
      player.stop();
    };
  }, [player, activeStage, wrongAnswers]);

  useEffect(() => {
    if (activeStage !== "practice") {
      return;
    }

    let cancelled = false;
    let pauseTimer: number | undefined;

    function pause(ms: number) {
      return new Promise<void>((resolve) => {
        pauseTimer = window.setTimeout(resolve, ms);
      });
    }

    // A pause holds the next line; every other action changes what's on screen.
    function applyAction(line: ActionLine) {
      if (line.action === "pause") return pause((line as ActionLine & { ms: number }).ms);

      setView((current) => applyScriptAction(current, line));
    }

    async function play() {
      try {
        await readyInTime(player);
      } catch {
        if (!cancelled) onLoadFailed();
        return;
      }

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
  }, [player, activeStage, onLoadFailed]);

  // After practice: the test instructions, ending with the pad on and item 7 selected.
  useEffect(() => {
    if (activeStage !== "test") {
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
        setClockStarted("test");
        screens.current.test = measureScreen(pageRef.current);
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
  }, [player, activeStage]);

  // After the test: a short pause, then the recall screen, its instruction and its full 60 seconds.
  useEffect(() => {
    if (activeStage !== "recall") {
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
        setClockStarted("recall");
        screens.current.recall = measureScreen(pageRef.current);
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
  }, [player, activeStage]);

  useEffect(() => recordFocus(testClock, focusLog.current), [testClock]);

  // Tells the shared layer about each hold, so the dashboard can show Continue.
  useEffect(() => {
    if (hold !== null) {
      onHoldReached(hold);
    }
  }, [hold, onHoldReached]);

  // Tells the shared layer when a timed part's clock starts and stops, for the dashboard's counter.
  // The stage ending, a stop or the end of the test ends it, since timedPart goes back to null.
  useEffect(() => {
    if (timedPart === null) {
      return;
    }

    onTimedPartStarted(timedPart);
    return () => onTimedPartEnded(timedPart);
  }, [timedPart, onTimedPartStarted, onTimedPartEnded]);

  // Hands the result to the shared layer. The ref keeps it to once, even if the parent redraws.
  // If stage never reached "ended" itself, a clinician's stop ended the test, and stage says where
  // (a stop at a hold says the stage it was waiting for, with no time).
  useEffect(() => {
    if (activeStage !== "ended" || handedOver.current) {
      return;
    }

    handedOver.current = true;

    let stop: StopPoint | null = null;

    if (stage !== "ended") {
      const clockStartedAt = { practice: null, test: timerStartedAt.current, recall: recallStartedAt.current }[stage];

      stop = { stage, stoppedAtMs: clockStartedAt === null ? null : realClock.now() - clockStartedAt };
    }

    const answers = { test: answerLog.current, recall: recallLog.current };
    const { history } = replayGrid(answers.test, stop?.stage === "test" ? stop.stoppedAtMs : null);
    const { finalAnswers } = replayRecall(answers.recall, stop?.stage === "recall" ? stop.stoppedAtMs : null);

    onComplete({
      testId,
      testVersion,
      sequenceId,
      startedAt,
      completedAt: new Date().toISOString(),
      scores: scoreSwaps(answers, wrongAnswers, stop),
      rawData: {
        answers,
        stop,
        finalAnswers: {
          test: Object.fromEntries([...history].map(([item, numbers]) => [item, numbers.at(-1)])),
          recall: Object.fromEntries(finalAnswers),
        },
        audio: player.log,
        screen: screens.current,
        browser: browserFrom(navigator.userAgent),
        focus: [...focusLog.current],
      },
      sheets: { sheet: buildSheet({ shown: view.answers, history, recall: finalAnswers }) },
    });
  }, [activeStage, stage, onComplete, player, sequenceId, startedAt, view.answers, wrongAnswers]);

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

  if (activeStage === "holding" && stage === "recall") {
    return <BreakScreen />;
  }

  return (
    <div ref={pageRef} className="flex h-screen flex-col pb-6">
      {recallView === null ? (
        <SwapsPage answers={view.answers} selected={view.highlighted ?? view.selected} keyHighlighted={view.allHighlighted} topRow={topRow} arrowOn={view.arrowOn} onItemPress={handleItemPress} />
      ) : (
        <RecallPage answers={recallView.answers} selected={recallView.selected} allHighlighted={recallView.allHighlighted} onSymbolPress={handleSymbolPress} />
      )}
      <NumberPad disabled={activeStage === "ended" || !(recallView ?? view).inputOn} onPick={handlePick} />
    </div>
  );
}

export default Swaps;
