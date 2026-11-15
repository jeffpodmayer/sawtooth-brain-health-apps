// Draws the SWAPS recall screen: the 7 symbols in recall-form order, with no key and no grid.
// It shows the same area of the page as SwapsPage, so the number pad stays where it was.

import type { PointerEvent } from "react";
import { recallOrder } from "../scoring/form-a";
import { pageSize, recallPosition, recallSelectionSize, recallSymbolSize, visibleArea } from "./form-layout";
import type { Answers } from "./selection";
import SymbolShape from "./SymbolShape";

const places = recallOrder.map((_, index) => index + 1);

type RecallPageProps = {
  answers: Answers;
  selected: number | null;
  allHighlighted?: boolean;
  onSymbolPress?: (place: number) => void;
};

// A square around a symbol, the same size for the outline and the area that can be pressed.
function selectionSquare(place: number) {
  const { x, y } = recallPosition(place);

  return { x: x - recallSelectionSize / 2, y: y - recallSelectionSize / 2, width: recallSelectionSize, height: recallSelectionSize };
}

function RecallPage({ answers, selected, allHighlighted = false, onSymbolPress }: RecallPageProps) {
  const outlined = allHighlighted ? places : places.filter((place) => place === selected);

  function handlePointerDown(event: PointerEvent<SVGRectElement>, place: number) {
    // On a Mac, Ctrl + click is a right-click.
    if (event.button !== 0 || event.ctrlKey) {
      return;
    }

    onSymbolPress?.(place);
  }

  return (
    <svg viewBox={`0 ${visibleArea.y} ${pageSize.width} ${visibleArea.height}`} className="block min-h-0 w-full flex-1 fill-ink select-none">
      {/* The tint sits under the symbols, so they stay crisp; the outline goes on top. */}
      {outlined.map((place) => (
        <rect key={place} {...selectionSquare(place)} rx={8} className="fill-accent/20" />
      ))}

      {recallOrder.map((symbol, index) => (
        <SymbolShape key={symbol} symbol={symbol} {...recallPosition(index + 1)} size={recallSymbolSize} number={answers.get(index + 1) ?? null} solid={outlined.includes(index + 1)} />
      ))}

      {outlined.map((place) => (
        <rect key={place} {...selectionSquare(place)} rx={8} strokeWidth={2.5} className="fill-none stroke-accent" />
      ))}

      {places.map((place) => (
        <rect key={place} {...selectionSquare(place)} fill="transparent" onPointerDown={(event) => handlePointerDown(event, place)} />
      ))}
    </svg>
  );
}

export default RecallPage;
