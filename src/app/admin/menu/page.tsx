import { prisma } from "@/lib/prisma";
import { AdminMenuClient } from "./AdminMenuClient";

export default async function AdminMenuPage() {
  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.menuItem.findMany({ orderBy: { createdAt: "desc" }, include: { category: true } }),
  ]);

  return (
    <AdminMenuClient
      categories={categories.map((c) => ({ id: c.id, name: c.name, description: c.description }))}
      menuItems={menuItems.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: Number(i.price),
        imageUrl: i.imageUrl,
        isAvailable: i.isAvailable,
        categoryId: i.categoryId,
        categoryName: i.category.name,
      }))}
    />
  );
}
