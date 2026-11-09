// Where everything sits on SWAPS Form A, placed by eye from the form.
// Data only. Units are a letter-size page at 100 units to the inch.

export const pageSize = { width: 850, height: 1100 } as const;
export const keySymbolSize = 43;
export const gridSymbolSize = 46;
export const selectionSize = 62;

export type Point = { x: number; y: number };

const key = { firstX: 202, y: 140, spacing: 75 };
const grid = { firstY: 249, rowSpacing: 90, columnX: [128, 199, 274, 349, 421, 498, 573, 648, 726] };

// Row 1's two gray boxes, side by side, with their printed labels above them.
export const grayBoxes = [
  { label: "Demo", x: 96, y: 217, width: 216, height: 66 },
  { label: "Practice", x: 312, y: 217, width: 216, height: 66 },
] as const;

export const grayLabelInset = 12;
export const grayLabelGap = 13;

// The part of the page that shows: the key and six grid rows. The grid slides inside its window.
export const visibleArea = { y: 65, height: 685 } as const;
export const gridWindow = { y: 194, height: 550 } as const;
export const scrollMs = 600;

// How far the grid has moved up when topRow is the row at the top of its window.
export function scrollOffset(topRow: number): number {
  return (topRow - 1) * grid.rowSpacing;
}

// index counts along the key from 0, in printed order.
export function keyPosition(index: number): Point {
  return { x: key.firstX + index * key.spacing, y: key.y };
}

// item counts from 1, left to right, top to bottom.
export function itemPosition(item: number): Point {
  const index = item - 1;
  const columns = grid.columnX.length;

  return {
    x: grid.columnX[index % columns],
    y: grid.firstY + Math.floor(index / columns) * grid.rowSpacing,
  };
}
