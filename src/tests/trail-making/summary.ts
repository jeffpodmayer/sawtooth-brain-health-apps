// This test's scores for the dashboard's client page (ADR-047) and the CSV export (roadmap 10.1): a row per
// page, a sample before each timed part, each with its sheet. Raw scores only (SPEC: Scoring).

import type { CsvRow, PracticeRow, ScoreRow, ScoreTable } from "../../shared/test-module";
import { expectedOrder } from "./scoring/order";
import type { PartScore, SampleScore, TrailMakingScores } from "./scoring/score-part";

// Lines on each page: one fewer than its circles (SPEC: Pages). 7 on a sample, 24 on a timed part.
const lines = (page: keyof typeof expectedOrder) => expectedOrder[page].length - 1;

// scores come from the database, where only save-result's own scoring writes them (ADR-040),
// so they have this test's shape. Samples saved before 2026-11-14 have only passed, no numbers.

const columns = ["Time (s)", "Lines", "Errors", "Status"];

// The table while the test runs (ADR-048): the same columns and rows, dashes where the numbers will go, no
// sheets yet. Each timed part's row names its key, so the dashboard shows the live counter in its Time cell.
export function emptyTable(): ScoreTable {
  const dashes = ["—", "—", "—", "—"];
  return {
    columns,
    rows: [
      { label: "Sample A", cells: dashes, note: null, sheet: null },
      { label: "Part A", cells: dashes, note: null, sheet: null, timedPart: "partA" },
      { label: "Sample B", cells: dashes, note: null, sheet: null },
      { label: "Part B", cells: dashes, note: null, sheet: null, timedPart: "partB" },
    ],
  };
}

// The client page's table. Lines show out of the page's own total (7 on a sample, 24 on a part), since they
// differ; the last column says how the page went (Jeff, 2026-11-14). Older results have no sample sheets.
export function scoreTable(scores: unknown): ScoreTable {
  const { partA, partB, sampleA, sampleB } = scores as TrailMakingScores;
  return {
    columns,
    rows: [
      sampleRow("Sample A", "sampleA", sampleA),
      partRow("Part A", "partA", partA),
      sampleRow("Sample B", "sampleB", sampleB),
      partRow("Part B", "partB", partB),
    ],
  };
}

// The samples as one row (ADR-047), hidden on the client page for now.
export function practiceRow(scores: unknown): PracticeRow {
  const { sampleA, sampleB } = scores as TrailMakingScores;
  return { label: "Samples", parts: [sampleText("A", sampleA), sampleText("B", sampleB)] };
}

// The CSV export's columns for this test (roadmap 10.1), in order. Raw values only.
export const csvMeasures = ["Time (s)", "Lines", "Errors", "Code"];

// The status words in the CSV, from the stored ones.
const csvStatus = { completed: "completed", timedOut: "timed out", stopped: "stopped", notGiven: "not given" };

// One CSV row per page, in the order given: the samples too, now that they're scored.
export function csvRows(scores: unknown): CsvRow[] {
  const { partA, partB, sampleA, sampleB } = scores as TrailMakingScores;
  return [
    sampleCsvRow("Sample A", sampleA),
    partCsvRow("Part A", partA),
    sampleCsvRow("Sample B", sampleB),
    partCsvRow("Part B", partB),
  ];
}

function partCsvRow(part: string, score: PartScore): CsvRow {
  const values =
    score.status === "notGiven"
      ? { "Time (s)": null, Lines: null, Errors: null, Code: score.code }
      : { "Time (s)": score.timeSeconds, Lines: score.correctLines, Errors: score.errors, Code: score.code };
  return { part, status: csvStatus[score.status], values };
}

function sampleCsvRow(part: string, sample: SampleScore | null): CsvRow {
  const status = sample === null ? "not given" : sample.passed ? "passed" : "not passed";
  const values = {
    "Time (s)": sample?.timeSeconds ?? null,
    Lines: sample?.correctLines ?? null,
    Errors: sample?.errors ?? null,
    Code: null,
  };
  return { part, status, values };
}

// A part's status on the client page. A part stopped with code 996 was skipped partway (ADR-055).
function partStatus(part: PartScore): string {
  if (part.status === "notGiven") return part.code === null ? "Not given" : `Not given (code ${part.code})`;
  if (part.status === "timedOut") return "Time limit";
  if (part.status === "stopped") return part.code === 996 ? "Skipped (code 996)" : "Stopped";
  return "Completed";
}

function partRow(label: string, sheet: "partA" | "partB", part: PartScore): ScoreRow {
  const numbers =
    part.status === "notGiven"
      ? ["", "", ""]
      : [`${part.timeSeconds}`, `${part.correctLines}/${lines(sheet)}`, `${part.errors}`];
  return { label, cells: [...numbers, partStatus(part)], note: null, sheet };
}

// A sample's row. Its numbers are blank if it wasn't given, or was saved before samples were scored.
function sampleRow(label: string, sheet: "sampleA" | "sampleB", sample: SampleScore | null): ScoreRow {
  // A sample the test ended before is "Not given", the same word as a part's (Jeff, 2026-11-14).
  const status = sample === null ? "Not given" : sample.passed ? "Passed" : "Not passed";
  const show = (value: number | undefined) => (value === undefined ? "" : `${value}`);
  const lineCount = sample?.correctLines === undefined ? "" : `${sample.correctLines}/${lines(sheet)}`;
  const numbers = [show(sample?.timeSeconds), lineCount, show(sample?.errors)];
  return { label, cells: [...numbers, status], note: null, sheet };
}

// A sample is null if the test ended before reaching it (SPEC: Recording).
function sampleText(letter: string, sample: SampleScore | null): string {
  if (sample === null) return `${letter} not given`;
  return sample.passed ? `${letter} passed` : `${letter} not passed`;
}
