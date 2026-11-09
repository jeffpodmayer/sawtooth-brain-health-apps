// Placeholder until the test is built: shows Sample A, or a message if the screen is too small.

import { useEffect, useState } from "react";
import { pageLayouts } from "./page-layouts";
import { isScreenLargeEnough } from "./screen-check";
import TrailPage from "./TrailPage";

function checkScreen() {
  return isScreenLargeEnough(window.innerWidth, window.innerHeight);
}

function TrailMaking() {
  const [screenOk, setScreenOk] = useState(checkScreen);

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

  if (!screenOk) {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-4xl font-bold">This screen is too small for the test.</h1>
        <p>Please tell your clinician.</p>
      </main>
    );
  }

  return <TrailPage layout={pageLayouts.sampleA} />;
}

export default TrailMaking;
