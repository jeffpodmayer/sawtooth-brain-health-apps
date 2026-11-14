// Which page the test is on and what stage that page is at. Pure: same inputs, same answer.
// Each page starts "waiting": the hold before it, until the clinician's Continue (ADR-050).

export const pages = ["sampleA", "partA", "sampleB", "partB"] as const;

export type Flow = {
  pageIndex: number;
  phase: "waiting" | "instructions" | "practice" | "test" | "finished" | "done";
};

export type FlowEvent = "released" | "clicksEnabled" | "pageCompleted" | "timeUp" | "pauseOver" | "stopped";

export const startFlow: Flow = { pageIndex: 0, phase: "waiting" };

export function nextFlow(flow: Flow, event: FlowEvent): Flow {
  const { pageIndex, phase } = flow;

  if (event === "stopped") {
    return { pageIndex, phase: "done" };
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
