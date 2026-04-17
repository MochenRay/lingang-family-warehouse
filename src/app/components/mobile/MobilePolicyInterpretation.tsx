import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, BookOpen, Sparkles } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { buildSecondaryAiIntro, buildSecondaryAiReply } from '../../services/secondaryAiDemo';

interface MobilePolicyInterpretationProps {
  onBack: () => void;
}

interface Message {
  id: number;
  role: 'ai' | 'user';
  content: string;
}

export function MobilePolicyInterpretation({ onBack }: MobilePolicyInterpretationProps) {
  const [messages, setMessages] = useState<Message[]>([{
    id: 1,
    role: 'ai',
    content: buildSecondaryAiIntro('policy')
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (text: string = inputMessage) => {
    if (!text.trim()) return;

    const timestamp = Date.now();
    const newUserMsg: Message = { id: timestamp, role: 'user', content: text };
    setInputMessage('');
    setMessages(prev => [
      ...prev,
      newUserMsg,
      {
        id: timestamp + 1,
        role: 'ai',
        content: buildSecondaryAiReply('policy', text),
      },
    ]);
  };

  const suggestedQuestions = [
    "临港区最新的低保申请条件是什么？",
    "残疾人两项补贴的具体标准是多少？",
    "退役军人优待证如何办理？",
    "大病救助的报销比例是多少？"
  ];

  const policyAreas = ['民政救助', '养老服务', '退役军人', '医疗保障', '残联助残'];

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--color-neutral-01)]">
      <MobileStatusBar />

      {/* 顶部标题栏 */}
      <div className="bg-[var(--color-neutral-02)] border-b border-[var(--color-neutral-03)] px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 active:bg-[var(--color-neutral-03)] rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--color-neutral-10)]" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4E86DF] rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--color-neutral-11)]">政策解读</h1>
              <p className="text-xs text-[var(--color-neutral-08)]">智能检索与解读助手</p>
            </div>
          </div>
        </div>
      </div>

      {/* 热门政策领域 */}
      <div className="bg-[var(--color-neutral-02)] border-b border-[var(--color-neutral-03)] px-4 py-3 shrink-0">
        <div className="text-xs text-[var(--color-neutral-09)] mb-2 font-medium">热门政策领域</div>
        <div className="flex flex-wrap gap-2">
          {policyAreas.map(area => (
            <Badge
              key={area}
              variant="outline"
              className="cursor-pointer hover:bg-[rgba(78,134,223,0.08)] hover:text-[#4E86DF] hover:border-[#4E86DF] transition-all text-[var(--color-neutral-10)] border-[var(--color-neutral-03)] font-normal text-xs"
              onClick={() => setInputMessage(`关于${area}的政策有哪些？`)}
            >
              {area}
            </Badge>
          ))}
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <Avatar className={`w-8 h-8 shrink-0 ${msg.role === 'ai' ? 'bg-[#4E86DF]' : 'bg-[var(--color-neutral-06)]'}`}>
              <AvatarFallback>
                {msg.role === 'ai' ? <Bot className="w-4 h-4 text-white" /> : <span className="text-white text-xs">我</span>}
              </AvatarFallback>
            </Avatar>
            <div className={`flex-1 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
              <Card className={`inline-block max-w-[85%] ${
                msg.role === 'ai'
                  ? 'bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]'
                  : 'bg-[#4E86DF] border-[#4E86DF] text-white'
              }`}>
                <div className="p-3">
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'ai' ? 'text-[var(--color-neutral-11)]' : 'text-white'
                  }`}>
                    {msg.content}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        ))}

        <div ref={scrollBottomRef} />
      </div>

      {/* 底部固定区域 */}
      <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-neutral-01)] border-t border-[var(--color-neutral-03)] shrink-0">
        {/* 推荐问题 */}
        {messages.length === 1 && (
          <div className="px-4 pt-3 pb-2 bg-[var(--color-neutral-02)] border-b border-[var(--color-neutral-03)]">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="w-full text-left mb-2 flex items-center justify-between"
            >
              <div className="text-xs text-[var(--color-neutral-09)] font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                推荐问题
              </div>
              <span className="text-xs text-[var(--color-neutral-08)]">
                {showSuggestions ? '收起' : '展开'}
              </span>
            </button>
            {showSuggestions && (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(question)}
                    className="w-full text-left p-3 bg-[var(--color-neutral-02)] border border-[var(--color-neutral-03)] rounded-xl text-sm text-[var(--color-neutral-10)] active:bg-[var(--color-neutral-03)] transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 输入区域 */}
        <div className="bg-[var(--color-neutral-02)] p-4">
          <div className="flex gap-2 items-end">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="请输入您想查询的政策问题..."
            className="flex-1 min-h-[44px] max-h-[120px] resize-none text-sm bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            className="h-[44px] px-4 bg-[#4E86DF] hover:bg-[#3d6fc7] text-white shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
