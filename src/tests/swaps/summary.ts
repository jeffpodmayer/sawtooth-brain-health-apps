// One line for the test and one for recall, for the dashboard's client page (roadmap 8.6).
// Raw scores only (SPEC: Scoring). Practice isn't scored, so it shows only in the result detail (8.7).

import { keyNumbers } from "./scoring/form-a";
import type { GridScore, SwapsScores } from "./scoring/score-grid";
import type { RecallScore } from "./scoring/score-recall";

const recallSymbols = Object.keys(keyNumbers).length;

// scores come from the database, where only save-result's own scoring writes them (ADR-040),
// so they have this test's shape.
export function summarizeScores(scores: unknown): string[] {
  const { test, recall } = scores as SwapsScores;
  return [summarizeTest(test), summarizeRecall(recall)];
}

// Practice, then the test and recall lines, for the result detail (roadmap 8.7).
export function detailScores(scores: unknown): string[] {
  const { practice } = scores as SwapsScores;
  return [`Practice: ${count(practice.wrongAnswers, "wrong answer")} (not scored)`, ...summarizeScores(scores)];
}

function summarizeTest(test: GridScore): string {
  if (test.status === "notGiven") return "Test: not given";
  const counts = `${test.correct} correct, ${test.attempted} attempted, ${count(test.errors, "error")}, ${count(test.corrections, "correction")}`;
  if (test.status === "stopped") return `Test: stopped at ${seconds(test.timeMs)} s, ${counts}`;
  if (test.status === "completed") return `Test: ${counts}, all done in ${seconds(test.timeMs)} s`;
  return `Test: ${counts}`; // timed out: the usual ending, at 60 s
}

function summarizeRecall(recall: RecallScore): string {
  if (recall.status === "notGiven") return "Recall: not given";
  const counts = `${recall.correct} of ${recallSymbols} correct, ${recall.blank} blank`;
  return recall.status === "stopped" ? `Recall: stopped, ${counts}` : `Recall: ${counts}`;
}

// Milliseconds as seconds, to the nearest tenth.
function seconds(ms: number): number {
  return Math.round(ms / 100) / 10;
}

// "1 error", "2 errors".
function count(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
