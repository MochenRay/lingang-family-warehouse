import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const alertVariants = cva(
  // 圆角 2px，内边距 12px 16px
  "relative w-full rounded-[2px] border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current transition-colors",
  {
    variants: {
      variant: {
        default:
          // Neutral-02 背景，Neutral-10 文字
          "bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] border-[var(--color-neutral-03)]",
        destructive:
          // Red-06 背景 8% 透明度，Red-06 文字和边框
          "bg-[var(--color-status-error)]/8 text-[var(--color-status-error)] border-[var(--color-status-error)]/30 [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--color-status-error)]/90",
        success:
          // Green-06 背景 8% 透明度，Green-06 文字和边框
          "bg-[var(--color-status-success)]/8 text-[var(--color-status-success)] border-[var(--color-status-success)]/30 [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--color-status-success)]/90",
        warning:
          // Orange-06 背景 8% 透明度，Orange-06 文字和边框
          "bg-[var(--color-status-warning)]/8 text-[var(--color-status-warning)] border-[var(--color-status-warning)]/30 [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--color-status-warning)]/90",
        info:
          // Light-blue-06 背景 8% 透明度，Light-blue-06 文字和边框
          "bg-[var(--color-status-info)]/8 text-[var(--color-status-info)] border-[var(--color-status-info)]/30 [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--color-status-info)]/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };