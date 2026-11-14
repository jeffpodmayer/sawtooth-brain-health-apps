import { describe, expect, it } from "vitest";
import type { ScoreTable } from "../shared/test-module";
import { sheetScoreLines } from "./sheet-scores";

const trailMaking: ScoreTable = {
  columns: ["Time", "Lines", "Errors"],
  rows: [
    { label: "Part A", cells: ["38 s", "24/24", "0"], note: null, sheet: "partA" },
    { label: "Part B", cells: [], note: "Not given (code 996)", sheet: "partB" },
  ],
};

const swaps: ScoreTable = {
  columns: ["Correct", "Tried", "Errors", "Corrections", "Time"],
  rows: [
    { label: "Test", cells: ["23/75", "24", "1", "1", "Time limit (60 s)"], note: null, sheet: "sheet" },
    { label: "Recall", cells: ["5/7"], note: "1 blank", sheet: null },
  ],
};

describe("scores on a sheet's PDF", () => {
  it("only the rows for this sheet, with the client page's wording", () => {
    expect(sheetScoreLines(trailMaking, "partA")).toEqual(["Part A — Time: 38 s · Lines: 24/24 · Errors: 0"]);
  });

  it("a part not given shows its note", () => {
    expect(sheetScoreLines(trailMaking, "partB")).toEqual(["Part B — Not given (code 996)"]);
  });

  it("rows with no sheet of their own go on the test's sheet, with their note", () => {
    expect(sheetScoreLines(swaps, "sheet")).toEqual([
      "Test — Correct: 23/75 · Tried: 24 · Errors: 1 · Corrections: 1 · Time: Time limit (60 s)",
      "Recall — Correct: 5/7 · 1 blank",
    ]);
  });
});
