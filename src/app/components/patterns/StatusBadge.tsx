import type { ReactNode } from 'react';
import { cn } from '../ui/utils';

/**
 * StatusBadge：统一状态/风险徽标。
 * 深底软衬（*-soft）+ 深底可读文字（*-text），替代各页散落的 pastel 色值映射。
 */

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const toneClasses: Record<StatusTone, string> = {
  success: 'border-[var(--color-status-success)]/35 bg-[var(--color-status-success-soft)] text-[var(--color-status-success-text)]',
  warning: 'border-[var(--color-status-warning)]/35 bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning-text)]',
  error: 'border-[var(--color-status-error)]/35 bg-[var(--color-status-error-soft)] text-[var(--color-status-error-text)]',
  info: 'border-[var(--color-status-info)]/35 bg-[var(--color-status-info-soft)] text-[var(--color-status-info-text)]',
  neutral: 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)]',
};

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** 风险等级 → tone（高/中/低） */
const riskToneMap: Record<string, StatusTone> = {
  高: 'error',
  high: 'error',
  中: 'warning',
  medium: 'warning',
  低: 'success',
  low: 'success',
};

export function RiskBadge({ level, className }: { level: string; className?: string }) {
  const tone = riskToneMap[level] ?? 'neutral';
  return <StatusBadge tone={tone} className={className}>{level}</StatusBadge>;
}
