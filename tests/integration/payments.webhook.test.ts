import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from "vitest";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { reconcilePaymentStatus } from "@/lib/payments/service";
import { verifyWebhookSignature } from "@/lib/payments/bachsClient";

// Requires DATABASE_URL/DIRECT_URL pointed at a Postgres instance (e.g. Supabase)
// with migrations applied. Run `pnpm db:migrate` before `pnpm test`.

const WEBHOOK_SECRET = "test-webhook-secret";

let userId: string;
let categoryId: string;
let itemId: string;
let orderId: string;
let reference: string;

beforeAll(() => {
  process.env.BACHS_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.BACHS_SECRET_KEY = "test-secret-key";
  process.env.BACHS_BASE_URL = "https://api.bachs.io";
});

beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      fullName: "Payment Test User",
      email: `payment-test-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: "not-a-real-hash",
    },
  });
  userId = user.id;

  const category = await prisma.category.create({ data: { name: `Payment Category ${Date.now()}` } });
  categoryId = category.id;

  const item = await prisma.menuItem.create({
    data: { categoryId, name: "Paid Item", price: 10, isAvailable: true },
  });
  itemId = item.id;

  const order = await prisma.order.create({
    data: {
      userId,
      totalAmount: 10,
      items: { create: [{ itemId, quantity: 1, unitPrice: 10 }] },
    },
  });
  orderId = order.id;

  reference = `order_${orderId}_test`;
  await prisma.payment.create({
    data: { orderId, amount: 10, reference, status: "INITIATED" },
  });
});

afterEach(async () => {
  await prisma.payment.deleteMany({ where: { order: { userId } } });
  await prisma.orderItem.deleteMany({ where: { order: { userId } } });
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.menuItem.deleteMany({ where: { categoryId } });
  await prisma.category.delete({ where: { id: categoryId } });
  await prisma.user.delete({ where: { id: userId } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

function sign(body: string) {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
}

describe("bachs webhook signature verification", () => {
  it("accepts a validly signed payload", () => {
    const body = JSON.stringify({ reference: "abc" });
    expect(verifyWebhookSignature(body, sign(body))).toBe(true);
  });

  it("rejects a payload with an invalid signature", () => {
    const body = JSON.stringify({ reference: "abc" });
    expect(verifyWebhookSignature(body, "0".repeat(64))).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyWebhookSignature("{}", null)).toBe(false);
  });
});

describe("reconcilePaymentStatus", () => {
  it("moves INITIATED -> PENDING without touching the order", async () => {
    await reconcilePaymentStatus({ reference, status: "PENDING" });
    const payment = await prisma.payment.findUnique({ where: { reference } });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(payment?.status).toBe("PENDING");
    expect(order?.status).toBe("PENDING");
  });

  it("confirms the order when payment succeeds", async () => {
    await reconcilePaymentStatus({ reference, status: "SUCCESSFUL", paidAt: new Date().toISOString() });
    const payment = await prisma.payment.findUnique({ where: { reference } });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(payment?.status).toBe("SUCCESSFUL");
    expect(order?.status).toBe("CONFIRMED");
  });

  it("is idempotent under duplicate webhook delivery", async () => {
    await reconcilePaymentStatus({ reference, status: "SUCCESSFUL", paidAt: new Date().toISOString() });
    await expect(
      reconcilePaymentStatus({ reference, status: "SUCCESSFUL", paidAt: new Date().toISOString() })
    ).resolves.not.toThrow();
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe("CONFIRMED");
  });

  it("keeps the order PENDING when payment fails", async () => {
    await reconcilePaymentStatus({ reference, status: "FAILED" });
    const payment = await prisma.payment.findUnique({ where: { reference } });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(payment?.status).toBe("FAILED");
    expect(order?.status).toBe("PENDING");
  });
});
