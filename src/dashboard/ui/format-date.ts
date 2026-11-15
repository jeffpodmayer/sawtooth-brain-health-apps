// "Nov 11, 2026", in the clinician's own time zone.
export function formatDate(isoText: string): string {
  return new Date(isoText).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// "Nov 11, 2026, 3:42 PM", in the clinician's own time zone.
export function formatDateTime(isoText: string): string {
  return new Date(isoText).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}
