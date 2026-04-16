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
import { tagRepository, type TagSnapshot } from '../../services/repositories/tagRepository';

const COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#f97316', '#dc2626', '#16a34a'];

export function PopulationTags() {
  const [snapshot, setSnapshot] = useState<TagSnapshot | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">标签分析画像</h2>
        <p className="text-muted-foreground">
          只分析当前第一批固定标签规则的真实命中结果，不再混用本地标签缓存和页面级快照。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">标签数量</p>
            <p className="mt-2 text-2xl font-bold">{snapshot?.tags.length ?? '--'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">覆盖率</p>
            <p className="mt-2 text-2xl font-bold">{coverageRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">规则标签命中</p>
            <p className="mt-2 text-2xl font-bold">
              {snapshot?.tags
                .filter((tag) => tag.type === '规则标签')
                .reduce((sum, tag) => sum + tag.coverageCount, 0) ?? '--'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">智能标签命中</p>
            <p className="mt-2 text-2xl font-bold">
              {snapshot?.tags
                .filter((tag) => tag.type === '智能标签')
                .reduce((sum, tag) => sum + tag.coverageCount, 0) ?? '--'}
            </p>
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
            <CardTitle>标签热度</CardTitle>
            <CardDescription>按真实命中人数排序。</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在计算标签热度...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTags}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {topTags.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>标签类型命中</CardTitle>
            <CardDescription>规则标签和智能标签共用同一套真对象来源。</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总类型分布...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeDistribution} dataKey="value" nameKey="name" outerRadius={110} label>
                    {typeDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>风险层级分布</CardTitle>
            <CardDescription>只统计当前至少命中一类标签的人群。</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">正在汇总风险分布...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>交叉分析</CardTitle>
            <CardDescription>选择多个标签，查看共同命中的对象。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  >
                    {tag.name}
                  </Button>
                );
              })}
            </div>

            {selectedTagIds.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                先选择 2 个以内的标签进行交叉分析。
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>当前组合：</span>
                  {selectedTagIds.map((tagId) => {
                    const tag = snapshot?.tags.find((item) => item.id === tagId);
                    return tag ? (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ) : null;
                  })}
                </div>

                <div className="space-y-3">
                  {selectedResults.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                      当前组合暂无共同命中对象。
                    </div>
                  ) : (
                    selectedResults.slice(0, 12).map((record) => (
                      <div key={record.person.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{record.person.name}</p>
                            <p className="text-sm text-muted-foreground">{record.person.address}</p>
                          </div>
                          <Badge variant="outline">{record.person.risk}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {record.matchedTags
                            .filter((match) => selectedTagIds.includes(match.tagId))
                            .map((match) => (
                              <Badge key={match.tagId} variant="secondary">
                                {match.tagName}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
