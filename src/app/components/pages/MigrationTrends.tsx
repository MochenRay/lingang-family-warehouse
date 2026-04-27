import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { ChartCard } from '../statistics/ChartCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
import { HorizontalBarList } from '../statistics/HorizontalBarList';

type ScopeKey = 'all' | 'hot' | 'stable';

export function MigrationTrends() {
  const [snapshot, setSnapshot] = useState<GovernanceAnalysisSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<ScopeKey>('all');

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

  const filteredInbound = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    const items = snapshot.migration.inboundHotspots;
    if (scope === 'stable') {
      return items.filter((item) => item.value <= 3);
    }
    if (scope === 'hot') {
      return items.filter((item) => item.value >= 3);
    }
    return items;
  }, [scope, snapshot]);

  const filteredOutbound = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    const items = snapshot.migration.outboundHotspots;
    if (scope === 'stable') {
      return items.filter((item) => item.value <= 3);
    }
    if (scope === 'hot') {
      return items.filter((item) => item.value >= 3);
    }
    return items;
  }, [scope, snapshot]);

  const handleExport = () => {
    downloadJson(`migration-trends-${new Date().toISOString().slice(0, 10)}.json`, {
      generatedAt: snapshot?.generatedAt,
      scope,
      migration: snapshot?.migration,
      monthly: snapshot?.monthly,
    });
    toast.success('人口流动快照已导出');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">人口流动趋势</h2>
          <p className="mt-1 text-sm text-[var(--color-neutral-08)]">默认先看区县级迁入迁出，再下钻街镇、社区和网格。</p>
        </div>
        <div className="flex gap-3">
          <Select value={scope} onValueChange={(value: ScopeKey) => setScope(value)}>
            <SelectTrigger className="w-[180px] border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部区县</SelectItem>
              <SelectItem value="hot">高活跃区县</SelectItem>
              <SelectItem value="stable">低波动区县</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ChartCard title="近六月总迁入" className="md:col-span-1">
          <div className="flex items-end justify-between py-2">
            <span className="text-4xl font-bold tabular-nums text-[#4E86DF]">{snapshot?.migration.totalIn ?? 0}</span>
            <span className="pb-1 text-xs text-[var(--color-neutral-08)]">人次</span>
          </div>
        </ChartCard>
        <ChartCard title="近六月总迁出" className="md:col-span-1">
          <div className="flex items-end justify-between py-2">
            <span className="text-4xl font-bold tabular-nums text-[#D6730D]">{snapshot?.migration.totalOut ?? 0}</span>
            <span className="pb-1 text-xs text-[var(--color-neutral-08)]">人次</span>
          </div>
        </ChartCard>
        <ChartCard title="净流入" className="md:col-span-1">
          <div className="flex items-end justify-between py-2">
            <span className={`text-4xl font-bold tabular-nums ${(snapshot?.migration.net ?? 0) >= 0 ? 'text-[#19B172]' : 'text-[#D52132]'}`}>
              {(snapshot?.migration.net ?? 0) > 0 ? '+' : ''}{snapshot?.migration.net ?? 0}
            </span>
            <span className="pb-1 text-xs text-[var(--color-neutral-08)]">近六月累计</span>
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="近六个月迁入迁出对比"
        description="按住房历史记录聚合近六个月迁入迁出，热点默认汇总到区县层级。"
        action={(
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-white" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </button>
        )}
      >
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4E86DF" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#4E86DF" stopOpacity={0.06} />
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D6730D" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#D6730D" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8194B5' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8194B5' }} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3d4663" />
              <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
              <Legend wrapperStyle={{ color: '#AEC0DE' }} />
              <Area type="monotone" dataKey="迁入" stroke="#4E86DF" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
              <Area type="monotone" dataKey="迁出" stroke="#D6730D" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="迁入活跃区县 (Top 5)">
          <HorizontalBarList
            items={filteredInbound.map((item) => ({
              label: item.name,
              value: item.value,
              color: '#4E86DF',
            }))}
            emptyText="暂无匹配区县"
          />
        </ChartCard>

        <ChartCard title="迁出活跃区县 (Top 5)">
          <HorizontalBarList
            items={filteredOutbound.map((item) => ({
              label: item.name,
              value: item.value,
              color: '#D6730D',
            }))}
            emptyText="暂无匹配区县"
          />
        </ChartCard>
      </div>
    </div>
  );
}
