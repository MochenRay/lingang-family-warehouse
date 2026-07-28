import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, Filter, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { analysisRepository, type AnalysisSeverity, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { downloadJson } from '../../services/export';
import { toast } from 'sonner';
import { PageHeader } from './PageHeader';
import { StatCard } from '../patterns/StatCard';
import { StatusBadge, type StatusTone } from '../patterns/StatusBadge';
import { LoadingState } from '../patterns/states';
import { DIALOG_CLASS, PANEL_CLASS } from '../patterns/surfaces';

function getLevelTone(level: AnalysisSeverity): StatusTone {
  switch (level) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    default:
      return 'info';
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
    return snapshot.grids.map((grid) => ({
      id: grid.id,
      area: grid.communityName,
      gridLabel: grid.gridLabel,
      districtName: grid.districtName,
      streetName: grid.streetName,
      count: snapshot.anomalies.filter((item) => item.gridId === grid.id).length,
      resolved: grid.resolvedConflictCount + grid.completedTaskCount,
      pending: grid.pendingTaskCount,
      highRiskCount: grid.highRiskCount,
      overdueTaskCount: grid.overdueTaskCount,
      visitCoverage: grid.visitCoverage,
      heatScore: grid.heatScore,
      statusLevel: grid.statusLevel,
    }));
  }, [snapshot]);

  type ZoneBoard = (typeof areaWarnings)[number];

  const zoneGroups = useMemo(() => {
    const groups = new Map<string, { key: string; districtName: string; streetName: string; maxHeatScore: number; areas: ZoneBoard[] }>();
    for (const area of areaWarnings) {
      const key = `${area.districtName}/${area.streetName}`;
      const group = groups.get(key);
      if (group) {
        group.areas.push(area);
        group.maxHeatScore = Math.max(group.maxHeatScore, area.heatScore);
      } else {
        groups.set(key, {
          key,
          districtName: area.districtName,
          streetName: area.streetName,
          maxHeatScore: area.heatScore,
          areas: [area],
        });
      }
    }
    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        areas: [...group.areas].sort(
          (left, right) =>
            right.heatScore - left.heatScore
            || left.area.localeCompare(right.area, 'zh-CN')
            || left.gridLabel.localeCompare(right.gridLabel, 'zh-CN'),
        ),
      }))
      .sort((left, right) => right.maxHeatScore - left.maxHeatScore || left.key.localeCompare(right.key, 'zh-CN'));
  }, [areaWarnings]);

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
      <div className="space-y-6">
        <PageHeader
          eyebrow="WARNING ZONES"
          title="预警热区"
          description="按区域和风险等级定位异常热点，支撑网格巡查与处置优先级。"
        />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="WARNING ZONES"
        title="预警热区"
        description="按区域和风险等级定位异常热点，支撑网格巡查与处置优先级。"
        actions={
          <div className="flex flex-wrap gap-3">
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
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <StatCard
          label="预警总数"
          value={warningStats.total}
          icon={AlertTriangle}
          hint={<StatusBadge tone="neutral">待处理 {warningStats.pending}</StatusBadge>}
        />
        <StatCard label="严重预警" value={warningStats.high} hint="需立即处理" tone="error" />
        <StatCard label="中等预警" value={warningStats.medium} hint="需重点关注" tone="warning" />
        <StatCard label="轻微预警" value={warningStats.low} hint="持续监测" tone="info" />
        <StatCard label="已闭环动作" value={warningStats.resolved} hint="纠纷化解 + 已完结待办" tone="success" />
        <StatCard
          label="最高热区"
          value={snapshot?.grids[0]?.communityName ?? '暂无'}
          hint={`热度 ${snapshot?.grids[0]?.heatScore ?? 0}`}
        />
      </div>

      <Card className={`${PANEL_CLASS} gap-0`}>
        <CardHeader className="border-b border-[var(--color-neutral-03)] px-4 py-3">
          <CardTitle>热区矩阵</CardTitle>
          <CardDescription>按区—街道分组展示全部 {areaWarnings.length} 个网格的热区板，组内按热度分降序。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-2 xl:grid-cols-3">
          {zoneGroups.map((group) => (
            <section
              key={group.key}
              data-testid="zone-group"
              aria-label={`${group.districtName} ${group.streetName}`}
              className="min-w-0 rounded-[4px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-3"
            >
              <div data-testid="zone-group-header" className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[var(--color-neutral-11)]">{group.districtName} · {group.streetName}</h3>
                  <p className="mt-0.5 text-xs text-[var(--color-neutral-08)]">最高热度 {group.maxHeatScore}</p>
                </div>
                <span className="shrink-0 text-xs text-[var(--color-neutral-08)]">{group.areas.length} 个网格</span>
              </div>
              <div className="space-y-2">
                {group.areas.map((area) => {
                  const summary = [
                    area.highRiskCount > 0 ? `高风险对象 ${area.highRiskCount} 人` : null,
                    area.overdueTaskCount > 0 ? `超期待办 ${area.overdueTaskCount} 条` : null,
                    area.visitCoverage > 0 ? `走访覆盖 ${area.visitCoverage}%` : null,
                  ].filter((item): item is string => Boolean(item));

                  return (
                    <button
                      key={area.id}
                      type="button"
                      data-testid="zone-board"
                      onClick={() => {
                        const firstWarning = filteredWarnings.find((item) => item.gridId === area.id);
                        if (firstWarning) {
                          setSelectedWarningId(firstWarning.id);
                        } else {
                          toast.info(`${area.area}${area.gridLabel} 当前没有命中筛选条件下的预警明细`);
                        }
                      }}
                      className="w-full rounded-[4px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-3 text-left transition-colors hover:border-[var(--color-brand-primary)]/50 hover:bg-[var(--color-neutral-03)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary-hover)]"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[var(--color-neutral-11)]">{area.area}</div>
                          <div className="mt-0.5 truncate text-xs text-[var(--color-neutral-08)]">{area.gridLabel} · {area.count} 条预警信号</div>
                        </div>
                        <StatusBadge tone={getLevelTone(area.statusLevel)}>{getLevelLabel(area.statusLevel)}</StatusBadge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-[var(--color-neutral-08)]">
                        <div className="rounded border border-[var(--color-neutral-03)] px-2 py-1.5">
                          <span>热度分</span>
                          <span className="ml-1 font-semibold text-[var(--color-neutral-11)]">{area.heatScore}</span>
                        </div>
                        <div className="rounded border border-[var(--color-neutral-03)] px-2 py-1.5">
                          <span>待处理</span>
                          <span className="ml-1 font-semibold text-[var(--color-neutral-11)]">{area.pending}</span>
                        </div>
                        <div className="rounded border border-[var(--color-neutral-03)] px-2 py-1.5">
                          <span>已闭环</span>
                          <span className="ml-1 font-semibold text-[var(--color-neutral-11)]">{area.resolved}</span>
                        </div>
                      </div>
                      {summary.length > 0 ? (
                        <div
                          data-testid="zone-summary"
                          className="mt-2 whitespace-nowrap text-[11px] leading-5 tracking-tight text-[var(--color-neutral-08)] 2xl:text-xs"
                        >
                          {summary.join('；')}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </CardContent>
      </Card>

      <Card className={PANEL_CLASS}>
        <CardHeader>
          <CardTitle>预警清单</CardTitle>
          <CardDescription>当前筛选下共 {filteredWarnings.length} 条，点击“查看详情”可展开解释。</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {filteredWarnings.map((warning) => (
            <div key={warning.id} data-testid="warning-list-item" data-warning-id={warning.id} className="flex flex-col gap-3 rounded-[4px] border p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--color-neutral-08)]" />
                  <span className="font-medium">{warning.gridName}</span>
                  <StatusBadge tone={getLevelTone(warning.severity)}>{getLevelLabel(warning.severity)}</StatusBadge>
                </div>
                <div className="text-sm">{warning.type}</div>
                <div className="text-sm text-[var(--color-neutral-08)]">{warning.reason}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right text-sm">
                  <div className="font-medium">{warning.value}</div>
                  <div className="text-[var(--color-neutral-08)]">基线 {warning.baseline}</div>
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
        <DialogContent className={`${DIALOG_CLASS} max-w-xl`}>
          <DialogHeader>
            <DialogTitle>{selectedWarning?.type}</DialogTitle>
            <DialogDescription>{selectedWarning?.gridName}</DialogDescription>
          </DialogHeader>
          {selectedWarning && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 rounded-[4px] bg-[var(--color-neutral-02)] p-4 md:grid-cols-2">
                <div>
                  <div className="text-[var(--color-neutral-08)]">指标值</div>
                  <div className="font-medium">{selectedWarning.value}</div>
                </div>
                <div>
                  <div className="text-[var(--color-neutral-08)]">基线</div>
                  <div className="font-medium">{selectedWarning.baseline}</div>
                </div>
                <div>
                  <div className="text-[var(--color-neutral-08)]">等级</div>
                  <div className="font-medium">{getLevelLabel(selectedWarning.severity)}</div>
                </div>
                <div>
                  <div className="text-[var(--color-neutral-08)]">更新时间</div>
                  <div className="font-medium">{selectedWarning.date}</div>
                </div>
              </div>
              <div>
                <h4 className="mb-1 font-medium">原因说明</h4>
                <p className="text-[var(--color-neutral-08)]">{selectedWarning.reason}</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium">影响判断</h4>
                <p className="text-[var(--color-neutral-08)]">{selectedWarning.impact}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
