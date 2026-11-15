import { expect, it } from "vitest";
import { buildSheet } from "./build-sheet";
import { pageLayouts } from "../screen/page-layouts";

const sheet = buildSheet(pageLayouts.partA, ["1", "2", "3"], [{ from: "3", to: "7" }]);

function count(text: string) {
  return sheet.split(text).length - 1;
}

it("is a stand-alone SVG with the font inside", () => {
  expect(sheet.startsWith('<svg xmlns="http://www.w3.org/2000/svg" ')).toBe(true);
  expect(sheet).toContain("@font-face");
  expect(sheet).toContain("data:font/woff2;base64,");
});

it("draws every circle", () => {
  expect(count("<circle")).toBe(25);
});

it("draws the correct lines and each wrong line with its slash", () => {
  // Two correct lines, then one wrong line plus its slash.
  expect(count("<line")).toBe(4);
});

it("has no arrow", () => {
  expect(count("<polygon")).toBe(0);
});

// TrailPage is styled with Tailwind, which doesn't exist in a saved file. If this fails,
// TrailPage uses a new class: define it in sheetStyle, or add it here if it only matters on screen.
it("uses only classes the sheet defines or that only matter on screen", () => {
  const classes = new Set([...sheet.matchAll(/class="([^"]*)"/g)].flatMap((match) => match[1].split(" ")));

  expect([...classes].sort()).toEqual([
    "block",
    "cursor-default",
    "fill-ink",
    "fill-none",
    "h-screen",
    "select-none",
    "stroke-ink",
    "w-screen",
  ]);
});
