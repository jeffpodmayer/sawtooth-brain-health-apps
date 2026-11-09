// Draws one Trail Making page. The viewBox matches the grid in page-layouts.ts,
// so the browser scales the whole page to fit the screen.

import { circleRadius, pageSize, type PageLayout } from "./page-layouts";

type TrailPageProps = {
  layout: PageLayout;
};

function TrailPage({ layout }: TrailPageProps) {
  const { box, beginLabel, endLabel, circles } = layout;

  return (
    <svg
      viewBox={`0 0 ${pageSize.width} ${pageSize.height}`}
      className="block h-screen w-screen fill-ink select-none"
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

      {circles.map((circle) => (
        <g key={circle.id}>
          <circle cx={circle.x} cy={circle.y} r={circleRadius} strokeWidth={2} className="fill-none stroke-ink" />
          <text x={circle.x} y={circle.y} textAnchor="middle" dominantBaseline="central" fontSize={38} fontWeight={700}>
            {circle.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default TrailPage;
