import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "file:text-foreground placeholder:text-[#8194B5] selection:bg-primary selection:text-primary-foreground border-[#546789]/40 flex h-8 w-full min-w-0 rounded-[2px] border px-3 py-1 text-base bg-[#1F293A] text-[#AEC0DE] transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#161D2A] md:text-sm",
          "focus-visible:border-[#2761CB] focus-visible:ring-[#2761CB]/20 focus-visible:ring-[3px]",
          "aria-invalid:ring-[#D52132]/20 aria-invalid:border-[#D52132] aria-invalid:bg-[rgba(213,33,50,0.08)]",
          "hover:border-[#4E86DF] hover:bg-[#293449]",
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