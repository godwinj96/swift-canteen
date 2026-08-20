"use client";

import { useEffect, useRef, useState } from "react";
import { buildSmoothPath, normalizeSeries, type SeriesPoint } from "./chartMath";

interface TrendChartProps {
  data: SeriesPoint[];
  height?: number;
  formatValue?: (value: number) => string;
}

const GRADIENT_ID = "trend-chart-gradient";

/**
 * Hand-rolled anchor line/area trend chart — no charting library exists in
 * this codebase, and none is being added; every visual choice here (stroke
 * color, gradient wash, gridline count, draw-in motion) matches the design
 * spec exactly so this reads as one brand system rather than a library's
 * default look.
 */
export function TrendChart({ data, height = 160, formatValue = (v) => String(v) }: TrendChartProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  const [pathLength, setPathLength] = useState(1000);

  useEffect(() => {
    // Both state updates happen inside the rAF callback (not synchronously in
    // the effect body) so this is a single settle, not a cascading render.
    // Reduced-motion is handled purely in CSS (motion-reduce:transition-none
    // below) rather than branching here — the "undrawn -> drawn" state flip
    // still happens either way, CSS just makes the jump instant.
    const id = requestAnimationFrame(() => {
      if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
      setDrawn(true);
    });
    return () => cancelAnimationFrame(id);
  }, [data]);

  if (data.length === 0) {
    return <EmptyChart height={height} />;
  }

  const { points, max, min } = normalizeSeries(data, height);
  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relativeX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  return (
    <div className="relative" style={{ height }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-canteen)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--color-canteen)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={100}
            y1={height * fraction}
            y2={height * fraction}
            stroke="var(--color-line)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path
          d={areaPath}
          fill={`url(#${GRADIENT_ID})`}
          opacity={drawn ? 1 : 0}
          className="transition-opacity duration-500 ease-out motion-reduce:transition-none"
        />
        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke="var(--color-canteen)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          strokeDasharray={pathLength}
          strokeDashoffset={drawn ? 0 : pathLength}
          className="transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
        />

        {hovered && (
          <circle cx={hovered.x} cy={hovered.y} r={2.5} fill="var(--color-canteen)" stroke="white" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        )}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between text-[11px] text-muted">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>

      {hovered && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-white px-2.5 py-1.5 text-xs shadow-elevation-md"
          style={{ left: `${hovered.x}%`, top: `${(hovered.y / height) * 100}%` }}
        >
          <p className="font-semibold text-ink tabular-nums">{formatValue(hovered.value)}</p>
          <p className="text-muted">{hovered.label}</p>
        </div>
      )}
    </div>
  );
}

function EmptyChart({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-line/30 text-sm text-muted"
      style={{ height }}
    >
      No data yet
    </div>
  );
}
