export type AnalyticsRangeId = "today" | "7d" | "30d";

export const ANALYTICS_RANGES: { id: AnalyticsRangeId; label: string; days: number }[] = [
  { id: "today", label: "Today", days: 1 },
  { id: "7d", label: "7d", days: 7 },
  { id: "30d", label: "30d", days: 30 },
];

/** Shared by the server page (initial SSR fetch) and the client range control, so their defaults never drift apart. */
export function boundsForRange(rangeId: AnalyticsRangeId): { from: string; to: null } {
  const range = ANALYTICS_RANGES.find((r) => r.id === rangeId) ?? ANALYTICS_RANGES[1];
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (range.days - 1));
  return { from: from.toISOString(), to: null };
}

export const DEFAULT_ANALYTICS_RANGE: AnalyticsRangeId = "7d";
