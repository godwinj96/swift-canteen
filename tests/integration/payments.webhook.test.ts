import { describe, it, expect, beforeAll, afterEach, beforeEach } from "vitest";
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
let checkoutId: string;

beforeAll(() => {
  process.env.BACHS_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.BACHS_API_KEY = "sk_sandbox_test-key";
  process.env.BACHS_BASE_URL = "https://sandbox-api.bachs.io";
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
  checkoutId = `chk_test_${Date.now()}_${Math.random()}`;
  await prisma.payment.create({
    data: { orderId, amount: 10, reference, providerCheckoutId: checkoutId, status: "INITIATED" },
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

function sign(body: string, timestamp: string) {
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(`${timestamp}.${body}`).digest("hex");
}

describe("bachs webhook signature verification", () => {
  it("accepts a validly signed payload", () => {
    const body = JSON.stringify({ id: "evt_1" });
    const timestamp = String(Math.floor(Date.now() / 1000));
    expect(verifyWebhookSignature(body, timestamp, sign(body, timestamp))).toBe(true);
  });

  it("rejects a payload with an invalid signature", () => {
    const body = JSON.stringify({ id: "evt_1" });
    const timestamp = String(Math.floor(Date.now() / 1000));
    expect(verifyWebhookSignature(body, timestamp, "0".repeat(64))).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyWebhookSignature("{}", String(Math.floor(Date.now() / 1000)), null)).toBe(false);
  });

  it("rejects a stale timestamp", () => {
    const body = JSON.stringify({ id: "evt_1" });
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 600);
    expect(verifyWebhookSignature(body, staleTimestamp, sign(body, staleTimestamp))).toBe(false);
  });
});

describe("reconcilePaymentStatus", () => {
  it("confirms the order when payment succeeds", async () => {
    await reconcilePaymentStatus({ type: "collection.succeeded", checkoutId, amount: "10.00", currency: "NGN" });
    const payment = await prisma.payment.findUnique({ where: { reference } });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(payment?.status).toBe("SUCCESSFUL");
    expect(order?.status).toBe("CONFIRMED");
  });

  it("is idempotent under duplicate webhook delivery", async () => {
    await reconcilePaymentStatus({ type: "collection.succeeded", checkoutId, amount: "10.00", currency: "NGN" });
    await expect(
      reconcilePaymentStatus({ type: "collection.succeeded", checkoutId, amount: "10.00", currency: "NGN" })
    ).resolves.not.toThrow();
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe("CONFIRMED");
  });

  it("keeps the order PENDING when payment fails", async () => {
    await reconcilePaymentStatus({ type: "collection.failed", checkoutId, amount: "10.00", currency: "NGN" });
    const payment = await prisma.payment.findUnique({ where: { reference } });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(payment?.status).toBe("FAILED");
    expect(order?.status).toBe("PENDING");
  });

  it("marks FAILED instead of confirming when a succeeded event under-reports the amount", async () => {
    await reconcilePaymentStatus({ type: "collection.succeeded", checkoutId, amount: "5.00", currency: "NGN" });
    const payment = await prisma.payment.findUnique({ where: { reference } });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(payment?.status).toBe("FAILED");
    expect(order?.status).toBe("PENDING");
  });

  it("marks FAILED instead of confirming when a succeeded event reports the wrong currency", async () => {
    await reconcilePaymentStatus({ type: "collection.succeeded", checkoutId, amount: "10.00", currency: "USD" });
    const payment = await prisma.payment.findUnique({ where: { reference } });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(payment?.status).toBe("FAILED");
    expect(order?.status).toBe("PENDING");
  });

  it("marks FAILED on an underpaid event", async () => {
    await reconcilePaymentStatus({ type: "collection.underpaid", checkoutId, amount: "5.00", currency: "NGN" });
    const payment = await prisma.payment.findUnique({ where: { reference } });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(payment?.status).toBe("FAILED");
    expect(order?.status).toBe("PENDING");
  });

  it("does not throw when the checkoutId matches no payment (stale/superseded session)", async () => {
    await expect(
      reconcilePaymentStatus({ type: "collection.succeeded", checkoutId: "chk_unknown", amount: "10.00", currency: "NGN" })
    ).resolves.toBeNull();
  });
});
