// Draws SWAPS Form A: the key, the grid and row 1's two gray boxes. The viewBox matches the page
// in form-layout.ts, so the browser scales the whole page to fit the screen.

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
} from "./form-layout";
import SymbolShape from "./SymbolShape";

function SwapsPage() {
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
        <SymbolShape key={item} symbol={symbol} {...itemPosition(item)} size={gridSymbolSize} solid={part === "practice"} />
      ))}
    </svg>
  );
}

export default SwapsPage;
