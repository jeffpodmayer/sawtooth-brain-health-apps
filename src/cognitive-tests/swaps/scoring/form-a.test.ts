import { describe, expect, it } from "vitest";
import { gridItems, gridRows, keyNumbers, keyPrintedOrder } from "./form-a";

function itemsIn(part: string) {
  return gridItems.filter((item) => item.part === part).map((item) => item.item);
}

describe("keyNumbers", () => {
  it("has the 7 symbols with their Form A numbers", () => {
    expect(keyNumbers).toEqual({
      triangle: 1,
      cross: 2,
      circle: 3,
      pentagon: 4,
      square: 5,
      flag: 6,
      heart: 7,
    });
  });
});

describe("keyPrintedOrder", () => {
  it("lists the symbols as printed on Form A", () => {
    expect(keyPrintedOrder).toEqual([
      "flag", "pentagon", "triangle", "square", "heart", "circle", "cross",
    ]);
  });

  it("has every symbol in the key exactly once", () => {
    expect([...keyPrintedOrder].sort()).toEqual(Object.keys(keyNumbers).sort());
  });
});

describe("gridRows", () => {
  it("matches Form A row by row", () => {
    expect(gridRows).toEqual([
      "HTFXHSTPC",
      "SFTPCHXSH",
      "CPSHTFCHX",
      "FXCXHPFTS",
      "PSHTFXTCP",
      "HFSCPTXFC",
      "XTCHTFPSP",
      "CHSFPTXCH",
      "TXPSCSHXF",
    ]);
  });
});

describe("gridItems", () => {
  it("numbers the items 1 to 81 in reading order", () => {
    expect(gridItems.map((item) => item.item)).toEqual(
      Array.from({ length: 81 }, (_, i) => i + 1),
    );
  });

  it("has 3 demo, 3 practice and 75 test items in the right places", () => {
    expect(itemsIn("demo")).toEqual([1, 2, 3]);
    expect(itemsIn("practice")).toEqual([4, 5, 6]);
    expect(itemsIn("test")).toEqual(
      Array.from({ length: 75 }, (_, i) => i + 7),
    );
  });

  // Row 1 contains all 7 symbols, so this checks every letter's conversion.
  it("turns row 1's letters into the right symbols and numbers", () => {
    const row1 = gridItems.slice(0, 9);
    expect(row1.map((item) => item.symbol)).toEqual([
      "heart", "triangle", "flag", "cross", "heart", "square", "triangle", "pentagon", "circle",
    ]);
    expect(row1.map((item) => item.correctNumber)).toEqual([7, 1, 6, 2, 7, 5, 1, 4, 3]);
  });

  it("gives the demo items the numbers filled in by script.json", () => {
    expect(gridItems.slice(0, 3).map((item) => item.correctNumber)).toEqual([7, 1, 6]);
  });

  it("gives the last item the right symbol and number", () => {
    expect(gridItems[80]).toEqual({
      item: 81,
      symbol: "flag",
      correctNumber: 6,
      part: "test",
    });
  });

  it("gives every item a real symbol and that symbol's number", () => {
    for (const item of gridItems) {
      expect(keyPrintedOrder).toContain(item.symbol);
      expect(item.correctNumber).toBe(keyNumbers[item.symbol]);
    }
  });
});
