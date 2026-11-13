// A finished test's sheets, shown as images (roadmap 8.7). A sheet is SVG sent by the browser and
// could contain script, so it is shown only through <img>, which never runs it (ADR-041).
// The files are private: each gets a signed URL that works for 10 minutes. The URLs are marked as
// downloads, so "Open image in new tab" downloads the file instead of opening it as a page.

import { useEffect, useMemo, useState } from "react";
import type { Json } from "../../supabase/functions/_shared/database.types.ts";
import { sequenceTests } from "./sequence-tests";
import { supabase } from "./supabase";

const SIGNED_URL_SECONDS = 10 * 60;
const sheetLabels = new Map(sequenceTests.map((test) => [test.id, test.sheetLabels]));

type Sheet = { name: string; label: string; url: string | null };
type Load = { state: "loading" } | { state: "failed" } | { state: "loaded"; sheets: Sheet[] };

// sheets is {name: path}, written only by save-result (ADR-041). Anything else is skipped.
function sheetPaths(sheets: Json | null): [string, string][] {
  if (sheets === null || typeof sheets !== "object" || Array.isArray(sheets)) return [];
  return Object.entries(sheets).filter((entry): entry is [string, string] => typeof entry[1] === "string");
}

// The sheets in the test's own order. A name it doesn't list goes last, shown as it is.
function orderedSheets(testId: string, sheets: Json | null): { name: string; label: string; path: string }[] {
  const labels = sheetLabels.get(testId) ?? {};
  const order = Object.keys(labels);
  const rank = (name: string) => (order.includes(name) ? order.indexOf(name) : order.length);
  return sheetPaths(sheets)
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([name, path]) => ({ name, label: labels[name] ?? name, path }));
}

function SheetImages({ testId, testName, sheets }: { testId: string; testName: string; sheets: Json | null }) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const entries = useMemo(() => orderedSheets(testId, sheets), [testId, sheets]);

  useEffect(() => {
    if (entries.length === 0) return; // nothing to fetch
    let cancelled = false;
    supabase.storage
      .from("sheets")
      .createSignedUrls(
        entries.map((entry) => entry.path),
        SIGNED_URL_SECONDS,
        { download: true },
      )
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoad({ state: "failed" });
          return;
        }
        const urls = new Map(data.map((item) => [item.path, item.error ? null : item.signedUrl]));
        setLoad({
          state: "loaded",
          sheets: entries.map(({ name, label, path }) => ({ name, label, url: urls.get(path) ?? null })),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [entries]);

  return (
    <>
      <h3 className="mt-6 text-xl font-bold">Sheets</h3>
      {entries.length === 0 && <p className="mt-2">No sheets were saved for this test.</p>}
      {entries.length > 0 && load.state === "loading" && <p className="mt-2">Loading sheets…</p>}
      {entries.length > 0 && load.state === "failed" && (
        <p role="alert" className="mt-2">
          Couldn't load the sheets. Close Details and open it again to try again.
        </p>
      )}
      {entries.length > 0 &&
        load.state === "loaded" &&
        load.sheets.map((sheet) => (
          <figure key={sheet.name} className="mt-4">
            <figcaption className="font-bold">{sheet.label}</figcaption>
            {sheet.url ? (
              <img
                src={sheet.url}
                alt={`${testName}, ${sheet.label}`}
                className="mt-2 w-full max-w-2xl border border-form-gray bg-white"
              />
            ) : (
              <p className="mt-2">Couldn't load this sheet.</p>
            )}
          </figure>
        ))}
    </>
  );
}

export default SheetImages;
