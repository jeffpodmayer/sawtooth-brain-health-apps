// This test's scores for the dashboard's client page (ADR-047): one table with a row for the test, with the
// answer sheet, and one for recall, plus practice as a separate row. Raw scores only (SPEC: Scoring).

import type { CsvRow, PracticeRow, ScoreRow, ScoreTable } from "../../shared/test-module";
import { gridItems, keyNumbers } from "./scoring/form-a";
import type { GridScore, SwapsScores } from "./scoring/score-grid";
import type { RecallScore } from "./scoring/score-recall";

const recallSymbols = Object.keys(keyNumbers).length;

// The scored items: row 1 item 7 to the end (SPEC: Parts).
const testItems = gridItems.filter((item) => item.part === "test").length;

// scores come from the database, where only save-result's own scoring writes them (ADR-040),
// so they have this test's shape.

// A Status column last, like Trail Making's, so the numbers are plain (Jeff, 2026-11-14).
const columns = ["Correct", "Tried", "Errors", "Corrections", "Time (s)", "Status"];

// The table while the test runs (ADR-048, ADR-058): the same columns and rows, dashes where the values will go,
// until a section finishes; then its row fills from the live scores the client's tab sent. No sheet until the
// result is saved. Each row names its timed part, for the live counter. live comes from the browser, so
// anything that isn't a section score shows as dashes.
export function liveTable(live: unknown): ScoreTable {
  const sections = typeof live === "object" && live !== null ? (live as Record<string, unknown>) : {};
  const test: ScoreRow = isGridScore(sections.test)
    ? { ...testRow(sections.test), sheet: null }
    : { label: `Test (of ${testItems})`, cells: ["—", "—", "—", "—", "—", "—"], note: null, sheet: null };
  const recall: ScoreRow = {
    label: `Recall (of ${recallSymbols})`,
    cells: ["—", "—", "—", "", "", "—"],
    note: null,
    sheet: null,
  };
  return {
    columns,
    rows: [
      { ...test, timedPart: "test" },
      { ...recall, timedPart: "recall" },
    ],
  };
}

function isGridScore(value: unknown): value is GridScore {
  if (typeof value !== "object" || value === null) return false;
  const score = value as Record<string, unknown>;
  if (score.status === "notGiven") return true;
  const counts = [score.timeMs, score.attempted, score.correct, score.errors, score.corrections];
  return (
    (score.status === "completed" || score.status === "timedOut" || score.status === "stopped") &&
    counts.every((count) => typeof count === "number" && Number.isFinite(count))
  );
}

// Test and recall share one table. Recall fills only Correct; its blanks are a note (ADR-047). Their totals
// differ (75 and 7), so each row's name carries its own; the time's unit sits in its heading.
export function scoreTable(scores: unknown): ScoreTable {
  const { test, recall } = scores as SwapsScores;
  return {
    columns,
    rows: [testRow(test), recallRow(recall)],
  };
}

// Practice, which isn't scored, as one row (ADR-047).
export function practiceRow(scores: unknown): PracticeRow {
  const { practice } = scores as SwapsScores;
  return { label: "Practice", parts: [count(practice.wrongAnswers, "wrong answer"), "not scored"] };
}

// The CSV export's columns for this test (roadmap 10.1), in the score table's order. Raw values only.
export const csvMeasures = ["Correct", "Tried", "Errors", "Corrections", "Time (s)", "Blank"];

// The status words in the CSV, from the stored ones.
const csvStatus = { completed: "completed", timedOut: "timed out", stopped: "stopped", notGiven: "not given" };

// A CSV row for the test and one for recall (roadmap 10.1). Practice isn't scored, so it isn't exported.
export function csvRows(scores: unknown): CsvRow[] {
  const { test, recall } = scores as SwapsScores;
  const blank = { Correct: null, Tried: null, Errors: null, Corrections: null, "Time (s)": null, Blank: null };
  const testValues =
    test.status === "notGiven"
      ? blank
      : {
          ...blank,
          Correct: test.correct,
          Tried: test.attempted,
          Errors: test.errors,
          Corrections: test.corrections,
          "Time (s)": seconds(test.timeMs),
        };
  const recallValues =
    recall.status === "notGiven" ? blank : { ...blank, Correct: recall.correct, Blank: recall.blank };
  return [
    { part: "Test", status: csvStatus[test.status], values: testValues },
    { part: "Recall", status: csvStatus[recall.status], values: recallValues },
  ];
}

const blankNumbers = ["", "", "", "", ""];

function testRow(test: GridScore): ScoreRow {
  const label = `Test (of ${testItems})`;
  if (test.status === "notGiven") return { label, cells: [...blankNumbers, "Not given"], note: null, sheet: "sheet" };
  const status = test.status === "timedOut" ? "Time limit" : test.status === "stopped" ? "Stopped" : "Completed";
  return {
    label,
    cells: [
      `${test.correct}`,
      `${test.attempted}`,
      `${test.errors}`,
      `${test.corrections}`,
      `${seconds(test.timeMs)}`,
      status,
    ],
    note: null,
    sheet: "sheet",
  };
}

// Recall reads like the test: Tried is the symbols answered (7 minus blank) and Errors the wrong ones. It has no
// corrections or time. Its answers are on the answer sheet, so it has no sheet of its own.
function recallRow(recall: RecallScore): ScoreRow {
  const label = `Recall (of ${recallSymbols})`;
  if (recall.status === "notGiven") return { label, cells: [...blankNumbers, "Not given"], note: null, sheet: null };
  const tried = recallSymbols - recall.blank;
  const status = recall.status === "stopped" ? "Stopped" : "Completed";
  return {
    label,
    cells: [`${recall.correct}`, `${tried}`, `${tried - recall.correct}`, "", "", status],
    note: null,
    sheet: null,
  };
}

// Milliseconds as seconds, to the nearest tenth.
function seconds(ms: number): number {
  return Math.round(ms / 100) / 10;
}

// "1 wrong answer", "2 wrong answers".
function count(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
