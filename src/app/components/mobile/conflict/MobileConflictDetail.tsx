import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  MessageSquarePlus,
  CheckCircle2,
  Loader2,
  BookOpen,
  ExternalLink
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
  DialogDescription
} from '../../ui/dialog';
import { MobileStatusBar } from '../MobileStatusBar';
import { db } from '../../../services/db';
import { ConflictRecord } from '../../../types/core';
import { toast } from 'sonner';

interface MobileConflictDetailProps {
  id: string;
  onBack: () => void;
  onRouteChange?: (route: string) => void;
}

export function MobileConflictDetail({ id, onBack, onRouteChange }: MobileConflictDetailProps) {
  const [conflict, setConflict] = useState<ConflictRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Progress Dialog State
  const [progressContent, setProgressContent] = useState('');
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Related Policies State
  const [relatedPolicies, setRelatedPolicies] = useState<Array<{
    title: string;
    summary: string;
    source: string;
    relevance: string;
  }>>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Scripts (话术推荐) State
  const [scripts, setScripts] = useState<Array<{
    scenario: string;
    target: string;
    script: string;
    tips: string;
  }>>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);

  // Tab State for AI辅助 card
  const [aiTab, setAiTab] = useState<'policy' | 'script'>('policy');

  useEffect(() => {
    // Simulate fetch delay
    setTimeout(() => {
      const found = db.getConflicts().find(c => c.id === id);
      setConflict(found || null);
      setLoading(false);

      // Load related policies after conflict is loaded
      if (found) {
        loadRelatedPolicies(found);
        loadScripts(found);
      }
    }, 500);
  }, [id]);

  const loadRelatedPolicies = async (conflictData: ConflictRecord) => {
    setLoadingPolicies(true);

    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // 模拟大模型分析结果 - 实际应调用后端API
    // 根据矛盾类型和内容返回相关政策法规
    const mockPolicies = generateMockPolicies(conflictData);
    setRelatedPolicies(mockPolicies);
    setLoadingPolicies(false);
  };

  const generateMockPolicies = (conflictData: ConflictRecord) => {
    // 根据矛盾类型返回不同的政策法规
    const policiesByType: Record<string, Array<{
      title: string;
      summary: string;
      source: string;
      relevance: string;
    }>> = {
      '邻里纠纷': [
        {
          title: '《中华人民共和国民法典》第二百八十八条',
          summary: '不动产的相邻权利人应当按照有利生产、方便生活、团结互助、公平合理的原则,正确处理相邻关系。',
          source: '全国人民代表大会',
          relevance: '适用于邻里间因通行、采光、通风等产生的纠纷'
        },
        {
          title: '《物业管理条例》第四十六条',
          summary: '对物业管理区域内违反有关治安、环保、物业装饰装修和使用等方面法律、法规规定的行为,物业服务企业应当制止,并及时向有关行政管理部门报告。',
          source: '国务院',
          relevance: '明确物业公司在邻里纠纷中的责任和义务'
        },
        {
          title: '临港区社区矛盾纠纷调解工作规范(2025)',
          summary: '建立"网格员发现-社区调解-街道仲裁"三级调解机制,对邻里纠纷实行"小事不出网格,大事不出社区"的原则。',
          source: '临港区民政局',
          relevance: '明确网格员在邻里纠纷调解中的职责和流程'
        }
      ],
      '家庭纠纷': [
        {
          title: '《中华人民共和国反家庭暴力法》第十六条',
          summary: '家庭暴力情节较轻,依法不给予治安管理处罚的,由公安机关对加害人给予批评教育或者出具告诫书。',
          source: '全国人民代表大会常务委员会',
          relevance: '适用于家庭成员间发生暴力冲突的情况'
        },
        {
          title: '《婚姻家庭纠纷预防化解工作意见》',
          summary: '充分发挥人民调解在婚姻家庭纠纷化解中的基础性作用,推动建立"法院+妇联+社区"联动调解机制。',
          source: '最高人民法院、全国妇联',
          relevance: '指导基层组织开展家庭纠纷调解工作'
        }
      ],
      '物业纠纷': [
        {
          title: '《民法典》第九百四十四条',
          summary: '业主应当按照约定向物业服务人支付物业费。物业服务人已经按照约定和有关规定提供服务的,业主不得以未接受或者无需接受相关物业服务为由拒绝支付物业费。',
          source: '全国人民代表大会',
          relevance: '明确业主缴纳物业费的义务'
        },
        {
          title: '《物业管理条例》第四十八条',
          summary: '县级以上地方人民政府房地产行政主管部门应当及时处理业主、业主委员会、物业使用人和物业服务企业在物业管理活动中的投诉。',
          source: '国务院',
          relevance: '明确物业纠纷的投诉处理机制'
        }
      ]
    };

    return policiesByType[conflictData.type] || [
      {
        title: '《人民调解法》第二条',
        summary: '人民调解是指人民调解委员会通过说服、疏导等方法,促使当事人在平等协商基础上自愿达成调解协议,解决民间纠纷的活动。',
        source: '全国人民代表大会常务委员会',
        relevance: '为各类民间矛盾纠纷调解提供法律依据'
      }
    ];
  };

  const loadScripts = async (conflictData: ConflictRecord) => {
    setLoadingScripts(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockScripts = generateMockScripts(conflictData);
    setScripts(mockScripts);
    setLoadingScripts(false);
  };

  const generateMockScripts = (conflictData: ConflictRecord): Array<{
    scenario: string;
    target: string;
    script: string;
    tips: string;
  }> => {
    const scriptsByType: Record<string, typeof scripts> = {
      '邻里纠纷': [
        {
          scenario: '首次上门了解情况',
          target: '投诉方',
          script: '您好，我是咱们社区的网格员。了解到您反映的问题，我们非常重视。能不能跟我详细说一下具体情况？比如什么时间、持续多久、对您造成了哪些影响？我们会认真记录并帮您协调解决。',
          tips: '先倾听，不急于下结论；记录具体时间、频次等细节，为后续调解提供依据。'
        },
        {
          scenario: '与被投诉方沟通',
          target: '被投诉方',
          script: '您好，我是社区网格员。今天来是想跟您聊聊，邻居反映了一些生活上的小问题。大家住在一起难免有些磕碰，我想听听您这边的情况，咱们一起想个办法，让大家都住得舒心。',
          tips: '避免一上来就指责，用"了解情况"代替"投诉"；强调"互相理解"，降低对抗情绪。'
        },
        {
          scenario: '组织双方调解',
          target: '双方当事人',
          script: '感谢两位今天能坐下来谈。咱们都是邻居，抬头不见低头见，有什么事情说开了就好。我先请双方各说一下自己的想法，咱们互相听一听，然后一起商量一个大家都能接受的解决方案。',
          tips: '控制节奏，确保双方都有表达机会；引导双方换位思考；达成共识后当场确认并记录。'
        }
      ],
      '家庭纠纷': [
        {
          scenario: '首次上门了解',
          target: '当事人',
          script: '您好，我是社区网格员。最近听说家里遇到了一些困难，我们过来看看有没有能帮上忙的地方。家家有本难念的经，有些事情自己人不好说，我们作为第三方，也许能帮着出出主意。',
          tips: '表达关心而非干预；注意保护当事人隐私；如涉及家暴等情况，注意观察当事人状态。'
        },
        {
          scenario: '劝导沟通',
          target: '矛盾方',
          script: '我理解您现在的心情。但不管怎样，一家人的感情是最重要的。咱们能不能想一想，有没有什么方式既能解决问题，又不伤害家人之间的感情？我可以帮着协调，有些话通过我来转达，可能效果会更好。',
          tips: '不偏袒任何一方；必要时建议寻求专业帮助（心理咨询、法律援助等）。'
        }
      ],
      '物业纠纷': [
        {
          scenario: '与业主沟通',
          target: '业主',
          script: '您好，我是社区网格员。了解到您对物业服务有一些意见。您的诉求我们都记录下来了，我会帮您跟物业公司沟通。同时也想了解一下，您觉得哪些方面改进了，您会比较满意？',
          tips: '让业主明确具体诉求，避免笼统抱怨；记录可量化的改进指标。'
        },
        {
          scenario: '与物业沟通',
          target: '物业公司',
          script: '您好，最近有几位业主反映了一些服务方面的问题。我整理了一下他们的主要诉求，想跟您一起商量下改进方案。业主满意度上去了，对物业的口碑和续约都有好处，咱们一起把这个事情处理好。',
          tips: '站在物业角度分析利弊；提出具体可行的改进建议；约定反馈时间节点。'
        },
        {
          scenario: '组织协调会',
          target: '业主与物业',
          script: '今天把大家请来，就是想搭建一个沟通的平台。业主有诉求，物业有难处，咱们敞开了说。我来帮大家梳理一下问题，逐条商量解决方案，争取今天有个初步的结果。',
          tips: '提前了解双方底线；聚焦可解决的问题；形成书面纪要，明确责任人和时间。'
        }
      ]
    };

    return scriptsByType[conflictData.type] || [
      {
        scenario: '初次接触当事人',
        target: '当事人',
        script: '您好，我是社区网格员。接到了关于这件事情的反映，我过来了解一下具体情况，看看能不能帮大家协调解决。您先跟我说说，事情的来龙去脉是怎样的？',
        tips: '保持中立立场，认真倾听；做好记录，为后续调解做准备。'
      }
    ];
  };

  const handleAddProgress = async () => {
    if (!conflict || !progressContent.trim()) return;

    setIsSubmittingProgress(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const newTimelineItem = {
      date: new Date().toLocaleString(),
      content: progressContent,
      operator: '当前用户'
    };

    const updatedTimeline = [newTimelineItem, ...conflict.timeline]; // Add to top for display usually, but data structure might imply chronological. Let's prepend for display logic or append? Usually append in data, prepend in UI.
    // Let's prepend to data array if we want latest first in UI logic, or append.
    // The type says timeline is an array. Let's append to keep chronological order in data.
    
    db.updateConflict(conflict.id, {
      timeline: [...conflict.timeline, newTimelineItem]
    });

    setConflict(prev => prev ? ({ ...prev, timeline: [...prev.timeline, newTimelineItem] }) : null);
    setProgressContent('');
    setIsSubmittingProgress(false);
    setIsDialogOpen(false);
    toast.success('进展记录已添加');
  };

  const handleMarkResolved = async () => {
    if (!conflict) return;
    if (confirm('确认将此纠纷标记为已化解吗？')) {
      db.updateConflict(conflict.id, { status: '已化解', updatedAt: new Date().toLocaleString() });
      setConflict(prev => prev ? ({ ...prev, status: '已化解' }) : null);
      toast.success('状态已更新');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!conflict) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-500">未找到记录</p>
        <Button onClick={onBack}>返回</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Basic Info Card */}
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
                  {conflict.involvedParties.map((p, i) => (
                    <span key={i} className="text-sm text-gray-600 bg-blue-50 px-1.5 rounded text-blue-700">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {conflict.images && conflict.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {conflict.images.map((img, i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="附件" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI辅助：政策法规 + 话术推荐 Tab */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            {/* Tab Header */}
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">AI辅助</h3>
              <span className="text-xs text-gray-400 ml-auto">智能分析</span>
            </div>

            {/* Tab Switcher */}
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

            {/* Tab: 关联政策法规 */}
            {aiTab === 'policy' && (
              <>
                {loadingPolicies ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm">正在分析相关政策...</span>
                  </div>
                ) : relatedPolicies.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    暂无相关政策法规
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relatedPolicies.map((policy, index) => (
                      <div
                        key={index}
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
                          <ExternalLink className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg mb-2.5 border border-gray-100">
                          <p className="text-xs text-gray-800 leading-relaxed">
                            {policy.summary}
                          </p>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0 mt-1.5"></div>
                          <p className="text-xs text-blue-700 leading-relaxed flex-1">
                            <span className="font-medium">适用场景：</span>{policy.relevance}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-3 border-l-2 border-blue-500">
                        <p className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-medium text-gray-700">💡 提示</span>
                          <span className="ml-1">
                            以上政策法规由AI根据纠纷内容智能分析推荐,供调解参考使用。
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Tab: 话术推荐 */}
            {aiTab === 'script' && (
              <>
                {loadingScripts ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm">正在生成话术建议...</span>
                  </div>
                ) : scripts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    暂无话术推荐
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scripts.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                      >
                        {/* 场景和对象 */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-orange-50 text-orange-700 text-[10px] font-medium px-2 py-0.5 rounded">
                            {item.scenario}
                          </span>
                          <span className="text-[10px] text-gray-400">对象：{item.target}</span>
                        </div>

                        {/* 话术内容 */}
                        <div className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-100">
                          <p className="text-xs text-gray-800 leading-relaxed italic">
                            "{item.script}"
                          </p>
                        </div>

                        {/* 注意事项 */}
                        <div className="flex items-start gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-orange-500 shrink-0 mt-1.5"></div>
                          <p className="text-xs text-orange-700 leading-relaxed flex-1">
                            <span className="font-medium">要点：</span>{item.tips}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-lg p-3 border-l-2 border-orange-400">
                        <p className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-medium text-gray-700">💡 提示</span>
                          <span className="ml-1">
                            以上话术由AI根据纠纷场景智能生成,请根据实际情况灵活调整。沟通中注意保持中立、耐心倾听。
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 ml-1">处理进度</h3>
          <div className="space-y-4 pl-2">
            {[...conflict.timeline].reverse().map((item, index) => (
              <div key={index} className="relative pl-6 pb-2 border-l-2 border-gray-200 last:border-0">
                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
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

        {/* Spacer for bottom bar */}
        <div className="h-20"></div>
      </div>

      {/* Bottom Actions */}
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
                  onChange={e => setProgressContent(e.target.value)}
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
