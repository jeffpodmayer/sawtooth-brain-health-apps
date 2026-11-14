import { describe, expect, it } from "vitest";
import { fitOnPage, svgSize } from "./sheet-page";

describe("fitting a sheet on a Letter page", () => {
  it("a portrait sheet fills the space under the heading, centered across the page", () => {
    // 850 × 1100 (both tests' sheets): the height limits it, 9.5 in under the heading.
    const place = fitOnPage(850, 1100);
    expect(place.orientation).toBe("portrait");
    expect(place.height).toBeCloseTo(9.5);
    expect(place.width).toBeCloseTo(9.5 * (850 / 1100));
    expect(place.y).toBe(1);
    expect(place.x + place.width / 2).toBeCloseTo(8.5 / 2);
  });

  it("a wide sheet turns the page sideways", () => {
    const place = fitOnPage(1100, 850);
    expect(place.orientation).toBe("landscape");
    expect(place.x).toBeGreaterThanOrEqual(0.5);
    expect(place.x + place.width).toBeLessThanOrEqual(11 - 0.5 + 1e-9);
    expect(place.y + place.height).toBeLessThanOrEqual(8.5 - 0.5 + 1e-9);
  });

  it("each extra line of text above the sheet moves it down a line, and it still fits", () => {
    const place = fitOnPage(850, 1100, 3);
    expect(place.y).toBeCloseTo(1 + 2 * 0.22);
    expect(place.y + place.height).toBeCloseTo(11 - 0.5);
  });

  it("never leaves the margins, whatever the shape", () => {
    for (const [width, height] of [[100, 5000], [5000, 100], [1, 1]]) {
      const place = fitOnPage(width, height);
      const [pageWidth, pageHeight] = place.orientation === "portrait" ? [8.5, 11] : [11, 8.5];
      expect(place.x).toBeGreaterThanOrEqual(0.5 - 1e-9);
      expect(place.x + place.width).toBeLessThanOrEqual(pageWidth - 0.5 + 1e-9);
      expect(place.y + place.height).toBeLessThanOrEqual(pageHeight - 0.5 + 1e-9);
    }
  });
});

describe("reading a sheet's size", () => {
  it("takes the width and height from the viewBox", () => {
    expect(svgSize('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 65 850 1100" class="fill-ink"><g/></svg>')).toEqual({
      width: 850,
      height: 1100,
    });
  });

  it("anything else isn't a sheet", () => {
    expect(svgSize("<svg><g/></svg>")).toBeNull();
    expect(svgSize('<svg viewBox="0 0 0 1100"></svg>')).toBeNull();
    expect(svgSize("not a sheet")).toBeNull();
  });
});
