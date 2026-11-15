import { describe, expect, it } from "vitest";
import type { ScoreTable } from "../../shared/test-module";
import { sheetScoreLines } from "./sheet-scores";

const trailMaking: ScoreTable = {
  columns: ["Time (s)", "Lines (of 24)", "Errors"],
  rows: [
    { label: "Part A", cells: ["38", "24", "0"], note: null, sheet: "partA" },
    { label: "Part B", cells: [], note: "Not given (code 996)", sheet: "partB" },
  ],
};

const swaps: ScoreTable = {
  columns: ["Correct", "Tried", "Errors", "Corrections", "Time (s)"],
  rows: [
    { label: "Test (of 75)", cells: ["23", "24", "1", "1", "60 (time limit)"], note: null, sheet: "sheet" },
    { label: "Recall (of 7)", cells: ["5"], note: "1 blank", sheet: null },
  ],
};

describe("scores on a sheet's PDF", () => {
  it("only the rows for this sheet, with the client page's wording", () => {
    expect(sheetScoreLines(trailMaking, "partA")).toEqual(["Part A — Time (s): 38 · Lines (of 24): 24 · Errors: 0"]);
  });

  it("leaves out blank values, such as a part not given in a table with a status column", () => {
    const withStatus: ScoreTable = {
      columns: ["Time (s)", "Lines", "Errors", "Status"],
      rows: [{ label: "Part B (of 24)", cells: ["", "", "", "Not given (code 996)"], note: null, sheet: "partB" }],
    };
    expect(sheetScoreLines(withStatus, "partB")).toEqual(["Part B (of 24) — Status: Not given (code 996)"]);
  });

  it("a part not given shows its note", () => {
    expect(sheetScoreLines(trailMaking, "partB")).toEqual(["Part B — Not given (code 996)"]);
  });

  it("rows with no sheet of their own go on the test's sheet, with their note", () => {
    expect(sheetScoreLines(swaps, "sheet")).toEqual([
      "Test (of 75) — Correct: 23 · Tried: 24 · Errors: 1 · Corrections: 1 · Time (s): 60 (time limit)",
      "Recall (of 7) — Correct: 5 · 1 blank",
    ]);
  });
});
