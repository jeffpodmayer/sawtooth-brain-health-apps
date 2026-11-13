// One line per timed part, for the dashboard's client page (roadmap 8.6). Raw scores only (SPEC: Scoring).

import type { PartScore, TrailMakingScores } from "./scoring/score-part";

// scores come from the database, where only save-result's own scoring writes them (ADR-040),
// so they have this test's shape.
export function summarizeScores(scores: unknown): string[] {
  const { partA, partB } = scores as TrailMakingScores;
  return [summarizePart("Part A", partA), summarizePart("Part B", partB)];
}

function summarizePart(label: string, part: PartScore): string {
  if (part.status === "notGiven") {
    return part.code === null ? `${label}: not given` : `${label}: not given (code ${part.code})`;
  }
  const time =
    part.status === "timedOut"
      ? `time limit (${part.timeSeconds} s)`
      : part.status === "stopped"
        ? `stopped at ${part.timeSeconds} s`
        : `${part.timeSeconds} s`;
  return `${label}: ${time}, ${count(part.correctLines, "correct line")}, ${count(part.errors, "error")}`;
}

// "1 error", "2 errors".
function count(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
