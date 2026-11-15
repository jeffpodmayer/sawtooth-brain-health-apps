// The score lines under a sheet's PDF heading (roadmap 10.2), from the test's own score table, so the PDF says
// exactly what the client page says. Raw scores only. A row goes on the PDF of the sheet it points to; a row
// with no sheet of its own (SWAPS's recall, drawn on the answer sheet) goes on the test's sheets too.

import type { ScoreTable } from "../../shared/test-module";

// "Part A — Time (s): 38 · Lines (of 24): 24 · Errors: 0", "Recall (of 7) — Correct: 5 · 1 blank".
export function sheetScoreLines(table: ScoreTable, sheet: string): string[] {
  return table.rows
    .filter((row) => row.sheet === sheet || row.sheet === null)
    .map((row) => {
      // A blank value (a part not given, in a table with a status column) is left out.
      const parts = row.cells.flatMap((cell, index) => (cell === "" ? [] : [`${table.columns[index]}: ${cell}`]));
      if (row.note) parts.push(row.note);
      return `${row.label} — ${parts.join(" · ")}`;
    });
}
