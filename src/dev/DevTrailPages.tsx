// Development only (roadmap 5.3): click anywhere to step through the four Trail Making pages.
// The first click also goes full screen. Press Esc to leave.

import { useState } from "react";
import screenfull from "screenfull";
import { pageLayouts } from "../tests/trail-making/page-layouts";
import TrailPage from "../tests/trail-making/TrailPage";

const pages = [pageLayouts.sampleA, pageLayouts.partA, pageLayouts.sampleB, pageLayouts.partB];

function DevTrailPages() {
  const [index, setIndex] = useState(0);

  function handleClick() {
    if (screenfull.isEnabled && !screenfull.isFullscreen) {
      screenfull.request();
    }
    setIndex((index + 1) % pages.length);
  }

  return (
    <div onClick={handleClick}>
      <TrailPage layout={pages[index]} />
    </div>
  );
}

export default DevTrailPages;
