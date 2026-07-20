import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { analysisRepository, type AnalysisSeverity, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { downloadJson } from '../../services/export';
import { toast } from 'sonner';
import { ChartCard } from '../statistics/ChartCard';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { PageHeader } from './PageHeader';
import { StatCard } from '../patterns/StatCard';
import { StatusBadge, type StatusTone } from '../patterns/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../patterns/states';
import { PANEL_CLASS } from '../patterns/surfaces';
import {
  CHART_COLORS,
  CHART_ERROR,
  CHART_GRID_PROPS,
  CHART_LABEL,
  CHART_LEGEND,
  CHART_PRIMARY,
  CHART_SUCCESS,
  CHART_TICK,
  CHART_WARNING,
} from '../../config/chartConfig';

const SEVERITY_TONE: Record<AnalysisSeverity, StatusTone> = {
  high: 'error',
  medium: 'warning',
  low: 'info',
};

const INNER_PANEL_CLASS = 'rounded-[4px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const MUTED_TEXT = 'text-[var(--color-neutral-08)]';

function getSeverityLabel(severity: AnalysisSeverity): string {
  switch (severity) {
    case 'high':
      return '严重';
    case 'medium':
      return '中等';
    default:
      return '轻微';
  }
}

export function AnomalyAnalysis() {
  const [snapshot, setSnapshot] = useState<GovernanceAnalysisSnapshot | null>(null);
  const [severity, setSeverity] = useState<'all' | AnalysisSeverity>('all');
  const [loading, setLoading] = useState(true);

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const nextSnapshot = await analysisRepository.getGovernanceSnapshot();
      setSnapshot(nextSnapshot);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSnapshot();
  }, []);

  const filteredAnomalies = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return severity === 'all'
      ? snapshot.anomalies
      : snapshot.anomalies.filter((item) => item.severity === severity);
  }, [severity, snapshot]);

  const typeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of filteredAnomalies) {
      counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredAnomalies]);

  const gridHeatData = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return snapshot.grids.slice(0, 6).map((grid) => ({
      name: grid.communityName,
      热度: grid.heatScore,
      超期: grid.overdueTaskCount,
      纠纷: grid.activeConflictCount,
    }));
  }, [snapshot]);

  const trendData = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return snapshot.monthly.map((item) => ({
      month: item.month,
      走访: item.visits,
      纠纷: item.conflicts,
      迁出: item.moveOuts,
    }));
  }, [snapshot]);

  const handleExport = () => {
    if (!snapshot) {
      return;
    }
    downloadJson(`anomaly-analysis-${new Date().toISOString().slice(0, 10)}.json`, {
      generatedAt: snapshot.generatedAt,
      severity,
      summary: {
        total: snapshot.anomalies.length,
        filtered: filteredAnomalies.length,
      },
      anomalies: filteredAnomalies,
      grids: snapshot.grids,
      monthly: snapshot.monthly,
    });
    toast.success('异常分析快照已导出');
  };

  if (loading) {
    return (
      <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
        <PageHeader
          eyebrow="ATTRIBUTION LEDGER"
          title="异常结果分析"
          description="围绕真实的人、房、走访、矛盾与待办投影，识别当前最容易穿帮的治理异常。"
        />
        <LoadingState />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <Card className={PANEL_CLASS}>
        <ErrorState title="异常分析暂不可用" description="当前未能读取治理快照，请稍后刷新。" />
      </Card>
    );
  }

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
      <PageHeader
        eyebrow="ATTRIBUTION LEDGER"
        title="异常结果分析"
        description="围绕真实的人、房、走访、矛盾与待办投影，识别当前最容易穿帮的治理异常。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={severity} onValueChange={(value: 'all' | AnalysisSeverity) => setSeverity(value)}>
              <SelectTrigger className="w-[140px] border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
                <AlertTriangle className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="high">严重</SelectItem>
                <SelectItem value="medium">中等</SelectItem>
                <SelectItem value="low">轻微</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => void loadSnapshot()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard
          label="当前异常总数"
          value={snapshot.anomalies.length}
          hint="来自真实对象源的规则化异常"
        />
        <StatCard
          label="严重异常"
          value={snapshot.anomalies.filter((item) => item.severity === 'high').length}
          hint="需要优先处理"
          tone="error"
        />
        <StatCard
          label="中等异常"
          value={snapshot.anomalies.filter((item) => item.severity === 'medium').length}
          hint="建议纳入本周动作"
          tone="warning"
        />
        <StatCard
          label="重点热区"
          value={snapshot.grids[0]?.communityName ?? '暂无'}
          hint={`热度 ${snapshot.grids[0]?.heatScore ?? 0} / 100`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="异常类型分布" description="当前筛选条件下的异常结构">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeDistribution} dataKey="value" nameKey="name" outerRadius={88} label={{ fill: CHART_LABEL }}>
                  {typeDistribution.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="网格热度与超期分布"
          description="优先展示最容易在自由浏览中暴露问题的网格"
        >
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gridHeatData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CHART_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} />
                <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                <Legend wrapperStyle={{ color: CHART_LEGEND }} />
                <Bar dataKey="热度" fill={CHART_WARNING} radius={[4, 4, 0, 0]} />
                <Bar dataKey="超期" fill={CHART_ERROR} radius={[4, 4, 0, 0]} />
                <Bar dataKey="纠纷" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="近六个月风险信号趋势" description="用真实走访、纠纷和迁出记录观察波动，而不是随机生成趋势。">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid {...CHART_GRID_PROPS} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={CHART_TICK} />
              <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} />
              <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
              <Legend wrapperStyle={{ color: CHART_LEGEND }} />
              <Line type="monotone" dataKey="走访" stroke={CHART_SUCCESS} strokeWidth={2} />
              <Line type="monotone" dataKey="纠纷" stroke={CHART_ERROR} strokeWidth={2} />
              <Line type="monotone" dataKey="迁出" stroke={CHART_WARNING} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <Card className={PANEL_CLASS}>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">异常清单</CardTitle>
          <CardDescription className={MUTED_TEXT}>当前共 {filteredAnomalies.length} 条，优先关注严重异常与超期问题。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAnomalies.length === 0 ? (
            <EmptyState
              title="当前筛选条件下没有命中异常"
              description="说明对应等级的问题已被压平。"
            />
          ) : (
            filteredAnomalies.map((item) => (
              <div key={item.id} className={`${INNER_PANEL_CLASS} space-y-3 p-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[var(--color-neutral-11)]">{item.type}</span>
                      <StatusBadge tone={SEVERITY_TONE[item.severity]}>
                        {getSeverityLabel(item.severity)}
                      </StatusBadge>
                    </div>
                    <p className={`text-sm ${MUTED_TEXT}`}>{item.gridName}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-[var(--color-neutral-11)]">{item.value}</div>
                    <div className={MUTED_TEXT}>基线 {item.baseline}</div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 text-sm">
                  <div>
                    <span className="font-medium text-[var(--color-neutral-11)]">原因：</span>
                    {item.reason}
                  </div>
                  <div>
                    <span className="font-medium text-[var(--color-neutral-11)]">影响：</span>
                    {item.impact}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
