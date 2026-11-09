// Builds the saved sheet for a timed part (SPEC: Recording): the page as it ended, as one
// stand-alone SVG. It draws with TrailPage, so the sheet and the screen can't differ.

import boldFont from "@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2?inline";
import { renderToStaticMarkup } from "react-dom/server";
import type { PageLayout } from "./page-layouts";
import TrailPage, { type WrongLine } from "./TrailPage";

// A saved file has no Tailwind, so it defines the classes that affect how the page looks.
// The color is the theme's `ink` (ADR-015), written out because the file stands alone.
const sheetStyle = `
  @font-face { font-family: "Atkinson Hyperlegible"; font-weight: 700; src: url("${boldFont}") format("woff2"); }
  svg { font-family: "Atkinson Hyperlegible"; }
  .fill-ink { fill: #1B2430; }
  .stroke-ink { stroke: #1B2430; }
  .fill-none { fill: none; }
`;

export function buildSheet(layout: PageLayout, connected: readonly string[], wrongLines: readonly WrongLine[]): string {
  const page = renderToStaticMarkup(<TrailPage layout={layout} connected={connected} wrongLines={wrongLines} />);

  return page.replace(/^<svg ([^>]*)>/, `<svg xmlns="http://www.w3.org/2000/svg" $1><style>${sheetStyle}</style>`);
}
