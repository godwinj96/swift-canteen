import { buildSmoothPath, normalizeSeries, type SeriesPoint } from "./chartMath";

interface SparklineProps {
  data: SeriesPoint[];
  height?: number;
}

/**
 * Stripped-down trend line for KPI tiles / analytics summary stats — stroke
 * only, no gridlines/axis/fill/interaction. Glanceable context, not a chart
 * to explore. Always orange regardless of trend direction; the adjacent
 * number+arrow communicates sign, not the line's color (see TrendChart /
 * design spec for the fuller rationale — kept out of this file to stay tiny).
 */
export function Sparkline({ data, height = 32 }: SparklineProps) {
  if (data.length < 2) {
    return <div style={{ height }} />;
  }

  const { points } = normalizeSeries(data, height, 2);
  const path = buildSmoothPath(points);

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <path
        d={path}
        fill="none"
        stroke="var(--color-canteen)"
        strokeOpacity={0.8}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
