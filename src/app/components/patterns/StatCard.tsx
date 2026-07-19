import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../ui/utils';

/**
 * StatCard：统一 KPI 统计卡。
 * 收敛各页 6 种写法（色条/图标盒/圆形图标等）为一种：
 * 左侧标签+数值（tabular-nums），右侧图标软盒。
 */

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  /** 图标与强调色，默认品牌蓝 */
  tone?: 'brand' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
  onClick?: () => void;
}

const toneText: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: 'text-[var(--color-brand-primary-hover)]',
  success: 'text-[var(--color-status-success-text)]',
  warning: 'text-[var(--color-status-warning-text)]',
  error: 'text-[var(--color-status-error-text)]',
  info: 'text-[var(--color-status-info-text)]',
};

const toneIconBox: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: 'bg-[var(--color-brand-primary)]/12 text-[var(--color-brand-primary-hover)]',
  success: 'bg-[var(--color-status-success-soft)] text-[var(--color-status-success-text)]',
  warning: 'bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning-text)]',
  error: 'bg-[var(--color-status-error-soft)] text-[var(--color-status-error-text)]',
  info: 'bg-[var(--color-status-info-soft)] text-[var(--color-status-info-text)]',
};

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', className, onClick }: StatCardProps) {
  const content = (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm text-[var(--color-neutral-08)]">{label}</div>
        <div className={cn('mt-1 text-2xl font-semibold tabular-nums text-[var(--color-neutral-11)]', toneText[tone])}>
          {value}
        </div>
        {hint ? <div className="mt-1 text-xs text-[var(--color-neutral-08)]">{hint}</div> : null}
      </div>
      {Icon ? (
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]', toneIconBox[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
    </div>
  );

  const cardClass = cn(
    'rounded-[4px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4',
    onClick && 'cursor-pointer transition-colors hover:border-[var(--color-brand-primary)]/50',
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cardClass, 'w-full text-left')}>
        {content}
      </button>
    );
  }

  return <div className={cardClass}>{content}</div>;
}
