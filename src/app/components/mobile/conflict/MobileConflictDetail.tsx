import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin,
  Users,
  ShieldCheck,
  MessageSquarePlus,
  Loader2,
  BookOpen,
  ExternalLink,
  RotateCcw,
  X,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '../../ui/dialog';
import { MobileDetailHeader } from '../MobileDetailHeader';
import {
  conflictFacade,
  MobileConflictFacadeTargetNotFoundError,
  type MobileConflictDetailResult,
} from '../../../services/mobileSandbox/conflictFacade';
import type { ConflictContext } from '../../../services/repositories/conflictRepository';
import { mobileContextRepository } from '../../../services/repositories/mobileContextRepository';
import type { MobileNavigateOptions } from '../mobileNavigation';
import type { ConflictRecord } from '../../../types/core';
import { toast } from 'sonner';
import { getRiskLevelLabel } from '../../../utils/riskLevel';
import { useMobileSandbox } from '../MobileSandboxProvider';

interface MobileConflictDetailProps {
  id: string;
  onBack: () => void;
  onRouteChange?: (route: string, options?: MobileNavigateOptions) => void;
}

type DetailPhase =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-found' }
  | { status: 'ready' };

interface PolicyCard {
  title: string;
  summary: string;
  source: string;
  relevance: string;
}

interface ScriptCard {
  scenario: string;
  target: string;
  script: string;
  tips: string;
}

// 与种子数据一致的本地业务时间格式（YYYY-MM-DD HH:mm:ss）
function formatNow() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function isNotFoundError(error: unknown): boolean {
  if (error instanceof MobileConflictFacadeTargetNotFoundError) {
    return true;
  }
  // api.ts 只抛普通 Error；404 只能通过消息前缀识别，其他状态一律按真实错误处理
  return error instanceof Error && /^API 404[:\s]/.test(error.message);
}

function buildPolicyCards(conflict: ConflictRecord, context: ConflictContext): PolicyCard[] {
  const baseCards: Record<ConflictRecord['type'], PolicyCard> = {
    邻里纠纷: {
      title: '《中华人民共和国民法典》相邻关系条款',
      summary: '相邻权利人应当按照有利生产、方便生活、团结互助、公平合理的原则正确处理相邻关系。',
      source: '法规库',
      relevance: '适用于通行、采光、噪音、占用公共空间等邻里争议。',
    },
    家庭纠纷: {
      title: '《中华人民共和国反家庭暴力法》',
      summary: '家庭纠纷中如涉及家庭暴力、监护照护、赡养等问题，优先关注安全、隐私和后续支持。',
      source: '法规库',
      relevance: '适用于家庭内部冲突、照护分工和风险排查。',
    },
    物业纠纷: {
      title: '《物业管理条例》',
      summary: '物业服务、缴费、维修和公共秩序问题，应结合业主、物业和社区三方诉求协调推进。',
      source: '法规库',
      relevance: '适用于物业收费、服务质量和公共区域使用争议。',
    },
    其他: {
      title: '《人民调解法》',
      summary: '人民调解通过说服、疏导等方法，在平等协商基础上推动民间纠纷达成调解协议。',
      source: '法规库',
      relevance: '适用于未明确归类但仍可社区协调的民间纠纷。',
    },
  };

  const cards: PolicyCard[] = [baseCards[conflict.type]];

  cards.push({
    title: context.followUpStatus.label,
    summary: context.followUpStatus.detail,
    source: '案件上下文',
    relevance: context.suggestedActions[0] ?? '围绕当前跟进状态推进下一步处置。',
  });

  if (context.relatedHouse) {
    cards.push({
      title: `关联房屋：${context.relatedHouse.address}`,
      summary: `该案件与 ${context.relatedHouse.type ?? '房屋'} 相关，建议同步关注 ${context.relatedHouse.memberCount ?? 0} 人的居住关系与现场状态。`,
      source: '房屋档案',
      relevance: context.relatedHouse.type === '出租'
        ? '出租房重点核查居住人数、租住关系和公共安全。'
        : '结合房屋状态核实矛盾发生的空间背景。',
    });
  } else if (context.relatedPeople.some((person) => person.risk === 'High')) {
    cards.push({
      title: '重点对象复核',
      summary: '关联人员中存在高风险对象，建议同步核验联系方式、近期走访和风险标签。',
      source: '人员档案',
      relevance: '用于补齐重点对象的回访和风险确认。',
    });
  } else {
    cards.push({
      title: '案件处置节奏',
      summary: context.suggestedActions[1] ?? '先核验事实，再明确责任人、时间点和回访口径。',
      source: '调解流程',
      relevance: '用于把处置动作从感受层收束到可跟进事项。',
    });
  }

  return cards.slice(0, 3);
}

function buildScriptCards(conflict: ConflictRecord, context: ConflictContext): ScriptCard[] {
  const primaryPerson = context.relatedPeople[0];
  const primaryTarget = primaryPerson ? `${primaryPerson.name}${primaryPerson.risk ? `（${getRiskLevelLabel(primaryPerson.risk)}）` : ''}` : '当事人';
  const cards: ScriptCard[] = [
    {
      scenario: '首次接触',
      target: primaryTarget,
      script: `您好，我先把这起${conflict.type}的主要情况理清楚。咱们先从发生时间、地点、经过和当前最希望解决的问题说起，我把关键信息记下来，后面一起推进。`,
      tips: `先核验事实，再谈方案。${context.followUpStatus.detail}`,
    },
  ];

  if (context.relatedPeople.length > 1) {
    cards.push({
      scenario: '多方沟通',
      target: '相关当事人',
      script: '大家先分别把诉求说清楚，我先不下结论。我们先把事实、分歧点和各自能接受的方案整理出来，再逐步对齐。',
      tips: context.suggestedActions[0] ?? '控制节奏，确保每一方都有表达机会。',
    });
  }

  if (context.relatedHouse) {
    cards.push({
      scenario: '入户核实',
      target: context.relatedHouse.address,
      script: `我先看一下房屋的实际情况，核对一下居住关系和现场状态。${context.relatedHouse.type ?? ''}的状态如果和登记信息有差异，我们先把差异记清楚。`,
      tips: context.suggestedActions[2] ?? '围绕房屋状态、同住关系和现场证据补齐信息。',
    });
  } else {
    cards.push({
      scenario: '回访确认',
      target: primaryPerson ? primaryPerson.name : '当事人',
      script: '上次沟通里提到的事项，我今天再来核对一下进展。哪些问题已经解决，哪些还需要继续跟进，我们逐项确认。',
      tips: context.suggestedActions[1] ?? '把上次承诺事项和本次回访结果写清楚。',
    });
  }

  return cards.slice(0, 3);
}

export function MobileConflictDetail({ id, onBack, onRouteChange }: MobileConflictDetailProps) {
  const { mode, canMutate } = useMobileSandbox();
  const [conflict, setConflict] = useState<ConflictRecord | null>(null);
  const [context, setContext] = useState<ConflictContext | null>(null);
  const [phase, setPhase] = useState<DetailPhase>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);
  const [progressContent, setProgressContent] = useState('');
  const [progressError, setProgressError] = useState<string | null>(null);
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [aiTab, setAiTab] = useState<'policy' | 'script'>('policy');
  const [resolveConfirmOpen, setResolveConfirmOpen] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  // mutation 已成功但读回失败时的锁定状态；锁定不随 Dialog 关闭而清除
  const [readFailure, setReadFailure] = useState<{
    path: 'progress' | 'resolve';
    targetId: string;
    mutationGeneration: number;
  } | null>(null);
  const [isReReading, setIsReReading] = useState(false);

  // 所有详情异步读取共用单调 request generation；卸载、id 变化或新请求都使旧结果失效
  const mountedRef = useRef(false);
  const idRef = useRef(id);
  idRef.current = id;
  const requestGenRef = useRef(0);
  // mutation generation 与请求 generation 独立：旧案件 mutation 不得读取或落地到新 id。
  const mutationGenRef = useRef(0);
  // 当前页面 UI mutation 锁：id 切换时可清，使 B 不受 A 的按钮/Dialog 状态影响。
  const ownMutationRef = useRef<{ targetId: string; generation: number } | null>(null);
  // 尚未 settle 的自身 mutation token：跨 id 保留，用于抑制 A 延迟 emit 对 B 的背景 reload。
  // token 只能由对应 generation 的 mutation 流程删除，id effect 不得清空。
  const pendingOwnMutationTokensRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestGenRef.current += 1;
      mutationGenRef.current += 1;
      ownMutationRef.current = null;
    };
  }, []);

  // 同一 MobileConflictDetail 实例切换 id 时，立即使旧 mutation/readback 与其 UI 锁失效。
  useEffect(() => {
    requestGenRef.current += 1;
    mutationGenRef.current += 1;
    ownMutationRef.current = null;
    setReadFailure(null);
    setIsReReading(false);
    setIsSubmittingProgress(false);
    setIsResolving(false);
    setProgressContent('');
    setProgressError(null);
    setResolveError(null);
    setIsDialogOpen(false);
    setResolveConfirmOpen(false);
  }, [id]);

  // 常规详情读取（初始加载 / 重试 / 外部 facade change）：可更新 phase；
  // 落地前同时校验 mounted、当前 id 与 generation，旧请求不得覆盖新数据。
  const readDetail = useCallback(async (updatePhase: boolean): Promise<void> => {
    const generation = ++requestGenRef.current;
    const currentId = idRef.current;
    if (updatePhase) {
      setPhase({ status: 'loading' });
    }
    const isStale = () => (
      !mountedRef.current || idRef.current !== currentId || requestGenRef.current !== generation
    );
    try {
      const result = await conflictFacade.getConflictDetail(currentId);
      if (isStale()) {
        return;
      }
      if (!result) {
        setConflict(null);
        setContext(null);
        setPhase({ status: 'not-found' });
        return;
      }
      setConflict(result.conflict);
      setContext(result.context);
      setPhase({ status: 'ready' });
    } catch (error) {
      if (isStale()) {
        return;
      }
      setConflict(null);
      setContext(null);
      if (isNotFoundError(error)) {
        // not-found 是常规业务状态，不是错误，不打 error 日志
        setPhase({ status: 'not-found' });
      } else {
        console.error('Failed to load conflict detail', error);
        setPhase({
          status: 'error',
          message: error instanceof Error ? error.message : '纠纷详情加载失败',
        });
      }
    }
  }, []);

  // mutation 后的显式读回：不得把 phase 改回 loading，不得卸载现有详情或 Dialog；
  // undefined/not-found/异常一律按读回失败返回 null，过期返回 'stale' 不做任何落地。
  const readBackAfterMutation = useCallback(async (
    targetId: string,
    mutationGeneration: number,
  ): Promise<MobileConflictDetailResult | 'stale' | null> => {
    const isMutationScopeStale = () => (
      !mountedRef.current
      || idRef.current !== targetId
      || mutationGenRef.current !== mutationGeneration
    );
    // 必须在递增 request generation 或发 GET 前拦住旧案件 mutation。
    if (isMutationScopeStale()) {
      return 'stale';
    }
    const generation = ++requestGenRef.current;
    const isStale = () => (
      isMutationScopeStale() || requestGenRef.current !== generation
    );
    try {
      const result = await conflictFacade.getConflictDetail(targetId);
      if (isStale()) {
        return 'stale';
      }
      return result ?? null;
    } catch (error) {
      if (isStale()) {
        return 'stale';
      }
      console.error('Failed to reload conflict detail after mutation', error);
      return null;
    }
  }, []);

  // 每轮加载只调用一次 facade.getConflictDetail，由 facade 返回 conflict + context；
  // session temp id 由 facade 内部处理，绝不直接请求 temp-ID API。
  useEffect(() => {
    if (mode === 'checking') {
      return;
    }

    void readDetail(true);
    const unsubscribe = conflictFacade.subscribe(() => {
      // facade 未暴露 event payload；任一自身 mutation 尚未 settle 时，该同步 change
      // 必属于当前组件发起流程的可能窗口，不得刷新当前（即使已从 A 切到 B）。
      if (pendingOwnMutationTokensRef.current.size > 0) {
        return;
      }
      void readDetail(true);
    });
    return () => {
      unsubscribe();
    };
  }, [id, mode, reloadToken, readDetail]);

  // addProgress 与 markResolved 共用同一套安全语义：
  // 1) 调用前以 ref 同步标记自身 mutation；2) 成功后只显式读回一次；
  // 3) mutation 失败与读回失败分开处理；4) 读回失败锁定两条 mutation 路径。
  const runMutation = async (
    path: 'progress' | 'resolve',
    targetId: string,
    mutate: () => Promise<unknown>,
  ): Promise<void> => {
    const mutationGeneration = ++mutationGenRef.current;
    pendingOwnMutationTokensRef.current.add(mutationGeneration);
    ownMutationRef.current = { targetId, generation: mutationGeneration };
    const isMutationScopeStale = () => (
      !mountedRef.current
      || idRef.current !== targetId
      || mutationGenRef.current !== mutationGeneration
    );
    const clearOwnMutation = () => {
      if (ownMutationRef.current?.generation === mutationGeneration) {
        ownMutationRef.current = null;
      }
    };
    const settleOwnMutation = () => {
      pendingOwnMutationTokensRef.current.delete(mutationGeneration);
      clearOwnMutation();
    };
    try {
      await mutate();
    } catch (error) {
      // mutation 本身失败：保留现有失败语义，可重新提交
      settleOwnMutation();
      if (isMutationScopeStale()) {
        return;
      }
      if (path === 'progress') {
        console.error('Failed to add progress', error);
        setProgressError(error instanceof Error ? error.message : '进展记录添加失败，请稍后重试');
        toast.error('进展记录添加失败');
      } else {
        console.error('Failed to mark conflict resolved', error);
        setResolveError(error instanceof Error ? error.message : '状态更新失败，请稍后重试');
        toast.error('状态更新失败');
      }
      return;
    }
    if (isMutationScopeStale()) {
      settleOwnMutation();
      // A→B→A：旧 A 的 session emit 曾被 pending token 抑制；若当前又回到 A，
      // settle 后须补一次新的 generation-guarded read，使 detail/context 与 session 同源。
      if (mountedRef.current && idRef.current === targetId) {
        void readDetail(false);
      }
      return;
    }
    const outcome = await readBackAfterMutation(targetId, mutationGeneration);
    settleOwnMutation();
    if (outcome === 'stale') {
      return;
    }
    if (!outcome) {
      // mutation 已成功但读回失败：保持 phase=ready、保留旧 conflict/context 与 Dialog，
      // 不显示普通成功；锁定 mutation，直到“重新读取”成功
      setReadFailure({ path, targetId, mutationGeneration });
      return;
    }
    setConflict(outcome.conflict);
    setContext(outcome.context);
    if (path === 'progress') {
      setProgressContent('');
      setIsDialogOpen(false);
      toast.success('进展记录已添加');
    } else {
      setResolveConfirmOpen(false);
      toast.success('状态已更新');
    }
  };

  // “重新读取”只允许调用 getConflictDetail：不得再次 mutation、追加 timeline 或写 sessionStorage
  const handleReRead = async () => {
    if (!readFailure || isReReading) {
      return;
    }
    const failure = readFailure;
    setIsReReading(true);
    const outcome = await readBackAfterMutation(failure.targetId, failure.mutationGeneration);
    if (outcome === 'stale') {
      // 同 id 的更新请求若让本次读回过期，仍须恢复按钮；跨 id/unmount 则由路由 effect 清理。
      if (
        mountedRef.current
        && idRef.current === failure.targetId
        && mutationGenRef.current === failure.mutationGeneration
      ) {
        setIsReReading(false);
      }
      return;
    }
    if (outcome) {
      setConflict(outcome.conflict);
      setContext(outcome.context);
      setReadFailure(null);
      setProgressContent('');
      setIsDialogOpen(false);
      setResolveConfirmOpen(false);
    }
    if (
      mountedRef.current
      && idRef.current === failure.targetId
      && mutationGenRef.current === failure.mutationGeneration
    ) {
      setIsReReading(false);
    }
  };

  const relatedPolicies = useMemo(
    () => (conflict && context ? buildPolicyCards(conflict, context) : []),
    [conflict, context],
  );
  const scripts = useMemo(
    () => (conflict && context ? buildScriptCards(conflict, context) : []),
    [conflict, context],
  );

  const handleAddProgress = async () => {
    if (!conflict || !progressContent.trim() || isSubmittingProgress || readFailure || ownMutationRef.current) {
      return;
    }

    const targetId = conflict.id;
    setIsSubmittingProgress(true);
    setProgressError(null);
    try {
      await runMutation('progress', targetId, () => conflictFacade.addProgress(targetId, {
        date: formatNow(),
        content: progressContent.trim(),
        operator: mobileContextRepository.getCurrentWorkerName(),
      }));
    } finally {
      if (mountedRef.current && idRef.current === targetId) {
        setIsSubmittingProgress(false);
      }
    }
  };

  const handleMarkResolved = async () => {
    if (!conflict || isResolving || readFailure || ownMutationRef.current) {
      return;
    }

    const targetId = conflict.id;
    setIsResolving(true);
    setResolveError(null);
    try {
      await runMutation('resolve', targetId, () => conflictFacade.markResolved(targetId, {
        date: formatNow(),
        content: '网格员标记该纠纷已化解',
        operator: mobileContextRepository.getCurrentWorkerName(),
      }));
    } finally {
      if (mountedRef.current && idRef.current === targetId) {
        setIsResolving(false);
      }
    }
  };

  if (mode === 'checking' || phase.status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-neutral-01)]" data-testid="conflict-detail-loading" role="status">
        <Loader2 className="w-8 h-8 text-[var(--color-brand-text)] animate-spin" />
        <span className="sr-only">正在加载矛盾详情</span>
      </div>
    );
  }

  if (phase.status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[var(--color-neutral-01)] px-6" data-testid="conflict-detail-error">
        <p role="alert" className="text-center text-sm text-[var(--color-status-error-text)]">
          纠纷详情加载失败：{phase.message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            data-testid="conflict-detail-retry"
            onClick={() => setReloadToken((token) => token + 1)}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--color-neutral-03)] px-4 text-sm text-[var(--color-neutral-10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
          >
            <RotateCcw className="w-4 h-4" />
            重新加载
          </button>
          <Button variant="outline" className="min-h-[44px]" onClick={onBack}>返回</Button>
        </div>
      </div>
    );
  }

  if (phase.status === 'not-found' || !conflict || !context) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[var(--color-neutral-01)]" data-testid="conflict-detail-not-found">
        <p className="text-[var(--color-neutral-08)]">未找到记录</p>
        <Button className="min-h-[44px]" onClick={onBack}>返回</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-neutral-01)]" data-testid="conflict-detail">
      <MobileDetailHeader
        title="纠纷详情"
        onBack={onBack}
        action={
          <Badge data-testid="conflict-detail-status" className={conflict.status === '已化解' ? 'bg-[var(--color-status-success)] text-white border-0' : 'bg-[var(--color-status-warning)] text-white border-0'}>
            {conflict.status}
          </Badge>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-neutral-11)] mb-2" data-testid="conflict-detail-title">{conflict.title}</h2>
              <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-08)] mb-4">
                <span className="bg-[var(--color-neutral-02)] px-2 py-0.5 rounded text-[var(--color-neutral-10)]">{conflict.source}</span>
                <span>•</span>
                <span>{conflict.type}</span>
                <span>•</span>
                <span>{conflict.createdAt.split(' ')[0]}</span>
              </div>
              <p className="text-sm text-[var(--color-neutral-10)] leading-relaxed bg-[var(--color-neutral-01)] p-3 rounded-lg border border-[var(--color-neutral-03)]">
                {conflict.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[var(--color-neutral-08)] mt-0.5" />
                <span className="text-sm text-[var(--color-neutral-10)]">{conflict.location}</span>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-[var(--color-neutral-08)] mt-0.5" />
                <div className="flex flex-wrap gap-1.5">
                  {conflict.involvedParties.map((party) => (
                    <span key={`${party.type}-${party.id}`} className="text-sm text-[var(--color-brand-text)] bg-[var(--color-brand-primary)]/10 px-1.5 rounded">
                      {party.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {(context.relatedPeople.length > 0 || context.relatedHouse) && (
              <div className="pt-3 border-t border-[var(--color-neutral-03)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-neutral-08)]">关联对象</span>
                  <span className="text-[10px] text-[var(--color-neutral-08)]">可直接跳转查看</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {context.relatedPeople.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      data-testid={`conflict-related-person-${person.id}`}
                      onClick={() => onRouteChange?.(`person-detail/${person.id}`)}
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/10 px-3 text-xs text-[var(--color-brand-text)] active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                    >
                      <Users className="w-3 h-3" />
                      {person.name}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ))}
                  {context.relatedHouse && (
                    <button
                      type="button"
                      data-testid="conflict-related-house"
                      onClick={() => onRouteChange?.(`house-detail/${context.relatedHouse!.id}`)}
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-[var(--color-status-success)]/35 bg-[var(--color-status-success-soft)] px-3 text-xs text-[var(--color-status-success-text)] active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                    >
                      <MapPin className="w-3 h-3" />
                      {context.relatedHouse.address}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {conflict.images && conflict.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {conflict.images.map((img, index) => (
                  <div key={`${img}-${index}`} className="aspect-square bg-[var(--color-neutral-02)] rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="附件" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-[var(--color-brand-text)]" />
              <h3 className="text-sm font-bold text-[var(--color-neutral-11)]">案件推导</h3>
              <Badge className="ml-auto bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-text)] border-0 text-[10px]">
                {context.followUpStatus.label}
              </Badge>
            </div>

            <div className="flex bg-[var(--color-neutral-01)] rounded-lg p-0.5 mb-4">
              <button
                type="button"
                onClick={() => setAiTab('policy')}
                aria-pressed={aiTab === 'policy'}
                className={`flex-1 min-h-[44px] text-xs font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
                  aiTab === 'policy'
                    ? 'bg-[var(--color-neutral-02)] text-[var(--color-brand-text)] shadow-sm'
                    : 'text-[var(--color-neutral-08)] hover:text-[var(--color-neutral-10)]'
                }`}
              >
                关联政策法规
              </button>
              <button
                type="button"
                onClick={() => setAiTab('script')}
                aria-pressed={aiTab === 'script'}
                className={`flex-1 min-h-[44px] text-xs font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] ${
                  aiTab === 'script'
                    ? 'bg-[var(--color-neutral-02)] text-[var(--color-brand-text)] shadow-sm'
                    : 'text-[var(--color-neutral-08)] hover:text-[var(--color-neutral-10)]'
                }`}
              >
                话术推荐
              </button>
            </div>

            {aiTab === 'policy' && (
              <div className="space-y-3">
                {relatedPolicies.map((policy, index) => (
                  <div
                    key={`${policy.title}-${index}`}
                    className="bg-[var(--color-neutral-01)] p-4 rounded-[4px] border border-[var(--color-neutral-03)] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-[var(--color-neutral-11)] leading-snug mb-1">
                          {policy.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-neutral-08)]">
                          <span className="bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-text)] px-2 py-0.5 rounded font-medium">
                            {policy.source}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[var(--color-neutral-02)] p-3 rounded-lg mb-2.5 border border-[var(--color-neutral-03)]">
                      <p className="text-xs text-[var(--color-neutral-11)] leading-relaxed">
                        {policy.summary}
                      </p>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-[var(--color-brand-primary)] shrink-0 mt-1.5" />
                      <p className="text-xs text-[var(--color-brand-text)] leading-relaxed flex-1">
                        <span className="font-medium">适用场景：</span>{policy.relevance}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-[var(--color-neutral-03)]">
                  <div className="bg-[var(--color-neutral-02)] rounded-lg p-3 border-l-2 border-[var(--color-brand-primary)]">
                    <p className="text-xs text-[var(--color-neutral-10)] leading-relaxed">
                      <span className="font-medium text-[var(--color-neutral-10)]">提示</span>
                      <span className="ml-1">
                        以上内容由纠纷类型、关联对象和回访状态自动推导，不调用大模型。
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {aiTab === 'script' && (
              <div className="space-y-3">
                {scripts.map((item, index) => (
                  <div
                    key={`${item.scenario}-${index}`}
                    className="bg-[var(--color-neutral-01)] p-4 rounded-[4px] border border-[var(--color-neutral-03)] shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning-text)] text-[10px] font-medium px-2 py-0.5 rounded">
                        {item.scenario}
                      </span>
                      <span className="text-[10px] text-[var(--color-neutral-08)]">对象：{item.target}</span>
                    </div>

                    <div className="bg-[var(--color-brand-primary)]/10 p-3 rounded-lg mb-3 border border-[var(--color-brand-primary)]/20">
                      <p className="text-xs text-[var(--color-neutral-11)] leading-relaxed italic">
                        "{item.script}"
                      </p>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-[var(--color-status-warning)] shrink-0 mt-1.5" />
                      <p className="text-xs text-[var(--color-status-warning-text)] leading-relaxed flex-1">
                        <span className="font-medium">要点：</span>{item.tips}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-[var(--color-neutral-03)]">
                  <div className="bg-[var(--color-neutral-02)] rounded-lg p-3 border-l-2 border-[var(--color-status-warning)]">
                    <p className="text-xs text-[var(--color-neutral-10)] leading-relaxed">
                      <span className="font-medium text-[var(--color-neutral-10)]">提示</span>
                      <span className="ml-1">
                        以上话术由案件上下文和处置状态自动整理，沟通时保持中立、耐心倾听。
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h3 className="text-sm font-bold text-[var(--color-neutral-11)] mb-3 ml-1">处理进度</h3>
          <div className="space-y-4 pl-2" data-testid="conflict-timeline">
            {[...conflict.timeline].reverse().map((item, index) => (
              <div key={`${item.date}-${index}`} data-testid="conflict-timeline-entry" className="relative pl-6 pb-2 border-l-2 border-[var(--color-neutral-03)] last:border-0">
                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-[var(--color-brand-primary)] ring-4 ring-[var(--color-brand-primary)]/10" />
                <div className="text-xs text-[var(--color-neutral-08)] mb-1 flex justify-between pr-2">
                  <span>{item.date}</span>
                  <span>{item.operator}</span>
                </div>
                <div className="text-sm text-[var(--color-neutral-11)] bg-[var(--color-neutral-01)] p-3 rounded-lg shadow-sm border border-[var(--color-neutral-03)]">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-20" />
      </div>

      {conflict.status !== '已化解' && (
        <div className="bg-[var(--color-neutral-01)] border-t border-[var(--color-neutral-03)] p-3 pb-8 md:pb-3 space-y-2 sticky bottom-0 shadow-lg">
          <div className="flex gap-3">
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setProgressError(null); }}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  data-testid="conflict-add-progress"
                  className="flex-1 min-h-[44px] gap-2 border-[var(--color-brand-primary)]/30 text-[var(--color-brand-text)] bg-[var(--color-brand-primary)]/10 hover:bg-[var(--color-brand-primary)]/20"
                  disabled={!canMutate}
                >
                  <MessageSquarePlus className="w-4 h-4" /> 添加进展
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90%] rounded-xl [&>button]:hidden" data-testid="conflict-progress-dialog">
                <DialogHeader>
                  <DialogTitle>添加调解进展</DialogTitle>
                  <DialogDescription>
                    记录最新的调解情况、走访结果或下一步安排，提交后将写入处理进度。
                  </DialogDescription>
                  {/* 局部隐藏 shared primitive 的默认英文 Close（见上方 [&>button]:hidden），
                      以中文关闭按钮替代；Escape 与焦点恢复由 primitive 保留 */}
                  <DialogClose asChild>
                    <button
                      type="button"
                      aria-label="关闭添加调解进展对话框"
                      data-testid="conflict-progress-dialog-close"
                      className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </DialogClose>
                </DialogHeader>
                <div className="py-4 space-y-2">
                  <Label htmlFor="conflict-progress-input" className="sr-only">进展内容</Label>
                  <Textarea
                    id="conflict-progress-input"
                    data-testid="conflict-progress-input"
                    placeholder="请输入最新的调解情况、走访记录等..."
                    value={progressContent}
                    onChange={(event) => { setProgressContent(event.target.value); setProgressError(null); }}
                    className="min-h-[100px]"
                  />
                  {progressError && (
                    <p role="alert" data-testid="conflict-progress-error" className="text-xs text-[var(--color-status-error-text)]">{progressError}</p>
                  )}
                  {readFailure && (
                    <div role="alert" data-testid="conflict-progress-read-failure" className="rounded-lg border border-[var(--color-status-error)]/40 bg-[var(--color-status-error-soft)] px-3 py-2 text-xs text-[var(--color-status-error-text)]">
                      <p>写入成功，但最新详情读取失败。当前仍显示写入前详情，请点击“重新读取”获取最新状态。</p>
                      <button
                        type="button"
                        data-testid="conflict-progress-reread"
                        onClick={() => void handleReRead()}
                        disabled={isReReading}
                        className="mt-2 inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--color-status-error)]/40 px-4 text-[var(--color-status-error-text)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {isReReading ? '正在重新读取…' : '重新读取'}
                      </button>
                    </div>
                  )}
                </div>
                <DialogFooter className="flex-row gap-2 justify-end">
                  <DialogClose asChild>
                    <Button variant="ghost" className="min-h-[44px]" data-testid="conflict-progress-cancel">取消</Button>
                  </DialogClose>
                  <Button
                    onClick={handleAddProgress}
                    data-testid="conflict-progress-submit"
                    className="min-h-[44px]"
                    disabled={isSubmittingProgress || !canMutate || !progressContent.trim() || Boolean(readFailure)}
                  >
                    {isSubmittingProgress ? '提交中...' : '提交'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              className="flex-1 min-h-[44px] gap-2 bg-[var(--color-status-success)] hover:bg-[var(--color-status-success)]/90"
              data-testid="conflict-mark-resolved"
              onClick={() => { setResolveError(null); setResolveConfirmOpen(true); }}
              disabled={!canMutate || isResolving}
            >
              <ShieldCheck className="w-4 h-4" /> {isResolving ? '提交中...' : '标记化解'}
            </Button>

            <Dialog open={resolveConfirmOpen} onOpenChange={(open) => { setResolveConfirmOpen(open); if (!open) setResolveError(null); }}>
              <DialogContent className="max-w-[90%] rounded-xl [&>button]:hidden" data-testid="conflict-resolve-dialog">
                <DialogHeader>
                  <DialogTitle>标记已化解</DialogTitle>
                  <DialogDescription>
                    确认将此纠纷标记为已化解吗？该操作会同步更新处理进度记录。
                  </DialogDescription>
                  <DialogClose asChild>
                    <button
                      type="button"
                      aria-label="关闭标记已化解对话框"
                      data-testid="conflict-resolve-dialog-close"
                      className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-02)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </DialogClose>
                </DialogHeader>
                {resolveError && (
                  <div role="alert" data-testid="conflict-resolve-error" className="rounded-lg border border-[var(--color-status-error)]/40 bg-[var(--color-status-error-soft)] px-3 py-2 text-xs text-[var(--color-status-error-text)]">
                    {resolveError}
                  </div>
                )}
                {readFailure && (
                  <div role="alert" data-testid="conflict-resolve-read-failure" className="rounded-lg border border-[var(--color-status-error)]/40 bg-[var(--color-status-error-soft)] px-3 py-2 text-xs text-[var(--color-status-error-text)]">
                    <p>写入成功，但最新详情读取失败。当前仍显示写入前详情，请点击“重新读取”获取最新状态。</p>
                    <button
                      type="button"
                      data-testid="conflict-resolve-reread"
                      onClick={() => void handleReRead()}
                      disabled={isReReading}
                      className="mt-2 inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[var(--color-status-error)]/40 px-4 text-[var(--color-status-error-text)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {isReReading ? '正在重新读取…' : '重新读取'}
                    </button>
                  </div>
                )}
                <DialogFooter className="flex-row gap-2 justify-end">
                  <DialogClose asChild>
                    <Button variant="ghost" className="min-h-[44px]" data-testid="conflict-resolve-cancel">取消</Button>
                  </DialogClose>
                  <Button
                    onClick={() => void handleMarkResolved()}
                    data-testid="conflict-resolve-confirm"
                    className="min-h-[44px] bg-[var(--color-status-success)] hover:bg-[var(--color-status-success)]/90"
                    disabled={isResolving || Boolean(readFailure)}
                  >
                    {isResolving ? '提交中...' : '标记化解'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </div>
  );
}
