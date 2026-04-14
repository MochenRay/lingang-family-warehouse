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
          "border-transparent bg-[#2761CB] text-white hover:bg-[#4E86DF]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive:
          // Red-06 背景
          "border-transparent bg-[#D52132] text-white hover:bg-[#E74C3C]",
        outline:
          "text-foreground border-[#546789] hover:bg-accent hover:text-accent-foreground",
        success:
          // Green-06 背景
          "border-transparent bg-[#19B172] text-white hover:bg-[#22C55E]",
        warning:
          // Orange-06 背景
          "border-transparent bg-[#D6730D] text-white hover:bg-[#F97316]",
        info:
          // Light-blue-06 背景
          "border-transparent bg-[#2AA3CF] text-white hover:bg-[#0EA5E9]",
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