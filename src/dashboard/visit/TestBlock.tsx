// One test in a visit, on the client page (redesigned at 8.9, ADR-047): its name and status,
// a table of its scores (a row per part) from the test's own summary.ts, the browser-scores flag, the notes and the screen size.
// test_version, started_at and completed_at's time are stored with every result but not shown (ADR-047).
// The browser and screen size are behind the computer-screen button next to the test's name.

import { useState } from "react";
import type { Json } from "../../../supabase/functions/_shared/database.types.ts";
import type { ScoreTable } from "../../shared/test-module";
import Chevron from "../ui/Chevron";
import { formatDate } from "../ui/format-date";
import { testsById } from "../sequence-tests";
import { LiveDot, TimedCounter } from "./LiveIndicators";
import type { NoteDialogState } from "./NoteDialog";
import RunningTestControls from "./RunningTestControls";
import SetupInfo from "./SetupInfo";
import SheetButtons from "../results/SheetButtons";
import { sheetScoreLines } from "../results/sheet-scores";
import { stopReasonLabels, testStatusLabels } from "./status-labels";
import { textButtonClass } from "../styles";
import TestNotes from "./TestNotes";

export type VisitTest = {
  id: string;
  practice_id: string;
  test_id: string;
  status: string;
  test_version: string | null;
  started_at: string | null;
  completed_at: string | null;
  screen_width: number | null;
  screen_height: number | null;
  scores: Json | null;
  browser_scores: Json | null;
  stop_reason: string | null;
  stop_requested_at: string | null;
  holds_reached: number;
  holds_released: number;
  skip_requested: string | null; // the key of a step the clinician skipped (ADR-055)
  began_at: string | null; // the client's tab began this test (9.3)
  timed_part: string | null; // the running timed part's key, e.g. "partA" (9.3)
  timed_part_started_at: string | null; // when it started (9.3)
  live_scores: Json | null; // the finished sections' scores while it runs, display only (ADR-058)
  sheets: Json | null;
  browser: Json | null; // raw_data's browser only
};

const statusColors: Record<string, string> = { completed: "text-success-ink", stopped: "text-warning-ink" };
// "Ending…" is amber like Stopped. "In progress" and "Waiting for you" are ink; their dot carries the color.
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

// Every test saves rawData.browser as { name, version } (ADR-047), e.g. "Chrome 131". Anything else
// counts as not recorded.
function browserText(browser: Json | null): string | null {
  if (browser === null || typeof browser !== "object" || Array.isArray(browser)) return null;
  const { name, version } = browser;
  if (typeof name !== "string") return null;
  const major = typeof version === "string" ? version.split(".")[0] : "";
  return major ? `${name} ${major}` : name;
}

// A date as 2026-11-11, in the clinician's own time zone, for download file names.
function fileDate(isoText: string): string {
  return new Date(isoText).toLocaleDateString("en-CA");
}

// Three dots that fade in turn, after "Ending". Still when the computer asks for reduced motion.
function LoadingDots() {
  return (
    <span aria-hidden="true">
      {[0, 200, 400].map((delay) => (
        <span
          key={delay}
          className="animate-loading-dot motion-reduce:animate-none"
          style={{ animationDelay: `${delay}ms` }}
        >
          .
        </span>
      ))}
    </span>
  );
}

type Props = {
  test: VisitTest;
  clientCode: string;
  visitCreatedAt: string;
  running: boolean; // the first pending test in an open visit (ADR-048)
  onChanged: () => void; // re-reads the visits after Continue or Discontinue
};

// The table while a test runs (ADR-048, ADR-058): the finished table's columns and rows, each section filled as
// it finishes and dashes elsewhere, and no sheet column until the result is saved. The running timed part's
// Time cell shows the live counter, which stops at a stop request.
function LiveTable({ table, test }: { table: ScoreTable; test: VisitTest }) {
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
          const counting = row.timedPart === test.timed_part && test.timed_part_started_at;
          return (
            <tr key={row.label} className="h-14 border-b border-line">
              <th scope="row" className="text-left font-normal">
                {row.label}
              </th>
              {row.cells.map((cell, index) => (
                <td key={table.columns[index]} className={alignFor(table.columns[index])}>
                  {counting && index === timeColumn ? (
                    <span className="font-semibold">
                      <TimedCounter startedAt={test.timed_part_started_at!} stoppedAt={test.stop_requested_at} />
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

function TestBlock({ test, clientCode, visitCreatedAt, running, onChanged }: Props) {
  const [noteDialog, setNoteDialog] = useState<NoteDialogState>(null); // the note window, if open
  const [open, setOpen] = useState(true); // every test starts open when its visit opens
  const plugin = testsById.get(test.test_id);
  const name = plugin?.name ?? test.test_id;
  const ran = test.status === "completed" || test.status === "stopped";
  const table = ran && test.scores !== null && plugin ? plugin.table(test.scores) : null;

  // A test finished on a different day than its visit was created shows its own date.
  const otherDay =
    test.completed_at && formatDate(test.completed_at) !== formatDate(visitCreatedAt)
      ? formatDate(test.completed_at)
      : null;
  const holding = test.holds_reached > test.holds_released;

  // The test's skip that fits where it is now (ADR-055), e.g. Skip Part A from Sample A until Part A finishes:
  // at one of its released counts, before the test reaches where the skip lands. Only one skip, once.
  const offeredSkip =
    test.skip_requested === null
      ? (Object.entries(plugin?.skips ?? {})
          .map(([key, skip]) => ({ key, ...skip }))
          .find((skip) => skip.whileReleased.includes(test.holds_released) && test.holds_reached < skip.toHold) ?? null)
      : null;
  // A stop waiting for the client's tab shows on any pending test, including after End session (ADR-049).
  const ending = test.status === "pending" && test.stop_requested_at !== null;
  let liveLabel = testStatusLabels[test.status] ?? test.status;
  if (running && holding) liveLabel = "Waiting for you";
  else if (running && test.began_at) liveLabel = "In progress";
  const statusColor = ending
    ? "text-warning-ink"
    : running && test.began_at
      ? "text-ink"
      : (statusColors[test.status] ?? "text-ink-muted");

  // The dot once the client's tab has begun the running test. The counter is in the part rows below.
  const live = running && test.began_at !== null && !ending;

  // While ending, "Ending" with its dots comes first, before these; while live, the pill does.
  const status = [
    !ending && !live && liveLabel,
    test.stop_reason &&
      (stopReasonLabels[test.stop_reason] ?? plugin?.stopReasons[test.stop_reason] ?? test.stop_reason),
    otherDay,
  ]
    .filter(Boolean)
    .join(" · ");

  const nameAndStatus = (
    <span className="flex flex-wrap items-baseline gap-x-3">
      {/* The name is larger and bolder than its status (20px semibold over 16px regular), so it reads as the heading. */}
      <span className="text-xl font-semibold">{name}</span>
      <span className={`text-base ${statusColor}`}>
        {/* An outlined pill in its dot's color, with ink text: each over a see-through tint of its color: red for In progress, amber and yellow for Waiting for you. */}
        {live && (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-0.5 ${holding ? "border-hold-line bg-hold-dot/15" : "border-danger bg-danger/10"}`}
          >
            <LiveDot waiting={holding} />
            {liveLabel}
          </span>
        )}
        {live && status && " · "}
        {ending && (
          <>
            Ending
            <LoadingDots /> waiting for the client's screen{status && " · "}
          </>
        )}
        {status}
      </span>
    </span>
  );

  return (
    <section aria-labelledby={`test-${test.id}`} className={ran && open ? "pb-5" : "pb-1"}>
      {/* A tinted band across the visit marks the start of each test. A test that has run opens and closes
          from its name; one that hasn't has nothing to show, so it has no arrow.
          pl-9 (36px) + the small arrow (16px) + gap-3 (12px) keeps the name lined up with the rows below (pl-16). */}
      <div className={`flex items-center gap-4 bg-band py-2 pr-6 ${ran ? "pl-9" : "pl-16"}`}>
        <div className="flex items-center gap-1">
          <h3 id={`test-${test.id}`}>
            {ran ? (
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`test-body-${test.id}`}
                onClick={() => setOpen(!open)}
                className="flex flex-wrap items-center gap-x-3 rounded-lg text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Chevron open={open} small />
                {nameAndStatus}
              </button>
            ) : (
              nameAndStatus
            )}
          </h3>
          {ran && (
            <SetupInfo
              testName={name}
              browser={browserText(test.browser)}
              screen={
                test.screen_width && test.screen_height ? `${test.screen_width} × ${test.screen_height} px` : null
              }
            />
          )}
        </div>
        {running && !test.stop_requested_at && (
          <RunningTestControls
            sequenceTestId={test.id}
            testName={name}
            subtitle={`${clientCode} · ${formatDate(visitCreatedAt)}`}
            holding={holding}
            nextStep={plugin?.holds[test.holds_released] ?? null}
            testReasons={plugin?.stopReasons ?? {}}
            reasonHints={plugin?.stopReasonHints ?? {}}
            skip={offeredSkip}
            holdsReleased={test.holds_released}
            onChanged={onChanged}
          />
        )}
      </div>

      {/* Hidden rather than removed when closed, so notes aren't loaded again each time it opens. */}
      <div id={`test-body-${test.id}`} hidden={!open} className="pl-16 pr-6">
        {/* While the test runs, its timed parts as rows; the running part's row shows the counter (ADR-048).
            The saved result's score table replaces these once the test is saved. */}
        {test.status === "pending" && test.began_at && plugin && (
          <LiveTable table={plugin.liveTable(test.live_scores)} test={test} />
        )}

        {/* The samples or practice row (each test's practiceRow) is hidden for now (8.9); only scored rows show. */}
        {table && table.rows.length > 0 && (
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
                  const path = sheetPath(test.sheets, row.sheet);
                  const label = (row.sheet && plugin?.sheetLabels[row.sheet]) || row.label;
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
                          path && test.completed_at ? (
                            <SheetButtons
                              path={path}
                              title={`${clientCode} · ${name} · ${label}`}
                              heading={`${clientCode} · ${name} · ${label} · ${fileDate(test.completed_at)}`}
                              scoreLines={row.sheet ? sheetScoreLines(table, row.sheet) : []}
                              fileName={`${clientCode} ${name} ${label} ${fileDate(test.completed_at)}.pdf`}
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
        )}

        {test.browser_scores !== null && (
          <div className="mt-3 rounded-lg border-2 border-ink p-4">
            <p className="font-semibold">The browser's scores didn't match the server's.</p>
            <p className="mt-1">
              The scores above are the server's, worked out again from the saved log. The browser's are kept below.
            </p>
            <details className="mt-2">
              <summary className="inline-flex h-12 cursor-pointer items-center font-semibold text-accent underline underline-offset-4 hover:text-accent-strong focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-accent">
                Show the browser's scores
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words text-base">
                {JSON.stringify(test.browser_scores, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Notes can be added before, during and after a test, so a clinician can always write one down. The
            note window's date is the test's finish, or the visit's date while it hasn't finished. */}
        <TestNotes
          sequenceTestId={test.id}
          practiceId={test.practice_id}
          subtitle={`${name} · ${clientCode} · ${formatDate(test.completed_at ?? visitCreatedAt)}`}
          dialog={noteDialog}
          setDialog={setNoteDialog}
        />

        {/* Under the test's own rows and notes, so it plainly belongs to this test. */}
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setNoteDialog({ mode: "add", draft: "" })}
          className={`-ml-2 mt-2 flex h-9 items-center gap-2 px-2 text-base ${textButtonClass}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {/* Heard as "Add note to SWAPS"; seen as "+ Add note". */}
          <span>
            Add note<span className="sr-only"> to {name}</span>
          </span>
        </button>
      </div>
    </section>
  );
}

export default TestBlock;
