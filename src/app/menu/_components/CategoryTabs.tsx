"use client";

interface Category {
  id: string;
  name: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap ${
          activeId === null ? "bg-ink text-white" : "border border-line text-ink hover:bg-canteen-light"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap ${
            activeId === category.id
              ? "bg-ink text-white"
              : "border border-line text-ink hover:bg-canteen-light"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
