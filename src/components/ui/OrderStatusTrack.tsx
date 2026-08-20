import type { OrderStatus } from "@prisma/client";

const STEPS = ["Placed", "Preparing", "Ready", "Picked up"] as const;

// CONFIRMED and PREPARING share a track segment — from a customer's point of
// view both just mean "the canteen has it and it's not ready yet," same
// grouping used for the admin order queue's tabs.
const STEP_INDEX: Partial<Record<OrderStatus, number>> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 1,
  READY_FOR_PICKUP: 2,
  COMPLETED: 3,
};

export function OrderStatusTrack({ status }: { status: OrderStatus }) {
  const currentStep = STEP_INDEX[status] ?? 0;

  return (
    <ol className="flex items-start" aria-label="Order progress">
      {STEPS.map((label, index) => {
        const state = index < currentStep ? "done" : index === currentStep ? "current" : "future";
        const lineFilled = index < currentStep;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5 last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full ${
                  state === "done"
                    ? "bg-canteen"
                    : state === "current"
                      ? "bg-canteen-light ring-2 ring-canteen"
                      : "border border-line bg-white"
                }`}
                aria-hidden="true"
              >
                {state === "current" && <span className="h-1.5 w-1.5 rounded-full bg-canteen" />}
              </span>
              {index < STEPS.length - 1 && (
                <span className={`h-0.5 flex-1 ${lineFilled ? "bg-canteen" : "bg-line"}`} aria-hidden="true" />
              )}
            </div>
            <span className={`text-[11px] font-medium whitespace-nowrap ${state === "future" ? "text-muted" : "text-ink"}`}>
              {label}
              <span className="sr-only">
                {state === "done" ? " (done)" : state === "current" ? " (current step)" : " (upcoming)"}, step{" "}
                {index + 1} of {STEPS.length}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
