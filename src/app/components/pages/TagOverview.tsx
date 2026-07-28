import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Eye, RefreshCw, ShieldAlert, Sparkles, Tag, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { tagRepository, type ManagedTagSummary, type TagSnapshot } from '../../services/repositories/tagRepository';
import { StatCard } from '../patterns/StatCard';
import { StatusBadge, type StatusTone } from '../patterns/StatusBadge';
import { DataTableBody } from '../patterns/DataTableShell';
import { PANEL_CLASS } from '../patterns/surfaces';
import { DetailDialogShell, DetailSection } from '../patterns/DetailDialog';
import { PageHeader } from './PageHeader';

const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const CHIP_BASE_CLASS = 'border px-2 py-0.5 text-[11px] font-medium';

const RISK_BADGE_TONE: Record<string, StatusTone> = {
  High: 'error',
  Medium: 'warning',
  Low: 'success',
};

function getTagTypeClass(type: ManagedTagSummary['type']) {
  if (type === '规则标签') {
    return `${CHIP_BASE_CLASS} border-[var(--color-brand-primary-hover)]/45 bg-[var(--color-brand-primary)]/15 text-[var(--color-status-info-text)]`;
  }
  return `${CHIP_BASE_CLASS} border-[var(--color-accent-purple)]/45 bg-[var(--color-accent-purple)]/15 text-[var(--color-accent-purple-text)]`;
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
    <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
      <PageHeader
        eyebrow="TAG LEDGER"
        title="标签管理"
        description="统一查看重点标签的覆盖范围、风险等级和命中对象，便于快速定位需要跟进的人群。"
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
                setLoading(false);
              }).catch((loadError) => {
                setError(loadError instanceof Error ? loadError.message : '标签数据加载失败');
                setLoading(false);
              });
            }}
            className="gap-2 border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-brand-primary-hover)]/12 hover:text-[var(--color-neutral-11)]"
          >
            <RefreshCw className="h-4 w-4" />
            同步标签统计
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="标签总数" value={snapshot?.tags.length ?? '--'} hint="按当前标签规则汇总" icon={Tag} />
        <StatCard label="规则标签" value={ruleTags.length} hint="基于明确阈值和对象字段判定" icon={ShieldAlert} />
        <StatCard label="智能标签" value={smartTags.length} hint="基于走访/矛盾/时效推导" icon={Sparkles} />
        <StatCard label="覆盖率" value={`${coverageRate}%`} hint={`总命中 ${totalAssignments} 次`} icon={Users} />
      </div>

      {error ? (
        <Card data-page-state="error" className="rounded-[4px] border border-[var(--color-status-error)]/50 bg-[var(--color-status-error)]/10 shadow-none">
          <CardContent className="flex items-center gap-3 p-4 text-[var(--color-status-error-text)]">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium text-[var(--color-status-error-text)]">标签数据加载失败</p>
              <p className="text-sm text-[var(--color-status-error-text)]">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className={`${PANEL_CLASS} gap-0`}>
          <CardHeader className="border-b border-[var(--color-neutral-03)] px-4 py-3">
            <CardTitle className="text-base font-semibold text-[var(--color-neutral-11)]">标签目录</CardTitle>
            <CardDescription className={`text-xs ${MUTED_TEXT_CLASS}`}>查看各标签的覆盖范围、分类和风险等级。</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow className="bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                  <TableHead className="min-w-[260px] whitespace-nowrap">标签</TableHead>
                  <TableHead className="whitespace-nowrap">类型</TableHead>
                  <TableHead className="whitespace-nowrap">分类</TableHead>
                  <TableHead className="whitespace-nowrap text-right">覆盖人数</TableHead>
                  <TableHead className="whitespace-nowrap">风险</TableHead>
                  <TableHead className="w-[72px] whitespace-nowrap text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <DataTableBody loading={loading || !snapshot} loadingText="正在同步标签视图..." columnCount={6}>
                {snapshot?.tags.map((tag) => (
                  <TableRow key={tag.id} className="hover:bg-[var(--color-brand-primary)]/8">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-[var(--color-neutral-11)]">{tag.name}</div>
                        <div className={`max-w-[420px] text-xs leading-5 ${MUTED_TEXT_CLASS}`}>{tag.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTagTypeClass(tag.type)}>{tag.type}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[var(--color-neutral-10)]">{tag.category}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-[var(--color-neutral-11)]">{tag.coverageCount}</TableCell>
                    <TableCell>
                      <StatusBadge tone={RISK_BADGE_TONE[tag.riskLevel] ?? 'neutral'}>{tag.riskLevel}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`查看${tag.name}详情`}
                        className="h-8 w-8 text-[var(--color-neutral-08)] hover:bg-[var(--color-brand-primary)]/15 hover:text-[var(--color-brand-text)]"
                        onClick={() => setSelectedTagId(tag.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </DataTableBody>
            </Table>
          </CardContent>
      </Card>

      <DetailDialogShell
        open={Boolean(selectedTag)}
        onOpenChange={(open) => !open && setSelectedTagId('')}
        maxWidth="5xl"
        contentLabel="标签详情"
        bodyClassName="overflow-hidden"
        badges={selectedTag ? (
          <>
            <Badge variant="outline" className={getTagTypeClass(selectedTag.type)}>{selectedTag.type}</Badge>
            <StatusBadge tone={RISK_BADGE_TONE[selectedTag.riskLevel] ?? 'neutral'}>{selectedTag.riskLevel}</StatusBadge>
            <Badge variant="outline" className={`${CHIP_BASE_CLASS} border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)]`}>
              覆盖 {selectedTag.coverageCount} 人
            </Badge>
          </>
        ) : undefined}
        title={selectedTag ? `标签详情 · ${selectedTag.name}` : '标签详情'}
        description={selectedTag ? `${selectedTag.type} · ${selectedTag.category} · ${selectedTag.description}` : '查看标签规则与覆盖对象。'}
      >
        {selectedTag ? (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <DetailSection icon={Tag} title="规则信息" className="shrink-0">
              <div className="space-y-3">
                {selectedTag.rules?.length ? (
                  <div className="space-y-1.5">
                    <p className={`text-xs font-medium ${MUTED_TEXT_CLASS}`}>规则条件</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTag.rules.map((rule) => (
                        <Badge
                          key={rule}
                          variant="outline"
                          className={`${CHIP_BASE_CLASS} border-[var(--color-brand-primary-hover)]/35 bg-[var(--color-brand-primary)]/10 text-[var(--color-status-info-text)]`}
                        >
                          {rule}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selectedTag.judgmentCriteria ? (
                  <div className="space-y-1.5">
                    <p className={`text-xs font-medium ${MUTED_TEXT_CLASS}`}>推导逻辑</p>
                    <p className="text-sm leading-6 text-[var(--color-neutral-10)]">{selectedTag.judgmentCriteria}</p>
                  </div>
                ) : null}
              </div>
            </DetailSection>

            <DetailSection
              icon={Users}
              title="覆盖对象"
              className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden"
              contentClassName="min-h-0 flex-1 p-0"
              trailing={<Badge variant="outline" className={`${CHIP_BASE_CLASS} border-[var(--color-neutral-03)] bg-[var(--color-neutral-03)] text-[var(--color-neutral-10)]`}>{coveredPeople.length} 人</Badge>}
            >
              <div
                role="region"
                aria-label="覆盖对象列表，可上下滚动"
                tabIndex={0}
                className="h-full overflow-y-auto overscroll-contain p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-primary)]"
              >
              {coveredPeople.length === 0 ? (
                <div className={`rounded-[4px] border border-dashed border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-4 text-sm ${MUTED_TEXT_CLASS}`}>
                  当前没有命中对象。
                </div>
              ) : (
                <div data-covered-people-grid className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {coveredPeople.map((person) => (
                    <div key={person.id} className="rounded-[4px] border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 font-medium text-[var(--color-neutral-11)]">
                          {person.name}
                          <span className="ml-2 text-xs font-normal text-[var(--color-neutral-08)]">{person.age} 岁</span>
                        </p>
                        <StatusBadge tone={RISK_BADGE_TONE[person.risk] ?? 'neutral'}>{person.risk}</StatusBadge>
                      </div>
                      <p className={`mt-1 break-words text-xs leading-5 ${MUTED_TEXT_CLASS}`}>{person.address || '地址未登记'}</p>
                      <p className={`mt-1 text-xs ${MUTED_TEXT_CLASS}`}>最近走访：{person.lastVisitAt}</p>
                      {person.reasons.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
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
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              </div>
            </DetailSection>
          </div>
        ) : null}
      </DetailDialogShell>
    </div>
  );
}
