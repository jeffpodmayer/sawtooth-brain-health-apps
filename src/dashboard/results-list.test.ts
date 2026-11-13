// Tests for the results list's search, date filter, sort and grouping (roadmap 8.5).
// Times are 19:00 UTC (late morning in Washington), so each falls on the same date in any US time zone.

import { describe, expect, it } from "vitest";
import { listResults, type ClientGroup, type ListOptions, type ResultRow } from "./results-list";

const rows: ResultRow[] = [
  { id: "1", clientId: "c42", clientCode: "SBH-0042", testId: "trail-making", status: "completed", completedAt: "2026-11-02T19:00:00Z" },
  { id: "2", clientId: "c42", clientCode: "SBH-0042", testId: "swaps", status: "stopped", completedAt: "2026-11-09T19:00:00Z" },
  { id: "3", clientId: "c07", clientCode: "SBH-0007", testId: "trail-making", status: "completed", completedAt: "2026-11-05T19:00:00Z" },
  { id: "4", clientId: "c1", clientCode: "ABC-1", testId: "swaps", status: "completed", completedAt: "2026-10-28T19:00:00Z" },
];

const everything: ListOptions = { search: "", fromDate: "", toDate: "" };

// Each group as [client code, result ids in order], so expectations are easy to read.
function shape(groups: ClientGroup[]) {
  return groups.map((group) => [group.clientCode, group.results.map((result) => result.id)]);
}

describe("sorting and grouping", () => {
  it("clients by their newest result, results newest first", () => {
    expect(shape(listResults(rows, everything))).toEqual([
      ["SBH-0042", ["2", "1"]],
      ["SBH-0007", ["3"]],
      ["ABC-1", ["4"]],
    ]);
  });

  it("leaves the list it was given unchanged", () => {
    const copy = [...rows];
    listResults(rows, everything);
    expect(rows).toEqual(copy);
  });
});

describe("searching by client code", () => {
  it("matches part of a code", () => {
    expect(shape(listResults(rows, { ...everything, search: "0042" }))).toEqual([["SBH-0042", ["2", "1"]]]);
  });

  it("ignores capitals and spaces around the search", () => {
    expect(shape(listResults(rows, { ...everything, search: "  sbh " }))).toEqual([
      ["SBH-0042", ["2", "1"]],
      ["SBH-0007", ["3"]],
    ]);
  });

  it("gives an empty list when nothing matches", () => {
    expect(listResults(rows, { ...everything, search: "XYZ" })).toEqual([]);
  });
});

describe("filtering by date", () => {
  it("a from date includes that day and later", () => {
    expect(shape(listResults(rows, { ...everything, fromDate: "2026-11-05" }))).toEqual([
      ["SBH-0042", ["2"]],
      ["SBH-0007", ["3"]],
    ]);
  });

  it("a to date includes that day and earlier", () => {
    expect(shape(listResults(rows, { ...everything, toDate: "2026-11-05" }))).toEqual([
      ["SBH-0007", ["3"]],
      ["SBH-0042", ["1"]],
      ["ABC-1", ["4"]],
    ]);
  });

  it("from and to together keep only the days between, both included", () => {
    expect(shape(listResults(rows, { ...everything, fromDate: "2026-11-02", toDate: "2026-11-05" }))).toEqual([
      ["SBH-0007", ["3"]],
      ["SBH-0042", ["1"]],
    ]);
  });

  it("a from date after the to date gives an empty list", () => {
    expect(listResults(rows, { ...everything, fromDate: "2026-11-09", toDate: "2026-11-02" })).toEqual([]);
  });

  it("works together with a search", () => {
    expect(shape(listResults(rows, { ...everything, search: "SBH", toDate: "2026-11-05" }))).toEqual([
      ["SBH-0007", ["3"]],
      ["SBH-0042", ["1"]],
    ]);
  });
});
