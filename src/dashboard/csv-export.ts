// The CSV export (roadmap 10.1): one row per part of each completed or stopped test, grouped by client ID.
// Raw values only, from each test's own csvRows. Client IDs only, no other client details.

import Papa from "papaparse";
import type { CsvRow } from "../shared/test-module";

export type ExportClient = {
  code: string;
  sequences: { created_at: string; sequence_tests: { test_id: string; status: string; scores: unknown }[] }[];
};

export type CsvTest = { id: string; name: string; csvMeasures: string[]; csvRows: (scores: unknown) => CsvRow[] };

// A cell starting with one of these could run as a formula in Excel, so Papa Parse puts ' in front and it opens
// as text. Papa Parse's own pattern for this misses a cell with a line break, so it gets this one.
const formulaStart = /^[=+\-@\t\r]/;

export function buildCsv(clients: ExportClient[], tests: CsvTest[]): string {
  // Each test's columns once, in the order the tests are given.
  const measures = [...new Set(tests.flatMap((test) => test.csvMeasures))];
  const byId = new Map(tests.map((test) => [test.id, test]));
  const rows: (string | number | null)[][] = [];

  // Client IDs A to Z; each client's visits oldest first; tests in the visit's order.
  const sorted = [...clients].sort((a, b) => a.code.localeCompare(b.code));
  for (const client of sorted) {
    const visits = [...client.sequences].sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (const visit of visits) {
      const date = new Date(visit.created_at).toLocaleDateString("en-CA"); // 2026-11-10, in this computer's time zone
      for (const result of visit.sequence_tests) {
        const test = byId.get(result.test_id);
        const ran = result.status === "completed" || result.status === "stopped";
        if (!test || !ran || result.scores === null) continue;
        for (const part of test.csvRows(result.scores)) {
          rows.push([
            client.code,
            date,
            test.name,
            part.part,
            part.status,
            ...measures.map((name) => part.values[name] ?? null),
          ]);
        }
      }
    }
  }

  return Papa.unparse(
    { fields: ["Client ID", "Visit date", "Test", "Part", "Status", ...measures], data: rows },
    { escapeFormulae: formulaStart, newline: "\r\n" },
  );
}
