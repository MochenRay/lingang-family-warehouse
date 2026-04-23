import { AlertTriangle, CheckCircle2, CircleOff, Info, RotateCcw } from 'lucide-react';

import { Badge } from './badge';
import type { SecondaryAiStatus } from '../../services/repositories/secondaryAiRepository';

interface AiStatusBadgeProps {
  status: SecondaryAiStatus;
  model?: string | null;
  usedFallbackModel?: boolean;
  error?: string | null;
  compact?: boolean;
  className?: string;
}

const statusCopy: Record<
  SecondaryAiStatus,
  {
    label: string;
    detail: string;
    className: string;
    icon: typeof CheckCircle2;
  }
> = {
  live: {
    label: 'AI 在线',
    detail: '真实模型已返回',
    className: 'border-[#19B172]/30 bg-[#19B172]/10 text-[#0f7a4c]',
    icon: CheckCircle2,
  },
  degraded: {
    label: 'AI 降级',
    detail: '当前使用本地安全样例',
    className: 'border-[#D6730D]/30 bg-[#D6730D]/10 text-[#9b5208]',
    icon: AlertTriangle,
  },
  disabled: {
    label: 'AI 已关闭',
    detail: 'kill switch 当前生效',
    className: 'border-[var(--color-neutral-04)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-09)]',
    icon: CircleOff,
  },
  unconfigured: {
    label: 'AI 未配置',
    detail: '缺少模型环境变量',
    className: 'border-[var(--color-neutral-04)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-09)]',
    icon: Info,
  },
  placeholder: {
    label: 'AI 占位',
    detail: '当前为占位接口',
    className: 'border-[#2AA3CF]/30 bg-[#2AA3CF]/10 text-[#176d8c]',
    icon: Info,
  },
};

export function AiStatusBadge({
  status,
  model,
  usedFallbackModel = false,
  error,
  compact = false,
  className = '',
}: AiStatusBadgeProps) {
  const copy = statusCopy[status] ?? statusCopy.placeholder;
  const Icon = usedFallbackModel ? RotateCcw : copy.icon;
  const modelText = model ? ` · ${model}` : '';
  const fallbackText = usedFallbackModel ? ' · 回退模型' : '';
  const errorText = error && status !== 'live' ? ` · ${error}` : '';

  return (
    <Badge
      variant="outline"
      title={`${copy.detail}${modelText}${fallbackText}${errorText}`}
      className={`${copy.className} ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1'} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{usedFallbackModel ? 'AI 回退模型' : copy.label}</span>
      {!compact && model ? <span className="opacity-80">{model}</span> : null}
    </Badge>
  );
}
