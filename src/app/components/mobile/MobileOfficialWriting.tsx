import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, PenTool, Sparkles, Loader2 } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { buildSecondaryAiIntro, buildSecondaryAiReply } from '../../services/secondaryAiDemo';
import { secondaryAiRepository } from '../../services/repositories/secondaryAiRepository';

interface MobileOfficialWritingProps {
  onBack: () => void;
}

interface Message {
  id: number;
  role: 'ai' | 'user';
  content: string;
}

export function MobileOfficialWriting({ onBack }: MobileOfficialWritingProps) {
  const [messages, setMessages] = useState<Message[]>([{
    id: 1,
    role: 'ai',
    content: buildSecondaryAiIntro('writing')
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
      const response = await secondaryAiRepository.sendMessage('writing', nextPrompt);
      setMessages(prev => [
        ...prev,
        {
          id: timestamp + 1,
          role: 'ai',
          content: response.content || buildSecondaryAiReply('writing', nextPrompt),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const suggestedQuestions = [
    "生成一份季度社区网格化管理工作总结",
    "起草一份关于开展社区义诊活动的通知",
    "帮我润色这篇民情日记，使其更正式",
    "写一份关于解决邻里纠纷的情况汇报"
  ];

  const documentTypes = ['工作总结', '会议纪要', '活动方案', '通知公告', '情况汇报'];

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
            <div className="w-8 h-8 bg-[#19B172] rounded-lg flex items-center justify-center">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--color-neutral-11)]">公文写作</h1>
              <p className="text-xs text-[var(--color-neutral-08)]">辅助文档生成</p>
            </div>
          </div>
        </div>
      </div>

      {/* 常用文体模板 */}
      <div className="bg-[var(--color-neutral-02)] border-b border-[var(--color-neutral-03)] px-4 py-3 shrink-0">
        <div className="text-xs text-[var(--color-neutral-09)] mb-2 font-medium">常用文体模板</div>
        <div className="flex flex-wrap gap-2">
          {documentTypes.map(type => (
            <Badge
              key={type}
              variant="outline"
              className="cursor-pointer hover:bg-[rgba(25,177,114,0.08)] hover:text-[#19B172] hover:border-[#19B172] transition-all text-[var(--color-neutral-10)] border-[var(--color-neutral-03)] font-normal text-xs"
              onClick={() => setInputMessage(`帮我写一份${type}`)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <Avatar className={`w-8 h-8 shrink-0 ${msg.role === 'ai' ? 'bg-[#19B172]' : 'bg-[var(--color-neutral-06)]'}`}>
              <AvatarFallback>
                {msg.role === 'ai' ? <Bot className="w-4 h-4 text-white" /> : <span className="text-white text-xs">我</span>}
              </AvatarFallback>
            </Avatar>
            <div className={`flex-1 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
              <Card className={`inline-block max-w-[85%] ${
                msg.role === 'ai'
                  ? 'bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]'
                  : 'bg-[#19B172] border-[#19B172] text-white'
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
                    onClick={() => {
                      void handleSendMessage(question);
                    }}
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
            placeholder="请输入您的写作需求..."
            className="flex-1 min-h-[44px] max-h-[120px] resize-none text-sm bg-[var(--color-neutral-01)] border-[var(--color-neutral-03)]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSendMessage();
              }
            }}
          />
          <Button
            onClick={() => {
              void handleSendMessage();
            }}
            disabled={!inputMessage.trim() || sending}
            className="h-[44px] px-4 bg-[#19B172] hover:bg-[#15965f] text-white shrink-0"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
