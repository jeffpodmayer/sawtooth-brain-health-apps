// "Nov 11, 2026", in the clinician's own time zone.
export function formatDate(isoText: string): string {
  return new Date(isoText).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
