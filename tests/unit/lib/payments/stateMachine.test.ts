import { describe, it, expect } from "vitest";
import { canTransitionPayment, assertPaymentTransition } from "@/lib/payments/stateMachine";

describe("payment state machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransitionPayment("INITIATED", "PENDING")).toBe(true);
    expect(canTransitionPayment("PENDING", "SUCCESSFUL")).toBe(true);
  });

  it("allows failure from INITIATED and PENDING", () => {
    expect(canTransitionPayment("INITIATED", "FAILED")).toBe(true);
    expect(canTransitionPayment("PENDING", "FAILED")).toBe(true);
  });

  it("allows the documented retry loop from FAILED back to INITIATED", () => {
    expect(canTransitionPayment("FAILED", "INITIATED")).toBe(true);
  });

  it("SUCCESSFUL is terminal", () => {
    expect(canTransitionPayment("SUCCESSFUL", "PENDING")).toBe(false);
    expect(canTransitionPayment("SUCCESSFUL", "FAILED")).toBe(false);
  });

  it("allows a webhook to confirm success directly from INITIATED (no intermediate PENDING notification)", () => {
    expect(canTransitionPayment("INITIATED", "SUCCESSFUL")).toBe(true);
  });

  it("assertPaymentTransition throws on invalid transitions", () => {
    expect(() => assertPaymentTransition("SUCCESSFUL", "FAILED")).toThrowError(/Cannot transition/);
  });
});
