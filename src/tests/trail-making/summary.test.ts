import { describe, expect, it } from "vitest";
import type { GivenPartScore, SampleScore, TrailMakingScores } from "./scoring/score-part";
import { csvMeasures, csvRows, emptyTable, practiceRow, scoreTable } from "./summary";

const finished: GivenPartScore = {
  status: "completed", code: null, timeMs: 38000, timeSeconds: 38, correctLines: 24, correctClicks: 25, errors: 0,
};
const passed: SampleScore = { passed: true, timeMs: 23400, timeSeconds: 23.4, correctLines: 7, correctClicks: 8, errors: 1 };
const notGiven = { status: "notGiven" as const, code: null };

function scores(partA: TrailMakingScores["partA"], partB: TrailMakingScores["partB"]): TrailMakingScores {
  return { partA, partB, sampleA: passed, sampleB: passed };
}

describe("Trail Making score table", () => {
  it("a row per page, lines out of the page's total, the status last, each with its sheet", () => {
    const partB = { ...finished, timeMs: 91300, timeSeconds: 91.3, errors: 1 };
    expect(scoreTable(scores(finished, partB))).toEqual({
      columns: ["Time (s)", "Lines", "Errors", "Status"],
      rows: [
        { label: "Sample A", cells: ["23.4", "7/7", "1", "Passed"], note: null, sheet: "sampleA" },
        { label: "Part A", cells: ["38", "24/24", "0", "Completed"], note: null, sheet: "partA" },
        { label: "Sample B", cells: ["23.4", "7/7", "1", "Passed"], note: null, sheet: "sampleB" },
        { label: "Part B", cells: ["91.3", "24/24", "1", "Completed"], note: null, sheet: "partB" },
      ],
    });
  });

  it("a timed-out, stopped or skipped part says so in its status, with plain numbers", () => {
    const timedOut = { ...finished, status: "timedOut" as const, timeSeconds: 300, correctLines: 18, errors: 3 };
    const stopped = { ...finished, status: "stopped" as const, timeSeconds: 31, correctLines: 9, errors: 1 };
    const skipped = { ...stopped, code: 996 as const, timeSeconds: 12.5, correctLines: 6, errors: 0 };
    expect(scoreTable(scores(stopped, timedOut)).rows[3].cells).toEqual(["300", "18/24", "3", "Time limit"]);
    expect(scoreTable(scores(stopped, timedOut)).rows[1].cells).toEqual(["31", "9/24", "1", "Stopped"]);
    expect(scoreTable(scores(skipped, finished)).rows[1].cells).toEqual(["12.5", "6/24", "0", "Skipped (code 996)"]);
  });

  it("a part not given has blank numbers, and its code in the status if it has one", () => {
    const table = scoreTable(scores(notGiven, { status: "notGiven", code: 997 }));
    expect(table.rows[1].cells).toEqual(["", "", "", "Not given"]);
    expect(table.rows[3].cells).toEqual(["", "", "", "Not given (code 997)"]);
  });

  it("a sample not passed keeps its numbers; one never started is not given, with blank numbers", () => {
    const notPassed = { ...passed, passed: false, timeSeconds: 4.2, correctLines: 3, errors: 1 };
    const table = scoreTable({ ...scores(finished, finished), sampleA: notPassed, sampleB: null });
    expect(table.rows[0].cells).toEqual(["4.2", "3/7", "1", "Not passed"]);
    expect(table.rows[2].cells).toEqual(["", "", "", "Not given"]);
  });

  it("a sample saved before samples were scored shows only its status", () => {
    const table = scoreTable({ ...scores(finished, finished), sampleA: { passed: true } });
    expect(table.rows[0].cells).toEqual(["", "", "", "Passed"]);
  });
});

describe("Trail Making samples row", () => {
  it("both samples in one row", () => {
    expect(practiceRow({ ...scores(finished, finished), sampleB: null })).toEqual({
      label: "Samples",
      parts: ["A passed", "B not given"],
    });
  });

  it("a sample the clinician ended is not passed", () => {
    expect(practiceRow({ ...scores(finished, finished), sampleA: { passed: false } }).parts[0]).toBe("A not passed");
  });
});

describe("Trail Making CSV rows", () => {
  it("a row per page: status, time in seconds, lines, errors and code", () => {
    const partB = { ...finished, timeMs: 91300, timeSeconds: 91.3, errors: 1 };
    expect(csvRows(scores(finished, partB))).toEqual([
      { part: "Sample A", status: "passed", values: { "Time (s)": 23.4, Lines: 7, Errors: 1, Code: null } },
      { part: "Part A", status: "completed", values: { "Time (s)": 38, Lines: 24, Errors: 0, Code: null } },
      { part: "Sample B", status: "passed", values: { "Time (s)": 23.4, Lines: 7, Errors: 1, Code: null } },
      { part: "Part B", status: "completed", values: { "Time (s)": 91.3, Lines: 24, Errors: 1, Code: null } },
    ]);
  });

  it("a sample not passed or not given says so; without numbers its values are blank", () => {
    const rows = csvRows({ ...scores(finished, finished), sampleA: { passed: false }, sampleB: null });
    const blank = { "Time (s)": null, Lines: null, Errors: null, Code: null };
    expect(rows[0]).toEqual({ part: "Sample A", status: "not passed", values: blank });
    expect(rows[2]).toEqual({ part: "Sample B", status: "not given", values: blank });
  });

  it("a stopped or timed-out part says so, and keeps its time", () => {
    const partA = { ...finished, status: "stopped" as const, timeSeconds: 31, correctLines: 9, errors: 1 };
    const partB = { ...finished, status: "timedOut" as const, timeSeconds: 300, correctLines: 18, errors: 3 };
    const parts = csvRows(scores(partA, partB)).filter((row) => row.part.startsWith("Part"));
    expect(parts.map((row) => [row.status, row.values["Time (s)"]])).toEqual([
      ["stopped", 31],
      ["timed out", 300],
    ]);
  });

  it("a not-given part has only its code", () => {
    expect(csvRows(scores(finished, { status: "notGiven", code: 996 }))[3]).toEqual({
      part: "Part B",
      status: "not given",
      values: { "Time (s)": null, Lines: null, Errors: null, Code: 996 },
    });
  });

  it("a part skipped partway keeps its values and its code", () => {
    const partA = { ...finished, status: "stopped" as const, code: 996 as const, timeSeconds: 12.5, correctLines: 6 };
    expect(csvRows(scores(partA, finished))[1]).toEqual({
      part: "Part A",
      status: "stopped",
      values: { "Time (s)": 12.5, Lines: 6, Errors: 0, Code: 996 },
    });
  });

  it("every row has exactly the test's measures", () => {
    for (const row of [...csvRows(scores(finished, finished)), ...csvRows(scores(notGiven, notGiven))]) {
      expect(Object.keys(row.values)).toEqual(csvMeasures);
    }
  });
});

// While the test runs (ADR-048): the finished table's columns and rows, all dashes, no sheets. Each timed part's
// row names its key, so the dashboard can show the live counter in its Time cell.
describe("Trail Making table while running", () => {
  it("has every column and row, dashes throughout, no sheets, and the timed parts' keys", () => {
    const dashes = ["—", "—", "—", "—"];
    expect(emptyTable()).toEqual({
      columns: ["Time (s)", "Lines", "Errors", "Status"],
      rows: [
        { label: "Sample A", cells: dashes, note: null, sheet: null },
        { label: "Part A", cells: dashes, note: null, sheet: null, timedPart: "partA" },
        { label: "Sample B", cells: dashes, note: null, sheet: null },
        { label: "Part B", cells: dashes, note: null, sheet: null, timedPart: "partB" },
      ],
    });
  });

  it("has the finished table's columns", () => {
    expect(emptyTable().columns).toEqual(scoreTable(scores(finished, finished)).columns);
  });
});
