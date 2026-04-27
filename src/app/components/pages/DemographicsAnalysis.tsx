import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { personRepository } from '../../services/repositories/personRepository';
import { statsRepository, type DashboardStatsResponse } from '../../services/repositories/statsRepository';
import { tagRepository, type TagSnapshot } from '../../services/repositories/tagRepository';
import type { Person } from '../../types/core';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';

const COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#f97316', '#dc2626', '#16a34a'];
const PERSON_TYPE_ORDER: Person['type'][] = ['户籍', '流动', '留守', '境外'];
const EDUCATION_ORDER = ['学龄前', '未上学', '小学', '初中', '高中', '中专', '大专', '本科', '研究生', '硕士', '博士', '其他', '未记录'];
const AGE_BUCKETS = [
  { name: '60岁以上', min: 60, max: 200 },
  { name: '36-59岁', min: 36, max: 59 },
  { name: '19-35岁', min: 19, max: 35 },
  { name: '0-18岁', min: 0, max: 18 },
];

function aggregateCounts(items: Array<string | undefined>, limit = 6) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = item && item.trim() ? item : '未记录';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-CN'))
    .slice(0, limit)
    .map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length],
    }));
}

function buildTypeDistribution(people: Person[]) {
  const counts = new Map<Person['type'], number>(PERSON_TYPE_ORDER.map((type) => [type, 0]));
  people.forEach((person) => {
    counts.set(person.type, (counts.get(person.type) ?? 0) + 1);
  });

  return PERSON_TYPE_ORDER.map((name, index) => ({
    name,
    value: counts.get(name) ?? 0,
    fill: COLORS[index % COLORS.length],
  }));
}

function buildEducationDistribution(people: Person[]) {
  const counts = new Map<string, number>();
  people.forEach((person) => {
    const key = person.education?.trim() || '未记录';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const used = new Set<string>();
  const ordered = EDUCATION_ORDER
    .filter((name) => counts.has(name))
    .map((name) => {
      used.add(name);
      return [name, counts.get(name) ?? 0] as const;
    });
  const rest = Array.from(counts.entries())
    .filter(([name]) => !used.has(name))
    .sort((left, right) => left[0].localeCompare(right[0], 'zh-CN'));

  return [...ordered, ...rest].map(([name, value], index) => ({
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

  const educationData = useMemo(() => buildEducationDistribution(people), [people]);
  const nationData = useMemo(() => aggregateCounts(people.map((person) => person.nation)), [people]);
  const typeData = useMemo(() => buildTypeDistribution(people), [people]);
  const pyramid = useMemo(() => {
    const rows = AGE_BUCKETS.map((bucket) => {
      const bucketPeople = people.filter((person) => person.age >= bucket.min && person.age <= bucket.max);
      return {
        name: bucket.name,
        male: bucketPeople.filter((person) => person.gender === '男').length,
        female: bucketPeople.filter((person) => person.gender === '女').length,
      };
    });
    const max = Math.max(1, ...rows.flatMap((row) => [row.male, row.female]));
    return { rows, max };
  }, [people]);
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

      <Card>
        <CardHeader>
          <CardTitle>年龄性别人口金字塔</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-sm text-muted-foreground">正在汇总年龄性别结构...</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr,92px,1fr] items-center text-xs font-medium text-muted-foreground">
                <div className="text-right">男</div>
                <div />
                <div>女</div>
              </div>
              {pyramid.rows.map((row) => (
                <div key={row.name} className="grid grid-cols-[1fr,92px,1fr] items-center gap-3">
                  <div className="flex items-center justify-end gap-2">
                    <span className="w-8 text-right text-xs font-semibold text-[var(--color-neutral-10)]">{row.male}</span>
                    <div className="flex h-7 flex-1 justify-end overflow-hidden rounded-l bg-[var(--color-neutral-02)]">
                      <div className="h-full rounded-l bg-[#4E86DF]" style={{ width: `${(row.male / pyramid.max) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-center text-sm font-semibold text-[var(--color-neutral-09)]">{row.name}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 flex-1 overflow-hidden rounded-r bg-[var(--color-neutral-02)]">
                      <div className="h-full rounded-r bg-[#F97316]" style={{ width: `${(row.female / pyramid.max) * 100}%` }} />
                    </div>
                    <span className="w-8 text-xs font-semibold text-[var(--color-neutral-10)]">{row.female}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>人口类型</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总人口类型...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  <Bar dataKey="value" name="人数" radius={[8, 8, 0, 0]}>
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
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总教育结构...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  <Bar dataKey="value" name="人数" radius={[8, 8, 0, 0]}>
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
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总民族分布...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  <Bar dataKey="value" name="人数" radius={[8, 8, 0, 0]}>
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
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  <Bar dataKey="value" name="人数" radius={[8, 8, 0, 0]}>
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
