import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { hasMinimumRole } from "@/lib/auth/roles";
import { assertOrderTransition } from "./stateMachine";
import type { OrderStatus, Role } from "@prisma/client";

// Cache invalidation (revalidateTag) deliberately happens in the calling route
// handlers, not here — revalidateTag requires a live Next.js request context and
// throws ("static generation store missing") when these functions are called
// directly, e.g. from the integration test suite. See the "orders"/"admin-orders"/
// "admin-dashboard"/"admin-reports" tags invalidated in src/app/api/orders/route.ts
// and src/app/api/orders/[id]/status/route.ts.

export async function placeOrder(userId: string, pickupTime?: string) {
  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findFirst({
      where: { userId },
      include: { items: { include: { item: true } } },
      orderBy: { createdAt: "desc" },
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    const unavailable = cart.items.filter((i) => !i.item.isAvailable);
    if (unavailable.length > 0) {
      throw new ApiError(
        409,
        "Some items in your cart are no longer available",
        { unavailableItemIds: unavailable.map((i) => i.itemId) }
      );
    }

    const totalAmount = cart.items.reduce(
      (sum, i) => sum + Number(i.item.price) * i.quantity,
      0
    );

    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        pickupTime: pickupTime ? new Date(pickupTime) : undefined,
        items: {
          create: cart.items.map((i) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            unitPrice: i.item.price,
          })),
        },
      },
      include: { items: { include: { item: true } } },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
}

const getCachedOrdersForUser = unstable_cache(
  async (userId: string, role: Role) => {
    if (hasMinimumRole(role, "STAFF")) {
      return prisma.order.findMany({
        include: { items: { include: { item: true } }, payment: true, user: true },
        orderBy: { createdAt: "desc" },
      });
    }
    return prisma.order.findMany({
      where: { userId },
      include: { items: { include: { item: true } }, payment: true },
      orderBy: { createdAt: "desc" },
    });
  },
  ["orders-for-user"],
  { revalidate: 10, tags: ["orders"] }
);

export async function listOrdersForUser(userId: string, role: Role) {
  return getCachedOrdersForUser(userId, role);
}

const getCachedOrderById = unstable_cache(
  async (orderId: string) =>
    prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { item: true } }, payment: true, user: true },
    }),
  ["order-by-id"],
  { revalidate: 10, tags: ["orders"] }
);

export async function getOrderById(orderId: string, userId: string, role: Role) {
  const order = await getCachedOrderById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (!hasMinimumRole(role, "STAFF") && order.userId !== userId) {
    throw new ApiError(403, "You do not have access to this order");
  }
  return order;
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { id: orderId } });
    if (!existing) throw new ApiError(404, "Order not found");

    assertOrderTransition(existing.status, newStatus);

    return tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: { include: { item: true } }, payment: true },
    });
  });
}
