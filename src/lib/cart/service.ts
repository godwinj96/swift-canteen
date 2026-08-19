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

export async function addItemToCart(userId: string, itemId: string, quantity: number) {
  const menuItem = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!menuItem || !menuItem.isAvailable) {
    throw new ApiError(404, "Menu item not found or unavailable");
  }

  const cart = await getOrCreateCart(userId);
  const existingItem = cart.items.find((i) => i.itemId === itemId);

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, itemId, quantity },
    });
  }

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
