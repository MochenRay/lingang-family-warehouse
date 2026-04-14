"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          // 圆角 2px，选中背景 Blue-06 8%
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-[#2761CB]/8 [&:has([aria-selected].day-range-end)]:rounded-[2px]",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-[2px] [&:has(>.day-range-start)]:rounded-[2px] first:[&:has([aria-selected])]:rounded-[2px] last:[&:has([aria-selected])]:rounded-[2px]"
            : "[&:has([aria-selected])]:rounded-[2px]",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          // 圆角 2px
          "size-8 p-0 font-normal aria-selected:opacity-100 rounded-[2px]",
        ),
        day_range_start:
          // 选中日期：Blue-06 背景，白色文字
          "day-range-start aria-selected:bg-[#2761CB] aria-selected:text-white aria-selected:hover:bg-[#4E86DF]",
        day_range_end:
          "day-range-end aria-selected:bg-[#2761CB] aria-selected:text-white aria-selected:hover:bg-[#4E86DF]",
        day_selected:
          // 选中日期：Blue-06 背景
          "bg-[#2761CB] text-white hover:bg-[#4E86DF] hover:text-white focus:bg-[#2761CB] focus:text-white",
        day_today: "bg-[#293449] text-[#AEC0DE]",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };