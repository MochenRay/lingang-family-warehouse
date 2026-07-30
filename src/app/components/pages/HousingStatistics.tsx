import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Building, ChartPie, HelpCircle, Home, Hotel, MapPinned, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { StatCard } from '../patterns/StatCard';
import { ErrorState, LoadingState } from '../patterns/states';
import { PANEL_CLASS } from '../patterns/surfaces';
import { statsRepository, type DashboardStatsResponse, type StatsRegionSummary } from '../../services/repositories/statsRepository';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import {
  CHART_AXIS,
  CHART_COLORS,
  CHART_ERROR,
  CHART_GRID,
  CHART_GRID_PROPS,
  CHART_LABEL,
  CHART_SUCCESS,
  CHART_TICK,
  CHART_WARNING,
} from '../../config/chartConfig';
import { PageHeader } from './PageHeader';

interface DistrictHousingItem {
  name: string;
  houseCount: number;
  peopleCount: number;
  selfOccupiedCount: number;
  rentalCount: number;
  vacantCount: number;
  commercialCount: number;
  warningCount: number;
  floatingCount: number;
  score: number;
}

type DistrictSortKey = 'pressure' | 'rental' | 'warning' | 'floating';

function formatNumber(value: number) {
  return value.toLocaleString('zh-CN');
}

function createDistrictRow(name: string): DistrictHousingItem {
  return {
    name,
    houseCount: 0,
    peopleCount: 0,
    selfOccupiedCount: 0,
    rentalCount: 0,
    vacantCount: 0,
    commercialCount: 0,
    warningCount: 0,
    floatingCount: 0,
    score: 0,
  };
}

function getPressureScore(row: Pick<DistrictHousingItem, 'houseCount' | 'peopleCount' | 'warningCount' | 'rentalCount' | 'vacantCount' | 'floatingCount'>) {
  const houseTotal = Math.max(1, row.houseCount);
  const peopleTotal = Math.max(1, row.peopleCount);
  return Math.min(100, Number((100 * (
    (row.warningCount / houseTotal) * 0.4
    + (row.rentalCount / houseTotal) * 0.25
    + (row.vacantCount / houseTotal) * 0.15
    + (row.floatingCount / peopleTotal) * 0.2
  )).toFixed(1)));
}

function createDistrictRowFromSummary(summary: StatsRegionSummary): DistrictHousingItem {
  const row = createDistrictRow(summary.name);
  row.houseCount = summary.houseCount;
  row.peopleCount = summary.peopleCount;
  row.rentalCount = summary.rentalCount ?? 0;
  row.vacantCount = summary.vacantCount ?? 0;
  row.warningCount = summary.warningCount ?? 0;
  row.floatingCount = summary.floatingCount;
  row.selfOccupiedCount = Math.max(0, summary.houseCount - row.rentalCount - row.vacantCount);
  row.score = getPressureScore(row);
  return row;
}

export function HousingStatistics() {
  const [dashboard, setDashboard] = useState<DashboardStatsResponse | null>(null);
  const [districtSort, setDistrictSort] = useState<DistrictSortKey>('pressure');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const nextDashboard = await statsRepository.getDashboard('month');
        if (cancelled) {
          return;
        }
        setDashboard(nextDashboard);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '房屋网格画像加载失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const districtHousingRows = useMemo(() => {
    const rows = (dashboard?.regionSummaries ?? [])
      .filter((item) => item.level === 'district')
      .map(createDistrictRowFromSummary);

    return rows.sort((left, right) => {
      if (districtSort === 'rental') {
        return right.rentalCount - left.rentalCount || right.score - left.score || left.name.localeCompare(right.name, 'zh-CN');
      }
      if (districtSort === 'warning') {
        return right.warningCount - left.warningCount || right.score - left.score || left.name.localeCompare(right.name, 'zh-CN');
      }
      if (districtSort === 'floating') {
        return right.floatingCount - left.floatingCount || right.score - left.score || left.name.localeCompare(right.name, 'zh-CN');
      }
      return right.score - left.score || right.warningCount - left.warningCount || right.houseCount - left.houseCount || left.name.localeCompare(right.name, 'zh-CN');
    });
  }, [dashboard, districtSort]);

  const houseUsageData = useMemo(() => {
    if (!dashboard) {
      return [];
    }
    return [
      { name: '自住', value: dashboard.housingStats.selfOccupied, color: CHART_COLORS[0] },
      { name: '出租', value: dashboard.housingStats.rental, color: CHART_WARNING },
      { name: '经营', value: dashboard.housingStats.commercial, color: CHART_SUCCESS },
      { name: '空置', value: dashboard.housingStats.vacant, color: CHART_AXIS },
    ];
  }, [dashboard]);

  const rentalWarnings = useMemo(
    () => [
      { name: '出租房屋', value: dashboard?.housingStats.rental ?? 0, fill: CHART_WARNING },
      { name: '预警线索', value: districtHousingRows.reduce((sum, row) => sum + row.warningCount, 0), fill: CHART_ERROR },
      { name: '空置房屋', value: dashboard?.housingStats.vacant ?? 0, fill: CHART_COLORS[2] },
    ],
    [dashboard, districtHousingRows],
  );

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }
    return [
      { label: '自住房屋', count: dashboard.housingStats.selfOccupied, icon: Home, tone: 'brand' },
      { label: '出租房屋', count: dashboard.housingStats.rental, icon: Hotel, tone: 'warning' },
      { label: '经营场所', count: dashboard.housingStats.commercial, icon: Store, tone: 'success' },
      { label: '空置房屋', count: dashboard.housingStats.vacant, icon: Building, tone: 'info' },
    ] as const;
  }, [dashboard]);

  const districtChartData = districtHousingRows.slice(0, 8).map((row) => ({
    name: row.name,
    房屋: row.houseCount,
    出租: row.rentalCount,
    预警: row.warningCount,
  }));

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
      <PageHeader
        eyebrow="HOUSING ANALYTICS"
        title="房屋网格画像"
        description="按区县识别出租、空置与预警压力，帮助先定位需要投入治理资源的片区。"
      />

      {error ? <ErrorState description={error} /> : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map((item) => (
          <StatCard key={item.label} label={item.label} value={formatNumber(item.count)} icon={item.icon} tone={item.tone} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-neutral-11)]">
              <MapPinned className="h-5 w-5 text-[var(--color-brand-text)]" />
              区县房屋治理对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] w-full">
              {loading ? (
                <LoadingState title="正在汇总区县房屋画像..." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid {...CHART_GRID_PROPS} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CHART_TICK} />
                    <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} allowDecimals={false} />
                    <RechartsTooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                    <Bar dataKey="房屋" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="出租" fill={CHART_WARNING} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="预警" fill={CHART_ERROR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`${PANEL_CLASS} h-[420px] gap-0 overflow-hidden`}>
          <CardHeader className="gap-3 border-b border-[var(--color-neutral-03)] px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-neutral-11)]">
                  <AlertTriangle className="h-5 w-5 text-[var(--color-status-warning-text)]" />
                  重点区县清单
                </CardTitle>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="指标说明" className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]">
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm space-y-2 text-xs leading-5">
                      <p className="font-medium text-[var(--color-neutral-11)]">压力系数反映该片区的综合治理关注程度，分数越高，越需要优先投入网格精力。</p>
                      <p>系统按各类线索在片区内的占比加权，避免房屋较多的区县仅因规模更大就被判为高压。</p>
                      <p className="text-[var(--color-neutral-08)]">参考：80 分以上为高压片区，55 分以上为中压片区，其余为常规关注。</p>
                      <p className="border-t border-[var(--color-neutral-03)] pt-2 font-mono text-[var(--color-neutral-08)]">
                        公式：预警占比×40% + 出租占比×25% + 空置占比×15% + 流动人口占比×20%
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={districtSort} onValueChange={(value) => setDistrictSort(value as DistrictSortKey)}>
                <SelectTrigger className="h-9 w-full border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] sm:w-[148px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pressure">按压力</SelectItem>
                  <SelectItem value="rental">按出租</SelectItem>
                  <SelectItem value="warning">按预警</SelectItem>
                  <SelectItem value="floating">按流动</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-4">
            <div
              data-testid="district-priority-scroll"
              aria-label="重点区县清单，可上下滚动"
              tabIndex={0}
              className="grid h-full content-start gap-3 overflow-x-hidden overflow-y-auto overscroll-contain pr-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] sm:grid-cols-2"
            >
              {districtHousingRows.map((row, index) => (
                <article key={row.name} data-testid="district-priority-card" className="min-h-[116px] rounded-[4px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[var(--color-brand-primary)] text-xs font-semibold text-[var(--color-neutral-11)]">{index + 1}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--color-neutral-11)]">{row.name}</div>
                      <div className="mt-0.5 whitespace-nowrap text-[11px] text-[var(--color-neutral-08)]">
                        {formatNumber(row.houseCount)} 套房屋 · {formatNumber(row.peopleCount)} 人
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-lg font-semibold leading-none ${row.score >= 80 ? 'text-[var(--color-status-error-text)]' : row.score >= 55 ? 'text-[var(--color-status-warning-text)]' : 'text-[var(--color-neutral-11)]'}`}>{row.score}</div>
                    <div className="mt-1 text-[10px] text-[var(--color-neutral-07)]">压力</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 divide-x divide-[var(--color-neutral-03)] border-t border-[var(--color-neutral-03)] pt-2 text-center text-xs">
                  <div><span className="text-[var(--color-neutral-07)]">出租</span><strong className="ml-1 text-[var(--color-neutral-11)]">{row.rentalCount}</strong></div>
                  <div><span className="text-[var(--color-neutral-07)]">预警</span><strong className="ml-1 text-[var(--color-neutral-11)]">{row.warningCount}</strong></div>
                  <div><span className="text-[var(--color-neutral-07)]">流动</span><strong className="ml-1 text-[var(--color-neutral-11)]">{row.floatingCount}</strong></div>
                </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-neutral-11)]">
              <ChartPie className="h-5 w-5 text-[var(--color-brand-text)]" />
              房屋用途分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              {loading || !dashboard ? (
                <LoadingState title="正在汇总房屋用途..." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={houseUsageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={{ fill: CHART_LABEL, fontSize: 12 }}
                    >
                      {houseUsageData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<DarkChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {!loading && dashboard ? (
              <div aria-label="房屋用途图例" className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {houseUsageData.map((entry) => (
                  <span
                    key={entry.name}
                    data-testid="house-usage-legend-item"
                    data-color={entry.color}
                    data-value={entry.value}
                    className="inline-flex items-center gap-2 text-xs text-[var(--color-neutral-09)]"
                  >
                    <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </span>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--color-neutral-11)]">
              <Hotel className="h-5 w-5 text-[var(--color-status-warning-text)]" />
              出租房治理预警
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loading ? (
                <LoadingState title="正在计算治理预警..." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rentalWarnings} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke={CHART_GRID} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={CHART_TICK} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ ...CHART_TICK, fontWeight: 'bold' }} />
                    <RechartsTooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                    <Bar dataKey="value" name="数量" radius={[0, 4, 4, 0]} barSize={40}>
                      {rentalWarnings.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
