import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "file:text-foreground placeholder:text-[var(--color-neutral-08)] selection:bg-primary selection:text-primary-foreground border-[var(--color-neutral-06)]/40 flex h-8 w-full min-w-0 rounded-[2px] border px-3 py-1 text-base bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-neutral-01)] md:text-sm",
          "focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-[var(--color-brand-primary)]/20 focus-visible:ring-[3px]",
          "aria-invalid:ring-[var(--color-status-error)]/20 aria-invalid:border-[var(--color-status-error)] aria-invalid:bg-[var(--color-status-error-soft)]",
          "hover:border-[var(--color-brand-primary-hover)] hover:bg-[var(--color-neutral-03)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input };