// The results list's search, date filter and grouping, newest first (roadmap 8.5).
// Plain functions: no React, no Supabase. The CSV (10.1) will reuse them, so it matches the screen.

// One test that ran, from a sequence_tests row with its client's code.
export type ResultRow = {
  id: string;
  clientCode: string;
  testId: string;
  status: "completed" | "stopped";
  completedAt: string; // ISO 8601, from the client's computer clock (ADR-028)
};

export type ListOptions = {
  search: string; // part of a client code, any capitals; "" matches every code
  fromDate: string; // "YYYY-MM-DD" from a date box, or "" for no limit
  toDate: string; // the same; both days are included
};

export type ClientGroup = { clientCode: string; results: ResultRow[] };

export function listResults(rows: readonly ResultRow[], options: ListOptions): ClientGroup[] {
  const search = options.search.trim().toUpperCase();

  const matching = rows.filter((row) => {
    const day = localDay(row.completedAt);
    return (
      row.clientCode.includes(search) &&
      (options.fromDate === "" || day >= options.fromDate) &&
      (options.toDate === "" || day <= options.toDate)
    );
  });

  // Newest first.
  const sorted = matching.toSorted((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));

  // Group in the order each client first appears, so the client with the newest result comes first.
  const groups = new Map<string, ResultRow[]>();
  for (const row of sorted) {
    const group = groups.get(row.clientCode);
    if (group) group.push(row);
    else groups.set(row.clientCode, [row]);
  }
  return Array.from(groups, ([clientCode, results]) => ({ clientCode, results }));
}

// The result's date in the clinician's own time zone, as "YYYY-MM-DD", to compare with a date box.
function localDay(isoText: string): string {
  const date = new Date(isoText);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
