import { describe, expect, it } from "vitest";
import type { GivenPartScore, TrailMakingScores } from "./scoring/score-part";
import { csvMeasures, csvRows, practiceRow, scoreTable } from "./summary";

const finished: GivenPartScore = {
  status: "completed", code: null, timeMs: 38000, timeSeconds: 38, correctLines: 24, correctClicks: 25, errors: 0,
};
const passed = { passed: true };

function scores(partA: TrailMakingScores["partA"], partB: TrailMakingScores["partB"]): TrailMakingScores {
  return { partA, partB, sampleA: passed, sampleB: passed };
}

describe("Trail Making score table", () => {
  it("one row per part, with its sheet: time, lines out of 24 and errors", () => {
    const partB = { ...finished, timeMs: 91300, timeSeconds: 91.3, errors: 1 };
    expect(scoreTable(scores(finished, partB))).toEqual({
      columns: ["Time", "Lines", "Errors"],
      rows: [
        { label: "Part A", cells: ["38 s", "24/24", "0"], note: null, sheet: "partA" },
        { label: "Part B", cells: ["91.3 s", "24/24", "1"], note: null, sheet: "partB" },
      ],
    });
  });

  it("a timed-out part shows the time limit", () => {
    const partB = { ...finished, status: "timedOut" as const, timeSeconds: 300, correctLines: 18, errors: 3 };
    expect(scoreTable(scores(finished, partB)).rows[1].cells).toEqual(["Time limit (300 s)", "18/24", "3"]);
  });

  it("a stopped part shows when it stopped, and the part after it is not given", () => {
    const partA = { ...finished, status: "stopped" as const, timeSeconds: 31, correctLines: 9, errors: 1 };
    expect(scoreTable(scores(partA, { status: "notGiven", code: null })).rows).toEqual([
      { label: "Part A", cells: ["Stopped at 31 s", "9/24", "1"], note: null, sheet: "partA" },
      { label: "Part B", cells: [], note: "Not given", sheet: "partB" },
    ]);
  });

  it("a not-given part with a code shows the code", () => {
    expect(scoreTable(scores(finished, { status: "notGiven", code: 996 })).rows[1]).toEqual({
      label: "Part B",
      cells: [],
      note: "Not given (code 996)",
      sheet: "partB",
    });
  });
});

describe("Trail Making samples row", () => {
  it("both samples in one row", () => {
    expect(practiceRow({ ...scores(finished, finished), sampleB: null })).toEqual({
      label: "Samples",
      parts: ["A passed", "B not reached"],
    });
  });

  it("a sample the clinician ended is not passed", () => {
    expect(practiceRow({ ...scores(finished, finished), sampleA: { passed: false } }).parts[0]).toBe("A not passed");
  });
});

describe("Trail Making CSV rows", () => {
  it("one row per part: status, time in seconds, lines, errors and code", () => {
    const partB = { ...finished, timeMs: 91300, timeSeconds: 91.3, errors: 1 };
    expect(csvRows(scores(finished, partB))).toEqual([
      { part: "Part A", status: "completed", values: { "Time (s)": 38, Lines: 24, Errors: 0, Code: null } },
      { part: "Part B", status: "completed", values: { "Time (s)": 91.3, Lines: 24, Errors: 1, Code: null } },
    ]);
  });

  it("a stopped or timed-out part says so, and keeps its time", () => {
    const partA = { ...finished, status: "stopped" as const, timeSeconds: 31, correctLines: 9, errors: 1 };
    const partB = { ...finished, status: "timedOut" as const, timeSeconds: 300, correctLines: 18, errors: 3 };
    expect(csvRows(scores(partA, partB)).map((row) => [row.status, row.values["Time (s)"]])).toEqual([
      ["stopped", 31],
      ["timed out", 300],
    ]);
  });

  it("a not-given part has only its code", () => {
    expect(csvRows(scores(finished, { status: "notGiven", code: 996 }))[1]).toEqual({
      part: "Part B",
      status: "not given",
      values: { "Time (s)": null, Lines: null, Errors: null, Code: 996 },
    });
  });

  it("every row has exactly the test's measures", () => {
    const notGiven = { status: "notGiven" as const, code: null };
    for (const row of [...csvRows(scores(finished, finished)), ...csvRows(scores(notGiven, notGiven))]) {
      expect(Object.keys(row.values)).toEqual(csvMeasures);
    }
  });
});
