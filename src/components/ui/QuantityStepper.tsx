"use client";

interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  size?: "sm" | "md";
}

const SIZE_CLASSES = {
  sm: { button: "h-6 w-6 text-sm", value: "w-4 text-sm" },
  md: { button: "h-9 w-9 text-base", value: "w-6 text-sm" },
} as const;

/**
 * Shared -/+ control for adjusting a cart line's quantity. Decrementing to 0
 * is a valid call — callers pass it straight through to the same
 * updateQuantity/setLocalCartItemQuantity path, which already removes the
 * line at quantity <= 0.
 */
export function QuantityStepper({ quantity, onChange, size = "md" }: QuantityStepperProps) {
  const classes = SIZE_CLASSES[size];

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label="Decrease quantity"
        className={`flex items-center justify-center rounded-full border border-line font-semibold text-ink hover:bg-canteen-light ${classes.button}`}
      >
        -
      </button>
      <span className={`text-center font-semibold text-ink ${classes.value}`}>{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label="Increase quantity"
        className={`flex items-center justify-center rounded-full border border-line font-semibold text-ink hover:bg-canteen-light ${classes.button}`}
      >
        +
      </button>
    </div>
  );
}
