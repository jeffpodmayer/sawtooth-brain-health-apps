// Placeholder shapes while a dashboard page's data loads, laid out like what's coming, so nothing jumps when
// it lands. Grey bars that pulse gently; the pulse stops when the computer asks for reduced motion. Screen
// readers hear "Loading" once, from the wrapper, and never the shapes. The client's screens keep plain text.

import type { ReactNode } from "react";

// One placeholder shape. Each screen gives it a size (and a different rounding, if it needs one).
function Bar({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-md bg-line motion-reduce:animate-none ${className}`}
    />
  );
}

// Announces "Loading" once, politely, around the shapes.
function Loading({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}

// The Clients list: its heading row and six rows (client ID, last visit, arrow), each as tall as a real row.
export function ClientsListSkeleton() {
  return (
    <Loading className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
      <div className="grid grid-cols-[1fr_1fr_3rem] border-b border-line px-6 py-3">
        <Bar className="h-5 w-20" />
        <Bar className="h-5 w-20" />
      </div>
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          className="grid h-14 grid-cols-[1fr_1fr_3rem] items-center border-b border-line px-6 last:border-b-0"
        >
          <Bar className="h-5 w-16" />
          <Bar className="h-5 w-28" />
          <Bar className="size-5 justify-self-end" />
        </div>
      ))}
    </Loading>
  );
}

// A client's page: two visits (arrow, date, "Tests:"), the first opened to show a test's band and its rows.
export function ClientPageSkeleton() {
  return (
    <Loading className="mt-8 overflow-hidden rounded-xl border border-line bg-surface">
      {[0, 1].map((visit) => (
        <div key={visit} className="border-b border-line last:border-b-0">
          <div className="flex items-center gap-4 px-6 py-4">
            <Bar className="size-5" />
            <div className="flex-1">
              <Bar className="h-5 w-32" />
              <Bar className="mt-2 h-4 w-52" />
            </div>
          </div>
          {visit === 0 && (
            <div className="pb-2">
              <div className="flex h-12 items-center bg-band pl-16">
                <Bar className="h-5 w-28" />
              </div>
              <div className="pl-16 pr-6">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="flex h-14 items-center gap-16 border-b border-line">
                    <Bar className="h-5 w-24" />
                    <Bar className="h-5 w-12" />
                    <Bar className="h-5 w-12" />
                    <Bar className="h-5 w-10" />
                    <Bar className="h-5 w-24" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </Loading>
  );
}

// New Test Sequence's list of tests: two rows (checkbox, test name).
export function TestListSkeleton() {
  return (
    <Loading className="mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line">
      {[0, 1].map((row) => (
        <div key={row} className="flex h-14 items-center gap-4 bg-surface px-4">
          <Bar className="size-6" />
          <Bar className="h-5 w-32" />
        </div>
      ))}
    </Loading>
  );
}

// A test's notes: one short note bubble.
export function NotesSkeleton() {
  return (
    <Loading>
      <Bar className="h-12 w-2/3 rounded-2xl" />
    </Loading>
  );
}
