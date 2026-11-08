// The key and grid as printed on SWAPS Form A.
// Data only: the rules for scoring an answer live elsewhere.

export const keyNumbers = {
  triangle: 1,
  cross: 2,
  circle: 3,
  pentagon: 4,
  square: 5,
  flag: 6,
  heart: 7,
} as const;

export type SwapsSymbol = keyof typeof keyNumbers;

export const keyPrintedOrder = [
  "flag", "pentagon", "triangle", "square", "heart", "circle", "cross",
] as const satisfies readonly SwapsSymbol[];

// F flag, P pentagon, T triangle, S square, H heart, C circle, X cross.
export const gridRows = [
  "HTFXHSTPC",
  "SFTPCHXSH",
  "CPSHTFCHX",
  "FXCXHPFTS",
  "PSHTFXTCP",
  "HFSCPTXFC",
  "XTCHTFPSP",
  "CHSFPTXCH",
  "TXPSCSHXF",
] as const;

const symbolForLetter: Record<string, SwapsSymbol> = {
  F: "flag",
  P: "pentagon",
  T: "triangle",
  S: "square",
  H: "heart",
  C: "circle",
  X: "cross",
};

export type GridPart = "demo" | "practice" | "test";

export type GridItem = {
  item: number;
  symbol: SwapsSymbol;
  correctNumber: number;
  part: GridPart;
};

function partOf(item: number): GridPart {
  if (item <= 3) return "demo";
  if (item <= 6) return "practice";
  return "test";
}

export const gridItems: readonly GridItem[] = [...gridRows.join("")].map(
  (letter, index) => {
    const item = index + 1;
    const symbol = symbolForLetter[letter];
    return { item, symbol, correctNumber: keyNumbers[symbol], part: partOf(item) };
  },
);
