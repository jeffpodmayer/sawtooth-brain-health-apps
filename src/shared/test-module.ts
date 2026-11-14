// The plug-in contract (ADR-001): what every test exports and what it hands back.
// Shared code uses only these types, so it never knows how a test is scored.

import type { ComponentType } from "react";

export type TestResult = {
  testId: string;
  testVersion: string;
  sequenceId: string;

  // Calendar times as ISO 8601 text in UTC, e.g. "2026-11-08T18:30:00.000Z".
  // They say when the test happened. Anything measured uses performance.now().
  startedAt: string;
  completedAt: string;

  // Each test decides what goes inside these. Stored as jsonb.
  // Write a test's own shapes with `type`: an `interface` won't fit here.
  scores: Record<string, unknown>;
  rawData: Record<string, unknown>;

  // Finished sheets as SVG text, by name. Each one is saved as its own file (ADR-033).
  sheets: Record<string, string>;
};

// A finished test's scores as a table on the dashboard's client page (ADR-047). Raw numbers only.
export type ScoreTable = {
  columns: string[]; // "Time", "Lines", "Errors"
  rows: ScoreRow[];
};

// One row of a score table.
export type ScoreRow = {
  label: string; // "Part A", "Test", "Recall"
  cells: string[]; // the row's values for the first columns, in order (none for a part not given)
  note: string | null; // shown grey across the columns after the cells: "1 blank", "Not given (code 996)"
  sheet: string | null; // the name of this row's sheet (a key of the test's sheetLabels), if it has one
};

// A test's samples or practice: not scored, and not shown on the dashboard for now (ADR-047).
export type PracticeRow = { label: string; parts: string[] };

export type TestProps = {
  sequenceId: string;

  // Turns true when a clinician stops the test. The test then stops its voice
  // and clicks, and calls onComplete with its partial result.
  stopRequested: boolean;

  // Called once, whether the test finished, timed out or was stopped.
  onComplete: (result: TestResult) => void;

  // Called if the test's clips can't be downloaded, before anything has been timed.
  // The shared layer then offers "Try again", which starts the test from its beginning.
  // Must keep the same identity between renders, because a test's effects depend on it.
  onLoadFailed: () => void;
};

export type TestModule = {
  id: string;
  name: string;
  version: string;
  Component: ComponentType<TestProps>;
};
