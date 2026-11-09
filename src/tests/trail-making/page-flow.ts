// Which page the test is on and what stage that page is at. Pure: same inputs, same answer.

export const pages = ["sampleA", "partA", "sampleB", "partB"] as const;

export type Flow = {
  pageIndex: number;
  phase: "instructions" | "practice" | "test" | "finished";
};

export type FlowEvent = "clicksEnabled" | "pageCompleted" | "pauseOver";

export const startFlow: Flow = { pageIndex: 0, phase: "instructions" };

export function nextFlow(flow: Flow, event: FlowEvent): Flow {
  const { pageIndex, phase } = flow;

  if (event === "clicksEnabled" && phase === "instructions") {
    return { pageIndex, phase: pages[pageIndex].startsWith("sample") ? "practice" : "test" };
  }

  if (event === "pageCompleted" && (phase === "practice" || phase === "test")) {
    return { pageIndex, phase: "finished" };
  }

  if (event === "pauseOver" && phase === "finished") {
    return { pageIndex: (pageIndex + 1) % pages.length, phase: "instructions" };
  }

  return flow;
}
