"use client";

interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  formatValue?: (value: number) => string;
}

/**
 * Ranked horizontal bar list — top items, hourly volume, anything
 * category/comparative rather than continuous-time (that's TrendChart's
 * job). Only the top-ranked bar gets solid canteen orange; every other bar
 * recedes to --color-line, so the eye lands on the one thing that matters
 * without a legend.
 */
export function BarChart({ data, formatValue = (v) => String(v) }: BarChartProps) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No data yet</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-3">
      {data.map((datum, index) => {
        const widthPercent = (datum.value / max) * 100;
        const isTop = index === 0;
        return (
          <div key={datum.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate text-ink">{datum.label}</span>
              <span className="shrink-0 tabular-nums text-muted">{formatValue(datum.value)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-canteen-light">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${isTop ? "bg-canteen" : "bg-muted/50"}`}
                style={{ width: `${Math.max(widthPercent, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
