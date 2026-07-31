import { AlertTriangle, Database, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useMobileSandbox } from './MobileSandboxProvider';

export function MobileSandboxNotice() {
  const { mode, reset } = useMobileSandbox();

  if (mode === 'api') {
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

  return (
    <div className="mx-4 my-2 flex items-center gap-2 rounded-lg border border-[var(--color-status-info)]/40 bg-[var(--color-status-info-soft)] px-3 py-2 text-xs text-[var(--color-status-info-text)]" role="status">
      <Database className="h-4 w-4 shrink-0" />
      <span className="flex-1">仅本次浏览会话可见，不写入服务器。</span>
      <button
        type="button"
        className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 font-medium underline underline-offset-2"
        onClick={() => {
          try {
            reset();
            toast.success('已清除本次浏览会话数据');
          } catch (error) {
            console.error('Failed to reset mobile session data', error);
            toast.error('清除失败，请关闭当前标签页后重试');
          }
        }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        清除
      </button>
    </div>
  );
}
