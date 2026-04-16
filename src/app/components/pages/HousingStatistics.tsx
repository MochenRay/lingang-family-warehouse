import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building, ClipboardCheck, Home, Hotel, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { houseRepository } from '../../services/repositories/houseRepository';
import { personRepository } from '../../services/repositories/personRepository';
import { statsRepository, type DashboardStatsResponse, type StatsGridItem } from '../../services/repositories/statsRepository';
import type { House, Person } from '../../types/core';

interface GridWorkloadItem {
  name: string;
  走访率: number;
  信息完整度: number;
}

function countByTag(houses: House[], keyword: string) {
  return houses.filter((house) => (house.tags ?? []).some((tag) => tag.includes(keyword))).length;
}

function calculateInfoCompleteness(people: Person[]) {
  if (people.length === 0) {
    return 0;
  }
  const keyFields: Array<keyof Person> = ['phone', 'idCard', 'address', 'houseId'];
  let filled = 0;
  let total = 0;
  people.forEach((person) => {
    keyFields.forEach((field) => {
      total += 1;
      if (person[field]) {
        filled += 1;
      }
    });
  });
  return total === 0 ? 0 : Math.round((filled / total) * 100);
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

  const gridWorkload = useMemo<GridWorkloadItem[]>(() => {
    if (grids.length === 0) {
      return [];
    }

    return grids.map((grid) => {
      const gridPeople = people.filter((person) => person.gridId === grid.id);
      const coverage =
        grid.peopleCount > 0 ? Math.min(100, Math.round((grid.visitCount / grid.peopleCount) * 100)) : 0;
      return {
        name: grid.name.replace('竹岛街道', '').replace('海源社区', '').replace('第', '').replace('网格', '网格'),
        走访率: coverage,
        信息完整度: calculateInfoCompleteness(gridPeople),
      };
    });
  }, [grids, people]);

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }
    return [
      { label: '自住房屋', count: dashboard.housingStats.selfOccupied, icon: Home, color: 'text-blue-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
      { label: '出租房屋', count: dashboard.housingStats.rental, icon: Hotel, color: 'text-orange-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
      { label: '经营场所', count: dashboard.housingStats.commercial, icon: Store, color: 'text-green-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
      { label: '空置房屋', count: dashboard.housingStats.vacant, icon: Building, color: 'text-gray-400', bg: 'bg-[var(--color-neutral-02)]', iconBg: 'bg-[var(--color-neutral-03)]' },
    ];
  }, [dashboard]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">房屋网格画像</h1>
        <p className="text-gray-500">统一复用驾驶舱、房屋管理和网格统计的真实聚合口径。</p>
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>房屋用途分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loading || !dashboard ? (
                <div className="py-10 text-sm text-muted-foreground">正在汇总房屋用途...</div>
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
                      label
                    >
                      {houseUsageData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5 text-orange-500" />
              出租房治理预警
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="py-10 text-sm text-muted-foreground">正在计算治理预警...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rentalWarnings} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontWeight: 'bold' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
            网格员工作效能对比
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总网格工作量...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gridWorkload}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="走访率" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="信息完整度" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`flex items-center gap-4 rounded-lg border border-[var(--color-neutral-03)] p-4 ${item.bg}`}>
              <div className={`rounded-lg p-2 ${item.iconBg}`}>
                <Icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-neutral-11)]">{item.count}</div>
                <div className="text-sm font-medium text-[var(--color-neutral-08)]">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
