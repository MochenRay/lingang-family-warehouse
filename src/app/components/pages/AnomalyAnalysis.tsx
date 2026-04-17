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

const SEVERITY_COLORS: Record<AnalysisSeverity, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};

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
      <Card>
        <CardHeader>
          <CardTitle>异常分析暂不可用</CardTitle>
          <CardDescription>当前未能读取治理快照，请稍后刷新。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">异常结果分析</h1>
          <p className="text-muted-foreground">
            围绕真实的人、房、走访、矛盾与待办投影，识别当前最容易穿帮的治理异常。
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={severity} onValueChange={(value: 'all' | AnalysisSeverity) => setSeverity(value)}>
            <SelectTrigger className="w-[140px]">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>当前异常总数</CardDescription>
            <CardTitle className="text-3xl">{snapshot.anomalies.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">来自真实对象源的规则化异常</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>严重异常</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {snapshot.anomalies.filter((item) => item.severity === 'high').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">需要优先处理</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>中等异常</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">
              {snapshot.anomalies.filter((item) => item.severity === 'medium').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">建议纳入本周动作</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>重点热区</CardDescription>
            <CardTitle className="text-2xl">{snapshot.grids[0]?.communityName ?? '暂无'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              热度 {snapshot.grids[0]?.heatScore ?? 0} / 100
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>异常类型分布</CardTitle>
            <CardDescription>当前筛选条件下的异常结构</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeDistribution} dataKey="value" nameKey="name" outerRadius={88} label>
                    {typeDistribution.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={Object.values(SEVERITY_COLORS)[index % Object.values(SEVERITY_COLORS).length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>网格热度与超期分布</CardTitle>
            <CardDescription>优先展示最容易在自由浏览中暴露问题的网格</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gridHeatData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="热度" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="超期" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="纠纷" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>近六个月风险信号趋势</CardTitle>
          <CardDescription>用真实走访、纠纷和迁出记录观察波动，而不是随机生成趋势。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="走访" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="纠纷" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="迁出" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>异常清单</CardTitle>
          <CardDescription>当前共 {filteredAnomalies.length} 条，优先关注严重异常与超期问题。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAnomalies.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              当前筛选条件下没有命中异常，说明对应等级的问题已被压平。
            </div>
          ) : (
            filteredAnomalies.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{item.type}</span>
                      <Badge
                        variant="outline"
                        style={{ borderColor: SEVERITY_COLORS[item.severity], color: SEVERITY_COLORS[item.severity] }}
                      >
                        {getSeverityLabel(item.severity)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.gridName}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{item.value}</div>
                    <div className="text-muted-foreground">基线 {item.baseline}</div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 text-sm">
                  <div>
                    <span className="font-medium">原因：</span>
                    {item.reason}
                  </div>
                  <div>
                    <span className="font-medium">影响：</span>
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
