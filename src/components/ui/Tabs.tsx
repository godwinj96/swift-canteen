"use client";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  /** Hot tabs keep a canteen-orange count badge even at rest (e.g. "needs action now"). */
  hot?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Shared underline-active tab idiom — reused for the admin order queue's
 * status tabs and the analytics range selector, so both surfaces read as
 * one system rather than two different filter controls.
 */
export function Tabs({ tabs, activeId, onSelect }: TabsProps) {
  return (
    <div className="flex gap-6 border-b border-line" role="tablist">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(tab.id)}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              active ? "border-canteen text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab.label}
            {typeof tab.count === "number" && (
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                  tab.hot && tab.count > 0
                    ? "bg-canteen-light text-canteen-dark"
                    : "bg-line text-muted"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
