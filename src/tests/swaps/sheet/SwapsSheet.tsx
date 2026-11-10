// Draws the saved sheet (SPEC: Recording): Form A as the test ended, with errors and corrections
// marked, and the recall answers below it. It draws with SymbolShape and form-layout.ts, so the
// sheet's symbols and positions can't differ from the screen's.

import { gridItems, keyNumbers, keyPrintedOrder, recallOrder } from "../scoring/form-a";
import {
  grayBoxes,
  grayLabelGap,
  grayLabelInset,
  gridSymbolSize,
  itemPosition,
  keyPosition,
  keySymbolSize,
  pageSize,
  recallPosition,
  recallSelectionSize,
  recallSymbolSize,
  selectionSize,
  visibleArea,
  type Point,
} from "../screen/form-layout";
import type { GridReplay } from "../scoring/score-grid";
import type { RecallReplay } from "../scoring/score-recall";
import type { Answers } from "../screen/selection";
import SymbolShape from "../screen/SymbolShape";

// The recall row sits below row 9, under its own label. The sheet is one letter-size page.
const recallRowY = 1105;
const recallLabel = { x: 96, y: 1040 };

// Replaced numbers sit in a small row under their symbol, each struck through.
const oldNumber = { below: 45, spacing: 16, fontSize: 18, strikeHalfWidth: 7 };

export type SheetAnswers = {
  // The demo and practice numbers, as they stood on screen.
  shown: Answers;
  history: GridReplay["history"];
  recall: RecallReplay["finalAnswers"];
};

// Marks a wrong final answer.
function WrongBox({ x, y, size }: Point & { size: number }) {
  return <rect x={x - size / 2} y={y - size / 2} width={size} height={size} strokeWidth={3} className="fill-none stroke-error" />;
}

function OldNumbers({ x, y, numbers }: Point & { numbers: readonly number[] }) {
  return numbers.map((number, index) => {
    const centerX = x + (index - (numbers.length - 1) / 2) * oldNumber.spacing;
    const centerY = y + oldNumber.below;

    return (
      <g key={index}>
        <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="central" fontSize={oldNumber.fontSize}>
          {number}
        </text>
        <line
          x1={centerX - oldNumber.strikeHalfWidth}
          y1={centerY}
          x2={centerX + oldNumber.strikeHalfWidth}
          y2={centerY}
          strokeWidth={1.5}
          className="stroke-ink"
        />
      </g>
    );
  });
}

function SwapsSheet({ shown, history, recall }: SheetAnswers) {
  return (
    <svg viewBox={`0 ${visibleArea.y} ${pageSize.width} ${pageSize.height}`} className="fill-ink">
      {keyPrintedOrder.map((symbol, index) => (
        <SymbolShape key={symbol} symbol={symbol} {...keyPosition(index)} size={keySymbolSize} number={keyNumbers[symbol]} />
      ))}

      {grayBoxes.map(({ label, ...box }) => (
        <g key={label}>
          <rect {...box} strokeWidth={1.5} className="fill-form-gray stroke-ink" />
          <text x={box.x + grayLabelInset} y={box.y - grayLabelGap} dominantBaseline="central" fontSize={20}>
            {label}
          </text>
        </g>
      ))}

      {gridItems.map(({ item, symbol, part, correctNumber }) => {
        const numbers = history.get(item) ?? [];
        const final = part === "test" ? (numbers.at(-1) ?? null) : (shown.get(item) ?? null);
        const position = itemPosition(item);

        return (
          <g key={item}>
            <SymbolShape symbol={symbol} {...position} size={gridSymbolSize} number={final} solid={part === "practice"} />
            {part === "test" && final !== null && final !== correctNumber && <WrongBox {...position} size={selectionSize} />}
            <OldNumbers {...position} numbers={numbers.slice(0, -1)} />
          </g>
        );
      })}

      <text {...recallLabel} dominantBaseline="central" fontSize={20}>
        Recall
      </text>

      {recallOrder.map((symbol, index) => {
        const number = recall.get(symbol) ?? null;
        const position = { x: recallPosition(index + 1).x, y: recallRowY };

        return (
          <g key={symbol}>
            <SymbolShape symbol={symbol} {...position} size={recallSymbolSize} number={number} />
            {number !== null && number !== keyNumbers[symbol] && <WrongBox {...position} size={recallSelectionSize} />}
          </g>
        );
      })}
    </svg>
  );
}

export default SwapsSheet;
