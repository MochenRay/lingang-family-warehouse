import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Bot,
  BookOpen,
  PenTool,
  PieChart,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { AiStatusBadge } from '../ui/AiStatusBadge';
import {
  buildSecondaryAiIntro,
  buildSecondaryAiReply,
  type SecondaryAiKind,
} from '../../services/secondaryAiDemo';
import {
  secondaryAiRepository,
  type SecondaryAiChatResult,
} from '../../services/repositories/secondaryAiRepository';
import { PageHeader } from './PageHeader';

// --- Shared Types & Mock Data ---

interface Message {
  id: number;
  role: 'ai' | 'user';
  content: string;
  aiStatus?: SecondaryAiChatResult;
}

interface SmartChatProps {
  title: string;
  description: string;
  topic: {
    title: string;
    icon: React.ReactNode;
    items: string[];
    badgeClassName: string;
  };
  suggestedQuestions: string[];
  initialMessages: Message[];
  placeholder: string;
  demoKind: SecondaryAiKind;
  apiKind?: SecondaryAiKind;
}

const SURFACE_CLASS =
  'rounded-lg border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] shadow-none';
const MUTED_TEXT_CLASS = 'text-[var(--color-neutral-08)]';
const TOPIC_BADGE_CLASS =
  'shrink-0 whitespace-nowrap rounded border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-1.5 text-[11px] font-normal text-[var(--color-neutral-10)] transition-colors';

// --- Base Component ---

function BaseSmartChat({
  title,
  description,
  topic,
  suggestedQuestions,
  initialMessages,
  placeholder,
  demoKind,
  apiKind,
}: SmartChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (text: string = inputMessage) => {
    const nextPrompt = text.trim();
    if (!nextPrompt || sending) return;

    const timestamp = Date.now();
    const newUserMsg: Message = { id: timestamp, role: 'user', content: nextPrompt };
    setInputMessage('');
    setMessages(prev => [...prev, newUserMsg]);
    setSending(true);

    try {
      const response = apiKind
        ? await secondaryAiRepository.sendMessage(apiKind, nextPrompt)
        : null;

      setMessages(prev => [
        ...prev,
        {
          id: timestamp + 1,
          role: 'ai',
          content: response?.content ?? buildSecondaryAiReply(demoKind, nextPrompt),
          aiStatus: response ?? undefined,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-col gap-5 text-[var(--color-neutral-10)] animate-in fade-in duration-500">
      <div className="shrink-0">
        <PageHeader eyebrow="AI WORKBENCH" title={title} description={description} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        {/* 领域入口横向置于对话区之上，给聊天区留出完整宽度。 */}
        <Card className={`${SURFACE_CLASS} shrink-0 gap-0 overflow-hidden`}>
          <CardContent className="flex items-center gap-3 p-3 [&:last-child]:pb-3">
            <div className="flex min-w-[168px] shrink-0 items-center gap-2 border-r border-[var(--color-neutral-03)] pr-4 text-sm font-medium text-white">
              {topic.icon}
              <span>{topic.title}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
              {topic.items.map(item => (
                <Badge
                  key={item}
                  variant="outline"
                  className={`${TOPIC_BADGE_CLASS} ${topic.badgeClassName}`}
                >
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 对话主区 */}
        <Card className={`${SURFACE_CLASS} flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden`}>
          <ScrollArea
            className="flex-1 bg-[var(--color-neutral-01)] p-4"
            role="log"
            aria-live="polite"
            aria-busy={sending}
          >
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className={`h-8 w-8 shrink-0 border border-[var(--color-neutral-03)] ${msg.role === 'ai' ? 'bg-[#2761CB]/18' : 'bg-[var(--color-neutral-03)]'}`}>
                    {msg.role === 'ai' ? (
                      <AvatarFallback className="bg-transparent"><Bot className="h-5 w-5 text-[#4E86DF]" /></AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-transparent text-[var(--color-neutral-10)]"><span className="text-xs">我</span></AvatarFallback>
                    )}
                  </Avatar>
                  <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-lg text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm bg-[#2761CB] text-white'
                        : 'rounded-tl-sm border border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)]'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.role === 'ai' && msg.aiStatus ? (
                        <div className="mt-3">
                          <AiStatusBadge
                            status={msg.aiStatus.status}
                            model={msg.aiStatus.model}
                            usedFallbackModel={msg.aiStatus.used_fallback_model}
                            error={msg.aiStatus.error}
                          />
                        </div>
                      ) : null}
                    </div>
                    <span className={`mt-1 px-1 text-xs ${MUTED_TEXT_CLASS}`}>
                      {new Date(msg.id).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={scrollBottomRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] p-4">
            <div className="mb-3 flex items-start gap-3">
              <span className="shrink-0 pt-1.5 text-xs font-medium text-[var(--color-neutral-10)]">推荐问题</span>
              <div className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
                {suggestedQuestions.map(q => (
                  <button
                    key={q}
                    type="button"
                    className="shrink-0 rounded border border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] px-3 py-1.5 text-left text-xs leading-5 text-[var(--color-neutral-10)] transition-colors hover:border-[#4E86DF]/50 hover:bg-[#2761CB]/12 hover:text-[#9FC4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4E86DF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-neutral-02)] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => {
                      void handleSendMessage(q);
                    }}
                    disabled={sending}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Textarea
                aria-label="消息输入"
                placeholder={placeholder}
                className="max-h-[120px] min-h-[60px] resize-none border-[var(--color-neutral-03)] bg-[var(--color-neutral-01)] pr-24 text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="添加附件"
                  className="h-8 w-8 text-[var(--color-neutral-08)] hover:bg-[var(--color-neutral-03)] hover:text-white"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  aria-label="发送消息"
                  className="h-8 w-8 border-0 bg-[#2761CB] text-white hover:bg-[#4E86DF]"
                  onClick={() => {
                    void handleSendMessage();
                  }}
                  disabled={!inputMessage.trim() || sending}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- Specific Pages ---

export function PolicyInterpretation() {
  return (
    <BaseSmartChat
      title="政策解读"
      description="基于本地政策库的智能检索与解读助手"
      demoKind="policy"
      apiKind="policy"
      topic={{
        title: '热门政策领域',
        icon: <BookOpen className="h-4 w-4 text-[#4E86DF]" />,
        items: ['民政救助', '养老服务', '退役军人', '医疗保障', '残联助残'],
        badgeClassName: 'hover:border-[#4E86DF] hover:bg-[#2761CB]/12 hover:text-[#9FC4FF]',
      }}
      placeholder="请输入您想查询的政策问题，例如：最新的高龄津贴发放标准是什么？"
      initialMessages={[{
        id: 1,
        role: 'ai',
        content: buildSecondaryAiIntro('policy')
      }]}
      suggestedQuestions={[
        "蓬莱区最新的低保申请条件是什么？",
        "残疾人两项补贴的具体标准是多少？",
        "退役军人优待证如何办理？",
        "大病救助的报销比例是多少？"
      ]}
    />
  );
}

export function OfficialDocumentWriting() {
  return (
    <BaseSmartChat
      title="公文写作"
      description="辅助生成各类社区工作文档、报告与通知"
      demoKind="writing"
      apiKind="writing"
      topic={{
        title: '常用文体模板',
        icon: <PenTool className="h-4 w-4 text-[#19B172]" />,
        items: ['工作总结', '会议纪要', '活动方案', '通知公告', '情况汇报'],
        badgeClassName: 'hover:border-[#19B172] hover:bg-[#19B172]/12 hover:text-[#6EE7B7]',
      }}
      placeholder="请输入您的写作需求，例如：帮我写一份关于社区环境整治的总结报告。"
      initialMessages={[{
        id: 1,
        role: 'ai',
        content: buildSecondaryAiIntro('writing')
      }]}
      suggestedQuestions={[
        "生成一份季度社区网格化管理工作总结",
        "起草一份关于开展社区义诊活动的通知",
        "帮我润色这篇民情日记，使其更正式",
        "写一份关于解决邻里纠纷的情况汇报"
      ]}
    />
  );
}

export function SmartQuery() {
  return (
    <BaseSmartChat
      title="智能问数"
      description="通过自然语言查询、统计和分析辖区数据"
      demoKind="query"
      apiKind="query"
      topic={{
        title: '核心数据领域',
        icon: <PieChart className="h-4 w-4 text-[#8B3BCC]" />,
        items: ['人口数据', '房屋网格', '特殊人群', '矛盾纠纷', '活动参与'],
        badgeClassName: 'hover:border-[#8B3BCC] hover:bg-[#8B3BCC]/12 hover:text-[#D8B4FE]',
      }}
      placeholder="请输入您想分析的数据问题，例如：统计本月新增流动人口数量。"
      initialMessages={[{
        id: 1,
        role: 'ai',
        content: buildSecondaryAiIntro('query')
      }]}
      suggestedQuestions={[
        "统计辖区内60岁以上老人的总数及占比",
        "分析最近三个月矛盾纠纷的主要类型",
        "列出本月入户走访完成率最低的网格",
        "对比去年同期，常住人口有什么变化？"
      ]}
    />
  );
}
