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
import { personRepository } from '../../services/repositories/personRepository';
import { statsRepository, type DashboardStatsResponse } from '../../services/repositories/statsRepository';
import { tagRepository, type TagSnapshot } from '../../services/repositories/tagRepository';
import type { Person } from '../../types/core';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { PageHeader } from './PageHeader';

const COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#f97316', '#dc2626', '#16a34a'];
const PERSON_TYPE_ORDER: Person['type'][] = ['户籍', '流动', '留守', '境外'];
const EDUCATION_ORDER = ['学龄前', '未上学', '小学', '初中', '高中', '中专', '大专', '本科', '硕士', '博士', '其他', '未记录'];
const PANEL_CLASS = 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const CHART_GRID_STROKE = '#3d4663';
const AXIS_TICK = { fontSize: 12, fill: '#6b7599' };
const AGE_BUCKETS = [
  { name: '60岁以上', min: 60, max: 200 },
  { name: '36-59岁', min: 36, max: 59 },
  { name: '19-35岁', min: 19, max: 35 },
  { name: '0-18岁', min: 0, max: 18 },
];

interface PyramidTooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  fill?: string;
}

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
    const raw = person.education?.trim() || '未记录';
    const key = raw === '研究生' ? '硕士' : raw === '博士后' ? '博士' : raw;
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

function PyramidTooltip({ active, payload, label }: { active?: boolean; payload?: PyramidTooltipPayloadItem[]; label?: string | number }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#5B6FA5] bg-[#10182F] px-3 py-2 text-xs text-white shadow-2xl">
      {label ? <div className="mb-1 font-semibold text-[#DCE6FF]">{label}</div> : null}
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={`${item.name}-${item.value}`} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill || '#4E86DF' }} />
            <span className="text-[#AFC0E8]">{item.name}</span>
            <span className="font-semibold text-white">{Math.abs(Number(item.value ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
      const male = bucketPeople.filter((person) => person.gender === '男').length;
      const female = bucketPeople.filter((person) => person.gender === '女').length;
      return {
        name: bucket.name,
        男: -male,
        女: female,
      };
    });
    const max = Math.max(1, ...rows.flatMap((row) => [Math.abs(row.男), row.女]));
    const axisMax = Math.ceil(max / 10) * 10;
    return {
      rows,
      max: axisMax,
      ticks: [-axisMax, -axisMax / 2, 0, axisMax / 2, axisMax],
    };
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
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      <PageHeader
        eyebrow="DEMOGRAPHICS ANALYTICS"
        title="人口特征分析"
        description="快速识别年龄、学历与标签覆盖结构，辅助网格员判断重点人群服务优先级。"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className={PANEL_CLASS}>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-[var(--color-neutral-08)]">总人口</p>
            <p className="mt-2 text-2xl font-bold leading-none text-white">{dashboard?.totalPopulation ?? '--'}</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-[var(--color-neutral-08)]">老龄化比例</p>
            <p className="mt-2 text-2xl font-bold leading-none text-white">{elderlyRate}%</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-[var(--color-neutral-08)]">户籍 / 流动</p>
            <p className="mt-2 text-2xl font-bold leading-none text-white">
              {dashboard ? `${dashboard.mobilePeopleStats.registered} / ${dashboard.mobilePeopleStats.floating}` : '--'}
            </p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-[var(--color-neutral-08)]">标签覆盖率</p>
            <p className="mt-2 text-2xl font-bold leading-none text-white">{taggedCoverage}%</p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/10 text-destructive">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Card className={PANEL_CLASS}>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">年龄性别人口金字塔</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-sm text-[var(--color-neutral-08)]">正在汇总年龄性别结构...</div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pyramid.rows} layout="vertical" margin={{ top: 8, right: 24, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_GRID_STROKE} />
                  <XAxis
                    type="number"
                    domain={[-pyramid.max, pyramid.max]}
                    ticks={pyramid.ticks}
                    axisLine={false}
                    tickLine={false}
                    tick={AXIS_TICK}
                    tickFormatter={(value) => String(Math.abs(Number(value)))}
                    allowDecimals={false}
                  />
                  <YAxis dataKey="name" type="category" width={72} axisLine={false} tickLine={false} tick={{ ...AXIS_TICK, fontWeight: 'bold' }} />
                  <Tooltip content={<PyramidTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  <Bar dataKey="男" fill="#4E86DF" name="男" radius={[4, 0, 0, 4]} barSize={24} />
                  <Bar dataKey="女" fill="#F97316" name="女" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">人口类型</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-[var(--color-neutral-08)]">正在汇总人口类型...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
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

        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">教育程度</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-[var(--color-neutral-08)]">正在汇总教育结构...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
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

        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-white">民族分布</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-[var(--color-neutral-08)]">正在汇总民族分布...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
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

      <Card className={PANEL_CLASS}>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">重点标签热度</CardTitle>
        </CardHeader>
          <CardContent>
            <div className="h-[280px]">
            {loading ? (
              <div className="py-10 text-sm text-[var(--color-neutral-08)]">正在汇总标签热度...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTags}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
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
        </CardContent>
      </Card>
    </div>
  );
}
