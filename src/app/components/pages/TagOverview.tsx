import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, ShieldAlert, Sparkles, Tag, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { tagRepository, type ManagedTagSummary, type TagSnapshot } from '../../services/repositories/tagRepository';
import { PageHeader } from './PageHeader';

const SURFACE_CLASS =
  'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const CHIP_BASE_CLASS = 'border px-2 py-0.5 text-[11px] font-medium';

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
    <Card className={`${SURFACE_CLASS} overflow-hidden`}>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className={`text-xs font-medium ${MUTED_TEXT_CLASS}`}>{title}</p>
          <p className="mt-2 text-2xl font-semibold leading-none text-white">{value}</p>
          <p className={`mt-2 text-xs leading-5 ${MUTED_TEXT_CLASS}`}>{detail}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#2761CB]/15 ring-1 ring-[#2761CB]/30">
          <Icon className="h-5 w-5 text-[#4E86DF]" />
        </div>
      </CardContent>
    </Card>
  );
}

function getRiskBadgeClass(risk: ManagedTagSummary['riskLevel']) {
  if (risk === 'High') {
    return `${CHIP_BASE_CLASS} border-[#D52132]/45 bg-[#D52132]/15 text-[#FCA5A5]`;
  }
  if (risk === 'Medium') {
    return `${CHIP_BASE_CLASS} border-[#D6730D]/45 bg-[#D6730D]/15 text-[#FDBA74]`;
  }
  return `${CHIP_BASE_CLASS} border-[#19B172]/45 bg-[#19B172]/15 text-[#6EE7B7]`;
}

function getTagTypeClass(type: ManagedTagSummary['type']) {
  if (type === '规则标签') {
    return `${CHIP_BASE_CLASS} border-[#4E86DF]/45 bg-[#2761CB]/15 text-[#9FC4FF]`;
  }
  return `${CHIP_BASE_CLASS} border-[#8B3BCC]/45 bg-[#8B3BCC]/15 text-[#D8B4FE]`;
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
    <div className="space-y-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      <PageHeader
        eyebrow="TAG LEDGER"
        title="标签管理"
        description="当前只保留首批 5 类固定标签规则，全部基于人物、房屋、走访、矛盾对象实时派生，不再维护独立标签目录。"
        actions={
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
            className="gap-2 border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[#4E86DF]/12 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            同步标签统计
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard title="标签总数" value={snapshot?.tags.length ?? '--'} detail="当前阶段固定首批规则，不扩写引擎" icon={Tag} />
        <MetricCard title="规则标签" value={ruleTags.length} detail="基于明确阈值和对象字段判定" icon={ShieldAlert} />
        <MetricCard title="智能标签" value={smartTags.length} detail="基于走访/矛盾/时效推导" icon={Sparkles} />
        <MetricCard title="覆盖率" value={`${coverageRate}%`} detail={`总命中 ${totalAssignments} 次`} icon={Users} />
      </div>

      {error ? (
        <Card className="rounded-lg border border-[#D52132]/50 bg-[#D52132]/10 shadow-none">
          <CardContent className="flex items-center gap-3 p-4 text-[#FCA5A5]">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium text-[#FCA5A5]">标签数据加载失败</p>
              <p className="text-sm text-[#FECACA]">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className={SURFACE_CLASS}>
          <CardHeader className="border-b border-[var(--color-neutral-03)] px-4 py-3">
            <CardTitle className="text-base font-semibold text-white">标签目录</CardTitle>
            <CardDescription className={`text-xs ${MUTED_TEXT_CLASS}`}>覆盖人数是派生值，不再由页面各自维护。</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading || !snapshot ? (
              <div className={`px-4 py-10 text-sm ${MUTED_TEXT_CLASS}`}>正在同步标签视图...</div>
            ) : (
              <Table className="min-w-[780px]">
                <TableHeader>
                  <TableRow className="bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                    <TableHead className="min-w-[260px] whitespace-nowrap">标签</TableHead>
                    <TableHead className="whitespace-nowrap">类型</TableHead>
                    <TableHead className="whitespace-nowrap">分类</TableHead>
                    <TableHead className="whitespace-nowrap text-right">覆盖人数</TableHead>
                    <TableHead className="whitespace-nowrap">风险</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.tags.map((tag) => (
                    <TableRow
                      key={tag.id}
                      className={`cursor-pointer ${tag.id === selectedTagId ? 'bg-[#2761CB]/12 hover:bg-[#2761CB]/16' : 'hover:bg-[#2761CB]/8'}`}
                      onClick={() => setSelectedTagId(tag.id)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-white">{tag.name}</div>
                          <div className={`max-w-[420px] text-xs leading-5 ${MUTED_TEXT_CLASS}`}>{tag.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTagTypeClass(tag.type)}>{tag.type}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[var(--color-neutral-10)]">{tag.category}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-white">{tag.coverageCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRiskBadgeClass(tag.riskLevel)}>{tag.riskLevel}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className={SURFACE_CLASS}>
          <CardHeader className="border-b border-[var(--color-neutral-03)] px-4 py-3">
            <CardTitle className="text-base font-semibold text-white">{selectedTag?.name ?? '标签详情'}</CardTitle>
            <CardDescription className={`text-xs ${MUTED_TEXT_CLASS}`}>
              {selectedTag?.type ?? '请选择一个标签'} {selectedTag ? `· ${selectedTag.category}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {!selectedTag ? (
              <div className={`py-10 text-sm ${MUTED_TEXT_CLASS}`}>请选择左侧标签查看覆盖对象。</div>
            ) : (
              <>
                <div className="space-y-3 rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={getTagTypeClass(selectedTag.type)}>{selectedTag.type}</Badge>
                    <Badge variant="outline" className={getRiskBadgeClass(selectedTag.riskLevel)}>{selectedTag.riskLevel}</Badge>
                    <Badge variant="outline" className={`${CHIP_BASE_CLASS} border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)]`}>
                      {selectedTag.coverageCount} 人
                    </Badge>
                  </div>
                  <p className={`text-sm leading-6 ${MUTED_TEXT_CLASS}`}>{selectedTag.description}</p>
                  {selectedTag.rules?.length ? (
                    <div className="space-y-1">
                      <p className={`text-xs font-medium ${MUTED_TEXT_CLASS}`}>规则条件</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTag.rules.map((rule) => (
                          <Badge
                            key={rule}
                            variant="outline"
                            className={`${CHIP_BASE_CLASS} border-[#4E86DF]/35 bg-[#2761CB]/10 text-[#9FC4FF]`}
                          >
                            {rule}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selectedTag.judgmentCriteria ? (
                    <div className="space-y-1">
                      <p className={`text-xs font-medium ${MUTED_TEXT_CLASS}`}>推导逻辑</p>
                      <p className="text-sm leading-6 text-[var(--color-neutral-10)]">{selectedTag.judgmentCriteria}</p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">覆盖对象</p>
                  <div className="space-y-3">
                    {coveredPeople.length === 0 ? (
                      <div className={`rounded-lg border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-4 text-sm ${MUTED_TEXT_CLASS}`}>
                        当前没有命中对象。
                      </div>
                    ) : (
                      coveredPeople.slice(0, 8).map((person) => (
                        <div key={person.id} className="rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-white">{person.name}</p>
                              <p className={`text-sm leading-6 ${MUTED_TEXT_CLASS}`}>
                                {person.age} 岁 · {person.address}
                              </p>
                            </div>
                            <Badge variant="outline" className={getRiskBadgeClass(person.risk)}>{person.risk}</Badge>
                          </div>
                          <div className="mt-3 space-y-1">
                            <p className={`text-xs ${MUTED_TEXT_CLASS}`}>最近走访：{person.lastVisitAt}</p>
                            <div className="flex flex-wrap gap-2">
                              {person.reasons.map((reason) => (
                                <Badge
                                  key={reason}
                                  variant="outline"
                                  className={`${CHIP_BASE_CLASS} border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)]`}
                                >
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
