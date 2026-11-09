// Placeholder until the test is built: click through all four pages. Each page's instructions
// play first, with their arrows (SPEC: Voice and arrows). Correct clicks draw lines; wrong clicks
// get the full error response (SPEC: Errors). A finished page moves on by itself after a short pause.
// Shows a message instead if the screen is too small.

import { useEffect, useReducer, useRef, useState } from "react";
import { createAudioPlayer } from "../../shared/audio-player";
import { realClock } from "../../shared/clock";
import { runScript } from "../../shared/run-script";
import { checkScript, type ActionLine, type SpokenLine } from "../../shared/test-script";
import { findCircleAt } from "./find-circle";
import { judgeClick } from "./judge-click";
import { expectedOrder } from "./order";
import { nextFlow, pages, startFlow } from "./page-flow";
import { pageLayouts, type Point } from "./page-layouts";
import { isScreenLargeEnough } from "./screen-check";
import script from "./script.json";
import TrailPage, { type WrongLine } from "./TrailPage";

const arrowHoldMs = 1500;
const pagePauseMs = 1500;
const sections = checkScript(script).sections;
const errorLines = sections.error;
const spokenLines = Object.values(sections)
  .flat()
  .filter((line): line is SpokenLine => line.type === "spoken");

// In this test's script.json, an arrow line also names the circle it points to.
type ArrowLine = ActionLine & { target: string };

function checkScreen() {
  return isScreenLargeEnough(window.innerWidth, window.innerHeight);
}

function TrailMaking() {
  const [player] = useState(() => createAudioPlayer("trail-making", spokenLines));
  const [screenOk, setScreenOk] = useState(checkScreen);
  const [{ pageIndex, phase }, dispatchFlow] = useReducer(nextFlow, startFlow);
  const [connected, setConnected] = useState<readonly string[]>([]);
  const [wrongLines, setWrongLines] = useState<readonly WrongLine[]>([]);
  const [arrowOn, setArrowOn] = useState<string | null>(null);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const correcting = useRef(false);
  const timerStartedAt = useRef<number | null>(null);

  const layout = pageLayouts[pages[pageIndex]];
  const order = expectedOrder[pages[pageIndex]];

  useEffect(() => {
    if (screenOk) {
      return;
    }

    function recheck() {
      setScreenOk(checkScreen());
    }

    window.addEventListener("resize", recheck);
    return () => window.removeEventListener("resize", recheck);
  }, [screenOk]);

  // Reads this page's instructions. Waits for a big enough screen, because the arrows are part
  // of them. If the screen gets too small partway, the voice stops and they start again.
  useEffect(() => {
    if (!screenOk || phase !== "instructions") {
      return;
    }

    const lines = sections[pages[pageIndex]];
    let cancelled = false;
    let holdTimer: number | undefined;

    function enableClicks() {
      setArrowOn(null);
      dispatchFlow("clicksEnabled");
    }

    function handleAction(line: ActionLine) {
      if (line.action === "arrow") {
        setArrowOn((line as ArrowLine).target);
      }

      if (line.action === "startTimer") {
        timerStartedAt.current = realClock.now();

        // Temporary, for the 5.7 check. Remove at 5.9, when the timer is used.
        if (import.meta.env.DEV) {
          console.info("Timer started", timerStartedAt.current);
        }
      }

      if (line.action === "enableClicks") {
        const previous = lines[lines.indexOf(line) - 1];

        // With no speech after it, an arrow would vanish the moment it appeared.
        if (previous.type === "action" && previous.action === "arrow") {
          holdTimer = window.setTimeout(enableClicks, arrowHoldMs);
        } else {
          enableClicks();
        }
      }
    }

    async function readInstructions() {
      await player.ready;

      if (!cancelled) {
        setArrowOn(null);
        await runScript(lines, player, handleAction);
      }
    }

    readInstructions();

    return () => {
      cancelled = true;
      window.clearTimeout(holdTimer);
      player.stop();
    };
  }, [player, pageIndex, screenOk, phase]);

  // Leaves a finished page on screen for a moment, then clears it and moves to the next one.
  useEffect(() => {
    if (phase !== "finished") {
      return;
    }

    const pauseTimer = window.setTimeout(() => {
      setConnected([]);
      setWrongLines([]);
      setArrowOn(null);
      setLastWrong(null);
      dispatchFlow("pauseOver");
    }, pagePauseMs);

    return () => window.clearTimeout(pauseTimer);
  }, [phase]);

  // Plays the script's error section. A correct click stops the voice, which ends this early.
  async function speakCorrection(arrowTarget: string) {
    correcting.current = true;

    await runScript(errorLines, player, (line) => {
      if (line.action === "arrow") {
        setArrowOn(arrowTarget);
      }
    });

    correcting.current = false;
  }

  function handlePress({ x, y }: Point) {
    if (phase !== "practice" && phase !== "test") {
      return;
    }

    const circle = findCircleAt(layout.circles, x, y);

    if (circle === null) {
      return;
    }

    const outcome = judgeClick(order, connected.length, circle, lastWrong);
    const lastCorrect = connected.at(-1);

    if (outcome === "correct") {
      player.stop();
      setArrowOn(null);
      setLastWrong(null);
      const nowConnected = [...connected, circle];
      setConnected(nowConnected);

      if (nowConnected.length === order.length) {
        dispatchFlow("pageCompleted");
      }
    }

    if (outcome === "error") {
      setLastWrong(circle);

      if (lastCorrect !== undefined) {
        setWrongLines([...wrongLines, { from: lastCorrect, to: circle }]);
      }

      if (!correcting.current) {
        speakCorrection(lastCorrect ?? order[0]);
      }
    }
  }

  if (!screenOk) {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-4xl font-bold">This screen is too small for the test.</h1>
        <p>Please tell your clinician.</p>
      </main>
    );
  }

  return (
    <TrailPage layout={layout} connected={connected} wrongLines={wrongLines} arrowOn={arrowOn} onPress={handlePress} />
  );
}

export default TrailMaking;
