import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[#2761CB] text-white/85 hover:bg-[#4E86DF] active:bg-[#2251A8] rounded-[2px]",
        destructive:
          "bg-destructive/60 text-white hover:bg-destructive/90 focus-visible:ring-destructive/40 rounded-[2px]",
        outline:
          "border border-input bg-input/30 text-foreground hover:bg-input/50 hover:text-accent-foreground rounded-[2px]",
        secondary:
          "bg-[#293449] text-white/85 hover:bg-[#314059] rounded-[2px]",
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground rounded-[2px]",
        link: "text-[#2761CB] underline-offset-4 hover:underline rounded-[2px]",
      },
      size: {
        default: "h-8 px-3 py-2 has-[>svg]:px-2.5",
        sm: "h-6 gap-1.5 px-2 has-[>svg]:px-1.5",
        lg: "h-10 px-4 has-[>svg]:px-3.5",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };