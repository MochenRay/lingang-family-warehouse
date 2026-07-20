"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          // 圆角 4px，背景 Neutral-03，文字 Neutral-10
          toast: "rounded-[4px] bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)] border-[var(--color-neutral-06)]/20 shadow-01",
          title: "text-[var(--color-neutral-11)] font-medium",
          description: "text-[var(--color-neutral-10)]",
          // 成功、错误、警告、信息样式（文字用 -text 深底可读变体）
          success: "bg-[var(--color-status-success)]/8 text-[var(--color-status-success-text)] border-[var(--color-status-success)]/30",
          error: "bg-[var(--color-status-error)]/8 text-[var(--color-status-error-text)] border-[var(--color-status-error)]/30",
          warning: "bg-[var(--color-status-warning)]/8 text-[var(--color-status-warning-text)] border-[var(--color-status-warning)]/30",
          info: "bg-[var(--color-status-info)]/8 text-[var(--color-status-info-text)] border-[var(--color-status-info)]/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };