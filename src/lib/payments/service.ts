import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { assertOrderTransition } from "@/lib/orders/stateMachine";
import { hasMinimumRole } from "@/lib/auth/roles";
import { assertPaymentTransition } from "./stateMachine";
import { createHostedCheckout, type BachsWebhookPayload } from "./bachsClient";
import type { PaymentStatus, Role } from "@prisma/client";

export async function initiatePayment(orderId: string, userId: string, customerEmail: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
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
  const { checkoutUrl } = await createHostedCheckout({
    amount: Number(order.totalAmount),
    reference: payment.reference,
    callbackUrl: `${appUrl}/api/payments/webhook`,
    customerEmail,
  });

  return { checkoutUrl, paymentId: payment.id };
}

const BACHS_STATUS_TO_PAYMENT_STATUS: Record<BachsWebhookPayload["status"], PaymentStatus> = {
  PENDING: "PENDING",
  SUCCESSFUL: "SUCCESSFUL",
  FAILED: "FAILED",
};

export async function reconcilePaymentStatus(payload: BachsWebhookPayload) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { reference: payload.reference },
      include: { order: true },
    });
    if (!payment) throw new ApiError(404, "Payment not found for reference");

    const newStatus = BACHS_STATUS_TO_PAYMENT_STATUS[payload.status];

    if (payment.status === newStatus) {
      return payment;
    }

    assertPaymentTransition(payment.status, newStatus);

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: newStatus === "SUCCESSFUL" ? new Date(payload.paidAt ?? Date.now()) : payment.paidAt,
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
