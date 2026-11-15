import { describe, expect, it } from "vitest";
import type { GivenGridScore, SwapsScores } from "./scoring/score-grid";
import { csvMeasures, csvRows, liveTable, practiceRow, scoreTable } from "./summary";

const timedOut: GivenGridScore = { status: "timedOut", timeMs: 60000, attempted: 24, correct: 23, errors: 1, corrections: 1 };
const practice = { wrongAnswers: 0 };

function scores(test: SwapsScores["test"], recall: SwapsScores["recall"]): SwapsScores {
  return { test, recall, practice };
}

const recallDone = { status: "completed" as const, correct: 5, blank: 1 };

// One table for test and recall (ADR-047), with a Status column like Trail Making's (Jeff, 2026-11-14). Recall
// fills Correct, Tried (symbols answered, 7 minus blank) and Errors, like the test; it has no corrections or time.
// Recall is on the answer sheet, so its row has no sheet of its own.
describe("SWAPS score table", () => {
  it("each row named with its total, plain numbers, and the status last", () => {
    expect(scoreTable(scores(timedOut, recallDone))).toEqual({
      columns: ["Correct", "Tried", "Errors", "Corrections", "Time (s)", "Status"],
      rows: [
        { label: "Test (of 75)", cells: ["23", "24", "1", "1", "60", "Time limit"], note: null, sheet: "sheet" },
        { label: "Recall (of 7)", cells: ["5", "6", "1", "", "", "Completed"], note: null, sheet: null },
      ],
    });
  });

  it("a stopped test says so in its status, and a recall not given has blank numbers", () => {
    const test = { ...timedOut, status: "stopped" as const, timeMs: 31000 };
    expect(scoreTable(scores(test, { status: "notGiven" })).rows).toEqual([
      { label: "Test (of 75)", cells: ["23", "24", "1", "1", "31", "Stopped"], note: null, sheet: "sheet" },
      { label: "Recall (of 7)", cells: ["", "", "", "", "", "Not given"], note: null, sheet: null },
    ]);
  });

  it("a test finished early shows its time and Completed", () => {
    const test = { ...timedOut, status: "completed" as const, correct: 75, attempted: 75, timeMs: 52400 };
    expect(scoreTable(scores(test, recallDone)).rows[0].cells.slice(-2)).toEqual(["52.4", "Completed"]);
  });

  it("a test not given keeps its sheet name, with blank numbers", () => {
    expect(scoreTable(scores({ status: "notGiven" }, { status: "notGiven" })).rows[0]).toEqual({
      label: "Test (of 75)",
      cells: ["", "", "", "", "", "Not given"],
      note: null,
      sheet: "sheet",
    });
  });

  it("a stopped recall says so in its status", () => {
    expect(scoreTable(scores(timedOut, { ...recallDone, status: "stopped" })).rows[1].cells).toEqual([
      "5",
      "6",
      "1",
      "",
      "",
      "Stopped",
    ]);
  });
});

describe("SWAPS practice row", () => {
  it("wrong practice answers (one is singular), not scored", () => {
    const withPractice = (wrongAnswers: number) => ({ ...scores(timedOut, recallDone), practice: { wrongAnswers } });
    expect(practiceRow(withPractice(2))).toEqual({ label: "Practice", parts: ["2 wrong answers", "not scored"] });
    expect(practiceRow(withPractice(1)).parts[0]).toBe("1 wrong answer");
  });
});

describe("SWAPS CSV rows", () => {
  it("a row for the test and one for recall, with raw numbers", () => {
    expect(csvRows(scores(timedOut, recallDone))).toEqual([
      {
        part: "Test",
        status: "timed out",
        values: { Correct: 23, Tried: 24, Errors: 1, Corrections: 1, "Time (s)": 60, Blank: null },
      },
      {
        part: "Recall",
        status: "completed",
        values: { Correct: 5, Tried: null, Errors: null, Corrections: null, "Time (s)": null, Blank: 1 },
      },
    ]);
  });

  it("time is in seconds to the nearest tenth, and a stopped part says so", () => {
    const test = { ...timedOut, status: "stopped" as const, timeMs: 31260 };
    const [testRow, recallRow] = csvRows(scores(test, { ...recallDone, status: "stopped" }));
    expect([testRow.status, testRow.values["Time (s)"], recallRow.status]).toEqual(["stopped", 31.3, "stopped"]);
  });

  it("a part not given has no values", () => {
    expect(csvRows(scores({ status: "notGiven" }, { status: "notGiven" })).map((row) => row.status)).toEqual([
      "not given",
      "not given",
    ]);
    for (const row of csvRows(scores({ status: "notGiven" }, { status: "notGiven" }))) {
      expect(Object.values(row.values).every((value) => value === null)).toBe(true);
    }
  });

  it("every row has exactly the test's measures", () => {
    const rows = [...csvRows(scores(timedOut, recallDone)), ...csvRows(scores({ status: "notGiven" }, { status: "notGiven" }))];
    for (const row of rows) expect(Object.keys(row.values)).toEqual(csvMeasures);
  });
});

// While the test runs (ADR-048, ADR-058): the finished table's columns and rows, all dashes until a section
// finishes; then its row fills from the live scores. No sheet until the result is saved.
describe("SWAPS table while running", () => {
  it("before any section finishes: every column and row, dashes where values will go, the timed parts' keys", () => {
    expect(liveTable(null)).toEqual({
      columns: ["Correct", "Tried", "Errors", "Corrections", "Time (s)", "Status"],
      rows: [
        { label: "Test (of 75)", cells: ["—", "—", "—", "—", "—", "—"], note: null, sheet: null, timedPart: "test" },
        { label: "Recall (of 7)", cells: ["—", "—", "—", "", "", "—"], note: null, sheet: null, timedPart: "recall" },
      ],
    });
  });

  it("fills the Test row once the test finishes, with no sheet", () => {
    expect(liveTable({ test: timedOut }).rows[0]).toEqual({
      label: "Test (of 75)",
      cells: ["23", "24", "1", "1", "60", "Time limit"],
      note: null,
      sheet: null,
      timedPart: "test",
    });
  });

  it("shows dashes for anything that isn't a section score", () => {
    expect(liveTable({ test: "junk" }).rows[0].cells).toEqual(["—", "—", "—", "—", "—", "—"]);
  });
});
