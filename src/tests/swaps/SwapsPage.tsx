// Draws SWAPS Form A: the key, the grid and row 1's two gray boxes. The viewBox matches the page
// in form-layout.ts, so the browser scales the whole page to fit the screen.

import type { PointerEvent } from "react";
import { gridItems, keyNumbers, keyPrintedOrder } from "./form-a";
import {
  grayBoxes,
  grayLabelGap,
  grayLabelInset,
  gridSymbolSize,
  itemPosition,
  keyPosition,
  keySymbolSize,
  pageSize,
  selectionSize,
} from "./form-layout";
import type { Answers } from "./selection";
import SymbolShape from "./SymbolShape";

const noAnswers: Answers = new Map();

type SwapsPageProps = {
  answers?: Answers;
  selected?: number | null;
  onItemPress?: (item: number) => void;
};

// A square around an item, the same size for the outline and the area that can be pressed.
function selectionSquare(item: number) {
  const { x, y } = itemPosition(item);

  return { x: x - selectionSize / 2, y: y - selectionSize / 2, width: selectionSize, height: selectionSize };
}

function SwapsPage({ answers = noAnswers, selected = null, onItemPress }: SwapsPageProps) {
  function handlePointerDown(event: PointerEvent<SVGRectElement>, item: number) {
    // On a Mac, Ctrl + click is a right-click.
    if (event.button !== 0 || event.ctrlKey) {
      return;
    }

    onItemPress?.(item);
  }

  return (
    <svg viewBox={`0 0 ${pageSize.width} ${pageSize.height}`} className="block min-h-0 w-full flex-1 fill-ink select-none">
      {grayBoxes.map(({ label, ...box }) => (
        <g key={label}>
          <rect {...box} strokeWidth={1.5} className="fill-form-gray stroke-ink" />
          <text x={box.x + grayLabelInset} y={box.y - grayLabelGap} dominantBaseline="central" fontSize={20}>
            {label}
          </text>
        </g>
      ))}

      {keyPrintedOrder.map((symbol, index) => (
        <SymbolShape key={symbol} symbol={symbol} {...keyPosition(index)} size={keySymbolSize} number={keyNumbers[symbol]} />
      ))}

      {gridItems.map(({ item, symbol, part }) => (
        <SymbolShape
          key={item}
          symbol={symbol}
          {...itemPosition(item)}
          size={gridSymbolSize}
          number={answers.get(item) ?? null}
          solid={part === "practice"}
        />
      ))}

      {selected !== null && <rect {...selectionSquare(selected)} rx={8} strokeWidth={4} className="fill-none stroke-accent" />}

      {gridItems.map(({ item }) => (
        <rect key={item} {...selectionSquare(item)} fill="transparent" onPointerDown={(event) => handlePointerDown(event, item)} />
      ))}
    </svg>
  );
}

export default SwapsPage;
