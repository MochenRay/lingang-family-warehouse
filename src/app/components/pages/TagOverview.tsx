import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, ShieldAlert, Sparkles, Tag, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { tagRepository, type ManagedTagSummary, type TagSnapshot } from '../../services/repositories/tagRepository';

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-full bg-muted p-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function riskBadgeVariant(risk: ManagedTagSummary['riskLevel']) {
  if (risk === 'High') {
    return 'destructive' as const;
  }
  if (risk === 'Medium') {
    return 'secondary' as const;
  }
  return 'outline' as const;
}

export function TagOverview() {
  const [snapshot, setSnapshot] = useState<TagSnapshot | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const nextSnapshot = await tagRepository.getSnapshot();
        if (cancelled) {
          return;
        }
        setSnapshot(nextSnapshot);
        setSelectedTagId((current) => current || nextSnapshot.tags[0]?.id || '');
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '标签数据加载失败');
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

  const selectedTag = useMemo(
    () => snapshot?.tags.find((tag) => tag.id === selectedTagId),
    [selectedTagId, snapshot],
  );

  const coveredPeople = useMemo(() => {
    if (!snapshot || !selectedTag) {
      return [];
    }

    return snapshot.people
      .filter((record) => record.matchedTags.some((match) => match.tagId === selectedTag.id))
      .map((record) => {
        const match = record.matchedTags.find((item) => item.tagId === selectedTag.id);
        return {
          id: record.person.id,
          name: record.person.name,
          age: record.person.age,
          address: record.person.address,
          risk: record.person.risk,
          lastVisitAt: record.lastVisitAt ?? '暂无走访',
          reasons: match?.reasons ?? [],
        };
      });
  }, [selectedTag, snapshot]);

  const totalAssignments = useMemo(
    () => snapshot?.tags.reduce((sum, tag) => sum + tag.coverageCount, 0) ?? 0,
    [snapshot],
  );

  const coverageRate = useMemo(() => {
    if (!snapshot || snapshot.totalPeople === 0) {
      return '0.0';
    }
    const covered = snapshot.people.filter((record) => record.matchedTags.length > 0).length;
    return ((covered / snapshot.totalPeople) * 100).toFixed(1);
  }, [snapshot]);

  const ruleTags = snapshot?.tags.filter((tag) => tag.type === '规则标签') ?? [];
  const smartTags = snapshot?.tags.filter((tag) => tag.type === '智能标签') ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">标签管理</h2>
          <p className="text-muted-foreground">
            当前只保留首批 5 类固定标签规则，全部基于人物、房屋、走访、矛盾对象实时派生，不再维护独立标签目录。
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setSnapshot(null);
            setSelectedTagId('');
            setLoading(true);
            setError('');
            void tagRepository.getSnapshot().then((nextSnapshot) => {
              setSnapshot(nextSnapshot);
              setSelectedTagId(nextSnapshot.tags[0]?.id ?? '');
              setLoading(false);
            }).catch((loadError) => {
              setError(loadError instanceof Error ? loadError.message : '标签数据加载失败');
              setLoading(false);
            });
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          同步标签统计
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="标签总数" value={snapshot?.tags.length ?? '--'} detail="当前阶段固定首批规则，不扩写引擎" icon={Tag} />
        <MetricCard title="规则标签" value={ruleTags.length} detail="基于明确阈值和对象字段判定" icon={ShieldAlert} />
        <MetricCard title="智能标签" value={smartTags.length} detail="基于走访/矛盾/时效推导" icon={Sparkles} />
        <MetricCard title="覆盖率" value={`${coverageRate}%`} detail={`总命中 ${totalAssignments} 次`} icon={Users} />
      </div>

      {error ? (
        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 p-6 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">标签数据加载失败</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>标签目录</CardTitle>
            <CardDescription>覆盖人数是派生值，不再由页面各自维护。</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !snapshot ? (
              <div className="py-10 text-sm text-muted-foreground">正在同步标签视图...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标签</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>覆盖人数</TableHead>
                    <TableHead>风险</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.tags.map((tag) => (
                    <TableRow
                      key={tag.id}
                      className={tag.id === selectedTagId ? 'bg-muted/50' : ''}
                      onClick={() => setSelectedTagId(tag.id)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{tag.name}</div>
                          <div className="text-xs text-muted-foreground">{tag.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tag.type === '规则标签' ? 'default' : 'secondary'}>{tag.type}</Badge>
                      </TableCell>
                      <TableCell>{tag.category}</TableCell>
                      <TableCell>{tag.coverageCount}</TableCell>
                      <TableCell>
                        <Badge variant={riskBadgeVariant(tag.riskLevel)}>{tag.riskLevel}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedTag?.name ?? '标签详情'}</CardTitle>
            <CardDescription>
              {selectedTag?.type ?? '请选择一个标签'} {selectedTag ? `· ${selectedTag.category}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedTag ? (
              <div className="py-10 text-sm text-muted-foreground">请选择左侧标签查看覆盖对象。</div>
            ) : (
              <>
                <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selectedTag.type === '规则标签' ? 'default' : 'secondary'}>{selectedTag.type}</Badge>
                    <Badge variant={riskBadgeVariant(selectedTag.riskLevel)}>{selectedTag.riskLevel}</Badge>
                    <Badge variant="outline">{selectedTag.coverageCount} 人</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedTag.description}</p>
                  {selectedTag.rules?.length ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">规则条件</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTag.rules.map((rule) => (
                          <Badge key={rule} variant="outline">
                            {rule}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selectedTag.judgmentCriteria ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">推导逻辑</p>
                      <p className="text-sm">{selectedTag.judgmentCriteria}</p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">覆盖对象</p>
                  <div className="space-y-3">
                    {coveredPeople.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        当前没有命中对象。
                      </div>
                    ) : (
                      coveredPeople.slice(0, 8).map((person) => (
                        <div key={person.id} className="rounded-lg border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{person.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {person.age} 岁 · {person.address}
                              </p>
                            </div>
                            <Badge variant={riskBadgeVariant(person.risk)}>{person.risk}</Badge>
                          </div>
                          <div className="mt-3 space-y-1">
                            <p className="text-xs text-muted-foreground">最近走访：{person.lastVisitAt}</p>
                            <div className="flex flex-wrap gap-2">
                              {person.reasons.map((reason) => (
                                <Badge key={reason} variant="outline">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
