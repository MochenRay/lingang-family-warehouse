"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // 中号尺寸：高度 20px，宽度 36px，圆角 9999px (胶囊型)
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-all",
        // 开启状态：Blue-06 背景
        "data-[state=checked]:bg-[var(--color-brand-primary)]",
        // 开启 Hover 状态：Blue-07
        "data-[state=checked]:hover:bg-[var(--color-brand-primary-hover)]",
        // 关闭状态：深灰色背景
        "data-[state=unchecked]:bg-[var(--color-neutral-02)]",
        // 关闭 Hover 状态：略亮
        "data-[state=unchecked]:hover:bg-[var(--color-neutral-03)]",
        // Focus 状态
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2 ring-offset-background",
        // 禁用状态
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // 滑块：圆形，直径 16px
          "pointer-events-none block size-4 rounded-full ring-0 transition-transform",
          // 开启状态：白色滑块，向右移动
          "data-[state=checked]:bg-white data-[state=checked]:translate-x-[1.125rem]",
          // 关闭状态：灰白色滑块，左侧位置
          "data-[state=unchecked]:bg-[var(--color-neutral-08)] data-[state=unchecked]:translate-x-0.5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };