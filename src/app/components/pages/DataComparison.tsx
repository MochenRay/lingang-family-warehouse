import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Download, Filter, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartCard } from '../statistics/ChartCard';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { analysisRepository, type AnalysisGridMetric, type GovernanceAnalysisSnapshot } from '../../services/repositories/analysisRepository';
import { downloadJson } from '../../services/export';
import { toast } from 'sonner';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';

type CompareMode = 'average' | 'target';
type CompareLevel = 'district' | 'street' | 'community' | 'grid';
type IndicatorKey = 'population' | 'floating' | 'risk' | 'visit' | 'task';
type ScopeKey = 'top5' | 'all' | 'warning';

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

export function DataComparison() {
  const [snapshot, setSnapshot] = useState<GovernanceAnalysisSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState<CompareMode>('average');
  const [compareLevel, setCompareLevel] = useState<CompareLevel>('district');
  const [indicator, setIndicator] = useState<IndicatorKey>('population');
  const [scope, setScope] = useState<ScopeKey>('top5');

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
    return scope === 'top5' ? mapped.slice(0, 5) : mapped;
  }, [compareLevel, compareMode, indicator, scope, snapshot]);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">多维数据对比</h2>
        <p className="text-muted-foreground">默认先看区县级差异，再逐级切到街镇、社区和网格。</p>
      </div>

      <Card className="border-indigo-100 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-indigo-700 font-semibold">
                <ArrowLeftRight className="w-4 h-4" />
                对比模式
              </Label>
              <Select value={compareMode} onValueChange={(value: CompareMode) => setCompareMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="average">与片区均值对比</SelectItem>
                  <SelectItem value="target">与治理目标对比</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>对比层级</Label>
              <Select value={compareLevel} onValueChange={(value: CompareLevel) => setCompareLevel(value)}>
                <SelectTrigger>
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
              <Label>分析指标</Label>
              <Select value={indicator} onValueChange={(value: IndicatorKey) => setIndicator(value)}>
                <SelectTrigger>
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
              <Label>聚焦范围</Label>
              <Select value={scope} onValueChange={(value: ScopeKey) => setScope(value)}>
                <SelectTrigger>
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
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full" onClick={() => void loadSnapshot()} disabled={loading}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard
          title={`${getLevelLabel(compareLevel)}趋势直方图`}
          description={`${getMetricLabel(indicator)}当前值与参考值对比`}
          className="lg:col-span-3"
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                <Legend />
                <Bar dataKey="当前值" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="参考值" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>详细数据明细</CardTitle>
          <CardDescription>以统一对象口径对比当前值、参考值和偏离幅度。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)] border-b border-[var(--color-neutral-03)]">
                <TableHead className="w-[80px] text-[var(--color-neutral-10)]">排名</TableHead>
                <TableHead className="text-[var(--color-neutral-10)]">区域名称</TableHead>
                <TableHead className="text-right text-[var(--color-neutral-10)]">当前值</TableHead>
                <TableHead className="text-right text-[var(--color-neutral-08)]">参考值</TableHead>
                <TableHead className="text-right text-[var(--color-neutral-10)]">差值</TableHead>
                <TableHead className="text-right text-[var(--color-neutral-10)]">变化率</TableHead>
                <TableHead className="text-center text-[var(--color-neutral-10)]">趋势判定</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    正在刷新对比快照...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                    当前筛选范围内没有可对比的{getLevelLabel(compareLevel)}。
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.id} className="group">
                    <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right font-bold text-base">{row.current.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-gray-400">{row.benchmark.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-mono ${row.diff > 0 ? 'text-green-600' : row.diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {row.diff > 0 ? '+' : ''}{Number(row.diff.toFixed(1))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`${row.diffRate > 0 ? 'bg-green-50 text-green-700 border-green-200' : row.diffRate < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {Math.abs(row.diffRate).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.diffRate > 0 ? (
                        <div className="flex items-center justify-center text-green-600 gap-1 text-xs">
                          <TrendingUp className="w-4 h-4" />
                          偏高
                        </div>
                      ) : row.diffRate < 0 ? (
                        <div className="flex items-center justify-center text-red-600 gap-1 text-xs">
                          <TrendingDown className="w-4 h-4" />
                          偏低
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-gray-500 gap-1 text-xs">持平</div>
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
