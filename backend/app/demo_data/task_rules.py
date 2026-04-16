from app.models.task_rule import TaskRule


DEFAULT_TASK_RULES = [
    TaskRule(
        id="rule_visit_followup",
        name="待回访提醒",
        description="对带关爱标签且超过 7 天未走访的对象生成回访任务。",
        subjectType="person",
        taskType="重点走访",
        triggerType="事件触发",
        priority="high",
        enabled=True,
        conditions={
            "match": "care_label",
            "maxIdleDays": 7,
            "urgentAfterDays": 14,
        },
        action={
            "statusLabel": "待回访",
            "deadlineDays": 7,
            "assignedBy": "系统规则",
        },
        createdAt="2026-04-16 09:00",
        updatedAt="2026-04-16 09:00",
        lastRun="2026-04-16 09:00",
    ),
    TaskRule(
        id="rule_risk_watch",
        name="风险关注提醒",
        description="对高风险对象超过 3 天未跟进时生成风险关注任务。",
        subjectType="person",
        taskType="重点走访",
        triggerType="事件触发",
        priority="critical",
        enabled=True,
        conditions={
            "match": "high_risk",
            "maxIdleDays": 3,
            "urgentAfterDays": 7,
        },
        action={
            "statusLabel": "风险关注",
            "deadlineDays": 3,
            "assignedBy": "系统研判",
        },
        createdAt="2026-04-16 09:00",
        updatedAt="2026-04-16 09:00",
        lastRun="2026-04-16 09:00",
    ),
    TaskRule(
        id="rule_conflict_followup",
        name="纠纷跟进提醒",
        description="对未化解且超过 3 天未更新的纠纷生成跟进任务。",
        subjectType="conflict",
        taskType="矛盾调解",
        triggerType="事件触发",
        priority="high",
        enabled=True,
        conditions={
            "maxIdleDays": 3,
            "overdueAfterDays": 7,
            "urgentSources": ["上级下派"],
        },
        action={
            "statusLabel": "待跟进",
            "deadlineDays": 3,
            "assignedBy": "系统调度",
        },
        createdAt="2026-04-16 09:00",
        updatedAt="2026-04-16 09:00",
        lastRun="2026-04-16 09:00",
    ),
]


def build_task_rule_records() -> list[TaskRule]:
    return [
        TaskRule.model_validate(rule.model_dump())
        for rule in DEFAULT_TASK_RULES
    ]
