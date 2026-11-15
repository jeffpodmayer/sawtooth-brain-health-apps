// Where a sheet goes on its downloaded PDF page (roadmap 10.2): a US Letter page, 0.5 in margins, lines of
// text at the top (the heading and the scores), and the sheet as large as fits below them, centered across the
// page. Inches throughout.

export const margin = 0.5;
export const firstBaseline = 0.2; // from the top margin to the bottom of the first line of text
export const lineHeight = 0.22; // between lines of text
const gapBelowText = 0.3; // from the last line of text to the sheet

export type Placement = { orientation: "portrait" | "landscape"; x: number; y: number; width: number; height: number };

// width and height are the sheet's own units (its viewBox). textLines is how many lines of text go above it.
// A sheet wider than tall turns the page sideways.
export function fitOnPage(width: number, height: number, textLines = 1): Placement {
  const orientation = width > height ? "landscape" : "portrait";
  const [pageWidth, pageHeight] = orientation === "portrait" ? [8.5, 11] : [11, 8.5];
  const textSpace = firstBaseline + (textLines - 1) * lineHeight + gapBelowText;
  const spaceWidth = pageWidth - 2 * margin;
  const spaceHeight = pageHeight - 2 * margin - textSpace;
  const scale = Math.min(spaceWidth / width, spaceHeight / height);
  const drawnWidth = width * scale;
  return {
    orientation,
    x: (pageWidth - drawnWidth) / 2,
    y: margin + textSpace,
    width: drawnWidth,
    height: height * scale,
  };
}

// A sheet's size from the viewBox on its first <svg> tag ("x y width height"), or null if it has none.
export function svgSize(svgText: string): { width: number; height: number } | null {
  const viewBox = /^\s*<svg\b[^>]*\bviewBox="([^"]*)"/.exec(svgText)?.[1];
  if (viewBox === undefined) return null;
  const [, , width, height] = viewBox.trim().split(/[\s,]+/).map(Number);
  return width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height) ? { width, height } : null;
}
