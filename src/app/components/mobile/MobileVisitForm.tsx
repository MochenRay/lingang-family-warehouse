import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Calendar, User, Camera, MapPin, Home, CheckCircle2, AlertCircle, Lightbulb, Mic, Square, Loader2, Sparkles, RefreshCw, Clock } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Person, VisitRecord } from '../../types/core';
import { toast } from 'sonner';
import { personRepository } from '../../services/repositories/personRepository';
import { visitRepository } from '../../services/repositories/visitRepository';

interface MobileVisitFormProps {
  personId: string;
  onBack: () => void;
}

const MOCK_SPEECH_SEGMENTS = [
  "今天过来看看您身体怎么样？",
  "最近降温了，家里暖气热不热啊？",
  "高血压的药还在按时吃着吗？",
  "我看这厨房的燃气软管有点老化了，回头得换一下。",
  "儿子女儿最近回来的勤吗？",
  "有什么困难及时跟我们网格员说。",
  "那个高龄补贴的申请资料我们已经交上去了。",
  "行，那您多注意休息，我们改天再来看您。"
];

export function MobileVisitForm({ personId, onBack }: MobileVisitFormProps) {
  const [person, setPerson] = useState<Person | null>(null);
  const [recentVisits, setRecentVisits] = useState<VisitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 录音相关状态
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'processing' | 'done'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 表单数据
  const [formData, setFormData] = useState({
    visitorName: '李网格', // 默认当前网格员
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: new Date().toTimeString().slice(0, 5),
    visitPurpose: '',
    visitType: '日常走访',
    
    // 人员在家情况
    isHome: 'yes',
    notHomeReason: '',
    
    // 走访内容 (由AI生成)
    healthStatus: '',
    livingSituation: '',
    needsAssistance: '',
    safetyCheck: '',
    familyRelationship: '',
    houseCondition: '',
    houseRisk: '',
    otherInfo: '',
    nextVisitPlan: '',
    
    // 图片
    images: [] as string[],
  });

  useEffect(() => {
    let alive = true;

    const loadContext = async () => {
      setIsLoading(true);

      try {
        const [personData, visitData] = await Promise.all([
          personRepository.getPerson(personId),
          visitRepository.getVisits({ targetId: personId, targetType: 'person', limit: 20 }),
        ]);

        if (!alive) {
          return;
        }

        setPerson(personData ?? null);
        setRecentVisits([...visitData].sort((left, right) => right.date.localeCompare(left.date)));
      } catch (error) {
        console.error('Failed to load mobile visit form context', error);
        if (!alive) {
          return;
        }
        setPerson(null);
        setRecentVisits([]);
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    };

    void loadContext();
    const handleRefresh = () => {
      void loadContext();
    };
    window.addEventListener('db-change', handleRefresh);
    return () => {
      alive = false;
      window.removeEventListener('db-change', handleRefresh);
    };
  }, [personId]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // 录音逻辑
  const startRecording = () => {
    setRecordingStatus('recording');
    setTranscript('');
    setRecordingTime(0);

    // 计时器
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    timerIntervalRef.current = timer;

    // 逐段回填录音整理结果
    let segmentIndex = 0;
    const speech = setInterval(() => {
      if (segmentIndex < MOCK_SPEECH_SEGMENTS.length) {
        const text = MOCK_SPEECH_SEGMENTS[segmentIndex];
        setTranscript(prev => prev + (prev ? " " : "") + text);
        segmentIndex++;
      }
    }, 1500);
    speechIntervalRef.current = speech;
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
    setRecordingStatus('processing');

    // 录音结束后整理为走访草稿
    processingTimeoutRef.current = setTimeout(() => {
      processingTimeoutRef.current = null;
      setRecordingStatus('done');
      // 回填整理后的字段草稿
      setFormData(prev => ({
        ...prev,
        healthStatus: "老人自述身体状况良好，血压控制稳定，坚持按时服药。",
        livingSituation: "家中供暖正常，室内温度适宜；近期饮食起居规律。",
        safetyCheck: "检查发现厨房燃气软管轻微老化，已提醒老人注意，并计划联系维修人员上门更换。",
        familyRelationship: "子女周末常回来探望，家庭关系和睦。",
        needsAssistance: "询问了高龄补贴申请进度，已告知资料已提交。",
        nextVisitPlan: "下周回访检查燃气软管更换情况。",
        visitPurpose: "日常巡访，重点关注冬季取暖及用气安全。" // 自动填充目的
      }));
      toast.success("录音整理完成，已生成走访记录草稿");
    }, 2000);
  };

  const resetRecording = () => {
    setRecordingStatus('idle');
    setTranscript('');
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVisitGuidance = (person: Person) => {
    const guidance: string[] = [];

    // Age based
    if (person.age >= 60) {
      guidance.push("老年人走访：重点关注身体状况、饮食起居及用气用电安全。");
    }

    // Tags based
    if (person.tags.some(t => t.includes('失独'))) {
      guidance.push("失独家庭：避免主动谈及子女话题，多倾听，给予精神慰藉，避免触景生情。");
    }
    if (person.tags.some(t => t.includes('慢性病') || t.includes('重病') || t.includes('高血压') || t.includes('糖尿病'))) {
      guidance.push("患病人员：关心近期病情变化、服药情况，询问是否需要医疗救助。");
    }
    if (person.tags.some(t => t.includes('孕妇'))) {
      guidance.push("孕产妇：关心预产期及产检情况，宣传优生优育知识，了解是否有特殊需求。");
    }
    if (person.tags.some(t => t.includes('残疾'))) {
      guidance.push("残疾人：了解康复需求及辅助器具使用情况，查看无障碍设施是否便利。");
    }
    if (person.tags.some(t => t.includes('低保') || t.includes('困难'))) {
      guidance.push("困难群体：核实各项救助政策落实情况，了解近期生活是否有新困难。");
    }
    
    // Family situation
    if (person.familyRelations && person.familyRelations.length === 0 && person.age > 60) {
       guidance.push("独居老人：家中无其他关联亲属，需特别留意居家安全及精神状态。");
    }

    // Default
    if (guidance.length === 0) {
      guidance.push("常规走访：了解近期生活状况，收集社情民意，宣传近期惠民政策。");
    }

    return guidance;
  };

  const handleSubmit = async () => {
    // 验证必填项
    if (!formData.visitPurpose) {
      toast.error('请填写走访目的');
      return;
    }

    if (formData.isHome === 'no' && !formData.notHomeReason) {
      toast.error('请填写不在家原因');
      return;
    }

    setIsSubmitting(true);

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
      await visitRepository.addPersonVisit(personId, {
        gridId: person?.gridId || 'g1',
        visitorName: formData.visitorName,
        date: `${formData.visitDate} ${formData.visitTime}`,
        content,
        images: formData.images,
        tags: [formData.visitType, ...(formData.houseRisk ? ['房屋隐患'] : [])],
      });
      toast.success('走访记录已保存');
      onBack();
    } catch (error) {
      console.error('Failed to submit visit record', error);
      toast.error('走访记录保存失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todoSuggestions = [
    person?.risk === 'High' ? '建议提交后自动生成高风险回访任务，并同步给网格长。' : null,
    recentVisits[0] ? `最近一次走访在 ${recentVisits[0].date}，本次重点跟进上次未闭环事项。` : '暂无历史走访，建议本次同步补齐联系电话、居住状态和主要诉求。',
    formData.isHome === 'no' ? '建议补一条未见面走访说明，并安排再次上门时间。' : '若发现隐患或救助需求，提交后同步生成待办和回访计划。',
  ].filter((item): item is string => Boolean(item));

  if (isLoading) {
    return (
      <div className="h-full bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-[var(--color-text-tertiary)]">正在加载走访对象信息...</p>
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
      <div className="bg-[var(--color-bg-secondary)] sticky top-0 z-10 border-b border-[var(--color-border-primary)]">
        <MobileStatusBar variant="dark" />
        <div className="h-11 flex items-center justify-between px-4">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center -ml-2 text-[var(--color-text-primary)] active:bg-[var(--color-bg-tertiary)] rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-[var(--color-text-title)] font-semibold text-lg">添加走访记录</div>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4">
        {/* 走访对象信息 */}
        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              走访对象
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-lg font-bold">
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
              <Calendar className="w-4 h-4 text-green-600" />
              走访信息
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {/* 走访人 */}
            <div>
              <Label className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                走访人 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.visitorName}
                onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                placeholder="请输入走访人姓名"
                className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
              />
            </div>

            {/* 走访日期和时间 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                  走访日期 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                />
              </div>
              <div>
                <Label className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                  走访时间
                </Label>
                <Input
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
                走访类型 <span className="text-red-500">*</span>
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
              <Label className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                走访目的 <span className="text-red-500">*</span>
              </Label>
              <Textarea
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
                <Lightbulb className="w-4 h-4 text-amber-500" />
                走访前准备
              </h3>
              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                社工助手
              </span>
            </div>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {getVisitGuidance(person).map((text, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-[var(--color-text-primary)]">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
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
                <Sparkles className="w-4 h-4 text-purple-600" />
                待办建议
              </h3>
              <span className="text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                AI 推荐
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {todoSuggestions.map((item) => (
              <div key={item} className="flex gap-2 text-sm text-[var(--color-text-primary)]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 人员在家情况 */}
        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <Home className="w-4 h-4 text-orange-600" />
              在家情况
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {/* 是否在家 */}
            <div>
              <Label className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                人员是否在家 <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormData({ ...formData, isHome: 'yes', notHomeReason: '' })}
                  className={`h-11 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    formData.isHome === 'yes'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  在家
                </button>
                <button
                  onClick={() => setFormData({ ...formData, isHome: 'no' })}
                  className={`h-11 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                    formData.isHome === 'no'
                      ? 'border-red-500 bg-red-50 text-red-700'
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
                <Label className="text-sm text-[var(--color-text-secondary)] mb-2 block">
                  不在家原因 <span className="text-red-500">*</span>
                </Label>
                <Textarea
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

        {/* 智能走访记录 (仅在人员在家时显示) */}
        {formData.isHome === 'yes' && (
          <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-600" />
                走访记录
              </h3>
              {recordingStatus === 'done' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  onClick={resetRecording}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  重新录制
                </Button>
              )}
            </div>
            
            <div className="p-6">
              {/* 状态：空闲 */}
              {recordingStatus === 'idle' && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6 relative group">
                    <div className="absolute inset-0 bg-purple-200 rounded-full opacity-30 group-hover:scale-110 transition-transform duration-500"></div>
                    <Mic className="w-8 h-8 text-purple-600 relative z-10" />
                  </div>
                  <h4 className="text-lg font-bold text-[var(--color-text-title)] mb-2">开始语音记录</h4>
                  <p className="text-sm text-[var(--color-text-tertiary)] mb-6 max-w-[240px] mx-auto">
                    点击下方按钮开始录音，系统将自动记录对话内容并整理成走访记录
                  </p>
                  <Button 
                    size="lg" 
                    className="w-full h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20"
                    onClick={startRecording}
                  >
                    开始记录
                  </Button>
                </div>
              )}

              {/* 状态：录音中 */}
              {recordingStatus === 'recording' && (
                <div className="flex flex-col items-center py-4">
                  <div className="text-4xl font-mono font-medium text-[var(--color-text-title)] mb-8 tracking-wider">
                    {formatTime(recordingTime)}
                  </div>
                  
                  {/* 录音态波纹动画 */}
                  <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-20 animate-ping"></span>
                    <span className="absolute inline-flex h-20 w-20 rounded-full bg-purple-500 opacity-20 animate-pulse"></span>
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/20 z-10">
                      <Mic className="w-8 h-8 text-white animate-pulse" />
                    </div>
                  </div>

                  <div className="w-full bg-[var(--color-bg-primary)] rounded-lg p-4 mb-6 h-32 overflow-y-auto border border-[var(--color-border-primary)]">
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                      {transcript || "正在聆听..."}
                      <span className="inline-block w-1.5 h-4 bg-purple-500 ml-1 animate-pulse align-middle"></span>
                    </p>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20"
                    onClick={stopRecording}
                  >
                    <Square className="w-4 h-4 mr-2 fill-current" />
                    停止录音
                  </Button>
                </div>
              )}

              {/* 状态：处理中 */}
              {recordingStatus === 'processing' && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-6" />
                  <h4 className="text-lg font-bold text-[var(--color-text-title)] mb-2">正在分析对话...</h4>
                  <p className="text-sm text-[var(--color-text-tertiary)] animate-pulse">
                    AI 正在提取关键信息并生成走访记录
                  </p>
                </div>
              )}

              {/* 状态：完成 (显示生成的表单) */}
              {recordingStatus === 'done' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-purple-900/10 rounded-lg p-3 flex items-start gap-3 border border-purple-500/20">
                    <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-purple-300">
                      <span className="font-bold text-purple-200">AI 已完成智能整理：</span>
                      请核对以下内容，如有误可直接点击文本框进行修改。
                    </div>
                  </div>

                  {/* 自动生成的字段 */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                         健康状况
                        <span className="text-[10px] text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-500/20">AI 填充</span>
                      </Label>
                      <Textarea
                        value={formData.healthStatus}
                        onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                        className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                         生活情况
                        <span className="text-[10px] text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-500/20">AI 填充</span>
                      </Label>
                      <Textarea
                        value={formData.livingSituation}
                        onChange={(e) => setFormData({ ...formData, livingSituation: e.target.value })}
                        className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                         需求协助
                        <span className="text-[10px] text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-500/20">AI 填充</span>
                      </Label>
                      <Textarea
                        value={formData.needsAssistance}
                        onChange={(e) => setFormData({ ...formData, needsAssistance: e.target.value })}
                        className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                         安全检查
                        <span className="text-[10px] text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-500/20">AI 填充</span>
                      </Label>
                      <Textarea
                        value={formData.safetyCheck}
                        onChange={(e) => setFormData({ ...formData, safetyCheck: e.target.value })}
                        className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-[var(--color-text-secondary)]">家庭关系</Label>
                        <Input
                          value={formData.familyRelationship}
                          onChange={(e) => setFormData({ ...formData, familyRelationship: e.target.value })}
                          className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-[var(--color-text-secondary)]">下次计划</Label>
                        <Input
                          value={formData.nextVisitPlan}
                          onChange={(e) => setFormData({ ...formData, nextVisitPlan: e.target.value })}
                          className="bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 现场照片 */}
        <Card className="border-none shadow-sm bg-[var(--color-bg-secondary)]">
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <h3 className="font-bold text-[var(--color-text-title)] flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-600" />
              现场照片
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3">
              {/* 照片上传按钮 */}
              <button className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] flex flex-col items-center justify-center gap-2 text-[var(--color-text-tertiary)] active:bg-[var(--color-bg-primary)] transition-colors">
                <Camera className="w-6 h-6" />
                <span className="text-xs">添加照片</span>
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-quaternary)] mt-3">
              建议拍摄：门牌号、房屋外观、室内环境、安全隐患等
            </p>
          </div>
        </Card>
      </div>

      {/* Bottom Actions */}
      <div className="bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] p-4 safe-area-bottom sticky bottom-0">
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
            onClick={handleSubmit}
            className="flex-1 h-11 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)]"
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交记录'}
          </Button>
        </div>
      </div>
    </div>
  );
}
