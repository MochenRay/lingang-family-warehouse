import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Eye, Plus, RefreshCw, ShieldAlert, Sparkles, Tag, Trash2, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  millisecondsUntilNextShanghaiMidnight,
  tagRepository,
  type CreateTagInput,
  type ManagedTagSummary,
  type TagCondition,
  type TagConditionField,
  type TagConditionOperator,
  type TagSnapshot,
} from '../../services/repositories/tagRepository';
import { StatCard } from '../patterns/StatCard';
import { StatusBadge, type StatusTone } from '../patterns/StatusBadge';
import { DataTableBody } from '../patterns/DataTableShell';
import { PANEL_CLASS } from '../patterns/surfaces';
import { DetailDialogShell, DetailSection } from '../patterns/DetailDialog';
import { PageHeader } from './PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { getRiskLevelLabel } from '../../utils/riskLevel';

const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const CHIP_BASE_CLASS = 'border px-2 py-0.5 text-[11px] font-medium';
const DEFAULT_CONDITION: TagCondition = { field: 'age', operator: 'gte', value: 80 };
const CONDITION_FIELDS: Array<{ value: TagConditionField; label: string }> = [
  { value: 'age', label: '年龄' },
  { value: 'household_size', label: '同住人数' },
  { value: 'person_type', label: '居住类型' },
  { value: 'risk', label: '风险等级' },
];
const CONDITION_OPERATORS: Array<{ value: TagConditionOperator; label: string }> = [
  { value: 'eq', label: '等于' },
  { value: 'neq', label: '不等于' },
  { value: 'gt', label: '大于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lt', label: '小于' },
  { value: 'lte', label: '小于等于' },
];

function createEmptyForm(): CreateTagInput {
  return {
    name: '',
    type: 'ordinary',
    description: '',
    category: '重点关注',
    riskLevel: 'Medium',
    conditions: [],
  };
}

const RISK_BADGE_TONE: Record<string, StatusTone> = {
  High: 'error',
  Medium: 'warning',
  Low: 'success',
};

function getTagTypeClass(type: ManagedTagSummary['type']) {
  if (type === '普通标签') {
    return `${CHIP_BASE_CLASS} border-[var(--color-brand-primary-hover)]/45 bg-[var(--color-brand-primary)]/15 text-[var(--color-status-info-text)]`;
  }
  return `${CHIP_BASE_CLASS} border-[var(--color-accent-purple)]/45 bg-[var(--color-accent-purple)]/15 text-[var(--color-accent-purple-text)]`;
}

export function TagOverview() {
  const [snapshot, setSnapshot] = useState<TagSnapshot | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTagInput>(createEmptyForm);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

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

  useEffect(() => {
    let cancelled = false;
    let midnightTimer = 0;
    const refresh = async () => {
      try {
        const nextSnapshot = await tagRepository.getSnapshot();
        if (!cancelled) setSnapshot(nextSnapshot);
      } catch {
        // The visible page keeps its last successful snapshot; explicit sync still surfaces errors.
      }
    };
    const scheduleMidnightRefresh = () => {
      midnightTimer = window.setTimeout(() => {
        void refresh().finally(scheduleMidnightRefresh);
      }, millisecondsUntilNextShanghaiMidnight());
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    scheduleMidnightRefresh();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      window.clearTimeout(midnightTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
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

  const ordinaryTags = snapshot?.tags.filter((tag) => tag.type === '普通标签') ?? [];
  const smartTags = snapshot?.tags.filter((tag) => tag.type === '智能标签') ?? [];

  const syncSnapshot = async () => {
    try {
      setLoading(true);
      setError('');
      const nextSnapshot = await tagRepository.getSnapshot();
      setSnapshot(nextSnapshot);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '标签数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const finishCreateTag = async () => {
    toast.success('标签已创建');
    setTokenDialogOpen(false);
    setTokenInput('');
    setCreateDialogOpen(false);
    setCreateForm(createEmptyForm());
    await syncSnapshot();
  };

  const submitCreateTag = async () => {
    if (!createForm.name.trim() || !createForm.description.trim() || !createForm.category.trim()) {
      toast.error('请完整填写标签名称、描述和分类');
      return;
    }
    if (createForm.type === 'smart' && createForm.conditions.length === 0) {
      toast.error('智能标签至少需要一个判断条件');
      return;
    }

    setCreatePending(true);
    try {
      await tagRepository.createTag(createForm);
      await finishCreateTag();
    } catch (createError) {
      if (createError instanceof Error && createError.message.includes('API 403')) {
        tagRepository.clearWriteToken();
        setTokenInput('');
        setTokenDialogOpen(true);
      } else {
        toast.error(createError instanceof Error ? createError.message : '标签创建失败');
      }
    } finally {
      setCreatePending(false);
    }
  };

  const submitTokenAuthorization = async () => {
    const token = tokenInput.trim();
    if (!token) {
      toast.error('请输入标签专用管理员口令');
      return;
    }
    setCreatePending(true);
    try {
      tagRepository.storeWriteToken(token);
      await tagRepository.createTag(createForm, token);
      await finishCreateTag();
    } catch (createError) {
      tagRepository.clearWriteToken();
      setTokenInput('');
      toast.error(createError instanceof Error ? createError.message : '标签管理员授权失败');
    } finally {
      setCreatePending(false);
    }
  };

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)] page-enter">
      <PageHeader
        eyebrow="TAG LEDGER"
        title="标签管理"
        description="统一查看重点标签的覆盖范围、风险等级和命中对象，便于快速定位需要跟进的人群。"
        actions={<div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            新增标签
          </Button>
          <Button
            variant="outline"
            onClick={() => void syncSnapshot()}
            className="gap-2 border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] hover:bg-[var(--color-brand-primary-hover)]/12 hover:text-[var(--color-neutral-11)]"
          >
            <RefreshCw className="h-4 w-4" />
            同步标签统计
          </Button>
        </div>}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="标签总数" value={snapshot?.tags.length ?? '--'} hint="按当前标签规则汇总" icon={Tag} />
        <StatCard label="普通标签" value={ordinaryTags.length} hint="由工作人员按核实结果人工维护" icon={ShieldAlert} />
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
                      <StatusBadge tone={RISK_BADGE_TONE[tag.riskLevel] ?? 'neutral'}>{getRiskLevelLabel(tag.riskLevel)}</StatusBadge>
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
            <StatusBadge tone={RISK_BADGE_TONE[selectedTag.riskLevel] ?? 'neutral'}>{getRiskLevelLabel(selectedTag.riskLevel)}</StatusBadge>
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
                        <StatusBadge tone={RISK_BADGE_TONE[person.risk] ?? 'neutral'}>{getRiskLevelLabel(person.risk)}</StatusBadge>
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

      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        if (!open && tokenDialogOpen) return;
        setCreateDialogOpen(open);
        if (!open && !createPending) setCreateForm(createEmptyForm());
      }}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-neutral-11)]">新增标签</DialogTitle>
            <DialogDescription className={MUTED_TEXT_CLASS}>
              普通标签由工作人员手动分配；智能标签会根据人员事实在读取时动态判断。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tag-name">标签名称</Label>
              <Input id="tag-name" maxLength={40} value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>标签类型</Label>
              <Select value={createForm.type} onValueChange={(value: CreateTagInput['type']) => setCreateForm((current) => ({
                ...current,
                type: value,
                conditions: value === 'smart' ? current.conditions.length ? current.conditions : [{ ...DEFAULT_CONDITION }] : [],
              }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ordinary">普通标签</SelectItem>
                  <SelectItem value="smart">智能标签</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag-category">分类</Label>
              <Input id="tag-category" maxLength={30} value={createForm.category} onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>风险等级</Label>
              <Select value={createForm.riskLevel} onValueChange={(riskLevel: CreateTagInput['riskLevel']) => setCreateForm((current) => ({ ...current, riskLevel }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">高风险</SelectItem>
                  <SelectItem value="Medium">中风险</SelectItem>
                  <SelectItem value="Low">低风险</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tag-description">标签描述</Label>
              <Textarea id="tag-description" maxLength={200} rows={3} value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
          </div>

          {createForm.type === 'smart' ? (
            <div className="space-y-3 rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-neutral-11)]">智能判断条件</p>
                  <p className={`mt-1 text-xs ${MUTED_TEXT_CLASS}`}>全部条件按“且”组合，最多 8 条。</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={createForm.conditions.length >= 8}
                  onClick={() => setCreateForm((current) => ({ ...current, conditions: [...current.conditions, { ...DEFAULT_CONDITION }] }))}
                >
                  <Plus className="mr-1 h-4 w-4" />增加条件
                </Button>
              </div>
              <div className="space-y-2">
                {createForm.conditions.map((condition, index) => {
                  const enumField = condition.field === 'person_type' || condition.field === 'risk';
                  const updateCondition = (updates: Partial<TagCondition>) => setCreateForm((current) => ({
                    ...current,
                    conditions: current.conditions.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item),
                  }));
                  return (
                    <div key={`${condition.field}-${index}`} className="grid gap-2 rounded border border-[var(--color-neutral-03)] p-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                      <Select value={condition.field} onValueChange={(field: TagConditionField) => updateCondition({
                        field,
                        operator: field === 'person_type' || field === 'risk' ? 'eq' : 'gte',
                        value: field === 'person_type' ? '户籍' : field === 'risk' ? 'Medium' : 80,
                      })}>
                        <SelectTrigger aria-label={`条件 ${index + 1} 字段`}><SelectValue /></SelectTrigger>
                        <SelectContent>{CONDITION_FIELDS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={condition.operator} onValueChange={(operator: TagConditionOperator) => updateCondition({ operator })}>
                        <SelectTrigger aria-label={`条件 ${index + 1} 运算符`}><SelectValue /></SelectTrigger>
                        <SelectContent>{CONDITION_OPERATORS.filter((item) => !enumField || ['eq', 'neq'].includes(item.value)).map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                      </Select>
                      {condition.field === 'person_type' ? (
                        <Select value={String(condition.value)} onValueChange={(value) => updateCondition({ value })}>
                          <SelectTrigger aria-label={`条件 ${index + 1} 值`}><SelectValue /></SelectTrigger>
                          <SelectContent>{['户籍', '流动', '留守', '境外'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : condition.field === 'risk' ? (
                        <Select value={String(condition.value)} onValueChange={(value) => updateCondition({ value })}>
                          <SelectTrigger aria-label={`条件 ${index + 1} 值`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="High">高风险</SelectItem>
                            <SelectItem value="Medium">中风险</SelectItem>
                            <SelectItem value="Low">低风险</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input aria-label={`条件 ${index + 1} 数值`} type="number" min={0} value={Number(condition.value)} onChange={(event) => updateCondition({ value: Number(event.target.value) })} />
                      )}
                      <Button type="button" size="icon" variant="ghost" aria-label={`删除条件 ${index + 1}`} onClick={() => setCreateForm((current) => ({ ...current, conditions: current.conditions.filter((_item, itemIndex) => itemIndex !== index) }))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={createPending}>取消</Button>
            <Button type="button" onClick={() => void submitCreateTag()} disabled={createPending}>{createPending ? '正在创建...' : '创建标签'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tokenDialogOpen} onOpenChange={(open) => {
        if (createPending) return;
        setTokenDialogOpen(open);
        if (!open) setTokenInput('');
      }}>
        <DialogContent className="max-w-md border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-neutral-11)]">标签管理员授权</DialogTitle>
            <DialogDescription className={MUTED_TEXT_CLASS}>
              该口令只保留在当前浏览器会话，用于标签写操作；不会保存到本地长期存储。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="tag-write-token">管理员口令</Label>
            <Input
              id="tag-write-token"
              type="password"
              autoComplete="current-password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void submitTokenAuthorization();
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTokenDialogOpen(false)} disabled={createPending}>取消</Button>
            <Button type="button" onClick={() => void submitTokenAuthorization()} disabled={createPending}>
              {createPending ? '正在验证...' : '验证并创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
