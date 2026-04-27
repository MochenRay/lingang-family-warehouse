interface DarkChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    fill?: string;
    dataKey?: string;
  }>;
  label?: string | number;
}

export function DarkChartTooltip({ active, payload, label }: DarkChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#5B6FA5] bg-[#10182F] px-3 py-2 text-xs text-white shadow-2xl">
      {label ? <div className="mb-1 font-semibold text-[#DCE6FF]">{label}</div> : null}
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={`${item.name ?? item.dataKey}-${item.value}`} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color || item.fill || '#4E86DF' }}
            />
            <span className="text-[#AFC0E8]">{item.name ?? item.dataKey ?? '数值'}</span>
            <span className="font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const DARK_TOOLTIP_CURSOR = {
  fill: 'rgba(78, 134, 223, 0.12)',
  stroke: '#4E86DF',
  strokeWidth: 1,
  strokeDasharray: '4 4',
};
