import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from '../ui/table';
import { cn } from '../ui/utils';

type SortDirection = 'asc' | 'desc';
type HeaderAlign = 'left' | 'right' | 'center';

interface SortableHeaderProps<TKey extends string> {
  sortKey: TKey;
  currentKey: TKey;
  direction: SortDirection;
  label: string;
  onSort: (key: TKey) => void;
  align?: HeaderAlign;
  className?: string;
}

const alignClasses: Record<HeaderAlign, string> = {
  left: 'justify-start text-left',
  right: 'justify-end text-right',
  center: 'justify-center text-center',
};

export function SortableHeader<TKey extends string>({
  sortKey,
  currentKey,
  direction,
  label,
  onSort,
  align = 'right',
  className,
}: SortableHeaderProps<TKey>) {
  const isActive = currentKey === sortKey;
  const ariaSort = isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none';
  const Icon = !isActive ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex w-full items-center gap-1.5 rounded px-1 py-1 text-xs transition-colors',
          'hover:bg-[rgba(39,97,203,0.12)] hover:text-white',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4E86DF]',
          alignClasses[align],
          isActive ? 'text-[#4E86DF]' : 'text-[var(--color-neutral-08)]',
        )}
      >
        <span>{label}</span>
        <Icon className={cn('h-3.5 w-3.5', !isActive && 'opacity-55')} />
      </button>
    </TableHead>
  );
}
