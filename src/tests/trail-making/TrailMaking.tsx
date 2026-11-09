// Placeholder until the test is built: click through all four pages. Correct clicks draw lines;
// wrong clicks get the full error response (SPEC: Errors). The next press after a finished
// page moves on. Shows a message instead if the screen is too small.

import { useEffect, useRef, useState } from "react";
import { createAudioPlayer } from "../../shared/audio-player";
import { checkScript, type SpokenLine } from "../../shared/test-script";
import { findCircleAt } from "./find-circle";
import { judgeClick } from "./judge-click";
import { expectedOrder } from "./order";
import { pageLayouts, type Point } from "./page-layouts";
import { isScreenLargeEnough } from "./screen-check";
import script from "./script.json";
import TrailPage, { type WrongLine } from "./TrailPage";

const pages = ["sampleA", "partA", "sampleB", "partB"] as const;
const errorLines = checkScript(script).sections.error;
const spokenErrorLines = errorLines.filter((line): line is SpokenLine => line.type === "spoken");

function checkScreen() {
  return isScreenLargeEnough(window.innerWidth, window.innerHeight);
}

function TrailMaking() {
  const [player] = useState(() => createAudioPlayer("trail-making", spokenErrorLines));
  const [screenOk, setScreenOk] = useState(checkScreen);
  const [pageIndex, setPageIndex] = useState(0);
  const [connected, setConnected] = useState<readonly string[]>([]);
  const [wrongLines, setWrongLines] = useState<readonly WrongLine[]>([]);
  const [arrowOn, setArrowOn] = useState<string | null>(null);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const correcting = useRef(false);

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

  // Plays the script's error section. A correct click stops the voice, which ends this early.
  async function speakCorrection(arrowTarget: string) {
    correcting.current = true;

    for (const line of errorLines) {
      if (line.type === "spoken" && !(await player.play(line.id))) {
        break;
      }

      if (line.type === "action" && line.action === "arrow") {
        setArrowOn(arrowTarget);
      }
    }

    correcting.current = false;
  }

  function handlePress({ x, y }: Point) {
    if (connected.length === order.length) {
      setPageIndex((pageIndex + 1) % pages.length);
      setConnected([]);
      setWrongLines([]);
      setArrowOn(null);
      setLastWrong(null);
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
      setConnected([...connected, circle]);
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
