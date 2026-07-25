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
import { Percent, Sparkles, Tag, Tags } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { CHART_COLORS, CHART_GRID_PROPS, CHART_RISK_COLORS, CHART_TICK } from '../../config/chartConfig';
import { tagRepository, type TagSnapshot } from '../../services/repositories/tagRepository';
import { StatCard } from '../patterns/StatCard';
import { StatusBadge, type StatusTone } from '../patterns/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../patterns/states';
import { PANEL_CLASS } from '../patterns/surfaces';
import { DetailDialogShell } from '../patterns/DetailDialog';
import { PageHeader } from './PageHeader';

const MUTED_TEXT = 'text-[var(--color-neutral-08)]';
const RISK_LEVEL_COLORS: Record<string, string> = {
  High: CHART_RISK_COLORS.high,
  Medium: CHART_RISK_COLORS.medium,
  Low: CHART_RISK_COLORS.low,
};
const RISK_BADGE_TONE: Record<string, StatusTone> = {
  High: 'error',
  Medium: 'warning',
  Low: 'success',
};

type TaggedPersonRecord = TagSnapshot['people'][number];

function getHouseLabel(record: TaggedPersonRecord) {
  if (record.house) {
    return `${record.house.communityName} ${record.house.building}${record.house.unit}${record.house.room}`;
  }
  return record.person.address || '未关联房屋';
}

function PersonMatchCard({ record, selectedTagIds }: { record: TaggedPersonRecord; selectedTagIds: string[] }) {
  const selectedMatches = record.matchedTags.filter((match) => selectedTagIds.includes(match.tagId));
  const initial = record.person.name.slice(0, 1) || '?';

  return (
    <div className={`${PANEL_CLASS} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[linear-gradient(135deg,var(--color-brand-primary-hover),var(--color-accent-purple))] text-sm font-semibold text-[var(--color-neutral-11)]">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--color-neutral-11)]">{record.person.name}</p>
            <p className={`text-xs ${MUTED_TEXT}`}>
              {record.person.gender || '性别未录'} / {record.person.age ?? '--'}岁 / {record.person.type}
            </p>
          </div>
        </div>
        <StatusBadge tone={RISK_BADGE_TONE[record.person.risk] ?? 'neutral'}>
          {record.person.risk}
        </StatusBadge>
      </div>

      <p className={`mt-2 break-words text-xs leading-5 ${MUTED_TEXT}`}>{record.person.address || '地址未登记'}</p>

      <div className={`mt-2 space-y-1 text-xs ${MUTED_TEXT}`}>
        <p className="break-words">关联房屋：<span className="text-[var(--color-neutral-10)]">{getHouseLabel(record)}</span></p>
        <p>最近走访：<span className="text-[var(--color-neutral-10)]">{record.lastVisitAt || '暂无记录'}</span></p>
        <p>纠纷关联：<span className="text-[var(--color-neutral-10)]">{record.totalConflictCount} 起 / 调解中 {record.activeConflictCount} 起</span></p>
      </div>

      {selectedMatches.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedMatches.map((match) => (
            <Badge key={match.tagId} variant="secondary">{match.tagName}</Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PopulationTags() {
  const [snapshot, setSnapshot] = useState<TagSnapshot | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [residentDialogOpen, setResidentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const nextSnapshot = await tagRepository.getSnapshot();
        if (!cancelled) {
          setSnapshot(nextSnapshot);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '标签分析加载失败');
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

  const topTags = useMemo(
    () =>
      (snapshot?.tags ?? [])
        .slice()
        .sort((left, right) => right.coverageCount - left.coverageCount)
        .map((tag, index) => ({
          name: tag.name,
          value: tag.coverageCount,
          fill: CHART_COLORS[index % CHART_COLORS.length],
        })),
    [snapshot],
  );

  const typeDistribution = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const typeMap = new Map<string, number>();
    snapshot.tags.forEach((tag) => {
      typeMap.set(tag.type, (typeMap.get(tag.type) ?? 0) + tag.coverageCount);
    });

    return Array.from(typeMap.entries()).map(([name, value], index) => ({
      name,
      value,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [snapshot]);

  const riskDistribution = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const riskMap = new Map<string, number>();
    snapshot.people
      .filter((record) => record.matchedTags.length > 0)
      .forEach((record) => {
        riskMap.set(record.person.risk, (riskMap.get(record.person.risk) ?? 0) + 1);
      });

    return ['High', 'Medium', 'Low'].map((risk) => ({
      name: risk,
      value: riskMap.get(risk) ?? 0,
      fill: RISK_LEVEL_COLORS[risk],
    }));
  }, [snapshot]);

  const selectedResults = useMemo(() => {
    if (!snapshot || selectedTagIds.length === 0) {
      return [];
    }

    return snapshot.people.filter((record) =>
      selectedTagIds.every((tagId) => record.matchedTags.some((match) => match.tagId === tagId)),
    );
  }, [selectedTagIds, snapshot]);

  const selectedTags = useMemo(
    () =>
      selectedTagIds
        .map((tagId) => snapshot?.tags.find((item) => item.id === tagId))
        .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
    [selectedTagIds, snapshot],
  );

  const coverageRate = useMemo(() => {
    if (!snapshot || snapshot.totalPeople === 0) {
      return '0.0';
    }
    const covered = snapshot.people.filter((record) => record.matchedTags.length > 0).length;
    return ((covered / snapshot.totalPeople) * 100).toFixed(1);
  }, [snapshot]);

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((item) => item !== tagId) : [...current, tagId],
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TAGS ANALYTICS"
        title="标签分析画像"
        description="汇总重点标签的覆盖情况、风险分布和共同命中人群，辅助识别优先走访与持续关注对象。"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="标签数量" value={snapshot?.tags.length ?? '--'} icon={Tags} tone="brand" />
        <StatCard label="覆盖率" value={`${coverageRate}%`} icon={Percent} tone="success" />
        <StatCard
          label="规则标签命中"
          value={
            snapshot?.tags
              .filter((tag) => tag.type === '规则标签')
              .reduce((sum, tag) => sum + tag.coverageCount, 0) ?? '--'
          }
          icon={Tag}
          tone="brand"
        />
        <StatCard
          label="智能标签命中"
          value={
            snapshot?.tags
              .filter((tag) => tag.type === '智能标签')
              .reduce((sum, tag) => sum + tag.coverageCount, 0) ?? '--'
          }
          icon={Sparkles}
          tone="info"
        />
      </div>

      {error ? <ErrorState description={error} /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className={PANEL_CLASS}>
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">标签热度</CardTitle>
            <CardDescription className={MUTED_TEXT}>按标签覆盖人数排序。</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] px-5 pb-5">
            {loading ? (
              <LoadingState title="正在计算标签热度..." className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTags} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid {...CHART_GRID_PROPS} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CHART_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} allowDecimals={false} />
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  <Bar dataKey="value" name="命中人数" radius={[8, 8, 0, 0]}>
                    {topTags.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">标签类型命中</CardTitle>
            <CardDescription className={MUTED_TEXT}>对比规则标签与智能标签的覆盖规模。</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] px-5 pb-5">
            {loading ? (
              <LoadingState title="正在汇总类型分布..." className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeDistribution} dataKey="value" nameKey="name" outerRadius={104} label>
                    {typeDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className={PANEL_CLASS}>
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">风险层级分布</CardTitle>
            <CardDescription className={MUTED_TEXT}>只统计当前至少命中一类标签的人群。</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] px-5 pb-5">
            {loading ? (
              <LoadingState title="正在汇总风险分布..." className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid {...CHART_GRID_PROPS} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CHART_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} allowDecimals={false} />
                  <Tooltip content={<DarkChartTooltip />} cursor={DARK_TOOLTIP_CURSOR} />
                  <Bar dataKey="value" name="人数" radius={[8, 8, 0, 0]}>
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className={PANEL_CLASS}>
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">交叉分析</CardTitle>
            <CardDescription className={MUTED_TEXT}>选择一个或多个标签，查看共同命中的对象数量。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              {(snapshot?.tags ?? []).map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleTag(tag.id)}
                    className={active ? '' : 'border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)]'}
                  >
                    {tag.name}
                  </Button>
                );
              })}
            </div>

            {selectedTagIds.length === 0 ? (
              <EmptyState title="先选择标签进行交叉分析。" />
            ) : (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 text-sm ${MUTED_TEXT}`}>
                  <span>当前组合：</span>
                  {selectedTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>

                {selectedResults.length === 0 ? (
                  <EmptyState title="当前组合暂无共同命中对象。" />
                ) : (
                  <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-[var(--color-neutral-08)]">命中居民</p>
                      <p className="mt-1 text-2xl font-semibold text-[var(--color-neutral-11)]">{selectedResults.length} 人</p>
                    </div>
                    <Button type="button" onClick={() => setResidentDialogOpen(true)}>
                      查看详情
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DetailDialogShell
        open={residentDialogOpen}
        onOpenChange={setResidentDialogOpen}
        maxWidth="5xl"
        contentLabel="命中居民详情"
        title={`命中居民详情 · ${selectedResults.length} 人`}
        description={`当前组合共同命中的居民：${selectedTags.map((tag) => tag.name).join('、') || '未选择标签'}`}
      >
        {selectedResults.length === 0 ? (
          <EmptyState title="当前组合暂无共同命中对象。" />
        ) : (
          <div data-matched-residents-grid className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {selectedResults.map((record) => (
              <PersonMatchCard key={record.person.id} record={record} selectedTagIds={selectedTagIds} />
            ))}
          </div>
        )}
      </DetailDialogShell>
    </div>
  );
}
