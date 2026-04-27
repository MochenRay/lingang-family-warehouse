import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, Loader2, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { analysisRepository, type AnalysisSeverity, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { downloadJson } from '../../services/export';
import { toast } from 'sonner';
import { ChartCard } from '../statistics/ChartCard';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';

const SEVERITY_COLORS: Record<AnalysisSeverity, string> = {
  high: '#D52132',
  medium: '#D6730D',
  low: '#4E86DF',
};

const PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const INNER_PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)]';
const MUTED_TEXT = 'text-[var(--color-neutral-08)]';
const GRID_STROKE = '#3d4663';
const AXIS_TICK = { fill: '#6b7599', fontSize: 12 };
const CHART_COLORS = ['#D52132', '#D6730D', '#4E86DF', '#19B172', '#8B5CF6'];

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
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <Card className={PANEL_CLASS}>
        <CardHeader>
          <CardTitle className="text-white">异常分析暂不可用</CardTitle>
          <CardDescription className={MUTED_TEXT}>当前未能读取治理快照，请稍后刷新。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-[0.12em] text-[#4E86DF]">ATTRIBUTION LEDGER</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">异常结果分析</h1>
          <p className={`mt-2 max-w-3xl text-sm leading-6 ${MUTED_TEXT}`}>
            围绕真实的人、房、走访、矛盾与待办投影，识别当前最容易穿帮的治理异常。
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>当前异常总数</CardDescription>
            <CardTitle className="text-3xl text-white">{snapshot.anomalies.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>来自真实对象源的规则化异常</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>严重异常</CardDescription>
            <CardTitle className="text-3xl text-[#D52132]">
              {snapshot.anomalies.filter((item) => item.severity === 'high').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>需要优先处理</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>中等异常</CardDescription>
            <CardTitle className="text-3xl text-[#D6730D]">
              {snapshot.anomalies.filter((item) => item.severity === 'medium').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>建议纳入本周动作</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardHeader className="pb-3">
            <CardDescription className={MUTED_TEXT}>重点热区</CardDescription>
            <CardTitle className="truncate text-2xl text-white">{snapshot.grids[0]?.communityName ?? '暂无'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${MUTED_TEXT}`}>
              热度 {snapshot.grids[0]?.heatScore ?? 0} / 100
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="异常类型分布" description="当前筛选条件下的异常结构">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeDistribution} dataKey="value" nameKey="name" outerRadius={88} label>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                <Legend wrapperStyle={{ color: '#AFC0E8' }} />
                <Bar dataKey="热度" fill="#D6730D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="超期" fill="#D52132" radius={[4, 4, 0, 0]} />
                <Bar dataKey="纠纷" fill="#4E86DF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="近六个月风险信号趋势" description="用真实走访、纠纷和迁出记录观察波动，而不是随机生成趋势。">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
              <Legend wrapperStyle={{ color: '#AFC0E8' }} />
              <Line type="monotone" dataKey="走访" stroke="#19B172" strokeWidth={2} />
              <Line type="monotone" dataKey="纠纷" stroke="#D52132" strokeWidth={2} />
              <Line type="monotone" dataKey="迁出" stroke="#D6730D" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <Card className={PANEL_CLASS}>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">异常清单</CardTitle>
          <CardDescription className={MUTED_TEXT}>当前共 {filteredAnomalies.length} 条，优先关注严重异常与超期问题。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAnomalies.length === 0 ? (
            <div className={`rounded-lg border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-6 text-sm ${MUTED_TEXT}`}>
              当前筛选条件下没有命中异常，说明对应等级的问题已被压平。
            </div>
          ) : (
            filteredAnomalies.map((item) => (
              <div key={item.id} className={`${INNER_PANEL_CLASS} space-y-3 p-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{item.type}</span>
                      <Badge
                        variant="outline"
                        className="bg-transparent"
                        style={{ borderColor: SEVERITY_COLORS[item.severity], color: SEVERITY_COLORS[item.severity] }}
                      >
                        {getSeverityLabel(item.severity)}
                      </Badge>
                    </div>
                    <p className={`text-sm ${MUTED_TEXT}`}>{item.gridName}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium text-white">{item.value}</div>
                    <div className={MUTED_TEXT}>基线 {item.baseline}</div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 text-sm">
                  <div>
                    <span className="font-medium text-white">原因：</span>
                    {item.reason}
                  </div>
                  <div>
                    <span className="font-medium text-white">影响：</span>
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
