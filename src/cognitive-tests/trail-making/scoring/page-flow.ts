// Which page the test is on and what stage that page is at. Pure: same inputs, same answer.
// Each page starts "waiting": the hold before it, until the clinician's Continue (ADR-050).

export const pages = ["sampleA", "partA", "sampleB", "partB"] as const;

export type Flow = {
  pageIndex: number;
  phase: "waiting" | "instructions" | "practice" | "test" | "finished" | "done";
};

export type FlowEvent = "released" | "clicksEnabled" | "pageCompleted" | "timeUp" | "pauseOver" | "stopped" | "skipped";

export const startFlow: Flow = { pageIndex: 0, phase: "waiting" };

// Where Skip Part A applies (ADR-055): Sample A once it has started, the wait before Part A, Part A's
// instructions and Part A itself.
export function canSkipPartA({ pageIndex, phase }: Flow): boolean {
  const inSampleA = pageIndex === 0 && phase !== "waiting" && phase !== "done";
  const inPartA = pageIndex === 1 && (phase === "waiting" || phase === "instructions" || phase === "test");
  return inSampleA || inPartA;
}

export function nextFlow(flow: Flow, event: FlowEvent): Flow {
  const { pageIndex, phase } = flow;

  if (event === "stopped") {
    return { pageIndex, phase: "done" };
  }

  // Skip Part A (ADR-055): from Sample A once it has started until Part A finishes, to the wait before
  // Sample B. Before Sample A starts, or once Part A is finished, it changes nothing.
  if (event === "skipped") {
    return canSkipPartA(flow) ? { pageIndex: 2, phase: "waiting" } : flow;
  }

  if (event === "released" && phase === "waiting") {
    return { pageIndex, phase: "instructions" };
  }

  if (event === "clicksEnabled" && phase === "instructions") {
    return { pageIndex, phase: pages[pageIndex].startsWith("sample") ? "practice" : "test" };
  }

  if (event === "pageCompleted" && (phase === "practice" || phase === "test")) {
    return { pageIndex, phase: "finished" };
  }

  if (event === "timeUp" && phase === "test") {
    return { pageIndex, phase: "finished" };
  }

  if (event === "pauseOver" && phase === "finished") {
    return pageIndex === pages.length - 1
      ? { pageIndex, phase: "done" }
      : { pageIndex: pageIndex + 1, phase: "waiting" };
  }

  return flow;
}
