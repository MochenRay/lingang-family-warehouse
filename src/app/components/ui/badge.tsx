import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  // 基础样式：圆角 9999px (胶囊型)，内边距 4px 8px
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-colors [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          // Blue-06 背景，白色文字
          "border-transparent bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive:
          // Red-06 背景
          "border-transparent bg-[var(--color-status-error)] text-white hover:bg-[var(--color-status-error-text)]",
        outline:
          "text-foreground border-[var(--color-neutral-06)] hover:bg-accent hover:text-accent-foreground",
        success:
          // Green-06 背景
          "border-transparent bg-[var(--color-status-success)] text-white hover:bg-[var(--color-status-success-text)]",
        warning:
          // Orange-06 背景
          "border-transparent bg-[var(--color-status-warning)] text-white hover:bg-[var(--color-status-warning-text)]",
        info:
          // Light-blue-06 背景
          "border-transparent bg-[var(--color-status-info)] text-white hover:bg-[var(--color-status-info-text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }
>(({ className, variant, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };