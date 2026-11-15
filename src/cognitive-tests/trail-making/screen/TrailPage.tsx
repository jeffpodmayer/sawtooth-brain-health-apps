// Draws one Trail Making page. The viewBox matches the grid in page-layouts.ts,
// so the browser scales the whole page to fit the screen.

import type { PointerEvent } from "react";
import { lineBetween } from "./line-between";
import { arrowTo, slashAcross } from "./marks";
import { circleOutlineWidth, circleRadius, pageSize, type PageLayout, type Point } from "./page-layouts";

export type WrongLine = {
  from: string;
  to: string;
};

type TrailPageProps = {
  layout: PageLayout;
  connected?: readonly string[];
  wrongLines?: readonly WrongLine[];
  arrowOn?: string | null;
  onPress?: (point: Point) => void;
};

function TrailPage({ layout, connected = [], wrongLines = [], arrowOn = null, onPress }: TrailPageProps) {
  const { box, beginLabel, endLabel, circles } = layout;

  function circleWithId(id: string) {
    const circle = circles.find((candidate) => candidate.id === id);
    if (!circle) throw new Error(`No circle ${id} on this page`);

    return circle;
  }

  const connectedCircles = connected.map(circleWithId);
  const arrow = arrowOn === null ? null : arrowTo(circleWithId(arrowOn));

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    const screenToPage = event.currentTarget.getScreenCTM()?.inverse();

    // On a Mac, Ctrl + click is a right-click.
    if (event.button !== 0 || event.ctrlKey || !screenToPage) {
      return;
    }

    const { x, y } = new DOMPoint(event.clientX, event.clientY).matrixTransform(screenToPage);
    onPress?.({ x, y });
  }

  return (
    <svg
      viewBox={`0 0 ${pageSize.width} ${pageSize.height}`}
      className="block h-screen w-screen cursor-default fill-ink select-none"
      onPointerDown={handlePointerDown}
    >
      {box && (
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          strokeWidth={2}
          className="fill-none stroke-ink"
        />
      )}

      <text x={beginLabel.x} y={beginLabel.y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700}>
        Begin
      </text>
      <text x={endLabel.x} y={endLabel.y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700}>
        End
      </text>

      {connectedCircles.slice(1).map((circle, index) => (
        <line key={circle.id} {...lineBetween(connectedCircles[index], circle)} strokeWidth={3} className="stroke-ink" />
      ))}

      {wrongLines.map(({ from, to }, index) => {
        const line = lineBetween(circleWithId(from), circleWithId(to));

        return (
          <g key={index} className="stroke-ink">
            <line {...line} strokeWidth={3} />
            <line {...slashAcross(line)} strokeWidth={6} />
          </g>
        );
      })}

      {circles.map((circle) => (
        <g key={circle.id}>
          <circle cx={circle.x} cy={circle.y} r={circleRadius} strokeWidth={circleOutlineWidth} className="fill-none stroke-ink" />
          <text x={circle.x} y={circle.y} textAnchor="middle" dominantBaseline="central" fontSize={38} fontWeight={700}>
            {circle.id}
          </text>
        </g>
      ))}

      {arrow && (
        <g>
          <line {...arrow.shaft} strokeWidth={6} className="stroke-ink" />
          <polygon points={arrow.head} />
        </g>
      )}
    </svg>
  );
}

export default TrailPage;
