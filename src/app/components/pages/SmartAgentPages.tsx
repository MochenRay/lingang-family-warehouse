import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Bot, 
  FileText, 
  BookOpen,
  PenTool,
  PieChart,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  buildSecondaryAiIntro,
  buildSecondaryAiReply,
  type SecondaryAiKind,
} from '../../services/secondaryAiDemo';
import { secondaryAiRepository } from '../../services/repositories/secondaryAiRepository';

// --- Shared Types & Mock Data ---

interface Message {
  id: number;
  role: 'ai' | 'user';
  content: string;
}

interface SmartChatProps {
  title: string;
  description: string;
  sidebarContent: React.ReactNode;
  suggestedQuestions: string[];
  initialMessages: Message[];
  placeholder: string;
  demoKind: SecondaryAiKind;
  apiKind?: SecondaryAiKind;
}

// --- Base Component ---

function BaseSmartChat({ 
  title, 
  description, 
  sidebarContent, 
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
      const content = apiKind
        ? (await secondaryAiRepository.sendMessage(apiKind, nextPrompt)).content
        : buildSecondaryAiReply(demoKind, nextPrompt);

      setMessages(prev => [
        ...prev,
        {
          id: timestamp + 1,
          role: 'ai',
          content,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-11)]">{title}</h1>
          <p className="text-sm text-[var(--color-neutral-08)] mt-1">
            {description}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-6">
        {/* 左侧侧边栏 */}
        <div className="w-64 flex flex-col gap-4 shrink-0">
          {sidebarContent}
          
          <Card className="flex-1 bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
            <CardHeader className="pb-3 border-b border-[var(--color-neutral-03)]">
              <CardTitle className="text-sm font-medium text-[var(--color-neutral-11)]">推荐问题</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <div 
                    key={i} 
                    className="text-xs p-2 bg-[var(--color-neutral-03)] rounded hover:bg-[rgba(78,134,223,0.08)] hover:text-[#4E86DF] cursor-pointer text-[var(--color-neutral-10)] transition-colors"
                    onClick={() => {
                      void handleSendMessage(q);
                    }}
                  >
                    {q}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧聊天区域 */}
        <Card className="flex-1 flex flex-col overflow-hidden border-[var(--color-neutral-03)] bg-[var(--color-neutral-02)] shadow-md rounded-md">
          <ScrollArea className="flex-1 p-4 bg-[var(--color-neutral-01)]">
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className={`w-8 h-8 shrink-0 ${msg.role === 'ai' ? 'bg-[rgba(78,134,223,0.15)]' : 'bg-[var(--color-neutral-03)]'}`}>
                    {msg.role === 'ai' ? (
                      <AvatarFallback className="bg-transparent"><Bot className="w-5 h-5 text-[#4E86DF]" /></AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-transparent text-[var(--color-neutral-10)]"><span className="text-xs">我</span></AvatarFallback>
                    )}
                  </Avatar>
                  <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-lg text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#2761CB] text-white rounded-tr-sm' 
                        : 'bg-[var(--color-neutral-02)] text-[var(--color-neutral-10)] border border-[var(--color-neutral-03)] rounded-tl-sm'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    <span className="text-xs text-[var(--color-neutral-08)] mt-1 px-1">
                      {new Date(msg.id).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={scrollBottomRef} />
            </div>
          </ScrollArea>

          <div className="p-4 bg-[var(--color-neutral-02)] border-t border-[var(--color-neutral-03)]">
            <div className="relative">
              <Textarea 
                placeholder={placeholder}
                className="min-h-[60px] max-h-[120px] pr-24 resize-none bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)] text-[var(--color-neutral-10)] placeholder:text-[var(--color-neutral-08)]"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-neutral-08)] hover:text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-03)]">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  className="h-8 w-8 bg-[#2761CB] hover:bg-[#4E86DF] text-white border-0"
                  onClick={() => {
                    void handleSendMessage();
                  }}
                  disabled={!inputMessage.trim() || sending}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
  const sidebar = (
    <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
      <CardHeader className="pb-3 border-b border-[var(--color-neutral-03)]">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-[var(--color-neutral-11)]">
          <BookOpen className="w-4 h-4 text-[#4E86DF]" /> 
          热门政策领域
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 pt-4">
        {['民政救助', '养老服务', '退役军人', '医疗保障', '残联助残'].map(tag => (
          <Badge 
            key={tag} 
            variant="outline" 
            className="justify-center py-1.5 cursor-pointer hover:bg-[rgba(78,134,223,0.08)] hover:text-[#4E86DF] hover:border-[#4E86DF] transition-all text-[var(--color-neutral-10)] border-[var(--color-neutral-03)] font-normal"
          >
            {tag}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <BaseSmartChat
      title="政策解读"
      description="基于本地政策库的智能检索与解读助手"
      demoKind="policy"
      apiKind="policy"
      sidebarContent={sidebar}
      placeholder="请输入您想查询的政策问题，例如：最新的高龄津贴发放标准是什么？"
      initialMessages={[{
        id: 1,
        role: 'ai',
        content: buildSecondaryAiIntro('policy')
      }]}
      suggestedQuestions={[
        "临港区最新的低保申请条件是什么？",
        "残疾人两项补贴的具体标准是多少？",
        "退役军人优待证如何办理？",
        "大病救助的报销比例是多少？"
      ]}
    />
  );
}

export function OfficialDocumentWriting() {
  const sidebar = (
    <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
      <CardHeader className="pb-3 border-b border-[var(--color-neutral-03)]">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-[var(--color-neutral-11)]">
          <PenTool className="w-4 h-4 text-[#19B172]" /> 
          常用文体模板
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 pt-4">
         {['工作总结', '会议纪要', '活动方案', '通知公告', '情况汇报'].map(tag => (
          <Badge 
            key={tag} 
            variant="outline" 
            className="justify-center py-1.5 cursor-pointer hover:bg-[rgba(25,177,114,0.08)] hover:text-[#19B172] hover:border-[#19B172] transition-all text-[var(--color-neutral-10)] border-[var(--color-neutral-03)] font-normal"
          >
            {tag}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <BaseSmartChat
      title="公文写作"
      description="辅助生成各类社区工作文档、报告与通知"
      demoKind="writing"
      apiKind="writing"
      sidebarContent={sidebar}
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
  const sidebar = (
    <Card className="bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]">
      <CardHeader className="pb-3 border-b border-[var(--color-neutral-03)]">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-[var(--color-neutral-11)]">
          <PieChart className="w-4 h-4 text-[#8B3BCC]" /> 
          核心数据领域
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 pt-4">
         {['人口数据', '房屋网格', '特殊人群', '矛盾纠纷', '活动参与'].map(tag => (
          <Badge 
            key={tag} 
            variant="outline" 
            className="justify-center py-1.5 cursor-pointer hover:bg-[rgba(139,59,204,0.08)] hover:text-[#8B3BCC] hover:border-[#8B3BCC] transition-all text-[var(--color-neutral-10)] border-[var(--color-neutral-03)] font-normal"
          >
            {tag}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <BaseSmartChat
      title="智能问数"
      description="通过自然语言查询、统计和分析辖区数据"
      demoKind="query"
      sidebarContent={sidebar}
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
