import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { getOrCreateCart } from "@/lib/cart/service";
import { MenuPageClient } from "./MenuPageClient";

export default async function MenuPage() {
  const [categories, menuItems, user] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.menuItem.findMany({ orderBy: { createdAt: "asc" } }),
    getSessionUser(),
  ]);

  const cart = user ? await getOrCreateCart(user.sub) : null;

  return (
    <MenuPageClient
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      items={menuItems.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: Number(i.price),
        imageUrl: i.imageUrl,
        isAvailable: i.isAvailable,
        categoryId: i.categoryId,
      }))}
      initialCartItems={
        cart
          ? cart.items.map((ci) => ({
              id: ci.id,
              quantity: ci.quantity,
              item: { id: ci.item.id, name: ci.item.name, price: Number(ci.item.price) },
            }))
          : []
      }
      isLoggedIn={Boolean(user)}
    />
  );
}
