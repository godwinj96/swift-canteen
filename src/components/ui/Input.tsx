import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border border-line px-4 py-3 text-sm text-ink focus:border-canteen focus:outline-none focus:ring-1 focus:ring-canteen ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
