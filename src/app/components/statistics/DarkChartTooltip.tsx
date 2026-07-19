import { CHART_PRIMARY, CHART_TOOLTIP } from '../../config/chartConfig';

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
    <div
      className="rounded-[4px] border px-3 py-2 text-xs shadow-01"
      style={{
        backgroundColor: CHART_TOOLTIP.backgroundColor,
        borderColor: CHART_TOOLTIP.borderColor,
        color: CHART_TOOLTIP.textColor,
      }}
    >
      {label ? <div className="mb-1 font-semibold" style={{ color: CHART_TOOLTIP.labelColor }}>{label}</div> : null}
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={`${item.name ?? item.dataKey}-${item.value}`} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color || item.fill || CHART_TOOLTIP.textColor }}
            />
            <span style={{ color: CHART_TOOLTIP.itemColor }}>{item.name ?? item.dataKey ?? '数值'}</span>
            <span className="font-semibold" style={{ color: CHART_TOOLTIP.labelColor }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const DARK_TOOLTIP_CURSOR = {
  fill: 'rgba(78, 134, 223, 0.12)',
  stroke: CHART_PRIMARY,
  strokeWidth: 1,
  strokeDasharray: '4 4',
};
