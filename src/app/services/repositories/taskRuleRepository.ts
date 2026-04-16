import { callWithFallback, fetchJson, type ApiListResponse } from '../api';

export interface TaskRuleRecord {
  id: string;
  name: string;
  description: string;
  subjectType: 'person' | 'conflict';
  taskType: string;
  triggerType: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  conditions: Record<string, unknown>;
  action: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastRun?: string | null;
  coveredCount: number;
}

export interface TaskRuleUpdatePayload {
  name?: string;
  description?: string;
  priority?: TaskRuleRecord['priority'];
  enabled?: boolean;
  conditions?: Record<string, unknown>;
  action?: Record<string, unknown>;
  lastRun?: string | null;
}

const FALLBACK_RULES: TaskRuleRecord[] = [
  {
    id: 'rule_visit_followup',
    name: '待回访提醒',
    description: '对带关爱标签且超过 7 天未走访的对象生成回访任务。',
    subjectType: 'person',
    taskType: '重点走访',
    triggerType: '事件触发',
    priority: 'high',
    enabled: true,
    conditions: { match: 'care_label', maxIdleDays: 7, urgentAfterDays: 14 },
    action: { statusLabel: '待回访', deadlineDays: 7, assignedBy: '系统规则' },
    createdAt: '2026-04-16 09:00',
    updatedAt: '2026-04-16 09:00',
    lastRun: '2026-04-16 09:00',
    coveredCount: 0,
  },
  {
    id: 'rule_risk_watch',
    name: '风险关注提醒',
    description: '对高风险对象超过 3 天未跟进时生成风险关注任务。',
    subjectType: 'person',
    taskType: '重点走访',
    triggerType: '事件触发',
    priority: 'critical',
    enabled: true,
    conditions: { match: 'high_risk', maxIdleDays: 3, urgentAfterDays: 7 },
    action: { statusLabel: '风险关注', deadlineDays: 3, assignedBy: '系统研判' },
    createdAt: '2026-04-16 09:00',
    updatedAt: '2026-04-16 09:00',
    lastRun: '2026-04-16 09:00',
    coveredCount: 0,
  },
  {
    id: 'rule_conflict_followup',
    name: '纠纷跟进提醒',
    description: '对未化解且超过 3 天未更新的纠纷生成跟进任务。',
    subjectType: 'conflict',
    taskType: '矛盾调解',
    triggerType: '事件触发',
    priority: 'high',
    enabled: true,
    conditions: { maxIdleDays: 3, overdueAfterDays: 7, urgentSources: ['上级下派'] },
    action: { statusLabel: '待跟进', deadlineDays: 3, assignedBy: '系统调度' },
    createdAt: '2026-04-16 09:00',
    updatedAt: '2026-04-16 09:00',
    lastRun: '2026-04-16 09:00',
    coveredCount: 0,
  },
];

function emitRuleChange(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event('db-change'));
}

export const taskRuleRepository = {
  async getRules(): Promise<TaskRuleRecord[]> {
    return callWithFallback(
      async () => {
        const response = await fetchJson<ApiListResponse<TaskRuleRecord>>('/task-rules');
        return response.items;
      },
      () => FALLBACK_RULES.map((rule) => ({ ...rule })),
    );
  },

  async updateRule(id: string, payload: TaskRuleUpdatePayload): Promise<TaskRuleRecord> {
    const updated = await fetchJson<TaskRuleRecord>(`/task-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    emitRuleChange();
    return updated;
  },
};
