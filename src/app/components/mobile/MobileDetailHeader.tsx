import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';

/**
 * MobileDetailHeader：移动端详情/表单页统一头部（P4a）。
 * 结构：MobileStatusBar + 返回键 + 居中标题 + 可选右侧操作位。
 * 替代各页自建的 22 份头部；页面内容置于下方文档流。
 */

interface MobileDetailHeaderProps {
  title: string;
  onBack?: () => void;
  /** 右侧操作位（可选） */
  action?: ReactNode;
  /** 标题左侧副信息（可选，如状态徽标） */
  subtitle?: ReactNode;
}

export function MobileDetailHeader({ title, onBack, action, subtitle }: MobileDetailHeaderProps) {
  return (
    <div className="sticky top-0 z-20 shrink-0 border-b border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]">
      <MobileStatusBar />
      <div className="relative flex h-11 items-center justify-center px-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="返回"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-neutral-10)] active:bg-[var(--color-neutral-03)]"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-base font-semibold text-[var(--color-neutral-11)]">{title}</h1>
          {subtitle}
        </div>
        {action ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{action}</div> : null}
      </div>
    </div>
  );
}
