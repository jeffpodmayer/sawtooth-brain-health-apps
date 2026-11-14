import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import type { CsvRow } from "../shared/test-module";
import { buildCsv, type CsvTest, type ExportClient } from "./csv-export";

// Two fake tests: one part each, sharing the "Time (s)" column.
const tests: CsvTest[] = [
  {
    id: "a",
    name: "Test A",
    csvMeasures: ["Time (s)", "Lines"],
    csvRows: (scores) => [{ part: "Part 1", status: "completed", values: scores as CsvRow["values"] }],
  },
  {
    id: "b",
    name: "Test B",
    csvMeasures: ["Correct", "Time (s)"],
    csvRows: (scores) => [{ part: "Test", status: "stopped", values: scores as CsvRow["values"] }],
  },
];

// Midday UTC, so the date is the same in any US time zone.
const visit = (day: string, sequence_tests: ExportClient["sequences"][number]["sequence_tests"]) => ({
  created_at: `${day}T19:00:00Z`,
  sequence_tests,
});

const lines = (csv: string) => csv.split("\r\n");

describe("CSV export", () => {
  it("a header with each test's columns once, then one row per part, blank under other tests' columns", () => {
    const clients = [
      {
        code: "AB-001",
        sequences: [
          visit("2026-11-10", [
            { test_id: "a", status: "completed", scores: { "Time (s)": 38, Lines: 24 } },
            { test_id: "b", status: "stopped", scores: { Correct: 5, "Time (s)": 31.3 } },
          ]),
        ],
      },
    ];
    expect(lines(buildCsv(clients, tests))).toEqual([
      "Client ID,Visit date,Test,Part,Status,Time (s),Lines,Correct",
      "AB-001,2026-11-10,Test A,Part 1,completed,38,24,",
      "AB-001,2026-11-10,Test B,Test,stopped,31.3,,5",
    ]);
  });

  it("grouped by client ID A to Z, each client's visits oldest first", () => {
    const result = { test_id: "a", status: "completed", scores: { "Time (s)": 1, Lines: 1 } };
    const clients = [
      { code: "ZZ-001", sequences: [visit("2026-11-01", [result])] },
      { code: "AB-001", sequences: [visit("2026-11-12", [result]), visit("2026-11-02", [result])] },
    ];
    expect(lines(buildCsv(clients, tests)).slice(1).map((line) => line.split(",").slice(0, 2).join(" "))).toEqual([
      "AB-001 2026-11-02",
      "AB-001 2026-11-12",
      "ZZ-001 2026-11-01",
    ]);
  });

  it("leaves out tests not completed or stopped, with no scores, or unknown to the app", () => {
    const scores = { "Time (s)": 1, Lines: 1 };
    const clients = [
      {
        code: "AB-001",
        sequences: [
          visit("2026-11-10", [
            { test_id: "a", status: "pending", scores: null },
            { test_id: "a", status: "not_given", scores: null },
            { test_id: "a", status: "completed", scores: null },
            { test_id: "old-test", status: "completed", scores },
          ]),
        ],
      },
    ];
    // Header only (Papa Parse ends it with a line break).
    expect(lines(buildCsv(clients, tests))).toEqual(["Client ID,Visit date,Test,Part,Status,Time (s),Lines,Correct", ""]);
  });

  it("a cell that could run as a formula opens as text in Excel, numbers don't change", () => {
    const risky = ['=HYPERLINK("x")', "+1", "-1", "@SUM(A1)", "\tx", "\rx", "=1\n=2"];
    const clients = risky.map((code) => ({
      code,
      sequences: [visit("2026-11-10", [{ test_id: "a", status: "completed", scores: { "Time (s)": -5, Lines: 0 } }])],
    }));
    const rows = Papa.parse<string[]>(buildCsv(clients, tests)).data.slice(1);
    expect(rows.map((row) => row[0]).sort()).toEqual(risky.map((code) => `'${code}`).sort());
    expect(rows.every((row) => row[5] === "-5")).toBe(true);
  });

  it("no results gives just the header", () => {
    // Papa Parse ends the header with a line break when no rows follow; Excel ignores it.
    expect(lines(buildCsv([], tests))).toEqual(["Client ID,Visit date,Test,Part,Status,Time (s),Lines,Correct", ""]);
  });
});
