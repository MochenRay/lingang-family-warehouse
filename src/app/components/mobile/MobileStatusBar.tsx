import { Signal, Wifi, Battery } from 'lucide-react';

interface MobileStatusBarProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function MobileStatusBar({ variant = 'dark', className = '' }: MobileStatusBarProps) {
  // dark variant = white text (for dark backgrounds)
  // light variant = black text (for light backgrounds)
  const textColor = variant === 'dark' ? 'text-[var(--color-neutral-10)]' : 'text-gray-900';

  return (
    <div className={`h-8 flex items-center justify-between px-6 text-xs font-medium pt-1 shrink-0 select-none ${textColor} ${className}`}>
      <span className="w-8">9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal className="w-3.5 h-3.5" />
        <Wifi className="w-3.5 h-3.5" />
        <Battery className="w-4 h-4" />
      </div>
    </div>
  );
}