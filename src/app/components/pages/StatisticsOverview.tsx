import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Database,
  Home,
  Loader2,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { statsRepository, type DashboardStatsResponse } from '../../services/repositories/statsRepository';
import { toast } from 'sonner';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { HorizontalBarList } from '../statistics/HorizontalBarList';
import { SortableHeader } from '../statistics/SortableHeader';

interface StatisticsOverviewProps {
  onRouteChange?: (route: string) => void;
}

const OVERLAY_EVENT = 'homedata:open-journey-overlay';

const RANGE_LABELS = {
  week: '本周',
  month: '本月',
  quarter: '本季度',
} as const;

type DistrictSortKey =
  | 'rank'
  | 'name'
  | 'peopleCount'
  | 'houseCount'
  | 'visitCount'
  | 'activeConflictCount'
  | 'floatingCount'
  | 'score';

type SortDirection = 'asc' | 'desc';

const DEFAULT_DISTRICT_SORT: { key: DistrictSortKey; direction: SortDirection } = {
  key: 'score',
  direction: 'desc',
};

const RISK_TAG_COLORS = ['#2AA3CF', '#D6730D', '#8B5CF6', '#D52132', '#EC4899', '#4F46E5'];

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value);
}

function getScoreColor(score: number) {
  if (score >= 70) {
    return '#D6730D';
  }
  if (score >= 45) {
    return '#2761CB';
  }
  return '#19B172';
}

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

export function StatisticsOverview({ onRouteChange }: StatisticsOverviewProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [districtSort, setDistrictSort] = useState(DEFAULT_DISTRICT_SORT);
  const [dashboard, setDashboard] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJourneyOverlay, setShowJourneyOverlay] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.sessionStorage.getItem('homedata_journey_overlay_dismissed') !== '1';
  });

  const closeJourneyOverlay = () => {
    window.sessionStorage.setItem('homedata_journey_overlay_dismissed', '1');
    setShowJourneyOverlay(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    const handleOpenOverlay = () => setShowJourneyOverlay(true);
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const nextDashboard = await statsRepository.getDashboard(selectedRange);
        if (active) {
          setDashboard(nextDashboard);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    const handleDbChange = () => void load();
    window.addEventListener('db-change', handleDbChange);
    window.addEventListener(OVERLAY_EVENT, handleOpenOverlay);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener('db-change', handleDbChange);
      window.removeEventListener(OVERLAY_EVENT, handleOpenOverlay);
    };
  }, [selectedRange]);

  const handleDistrictSort = (key: DistrictSortKey) => {
    setDistrictSort((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }

      return { key, direction: key === 'name' ? 'asc' : 'desc' };
    });
  };

  const districtRows = useMemo(() => {
    const rows = (dashboard?.regionSummaries ?? []).filter((item) => item.level === 'district');
    const directionMultiplier = districtSort.direction === 'asc' ? 1 : -1;

    return [...rows].sort((left, right) => {
      if (districtSort.key === 'name') {
        const result = left.name.localeCompare(right.name, 'zh-CN');
        return result * directionMultiplier || right.score - left.score;
      }

      const leftValue = districtSort.key === 'rank' ? left.score : left[districtSort.key];
      const rightValue = districtSort.key === 'rank' ? right.score : right[districtSort.key];
      const result = leftValue - rightValue;
      return result * directionMultiplier || right.score - left.score || right.peopleCount - left.peopleCount;
    });
  }, [dashboard, districtSort]);

  const actionItems = dashboard?.actionItems ?? [];
  const topRiskTags = [...(dashboard?.riskTagsSummary ?? [])]
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);
  const totalPopulation = dashboard?.totalPopulation ?? 0;
  const totalHouses = dashboard?.totalHouses ?? 0;
  const totalVisits = dashboard?.metadata.totalVisits ?? 0;
  const activeConflicts = dashboard?.conflictStats.active ?? 0;
  const floatingPeople = dashboard?.mobilePeopleStats.floating ?? 0;

  const kpiCards = [
    { label: '总人口数', value: totalPopulation, color: '#2761CB', icon: Users },
    { label: '房屋总数', value: totalHouses, color: '#2AA3CF', icon: Home },
    { label: `${RANGE_LABELS[selectedRange]}走访`, value: totalVisits, color: '#19B172', icon: TrendingUp },
    { label: '待化解矛盾', value: activeConflicts, color: '#D6730D', icon: ShieldAlert },
    { label: '流动人口', value: floatingPeople, color: '#D52132', icon: AlertTriangle },
  ];

  const handleExportReport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      range: selectedRange,
      dashboard,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yantai-dashboard-${selectedRange}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('驾驶舱快照已导出');
  };

  const recommendedJourney = [
    { step: '01', title: '先看驾驶舱', detail: '先建立全市样本、风险压力和执行重点的第一印象。', action: '留在当前页', route: 'statistics-overview' },
    { step: '02', title: '再看区县对比', detail: '从区县层级进入街镇、社区、网格，不直接跳到裸社区名。', action: '进入数据对比', route: 'data-comparison' },
    { step: '03', title: '再看人口与房屋', detail: '从人口特征、标签、人房关系理解对象和空间怎么被治理。', action: '进入人口特征', route: 'demographics-analysis' },
    { step: '04', title: '最后看处置链路', detail: '进入矛盾调解、行为督导和公告等业务模块看闭环。', action: '进入矛盾调解', route: 'conflict-management' },
  ];

  if (loading && !dashboard) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      {showJourneyOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] shadow-2xl">
            <button
              type="button"
              aria-label="关闭浏览建议"
              onClick={closeJourneyOverlay}
              className="absolute right-4 top-4 rounded-full border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-2 text-[var(--color-neutral-08)] transition-colors hover:bg-[var(--color-neutral-03)] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-[0.95fr,1.3fr]">
              <div className="border-r border-[var(--color-neutral-03)] bg-[rgba(39,97,203,0.08)] p-8">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#4E86DF]">
                  <Sparkles className="h-4 w-4" />
                  首次使用建议
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                  先看统计分析，再进入业务台账和处置链路
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--color-neutral-08)]">
                  本页仍是统计分析下的综合入口。建议先看总量、区县压力和行动清单，再进入数据管理、标签管理、网格事务等已有模块核查。
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={closeJourneyOverlay}>留在驾驶舱</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      closeJourneyOverlay();
                      onRouteChange?.('data-comparison');
                    }}
                  >
                    进入数据对比
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {recommendedJourney.map((item, index) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => {
                      closeJourneyOverlay();
                      onRouteChange?.(item.route);
                    }}
                    className={`group flex min-h-[150px] flex-col items-start gap-3 p-6 text-left transition-colors hover:bg-[var(--color-neutral-02)] ${
                      index % 2 === 0 ? 'sm:border-r border-[var(--color-neutral-03)]' : ''
                    } ${index < 2 ? 'border-b border-[var(--color-neutral-03)]' : ''}`}
                  >
                    <div className="inline-flex items-center rounded-full border border-[#2761CB]/40 bg-[#2761CB]/15 px-2.5 py-1 text-xs font-semibold text-[#4E86DF]">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-sm leading-6 text-[var(--color-neutral-08)]">{item.detail}</div>
                    </div>
                    <div className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-[#4E86DF]">
                      {item.action}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-neutral-08)]">
            <span className="text-white">综合统计驾驶舱</span>
            <span>烟台市</span>
            <span>·</span>
            <span>区县概览</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as 'week' | 'month' | 'quarter')}>
            <SelectTrigger className="w-[120px] border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
              <SelectValue placeholder="时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportReport}>导出驾驶舱快照</Button>
        </div>
      </div>

      <section className="rounded-lg border border-[#2761CB]/35 bg-[#2761CB]/10 px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 text-xs font-semibold tracking-[0.12em] text-[#4E86DF]">AI 研判与行动清单 · {RANGE_LABELS[selectedRange]}</div>
            <div className="text-sm leading-7 text-[var(--color-neutral-10)]">
              {actionItems.length > 0 ? (
                actionItems.slice(0, 3).map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onRouteChange?.(item.route)}
                    className="mr-4 inline-flex text-left text-[var(--color-neutral-10)] transition-colors hover:text-white"
                  >
                    <span className="font-semibold text-white">{index + 1}. {item.title}</span>
                    <span className="ml-1 text-[var(--color-neutral-08)]">{item.area} · {item.metric}</span>
                  </button>
                ))
              ) : (
                <span>当前暂无需要督办的事项。</span>
              )}
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-[#2761CB]">{formatNumber(totalPopulation)}</div>
              <div className="mt-1 text-xs text-[var(--color-neutral-08)]">总人口</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#19B172]">{formatNumber(totalVisits)}</div>
              <div className="mt-1 text-xs text-[var(--color-neutral-08)]">{RANGE_LABELS[selectedRange]}走访</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#D6730D]">{districtRows.length}</div>
              <div className="mt-1 text-xs text-[var(--color-neutral-08)]">区县样本</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="relative overflow-hidden rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4">
              <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: item.color }} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-[var(--color-neutral-08)]">{item.label}</div>
                  <div className="mt-2 text-3xl font-bold leading-none text-white">{formatNumber(item.value)}</div>
                </div>
                <Icon className="h-5 w-5" style={{ color: item.color }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.95fr)]">
        <section className="h-full rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-5">
          <div>
            <h2 className="text-base font-semibold text-white">人口变化趋势</h2>
            <div className="mt-1 text-xs text-[var(--color-neutral-08)]">{RANGE_LABELS[selectedRange]} · 烟台市样本</div>
          </div>
          <div className="mt-4 h-[238px] w-full xl:h-[252px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                <AreaChart data={dashboard?.trendData ?? []} margin={{ top: 10, right: 22, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="phase10DarkPopulation" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2761CB" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#2761CB" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7599' }} />
                  <YAxis axisLine={false} tickLine={false} domain={['dataMin - 5', 'auto']} tick={{ fill: '#6b7599' }} />
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#3d4663" />
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  <Area type="monotone" dataKey="value" name="人口数" stroke="#2761CB" strokeWidth={3} fillOpacity={1} fill="url(#phase10DarkPopulation)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--color-neutral-08)]">加载中...</div>
            )}
          </div>
        </section>

        <section className="flex h-full flex-col rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-5">
          <h2 className="text-base font-semibold text-white">重点标签人员</h2>
          <HorizontalBarList
            className="mt-5 flex-1 space-y-3.5"
            columnsClassName="grid-cols-[88px_minmax(96px,1fr)_48px] xl:grid-cols-[104px_minmax(120px,1fr)_54px]"
            emptyText="暂无重点标签数据"
            labelClassName="text-right"
            minBarPercent={4}
            valueFormatter={formatNumber}
            items={topRiskTags.map((tag, index) => ({
              label: tag.name,
              value: tag.count,
              color: RISK_TAG_COLORS[index % RISK_TAG_COLORS.length],
            }))}
          />
        </section>
      </div>

      <section className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">区县概览</h2>
            <div className="mt-1 text-xs text-[var(--color-neutral-08)]">点击列头排序</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onRouteChange?.('data-comparison')}>进入数据对比</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-neutral-03)]">
                <SortableHeader sortKey="rank" currentKey={districtSort.key} direction={districtSort.direction} label="排名" align="left" className="w-16 py-3 text-xs" onSort={handleDistrictSort} />
                <SortableHeader sortKey="name" currentKey={districtSort.key} direction={districtSort.direction} label="区县名称" align="left" className="py-3 text-xs" onSort={handleDistrictSort} />
                <SortableHeader sortKey="peopleCount" currentKey={districtSort.key} direction={districtSort.direction} label="人口数" className="py-3 text-xs" onSort={handleDistrictSort} />
                <SortableHeader sortKey="houseCount" currentKey={districtSort.key} direction={districtSort.direction} label="房屋数" className="py-3 text-xs" onSort={handleDistrictSort} />
                <SortableHeader sortKey="visitCount" currentKey={districtSort.key} direction={districtSort.direction} label="走访次" className="py-3 text-xs" onSort={handleDistrictSort} />
                <SortableHeader sortKey="activeConflictCount" currentKey={districtSort.key} direction={districtSort.direction} label="待化解" className="py-3 text-xs" onSort={handleDistrictSort} />
                <SortableHeader sortKey="floatingCount" currentKey={districtSort.key} direction={districtSort.direction} label="流动人口" className="py-3 text-xs" onSort={handleDistrictSort} />
                <SortableHeader sortKey="score" currentKey={districtSort.key} direction={districtSort.direction} label="风险指数" className="w-[260px] py-3 text-xs" onSort={handleDistrictSort} />
              </tr>
            </thead>
            <tbody>
              {districtRows.map((row, index) => {
                const scoreColor = getScoreColor(row.score);
                return (
                  <tr key={row.id} className="border-b border-[rgba(61,70,99,0.45)] transition-colors hover:bg-[rgba(39,97,203,0.08)]">
                    <td className={`px-4 py-3 text-sm font-semibold ${index < 3 ? 'text-[#D6730D]' : 'text-[var(--color-neutral-08)]'}`}>#{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{row.name}</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--color-neutral-10)]">{formatNumber(row.peopleCount)}</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--color-neutral-10)]">{formatNumber(row.houseCount)}</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-[#19B172]">{formatNumber(row.visitCount)}</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-[#D6730D]">{formatNumber(row.activeConflictCount)}</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--color-neutral-10)]">{formatNumber(row.floatingCount)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="ml-auto grid w-[236px] grid-cols-[148px_64px] items-center justify-end gap-4">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-neutral-03)]">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, row.score)}%`, backgroundColor: scoreColor }} />
                        </div>
                        <span className="inline-flex h-7 w-16 items-center justify-center rounded bg-[rgba(39,97,203,0.18)] text-sm font-semibold tabular-nums" style={{ color: scoreColor }}>
                          {formatScore(row.score)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {districtRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-[var(--color-neutral-08)]">暂无区县概览数据</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
