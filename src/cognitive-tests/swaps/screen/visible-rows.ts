// Which grid rows show on screen (SPEC: Screen and layout, Scrolling). Pure: same inputs, same answer.

import { gridRows } from "../scoring/form-a";

const columns = gridRows[0].length;
const visibleRows = 6;
const lastTopRow = gridRows.length - visibleRows + 1;

// Reaching this row of the visible rows moves the grid up one row.
const scrollAtVisibleRow = 5;

// Rows and items count from 1.
export function rowOf(item: number): number {
  return Math.ceil(item / columns);
}

// item is the next empty box, which only moves forward, so the grid never moves back.
export function topRowFor(item: number): number {
  const topRow = rowOf(item) - scrollAtVisibleRow + 2;

  return Math.min(Math.max(topRow, 1), lastTopRow);
}

export function isOnScreen(item: number, topRow: number): boolean {
  const row = rowOf(item);

  return row >= topRow && row < topRow + visibleRows;
}
