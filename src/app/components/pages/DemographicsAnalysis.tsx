import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { personRepository } from '../../services/repositories/personRepository';
import { statsRepository, type DashboardStatsResponse } from '../../services/repositories/statsRepository';
import { tagRepository, type TagSnapshot } from '../../services/repositories/tagRepository';
import type { Person } from '../../types/core';

const COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#f97316', '#dc2626', '#16a34a'];

function aggregateCounts(items: Array<string | undefined>, limit = 6) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = item && item.trim() ? item : '未记录';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const sorted = Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length],
    }));

  return sorted;
}

function buildTypeDistribution(people: Person[]) {
  const counts = new Map<string, number>();
  people.forEach((person) => {
    counts.set(person.type, (counts.get(person.type) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, value], index) => ({
    name,
    value,
    fill: COLORS[index % COLORS.length],
  }));
}

export function DemographicsAnalysis() {
  const [dashboard, setDashboard] = useState<DashboardStatsResponse | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [tagSnapshot, setTagSnapshot] = useState<TagSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const [nextDashboard, nextPeople, nextTagSnapshot] = await Promise.all([
          statsRepository.getDashboard(),
          personRepository.getPeople({ limit: 500 }),
          tagRepository.getSnapshot(),
        ]);
        if (!cancelled) {
          setDashboard(nextDashboard);
          setPeople(nextPeople);
          setTagSnapshot(nextTagSnapshot);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '人口特征分析加载失败');
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

  const educationData = useMemo(() => aggregateCounts(people.map((person) => person.education)), [people]);
  const nationData = useMemo(() => aggregateCounts(people.map((person) => person.nation)), [people]);
  const typeData = useMemo(() => buildTypeDistribution(people), [people]);
  const topTags = useMemo(
    () =>
      (tagSnapshot?.tags ?? [])
        .slice()
        .sort((left, right) => right.coverageCount - left.coverageCount)
        .map((tag, index) => ({
          name: tag.name,
          value: tag.coverageCount,
          fill: COLORS[index % COLORS.length],
        })),
    [tagSnapshot],
  );

  const elderlyRate = useMemo(() => {
    if (people.length === 0) {
      return '0.0';
    }
    const elderly = people.filter((person) => person.age >= 60).length;
    return ((elderly / people.length) * 100).toFixed(1);
  }, [people]);

  const taggedCoverage = useMemo(() => {
    if (!tagSnapshot || tagSnapshot.totalPeople === 0) {
      return '0.0';
    }
    const covered = tagSnapshot.people.filter((record) => record.matchedTags.length > 0).length;
    return ((covered / tagSnapshot.totalPeople) * 100).toFixed(1);
  }, [tagSnapshot]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">人口特征分析</h2>
        <p className="text-muted-foreground">
          基于统一人口、标签和驾驶舱统计口径做下钻分析，不再直接读取本地 `db`。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">总人口</p>
            <p className="mt-2 text-2xl font-bold">{dashboard?.totalPopulation ?? '--'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">老龄化比例</p>
            <p className="mt-2 text-2xl font-bold">{elderlyRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">户籍 / 流动</p>
            <p className="mt-2 text-2xl font-bold">
              {dashboard ? `${dashboard.mobilePeopleStats.registered} / ${dashboard.mobilePeopleStats.floating}` : '--'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">标签覆盖率</p>
            <p className="mt-2 text-2xl font-bold">{taggedCoverage}%</p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>性别结构</CardTitle>
            <CardDescription>直接复用驾驶舱人口统计口径。</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading || !dashboard ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总性别结构...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboard.genderData} dataKey="value" nameKey="name" outerRadius={110} label>
                    {dashboard.genderData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>年龄结构</CardTitle>
            <CardDescription>与驾驶舱保持一致的四段年龄桶。</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading || !dashboard ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总年龄结构...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.ageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {dashboard.ageData.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>人口类型</CardTitle>
            <CardDescription>户籍、流动、留守、境外分类。</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总人口类型...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {typeData.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>教育程度</CardTitle>
            <CardDescription>直接来自人物字段聚合。</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总教育结构...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {educationData.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>民族分布</CardTitle>
            <CardDescription>保留前 6 类，其他归并为未记录/长尾。</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总民族分布...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {nationData.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>重点标签热度</CardTitle>
          <CardDescription>按当前 T30 固定标签规则命中人数排序。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总标签热度...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTags}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {topTags.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(tagSnapshot?.tags ?? []).map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name} · {tag.coverageCount} 人
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
