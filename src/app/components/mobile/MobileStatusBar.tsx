import { Signal, Wifi, Battery } from 'lucide-react';

interface MobileStatusBarProps {
  className?: string;
}

/** 模拟系统状态栏。P4a：variant 死参数已废止（永久深色下两态渲染趋同），统一浅色文字。 */
export function MobileStatusBar({ className = '' }: MobileStatusBarProps) {
  return (
    <div className={`h-8 flex items-center justify-between px-6 text-xs font-medium pt-1 shrink-0 select-none text-[var(--color-neutral-10)] ${className}`}>
      <span className="w-8">9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal className="w-3.5 h-3.5" />
        <Wifi className="w-3.5 h-3.5" />
        <Battery className="w-4 h-4" />
      </div>
    </div>
  );
}
