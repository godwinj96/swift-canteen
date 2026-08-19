import { describe, it, expect } from "vitest";
import { canTransitionOrder, assertOrderTransition } from "@/lib/orders/stateMachine";
import type { OrderStatus } from "@prisma/client";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
];

describe("order state machine", () => {
  it("allows the documented happy-path progression", () => {
    expect(canTransitionOrder("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransitionOrder("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransitionOrder("PREPARING", "READY_FOR_PICKUP")).toBe(true);
    expect(canTransitionOrder("READY_FOR_PICKUP", "COMPLETED")).toBe(true);
  });

  it("allows cancellation from PENDING and CONFIRMED and PREPARING", () => {
    expect(canTransitionOrder("PENDING", "CANCELLED")).toBe(true);
    expect(canTransitionOrder("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransitionOrder("PREPARING", "CANCELLED")).toBe(true);
  });

  it("terminal states (COMPLETED, CANCELLED) have no outgoing transitions", () => {
    expect(canTransitionOrder("COMPLETED", "PENDING")).toBe(false);
    for (const status of ALL_STATUSES) {
      expect(canTransitionOrder("COMPLETED", status)).toBe(status === "COMPLETED" ? false : false);
      expect(canTransitionOrder("CANCELLED", status)).toBe(false);
    }
  });

  it("rejects skipping steps", () => {
    expect(canTransitionOrder("PENDING", "PREPARING")).toBe(false);
    expect(canTransitionOrder("CONFIRMED", "COMPLETED")).toBe(false);
  });

  it("assertOrderTransition throws ApiError(409) on invalid transitions", () => {
    expect(() => assertOrderTransition("COMPLETED", "PREPARING")).toThrowError(/Cannot transition/);
  });

  it("assertOrderTransition does not throw on valid transitions", () => {
    expect(() => assertOrderTransition("PENDING", "CONFIRMED")).not.toThrow();
  });
});
