import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

/**
 * 状态三件套（以 FinderColumn 的 ColumnState 为蓝本推广）：
 * EmptyState / ErrorState / LoadingState，用于页面/卡片/区块级状态占位。
 */

interface StateBlockProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  iconClassName?: string;
  className?: string;
}

function StateBlock({ icon: Icon, title, description, action, iconClassName, className }: StateBlockProps) {
  return (
    <div className={cn('flex min-h-[220px] flex-1 items-center justify-center px-4 py-8', className)}>
      <div className="max-w-[240px] text-center">
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

export function EmptyState({
  title = '暂无数据',
  description,
  action,
  icon = Inbox,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return <StateBlock icon={icon} title={title} description={description} action={action} className={className} />;
}

export function ErrorState({
  title = '数据读取失败',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <StateBlock
      icon={AlertCircle}
      title={title}
      description={description}
      className={className}
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            重试
          </Button>
        ) : null
      }
    />
  );
}

export function LoadingState({
  title = '正在加载数据…',
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return <StateBlock icon={Loader2} title={title} description={description} iconClassName="animate-spin" className={className} />;
}
