import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { ChartCard } from '../statistics/ChartCard';
import { Button } from '../ui/button';
import { Table, TableCell, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { analysisRepository, type AnalysisGridMetric, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { downloadJson } from '../../services/export';
import { toast } from 'sonner';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { CHART_AXIS, CHART_GRID_PROPS, CHART_PRIMARY, CHART_TICK, CHART_WARNING } from '../../config/chartConfig';
import { SortableHeader } from '../statistics/SortableHeader';
import { DataTableBody } from '../patterns/DataTableShell';
import { StatusBadge } from '../patterns/StatusBadge';
import { PageHeader } from './PageHeader';

type CompareLevel = 'district' | 'street' | 'community' | 'grid';
type IndicatorKey = 'population' | 'floating' | 'risk' | 'visit' | 'task';
type ScopeKey = 'top5' | 'all' | 'warning';
type SortDirection = 'asc' | 'desc';
type ComparisonSortKey = 'rank' | 'name' | 'current' | 'average' | 'target' | 'averageDiff' | 'targetDiff' | 'heatScore';

interface ComparisonRow {
  id: string;
  name: string;
  current: number;
  average: number;
  target: number;
  averageDiff: number;
  averageDiffRate: number;
  targetDiff: number;
  heatScore: number;
  statusLevel: AnalysisGridMetric['statusLevel'];
}

interface ComparisonFilters {
  compareLevel: CompareLevel;
  indicator: IndicatorKey;
  scope: ScopeKey;
}

const DEFAULT_COMPARISON_FILTERS: ComparisonFilters = {
  compareLevel: 'district',
  indicator: 'population',
  scope: 'top5',
};

const DEFAULT_COMPARISON_SORT: { key: ComparisonSortKey; direction: SortDirection } = {
  key: 'current',
  direction: 'desc',
};

function getMetricValue(grid: AnalysisGridMetric, indicator: IndicatorKey): number {
  switch (indicator) {
    case 'population':
      return grid.peopleCount;
    case 'floating':
      return grid.floatingCount;
    case 'risk':
      return grid.highRiskCount + grid.mediumRiskCount;
    case 'visit':
      return grid.visitCount;
    case 'task':
      return grid.pendingTaskCount + grid.overdueTaskCount;
    default:
      return 0;
  }
}

function getMetricLabel(indicator: IndicatorKey): string {
  switch (indicator) {
    case 'population':
      return '常住人口';
    case 'floating':
      return '流动人口';
    case 'risk':
      return '重点关注对象';
    case 'visit':
      return '走访记录';
    case 'task':
      return '待跟进任务';
    default:
      return '指标';
  }
}

function getTargetValue(indicator: IndicatorKey): number {
  switch (indicator) {
    case 'floating':
      return 12;
    case 'risk':
      return 4;
    case 'visit':
      return 28;
    case 'task':
      return 3;
    default:
      return 120;
  }
}

function getLevelLabel(level: CompareLevel): string {
  switch (level) {
    case 'district':
      return '区县';
    case 'street':
      return '街镇';
    case 'community':
      return '社区';
    case 'grid':
      return '网格';
    default:
      return '区域';
  }
}

function getGroupId(grid: AnalysisGridMetric, level: CompareLevel): string {
  switch (level) {
    case 'district':
      return `district:${grid.districtName}`;
    case 'street':
      return `street:${grid.districtName}:${grid.streetName}`;
    case 'community':
      return `community:${grid.districtName}:${grid.streetName}:${grid.communityName}`;
    case 'grid':
      return `grid:${grid.id}`;
    default:
      return grid.id;
  }
}

function getGroupName(grid: AnalysisGridMetric, level: CompareLevel): string {
  switch (level) {
    case 'district':
      return grid.districtName;
    case 'street':
      return `${grid.districtName} / ${grid.streetName}`;
    case 'community':
      return `${grid.districtName} / ${grid.streetName} / ${grid.communityName}`;
    case 'grid':
      return `${grid.districtName} / ${grid.streetName} / ${grid.communityName} / ${grid.gridLabel}`;
    default:
      return grid.name;
  }
}

function severityRank(level: AnalysisGridMetric['statusLevel']): number {
  switch (level) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function filtersEqual(left: ComparisonFilters, right: ComparisonFilters) {
  return left.compareLevel === right.compareLevel
    && left.indicator === right.indicator
    && left.scope === right.scope;
}

interface ComparisonChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    fill?: string;
    dataKey?: string;
  }>;
  label?: string | number;
  averageValue: number;
  targetValue: number;
}

function ComparisonChartTooltip({ active, payload, label, averageValue, targetValue }: ComparisonChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div data-testid="comparison-chart-tooltip">
      <DarkChartTooltip
        active
        label={label}
        payload={[
          ...payload,
          { name: '片区均值', value: formatNumber(averageValue), color: CHART_AXIS },
          { name: '治理目标', value: formatNumber(targetValue), color: CHART_WARNING },
        ]}
      />
    </div>
  );
}

export function DataComparison() {
  const [snapshot, setSnapshot] = useState<GovernanceAnalysisSnapshot | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [querying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [draftFilters, setDraftFilters] = useState<ComparisonFilters>(DEFAULT_COMPARISON_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ComparisonFilters>(DEFAULT_COMPARISON_FILTERS);
  const [sortState, setSortState] = useState(DEFAULT_COMPARISON_SORT);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialSnapshot() {
      try {
        setInitialLoading(true);
        setQueryError('');
        const next = await analysisRepository.getGovernanceSnapshot();
        if (!cancelled) {
          setSnapshot(next);
        }
      } catch {
        if (!cancelled) {
          setQueryError('数据加载失败，请修改条件后重新查询。');
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    }

    void loadInitialSnapshot();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = !filtersEqual(draftFilters, appliedFilters);
  const { compareLevel, indicator, scope } = appliedFilters;

  const handleQuery = async () => {
    const nextFilters = { ...draftFilters };
    setQuerying(true);
    setQueryError('');
    try {
      const next = await analysisRepository.getGovernanceSnapshot();
      setSnapshot(next);
      setAppliedFilters(nextFilters);
    } catch {
      setQueryError('查询失败，已保留上次结果，请稍后重试。');
      toast.error('查询失败，已保留上次结果');
    } finally {
      setQuerying(false);
    }
  };

  const comparison = useMemo(() => {
    if (!snapshot) {
      return { rows: [] as ComparisonRow[], averageValue: 0, targetValue: getTargetValue(indicator) };
    }

    let grids = [...snapshot.grids];
    if (scope === 'warning') {
      grids = grids.filter((grid) => grid.statusLevel !== 'low');
    }

    const grouped = new Map<string, { id: string; name: string; current: number; heatTotal: number; count: number; statusLevel: AnalysisGridMetric['statusLevel'] }>();
    grids.forEach((grid) => {
      const id = getGroupId(grid, compareLevel);
      const existing = grouped.get(id) ?? {
        id,
        name: getGroupName(grid, compareLevel),
        current: 0,
        heatTotal: 0,
        count: 0,
        statusLevel: 'low' as AnalysisGridMetric['statusLevel'],
      };
      existing.current += getMetricValue(grid, indicator);
      existing.heatTotal += grid.heatScore;
      existing.count += 1;
      if (severityRank(grid.statusLevel) > severityRank(existing.statusLevel)) {
        existing.statusLevel = grid.statusLevel;
      }
      grouped.set(id, existing);
    });

    const groupedRows = Array.from(grouped.values());
    const rawValues = groupedRows.map((row) => row.current);
    const averageValue = rawValues.length
      ? rawValues.reduce((sum, value) => sum + value, 0) / rawValues.length
      : 0;
    const averageReference = Number(averageValue.toFixed(1));
    const targetReference = getTargetValue(indicator);

    const mapped: ComparisonRow[] = groupedRows.map((row) => {
      const current = row.current;
      const averageDiff = current - averageReference;
      const targetDiff = current - targetReference;
      return {
        id: row.id,
        name: row.name,
        current,
        average: averageReference,
        target: targetReference,
        averageDiff,
        averageDiffRate: averageReference === 0 ? 0 : (averageDiff / averageReference) * 100,
        targetDiff,
        heatScore: row.count ? Number((row.heatTotal / row.count).toFixed(1)) : 0,
        statusLevel: row.statusLevel,
      };
    });

    mapped.sort((left, right) => right.current - left.current || left.name.localeCompare(right.name, 'zh-CN'));
    const visibleRows = scope === 'top5' ? mapped.slice(0, 5) : mapped;
    const directionMultiplier = sortState.direction === 'asc' ? 1 : -1;

    const rows = [...visibleRows].sort((left, right) => {
      if (sortState.key === 'name') {
        const result = left.name.localeCompare(right.name, 'zh-CN');
        return result * directionMultiplier || right.current - left.current;
      }

      const leftValue = sortState.key === 'rank' ? left.current : left[sortState.key];
      const rightValue = sortState.key === 'rank' ? right.current : right[sortState.key];
      const result = leftValue - rightValue;
      return result * directionMultiplier || right.current - left.current || left.name.localeCompare(right.name, 'zh-CN');
    });
    return { rows, averageValue: averageReference, targetValue: targetReference };
  }, [compareLevel, indicator, scope, snapshot, sortState]);

  const { rows, averageValue, targetValue } = comparison;

  const chartData = rows.map((row) => ({
    name: row.name,
    当前值: row.current,
  }));

  const handleExport = () => {
    downloadJson(`data-comparison-${compareLevel}-${indicator}-${new Date().toISOString().slice(0, 10)}.json`, {
      generatedAt: snapshot?.generatedAt,
      compareLevel,
      indicator,
      scope,
      averageValue,
      targetValue,
      rows,
    });
    toast.success('对比结果已导出');
  };

  const handleSort = (key: ComparisonSortKey) => {
    setSortState((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }

      return { key, direction: key === 'name' ? 'asc' : 'desc' };
    });
  };

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
      <PageHeader
        eyebrow="COMPARISON ANALYTICS"
        title="数据对比分析"
        description="快速定位辖区异常指标和偏离幅度，支撑治理资源优先投向高压片区。"
      />

      <Card className="rounded-[8px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[var(--color-neutral-08)]">对比层级</Label>
              <Select value={draftFilters.compareLevel} onValueChange={(value: CompareLevel) => setDraftFilters((current) => ({ ...current, compareLevel: value }))}>
                <SelectTrigger data-testid="comparison-filter-level" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="district">区县</SelectItem>
                  <SelectItem value="street">街镇</SelectItem>
                  <SelectItem value="community">社区</SelectItem>
                  <SelectItem value="grid">网格</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[var(--color-neutral-08)]">分析指标</Label>
              <Select value={draftFilters.indicator} onValueChange={(value: IndicatorKey) => setDraftFilters((current) => ({ ...current, indicator: value }))}>
                <SelectTrigger data-testid="comparison-filter-indicator" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="population">常住人口</SelectItem>
                  <SelectItem value="floating">流动人口</SelectItem>
                  <SelectItem value="risk">重点关注对象</SelectItem>
                  <SelectItem value="visit">走访记录</SelectItem>
                  <SelectItem value="task">待跟进任务</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[var(--color-neutral-08)]">聚焦范围</Label>
              <Select value={draftFilters.scope} onValueChange={(value: ScopeKey) => setDraftFilters((current) => ({ ...current, scope: value }))}>
                <SelectTrigger data-testid="comparison-filter-scope" className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top5">Top 5 热点{getLevelLabel(draftFilters.compareLevel)}</SelectItem>
                  <SelectItem value="all">全辖区</SelectItem>
                  <SelectItem value="warning">重点关注{getLevelLabel(draftFilters.compareLevel)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
              <Button
                data-testid="comparison-query"
                className="min-w-[96px] flex-1 xl:flex-none"
                onClick={() => void handleQuery()}
                disabled={initialLoading || querying || !isDirty}
              >
                {initialLoading || querying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                {initialLoading ? '加载中' : querying ? '查询中' : '查询'}
              </Button>
              <Button variant="outline" className="min-w-[92px] flex-1 shrink-0 xl:flex-none" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
          {queryError ? (
            <div role="alert" className="mt-3 rounded-[4px] border border-[var(--color-status-error-border)] bg-[var(--color-status-error-bg)] px-3 py-2 text-sm text-[var(--color-status-error-text)]">
              {queryError}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title={`${getLevelLabel(compareLevel)}趋势直方图`}
          description={`${getMetricLabel(indicator)}当前值与片区均值、治理目标对比`}
          className="lg:col-span-3"
        >
          <div aria-label="数据对比图例" className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-neutral-09)]">
            <span data-testid="comparison-legend-item" className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHART_PRIMARY }} />
              当前值
            </span>
            <span data-testid="comparison-legend-item" className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-0.5 w-5" style={{ backgroundColor: CHART_AXIS }} />
              片区均值 {formatNumber(averageValue)}
            </span>
            <span data-testid="comparison-legend-item" className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-0.5 w-5" style={{ backgroundColor: CHART_WARNING }} />
              治理目标 {formatNumber(targetValue)}
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 28, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID_PROPS} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CHART_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} />
                <Tooltip content={<ComparisonChartTooltip averageValue={averageValue} targetValue={targetValue} />} cursor={DARK_TOOLTIP_CURSOR} />
                <Bar dataKey="当前值" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} barSize={30} />
                <ReferenceLine
                  y={averageValue}
                  name={`片区均值 ${formatNumber(averageValue)}`}
                  stroke={CHART_AXIS}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  ifOverflow="extendDomain"
                  label={{ value: `片区均值 ${formatNumber(averageValue)}`, position: 'insideTopRight', fill: CHART_AXIS, fontSize: 11 }}
                />
                <ReferenceLine
                  y={targetValue}
                  name={`治理目标 ${formatNumber(targetValue)}`}
                  stroke={CHART_WARNING}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                  label={{ value: `治理目标 ${formatNumber(targetValue)}`, position: 'insideBottomRight', fill: CHART_WARNING, fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <Card className="rounded-[8px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none">
        <CardHeader className="px-5 pb-2 pt-5">
          <CardTitle className="text-base font-semibold text-white">详细数据明细</CardTitle>
          <CardDescription className="text-sm text-[var(--color-neutral-08)]">以统一对象口径对比当前值、片区均值和治理目标，点击列头排序。</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <Table className="min-w-[1040px]">
            <TableHeader>
              <TableRow className="border-b border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                <SortableHeader sortKey="rank" currentKey={sortState.key} direction={sortState.direction} label="排名" align="left" className="w-[80px]" onSort={handleSort} />
                <SortableHeader sortKey="name" currentKey={sortState.key} direction={sortState.direction} label="区域名称" align="left" onSort={handleSort} />
                <SortableHeader sortKey="current" currentKey={sortState.key} direction={sortState.direction} label="当前值" onSort={handleSort} />
                <SortableHeader sortKey="average" currentKey={sortState.key} direction={sortState.direction} label="片区均值" onSort={handleSort} />
                <SortableHeader sortKey="target" currentKey={sortState.key} direction={sortState.direction} label="治理目标" onSort={handleSort} />
                <SortableHeader sortKey="averageDiff" currentKey={sortState.key} direction={sortState.direction} label="较均值" onSort={handleSort} />
                <SortableHeader sortKey="targetDiff" currentKey={sortState.key} direction={sortState.direction} label="较目标" onSort={handleSort} />
                <SortableHeader sortKey="heatScore" currentKey={sortState.key} direction={sortState.direction} label="趋势判定" align="center" onSort={handleSort} />
              </TableRow>
            </TableHeader>
            <DataTableBody loading={initialLoading} loadingText="正在加载对比快照…" empty={rows.length === 0} emptyText={`当前筛选范围内没有可对比的${getLevelLabel(compareLevel)}。`} columnCount={8}>
              {rows.map((row, index) => (
                  <TableRow key={row.id} className="group border-b border-[rgba(61,70,99,0.45)]">
                    <TableCell className="font-semibold text-[var(--color-neutral-08)]">#{index + 1}</TableCell>
                    <TableCell className="max-w-[320px] truncate font-semibold text-[var(--color-neutral-11)]">{row.name}</TableCell>
                    <TableCell className="text-right text-base font-bold tabular-nums text-[var(--color-brand-text)]">{formatNumber(row.current)}</TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--color-neutral-08)]">{formatNumber(row.average)}</TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--color-neutral-08)]">{formatNumber(row.target)}</TableCell>
                    <TableCell className={`text-right font-mono tabular-nums ${row.averageDiff > 0 ? 'text-[var(--color-status-success-text)]' : row.averageDiff < 0 ? 'text-[var(--color-status-error-text)]' : 'text-[var(--color-neutral-08)]'}`}>
                      {row.averageDiff > 0 ? '+' : ''}{Number(row.averageDiff.toFixed(1))}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge tone={row.targetDiff > 0 ? 'success' : row.targetDiff < 0 ? 'error' : 'neutral'}>
                        {row.targetDiff > 0 ? '+' : ''}{Number(row.targetDiff.toFixed(1))}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.averageDiffRate > 0 ? (
                        <div className="flex items-center justify-center text-[var(--color-status-success-text)] gap-1 text-xs">
                          <TrendingUp className="w-4 h-4" />
                          偏高 · 热度 {row.heatScore}
                        </div>
                      ) : row.averageDiffRate < 0 ? (
                        <div className="flex items-center justify-center text-[var(--color-status-error-text)] gap-1 text-xs">
                          <TrendingDown className="w-4 h-4" />
                          偏低 · 热度 {row.heatScore}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-[var(--color-neutral-08)] gap-1 text-xs">持平 · 热度 {row.heatScore}</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </DataTableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
