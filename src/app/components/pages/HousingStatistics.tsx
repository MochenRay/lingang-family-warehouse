import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Building, Home, Hotel, MapPinned, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { houseRepository } from '../../services/repositories/houseRepository';
import { personRepository } from '../../services/repositories/personRepository';
import { statsRepository, type DashboardStatsResponse, type StatsGridItem } from '../../services/repositories/statsRepository';
import type { House, Person } from '../../types/core';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';

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

function countByTag(houses: House[], keyword: string) {
  return houses.filter((house) => (house.tags ?? []).some((tag) => tag.includes(keyword))).length;
}

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

export function HousingStatistics() {
  const [dashboard, setDashboard] = useState<DashboardStatsResponse | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [grids, setGrids] = useState<StatsGridItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const [nextDashboard, nextHouses, nextPeople, nextGridStats] = await Promise.all([
          statsRepository.getDashboard('month'),
          houseRepository.getHouses({ limit: 500 }),
          personRepository.getPeople({ limit: 500 }),
          statsRepository.getGridStats(),
        ]);
        if (cancelled) {
          return;
        }
        setDashboard(nextDashboard);
        setHouses(nextHouses);
        setPeople(nextPeople);
        setGrids(nextGridStats.grids);
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

  const gridById = useMemo(() => new Map(grids.map((grid) => [grid.id, grid])), [grids]);

  const districtHousingRows = useMemo(() => {
    const rows = new Map<string, DistrictHousingItem>();
    const ensure = (name: string) => {
      const nextName = name || '未识别区县';
      const existing = rows.get(nextName);
      if (existing) {
        return existing;
      }
      const created = createDistrictRow(nextName);
      rows.set(nextName, created);
      return created;
    };

    (dashboard?.regionSummaries ?? [])
      .filter((item) => item.level === 'district')
      .forEach((item) => ensure(item.name));

    houses.forEach((house) => {
      const districtName = gridById.get(house.gridId)?.districtName ?? house.communityName ?? '未识别区县';
      const row = ensure(districtName);
      row.houseCount += 1;
      if (house.type === '自住') {
        row.selfOccupiedCount += 1;
      } else if (house.type === '出租') {
        row.rentalCount += 1;
      } else if (house.type === '空置') {
        row.vacantCount += 1;
      } else if (house.type === '经营') {
        row.commercialCount += 1;
      }
      if (
        (house.tags ?? []).some((tag) => tag.includes('群租') || tag.includes('换租') || tag.includes('租约到期')) ||
        house.occupancyStatus === '户在人不在'
      ) {
        row.warningCount += 1;
      }
    });

    people.forEach((person) => {
      const districtName = gridById.get(person.gridId)?.districtName ?? '未识别区县';
      const row = ensure(districtName);
      row.peopleCount += 1;
      if (person.type === '流动') {
        row.floatingCount += 1;
      }
    });

    return Array.from(rows.values())
      .map((row) => ({
        ...row,
        score: Math.min(100, Number((row.warningCount * 9 + row.rentalCount * 1.8 + row.vacantCount * 1.2 + row.floatingCount * 0.4).toFixed(1))),
      }))
      .sort((left, right) => right.score - left.score || right.houseCount - left.houseCount || left.name.localeCompare(right.name, 'zh-CN'));
  }, [dashboard, gridById, houses, people]);

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
      { name: '群租预警', value: countByTag(houses, '群租'), fill: '#ef4444' },
      {
        name: '频繁换租',
        value: countByTag(houses, '换租') + countByTag(houses, '租约到期'),
        fill: '#f97316',
      },
      {
        name: '人房分离',
        value: houses.filter((house) => house.occupancyStatus === '户在人不在').length,
        fill: '#8b5cf6',
      },
    ],
    [houses],
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">房屋网格画像</h1>
        <p className="mt-1 text-sm text-[var(--color-neutral-08)]">先看区县级房屋治理压力，再下钻街镇、社区和网格。</p>
      </div>

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
                    <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              重点区县清单
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {districtHousingRows.slice(0, 6).map((row, index) => (
              <div key={row.name} className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-semibold text-blue-500">{index + 1}</span>
                    <div>
                      <div className="font-semibold text-[var(--color-neutral-11)]">{row.name}</div>
                      <div className="text-xs text-[var(--color-neutral-08)]">
                        {formatNumber(row.houseCount)} 套房屋 · {formatNumber(row.peopleCount)} 人
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--color-neutral-11)]">{row.score}</div>
                    <div className="text-xs text-[var(--color-neutral-07)]">压力</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-[var(--color-neutral-07)]">出租</div>
                    <div className="mt-1 font-semibold text-[var(--color-neutral-11)]">{row.rentalCount}</div>
                  </div>
                  <div>
                    <div className="text-[var(--color-neutral-07)]">预警</div>
                    <div className="mt-1 font-semibold text-[var(--color-neutral-11)]">{row.warningCount}</div>
                  </div>
                  <div>
                    <div className="text-[var(--color-neutral-07)]">流动</div>
                    <div className="mt-1 font-semibold text-[var(--color-neutral-11)]">{row.floatingCount}</div>
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
                    <Tooltip content={<DarkChartTooltip />} />
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
                    <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
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
