// Where everything sits on each page, placed by eye from the NACC Form C2 scans (ADR-010).
// Data only. Units are a letter-size page at 100 units to the inch.

export const pageSize = { width: 850, height: 1100 } as const;
export const circleRadius = 31;

type Point = { x: number; y: number };
type Circle = Point & { id: string };
type Box = Point & { width: number; height: number };

export type PageLayout = {
  circles: readonly Circle[];
  beginLabel: Point;
  endLabel: Point;
  box?: Box;
};

export const pageLayouts: Record<"sampleA" | "partA" | "sampleB" | "partB", PageLayout> = {
  sampleA: {
    box: { x: 158, y: 380, width: 530, height: 350 },
    beginLabel: { x: 401, y: 556 },
    endLabel: { x: 361, y: 450 },
    circles: [
      { id: "1", x: 407, y: 602 },
      { id: "2", x: 489, y: 455 },
      { id: "3", x: 625, y: 612 },
      { id: "4", x: 521, y: 549 },
      { id: "5", x: 531, y: 665 },
      { id: "6", x: 242, y: 678 },
      { id: "7", x: 221, y: 530 },
      { id: "8", x: 366, y: 497 },
    ],
  },

  partA: {
    beginLabel: { x: 585, y: 582 },
    endLabel: { x: 681, y: 914 },
    circles: [
      { id: "1", x: 581, y: 629 },
      { id: "2", x: 395, y: 776 },
      { id: "3", x: 655, y: 815 },
      { id: "4", x: 621, y: 410 },
      { id: "5", x: 362, y: 453 },
      { id: "6", x: 487, y: 535 },
      { id: "7", x: 333, y: 641 },
      { id: "8", x: 200, y: 829 },
      { id: "9", x: 252, y: 943 },
      { id: "10", x: 313, y: 817 },
      { id: "11", x: 541, y: 973 },
      { id: "12", x: 118, y: 1018 },
      { id: "13", x: 187, y: 538 },
      { id: "14", x: 95, y: 674 },
      { id: "15", x: 91, y: 119 },
      { id: "16", x: 186, y: 287 },
      { id: "17", x: 433, y: 87 },
      { id: "18", x: 404, y: 327 },
      { id: "19", x: 662, y: 179 },
      { id: "20", x: 516, y: 180 },
      { id: "21", x: 735, y: 74 },
      { id: "22", x: 736, y: 388 },
      { id: "23", x: 761, y: 991 },
      { id: "24", x: 716, y: 597 },
      { id: "25", x: 676, y: 961 },
    ],
  },

  sampleB: {
    box: { x: 138, y: 421, width: 563, height: 345 },
    beginLabel: { x: 396, y: 594 },
    endLabel: { x: 354, y: 489 },
    circles: [
      { id: "1", x: 404, y: 641 },
      { id: "A", x: 512, y: 474 },
      { id: "2", x: 645, y: 641 },
      { id: "B", x: 523, y: 557 },
      { id: "3", x: 523, y: 723 },
      { id: "C", x: 250, y: 725 },
      { id: "4", x: 204, y: 485 },
      { id: "D", x: 360, y: 537 },
    ],
  },

  partB: {
    beginLabel: { x: 414, y: 438 },
    endLabel: { x: 91, y: 48 },
    circles: [
      { id: "1", x: 412, y: 483 },
      { id: "A", x: 581, y: 760 },
      { id: "2", x: 237, y: 862 },
      { id: "B", x: 353, y: 213 },
      { id: "3", x: 373, y: 363 },
      { id: "C", x: 551, y: 601 },
      { id: "4", x: 452, y: 183 },
      { id: "D", x: 659, y: 141 },
      { id: "5", x: 660, y: 512 },
      { id: "E", x: 691, y: 919 },
      { id: "6", x: 365, y: 871 },
      { id: "F", x: 168, y: 951 },
      { id: "7", x: 255, y: 472 },
      { id: "G", x: 166, y: 682 },
      { id: "8", x: 126, y: 193 },
      { id: "H", x: 166, y: 564 },
      { id: "9", x: 255, y: 144 },
      { id: "I", x: 540, y: 133 },
      { id: "10", x: 759, y: 81 },
      { id: "J", x: 700, y: 769 },
      { id: "11", x: 750, y: 989 },
      { id: "K", x: 79, y: 1003 },
      { id: "12", x: 78, y: 652 },
      { id: "L", x: 128, y: 881 },
      { id: "13", x: 98, y: 94 },
    ],
  },
};
