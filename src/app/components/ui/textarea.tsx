import * as React from "react"

import { cn } from "./utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-[2px] border border-[var(--color-neutral-06)]/40 bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] px-3 py-2 text-sm placeholder:text-[var(--color-neutral-08)] focus-visible:outline-none focus-visible:border-[var(--color-brand-primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-brand-primary)]/20 hover:border-[var(--color-brand-primary-hover)] hover:bg-[var(--color-neutral-03)] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-neutral-01)] transition-[color,box-shadow]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }