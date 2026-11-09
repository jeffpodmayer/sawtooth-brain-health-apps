// Placeholder until the test is built: click through all four pages, drawing a line for each
// correct circle. Wrong clicks do nothing yet (roadmap 5.6). The next press after a finished
// page moves on. Shows a message instead if the screen is too small.

import { useEffect, useState } from "react";
import { findCircleAt } from "./find-circle";
import { judgeClick } from "./judge-click";
import { expectedOrder } from "./order";
import { pageLayouts, type Point } from "./page-layouts";
import { isScreenLargeEnough } from "./screen-check";
import TrailPage from "./TrailPage";

const pages = ["sampleA", "partA", "sampleB", "partB"] as const;

function checkScreen() {
  return isScreenLargeEnough(window.innerWidth, window.innerHeight);
}

function TrailMaking() {
  const [screenOk, setScreenOk] = useState(checkScreen);
  const [pageIndex, setPageIndex] = useState(0);
  const [connected, setConnected] = useState<readonly string[]>([]);

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

  function handlePress({ x, y }: Point) {
    if (connected.length === order.length) {
      setPageIndex((pageIndex + 1) % pages.length);
      setConnected([]);
      return;
    }

    const circle = findCircleAt(layout.circles, x, y);

    if (circle !== null && judgeClick(order, connected.length, circle) === "correct") {
      setConnected([...connected, circle]);
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

  return <TrailPage layout={layout} connected={connected} onPress={handlePress} />;
}

export default TrailMaking;
