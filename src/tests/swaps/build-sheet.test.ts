import { expect, it } from "vitest";
import { buildSheet } from "./build-sheet";

// Item 7 (a triangle, 1) was changed from 2 to 1. Item 8 (a pentagon, 4) was left as 5.
// On recall, square (5) was answered 2 and flag (6) was answered 6.
const sheet = buildSheet({
  shown: new Map([[1, 7], [2, 1], [3, 6], [4, 2], [5, 7], [6, 5]]),
  history: new Map([[7, [2, 1]], [8, [5]]]),
  recall: new Map([["square", 2], ["flag", 6]]),
});

function count(text: string) {
  return sheet.split(text).length - 1;
}

it("is a stand-alone SVG with the font inside", () => {
  expect(sheet.startsWith('<svg xmlns="http://www.w3.org/2000/svg" ')).toBe(true);
  expect(sheet).toContain("@font-face");
  expect(sheet).toContain("data:font/woff2;base64,");
});

it("boxes each wrong final answer, in the grid and on recall", () => {
  // Only the wrong-answer box is drawn 3 wide: item 8 and the recall square.
  expect(count('stroke-width="3"')).toBe(2);
});

it("strikes through each replaced number", () => {
  // The only lines on the sheet are strike-throughs: item 7's old 2.
  expect(count("<line")).toBe(1);
});

// The symbols are styled with Tailwind, which doesn't exist in a saved file. If this fails,
// the sheet uses a new class: define it in sheetStyle.
it("uses only classes the sheet defines", () => {
  const classes = new Set([...sheet.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(" ")));

  expect([...classes].sort()).toEqual(["fill-form-gray", "fill-ink", "fill-none", "fill-white", "stroke-error", "stroke-ink"]);
});
