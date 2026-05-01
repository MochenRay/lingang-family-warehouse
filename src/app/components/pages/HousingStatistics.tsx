import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Building, HelpCircle, Home, Hotel, MapPinned, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { statsRepository, type DashboardStatsResponse, type StatsRegionSummary } from '../../services/repositories/statsRepository';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { PageHeader } from './PageHeader';

const PANEL_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const CHART_GRID_STROKE = '#3d4663';
const AXIS_TICK = { fontSize: 12, fill: '#6b7599' };

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

function getPressureScore(row: Pick<DistrictHousingItem, 'warningCount' | 'rentalCount' | 'vacantCount' | 'floatingCount'>) {
  return Math.min(100, Number((row.warningCount * 9 + row.rentalCount * 1.8 + row.vacantCount * 1.2 + row.floatingCount * 0.4).toFixed(1)));
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
      { name: '自住', value: dashboard.housingStats.selfOccupied, color: '#3b82f6' },
      { name: '出租', value: dashboard.housingStats.rental, color: '#f59e0b' },
      { name: '空置', value: dashboard.housingStats.vacant, color: '#94a3b8' },
      { name: '经营', value: dashboard.housingStats.commercial, color: '#10b981' },
    ];
  }, [dashboard]);

  const rentalWarnings = useMemo(
    () => [
      { name: '出租房屋', value: dashboard?.housingStats.rental ?? 0, fill: '#f97316' },
      { name: '预警线索', value: districtHousingRows.reduce((sum, row) => sum + row.warningCount, 0), fill: '#ef4444' },
      { name: '空置房屋', value: dashboard?.housingStats.vacant ?? 0, fill: '#8b5cf6' },
    ],
    [dashboard, districtHousingRows],
  );

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }
    return [
      { label: '自住房屋', count: dashboard.housingStats.selfOccupied, icon: Home, color: 'text-blue-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
      { label: '出租房屋', count: dashboard.housingStats.rental, icon: Hotel, color: 'text-orange-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
      { label: '经营场所', count: dashboard.housingStats.commercial, icon: Store, color: 'text-green-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
      { label: '空置房屋', count: dashboard.housingStats.vacant, icon: Building, color: 'text-[var(--color-neutral-08)]', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
    ];
  }, [dashboard]);

  const districtChartData = districtHousingRows.slice(0, 8).map((row) => ({
    name: row.name,
    房屋: row.houseCount,
    出租: row.rentalCount,
    预警: row.warningCount,
  }));

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      <PageHeader
        eyebrow="HOUSING ANALYTICS"
        title="房屋网格画像"
        description="按区县识别出租、空置与预警压力，帮助先定位需要投入治理资源的片区。"
      />

      {error ? (
        <Card className="border-destructive/40 bg-destructive/10 text-destructive">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`flex items-center gap-4 rounded-lg border border-[var(--color-neutral-03)] p-4 shadow-none ${item.bg}`}>
              <div className={`rounded-lg p-2 ${item.iconBg}`}>
                <Icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{formatNumber(item.count)}</div>
                <div className="text-sm font-medium text-[var(--color-neutral-08)]">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr,0.9fr]">
        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <MapPinned className="h-5 w-5 text-blue-500" />
              区县房屋治理对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] w-full">
              {loading ? (
                <div className="py-10 text-sm text-[var(--color-neutral-08)]">正在汇总区县房屋画像...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                    <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
                    <RechartsTooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                    <Bar dataKey="房屋" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="出租" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="预警" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                重点区县清单
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-white">
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      压力 = min(100, 预警x9 + 出租x1.8 + 空置x1.2 + 流动x0.4)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
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
          <CardContent className="space-y-3">
            {districtHousingRows.slice(0, 6).map((row, index) => (
              <div key={row.name} className="rounded-lg border border-[var(--color-neutral-03)] bg-[linear-gradient(135deg,rgba(78,134,223,0.10),rgba(16,24,47,0.92))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#4E86DF,#8B5CF6)] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(78,134,223,0.24)]">{index + 1}</span>
                    <div>
                      <div className="font-semibold text-[var(--color-neutral-11)]">{row.name}</div>
                      <div className="text-xs text-[var(--color-neutral-08)]">
                        {formatNumber(row.houseCount)} 套房屋 · {formatNumber(row.peopleCount)} 人
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-semibold ${row.score >= 80 ? 'text-[#FCA5A5]' : row.score >= 55 ? 'text-[#FDBA74]' : 'text-[var(--color-neutral-11)]'}`}>{row.score}</div>
                    <div className="text-xs text-[var(--color-neutral-07)]">压力系数</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded border border-[var(--color-neutral-03)] bg-[rgba(10,18,36,0.36)] px-2 py-2">
                    <div className="text-[var(--color-neutral-07)]">出租</div>
                    <div className="mt-1 text-base font-semibold text-[var(--color-neutral-11)]">{row.rentalCount}</div>
                  </div>
                  <div className="rounded border border-[var(--color-neutral-03)] bg-[rgba(10,18,36,0.36)] px-2 py-2">
                    <div className="text-[var(--color-neutral-07)]">预警</div>
                    <div className="mt-1 text-base font-semibold text-[var(--color-neutral-11)]">{row.warningCount}</div>
                  </div>
                  <div className="rounded border border-[var(--color-neutral-03)] bg-[rgba(10,18,36,0.36)] px-2 py-2">
                    <div className="text-[var(--color-neutral-07)]">流动</div>
                    <div className="mt-1 text-base font-semibold text-[var(--color-neutral-11)]">{row.floatingCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">房屋用途分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loading || !dashboard ? (
                <div className="py-10 text-sm text-[var(--color-neutral-08)]">正在汇总房屋用途...</div>
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
                      label={{ fill: '#DCE6FF', fontSize: 12 }}
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
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Hotel className="h-5 w-5 text-orange-500" />
              出租房治理预警
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="py-10 text-sm text-[var(--color-neutral-08)]">正在计算治理预警...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rentalWarnings} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke={CHART_GRID_STROKE} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ ...AXIS_TICK, fontWeight: 'bold' }} />
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
