// One line per timed part, for the dashboard's client page (roadmap 8.6), and one per page,
// samples included, for the result detail (8.7). Raw scores only (SPEC: Scoring).

import type { PartScore, SampleScore, TrailMakingScores } from "./scoring/score-part";

// scores come from the database, where only save-result's own scoring writes them (ADR-040),
// so they have this test's shape.
export function summarizeScores(scores: unknown): string[] {
  const { partA, partB } = scores as TrailMakingScores;
  return [summarizePart("Part A", partA), summarizePart("Part B", partB)];
}

// Every page in the order given, samples included, for the result detail (roadmap 8.7).
export function detailScores(scores: unknown): string[] {
  const { partA, partB, sampleA, sampleB } = scores as TrailMakingScores;
  return [
    summarizeSample("Sample A", sampleA),
    summarizePart("Part A", partA),
    summarizeSample("Sample B", sampleB),
    summarizePart("Part B", partB),
  ];
}

// A sample is null if the test ended before reaching it (SPEC: Recording).
function summarizeSample(label: string, sample: SampleScore | null): string {
  if (sample === null) return `${label}: not reached`;
  return sample.passed ? `${label}: passed` : `${label}: not passed`;
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
