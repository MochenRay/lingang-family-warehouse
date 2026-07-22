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
import { StatCard } from '../patterns/StatCard';
import { EmptyState, ErrorState, LoadingState } from '../patterns/states';
import { PANEL_CLASS } from '../patterns/surfaces';
import { personRepository } from '../../services/repositories/personRepository';
import { statsRepository, type DashboardStatsResponse } from '../../services/repositories/statsRepository';
import { tagRepository, type TagSnapshot } from '../../services/repositories/tagRepository';
import type { Person } from '../../types/core';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { CHART_COLORS, CHART_GENDER_COLORS, CHART_GRID, CHART_GRID_PROPS, CHART_TICK } from '../../config/chartConfig';
import { PageHeader } from './PageHeader';

const PERSON_TYPE_ORDER: Person['type'][] = ['户籍', '流动', '留守', '境外'];
const EDUCATION_ORDER = ['学龄前', '未上学', '小学', '初中', '高中', '中专', '大专', '本科', '硕士', '博士', '其他', '未记录'];
// 桶边界与标签对齐后端 stats.py AGE_BUCKETS（60岁以上 = 61 起，36-60岁 含 60 岁）
const AGE_BUCKETS = [
  { name: '60岁以上', min: 61, max: 200 },
  { name: '36-60岁', min: 36, max: 60 },
  { name: '19-35岁', min: 19, max: 35 },
  { name: '0-18岁', min: 0, max: 18 },
];

interface PyramidRow {
  name: string;
  /** 负值（镜像布局用，不对用户展示） */
  male: number;
  /** 正值 */
  female: number;
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
      fill: CHART_COLORS[index % CHART_COLORS.length],
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
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

function buildEducationDistribution(people: Person[]) {
  const counts = new Map<string, number>();
  people.forEach((person) => {
    const raw = person.education?.trim() || '未记录';
    const key = raw === '研究生' ? '硕士' : raw === '博士后' ? '博士' : raw;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const used = new Set<string>(EDUCATION_ORDER);
  const ordered = EDUCATION_ORDER.map((name) => [name, counts.get(name) ?? 0] as const);
  const rest = Array.from(counts.entries())
    .filter(([name]) => !used.has(name))
    .sort((left, right) => left[0].localeCompare(right[0], 'zh-CN'));

  return [...ordered, ...rest].map(([name, value], index) => ({
    name,
    value,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

/**
 * 金字塔 tooltip：本地包装 DarkChartTooltip，展示值取绝对值。
 * 负值仅用于镜像布局（male 存负），不对用户展示。
 */
function PyramidTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string; fill?: string; dataKey?: string }>;
  label?: string | number;
}) {
  const absPayload = payload?.map((item) => ({ ...item, value: Math.abs(Number(item.value ?? 0)) }));
  return <DarkChartTooltip active={active} payload={absPayload} label={label} />;
}

/**
 * 人口金字塔（Recharts 镜像条形，全站首例负值法）：
 * male 负值 / female 正值 + 相同 stackId + stackOffset="sign" + 对称 domain，
 * 两性同一年龄行分别向左右延伸；X 轴刻度经 tickFormatter 取绝对值。
 */
function PopulationPyramid({ rows, axisMax }: { rows: PyramidRow[]; axisMax: number }) {
  const ticks = [-axisMax, -axisMax / 2, 0, axisMax / 2, axisMax];
  return (
    <div className="h-[260px]" data-testid="population-pyramid">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" stackOffset="sign" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          {/* 网格取向对齐同页 vertical chart（教育程度）既有约定 */}
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_GRID} />
          <XAxis
            type="number"
            domain={[-axisMax, axisMax]}
            ticks={ticks}
            tickFormatter={(value: number) => String(Math.abs(value))}
            axisLine={false}
            tickLine={false}
            tick={CHART_TICK}
            allowDecimals={false}
          />
          <YAxis dataKey="name" type="category" width={62} axisLine={false} tickLine={false} tick={CHART_TICK} interval={0} />
          <Tooltip content={<PyramidTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
          <Bar dataKey="male" name="男" stackId="gender" fill={CHART_GENDER_COLORS.male} radius={[6, 0, 0, 6]} barSize={18} />
          <Bar dataKey="female" name="女" stackId="gender" fill={CHART_GENDER_COLORS.female} radius={[0, 6, 6, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
      {/* 视觉隐藏数据表：金字塔数据的辅助技术可读副本 */}
      <table className="sr-only">
        <caption>年龄性别人口金字塔数据（单位：人）</caption>
        <thead>
          <tr>
            <th scope="col">年龄段</th>
            <th scope="col">男</th>
            <th scope="col">女</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">{row.name}</th>
              <td>{Math.abs(row.male)}</td>
              <td>{row.female}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
          // 无参调用走 fetchAllListPages 全量拉取（金字塔与老龄化比例共用同一全量列表）
          personRepository.getPeople(),
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
        male: -male,
        female,
      };
    });
    const max = Math.max(1, ...rows.flatMap((row) => [-row.male, row.female]));
    const axisMax = Math.max(10, Math.ceil(max / 10) * 10);
    return {
      rows,
      axisMax,
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
          fill: CHART_COLORS[index % CHART_COLORS.length],
        })),
    [tagSnapshot],
  );

  const elderlyRate = useMemo(() => {
    if (people.length === 0) {
      return '0.0';
    }
    // 与金字塔统一口径：61 岁及以上（对齐后端 stats.py AGE_BUCKETS）
    const elderly = people.filter((person) => person.age > 60).length;
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
    <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
      <PageHeader
        eyebrow="DEMOGRAPHICS ANALYTICS"
        title="人口特征分析"
        description="快速识别年龄、学历与标签覆盖结构，辅助网格员判断重点人群服务优先级。"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="总人口" value={dashboard?.totalPopulation ?? '--'} tone="brand" />
        <StatCard label="老龄化比例" value={`${elderlyRate}%`} tone="info" hint="61 岁及以上人口占比" />
        <StatCard
          label="户籍 / 流动"
          value={dashboard ? `${dashboard.mobilePeopleStats.registered} / ${dashboard.mobilePeopleStats.floating}` : '--'}
          tone="info"
        />
        <StatCard label="标签覆盖率" value={`${taggedCoverage}%`} tone="success" />
      </div>

      {error ? <ErrorState description={error} /> : null}

      <Card className={PANEL_CLASS}>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">年龄性别人口金字塔</CardTitle>
          <div className="flex items-center gap-4 text-xs text-[var(--color-neutral-08)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: CHART_GENDER_COLORS.male }} />
              男
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: CHART_GENDER_COLORS.female }} />
              女
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState title="正在汇总年龄性别结构..." />
          ) : people.length === 0 ? (
            <EmptyState title="暂无人口数据" description="未获取到人口记录，无法汇总年龄性别结构。" />
          ) : (
            <PopulationPyramid rows={pyramid.rows} axisMax={pyramid.axisMax} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className={PANEL_CLASS}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">人口类型</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <LoadingState title="正在汇总人口类型..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid {...CHART_GRID_PROPS} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CHART_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} allowDecimals={false} />
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
            <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">教育程度</CardTitle>
          </CardHeader>
          <CardContent className="h-[340px]">
            {loading ? (
              <LoadingState title="正在汇总教育结构..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educationData} layout="vertical" margin={{ top: 4, right: 16, left: 18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_GRID} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={CHART_TICK} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={62} axisLine={false} tickLine={false} tick={CHART_TICK} interval={0} />
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  <Bar dataKey="value" name="人数" radius={[0, 6, 6, 0]} barSize={14}>
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
            <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">民族分布</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loading ? (
              <LoadingState title="正在汇总民族分布..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nationData}>
                  <CartesianGrid {...CHART_GRID_PROPS} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CHART_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} allowDecimals={false} />
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
          <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">重点标签热度</CardTitle>
        </CardHeader>
          <CardContent>
            <div className="h-[280px]">
            {loading ? (
              <LoadingState title="正在汇总标签热度..." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTags}>
                  <CartesianGrid {...CHART_GRID_PROPS} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CHART_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} allowDecimals={false} />
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
