import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { placeOrder } from "@/lib/orders/service";

// Requires a running Postgres instance (see docker-compose.yml) with DATABASE_URL
// pointed at it and migrations applied. Run `pnpm db:migrate` before `pnpm test`.

let userId: string;
let categoryId: string;
let availableItemId: string;
let unavailableItemId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      fullName: "Test Customer",
      email: `test-${Date.now()}@example.com`,
      passwordHash: "not-a-real-hash",
    },
  });
  userId = user.id;

  const category = await prisma.category.create({ data: { name: `Test Category ${Date.now()}` } });
  categoryId = category.id;

  const available = await prisma.menuItem.create({
    data: { categoryId, name: "Available Item", price: 5, isAvailable: true },
  });
  availableItemId = available.id;

  const unavailable = await prisma.menuItem.create({
    data: { categoryId, name: "Unavailable Item", price: 3, isAvailable: false },
  });
  unavailableItemId = unavailable.id;
});

afterEach(async () => {
  const cart = await prisma.cart.findFirst({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  await prisma.orderItem.deleteMany({ where: { order: { userId } } });
  await prisma.payment.deleteMany({ where: { order: { userId } } });
  await prisma.order.deleteMany({ where: { userId } });
});

afterAll(async () => {
  await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
  await prisma.cart.deleteMany({ where: { userId } });
  await prisma.menuItem.deleteMany({ where: { categoryId } });
  await prisma.category.delete({ where: { id: categoryId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("placeOrder", () => {
  it("converts a cart into an order with a server-computed total and clears the cart", async () => {
    const cart = await prisma.cart.create({ data: { userId } });
    await prisma.cartItem.create({ data: { cartId: cart.id, itemId: availableItemId, quantity: 3 } });

    const order = await placeOrder(userId);

    expect(order.status).toBe("PENDING");
    expect(Number(order.totalAmount)).toBe(15);
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(3);

    const remainingCartItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    expect(remainingCartItems).toHaveLength(0);
  });

  it("rejects an empty cart", async () => {
    await prisma.cart.create({ data: { userId } });
    await expect(placeOrder(userId)).rejects.toThrow(/empty/i);
  });

  it("rejects and rolls back when the cart contains an unavailable item", async () => {
    const cart = await prisma.cart.create({ data: { userId } });
    await prisma.cartItem.create({ data: { cartId: cart.id, itemId: unavailableItemId, quantity: 1 } });

    await expect(placeOrder(userId)).rejects.toThrow(/no longer available/i);

    const ordersAfter = await prisma.order.findMany({ where: { userId } });
    expect(ordersAfter).toHaveLength(0);
    const cartItemsAfter = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    expect(cartItemsAfter).toHaveLength(1);
  });
});
