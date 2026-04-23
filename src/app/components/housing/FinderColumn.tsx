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
        <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded bg-gray-50 text-gray-400 ring-1 ring-gray-200">
          <Icon className={cn('h-4 w-4', iconClassName)} />
        </div>
        <p className="text-sm font-medium text-gray-800">{title}</p>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
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
    <section className={cn('flex min-h-[360px] flex-col rounded border border-gray-200 bg-white', className)}>
      <header className="border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900">{title}</h3>
            {description ? (
              <p className="mt-0.5 truncate text-xs text-gray-500">{description}</p>
            ) : null}
          </div>
          <Badge variant="outline" className="shrink-0 border-gray-200 bg-gray-50 text-gray-600">
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
                    'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2761CB]/40',
                    isActive && 'bg-[#2761CB]/10 text-[#2251A8] ring-1 ring-[#2761CB]/20 hover:bg-[#2761CB]/10',
                    item.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-gray-50 text-gray-500',
                      isActive && 'border-[#2761CB]/30 bg-white text-[#2761CB]',
                    )}
                  >
                    {ItemIcon ? <ItemIcon className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block truncate text-sm font-medium text-gray-900', isActive && 'text-[#2251A8]')}>
                      {item.label}
                    </span>
                    {item.subtitle ? (
                      <span className="mt-0.5 block truncate text-xs text-gray-500">{item.subtitle}</span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {item.trailing}
                    {item.count !== undefined && item.count !== null ? (
                      <Badge variant="outline" className="border-gray-200 bg-white text-gray-600">
                        {item.count}
                      </Badge>
                    ) : null}
                    <ChevronRight className={cn('h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500', isActive && 'text-[#2761CB]')} />
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
