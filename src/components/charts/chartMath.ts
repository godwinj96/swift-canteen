export interface SeriesPoint {
  label: string;
  value: number;
}

/** Builds a lightly-smoothed SVG path (quadratic midpoints, not raw straight segments) through normalized points. */
export function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    d += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

/** Maps a data series onto a 0-100 x 0-height viewBox, returning normalized points plus min/max for labeling. */
export function normalizeSeries(data: SeriesPoint[], height: number, padding = 4) {
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = data.map((point, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y, value: point.value, label: point.label };
  });

  return { points, max, min };
}
