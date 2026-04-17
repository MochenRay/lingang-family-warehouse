import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  MapPin,
  Users,
  ShieldCheck,
  MessageSquarePlus,
  Loader2,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
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
import { MobileStatusBar } from '../MobileStatusBar';
import { conflictRepository, type ConflictContext } from '../../../services/repositories/conflictRepository';
import { mobileContextRepository } from '../../../services/repositories/mobileContextRepository';
import type { ConflictRecord } from '../../../types/core';
import { toast } from 'sonner';

interface MobileConflictDetailProps {
  id: string;
  onBack: () => void;
  onRouteChange?: (route: string) => void;
}

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

function getCurrentWorkerName() {
  return mobileContextRepository.getCurrentWorkerName();
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
  const primaryTarget = primaryPerson ? `${primaryPerson.name}${primaryPerson.risk ? `（${primaryPerson.risk}风险）` : ''}` : '当事人';
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

async function loadConflictDetail(id: string) {
  const conflict = await conflictRepository.getConflict(id);
  if (!conflict) {
    return null;
  }
  const context = await conflictRepository.getConflictContext(id);
  return { conflict, context };
}

export function MobileConflictDetail({ id, onBack, onRouteChange }: MobileConflictDetailProps) {
  const [conflict, setConflict] = useState<ConflictRecord | null>(null);
  const [context, setContext] = useState<ConflictContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressContent, setProgressContent] = useState('');
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [aiTab, setAiTab] = useState<'policy' | 'script'>('policy');

  const reloadConflict = async () => {
    const next = await loadConflictDetail(id);
    setConflict(next?.conflict ?? null);
    setContext(next?.context ?? null);
    return next;
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      try {
        const next = await loadConflictDetail(id);
        if (!active) {
          return;
        }
        setConflict(next?.conflict ?? null);
        setContext(next?.context ?? null);
      } catch (error) {
        console.error('Failed to load conflict detail', error);
        if (active) {
          setConflict(null);
          setContext(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [id]);

  const relatedPolicies = useMemo(
    () => (conflict && context ? buildPolicyCards(conflict, context) : []),
    [conflict, context],
  );
  const scripts = useMemo(
    () => (conflict && context ? buildScriptCards(conflict, context) : []),
    [conflict, context],
  );

  const handleAddProgress = async () => {
    if (!conflict || !progressContent.trim()) {
      return;
    }

    setIsSubmittingProgress(true);
    try {
      const now = new Date().toLocaleString();
      const nextTimeline = [
        ...conflict.timeline,
        {
          date: now,
          content: progressContent.trim(),
          operator: getCurrentWorkerName(),
        },
      ];

      await conflictRepository.updateConflict(conflict.id, {
        timeline: nextTimeline,
        updatedAt: now,
      });

      await reloadConflict();
      setProgressContent('');
      setIsDialogOpen(false);
      toast.success('进展记录已添加');
    } catch (error) {
      console.error('Failed to add progress', error);
      toast.error('进展记录添加失败');
    } finally {
      setIsSubmittingProgress(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!conflict) {
      return;
    }
    if (!window.confirm('确认将此纠纷标记为已化解吗？')) {
      return;
    }

    try {
      const now = new Date().toLocaleString();
      const nextTimeline = [
        ...conflict.timeline,
        {
          date: now,
          content: '网格员标记该纠纷已化解',
          operator: getCurrentWorkerName(),
        },
      ];

      await conflictRepository.updateConflict(conflict.id, {
        status: '已化解',
        updatedAt: now,
        timeline: nextTimeline,
      });

      await reloadConflict();
      toast.success('状态已更新');
    } catch (error) {
      console.error('Failed to mark conflict resolved', error);
      toast.error('状态更新失败');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!conflict || !context) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-500">未找到记录</p>
        <Button onClick={onBack}>返回</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-gradient-to-b from-[var(--color-neutral-01)] to-[var(--color-neutral-02)] border-b border-[var(--color-neutral-03)] sticky top-0 z-10 shrink-0">
        <MobileStatusBar variant="dark" />
        <div className="px-4 py-3 flex items-center gap-3 relative h-11">
          <button
            onClick={onBack}
            className="absolute left-2 w-8 h-8 flex items-center justify-center text-[var(--color-neutral-10)] active:opacity-70"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-base font-bold text-[var(--color-neutral-11)]">纠纷详情</h1>
          </div>

          <div className="absolute right-4">
            <Badge className={conflict.status === '已化解' ? 'bg-green-600 text-white border-0' : 'bg-orange-500 text-white border-0'}>
              {conflict.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{conflict.title}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{conflict.source}</span>
                <span>•</span>
                <span>{conflict.type}</span>
                <span>•</span>
                <span>{conflict.createdAt.split(' ')[0]}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                {conflict.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-sm text-gray-600">{conflict.location}</span>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex flex-wrap gap-1.5">
                  {conflict.involvedParties.map((party) => (
                    <span key={`${party.type}-${party.id}`} className="text-sm text-gray-600 bg-blue-50 px-1.5 rounded text-blue-700">
                      {party.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {(context.relatedPeople.length > 0 || context.relatedHouse) && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">关联对象</span>
                  <span className="text-[10px] text-gray-400">可直接跳转查看</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {context.relatedPeople.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => onRouteChange?.(`person-detail/${person.id}`)}
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 active:opacity-80"
                    >
                      <Users className="w-3 h-3" />
                      {person.name}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ))}
                  {context.relatedHouse && (
                    <button
                      type="button"
                      onClick={() => onRouteChange?.(`house-detail/${context.relatedHouse.id}`)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 active:opacity-80"
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
                  <div key={`${img}-${index}`} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
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
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">案件推导</h3>
              <Badge className="ml-auto bg-blue-50 text-blue-700 border-0 text-[10px]">
                {context.followUpStatus.label}
              </Badge>
            </div>

            <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4">
              <button
                onClick={() => setAiTab('policy')}
                className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${
                  aiTab === 'policy'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                关联政策法规
              </button>
              <button
                onClick={() => setAiTab('script')}
                className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${
                  aiTab === 'script'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
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
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 leading-snug mb-1">
                          {policy.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                            {policy.source}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mb-2.5 border border-gray-100">
                      <p className="text-xs text-gray-800 leading-relaxed">
                        {policy.summary}
                      </p>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      <p className="text-xs text-blue-700 leading-relaxed flex-1">
                        <span className="font-medium">适用场景：</span>{policy.relevance}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-3 border-l-2 border-blue-500">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-medium text-gray-700">提示</span>
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
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-orange-50 text-orange-700 text-[10px] font-medium px-2 py-0.5 rounded">
                        {item.scenario}
                      </span>
                      <span className="text-[10px] text-gray-400">对象：{item.target}</span>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-100">
                      <p className="text-xs text-gray-800 leading-relaxed italic">
                        "{item.script}"
                      </p>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                      <p className="text-xs text-orange-700 leading-relaxed flex-1">
                        <span className="font-medium">要点：</span>{item.tips}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-3 border-l-2 border-orange-400">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <span className="font-medium text-gray-700">提示</span>
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
          <h3 className="text-sm font-bold text-gray-900 mb-3 ml-1">处理进度</h3>
          <div className="space-y-4 pl-2">
            {[...conflict.timeline].reverse().map((item, index) => (
              <div key={`${item.date}-${index}`} className="relative pl-6 pb-2 border-l-2 border-gray-200 last:border-0">
                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                <div className="text-xs text-gray-400 mb-1 flex justify-between pr-2">
                  <span>{item.date}</span>
                  <span>{item.operator}</span>
                </div>
                <div className="text-sm text-gray-800 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-20" />
      </div>

      {conflict.status !== '已化解' && (
        <div className="bg-white border-t border-gray-100 p-3 pb-8 md:pb-3 flex gap-3 sticky bottom-0 shadow-lg">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                <MessageSquarePlus className="w-4 h-4" /> 添加进展
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90%] rounded-xl">
              <DialogHeader>
                <DialogTitle>添加调解进展</DialogTitle>
                <DialogDescription className="sr-only">
                  输入最新的调解进展记录
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="请输入最新的调解情况、走访记录等..."
                  value={progressContent}
                  onChange={(event) => setProgressContent(event.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <DialogFooter className="flex-row gap-2 justify-end">
                <DialogClose asChild>
                  <Button variant="ghost">取消</Button>
                </DialogClose>
                <Button onClick={handleAddProgress} disabled={isSubmittingProgress}>
                  {isSubmittingProgress ? '提交中...' : '提交'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            onClick={handleMarkResolved}
          >
            <ShieldCheck className="w-4 h-4" /> 标记化解
          </Button>
        </div>
      )}
    </div>
  );
}
