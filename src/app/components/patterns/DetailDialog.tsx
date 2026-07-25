import { useEffect, useRef, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../ui/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { DIALOG_CLASS, PANEL_CLASS } from './surfaces';

/**
 * 实体详情弹窗统一骨架（R46 冻结）：
 * - 固定高度 + 明确内部滚动，切换内容/Tab 时外框不跳动；
 * - 头部统一为「徽标行 + 标题 + 说明 + 右侧操作区」；
 * - 正文由 DetailSection（带标题栏的面板）与 DetailField（标签/取值单元）组成，
 *   人口、房屋、人房关系、标签等详情弹窗共用同一信息层级与卡片密度；
 * - 关闭后焦点还给打开前的触发元素（本项目弹窗为受控打开，无 Dialog.Trigger，
 *   组件库默认的焦点还原会落空，由骨架统一兜底）。
 */

interface DetailDialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 标题下方的补充说明，面向业务用户 */
  description?: ReactNode;
  /** 标题上方的状态/类型徽标行 */
  badges?: ReactNode;
  /** 头部右侧操作区（编辑、删除等） */
  actions?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  /** 底部固定操作/说明区 */
  footer?: ReactNode;
  maxWidth?: '3xl' | '4xl' | '5xl';
  /** 标记用途，便于 e2e 与可访问性区分 */
  contentLabel?: string;
}

const MAX_WIDTH_CLASS: Record<NonNullable<DetailDialogShellProps['maxWidth']>, string> = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export function DetailDialogShell({
  open,
  onOpenChange,
  title,
  description,
  badges,
  actions,
  footer,
  children,
  maxWidth = '4xl',
  contentLabel,
}: DetailDialogShellProps) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // 弹窗未打开时通过 focusin 持续记录焦点位置，关闭后据此把焦点还给触发元素。
  // 不能在 effect 里同步读取 activeElement：关闭瞬间焦点仍落在弹窗内，会覆盖掉真正的触发元素。
  useEffect(() => {
    if (open) {
      return undefined;
    }
    const record = () => {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    };
    document.addEventListener('focusin', record);
    return () => document.removeEventListener('focusin', record);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label={contentLabel}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocusRef.current;
          returnFocusRef.current = null;
          if (target?.isConnected) {
            target.focus({ preventScroll: true });
          }
        }}
        className={cn(
          'flex h-[86vh] max-h-[840px] w-full flex-col gap-0 overflow-hidden p-0 shadow-2xl',
          MAX_WIDTH_CLASS[maxWidth],
          DIALOG_CLASS,
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-[var(--color-neutral-03)] px-5 py-4 text-left">
          {badges ? <div className="flex flex-wrap items-center gap-2 pr-6">{badges}</div> : null}
          <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold text-[var(--color-neutral-11)]">{title}</DialogTitle>
              {description ? (
                <DialogDescription className="mt-1 text-sm leading-6 text-[var(--color-neutral-08)]">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
        </DialogHeader>
        <div data-detail-dialog-body className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-[var(--color-neutral-03)] px-5 py-3">{footer}</div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface DetailSectionProps {
  icon?: LucideIcon;
  title: ReactNode;
  /** 标题栏右侧的计数/状态等 */
  trailing?: ReactNode;
  /** 标题下方的业务说明 */
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DetailSection({ icon: Icon, title, trailing, description, children, className }: DetailSectionProps) {
  return (
    <section className={cn(PANEL_CLASS, className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-neutral-03)] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-[var(--color-brand-text)]" /> : null}
          <h3 className="text-sm font-semibold text-[var(--color-neutral-11)]">{title}</h3>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </header>
      {description ? (
        <p className="border-b border-[var(--color-neutral-03)]/60 px-4 py-2 text-xs leading-5 text-[var(--color-neutral-08)]">
          {description}
        </p>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

interface DetailFieldProps {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** 标签/取值单元：与房屋详情同一密度，保证多弹窗字段节奏一致 */
export function DetailField({ label, value, icon, className }: DetailFieldProps) {
  return (
    <div className={cn('rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-2', className)}>
      <div className="flex items-center gap-1.5 text-xs text-[var(--color-neutral-08)]">
        {icon}
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium text-[var(--color-neutral-11)]">{value}</div>
    </div>
  );
}

/** 字段单元的响应式网格：桌面多列、窄屏回落 */
export function DetailFieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-2 sm:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>;
}
