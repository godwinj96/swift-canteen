import { describe, it, expect, beforeAll, afterEach, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { initiatePayment } from "@/lib/payments/service";

// Requires DATABASE_URL/DIRECT_URL pointed at a Postgres instance (e.g. Supabase)
// with migrations applied. Run `pnpm db:migrate` before `pnpm test`.

let userId: string;
let userEmail: string;
let categoryId: string;
let itemId: string;
let orderId: string;
let fetchMock: ReturnType<typeof vi.fn>;

beforeAll(() => {
  process.env.BACHS_WEBHOOK_SECRET = "test-webhook-secret";
  process.env.BACHS_API_KEY = "sk_sandbox_test-key";
  process.env.BACHS_BASE_URL = "https://sandbox-api.bachs.io";
});

beforeEach(async () => {
  const user = await prisma.user.create({
    data: {
      fullName: "Initiate Payment Test User",
      email: `initiate-test-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: "not-a-real-hash",
    },
  });
  userId = user.id;
  userEmail = user.email;

  const category = await prisma.category.create({ data: { name: `Initiate Category ${Date.now()}` } });
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

  let callCount = 0;
  fetchMock = vi.fn(async () => {
    callCount += 1;
    return new Response(
      JSON.stringify({
        checkout_id: `chk_test_${callCount}`,
        checkout_url: `https://checkout.bachs.io/c/test-${callCount}`,
        status: "open",
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }),
      { status: 200 }
    );
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(async () => {
  vi.unstubAllGlobals();
  await prisma.payment.deleteMany({ where: { order: { userId } } });
  await prisma.orderItem.deleteMany({ where: { order: { userId } } });
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.menuItem.deleteMany({ where: { categoryId } });
  await prisma.category.delete({ where: { id: categoryId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("initiatePayment session reuse", () => {
  it("creates a new checkout session on first call", async () => {
    const result = await initiatePayment(orderId, userId, userEmail);
    expect(result.checkoutUrl).toBe("https://checkout.bachs.io/c/test-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the same live session on retry instead of creating a second one", async () => {
    const first = await initiatePayment(orderId, userId, userEmail);
    const second = await initiatePayment(orderId, userId, userEmail);

    expect(second.checkoutUrl).toBe(first.checkoutUrl);
    // Only the first call should have hit Bachs — the retry must reuse the stored session.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const payments = await prisma.payment.findMany({ where: { orderId } });
    expect(payments).toHaveLength(1);
  });

  it("creates a new session once the previous one has expired", async () => {
    await initiatePayment(orderId, userId, userEmail);
    await prisma.payment.updateMany({
      where: { orderId },
      data: { providerCheckoutExpires: new Date(Date.now() - 1000) },
    });

    const second = await initiatePayment(orderId, userId, userEmail);

    expect(second.checkoutUrl).toBe("https://checkout.bachs.io/c/test-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
