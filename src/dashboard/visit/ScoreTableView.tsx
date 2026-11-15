// A test's score table on the client page (8.9, ADR-047): the saved result's table, and the same table while
// the test runs (ADR-048, ADR-058). Both come from the test's own summary.ts and share their column widths.

import type { Json } from "../../../supabase/functions/_shared/database.types.ts";
import type { ScoreTable } from "../../shared/test-module";
import SheetButtons from "../results/SheetButtons";
import { sheetScoreLines } from "../results/sheet-scores";
import { TimedCounter } from "./LiveIndicators";

// Score table widths. The sheet buttons get a fixed width (two icons). The Status column is as wide as this
// table's longest status needs, plus its indent, so "Not given (code 996)" stays on one line. The row names and
// the other columns share the rest equally. The table never scrolls sideways: only if the window is too narrow
// for everything does a long status wrap. The table while a test runs uses the same widths for its own rows.
function TableColumns({ table }: { table: ScoreTable }) {
  const statusIndex = table.columns.indexOf("Status");
  // About 0.55em per character of Atkinson Hyperlegible Next at body size, a little over its average, plus the
  // 3rem indent. "Completed", the heading and short words all fit the 10-character minimum.
  const longest = Math.max(10, ...table.rows.map((row) => row.cells[statusIndex]?.length ?? 0));
  const statusWidth = `calc(3rem + ${(longest * 0.55).toFixed(2)}em)`;
  return (
    <colgroup>
      <col />
      {table.columns.map((column) => (
        <col key={column} style={column === "Status" ? { width: statusWidth } : undefined} />
      ))}
      <col style={{ width: "6rem" }} />
    </colgroup>
  );
}

// Numbers sit centred under their headings, on one line. A Status column holds words, which line up from the
// left, under the left edge of its heading, set in a little so it isn't crowded against the numbers before it.
// Its column fits its longest status (TableColumns); only on a window too narrow for that does a status wrap,
// onto a second line within the row, instead of running into the sheet buttons.
function alignFor(column: string): string {
  return column === "Status" ? "pl-12 text-left leading-snug" : "whitespace-nowrap text-center";
}

// sheets is {name: path}, written only by save-result (ADR-041). Anything else counts as no sheet.
function sheetPath(sheets: Json | null, name: string | null): string | null {
  if (name === null || sheets === null || typeof sheets !== "object" || Array.isArray(sheets)) return null;
  const path = sheets[name];
  return typeof path === "string" ? path : null;
}

// A date as 2026-11-11, in the clinician's own time zone, for download file names.
function fileDate(isoText: string): string {
  return new Date(isoText).toLocaleDateString("en-CA");
}

type LiveProps = {
  table: ScoreTable;
  timedPart: string | null; // the running timed part's key, e.g. "partA"
  timedPartStartedAt: string | null;
  stopRequestedAt: string | null;
};

// The table while a test runs (ADR-048, ADR-058): the finished table's columns and rows, each section filled as
// it finishes and dashes elsewhere, and no sheet column until the result is saved. The running timed part's
// Time cell shows the live counter, which stops at a stop request.
export function LiveTable({ table, timedPart, timedPartStartedAt, stopRequestedAt }: LiveProps) {
  const timeColumn = table.columns.findIndex((column) => column.startsWith("Time"));
  return (
    <table className="mt-3 w-full table-fixed tabular-nums">
      <TableColumns table={table} />
      <thead>
        <tr className="border-b border-line text-base text-ink-muted">
          <td />
          {table.columns.map((column) => (
            <th key={column} scope="col" className={`py-3 font-normal ${alignFor(column)}`}>
              {column}
            </th>
          ))}
          <td />
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => {
          // When this row's timed part is the one running, when it started; otherwise null.
          const countingFrom = row.timedPart === timedPart ? timedPartStartedAt : null;
          return (
            <tr key={row.label} className="h-14 border-b border-line">
              <th scope="row" className="text-left font-normal">
                {row.label}
              </th>
              {row.cells.map((cell, index) => (
                <td key={table.columns[index]} className={alignFor(table.columns[index])}>
                  {countingFrom && index === timeColumn ? (
                    <span className="font-semibold">
                      <TimedCounter startedAt={countingFrom} stoppedAt={stopRequestedAt} />
                    </span>
                  ) : cell === "—" ? (
                    <span className="text-ink-muted">—</span>
                  ) : (
                    // A finished section's value looks as it will once saved: the first (the headline) is bold.
                    <span className={index === 0 ? "font-semibold" : ""}>{cell}</span>
                  )}
                </td>
              ))}
              <td />
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

type SavedProps = {
  table: ScoreTable;
  sheets: Json | null;
  sheetLabels: Record<string, string>;
  completedAt: string | null;
  clientCode: string;
  testName: string;
};

// The saved result's table, with each row's sheet buttons.
export function SavedTable({ table, sheets, sheetLabels, completedAt, clientCode, testName }: SavedProps) {
  return (
    <div className="mt-3">
      {/* Row names are row headings and the test's columns are column headings, so a screen reader hears
          "Part B, Errors, 3". Numbers sit centred under their headings (Status from the left); the widths
          come from TableColumns, so the table fits the window and never scrolls sideways. */}
      <table className="w-full table-fixed tabular-nums">
        <TableColumns table={table} />
        <thead>
          <tr className="border-b border-line text-base text-ink-muted">
            <td />
            {table.columns.map((column) => (
              <th key={column} scope="col" className={`py-3 font-normal ${alignFor(column)}`}>
                {column}
              </th>
            ))}
            <td>
              <span className="sr-only">Sheet</span>
            </td>
          </tr>
        </thead>
        <tbody>
          {/* Every row the same height (56px), whether it has sheet icons or "No sheet". */}
          {table.rows.map((row) => {
            const path = sheetPath(sheets, row.sheet);
            const label = (row.sheet && sheetLabels[row.sheet]) || row.label;
            return (
              <tr key={row.label} className="h-14 border-b border-line">
                <th scope="row" className="text-left font-normal">
                  {row.label}
                </th>
                {/* The first value is the headline (time, or correct), so it's bold. */}
                {row.cells.map((cell, index) => (
                  <td
                    key={table.columns[index]}
                    className={`${alignFor(table.columns[index])} ${index === 0 ? "font-semibold" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
                {/* Anything else ("1 blank", "Not given") is grey, across the columns the row doesn't fill. */}
                {row.cells.length < table.columns.length && (
                  <td
                    colSpan={table.columns.length - row.cells.length}
                    className="pl-6 text-left text-base text-ink-muted"
                  >
                    {row.note}
                  </td>
                )}
                <td className="text-right">
                  {
                    path && completedAt ? (
                      <SheetButtons
                        path={path}
                        title={`${clientCode} · ${testName} · ${label}`}
                        heading={`${clientCode} · ${testName} · ${label} · ${fileDate(completedAt)}`}
                        scoreLines={row.sheet ? sheetScoreLines(table, row.sheet) : []}
                        fileName={`${clientCode} ${testName} ${label} ${fileDate(completedAt)}.pdf`}
                      />
                    ) : row.sheet !== null ? (
                      // A row that should have a sheet but doesn't (e.g. an older result's sample).
                      <span className="text-base text-ink-muted">No sheet</span>
                    ) : null /* A row with no sheet of its own, like SWAPS's recall on the answer sheet. */
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
