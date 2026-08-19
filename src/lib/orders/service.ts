import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { hasMinimumRole } from "@/lib/auth/roles";
import { assertOrderTransition } from "./stateMachine";
import type { OrderStatus, Role } from "@prisma/client";

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

export async function listOrdersForUser(userId: string, role: Role) {
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
}

export async function getOrderById(orderId: string, userId: string, role: Role) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { item: true } }, payment: true, user: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  if (!hasMinimumRole(role, "STAFF") && order.userId !== userId) {
    throw new ApiError(403, "You do not have access to this order");
  }
  return order;
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ApiError(404, "Order not found");

    assertOrderTransition(order.status, newStatus);

    return tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: { include: { item: true } }, payment: true },
    });
  });
}
