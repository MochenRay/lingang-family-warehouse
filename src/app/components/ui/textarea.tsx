import * as React from "react"

import { cn } from "./utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-[2px] border border-[#546789]/40 bg-[#1F293A] text-[#AEC0DE] px-3 py-2 text-sm placeholder:text-[#8194B5] focus-visible:outline-none focus-visible:border-[#2761CB] focus-visible:ring-[3px] focus-visible:ring-[#2761CB]/20 hover:border-[#4E86DF] hover:bg-[#293449] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#161D2A] transition-[color,box-shadow]",
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