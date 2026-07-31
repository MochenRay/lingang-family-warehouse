import { useEffect, useState } from 'react';
import { Calendar, User, MapPin, Home, CheckCircle2, AlertCircle, Lightbulb, Loader2, Sparkles, Clock } from 'lucide-react';
import { MobileDetailHeader } from './MobileDetailHeader';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Person, VisitRecord } from '../../types/core';
import { toast } from 'sonner';
import {
  personVisitFacade,
  type PersonAiPolicy,
} from '../../services/mobileSandbox/personVisitFacade';
import type { SecondaryAiChatResult } from '../../services/repositories/secondaryAiRepository';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';
import { useMobileSandbox } from './MobileSandboxProvider';

interface MobileVisitFormProps {
  personId: string;
  onBack: () => void;
  onSaved?: () => void;
}

export function MobileVisitForm({ personId, onBack, onSaved }: MobileVisitFormProps) {
  const { mode, canMutate } = useMobileSandbox();
  const [person, setPerson] = useState<Person | null>(null);
  const [recentVisits, setRecentVisits] = useState<VisitRecord[]>([]);
  const [aiPolicy, setAiPolicy] = useState<PersonAiPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aiRequesting, setAiRequesting] = useState(false);
  const [aiResult, setAiResult] = useState<SecondaryAiChatResult | null>(null);
  const [aiGrounded, setAiGrounded] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 表单数据；走访人默认取当前登录网格员，输入框可见且必填，不静默硬编码
  const [formData, setFormData] = useState(() => ({
    visitorName: mobileContextRepository.getCurrentWorkerName(),
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: new Date().toTimeString().slice(0, 5),
    visitPurpose: '',
    visitType: '日常走访',

    // 人员在家情况
    isHome: 'yes',
    notHomeReason: '',

    // 走访详情（网格员手工填写，提交时原样写入走访内容）
    healthStatus: '',
    livingSituation: '',
    needsAssistance: '',
    safetyCheck: '',
    familyRelationship: '',
    houseCondition: '',
    houseRisk: '',
    otherInfo: '',
    nextVisitPlan: '',
  }));

  useEffect(() => {
    // facade 以当前数据模式为准；模式未确认前不发起任何读取
    if (mode === 'checking') {
      return;
    }
    let alive = true;

    const loadContext = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const personData = await personVisitFacade.getPerson(personId);
        if (!alive) {
          return;
        }

        if (!personData) {
          setPerson(null);
          setRecentVisits([]);
          setAiPolicy(null);
          return;
        }

        const [visitData, policy] = await Promise.all([
          personVisitFacade.listVisits({ targetId: personId, targetType: 'person', limit: 20 }),
          personVisitFacade.getPersonAiPolicy(personId),
        ]);

        if (!alive) {
          return;
        }

        setPerson(personData);
        setRecentVisits([...visitData.items].sort((left, right) => right.date.localeCompare(left.date)));
        setAiPolicy(policy);
      } catch (error) {
        console.error('Failed to load mobile visit form context', error);
        if (!alive) {
          return;
        }
        setPerson(null);
        setRecentVisits([]);
        setAiPolicy(null);
        setLoadError(error instanceof Error ? error.message : '走访对象信息加载失败');
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    };

    void loadContext();
    const unsubscribe = personVisitFacade.subscribe(() => {
      void loadContext();
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [personId, mode, reloadToken]);

  const getVisitGuidance = (currentPerson: Person) => {
    const guidance: string[] = [];

    // Age based
    if (currentPerson.age >= 60) {
      guidance.push("老年人走访：重点关注身体状况、饮食起居及用气用电安全。");
    }

    // Tags based
    if (currentPerson.tags.some(t => t.includes('失独'))) {
      guidance.push("失独家庭：避免主动谈及子女话题，多倾听，给予精神慰藉，避免触景生情。");
    }
    if (currentPerson.tags.some(t => t.includes('慢性病') || t.includes('重病') || t.includes('高血压') || t.includes('糖尿病'))) {
      guidance.push("患病人员：关心近期病情变化、服药情况，询问是否需要医疗救助。");
    }
    if (currentPerson.tags.some(t => t.includes('孕妇'))) {
      guidance.push("孕产妇：关心预产期及产检情况，宣传优生优育知识，了解是否有特殊需求。");
    }
    if (currentPerson.tags.some(t => t.includes('残疾'))) {
      guidance.push("残疾人：了解康复需求及辅助器具使用情况，查看无障碍设施是否便利。");
    }
    if (currentPerson.tags.some(t => t.includes('低保') || t.includes('困难'))) {
      guidance.push("困难群体：核实各项救助政策落实情况，了解近期生活是否有新困难。");
    }

    // Family situation
    if (currentPerson.familyRelations && currentPerson.familyRelations.length === 0 && currentPerson.age > 60) {
       guidance.push("独居老人：家中无其他关联亲属，需特别留意居家安全及精神状态。");
    }

    // Default
    if (guidance.length === 0) {
      guidance.push("常规走访：了解近期生活状况，收集社情民意，宣传近期惠民政策。");
    }

    return guidance;
  };

  const handleGenerateOutline = async () => {
    // AI 请求进行中禁止重复提交
    if (aiRequesting || !person || !aiPolicy?.allowed) {
      return;
    }
    setAiRequesting(true);
    setAiError(null);

    try {
      const response = await personVisitFacade.requestVisitOutline(person.id);
      setAiPolicy(response.policy);
      if (!response.allowed) {
        setAiResult(null);
        setAiGrounded(false);
        return;
      }
      setAiResult(response.result);
      setAiGrounded(response.grounded);
    } catch (error) {
      console.error('Failed to request visit outline', error);
      setAiError(error instanceof Error ? error.message : '未知错误');
    } finally {
      setAiRequesting(false);
    }
  };

  // 仅当 facade 判定 grounded（live + gemini + context_applied）时才标示 Gemini 对象化；
  // 其他状态按真实 provider/model/status 表达
  const aiStatusText = aiRequesting
    ? '请求中…'
    : aiResult
      ? aiGrounded
        ? 'Gemini live · 对象化'
        : `${aiResult.provider ?? '本地'} ${aiResult.status}${aiResult.model ? ` · ${aiResult.model}` : ''}`
      : aiPolicy && !aiPolicy.allowed
        ? '会话新建人员不可用'
        : '待生成';

  const handleSubmit = async () => {
    if (isSubmitting || !person) {
      return;
    }

    const visitorName = formData.visitorName.trim();
    if (!visitorName) {
      toast.error('请填写走访人姓名');
      return;
    }
    if (!formData.visitDate) {
      toast.error('请选择走访日期');
      return;
    }
    if (!formData.visitPurpose.trim()) {
      toast.error('请填写走访目的');
      return;
    }
    if (formData.isHome === 'no' && !formData.notHomeReason.trim()) {
      toast.error('请填写不在家原因');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // 构建走访内容
    const content = `
【走访类型】${formData.visitType}
【走访目的】${formData.visitPurpose}
【人员在家】${formData.isHome === 'yes' ? '是' : '否'}
${formData.isHome === 'no' ? `【不在家原因】${formData.notHomeReason}` : ''}

${formData.healthStatus ? `【健康状况】${formData.healthStatus}` : ''}
${formData.livingSituation ? `【生活情况】${formData.livingSituation}` : ''}
${formData.needsAssistance ? `【需求协助】${formData.needsAssistance}` : ''}
${formData.safetyCheck ? `【安全检查】${formData.safetyCheck}` : ''}
${formData.familyRelationship ? `【家庭关系】${formData.familyRelationship}` : ''}
${formData.houseCondition ? `【房屋情况】${formData.houseCondition}` : ''}
${formData.houseRisk ? `【房屋隐患】${formData.houseRisk}` : ''}
${formData.otherInfo ? `【其他信息】${formData.otherInfo}` : ''}
${formData.nextVisitPlan ? `【下次计划】${formData.nextVisitPlan}` : ''}
    `.trim();

    try {
      await personVisitFacade.createPersonVisit(person.id, {
        visitorName,
        date: `${formData.visitDate} ${formData.visitTime}`,
        content,
        images: [],
        tags: [formData.visitType, ...(formData.houseRisk.trim() ? ['房屋隐患'] : [])],
      });
      toast.success('走访记录已保存');
      onSaved?.();
    } catch (error) {
      console.error('Failed to submit visit record', error);
      setSubmitError('走访记录保存失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visitTips = person ? [
    person.risk === 'High' ? '高风险对象：本次走访请重点复核近况、用药与居家安全。' : null,
    recentVisits[0]
      ? `最近一次走访在 ${recentVisits[0].date}，本次重点跟进上次未闭环事项。`
      : '暂无历史走访，建议本次同步补齐联系电话、居住状态和主要诉求。',
    formData.isHome === 'no'
      ? '人员不在家：请说明去向，并约定下次上门时间。'
      : '如发现隐患或救助需求，请在走访详情中记录清楚，便于后续跟进。',
  ].filter((item): item is string => Boolean(item)) : [];

  if (isLoading || mode === 'checking') {
    return (
      <div className="h-full bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--color-brand-text)] animate-spin mx-auto mb-2" />
          <p className="text-[var(--color-text-tertiary)]">正在加载走访对象信息...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full bg-[var(--color-bg-primary)] flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-status-error-text)] mx-auto mb-2" />
          <p className="font-medium text-[var(--color-text-primary)]">走访对象信息加载失败</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1 break-all">{loadError}</p>
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="outline" className="min-h-[44px]" onClick={() => setReloadToken((token) => token + 1)}>重试</Button>
            <Button variant="outline" className="min-h-[44px]" onClick={onBack}>返回</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="h-full bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-text-quaternary)] mx-auto mb-2" />
          <p className="text-[var(--color-text-tertiary)]">未找到人员信息</p>
          <Button onClick={onBack} className="mt-4">返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--color-bg-primary)] flex flex-col overflow-hidden">
      {/* Header */}
      <MobileDetailHeader title="添加走访记录" onBack={onBack} />

      <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4">
        {/* 走访对象信息 */}
        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--color-brand-text)]" />
              走访对象
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center text-[var(--color-brand-text)] text-lg font-bold">
                {person.name[0]}
              </div>
              <div>
                <div className="text-base font-medium text-[var(--color-text-primary)]">{person.name}</div>
                <div className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
                  {person.gender} · {person.age}岁 · {person.type}
                </div>
                <div className="text-xs text-[var(--color-text-quaternary)] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {person.address}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 走访基本信息 */}
        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-status-success-text)]" />
              走访信息
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {/* 走访人 */}
            <div>
              <Label htmlFor="visit-visitor-name" className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                走访人 <span className="text-[var(--color-status-error-text)]">*</span>
              </Label>
              <Input
                id="visit-visitor-name"
                value={formData.visitorName}
                onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                placeholder="请输入走访人姓名"
                className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
              />
            </div>

            {/* 走访日期和时间 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="visit-date" className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                  走访日期 <span className="text-[var(--color-status-error-text)]">*</span>
                </Label>
                <Input
                  id="visit-date"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                />
              </div>
              <div>
                <Label htmlFor="visit-time" className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                  走访时间
                </Label>
                <Input
                  id="visit-time"
                  type="time"
                  value={formData.visitTime}
                  onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })}
                  className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                />
              </div>
            </div>

            {/* 走访类型 */}
            <div>
              <Label className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                走访类型 <span className="text-[var(--color-status-error-text)]">*</span>
              </Label>
              <Select value={formData.visitType} onValueChange={(value) => setFormData({ ...formData, visitType: value })}>
                <SelectTrigger className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="日常走访">日常走访</SelectItem>
                  <SelectItem value="重点走访">重点走访</SelectItem>
                  <SelectItem value="专项走访">专项走访</SelectItem>
                  <SelectItem value="节假日慰问">节假日慰问</SelectItem>
                  <SelectItem value="突发事件">突发事件</SelectItem>
                  <SelectItem value="信息核查">信息核查</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 走访目的 */}
            <div>
              <Label htmlFor="visit-purpose" className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                走访目的 <span className="text-[var(--color-status-error-text)]">*</span>
              </Label>
              <Textarea
                id="visit-purpose"
                data-testid="visit-purpose"
                value={formData.visitPurpose}
                onChange={(e) => setFormData({ ...formData, visitPurpose: e.target.value })}
                placeholder="请简要说明本次走访的目的"
                rows={3}
                className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] resize-none"
              />
            </div>
          </div>
        </Card>

        {/* 走访前准备 */}
        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[var(--color-status-warning-text)]" />
                走访前准备
              </h3>
              <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--color-status-warning-soft)] text-[var(--color-status-warning-text)] border border-[var(--color-status-warning)]/35">
                规则建议
              </span>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {getVisitGuidance(person).map((text, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-[var(--color-text-primary)]">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-status-warning)]"></span>
                  <span className="leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-[var(--color-border-primary)] pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                    <Sparkles className="h-4 w-4 text-[var(--color-accent-purple-text)]" />
                    走访提纲（AI 辅助）
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                    {aiPolicy
                      ? aiPolicy.allowed
                        ? `${aiPolicy.disclosure}仅向模型发送经裁剪的对象信号，不发送姓名、电话、证件号、地址或走访原文。`
                        : aiPolicy.disclosure
                      : '正在确认 AI 可用性…'}
                  </p>
                </div>
                <span
                  data-testid="visit-ai-status"
                  className="shrink-0 rounded-full border border-[var(--color-accent-purple)]/35 bg-[var(--color-accent-purple-soft)] px-2 py-1 text-[10px] text-[var(--color-accent-purple-text)]"
                >
                  {aiStatusText}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                data-testid="visit-ai-generate"
                className="w-full min-h-[44px] border-[var(--color-accent-purple)]/35 text-[var(--color-accent-purple-text)]"
                disabled={aiRequesting || !aiPolicy?.allowed}
                onClick={() => void handleGenerateOutline()}
              >
                {aiRequesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {aiRequesting ? '正在生成走访提纲' : '生成走访提纲'}
              </Button>
              {aiError && (
                <div role="alert" className="mt-3 rounded-lg border border-[var(--color-status-error)]/35 bg-[var(--color-status-error-soft)] p-3 text-xs text-[var(--color-status-error-text)]">
                  走访提纲生成失败：{aiError}
                </div>
              )}
              {aiResult && (
                <div data-testid="visit-ai-result" className="mt-3 rounded-lg border border-[var(--color-accent-purple)]/35 bg-[var(--color-accent-purple-soft)] p-3">
                  <div className="mb-2 text-[10px] text-[var(--color-accent-purple-text)]">
                    {aiGrounded
                      ? `Gemini 对象化结果（已应用服务器对象上下文）${aiResult.model ? ` · model: ${aiResult.model}` : ''}`
                      : `非对象化结果 · provider: ${aiResult.provider ?? '本地'} · status: ${aiResult.status}${aiResult.model ? ` · model: ${aiResult.model}` : ''} · 未应用对象上下文`}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-primary)]">
                    {aiResult.content}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--color-brand-text)]" />
              近期走访摘要
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {recentVisits.length > 0 ? (
              recentVisits.slice(0, 3).map((visit) => (
                <div key={visit.id} className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{visit.visitorName}</span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">{visit.date}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-3">
                    {visit.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-tertiary)]">
                暂无历史走访记录，本次建议优先补齐基础信息和诉求摘要。
              </p>
            )}
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-accent-purple-text)]" />
                走访提示
              </h3>
              <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--color-accent-purple-soft)] text-[var(--color-accent-purple-text)] border border-[var(--color-accent-purple)]/35">
                规则建议
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {visitTips.map((item) => (
              <div key={item} className="flex gap-2 text-sm text-[var(--color-text-primary)]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent-purple)]" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 人员在家情况 */}
        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <Home className="w-4 h-4 text-[var(--color-status-warning-text)]" />
              在家情况
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {/* 是否在家 */}
            <div>
              <Label className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                人员是否在家 <span className="text-[var(--color-status-error-text)]">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isHome: 'yes', notHomeReason: '' })}
                  className={`h-11 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    formData.isHome === 'yes'
                      ? 'border-[var(--color-status-success)] bg-[var(--color-status-success-soft)] text-[var(--color-status-success-text)]'
                      : 'border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  在家
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isHome: 'no' })}
                  className={`h-11 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    formData.isHome === 'no'
                      ? 'border-[var(--color-status-error)] bg-[var(--color-status-error-soft)] text-[var(--color-status-error-text)]'
                      : 'border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  不在家
                </button>
              </div>
            </div>

            {/* 不在家原因 */}
            {formData.isHome === 'no' && (
              <div>
                <Label htmlFor="visit-not-home-reason" className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                  不在家原因 <span className="text-[var(--color-status-error-text)]">*</span>
                </Label>
                <Textarea
                  id="visit-not-home-reason"
                  value={formData.notHomeReason}
                  onChange={(e) => setFormData({ ...formData, notHomeReason: e.target.value })}
                  placeholder="请说明人员不在家的原因及去向"
                  rows={2}
                  className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] resize-none"
                />
              </div>
            )}
          </div>
        </Card>

        {/* 走访详情 (仅在人员在家时展示；全部由网格员手工填写) */}
        {formData.isHome === 'yes' && (
          <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
            <div className="p-4 border-b border-[var(--color-border-primary)]">
              <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-text)]" />
                走访详情
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visit-health-status" className="text-sm text-[var(--color-text-secondary)]">健康状况</Label>
                <Textarea
                  id="visit-health-status"
                  value={formData.healthStatus}
                  onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                  placeholder="身体状况、用药情况等"
                  className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit-living-situation" className="text-sm text-[var(--color-text-secondary)]">生活情况</Label>
                <Textarea
                  id="visit-living-situation"
                  value={formData.livingSituation}
                  onChange={(e) => setFormData({ ...formData, livingSituation: e.target.value })}
                  placeholder="饮食起居、取暖供电等"
                  className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit-needs-assistance" className="text-sm text-[var(--color-text-secondary)]">需求协助</Label>
                <Textarea
                  id="visit-needs-assistance"
                  value={formData.needsAssistance}
                  onChange={(e) => setFormData({ ...formData, needsAssistance: e.target.value })}
                  placeholder="政策咨询、救助申请等诉求"
                  className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit-safety-check" className="text-sm text-[var(--color-text-secondary)]">安全检查</Label>
                <Textarea
                  id="visit-safety-check"
                  value={formData.safetyCheck}
                  onChange={(e) => setFormData({ ...formData, safetyCheck: e.target.value })}
                  placeholder="用气用电、房屋安全等检查情况"
                  className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visit-family-relationship" className="text-sm text-[var(--color-text-secondary)]">家庭关系</Label>
                  <Input
                    id="visit-family-relationship"
                    value={formData.familyRelationship}
                    onChange={(e) => setFormData({ ...formData, familyRelationship: e.target.value })}
                    className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visit-next-plan" className="text-sm text-[var(--color-text-secondary)]">下次计划</Label>
                  <Input
                    id="visit-next-plan"
                    value={formData.nextVisitPlan}
                    onChange={(e) => setFormData({ ...formData, nextVisitPlan: e.target.value })}
                    className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visit-house-condition" className="text-sm text-[var(--color-text-secondary)]">房屋情况</Label>
                  <Input
                    id="visit-house-condition"
                    value={formData.houseCondition}
                    onChange={(e) => setFormData({ ...formData, houseCondition: e.target.value })}
                    className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visit-house-risk" className="text-sm text-[var(--color-text-secondary)]">房屋隐患</Label>
                  <Input
                    id="visit-house-risk"
                    value={formData.houseRisk}
                    onChange={(e) => setFormData({ ...formData, houseRisk: e.target.value })}
                    placeholder="如有隐患请填写"
                    className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit-other-info" className="text-sm text-[var(--color-text-secondary)]">其他信息</Label>
                <Textarea
                  id="visit-other-info"
                  value={formData.otherInfo}
                  onChange={(e) => setFormData({ ...formData, otherInfo: e.target.value })}
                  className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)] resize-none"
                  rows={2}
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] p-4 safe-area-bottom sticky bottom-0 space-y-3">
        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-[4px] border border-[var(--color-status-error)]/35 bg-[var(--color-status-error-soft)] px-3 py-2 text-xs text-[var(--color-status-error-text)]"
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{submitError}</span>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 h-11 border-[var(--color-border-primary)] text-[var(--color-text-secondary)]"
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            data-testid="visit-submit"
            onClick={() => void handleSubmit()}
            className="flex-1 h-11 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)]"
            disabled={isSubmitting || !canMutate}
          >
            {isSubmitting ? '提交中...' : '提交记录'}
          </Button>
        </div>
      </div>
    </div>
  );
}
