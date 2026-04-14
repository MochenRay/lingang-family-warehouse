import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "./utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // 圆角 2px，尺寸 16px，选中颜色 Blue-06 (#2761CB)
      "peer h-4 w-4 shrink-0 rounded-[2px] border transition-colors",
      // 默认边框色
      "border-[#546789]",
      // 选中状态：Blue-06 背景和边框
      "data-[state=checked]:bg-[#2761CB] data-[state=checked]:border-[#2761CB] data-[state=checked]:text-white",
      // Hover 状态
      "hover:border-[#4E86DF]",
      // Focus 状态
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2761CB] focus-visible:ring-offset-2 ring-offset-background",
      // 禁用状态
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }