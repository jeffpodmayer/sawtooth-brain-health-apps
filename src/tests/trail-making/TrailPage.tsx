// Draws one Trail Making page. The viewBox matches the grid in page-layouts.ts,
// so the browser scales the whole page to fit the screen.

import type { PointerEvent } from "react";
import { lineBetween } from "./line-between";
import { circleOutlineWidth, circleRadius, pageSize, type PageLayout, type Point } from "./page-layouts";

type TrailPageProps = {
  layout: PageLayout;
  connected?: readonly string[];
  onPress?: (point: Point) => void;
};

function TrailPage({ layout, connected = [], onPress }: TrailPageProps) {
  const { box, beginLabel, endLabel, circles } = layout;
  const connectedCircles = connected.flatMap((id) => circles.filter((circle) => circle.id === id));

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

      {circles.map((circle) => (
        <g key={circle.id}>
          <circle cx={circle.x} cy={circle.y} r={circleRadius} strokeWidth={circleOutlineWidth} className="fill-none stroke-ink" />
          <text x={circle.x} y={circle.y} textAnchor="middle" dominantBaseline="central" fontSize={38} fontWeight={700}>
            {circle.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default TrailPage;
