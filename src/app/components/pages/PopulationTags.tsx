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
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DARK_TOOLTIP_CURSOR, DarkChartTooltip } from '../statistics/DarkChartTooltip';
import { tagRepository, type TagSnapshot } from '../../services/repositories/tagRepository';
import { PageHeader } from './PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

const COLORS = ['#4E86DF', '#8B5CF6', '#2AA3CF', '#D6730D', '#D52132', '#19B172'];
const PANEL_CLASS = 'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const MUTED_TEXT = 'text-[var(--color-neutral-08)]';
const GRID_STROKE = '#3d4663';
const AXIS_TICK = { fill: '#6b7599', fontSize: 12 };

type TaggedPersonRecord = TagSnapshot['people'][number];

function getRiskClass(risk: string) {
  if (risk === 'High') {
    return 'border-[#FCA5A5]/70 bg-[#7F1D1D]/35 text-[#FCA5A5]';
  }
  if (risk === 'Medium') {
    return 'border-[#FDBA74]/70 bg-[#7C2D12]/35 text-[#FDBA74]';
  }
  return 'border-[#86EFAC]/70 bg-[#064E3B]/35 text-[#86EFAC]';
}

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
    <div className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-[linear-gradient(135deg,#4E86DF,#8B5CF6)] text-base font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-white">{record.person.name}</p>
              <span className={`text-sm ${MUTED_TEXT}`}>
                {record.person.gender || '性别未录'} / {record.person.age ?? '--'}岁 / {record.person.type}
              </span>
            </div>
            <p className={`mt-1 text-sm ${MUTED_TEXT}`}>{record.person.address || '地址未登记'}</p>
          </div>
        </div>
        <Badge variant="outline" className={getRiskClass(record.person.risk)}>
          {record.person.risk}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-[var(--color-neutral-08)] sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded border border-[var(--color-neutral-03)] bg-[rgba(10,18,36,0.36)] px-3 py-2">
          <div>联系方式</div>
          <div className="mt-1 truncate font-medium text-[var(--color-neutral-11)]">{record.person.phone || '未登记'}</div>
        </div>
        <div className="rounded border border-[var(--color-neutral-03)] bg-[rgba(10,18,36,0.36)] px-3 py-2">
          <div>关联房屋</div>
          <div className="mt-1 truncate font-medium text-[var(--color-neutral-11)]">{getHouseLabel(record)}</div>
        </div>
        <div className="rounded border border-[var(--color-neutral-03)] bg-[rgba(10,18,36,0.36)] px-3 py-2">
          <div>最近走访</div>
          <div className="mt-1 truncate font-medium text-[var(--color-neutral-11)]">{record.lastVisitAt || '暂无记录'}</div>
        </div>
        <div className="rounded border border-[var(--color-neutral-03)] bg-[rgba(10,18,36,0.36)] px-3 py-2">
          <div>纠纷关联</div>
          <div className="mt-1 font-medium text-[var(--color-neutral-11)]">
            {record.totalConflictCount} 起 / 调解中 {record.activeConflictCount} 起
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {selectedMatches.map((match) => (
          <div key={match.tagId} className="rounded border border-[var(--color-neutral-03)] bg-[rgba(78,134,223,0.08)] px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{match.tagName}</Badge>
              <span className={`text-xs ${MUTED_TEXT}`}>命中原因</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--color-neutral-10)]">
              {match.reasons.length ? match.reasons.join('；') : '规则命中，暂无详细原因。'}
            </p>
          </div>
        ))}
      </div>
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
          fill: COLORS[index % COLORS.length],
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
      fill: COLORS[index % COLORS.length],
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

    return ['High', 'Medium', 'Low'].map((risk, index) => ({
      name: risk,
      value: riskMap.get(risk) ?? 0,
      fill: COLORS[index % COLORS.length],
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
        description="只分析当前第一批固定标签规则的真实命中结果，不再混用本地标签缓存和页面级快照。"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Card className={PANEL_CLASS}>
          <CardContent className="p-4">
            <p className={`text-xs ${MUTED_TEXT}`}>标签数量</p>
            <p className="mt-2 text-2xl font-semibold text-white">{snapshot?.tags.length ?? '--'}</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardContent className="p-4">
            <p className={`text-xs ${MUTED_TEXT}`}>覆盖率</p>
            <p className="mt-2 text-2xl font-semibold text-[#19B172]">{coverageRate}%</p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardContent className="p-4">
            <p className={`text-xs ${MUTED_TEXT}`}>规则标签命中</p>
            <p className="mt-2 text-2xl font-semibold text-[#4E86DF]">
              {snapshot?.tags
                .filter((tag) => tag.type === '规则标签')
                .reduce((sum, tag) => sum + tag.coverageCount, 0) ?? '--'}
            </p>
          </CardContent>
        </Card>
        <Card className={PANEL_CLASS}>
          <CardContent className="p-4">
            <p className={`text-xs ${MUTED_TEXT}`}>智能标签命中</p>
            <p className="mt-2 text-2xl font-semibold text-[#8B5CF6]">
              {snapshot?.tags
                .filter((tag) => tag.type === '智能标签')
                .reduce((sum, tag) => sum + tag.coverageCount, 0) ?? '--'}
            </p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/10 text-[var(--color-neutral-10)] shadow-none">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className={PANEL_CLASS}>
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-base font-semibold text-white">标签热度</CardTitle>
            <CardDescription className={MUTED_TEXT}>按真实命中人数排序。</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] px-5 pb-5">
            {loading ? (
              <div className={`flex h-full items-center justify-center text-sm ${MUTED_TEXT}`}>正在计算标签热度...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTags} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
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
            <CardTitle className="text-base font-semibold text-white">标签类型命中</CardTitle>
            <CardDescription className={MUTED_TEXT}>规则标签和智能标签共用同一套真对象来源。</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] px-5 pb-5">
            {loading ? (
              <div className={`flex h-full items-center justify-center text-sm ${MUTED_TEXT}`}>正在汇总类型分布...</div>
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

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className={PANEL_CLASS}>
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-base font-semibold text-white">风险层级分布</CardTitle>
            <CardDescription className={MUTED_TEXT}>只统计当前至少命中一类标签的人群。</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] px-5 pb-5">
            {loading ? (
              <div className={`flex h-full items-center justify-center text-sm ${MUTED_TEXT}`}>正在汇总风险分布...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                  <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
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
            <CardTitle className="text-base font-semibold text-white">交叉分析</CardTitle>
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
              <div className={`rounded-lg border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-6 text-sm ${MUTED_TEXT}`}>
                先选择标签进行交叉分析。
              </div>
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
                  <div className={`rounded-lg border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-6 text-sm ${MUTED_TEXT}`}>
                    当前组合暂无共同命中对象。
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-[var(--color-neutral-08)]">命中居民</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{selectedResults.length} 人</p>
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

      <Dialog open={residentDialogOpen} onOpenChange={setResidentDialogOpen}>
        <DialogContent className="max-h-[86vh] max-w-5xl overflow-hidden border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-neutral-11)]">命中居民详情</DialogTitle>
            <DialogDescription className="text-[var(--color-neutral-08)]">
              当前组合共命中 {selectedResults.length} 人：{selectedTags.map((tag) => tag.name).join('、')}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
            {selectedResults.length === 0 ? (
              <div className={`rounded-lg border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-6 text-sm ${MUTED_TEXT}`}>
                当前组合暂无共同命中对象。
              </div>
            ) : (
              selectedResults.map((record) => (
                <PersonMatchCard key={record.person.id} record={record} selectedTagIds={selectedTagIds} />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
