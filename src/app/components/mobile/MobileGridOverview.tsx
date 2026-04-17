import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ClipboardList, Home, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { MobileStatusBar } from './MobileStatusBar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { conflictRepository } from '../../services/repositories/conflictRepository';
import { houseRepository } from '../../services/repositories/houseRepository';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';
import { personRepository } from '../../services/repositories/personRepository';
import { statsRepository, type StatsGridItem } from '../../services/repositories/statsRepository';
import { visitRepository } from '../../services/repositories/visitRepository';
import type { ConflictRecord, House, Person, VisitRecord } from '../../types/core';

interface MobileGridOverviewProps {
  onBack: () => void;
}

function buildAgeBuckets(people: Person[]) {
  const buckets = [
    { name: '0-17', min: 0, max: 17, value: 0 },
    { name: '18-35', min: 18, max: 35, value: 0 },
    { name: '36-59', min: 36, max: 59, value: 0 },
    { name: '60-79', min: 60, max: 79, value: 0 },
    { name: '80+', min: 80, max: 200, value: 0 },
  ];

  people.forEach((person) => {
    const bucket = buckets.find((item) => person.age >= item.min && person.age <= item.max);
    if (bucket) {
      bucket.value += 1;
    }
  });

  return buckets;
}

function calculateInfoCompleteness(people: Person[]) {
  if (people.length === 0) {
    return 0;
  }
  const fields: Array<keyof Person> = ['phone', 'idCard', 'address', 'houseId'];
  let filled = 0;
  let total = 0;
  people.forEach((person) => {
    fields.forEach((field) => {
      total += 1;
      if (person[field]) {
        filled += 1;
      }
    });
  });
  return total === 0 ? 0 : Math.round((filled / total) * 100);
}

function uniqueVisitedPeople(people: Person[], visits: VisitRecord[], houses: House[]) {
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const residentsByHouseId = new Map<string, string[]>();
  houses.forEach((house) => {
    residentsByHouseId.set(
      house.id,
      people.filter((person) => person.houseId === house.id).map((person) => person.id),
    );
  });

  const visitedIds = new Set<string>();
  visits.forEach((visit) => {
    if (visit.targetType === 'person' && peopleById.has(visit.targetId)) {
      visitedIds.add(visit.targetId);
      return;
    }
    if (visit.targetType === 'house') {
      (residentsByHouseId.get(visit.targetId) ?? []).forEach((residentId) => visitedIds.add(residentId));
    }
  });
  return visitedIds.size;
}

export function MobileGridOverview({ onBack }: MobileGridOverviewProps) {
  const [gridStats, setGridStats] = useState<StatsGridItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGridId, setSelectedGridId] = useState<string | null>(
    () => mobileContextRepository.getCurrentGridSelection().id ?? null,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const nextGridStats = await statsRepository.getGridStats();
        if (cancelled) {
          return;
        }
        setGridStats(nextGridStats.grids);
        const nextGridId = selectedGridId ?? nextGridStats.grids[0]?.id ?? null;
        if (!nextGridId) {
          setPeople([]);
          setHouses([]);
          setVisits([]);
          setConflicts([]);
          setLoading(false);
          return;
        }
        setSelectedGridId(nextGridId);

        const [nextPeople, nextHouses, nextVisits, nextConflicts] = await Promise.all([
          personRepository.getPeople({ gridId: nextGridId, limit: 500 }),
          houseRepository.getHouses({ gridId: nextGridId, limit: 500 }),
          visitRepository.getVisits({ gridId: nextGridId, limit: 500, order: 'desc' }),
          conflictRepository.getConflicts({ gridId: nextGridId, limit: 500 }),
        ]);

        if (cancelled) {
          return;
        }

        setPeople(nextPeople);
        setHouses(nextHouses);
        setVisits(nextVisits);
        setConflicts(nextConflicts);

        const selectedGrid = nextGridStats.grids.find((grid) => grid.id === nextGridId);
        if (selectedGrid) {
          mobileContextRepository.setCurrentGridSelection({
            id: selectedGrid.id,
            name: selectedGrid.name,
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '辖区概况加载失败');
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
  }, [selectedGridId]);

  const currentGrid = useMemo(
    () => gridStats.find((grid) => grid.id === selectedGridId) ?? gridStats[0],
    [gridStats, selectedGridId],
  );

  const riskCount = useMemo(() => people.filter((person) => person.risk === 'High').length, [people]);
  const populationData = useMemo(() => {
    const colors: Record<string, string> = {
      户籍: '#3b82f6',
      流动: '#f97316',
      留守: '#8b5cf6',
      境外: '#06b6d4',
    };
    const counts = new Map<string, number>();
    people.forEach((person) => {
      counts.set(person.type, (counts.get(person.type) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: `${name}人口`,
      value,
      color: colors[name] ?? '#94a3b8',
    }));
  }, [people]);
  const housingData = useMemo(() => {
    const counts = new Map<string, number>();
    houses.forEach((house) => {
      counts.set(house.type, (counts.get(house.type) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [houses]);
  const ageData = useMemo(() => buildAgeBuckets(people), [people]);
  const careStats = useMemo(() => {
    const counts = new Map<string, number>();
    people.forEach((person) => {
      (person.careLabels ?? []).forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1));
    });
    const older = people.filter((person) => person.age >= 60).length;
    if (older > 0) {
      counts.set('老年人(60+)', older);
    }
    return Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
  }, [people]);
  const completenessRate = useMemo(() => calculateInfoCompleteness(people), [people]);
  const visitCoverage = useMemo(() => {
    if (people.length === 0) {
      return 0;
    }
    const visited = uniqueVisitedPeople(people, visits, houses);
    return Math.round((visited / people.length) * 100);
  }, [houses, people, visits]);
  const conflictStats = useMemo(
    () => ({
      active: conflicts.filter((conflict) => conflict.status === '调解中').length,
      resolved: conflicts.filter((conflict) => conflict.status === '已化解').length,
      total: conflicts.length,
    }),
    [conflicts],
  );

  const basicStats = [
    { label: '实有人口', value: people.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: '实有房屋', value: houses.length, icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    { label: '走访记录', value: visits.length, icon: ClipboardList, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: '重点关注', value: riskCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="sticky top-0 z-20 border-b border-border bg-card">
        <MobileStatusBar variant="light" />
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0 text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-bold text-foreground">辖区概况</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="border-b border-border bg-card px-5 py-5">
          <h2 className="mb-1 text-lg font-bold text-foreground">{currentGrid?.name ?? '暂无网格数据'}</h2>
          <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground">
            <span>责任人：{currentGrid?.managerName ?? '未配置'}</span>
            <span>人口：{currentGrid?.peopleCount ?? 0}</span>
            <span>房屋：{currentGrid?.houseCount ?? 0}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-normal">
              走访 {currentGrid?.visitCount ?? 0}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              纠纷 {currentGrid?.conflictCount ?? 0}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              信息完整度 {completenessRate}%
            </Badge>
          </div>
        </div>

        <div className="space-y-4 p-4 pb-8">
          {error ? (
            <Card className="border-destructive/40">
              <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {basicStats.map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`h-10 w-10 shrink-0 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold leading-none text-foreground">{loading ? '--' : stat.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border px-4 pb-2 pt-4">
              <CardTitle className="text-sm font-bold text-foreground">人口结构</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="relative flex w-1/2 shrink-0 items-center justify-center">
                  <div style={{ width: 140, height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={populationData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                          {populationData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">总数</div>
                      <div className="text-sm font-bold text-foreground">{people.length}</div>
                    </div>
                  </div>
                </div>
                <div className="w-1/2 space-y-3 pl-2">
                  {populationData.map((item) => {
                    const pct = people.length > 0 ? Math.round((item.value / people.length) * 100) : 0;
                    return (
                      <div key={item.name}>
                        <div className="mb-0.5 flex items-center justify-between text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.name}
                          </div>
                          <div className="font-bold">{pct}%</div>
                        </div>
                        <div className="pl-4 text-xs text-muted-foreground">{item.value} 人</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-border px-4 pb-2 pt-4">
              <CardTitle className="text-sm font-bold text-foreground">年龄分布</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div style={{ height: 160, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-neutral-03)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-neutral-08)' }} allowDecimals={false} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {careStats.length > 0 ? (
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-border px-4 pb-2 pt-4">
                <CardTitle className="text-sm font-bold text-foreground">特殊关爱群体</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {careStats.map(([label, count]) => (
                    <div key={label} className="rounded-lg bg-[var(--color-neutral-02)] px-2 py-2.5 text-center">
                      <div className="text-lg font-bold text-foreground">{count}</div>
                      <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-border px-4 pb-2 pt-4">
              <CardTitle className="text-sm font-bold text-foreground">房屋使用性质</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div style={{ height: 160, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={housingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-neutral-03)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-neutral-08)' }} allowDecimals={false} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b border-border px-4 pb-2 pt-4">
              <CardTitle className="text-sm font-bold text-foreground">综合指标</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">居民信息完善度</span>
                  <span className="font-bold text-foreground">{completenessRate}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-neutral-03)]">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completenessRate}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">走访覆盖率</span>
                  <span className="font-bold text-foreground">{visitCoverage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-neutral-03)]">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${visitCoverage}%` }} />
                </div>
              </div>
              {conflictStats.total > 0 ? (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-muted-foreground">矛盾纠纷</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-foreground">
                      <span className="font-bold text-orange-500">{conflictStats.active}</span> 调解中
                    </span>
                    <span className="text-foreground">
                      <span className="font-bold text-green-500">{conflictStats.resolved}</span> 已化解
                    </span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
