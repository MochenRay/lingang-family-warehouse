import { AlertTriangle } from 'lucide-react';
import { useMobileSandbox } from './MobileSandboxProvider';

export function MobileSandboxNotice() {
  const { mode } = useMobileSandbox();

  if (mode === 'api' || mode === 'session') {
    return null;
  }

  if (mode === 'checking') {
    return (
      <div className="mx-4 my-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground" role="status">
        正在确认当前演示环境的数据模式…
      </div>
    );
  }

  if (mode === 'blocked') {
    return (
      <div className="mx-4 my-2 flex items-start gap-2 rounded-lg border border-[var(--color-status-warning)]/40 bg-[var(--color-status-warning-soft)] px-3 py-2 text-xs text-[var(--color-status-warning-text)]" role="alert">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>暂时无法确认写入模式。为避免误写，提交功能已停用；请刷新后重试。</span>
      </div>
    );
  }
  return null;
}
