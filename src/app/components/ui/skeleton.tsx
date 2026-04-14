import { cn } from "./utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // 圆角 2px，背景 Neutral-03，动画效果
        "animate-pulse rounded-[2px] bg-[#293449]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };