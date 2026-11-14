// A saved sheet as a one-page PDF for download (roadmap 10.2): a heading with the client ID, test, sheet and
// date, the sheet's score lines, then the sheet as large as fits on a Letter page. The SVG came from the
// client's browser and could contain script, so it's only ever drawn as an image (ADR-041): a browser never
// runs script inside an <img>. It's drawn at 300 dots per inch, so it prints cleanly. Each test's build-sheet
// embeds the font in the SVG. jsPDF loads only when a sheet is downloaded, so the dashboard's first download
// doesn't grow.

import { firstBaseline, fitOnPage, lineHeight, margin, svgSize } from "./sheet-page";

const dotsPerInch = 300;

export async function sheetPdf(svgText: string, heading: string, scoreLines: string[]): Promise<Blob> {
  const size = svgSize(svgText);
  if (size === null) throw new Error("Not a sheet");

  const { jsPDF } = await import("jspdf");
  const { orientation } = fitOnPage(size.width, size.height);
  const pdf = new jsPDF({ orientation, unit: "in", format: "letter" });
  pdf.setProperties({ title: heading });
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor("#1B2430"); // the theme's ink (ADR-015)

  // The score lines wrap if wider than the page, so they're counted before placing the sheet.
  const textWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
  pdf.setFontSize(11);
  const wrapped = scoreLines.flatMap((line) => pdf.splitTextToSize(line, textWidth) as string[]);
  const place = fitOnPage(size.width, size.height, 1 + wrapped.length);

  pdf.setFontSize(12);
  pdf.text(heading, margin, margin + firstBaseline);
  pdf.setFontSize(11);
  wrapped.forEach((line, index) => pdf.text(line, margin, margin + firstBaseline + (index + 1) * lineHeight));

  pdf.addImage(await drawSheet(svgText, place.width, place.height), "PNG", place.x, place.y, place.width, place.height, undefined, "FAST");
  return pdf.output("blob");
}

// The sheet drawn on a canvas at print resolution, width and height in inches.
async function drawSheet(svgText: string, width: number, height: number): Promise<HTMLCanvasElement> {
  const pixelWidth = Math.round(width * dotsPerInch);
  const pixelHeight = Math.round(height * dotsPerInch);

  // Give the sheet a size in pixels, so every browser draws it at print resolution. DOMParser only reads the
  // text: nothing in it runs.
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  doc.documentElement.setAttribute("width", String(pixelWidth));
  doc.documentElement.setAttribute("height", String(pixelHeight));
  const svgFile = new Blob([new XMLSerializer().serializeToString(doc)], { type: "image/svg+xml" });

  // Drawn through an <img> from this page's own blob address, so the canvas can be read back.
  const url = URL.createObjectURL(svgFile);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("No canvas");
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, pixelWidth, pixelHeight);
    context.drawImage(image, 0, 0, pixelWidth, pixelHeight);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
