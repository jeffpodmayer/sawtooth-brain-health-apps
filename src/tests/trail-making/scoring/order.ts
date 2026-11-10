// The order of the circles on each page, as printed on the NACC Form C2 worksheets.
// Data only: the rules for judging a click live elsewhere.

export const expectedOrder = {
  sampleA: ["1", "2", "3", "4", "5", "6", "7", "8"],

  partA: [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13",
    "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25",
  ],

  sampleB: ["1", "A", "2", "B", "3", "C", "4", "D"],

  partB: [
    "1", "A", "2", "B", "3", "C", "4", "D", "5", "E", "6", "F", "7",
    "G", "8", "H", "9", "I", "10", "J", "11", "K", "12", "L", "13",
  ],
} as const;
