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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">人口流动趋势</h2>
          <p className="text-muted-foreground">基于真实住房历史记录与近六个月迁入迁出数据的趋势分析。</p>
        </div>
        <div className="flex gap-3">
          <Select value={scope} onValueChange={(value: ScopeKey) => setScope(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部热点</SelectItem>
              <SelectItem value="hot">高活跃社区</SelectItem>
              <SelectItem value="stable">低波动社区</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ChartCard title="近六月总迁入" className="md:col-span-1">
          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-4xl font-bold text-blue-600">{snapshot?.migration.totalIn ?? 0}</span>
            <span className="text-sm text-muted-foreground mt-2">人次</span>
          </div>
        </ChartCard>
        <ChartCard title="近六月总迁出" className="md:col-span-1">
          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-4xl font-bold text-orange-600">{snapshot?.migration.totalOut ?? 0}</span>
            <span className="text-sm text-muted-foreground mt-2">人次</span>
          </div>
        </ChartCard>
        <ChartCard title="净流入" className="md:col-span-1">
          <div className="flex flex-col items-center justify-center py-6">
            <span className={`text-4xl font-bold ${(snapshot?.migration.net ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(snapshot?.migration.net ?? 0) > 0 ? '+' : ''}{snapshot?.migration.net ?? 0}
            </span>
            <span className="text-sm text-muted-foreground mt-2">近六月累计</span>
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="近六个月迁入迁出对比"
        description="使用真实住房历史记录的起止日期聚合，不再引用手写年度样例。"
        action={(
          <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </button>
        )}
      >
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="迁入" stroke="#8884d8" fillOpacity={1} fill="url(#colorIn)" />
              <Area type="monotone" dataKey="迁出" stroke="#82ca9d" fillOpacity={1} fill="url(#colorOut)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="迁入活跃社区 (Top 5)">
          <div className="space-y-4 px-4">
            {filteredInbound.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-blue-200 rounded-full w-32 overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${(item.value / Math.max(filteredInbound[0]?.value ?? 1, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="迁出活跃社区 (Top 5)">
          <div className="space-y-4 px-4">
            {filteredOutbound.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-orange-200 rounded-full w-32 overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${(item.value / Math.max(filteredOutbound[0]?.value ?? 1, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
