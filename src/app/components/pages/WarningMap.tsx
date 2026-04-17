import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, Filter, Loader2, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { analysisRepository, type AnalysisAnomalyItem, type AnalysisSeverity, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { downloadJson } from '../../services/export';
import { toast } from 'sonner';

function getLevelColor(level: AnalysisSeverity): string {
  switch (level) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
}

function getLevelLabel(level: AnalysisSeverity): string {
  switch (level) {
    case 'high':
      return '严重';
    case 'medium':
      return '中等';
    default:
      return '轻微';
  }
}

export function WarningMap() {
  const [snapshot, setSnapshot] = useState<GovernanceAnalysisSnapshot | null>(null);
  const [warningType, setWarningType] = useState('all');
  const [severity, setSeverity] = useState<'all' | AnalysisSeverity>('all');
  const [selectedWarningId, setSelectedWarningId] = useState<string | null>(null);
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

  const filteredWarnings = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return snapshot.anomalies.filter((warning) => {
      if (warningType !== 'all' && !warning.type.includes(warningType)) {
        return false;
      }
      if (severity !== 'all' && warning.severity !== severity) {
        return false;
      }
      return true;
    });
  }, [severity, snapshot, warningType]);

  const selectedWarning = filteredWarnings.find((item) => item.id === selectedWarningId) ?? null;

  const warningStats = useMemo(() => ({
    total: filteredWarnings.length,
    high: filteredWarnings.filter((item) => item.severity === 'high').length,
    medium: filteredWarnings.filter((item) => item.severity === 'medium').length,
    low: filteredWarnings.filter((item) => item.severity === 'low').length,
    pending: filteredWarnings.length,
    resolved: snapshot ? Math.max(snapshot.totals.conflicts - filteredWarnings.length, 0) : 0,
  }), [filteredWarnings, snapshot]);

  const areaWarnings = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return snapshot.grids.slice(0, 8).map((grid) => ({
      id: grid.id,
      area: grid.communityName,
      count: snapshot.anomalies.filter((item) => item.gridId === grid.id).length,
      resolved: grid.resolvedConflictCount + grid.completedTaskCount,
      pending: grid.pendingTaskCount,
      heatScore: grid.heatScore,
      statusLevel: grid.statusLevel,
      signals: grid.primarySignals,
    }));
  }, [snapshot]);

  const handleExport = () => {
    downloadJson(`warning-map-${new Date().toISOString().slice(0, 10)}.json`, {
      generatedAt: snapshot?.generatedAt,
      filters: { warningType, severity },
      summary: warningStats,
      warnings: filteredWarnings,
      hotspots: areaWarnings,
    });
    toast.success('预警热区快照已导出');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">预警地图</h1>
          <p className="text-gray-500">改为按网格热区视图展示真实预警分布，避免空地图视图。</p>
        </div>
        <div className="flex gap-3">
          <Select value={warningType} onValueChange={setWarningType}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="跟进">跟进超期</SelectItem>
              <SelectItem value="矛盾">矛盾压力</SelectItem>
              <SelectItem value="走访">走访覆盖</SelectItem>
              <SelectItem value="出租">出租密度</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={(value: 'all' | AnalysisSeverity) => setSeverity(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部等级</SelectItem>
              <SelectItem value="high">严重</SelectItem>
              <SelectItem value="medium">中等</SelectItem>
              <SelectItem value="low">轻微</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              预警总数
            </CardDescription>
            <CardTitle className="text-3xl">{warningStats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">待处理 {warningStats.pending}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>严重预警</CardDescription>
            <CardTitle className="text-3xl text-red-600">{warningStats.high}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">需立即处理</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>中等预警</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{warningStats.medium}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">需重点关注</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>轻微预警</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{warningStats.low}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">持续监测</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>已闭环动作</CardDescription>
            <CardTitle className="text-3xl text-green-600">{warningStats.resolved}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">纠纷化解 + 已完结待办</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>最高热区</CardDescription>
            <CardTitle className="text-2xl">{snapshot?.grids[0]?.communityName ?? '暂无'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">热度 {snapshot?.grids[0]?.heatScore ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>网格热区视图</CardTitle>
          <CardDescription>用网格热区板替代空地图视图，直接展示随机点击最关心的热点区域。</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {areaWarnings.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => {
                const firstWarning = filteredWarnings.find((item) => item.gridId === area.id);
                if (firstWarning) {
                  setSelectedWarningId(firstWarning.id);
                } else {
                  toast.info(`${area.area} 当前没有命中筛选条件下的预警明细`);
                }
              }}
              className="rounded-lg border p-4 text-left transition hover:shadow-md hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold">{area.area}</div>
                  <div className="text-xs text-muted-foreground mt-1">{area.count} 条预警信号</div>
                </div>
                <Badge className={getLevelColor(area.statusLevel)}>{getLevelLabel(area.statusLevel)}</Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>热度分</span>
                  <span className="font-medium text-foreground">{area.heatScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>待处理</span>
                  <span className="font-medium text-foreground">{area.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>已闭环</span>
                  <span className="font-medium text-foreground">{area.resolved}</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {area.signals.length ? area.signals.join('；') : '当前没有额外重点信号'}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>预警清单</CardTitle>
          <CardDescription>当前筛选下共 {filteredWarnings.length} 条，点击“查看详情”可展开解释。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredWarnings.map((warning) => (
            <div key={warning.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{warning.gridName}</span>
                  <Badge className={getLevelColor(warning.severity)}>{getLevelLabel(warning.severity)}</Badge>
                </div>
                <div className="text-sm">{warning.type}</div>
                <div className="text-sm text-muted-foreground">{warning.reason}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right text-sm">
                  <div className="font-medium">{warning.value}</div>
                  <div className="text-muted-foreground">基线 {warning.baseline}</div>
                </div>
                <Button variant="outline" onClick={() => setSelectedWarningId(warning.id)}>
                  查看详情
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedWarning)} onOpenChange={(open) => !open && setSelectedWarningId(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedWarning?.type}</DialogTitle>
            <DialogDescription>{selectedWarning?.gridName}</DialogDescription>
          </DialogHeader>
          {selectedWarning && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">指标值</div>
                  <div className="font-medium">{selectedWarning.value}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">基线</div>
                  <div className="font-medium">{selectedWarning.baseline}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">等级</div>
                  <div className="font-medium">{getLevelLabel(selectedWarning.severity)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">更新时间</div>
                  <div className="font-medium">{selectedWarning.date}</div>
                </div>
              </div>
              <div>
                <h4 className="mb-1 font-medium">原因说明</h4>
                <p className="text-muted-foreground">{selectedWarning.reason}</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium">影响判断</h4>
                <p className="text-muted-foreground">{selectedWarning.impact}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
