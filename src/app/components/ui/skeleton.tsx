import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-[4px] bg-[var(--color-neutral-03)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
