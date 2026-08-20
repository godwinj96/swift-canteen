import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { assertOrderTransition } from "@/lib/orders/stateMachine";
import { hasMinimumRole } from "@/lib/auth/roles";
import { assertPaymentTransition } from "./stateMachine";
import { createHostedCheckout, type BachsCollectionEvent } from "./bachsClient";
import type { PaymentStatus, Role } from "@prisma/client";

const PAYMENT_CURRENCY = "NGN";

export async function initiatePayment(orderId: string, userId: string, customerEmail: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, user: true },
  });

  if (!order) throw new ApiError(404, "Order not found");
  if (order.userId !== userId) throw new ApiError(403, "You do not have access to this order");
  if (order.status !== "PENDING") {
    throw new ApiError(409, "Only pending orders can be paid for");
  }

  let payment = order.payment;

  if (payment && payment.status !== "FAILED" && payment.status !== "INITIATED") {
    throw new ApiError(409, `Payment already ${payment.status.toLowerCase()} for this order`);
  }

  // If there's already a live (unexpired) checkout session for this payment, hand
  // the customer back the SAME session instead of creating a second one. Two live
  // sessions for one order is exactly how a customer ends up paying twice — if they
  // complete the old one after we've moved on to a new one, that payment succeeds
  // at Bachs with no matching providerCheckoutId here to reconcile it against.
  if (
    payment &&
    payment.status === "INITIATED" &&
    payment.providerCheckoutUrl &&
    payment.providerCheckoutExpires &&
    payment.providerCheckoutExpires > new Date()
  ) {
    return { checkoutUrl: payment.providerCheckoutUrl, paymentId: payment.id };
  }

  const reference = payment?.reference ?? `order_${orderId}_${randomUUID()}`;

  if (payment) {
    if (payment.status === "FAILED") {
      assertPaymentTransition(payment.status, "INITIATED");
    }
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "INITIATED", amount: order.totalAmount },
    });
  } else {
    payment = await prisma.payment.create({
      data: {
        orderId,
        amount: order.totalAmount,
        reference,
        status: "INITIATED",
      },
    });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const { checkoutUrl, checkoutId, expiresAt } = await createHostedCheckout({
    amount: Number(order.totalAmount),
    currency: PAYMENT_CURRENCY,
    reference: payment.reference,
    successUrl: `${appUrl}/orders/${orderId}?payment=success`,
    cancelUrl: `${appUrl}/checkout?payment=cancelled&orderId=${orderId}`,
    customerEmail,
    customerName: order.user.fullName,
    metadata: { orderId },
  });

  payment = await prisma.payment.update({
    where: { id: payment.id },
    data: { providerCheckoutId: checkoutId, providerCheckoutUrl: checkoutUrl, providerCheckoutExpires: expiresAt },
  });

  return { checkoutUrl, paymentId: payment.id };
}

const BACHS_EVENT_TO_PAYMENT_STATUS: Record<BachsCollectionEvent["type"], PaymentStatus> = {
  "collection.succeeded": "SUCCESSFUL",
  "collection.failed": "FAILED",
  "collection.underpaid": "FAILED",
};

const AMOUNT_TOLERANCE = 0.01;
// Bachs charges a 1.5% processing fee (capped at NGN 2,000) and, by default,
// passes it to the customer — the amount reported on a successful webhook is
// what the customer paid, fee included, not our pre-fee order total. A 5%
// ceiling comfortably covers that fee on any realistic order size while still
// catching genuinely wrong amounts (currency-unit mistakes, tampering).
const MAX_FEE_MARGIN_RATIO = 0.05;

// Cache invalidation happens in the webhook route handler after this resolves,
// not here — revalidateTag needs a live request context and throws when this
// function is called directly (e.g. from the integration test suite).
export async function reconcilePaymentStatus(event: BachsCollectionEvent) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { providerCheckoutId: event.checkoutId },
      include: { order: true },
    });
    if (!payment) {
      // Most likely a stale checkout session superseded by a retried payment
      // (initiatePayment overwrites providerCheckoutId on retry). Nothing to
      // reconcile against — log for visibility and stop, rather than making
      // Bachs retry a delivery we can never resolve.
      console.warn(`Bachs webhook: no payment found for checkoutId ${event.checkoutId}`);
      return null;
    }

    let newStatus = BACHS_EVENT_TO_PAYMENT_STATUS[event.type];

    if (newStatus === "SUCCESSFUL") {
      const expectedAmount = Number(payment.amount);
      const paidAmount = Number(event.amount);
      // The customer must have paid at least the order total (a shortfall here
      // would mean Bachs sent collection.succeeded for a genuine underpayment,
      // which collection.underpaid is supposed to catch instead — treat it as
      // suspicious either way). Anything above that up to the fee ceiling is
      // the customer-borne processing fee, not a mismatch.
      const amountMatches =
        paidAmount >= expectedAmount - AMOUNT_TOLERANCE &&
        paidAmount <= expectedAmount * (1 + MAX_FEE_MARGIN_RATIO) + AMOUNT_TOLERANCE;
      const currencyMatches = event.currency === PAYMENT_CURRENCY;
      if (!amountMatches || !currencyMatches) {
        console.error(
          `Bachs webhook: amount/currency mismatch for checkoutId ${event.checkoutId} — ` +
            `expected ~${expectedAmount} ${PAYMENT_CURRENCY} (+ fee), got ${event.amount} ${event.currency}. Marking FAILED for manual review.`
        );
        newStatus = "FAILED";
      }
    }

    if (payment.status === newStatus) {
      return payment;
    }

    assertPaymentTransition(payment.status, newStatus);

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: newStatus === "SUCCESSFUL" ? new Date() : payment.paidAt,
      },
    });

    if (newStatus === "SUCCESSFUL" && payment.order.status === "PENDING") {
      assertOrderTransition(payment.order.status, "CONFIRMED");
      await tx.order.update({
        where: { id: payment.order.id },
        data: { status: "CONFIRMED" },
      });
    }

    return updatedPayment;
  });
}

export async function getPaymentForVerify(paymentId: string, userId: string, role: Role) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (!hasMinimumRole(role, "STAFF") && payment.order.userId !== userId) {
    throw new ApiError(403, "You do not have access to this payment");
  }
  return payment;
}
