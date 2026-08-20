import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Public, shared-across-all-visitors menu data — cached briefly so switching
// back to /menu (or any nav that re-renders it) doesn't re-hit Postgres every
// time. Invalidated instantly by every menu-item/category mutation route
// (see revalidateTag("public-menu") calls in src/app/api/menu-items/**
// and src/app/api/categories/route.ts).
export const getPublicMenuData = unstable_cache(
  async () => {
    const [categories, menuItems] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.menuItem.findMany({ orderBy: { createdAt: "asc" } }),
    ]);
    return {
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
      items: menuItems.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: Number(i.price),
        imageUrl: i.imageUrl,
        isAvailable: i.isAvailable,
        categoryId: i.categoryId,
      })),
    };
  },
  ["public-menu-data"],
  { revalidate: 20, tags: ["public-menu"] }
);
