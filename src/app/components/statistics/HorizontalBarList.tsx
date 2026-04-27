import { cn } from '../ui/utils';

export interface HorizontalBarListItem {
  label: string;
  value: number;
  color: string;
}

interface HorizontalBarListProps {
  items: HorizontalBarListItem[];
  valueFormatter?: (value: number) => string;
  emptyText?: string;
  className?: string;
  columnsClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  barHeight?: string;
  minBarPercent?: number;
}

export function HorizontalBarList({
  items,
  valueFormatter = (value) => String(value),
  emptyText = '暂无数据',
  className,
  columnsClassName = 'grid-cols-[minmax(96px,1fr)_minmax(120px,0.9fr)_40px]',
  labelClassName,
  valueClassName,
  barHeight = 'h-2',
  minBarPercent = 0,
}: HorizontalBarListProps) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return <div className="text-sm text-[var(--color-neutral-08)]">{emptyText}</div>;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn('grid items-center gap-3 text-sm', columnsClassName)}
        >
          <span className={cn('truncate text-[var(--color-neutral-10)]', labelClassName)}>{item.label}</span>
          <div className={cn('overflow-hidden rounded-full bg-[var(--color-neutral-03)]', barHeight)}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${item.value > 0 ? Math.max(minBarPercent, (item.value / maxValue) * 100) : 0}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <span className={cn('text-right font-semibold tabular-nums', valueClassName)} style={{ color: item.color }}>
            {valueFormatter(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
