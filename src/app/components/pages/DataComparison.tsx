import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Download, Filter, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartCard } from '../statistics/ChartCard';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { analysisRepository, type AnalysisGridMetric, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { downloadJson } from '../../services/export';
import { toast } from 'sonner';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { SortableHeader } from '../statistics/SortableHeader';

type CompareMode = 'average' | 'target';
type CompareLevel = 'district' | 'street' | 'community' | 'grid';
type IndicatorKey = 'population' | 'floating' | 'risk' | 'visit' | 'task';
type ScopeKey = 'top5' | 'all' | 'warning';
type SortDirection = 'asc' | 'desc';
type ComparisonSortKey = 'rank' | 'name' | 'current' | 'benchmark' | 'diff' | 'diffRate' | 'heatScore';

interface ComparisonRow {
  id: string;
  name: string;
  current: number;
  benchmark: number;
  diff: number;
  diffRate: number;
  heatScore: number;
  statusLevel: AnalysisGridMetric['statusLevel'];
}

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

export function DataComparison() {
  const [snapshot, setSnapshot] = useState<GovernanceAnalysisSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState<CompareMode>('average');
  const [compareLevel, setCompareLevel] = useState<CompareLevel>('district');
  const [indicator, setIndicator] = useState<IndicatorKey>('population');
  const [scope, setScope] = useState<ScopeKey>('top5');
  const [sortState, setSortState] = useState(DEFAULT_COMPARISON_SORT);

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

  const rows = useMemo(() => {
    if (!snapshot) {
      return [];
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
    const benchmark = compareMode === 'average' ? averageValue : getTargetValue(indicator);

    const mapped: ComparisonRow[] = groupedRows.map((row) => {
      const current = row.current;
      const diff = current - benchmark;
      const diffRate = benchmark === 0 ? 0 : (diff / benchmark) * 100;
      return {
        id: row.id,
        name: row.name,
        current,
        benchmark: Number(benchmark.toFixed(1)),
        diff,
        diffRate,
        heatScore: row.count ? Number((row.heatTotal / row.count).toFixed(1)) : 0,
        statusLevel: row.statusLevel,
      };
    });

    mapped.sort((left, right) => right.current - left.current || left.name.localeCompare(right.name, 'zh-CN'));
    const visibleRows = scope === 'top5' ? mapped.slice(0, 5) : mapped;
    const directionMultiplier = sortState.direction === 'asc' ? 1 : -1;

    return [...visibleRows].sort((left, right) => {
      if (sortState.key === 'name') {
        const result = left.name.localeCompare(right.name, 'zh-CN');
        return result * directionMultiplier || right.current - left.current;
      }

      const leftValue = sortState.key === 'rank' ? left.current : left[sortState.key];
      const rightValue = sortState.key === 'rank' ? right.current : right[sortState.key];
      const result = leftValue - rightValue;
      return result * directionMultiplier || right.current - left.current || left.name.localeCompare(right.name, 'zh-CN');
    });
  }, [compareLevel, compareMode, indicator, scope, snapshot, sortState]);

  const chartData = rows.map((row) => ({
    name: row.name,
    当前值: row.current,
    参考值: row.benchmark,
  }));

  const handleExport = () => {
    downloadJson(`data-comparison-${compareLevel}-${indicator}-${compareMode}-${new Date().toISOString().slice(0, 10)}.json`, {
      generatedAt: snapshot?.generatedAt,
      compareLevel,
      indicator,
      compareMode,
      scope,
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
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">多维数据对比</h2>
        <p className="mt-1 text-sm text-[var(--color-neutral-08)]">默认先看区县级差异，再逐级切到街镇、社区和网格。</p>
      </div>

      <Card className="rounded-[8px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-neutral-08)]">
                <ArrowLeftRight className="w-4 h-4" />
                对比模式
              </Label>
              <Select value={compareMode} onValueChange={(value: CompareMode) => setCompareMode(value)}>
                <SelectTrigger className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="average">与片区均值对比</SelectItem>
                  <SelectItem value="target">与治理目标对比</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[var(--color-neutral-08)]">对比层级</Label>
              <Select value={compareLevel} onValueChange={(value: CompareLevel) => setCompareLevel(value)}>
                <SelectTrigger className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
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
              <Select value={indicator} onValueChange={(value: IndicatorKey) => setIndicator(value)}>
                <SelectTrigger className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
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
              <Select value={scope} onValueChange={(value: ScopeKey) => setScope(value)}>
                <SelectTrigger className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top5">Top 5 热点{getLevelLabel(compareLevel)}</SelectItem>
                  <SelectItem value="all">全辖区</SelectItem>
                  <SelectItem value="warning">重点关注{getLevelLabel(compareLevel)}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button className="w-full" onClick={() => void loadSnapshot()} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Filter className="w-4 h-4 mr-2" />}
                {loading ? '分析中...' : '刷新对比'}
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title={`${getLevelLabel(compareLevel)}趋势直方图`}
          description={`${getMetricLabel(indicator)}当前值与参考值对比`}
          className="lg:col-span-3"
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3d4663" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8194B5' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8194B5' }} />
                <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                <Legend wrapperStyle={{ color: '#AEC0DE' }} />
                <Bar dataKey="当前值" fill="#4E86DF" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="参考值" fill="#8194B5" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <Card className="rounded-[8px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none">
        <CardHeader className="px-5 pb-2 pt-5">
          <CardTitle className="text-base font-semibold text-white">详细数据明细</CardTitle>
          <CardDescription className="text-sm text-[var(--color-neutral-08)]">以统一对象口径对比当前值、参考值和偏离幅度，点击列头排序。</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="border-b border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                <SortableHeader sortKey="rank" currentKey={sortState.key} direction={sortState.direction} label="排名" align="left" className="w-[80px]" onSort={handleSort} />
                <SortableHeader sortKey="name" currentKey={sortState.key} direction={sortState.direction} label="区域名称" align="left" onSort={handleSort} />
                <SortableHeader sortKey="current" currentKey={sortState.key} direction={sortState.direction} label="当前值" onSort={handleSort} />
                <SortableHeader sortKey="benchmark" currentKey={sortState.key} direction={sortState.direction} label="参考值" onSort={handleSort} />
                <SortableHeader sortKey="diff" currentKey={sortState.key} direction={sortState.direction} label="差值" onSort={handleSort} />
                <SortableHeader sortKey="diffRate" currentKey={sortState.key} direction={sortState.direction} label="变化率" onSort={handleSort} />
                <SortableHeader sortKey="heatScore" currentKey={sortState.key} direction={sortState.direction} label="趋势判定" align="center" onSort={handleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-[var(--color-neutral-08)]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    正在刷新对比快照...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-[var(--color-neutral-08)]">
                    当前筛选范围内没有可对比的{getLevelLabel(compareLevel)}。
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.id} className="group border-b border-[rgba(61,70,99,0.45)]">
                    <TableCell className="font-semibold text-[var(--color-neutral-08)]">#{index + 1}</TableCell>
                    <TableCell className="max-w-[320px] truncate font-semibold text-white">{row.name}</TableCell>
                    <TableCell className="text-right text-base font-bold tabular-nums text-[#4E86DF]">{formatNumber(row.current)}</TableCell>
                    <TableCell className="text-right tabular-nums text-[var(--color-neutral-08)]">{formatNumber(row.benchmark)}</TableCell>
                    <TableCell className={`text-right font-mono tabular-nums ${row.diff > 0 ? 'text-[#19B172]' : row.diff < 0 ? 'text-[#D52132]' : 'text-[var(--color-neutral-08)]'}`}>
                      {row.diff > 0 ? '+' : ''}{Number(row.diff.toFixed(1))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`${row.diffRate > 0 ? 'border-[#19B172]/40 bg-[#19B172]/10 text-[#6EE7B7]' : row.diffRate < 0 ? 'border-[#D52132]/40 bg-[#D52132]/10 text-[#FCA5A5]' : 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-08)]'}`}>
                        {Math.abs(row.diffRate).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.diffRate > 0 ? (
                        <div className="flex items-center justify-center text-[#19B172] gap-1 text-xs">
                          <TrendingUp className="w-4 h-4" />
                          偏高 · 热度 {row.heatScore}
                        </div>
                      ) : row.diffRate < 0 ? (
                        <div className="flex items-center justify-center text-[#D52132] gap-1 text-xs">
                          <TrendingDown className="w-4 h-4" />
                          偏低 · 热度 {row.heatScore}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-[var(--color-neutral-08)] gap-1 text-xs">持平 · 热度 {row.heatScore}</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
