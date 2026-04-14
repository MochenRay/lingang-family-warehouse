import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Users, Home, AlertTriangle, ClipboardList } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { db } from '../../services/db';
import type { Person, House } from '../../types/core';

interface MobileGridOverviewProps {
  onBack: () => void;
}

export function MobileGridOverview({ onBack }: MobileGridOverviewProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [mounted, setMounted] = useState(false);

  const currentGrid = JSON.parse(localStorage.getItem('current_grid') || '{"id":"g1","name":"竹岛街道海源社区第一网格"}');

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const load = () => {
      setPeople(db.getPeople(p => p.gridId === currentGrid.id));
      setHouses(db.getHouses(h => h.gridId === currentGrid.id));
    };
    load();
    window.addEventListener('db-change', load);
    return () => window.removeEventListener('db-change', load);
  }, [currentGrid.id]);

  // 走访和纠纷（全量读取后按 gridId 过滤）
  const visits = useMemo(() => db.getVisits(v => v.gridId === currentGrid.id), [currentGrid.id]);
  const conflicts = useMemo(() => db.getConflicts(c => c.gridId === currentGrid.id), [currentGrid.id]);

  // ===== 统计计算 =====

  // 基础统计
  const riskCount = useMemo(() => people.filter(p => p.risk === 'High').length, [people]);

  // 人口结构
  const popByType = useMemo(() => {
    const map: Record<string, number> = {};
    people.forEach(p => { map[p.type] = (map[p.type] || 0) + 1; });
    return map;
  }, [people]);

  const populationData = useMemo(() => {
    const colors: Record<string, string> = { '户籍': '#3b82f6', '流动': '#f97316', '留守': '#8b5cf6', '境外': '#06b6d4' };
    return Object.entries(popByType)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: `${name}人口`, value, color: colors[name] || '#94a3b8' }));
  }, [popByType]);

  // 房屋使用性质
  const housingData = useMemo(() => {
    const map: Record<string, number> = {};
    houses.forEach(h => { map[h.type] = (map[h.type] || 0) + 1; });
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [houses]);

  // 年龄分布
  const ageData = useMemo(() => {
    const buckets = [
      { name: '0-17', min: 0, max: 17, count: 0 },
      { name: '18-35', min: 18, max: 35, count: 0 },
      { name: '36-59', min: 36, max: 59, count: 0 },
      { name: '60-79', min: 60, max: 79, count: 0 },
      { name: '80+', min: 80, max: 999, count: 0 },
    ];
    people.forEach(p => {
      const b = buckets.find(b => p.age >= b.min && p.age <= b.max);
      if (b) b.count++;
    });
    return buckets.map(b => ({ name: b.name, value: b.count }));
  }, [people]);

  // 特殊关爱群体（从 careLabels 统计）
  const careStats = useMemo(() => {
    const map: Record<string, number> = {};
    people.forEach(p => {
      if (p.careLabels) {
        p.careLabels.forEach(label => { map[label] = (map[label] || 0) + 1; });
      }
      // 补充 tags 中的常见标签
      if (p.tags.includes('党员')) map['党员'] = (map['党员'] || 0) + 1;
    });
    // 也按年龄统计老年人
    const elderly = people.filter(p => p.age >= 60).length;
    if (elderly > 0) map['老年人(60+)'] = elderly;
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [people]);

  // 信息完善度（检查关键字段是否有值）
  const completenessRate = useMemo(() => {
    if (people.length === 0) return 0;
    const keyFields: (keyof Person)[] = ['phone', 'idCard', 'address', 'houseId'];
    let filled = 0;
    let total = 0;
    people.forEach(p => {
      keyFields.forEach(f => {
        total++;
        if (p[f]) filled++;
      });
    });
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [people]);

  // 纠纷状态
  const conflictStats = useMemo(() => {
    const active = conflicts.filter(c => c.status === '调解中').length;
    const resolved = conflicts.filter(c => c.status === '已化解').length;
    return { active, resolved, total: conflicts.length };
  }, [conflicts]);

  // 基础卡片数据
  const basicStats = [
    { label: '实有人口', value: people.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: '实有房屋', value: houses.length, icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    { label: '走访记录', value: visits.length, icon: ClipboardList, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: '重点关注', value: riskCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <MobileStatusBar variant="light" />
        <div className="px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-0 h-8 w-8 text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-base font-bold text-foreground">辖区概况</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* 网格信息横幅 */}
        <div className="bg-card border-b border-border px-5 py-5">
          <h2 className="text-foreground text-lg font-bold mb-1">{currentGrid.name}</h2>
          <div className="flex items-center gap-3 text-muted-foreground text-sm mb-3">
            <span>责任人：李明辉</span>
            <span>面积：0.8km²</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="font-normal">示范网格</Badge>
            <Badge variant="secondary" className="font-normal">三星级</Badge>
          </div>
        </div>

        <div className="p-4 space-y-4 pb-8">
          {/* 基础统计 */}
          <div className="grid grid-cols-2 gap-3">
            {basicStats.map((stat, index) => (
              <Card key={index} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground leading-none">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 人口结构饼图 */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                人口结构
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-[140px] w-1/2 relative shrink-0 flex items-center justify-center">
                  {people.length > 0 && mounted && (
                    <div style={{ width: 140, height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart>
                          <Pie
                            data={populationData}
                            cx="50%" cy="50%"
                            innerRadius={35} outerRadius={55}
                            paddingAngle={2} dataKey="value"
                            startAngle={90} endAngle={-270}
                          >
                            {populationData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">总数</div>
                      <div className="text-sm font-bold text-foreground">{people.length}</div>
                    </div>
                  </div>
                </div>
                <div className="w-1/2 space-y-3 pl-2 min-w-0">
                  {populationData.map((item, i) => {
                    const pct = people.length > 0 ? Math.round((item.value / people.length) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm text-foreground mb-0.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.name}
                          </div>
                          <div className="font-bold">{pct}%</div>
                        </div>
                        <div className="text-xs text-muted-foreground pl-4">{item.value} 人</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 年龄分布 */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                年龄分布
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div style={{ height: 160, width: '100%' }}>
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-neutral-03)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-neutral-08)' }} allowDecimals={false} />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 房屋使用性质 */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                房屋使用性质
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div style={{ height: 160, width: '100%' }}>
                {mounted && housingData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <BarChart data={housingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-neutral-03)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-neutral-10)' }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-neutral-08)' }} allowDecimals={false} />
                      <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 特殊关爱群体 */}
          {careStats.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <div className="w-1 h-4 bg-rose-500 rounded-full" />
                  特殊关爱群体
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {careStats.map(([label, count]) => (
                    <div key={label} className="bg-[var(--color-neutral-02)] rounded-lg py-2.5 px-2 text-center">
                      <div className="text-lg font-bold text-foreground">{count}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 综合指标 */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                综合指标
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* 信息完善度 */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">居民信息完善度</span>
                  <span className="font-bold text-foreground">{completenessRate}%</span>
                </div>
                <div className="h-2 bg-[var(--color-neutral-03)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${completenessRate}%`,
                      backgroundColor: completenessRate >= 80 ? '#10b981' : completenessRate >= 60 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
              {/* 走访覆盖率 */}
              {(() => {
                const visitedIds = new Set(visits.map(v => v.targetId));
                const coverage = people.length > 0 ? Math.round((visitedIds.size / people.length) * 100) : 0;
                return (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">走访覆盖率</span>
                      <span className="font-bold text-foreground">{coverage}%</span>
                    </div>
                    <div className="h-2 bg-[var(--color-neutral-03)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${coverage}%`,
                          backgroundColor: coverage >= 80 ? '#10b981' : coverage >= 50 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
              {/* 矛盾纠纷 */}
              {conflictStats.total > 0 && (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
