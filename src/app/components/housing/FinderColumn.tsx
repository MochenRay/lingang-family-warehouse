import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, ChevronRight, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

export interface FinderColumnItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number | string;
  subtitle?: string;
  active?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
}

export interface FinderColumnProps {
  title: string;
  description?: string;
  items: FinderColumnItem[];
  selectedId?: string | null;
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onItemClick?: (item: FinderColumnItem) => void;
  onRetry?: () => void;
  className?: string;
}

const neutralBadgeClass =
  'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-08)]';

function ColumnState({
  icon: Icon,
  title,
  description,
  action,
  iconClassName,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  iconClassName?: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-1 items-center justify-center px-4 py-8">
      <div className="max-w-[220px] text-center">
        <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded bg-[var(--color-neutral-01)] text-[var(--color-neutral-08)] ring-1 ring-[var(--color-neutral-03)]">
          <Icon className={cn('h-4 w-4', iconClassName)} />
        </div>
        <p className="text-sm font-medium text-[var(--color-neutral-11)]">{title}</p>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-[var(--color-neutral-08)]">{description}</p>
        ) : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

export function FinderColumn({
  title,
  description,
  items,
  selectedId,
  loading = false,
  loadingLabel = '正在加载本列数据',
  error,
  emptyTitle = '暂无可选项',
  emptyDescription = '当前筛选条件下没有可浏览的数据，请切换上一级或刷新后重试。',
  onItemClick,
  onRetry,
  className,
}: FinderColumnProps) {
  const hasItems = items.length > 0;

  return (
    <section className={cn('flex min-h-[360px] flex-col rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]', className)}>
      <header className="border-b border-[var(--color-neutral-03)] px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--color-neutral-11)]">{title}</h3>
            {description ? (
              <p className="mt-0.5 truncate text-xs text-[var(--color-neutral-08)]">{description}</p>
            ) : null}
          </div>
          <Badge variant="outline" className={cn('shrink-0', neutralBadgeClass)}>
            {items.length}
          </Badge>
        </div>
      </header>

      {loading ? (
        <ColumnState
          icon={Loader2}
          title={loadingLabel}
          description="正在读取真实台账数据，加载完成后会保持当前列级上下文。"
          iconClassName="animate-spin"
        />
      ) : error ? (
        <ColumnState
          icon={AlertCircle}
          title="本列数据读取失败"
          description={error}
          action={
            onRetry ? (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-3.5 w-3.5" />
                重试
              </Button>
            ) : null
          }
        />
      ) : !hasItems ? (
        <ColumnState icon={Inbox} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="flex-1 overflow-y-auto p-1.5">
          <div className="space-y-1">
            {items.map((item) => {
              const ItemIcon = item.icon;
              const isActive = item.active || item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  aria-pressed={isActive}
                  onClick={() => onItemClick?.(item)}
                  className={cn(
                    'group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded px-2.5 py-2 text-left transition-colors',
                    'hover:bg-[rgba(78,134,223,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4E86DF]/40',
                    isActive && 'bg-[rgba(78,134,223,0.18)] text-blue-100 ring-1 ring-[#4E86DF]/35 hover:bg-[rgba(78,134,223,0.18)]',
                    item.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-08)]',
                      isActive && 'border-[#4E86DF]/45 bg-[#4E86DF]/10 text-blue-200',
                    )}
                  >
                    {ItemIcon ? <ItemIcon className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block truncate text-sm font-medium text-[var(--color-neutral-11)]', isActive && 'text-blue-100')}>
                      {item.label}
                    </span>
                    {item.subtitle ? (
                      <span className="mt-0.5 block truncate text-xs text-[var(--color-neutral-08)]">{item.subtitle}</span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {item.trailing}
                    {item.count !== undefined && item.count !== null ? (
                      <Badge variant="outline" className={neutralBadgeClass}>
                        {item.count}
                      </Badge>
                    ) : null}
                    <ChevronRight className={cn('h-3.5 w-3.5 text-[var(--color-neutral-08)] group-hover:text-blue-200', isActive && 'text-blue-200')} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
