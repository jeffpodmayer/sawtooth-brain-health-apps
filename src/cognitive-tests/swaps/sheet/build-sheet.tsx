// Builds the saved sheet (SPEC: Recording) as one stand-alone SVG, drawn by SwapsSheet.

import regularFont from "@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2?inline";
import { renderToStaticMarkup } from "react-dom/server";
import SwapsSheet, { type SheetAnswers } from "./SwapsSheet";

// A saved file has no Tailwind, so it defines the classes that affect how the page looks.
// The colors are the theme's (ADR-015), written out because the file stands alone.
const sheetStyle = `
  @font-face { font-family: "Atkinson Hyperlegible"; font-weight: 400; src: url("${regularFont}") format("woff2"); }
  svg { font-family: "Atkinson Hyperlegible"; }
  .fill-ink { fill: #1B2430; }
  .stroke-ink { stroke: #1B2430; }
  .fill-none { fill: none; }
  .fill-white { fill: #FFFFFF; }
  .fill-form-gray { fill: #BFBFBF; }
  .stroke-error { stroke: #B42318; }
`;

export function buildSheet(answers: SheetAnswers): string {
  const page = renderToStaticMarkup(<SwapsSheet {...answers} />);

  return page.replace(/^<svg ([^>]*)>/, `<svg xmlns="http://www.w3.org/2000/svg" $1><style>${sheetStyle}</style>`);
}
