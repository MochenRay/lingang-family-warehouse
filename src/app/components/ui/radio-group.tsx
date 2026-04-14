"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";

import { cn } from "./utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        // 尺寸 16px，圆形，选中颜色 Blue-06 (#2761CB)
        "aspect-square size-4 shrink-0 rounded-full border transition-colors",
        // 默认边框色
        "border-[#546789]",
        // 选中状态：Blue-06 边框
        "data-[state=checked]:border-[#2761CB]",
        // Hover 状态
        "hover:border-[#4E86DF]",
        // Focus 状态
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2761CB] focus-visible:ring-offset-2 ring-offset-background",
        // 禁用状态
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        {/* 内圆：Blue-06 填充，约占外圈的 50% */}
        <CircleIcon className="fill-[#2761CB] absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };