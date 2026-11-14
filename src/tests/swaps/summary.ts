// This test's scores for the dashboard's client page (ADR-047): one table with a row for the test, with the
// answer sheet, and one for recall, plus practice as a separate row. Raw scores only (SPEC: Scoring).

import type { PracticeRow, ScoreRow, ScoreTable } from "../../shared/test-module";
import { gridItems, keyNumbers } from "./scoring/form-a";
import type { GridScore, SwapsScores } from "./scoring/score-grid";
import type { RecallScore } from "./scoring/score-recall";

const recallSymbols = Object.keys(keyNumbers).length;

// The scored items: row 1 item 7 to the end (SPEC: Parts).
const testItems = gridItems.filter((item) => item.part === "test").length;

// scores come from the database, where only save-result's own scoring writes them (ADR-040),
// so they have this test's shape.

// Test and recall share one table. Recall fills only Correct; its blanks are a note (ADR-047).
export function scoreTable(scores: unknown): ScoreTable {
  const { test, recall } = scores as SwapsScores;
  return {
    columns: ["Correct", "Tried", "Errors", "Corrections", "Time"],
    rows: [testRow(test), recallRow(recall)],
  };
}

// Practice, which isn't scored, as one row (ADR-047).
export function practiceRow(scores: unknown): PracticeRow {
  const { practice } = scores as SwapsScores;
  return { label: "Practice", parts: [count(practice.wrongAnswers, "wrong answer"), "not scored"] };
}

function testRow(test: GridScore): ScoreRow {
  if (test.status === "notGiven") return { label: "Test", cells: [], note: "Not given", sheet: "sheet" };
  const time =
    test.status === "timedOut"
      ? `Time limit (${seconds(test.timeMs)} s)`
      : test.status === "stopped"
        ? `Stopped at ${seconds(test.timeMs)} s`
        : `${seconds(test.timeMs)} s`;
  return {
    label: "Test",
    cells: [`${test.correct}/${testItems}`, `${test.attempted}`, `${test.errors}`, `${test.corrections}`, time],
    note: null,
    sheet: "sheet",
  };
}

function recallRow(recall: RecallScore): ScoreRow {
  if (recall.status === "notGiven") return { label: "Recall", cells: [], note: "Not given", sheet: null };
  const blank = `${recall.blank} blank`;
  return {
    label: "Recall",
    cells: [`${recall.correct}/${recallSymbols}`],
    note: recall.status === "stopped" ? `${blank} · stopped` : blank,
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
