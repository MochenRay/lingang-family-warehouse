"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          // 圆角 4px，背景 Neutral-03，文字 Neutral-10
          toast: "rounded-[4px] bg-[#293449] text-[#AEC0DE] border-[#546789]/20 shadow-[0px_2px_8px_rgba(10,27,57,0.15)]",
          title: "text-[#F6F9FE] font-medium",
          description: "text-[#AEC0DE]",
          // 成功、错误、警告、信息样式
          success: "bg-[#19B172]/8 text-[#19B172] border-[#19B172]/30",
          error: "bg-[#D52132]/8 text-[#D52132] border-[#D52132]/30",
          warning: "bg-[#D6730D]/8 text-[#D6730D] border-[#D6730D]/30",
          info: "bg-[#2AA3CF]/8 text-[#2AA3CF] border-[#2AA3CF]/30",
        },
      }}
      style={
        {
          "--normal-bg": "#293449",
          "--normal-text": "#AEC0DE",
          "--normal-border": "rgba(84, 103, 137, 0.2)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };