import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { ChartCard } from '../statistics/ChartCard';
import { StatCard } from '../patterns/StatCard';
import { LoadingState } from '../patterns/states';
import { Button } from '../ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { analysisRepository, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { downloadJson } from '../../services/export';
import { toast } from 'sonner';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import {
  CHART_GRADIENT_BLUE,
  CHART_GRADIENT_ORANGE,
  CHART_GRID_PROPS,
  CHART_LEGEND,
  CHART_PRIMARY,
  CHART_TICK,
  CHART_WARNING,
} from '../../config/chartConfig';
import { HorizontalBarList } from '../statistics/HorizontalBarList';
import { PageHeader } from './PageHeader';

export function MigrationTrends() {
  const [snapshot, setSnapshot] = useState<GovernanceAnalysisSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const next = await analysisRepository.getGovernanceSnapshot();
      setSnapshot(next);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const trendData = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return snapshot.monthly.map((item) => ({
      month: item.month,
      迁入: item.moveIns,
      迁出: item.moveOuts,
    }));
  }, [snapshot]);

  const handleExport = () => {
    downloadJson(`migration-trends-${new Date().toISOString().slice(0, 10)}.json`, {
      generatedAt: snapshot?.generatedAt,
      migration: snapshot?.migration,
      monthly: snapshot?.monthly,
    });
    toast.success('人口流动快照已导出');
  };

  if (loading) {
    return (
      <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
        <PageHeader
          eyebrow="MIGRATION ANALYTICS"
          title="人口流动趋势"
          description="识别流动人口变化和重点迁入迁出片区，辅助安排走访与出租房复核。"
        />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
      <PageHeader
        eyebrow="MIGRATION ANALYTICS"
        title="人口流动趋势"
        description="识别流动人口变化和重点迁入迁出片区，辅助安排走访与出租房复核。"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="近六月总迁入"
          value={snapshot?.migration.totalIn ?? 0}
          hint="人次"
          icon={TrendingUp}
          tone="brand"
        />
        <StatCard
          label="近六月总迁出"
          value={snapshot?.migration.totalOut ?? 0}
          hint="人次"
          icon={TrendingDown}
          tone="warning"
        />
        <StatCard
          label="净流入"
          value={`${(snapshot?.migration.net ?? 0) > 0 ? '+' : ''}${snapshot?.migration.net ?? 0}`}
          hint="近六月累计"
          icon={ArrowLeftRight}
          tone={(snapshot?.migration.net ?? 0) >= 0 ? 'success' : 'error'}
        />
      </div>

      <ChartCard
        title="近六个月迁入迁出对比"
        description="按住房历史记录聚合近六个月迁入迁出，热点默认汇总到区县层级。"
      >
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_GRADIENT_BLUE.start} />
                  <stop offset="95%" stopColor={CHART_GRADIENT_BLUE.end} />
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_GRADIENT_ORANGE.start} />
                  <stop offset="95%" stopColor={CHART_GRADIENT_ORANGE.end} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={CHART_TICK} />
              <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} />
              <CartesianGrid {...CHART_GRID_PROPS} />
              <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
              <Legend wrapperStyle={{ color: CHART_LEGEND }} formatter={(value) => <span style={{ color: 'var(--color-neutral-10)' }}>{value}</span>} />
              <Area type="monotone" dataKey="迁入" stroke={CHART_PRIMARY} strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
              <Area type="monotone" dataKey="迁出" stroke={CHART_WARNING} strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="迁入活跃区县 (Top 5)">
          <HorizontalBarList
            items={(snapshot?.migration.inboundHotspots ?? []).map((item) => ({
              label: item.name,
              value: item.value,
              color: CHART_PRIMARY,
            }))}
            emptyText="暂无匹配区县"
          />
        </ChartCard>

        <ChartCard title="迁出活跃区县 (Top 5)">
          <HorizontalBarList
            items={(snapshot?.migration.outboundHotspots ?? []).map((item) => ({
              label: item.name,
              value: item.value,
              color: CHART_WARNING,
            }))}
            emptyText="暂无匹配区县"
          />
        </ChartCard>
      </div>
    </div>
  );
}
