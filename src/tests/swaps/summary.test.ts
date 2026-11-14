import { describe, expect, it } from "vitest";
import type { GivenGridScore, SwapsScores } from "./scoring/score-grid";
import { csvMeasures, csvRows, practiceRow, scoreTable } from "./summary";

const timedOut: GivenGridScore = { status: "timedOut", timeMs: 60000, attempted: 24, correct: 23, errors: 1, corrections: 1 };
const practice = { wrongAnswers: 0 };

function scores(test: SwapsScores["test"], recall: SwapsScores["recall"]): SwapsScores {
  return { test, recall, practice };
}

const recallDone = { status: "completed" as const, correct: 5, blank: 1 };

describe("SWAPS score table", () => {
  it("one table for test and recall; recall has only Correct, with blanks as a note, and no sheet", () => {
    expect(scoreTable(scores(timedOut, recallDone))).toEqual({
      columns: ["Correct", "Tried", "Errors", "Corrections", "Time"],
      rows: [
        { label: "Test", cells: ["23/75", "24", "1", "1", "Time limit (60 s)"], note: null, sheet: "sheet" },
        { label: "Recall", cells: ["5/7"], note: "1 blank", sheet: null },
      ],
    });
  });

  it("a stopped test shows when it stopped, and recall is not given", () => {
    const test = { ...timedOut, status: "stopped" as const, timeMs: 31000 };
    expect(scoreTable(scores(test, { status: "notGiven" })).rows).toEqual([
      { label: "Test", cells: ["23/75", "24", "1", "1", "Stopped at 31 s"], note: null, sheet: "sheet" },
      { label: "Recall", cells: [], note: "Not given", sheet: null },
    ]);
  });

  it("a test finished early shows just its time", () => {
    const test = { ...timedOut, status: "completed" as const, correct: 75, attempted: 75, timeMs: 52400 };
    expect(scoreTable(scores(test, recallDone)).rows[0].cells.at(-1)).toBe("52.4 s");
  });

  it("a test not given keeps its sheet name and says so", () => {
    expect(scoreTable(scores({ status: "notGiven" }, { status: "notGiven" })).rows[0]).toEqual({
      label: "Test",
      cells: [],
      note: "Not given",
      sheet: "sheet",
    });
  });

  it("a stopped recall says so in its note", () => {
    expect(scoreTable(scores(timedOut, { ...recallDone, status: "stopped" })).rows[1]).toEqual({
      label: "Recall",
      cells: ["5/7"],
      note: "1 blank · stopped",
      sheet: null,
    });
  });
});

describe("SWAPS practice row", () => {
  it("wrong practice answers, not scored", () => {
    const withPractice = { ...scores(timedOut, recallDone), practice: { wrongAnswers: 2 } };
    expect(practiceRow(withPractice)).toEqual({ label: "Practice", parts: ["2 wrong answers", "not scored"] });
  });

  it("one wrong answer is singular", () => {
    const withPractice = { ...scores(timedOut, recallDone), practice: { wrongAnswers: 1 } };
    expect(practiceRow(withPractice).parts[0]).toBe("1 wrong answer");
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
