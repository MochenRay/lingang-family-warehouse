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
          "bg-[#1F293A] text-[#AEC0DE] border-[#293449]",
        destructive:
          // Red-06 背景 8% 透明度，Red-06 文字和边框
          "bg-[#D52132]/8 text-[#D52132] border-[#D52132]/30 [&>svg]:text-current *:data-[slot=alert-description]:text-[#D52132]/90",
        success:
          // Green-06 背景 8% 透明度，Green-06 文字和边框
          "bg-[#19B172]/8 text-[#19B172] border-[#19B172]/30 [&>svg]:text-current *:data-[slot=alert-description]:text-[#19B172]/90",
        warning:
          // Orange-06 背景 8% 透明度，Orange-06 文字和边框
          "bg-[#D6730D]/8 text-[#D6730D] border-[#D6730D]/30 [&>svg]:text-current *:data-[slot=alert-description]:text-[#D6730D]/90",
        info:
          // Light-blue-06 背景 8% 透明度，Light-blue-06 文字和边框
          "bg-[#2AA3CF]/8 text-[#2AA3CF] border-[#2AA3CF]/30 [&>svg]:text-current *:data-[slot=alert-description]:text-[#2AA3CF]/90",
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