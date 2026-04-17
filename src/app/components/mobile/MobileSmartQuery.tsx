import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, PieChart, Sparkles } from 'lucide-react';
import { MobileStatusBar } from './MobileStatusBar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { buildSecondaryAiIntro, buildSecondaryAiReply } from '../../services/secondaryAiDemo';

interface MobileSmartQueryProps {
  onBack: () => void;
}

interface Message {
  id: number;
  role: 'ai' | 'user';
  content: string;
}

export function MobileSmartQuery({ onBack }: MobileSmartQueryProps) {
  const [messages, setMessages] = useState<Message[]>([{
    id: 1,
    role: 'ai',
    content: buildSecondaryAiIntro('query')
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
        content: buildSecondaryAiReply('query', text),
      },
    ]);
  };

  const suggestedQuestions = [
    "竹岛街道60岁以上老人有多少？",
    "本月新增人口数量对比上月如何？",
    "环翠区各街道人口密度排名",
    "独居老人分布最多的前5个社区"
  ];

  const dataAreas = ['人口统计', '房屋管理', '网格分布', '重点人群', '活动参与'];

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
            <div className="w-8 h-8 bg-[#8B3BCC] rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--color-neutral-11)]">智能问数</h1>
              <p className="text-xs text-[var(--color-neutral-08)]">自然语言查询</p>
            </div>
          </div>
        </div>
      </div>

      {/* 核心数据领域 */}
      <div className="bg-[var(--color-neutral-02)] border-b border-[var(--color-neutral-03)] px-4 py-3 shrink-0">
        <div className="text-xs text-[var(--color-neutral-09)] mb-2 font-medium">核心数据领域</div>
        <div className="flex flex-wrap gap-2">
          {dataAreas.map(area => (
            <Badge
              key={area}
              variant="outline"
              className="cursor-pointer hover:bg-[rgba(139,59,204,0.08)] hover:text-[#8B3BCC] hover:border-[#8B3BCC] transition-all text-[var(--color-neutral-10)] border-[var(--color-neutral-03)] font-normal text-xs"
              onClick={() => setInputMessage(`查询${area}相关数据`)}
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
            <Avatar className={`w-8 h-8 shrink-0 ${msg.role === 'ai' ? 'bg-[#8B3BCC]' : 'bg-[var(--color-neutral-06)]'}`}>
              <AvatarFallback>
                {msg.role === 'ai' ? <Bot className="w-4 h-4 text-white" /> : <span className="text-white text-xs">我</span>}
              </AvatarFallback>
            </Avatar>
            <div className={`flex-1 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
              <Card className={`inline-block max-w-[85%] ${
                msg.role === 'ai'
                  ? 'bg-[var(--color-neutral-02)] border-[var(--color-neutral-03)]'
                  : 'bg-[#8B3BCC] border-[#8B3BCC] text-white'
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
            placeholder="请用自然语言提出数据查询需求..."
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
            className="h-[44px] px-4 bg-[#8B3BCC] hover:bg-[#7432a8] text-white shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
