// Draws one SWAPS symbol, shaped by eye from Form A. Each shape is drawn around (0, 0) in a
// 100-unit square, then moved and scaled into place, so the same drawing works at any size.

import type { ReactElement } from "react";
import type { SwapsSymbol } from "./form-a";

const shapes: Record<SwapsSymbol, ReactElement> = {
  triangle: <polygon points="0,-48 46,42 -46,42" />,
  cross: <polygon points="-22,-46 22,-46 22,-22 46,-22 46,22 22,22 22,46 -22,46 -22,22 -46,22 -46,-22 -22,-22" />,
  circle: <circle r={47} />,
  pentagon: <polygon points="0,-50 47.6,-15.5 29.4,40.5 -29.4,40.5 -47.6,-15.5" />,
  square: <rect x={-47} y={-47} width={94} height={94} />,
  flag: <path d="M -46 -42 C -26 -30 -14 -30 0 -36 C 14 -44 30 -50 46 -42 L 46 38 C 30 30 14 32 0 40 C -14 48 -34 50 -46 38 Z" />,
  heart: (
    <path d="M 0 46 L -46 -12 C -58 -34 -34 -50 -18 -44 C -8 -40 -2 -34 0 -28 C 2 -34 8 -40 18 -44 C 34 -50 58 -34 46 -12 Z" />
  ),
};

// The triangle narrows toward the top, so its number sits lower.
const numberOffset: Partial<Record<SwapsSymbol, number>> = { triangle: 14 };

type SymbolShapeProps = {
  symbol: SwapsSymbol;
  x: number;
  y: number;
  size: number;
  number?: number | null;
  solid?: boolean;
};

function SymbolShape({ symbol, x, y, size, number = null, solid = false }: SymbolShapeProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <g strokeWidth={4} strokeLinejoin="round" className={`${solid ? "fill-white" : "fill-none"} stroke-ink`}>
        {shapes[symbol]}
      </g>
      {number !== null && (
        <text y={numberOffset[symbol] ?? 0} textAnchor="middle" dominantBaseline="central" fontSize={54}>
          {number}
        </text>
      )}
    </g>
  );
}

export default SymbolShape;
