// This test's scores for the dashboard's client page (ADR-047): a table with one row per timed part,
// with its sheet, and the samples as a separate row. Raw scores only (SPEC: Scoring).

import type { CsvRow, PracticeRow, ScoreRow, ScoreTable } from "../../shared/test-module";
import type { PartScore, SampleScore, TrailMakingScores } from "./scoring/score-part";

// Each part has 25 circles, so 24 lines (SPEC: Pages).
const linesPerPart = 24;

// scores come from the database, where only save-result's own scoring writes them (ADR-040),
// so they have this test's shape.

// One row per timed part, with that part's sheet, for the client page (ADR-047).
export function scoreTable(scores: unknown): ScoreTable {
  const { partA, partB } = scores as TrailMakingScores;
  return {
    columns: ["Time", "Lines", "Errors"],
    rows: [partRow("Part A", "partA", partA), partRow("Part B", "partB", partB)],
  };
}

// The samples, which aren't scored, as one row (ADR-047).
export function practiceRow(scores: unknown): PracticeRow {
  const { sampleA, sampleB } = scores as TrailMakingScores;
  return { label: "Samples", parts: [sampleText("A", sampleA), sampleText("B", sampleB)] };
}

// The CSV export's columns for this test (roadmap 10.1), in order. Raw values only.
export const csvMeasures = ["Time (s)", "Lines", "Errors", "Code"];

// The status words in the CSV, from the stored ones.
const csvStatus = { completed: "completed", timedOut: "timed out", stopped: "stopped", notGiven: "not given" };

// One CSV row per timed part (roadmap 10.1). The samples aren't scored, so they aren't exported.
export function csvRows(scores: unknown): CsvRow[] {
  const { partA, partB } = scores as TrailMakingScores;
  return [csvRow("Part A", partA), csvRow("Part B", partB)];
}

function csvRow(part: string, score: PartScore): CsvRow {
  const values =
    score.status === "notGiven"
      ? { "Time (s)": null, Lines: null, Errors: null, Code: score.code }
      : { "Time (s)": score.timeSeconds, Lines: score.correctLines, Errors: score.errors, Code: null };
  return { part, status: csvStatus[score.status], values };
}

function partRow(label: string, sheet: string, part: PartScore): ScoreRow {
  if (part.status === "notGiven") {
    return { label, cells: [], note: part.code === null ? "Not given" : `Not given (code ${part.code})`, sheet };
  }
  const time =
    part.status === "timedOut"
      ? `Time limit (${part.timeSeconds} s)`
      : part.status === "stopped"
        ? `Stopped at ${part.timeSeconds} s`
        : `${part.timeSeconds} s`;
  return { label, cells: [time, `${part.correctLines}/${linesPerPart}`, `${part.errors}`], note: null, sheet };
}

// A sample is null if the test ended before reaching it (SPEC: Recording).
function sampleText(letter: string, sample: SampleScore | null): string {
  if (sample === null) return `${letter} not reached`;
  return sample.passed ? `${letter} passed` : `${letter} not passed`;
}
