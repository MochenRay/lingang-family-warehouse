import { useRef } from 'react';

/**
 * 受控弹窗（无 Dialog.Trigger）的焦点归还支持。
 *
 * 组件库只在存在 Dialog.Trigger 时才会在关闭后把焦点还给触发元素；
 * 本项目弹窗几乎都是受控打开（open/onOpenChange），默认还原会落空、
 * 关闭后焦点掉到 body。这里在全局 focusin 上持续记录最近焦点元素，
 * 弹窗由关到开的渲染瞬间快照触发元素，关闭时经 onCloseAutoFocus 归还。
 *
 * 监听器挂在模块级而非组件 effect：弹窗可能是条件挂载（打开时才渲染），
 * 组件内 effect 来不及捕捉打开前的焦点。
 */

let lastFocusedElement: HTMLElement | null = null;

if (typeof document !== 'undefined') {
  document.addEventListener('focusin', () => {
    lastFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  });
}

/**
 * 受控弹窗通用 hook：open 由 false 变为 true 的渲染瞬间快照当前触发元素，
 * 返回可传给 DialogContent 的 onCloseAutoFocus 处理器，关闭后把焦点还给快照元素。
 */
export function useReturnFocus(open: boolean) {
  const targetRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  // 渲染期快照：此时组件库的自动聚焦尚未执行，记录到的仍是触发元素
  if (open && !wasOpenRef.current) {
    targetRef.current = lastFocusedElement;
  }
  wasOpenRef.current = open;

  return (event: Event) => {
    // 阻止组件库默认行为（无 Trigger 时会落空），由这里统一归还
    event.preventDefault();
    const target = targetRef.current;
    targetRef.current = null;
    if (target?.isConnected) {
      target.focus({ preventScroll: true });
    }
  };
}
