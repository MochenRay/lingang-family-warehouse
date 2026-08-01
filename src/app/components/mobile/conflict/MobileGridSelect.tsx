import { useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, RotateCcw } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../../ui/drawer';
import type { ConflictGridOptionsState } from '../../../services/mobileSandbox/conflictGridParty';

interface MobileGridSelectProps {
  /** foundation 返回的网格 options 状态机（loading/error/empty/ready） */
  gridOptions: ConflictGridOptionsState;
  /** 当前组件 state 中的已选网格 id；仅初始化预选或用户交互后才有值 */
  selectedGridId: string | undefined;
  /** 用户选择了某个 option；由父组件经 selectConflictGrid 完成切换 */
  onSelect: (nextGridId: string) => void;
  /** error/empty 状态下重新加载网格 options */
  onRetry: () => void;
  /** 外部禁用（如提交中） */
  disabled?: boolean;
  /** 触发按钮 id，供外部 Label htmlFor 关联 */
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * 矛盾纠纷表单的网格选择器。
 * 只渲染 foundation 提供的真实 options 状态：不猜 id、不按名称匹配、不回落到首项或硬编码网格。
 */
export function MobileGridSelect({
  gridOptions,
  selectedGridId,
  onSelect,
  onRetry,
  disabled = false,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: MobileGridSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  // 受控打开的 Drawer 无 Trigger 组件，关闭后焦点需手动还给触发按钮
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selectedGrid = gridOptions.status === 'ready' && selectedGridId
    ? gridOptions.options.find((grid) => grid.id === selectedGridId)
    : undefined;

  if (gridOptions.status === 'loading') {
    return (
      <div
        data-testid="conflict-grid-loading"
        role="status"
        className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] px-3 text-sm text-[var(--color-neutral-08)]"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        正在加载网格列表…
      </div>
    );
  }

  if (gridOptions.status === 'error') {
    return (
      <div className="space-y-2" data-testid="conflict-grid-error">
        <div role="alert" className="rounded-xl border border-[var(--color-status-error)]/40 bg-[var(--color-status-error-soft)] px-3 py-2 text-xs text-[var(--color-status-error-text)]">
          网格列表加载失败：{gridOptions.message}
        </div>
        <button
          type="button"
          data-testid="conflict-grid-retry"
          onClick={onRetry}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--color-neutral-03)] px-3 text-sm text-[var(--color-neutral-10)] active:bg-[var(--color-neutral-02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        >
          <RotateCcw className="h-4 w-4" />
          重新加载网格
        </button>
      </div>
    );
  }

  if (gridOptions.status === 'empty') {
    return (
      <div className="space-y-2" data-testid="conflict-grid-empty">
        <div role="alert" className="rounded-xl border border-[var(--color-status-warning)]/40 bg-[var(--color-status-warning-soft)] px-3 py-2 text-xs text-[var(--color-status-warning-text)]">
          服务端暂无可选网格，无法上报纠纷。
        </div>
        <button
          type="button"
          data-testid="conflict-grid-retry"
          onClick={onRetry}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--color-neutral-03)] px-3 text-sm text-[var(--color-neutral-10)] active:bg-[var(--color-neutral-02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
        >
          <RotateCcw className="h-4 w-4" />
          重新加载网格
        </button>
      </div>
    );
  }

  return (
    <div data-testid="conflict-grid-select" className="space-y-1">
      <button
        type="button"
        id={id}
        ref={triggerRef}
        data-testid="conflict-grid-trigger"
        aria-label={`所属网格：${selectedGrid?.name ?? '未选择'}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border bg-[var(--color-neutral-01)] px-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          ariaInvalid
            ? 'border-[var(--color-status-error)]'
            : 'border-[var(--color-neutral-03)] focus-visible:border-[var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]/40'
        }`}
      >
        <span className={selectedGrid ? 'text-[var(--color-neutral-11)]' : 'text-[var(--color-neutral-08)]'}>
          {selectedGrid ? selectedGrid.name : '请选择所属网格'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-neutral-08)]" />
      </button>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent
          className="flex h-[85%] flex-col rounded-t-[20px]"
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <DrawerHeader className="border-b border-[var(--color-neutral-03)] pb-4">
            <DrawerTitle className="text-center text-base font-bold text-[var(--color-neutral-11)]">选择所属网格</DrawerTitle>
            <DrawerDescription className="sr-only">从服务端网格列表中选择本纠纷所属网格</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4" role="radiogroup" aria-label="所属网格">
            <div className="space-y-2">
              {gridOptions.options.map((grid) => {
                const isSelected = grid.id === selectedGridId;
                return (
                  <label
                    key={grid.id}
                    data-testid={`conflict-grid-option-${grid.id}`}
                    className={`flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[var(--color-brand-primary)] ${
                      isSelected
                        ? 'border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/10 shadow-sm'
                        : 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] hover:bg-[var(--color-neutral-02)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conflict-grid"
                      value={grid.id}
                      checked={isSelected}
                      onChange={() => {
                        onSelect(grid.id);
                        setIsOpen(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== 'Home' && event.key !== 'End') {
                          return;
                        }
                        event.preventDefault();
                        const boundaryGrid = event.key === 'Home'
                          ? gridOptions.options[0]
                          : gridOptions.options[gridOptions.options.length - 1];
                        if (boundaryGrid) {
                          onSelect(boundaryGrid.id);
                          setIsOpen(false);
                        }
                      }}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-[var(--color-neutral-11)]">{grid.name}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-[var(--color-brand-text)]" />}
                  </label>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
