import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

type CartWithItems = Prisma.CartGetPayload<{
  include: { items: { include: { item: true } } };
}>;

export async function getOrCreateCart(userId: string): Promise<CartWithItems> {
  const existing = await prisma.cart.findFirst({
    where: { userId },
    include: { items: { include: { item: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  return prisma.cart.create({
    data: { userId },
    include: { items: { include: { item: true } } },
  });
}

/** Cheaper than getOrCreateCart when only the id is needed (no items/menu-item join). */
async function getOrCreateCartId(userId: string): Promise<string> {
  const existing = await prisma.cart.findFirst({
    where: { userId },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing.id;

  const created = await prisma.cart.create({ data: { userId }, select: { id: true } });
  return created.id;
}

export async function addItemToCart(userId: string, itemId: string, quantity: number) {
  const [menuItem, cart] = await Promise.all([
    prisma.menuItem.findUnique({ where: { id: itemId } }),
    getOrCreateCart(userId),
  ]);
  if (!menuItem || !menuItem.isAvailable) {
    throw new ApiError(404, "Menu item not found or unavailable");
  }

  const existingItem = cart.items.find((i) => i.itemId === itemId);
  await prisma.cartItem.upsert({
    where: { cartId_itemId: { cartId: cart.id, itemId } },
    update: { quantity: (existingItem?.quantity ?? 0) + quantity },
    create: { cartId: cart.id, itemId, quantity },
  });

  return getOrCreateCart(userId);
}

async function getOwnedCartItem(userId: string, cartItemId: string) {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });
  if (!cartItem || cartItem.cart.userId !== userId) {
    throw new ApiError(404, "Cart item not found");
  }
  return cartItem;
}

export async function updateCartItemQuantity(userId: string, cartItemId: string, quantity: number) {
  const cartItem = await getOwnedCartItem(userId, cartItemId);

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: cartItem.id } });
  } else {
    await prisma.cartItem.update({ where: { id: cartItem.id }, data: { quantity } });
  }

  return getOrCreateCart(userId);
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const cartItem = await getOwnedCartItem(userId, cartItemId);
  await prisma.cartItem.delete({ where: { id: cartItem.id } });
  return getOrCreateCart(userId);
}

/**
 * Replaces the user's server-side cart with the given lines in one transaction.
 * Used to lazily sync a client-owned, localStorage-first cart to the server —
 * including a forced sync the checkout button awaits directly, so this stays
 * on the minimum number of round trips rather than re-fetching the full
 * nested cart afterward, which nothing on the caller side reads anyway.
 * Unavailable/missing items are silently dropped rather than rejected outright,
 * since the client is expected to re-validate against fresh menu data anyway.
 */
export async function replaceCart(userId: string, lines: { itemId: string; quantity: number }[]): Promise<void> {
  const [cartId, menuItems] = await Promise.all([
    getOrCreateCartId(userId),
    prisma.menuItem.findMany({
      where: { id: { in: lines.map((l) => l.itemId) } },
      select: { id: true, isAvailable: true },
    }),
  ]);

  const availableIds = new Set(menuItems.filter((m) => m.isAvailable).map((m) => m.id));
  const validLines = lines.filter((l) => l.quantity > 0 && availableIds.has(l.itemId));
  const validItemIds = validLines.map((l) => l.itemId);

  await prisma.$transaction([
    prisma.cartItem.deleteMany({
      where: { cartId, itemId: { notIn: validItemIds.length > 0 ? validItemIds : ["__none__"] } },
    }),
    ...validLines.map((line) =>
      prisma.cartItem.upsert({
        where: { cartId_itemId: { cartId, itemId: line.itemId } },
        update: { quantity: line.quantity },
        create: { cartId, itemId: line.itemId, quantity: line.quantity },
      })
    ),
  ]);
}
