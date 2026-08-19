import type { PaymentStatus } from "@prisma/client";
import { ApiError } from "@/lib/errors";

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  INITIATED: ["PENDING", "SUCCESSFUL", "FAILED"],
  PENDING: ["SUCCESSFUL", "FAILED"],
  SUCCESSFUL: [],
  FAILED: ["INITIATED"],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export function assertPaymentTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!canTransitionPayment(from, to)) {
    throw new ApiError(409, `Cannot transition payment from ${from} to ${to}`);
  }
}
