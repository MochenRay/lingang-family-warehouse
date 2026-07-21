import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Settings2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { taskRepository } from '../../services/repositories/taskRepository';
import { taskRuleRepository, type TaskRuleRecord } from '../../services/repositories/taskRuleRepository';
import { PageHeader } from './PageHeader';
import { StatCard } from '../patterns/StatCard';
import { StatusBadge, type StatusTone } from '../patterns/StatusBadge';
import { DataTableBody } from '../patterns/DataTableShell';
import { SearchInput } from '../patterns/FilterBar';
import { DIALOG_CLASS, PANEL_CLASS } from '../patterns/surfaces';

type RulePriority = TaskRuleRecord['priority'];

interface RuleDraft {
  name: string;
  description: string;
  priority: RulePriority;
  enabled: boolean;
  maxIdleDays: number;
  urgentAfterDays: number;
  deadlineDays: number;
  overdueAfterDays?: number;
}

const priorityConfig: Record<RulePriority, { label: string; tone: StatusTone }> = {
  critical: { label: '极高', tone: 'error' },
  high: { label: '高', tone: 'warning' },
  medium: { label: '中', tone: 'info' },
  low: { label: '低', tone: 'neutral' },
};

const DARK_FIELD_CLASS = 'bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]';
const DARK_BUTTON_CLASS = 'border-[var(--color-neutral-03)] text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-[var(--color-neutral-11)]';

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function buildDraft(rule: TaskRuleRecord): RuleDraft {
  return {
    name: rule.name,
    description: rule.description,
    priority: rule.priority,
    enabled: rule.enabled,
    maxIdleDays: readNumber(rule.conditions.maxIdleDays, 7),
    urgentAfterDays: readNumber(rule.conditions.urgentAfterDays, 14),
    deadlineDays: readNumber(rule.action.deadlineDays, 7),
    overdueAfterDays: readNumber(rule.conditions.overdueAfterDays, 7),
  };
}

function buildUpdatePayload(rule: TaskRuleRecord, draft: RuleDraft) {
  return {
    name: draft.name,
    description: draft.description,
    priority: draft.priority,
    enabled: draft.enabled,
    conditions: {
      ...rule.conditions,
      maxIdleDays: draft.maxIdleDays,
      urgentAfterDays: draft.urgentAfterDays,
      ...(rule.id === 'rule_conflict_followup'
        ? { overdueAfterDays: draft.overdueAfterDays ?? readNumber(rule.conditions.overdueAfterDays, 7) }
        : {}),
    },
    action: {
      ...rule.action,
      deadlineDays: draft.deadlineDays,
    },
  };
}

function getRuleSummary(rule: TaskRuleRecord): string {
  const maxIdleDays = readNumber(rule.conditions.maxIdleDays, 7);
  const urgentAfterDays = readNumber(rule.conditions.urgentAfterDays, 14);
  const deadlineDays = readNumber(rule.action.deadlineDays, 7);
  if (rule.id === 'rule_conflict_followup') {
    const overdueAfterDays = readNumber(rule.conditions.overdueAfterDays, 7);
    return `超过 ${maxIdleDays} 天未更新生成跟进任务，${overdueAfterDays} 天后标记超期，默认 ${deadlineDays} 天内完成。`;
  }
  return `超过 ${maxIdleDays} 天未跟进进入规则，${urgentAfterDays} 天后升级为紧急，默认 ${deadlineDays} 天内完成。`;
}

export function RuleConfig() {
  const [rules, setRules] = useState<TaskRuleRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | RulePriority>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [taskSummary, setTaskSummary] = useState<{ pending: number; overdue: number; completed: number; completionRate: number } | null>(null);
  const [editingRule, setEditingRule] = useState<TaskRuleRecord | null>(null);
  const [draft, setDraft] = useState<RuleDraft | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [nextRules, nextSummary] = await Promise.all([
        taskRuleRepository.getRules(),
        taskRepository.getTaskSummary(),
      ]);
      setRules(nextRules);
      setTaskSummary(nextSummary);
    } catch (error) {
      console.error('Failed to load task rules', error);
      setRules([]);
      setTaskSummary({ pending: 0, overdue: 0, completed: 0, completionRate: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      if (priorityFilter !== 'all' && rule.priority !== priorityFilter) {
        return false;
      }
      if (!searchTerm.trim()) {
        return true;
      }
      const keyword = searchTerm.trim();
      return rule.name.includes(keyword) || rule.description.includes(keyword);
    });
  }, [priorityFilter, rules, searchTerm]);

  const activeCount = rules.filter((rule) => rule.enabled).length;
  const totalCovered = rules.filter((rule) => rule.enabled).reduce((sum, rule) => sum + rule.coveredCount, 0);

  const handleToggleRule = async (rule: TaskRuleRecord, nextEnabled: boolean) => {
    setSavingId(rule.id);
    try {
      await taskRuleRepository.updateRule(rule.id, { enabled: nextEnabled });
      await load();
    } catch (error) {
      console.error('Failed to toggle task rule', error);
    } finally {
      setSavingId(null);
    }
  };

  const openEditor = (rule: TaskRuleRecord) => {
    setEditingRule(rule);
    setDraft(buildDraft(rule));
  };

  const closeEditor = () => {
    setEditingRule(null);
    setDraft(null);
  };

  const handleSave = async () => {
    if (!editingRule || !draft) {
      return;
    }
    setSavingId(editingRule.id);
    try {
      await taskRuleRepository.updateRule(editingRule.id, buildUpdatePayload(editingRule, draft));
      await load();
      closeEditor();
    } catch (error) {
      console.error('Failed to update task rule', error);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5 text-[var(--color-neutral-10)]">
      <PageHeader
        eyebrow="TASK RULES"
        title="待办规则配置"
        description="配置重点对象和时效触发规则，让待办生成逻辑可解释可调整。"
        actions={
          <Button
            variant="outline"
            className={`gap-2 ${DARK_BUTTON_CLASS}`}
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新投影
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard
          label="运行中规则"
          value={activeCount}
          hint={`当前共 ${rules.length} 条规则配置`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="覆盖对象"
          value={totalCovered}
          hint="按当前规则命中的待跟进对象"
          icon={Settings2}
          tone="brand"
        />
        <StatCard
          label="待办清单"
          value={taskSummary?.pending ?? 0}
          hint="当前规则下生成的移动端待办数量"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="超期跟进"
          value={taskSummary?.overdue ?? 0}
          hint="规则变更后立即反映到待办摘要"
          icon={AlertTriangle}
          tone="error"
        />
      </div>

      <Card className={PANEL_CLASS}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <SearchInput
              className="flex-1"
              placeholder="搜索规则名称或说明"
              value={searchTerm}
              onChange={setSearchTerm}
            />
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as 'all' | RulePriority)}>
              <SelectTrigger className={`w-full md:w-44 ${DARK_FIELD_CLASS}`}>
                <SelectValue placeholder="优先级筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="critical">极高</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className={`${PANEL_CLASS} overflow-hidden`}>
        <CardHeader className="border-b border-[var(--color-neutral-03)] px-5 py-4">
          <CardTitle className="text-base text-[var(--color-neutral-11)]">规则总览</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] hover:bg-[var(--color-neutral-02)]">
                <TableHead>规则</TableHead>
                <TableHead>覆盖对象</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>当前阈值</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <DataTableBody
              loading={loading}
              loadingText="正在读取规则与任务投影..."
              empty={filteredRules.length === 0}
              emptyText="当前筛选条件下没有可显示的规则。"
              columnCount={6}
            >
              {filteredRules.map((rule) => (
                <TableRow key={rule.id} className="border-[var(--color-neutral-03)] hover:bg-[var(--color-brand-primary)]/8">
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <div className="font-medium text-[var(--color-neutral-11)]">{rule.name}</div>
                      <div className="text-sm text-[var(--color-neutral-08)]">{rule.description}</div>
                      <div className="text-xs text-[var(--color-neutral-08)]">{getRuleSummary(rule)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="text-sm font-medium text-[var(--color-neutral-11)]">{rule.coveredCount}</div>
                    <div className="text-xs text-[var(--color-neutral-08)]">当前命中对象</div>
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusBadge tone={priorityConfig[rule.priority].tone}>
                      {priorityConfig[rule.priority].label}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="align-top text-sm text-[var(--color-neutral-08)]">
                    {readNumber(rule.conditions.maxIdleDays, 7)} 天触发
                    {rule.id === 'rule_conflict_followup'
                      ? ` / ${readNumber(rule.conditions.overdueAfterDays, 7)} 天超期`
                      : ` / ${readNumber(rule.conditions.urgentAfterDays, 14)} 天升级紧急`}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => void handleToggleRule(rule, checked)}
                        disabled={savingId === rule.id}
                        aria-label={`${rule.name} 启用开关`}
                      />
                      <span className="text-sm text-[var(--color-neutral-08)]">{rule.enabled ? '已启用' : '已停用'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className={DARK_BUTTON_CLASS}
                      onClick={() => openEditor(rule)}
                    >
                      调整阈值
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </DataTableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingRule && draft)} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className={DIALOG_CLASS}>
          <DialogHeader>
            <DialogTitle>调整规则阈值</DialogTitle>
            <DialogDescription className="text-[var(--color-neutral-08)]">
              这里的修改会直接影响移动端待办投影，不再只是页面演示。
            </DialogDescription>
          </DialogHeader>

          {editingRule && draft && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>规则名称</Label>
                <Input className={DARK_FIELD_CLASS} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>规则说明</Label>
                <Input className={DARK_FIELD_CLASS} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>优先级</Label>
                  <Select value={draft.priority} onValueChange={(value) => setDraft({ ...draft, priority: value as RulePriority })}>
                    <SelectTrigger className={DARK_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">极高</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="low">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-3 pb-2">
                  <Switch checked={draft.enabled} onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })} aria-label="启用这条规则" />
                  <span className="text-sm text-[var(--color-neutral-08)]">启用这条规则</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>触发阈值（天）</Label>
                  <Input
                    className={DARK_FIELD_CLASS}
                    type="number"
                    min={1}
                    value={draft.maxIdleDays}
                    onChange={(event) => setDraft({ ...draft, maxIdleDays: Number(event.target.value || 1) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{editingRule.id === 'rule_conflict_followup' ? '超期阈值（天）' : '升级紧急（天）'}</Label>
                  <Input
                    className={DARK_FIELD_CLASS}
                    type="number"
                    min={1}
                    value={editingRule.id === 'rule_conflict_followup' ? (draft.overdueAfterDays ?? 7) : draft.urgentAfterDays}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value || 1);
                      setDraft(
                        editingRule.id === 'rule_conflict_followup'
                          ? { ...draft, overdueAfterDays: nextValue }
                          : { ...draft, urgentAfterDays: nextValue },
                      );
                    }}
                  />
                </div>
              </div>
              {editingRule.id !== 'rule_conflict_followup' && (
                <div className="grid gap-2">
                  <Label>任务截止（天）</Label>
                  <Input
                    className={DARK_FIELD_CLASS}
                    type="number"
                    min={1}
                    value={draft.deadlineDays}
                    onChange={(event) => setDraft({ ...draft, deadlineDays: Number(event.target.value || 1) })}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className={DARK_BUTTON_CLASS} onClick={closeEditor}>取消</Button>
            <Button onClick={() => void handleSave()} disabled={!draft || (editingRule ? savingId === editingRule.id : false)}>
              保存并更新投影
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
