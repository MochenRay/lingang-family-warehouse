import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Save, Camera, X, Search, Link as LinkIcon, MapPin, History } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { MobileDetailHeader } from './MobileDetailHeader';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Input } from '../ui/input';
import { personRepository } from '../../services/repositories/personRepository';
import { mobileContextRepository } from '../../services/repositories/mobileContextRepository';
import type { Person } from '../../types/core';
import { useMobileSandbox } from './MobileSandboxProvider';

interface QuickNoteProps {
  onBack: () => void;
  onRouteChange?: (route: string) => void;
}

const TAG_RULES = [
  { tag: '邻里纠纷线索', keywords: ['漏水', '邻居', '纠纷'] },
  { tag: '情绪波动', keywords: ['激动', '情绪', '暴躁'] },
  { tag: '诉求集中', keywords: ['抱怨', '物业', '投诉'] },
  { tag: '持续跟进', keywords: ['经常', '多次', '频繁', '一直'] },
  { tag: '重点关注', keywords: ['冲突', '吵架', '争执', '矛盾'] },
];

function extractSuggestedTags(content: string, associatedPerson: Person | null): string[] {
  const matched = TAG_RULES.filter(({ keywords }) => keywords.some((keyword) => content.includes(keyword))).map(
    ({ tag }) => tag,
  );

  if (associatedPerson?.risk === 'High') {
    matched.push('高风险对象');
  }
  if ((associatedPerson?.tags ?? []).some((tag) => ['独居老人', '群租风险', '重点关注'].includes(tag))) {
    matched.push('既有标签复核');
  }

  return [...new Set(matched.length ? matched : ['待人工复核'])].slice(0, 4);
}

export function QuickNote({ onBack, onRouteChange }: QuickNoteProps) {
  const { canUseLegacyApiMutation } = useMobileSandbox();
  const [content, setContent] = useState('今天走访海梦苑小区时，8号楼的陈强情绪非常激动，因为楼上漏水的事情跟邻居大吵了一架。据周围居民反映，他平时脾气就比较暴躁，经常因为一些小事跟人起冲突，在业主群里也总是抱怨物业服务不到位，邻居们对他意见很大。');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTags, setActiveTags] = useState<Record<string, boolean>>({});
  const [associatedPerson, setAssociatedPerson] = useState<Person | null>(null);
  const [isPersonDrawerOpen, setIsPersonDrawerOpen] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadPeople = async () => {
      setIsLoadingPeople(true);
      try {
        const currentGrid = mobileContextRepository.getCurrentGridSelection();
        const nextPeople = await personRepository.getPeople({
          gridId: currentGrid.id,
          limit: 120,
        });
        if (!cancelled) {
          setPeople(nextPeople);
        }
      } catch (error) {
        console.error('Failed to load people for quick note', error);
        if (!cancelled) {
          toast.error('居民列表加载失败，请稍后重试');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPeople(false);
        }
      }
    };

    void loadPeople();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPeople = useMemo(
    () =>
      people.filter(
        (person) => person.name.includes(personSearchQuery) || person.address.includes(personSearchQuery),
      ),
    [people, personSearchQuery],
  );

  const handleAnalyze = () => {
    if (!content.trim()) {
      toast.error('请先输入内容');
      return;
    }

    const nextTags = extractSuggestedTags(content, associatedPerson);
    setSuggestedTags(nextTags);
    setActiveTags(Object.fromEntries(nextTags.map((tag) => [tag, true])));
    setShowAnalysis(true);
    toast.success('已生成标签建议，可直接回填到居民档案');
  };

  const handleSave = async () => {
    const selectedTags = suggestedTags.filter(t => activeTags[t]);
    if (associatedPerson && selectedTags.length > 0) {
      const person = await personRepository.getPerson(associatedPerson.id);
      const existingTags = person?.tags || [];
      const newTags = selectedTags.filter(t => !existingTags.includes(t));
      if (newTags.length > 0) {
        await personRepository.updatePerson(associatedPerson.id, { tags: [...existingTags, ...newTags] });
      }
      toast.success(`已为 ${associatedPerson.name} 回填 ${newTags.length} 个标签`);
    } else if (!associatedPerson) {
      toast.error('请先关联居民');
      return;
    } else {
      toast.error('请至少选择一个标签');
      return;
    }
    onBack();
  };

  return (
    <div className="h-full bg-[var(--color-neutral-01)] flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <MobileDetailHeader
        title="电子记事本"
        onBack={onBack}
        action={
          <button
            onClick={() => onRouteChange?.('quick-note-history')}
            aria-label="查看历史记录"
            className="p-2 -mr-2 text-[var(--color-neutral-10)] hover:bg-[var(--color-neutral-02)] active:bg-[var(--color-neutral-03)] rounded-full active:scale-95 transition-transform"
          >
            <History className="w-5 h-5" />
          </button>
        }
      />

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* 输入区域 */}
        <Card className="border-[var(--color-brand-primary)]/30 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-[var(--color-brand-text)]">
              <span className="w-1 h-4 bg-[var(--color-brand-primary)] rounded-full"></span>
              情况描述
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[150px] p-3 text-base bg-[var(--color-neutral-01)] rounded-lg border border-[var(--color-neutral-03)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:border-transparent resize-none placeholder-[var(--color-neutral-08)]"
              placeholder="请输入您在走访中发现的情况，例如：&#10;“李大爷最近腿脚不太方便，子女都在外地，家里只有他一个人，建议多关注。”"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={!content.trim()}
                className="bg-[var(--color-accent-purple)] hover:bg-[var(--color-accent-purple)]/80 text-white gap-2 shadow-sm"
              >
                <>
                  <Sparkles className="w-4 h-4" />
                  生成标签建议
                </>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 关联对象区域 */}
        <Card className="border-[var(--color-brand-primary)]/30 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between text-[var(--color-brand-text)]">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[var(--color-brand-primary)] rounded-full"></span>
                关联对象
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {associatedPerson ? (
              <div className="bg-[var(--color-brand-primary)]/10 rounded-lg border border-[var(--color-brand-primary)]/30 p-3 relative">
                 <button 
                   onClick={() => setAssociatedPerson(null)}
                   aria-label="移除关联居民"
                   className="absolute top-2 right-2 text-[var(--color-neutral-08)] hover:text-[var(--color-status-error-text)]"
                 >
                   <X className="w-4 h-4" />
                 </button>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center text-[var(--color-brand-text)] font-bold">
                      {associatedPerson.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-[var(--color-neutral-11)] flex items-center gap-2">
                        {associatedPerson.name}
                        <Badge variant="outline" className="text-xs font-normal bg-[var(--color-neutral-02)]">居民</Badge>
                      </div>
                      <div className="text-xs text-[var(--color-neutral-08)] mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {associatedPerson.address}
                      </div>
                    </div>
                 </div>
              </div>
            ) : (
              <Drawer open={isPersonDrawerOpen} onOpenChange={setIsPersonDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="w-full border-dashed text-[var(--color-neutral-08)] hover:text-[var(--color-brand-primary-hover)] hover:border-[var(--color-brand-primary)] h-12">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    关联辖区居民 (可选)
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>选择关联居民</DrawerTitle>
                    <DrawerDescription>
                      请选择该记录涉及的居民对象
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-08)]" />
                      <Input 
                        placeholder="搜索姓名或地址..." 
                        className="pl-9"
                        value={personSearchQuery}
                        onChange={(e) => setPersonSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {isLoadingPeople && (
                        <div className="text-center py-8 text-[var(--color-neutral-08)] text-sm">
                          正在加载辖区居民...
                        </div>
                      )}
                      {filteredPeople.map(person => (
                        <div 
                          key={person.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-neutral-03)] active:bg-[var(--color-brand-primary)]/10 cursor-pointer"
                          onClick={() => {
                            setAssociatedPerson(person);
                            setIsPersonDrawerOpen(false);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-[var(--color-neutral-01)] flex items-center justify-center text-[var(--color-neutral-10)] text-sm">
                            {person.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-[var(--color-neutral-11)]">{person.name}</div>
                            <div className="text-xs text-[var(--color-neutral-08)]">{person.address}</div>
                          </div>
                          <div className="px-2 py-1 text-xs bg-[var(--color-neutral-01)] rounded text-[var(--color-neutral-08)]">
                             选择
                          </div>
                        </div>
                      ))}
                      {!isLoadingPeople && filteredPeople.length === 0 && (
                        <div className="text-center py-8 text-[var(--color-neutral-08)] text-sm">
                          未找到匹配居民
                        </div>
                      )}
                    </div>
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline">取消</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            )}
          </CardContent>
        </Card>

        {/* 佐证材料上传 */}
        <Card className="border-[var(--color-brand-primary)]/30 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between text-[var(--color-brand-text)]">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-[var(--color-brand-primary)] rounded-full"></span>
                佐证材料
              </div>
              <span className="text-xs font-normal text-[var(--color-neutral-08)]">可选</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-4 gap-2">
                  <div className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-neutral-03)] flex flex-col items-center justify-center text-[var(--color-neutral-08)] hover:border-[var(--color-brand-primary-hover)] hover:text-[var(--color-brand-primary-hover)] hover:bg-[var(--color-brand-primary)]/10 transition-all cursor-pointer" onClick={() => toast.info('佐证材料请在走访记录页统一归档，电子记事页当前仅保留文字研判。')}>
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">添加图片</span>
                  </div>
                  <div className="aspect-square rounded-lg border-2 border-dashed border-[var(--color-neutral-03)] flex flex-col items-center justify-center text-[var(--color-neutral-08)] hover:border-[var(--color-brand-primary-hover)] hover:text-[var(--color-brand-primary-hover)] hover:bg-[var(--color-brand-primary)]/10 transition-all cursor-pointer" onClick={() => toast.info('如需补充视频证据，请改从走访记录页统一上传。')}>
                    <div className="w-6 h-6 mb-1 flex items-center justify-center border-2 border-current rounded-full">
                       <span className="text-[10px] font-bold">▶</span>
                    </div>
                    <span className="text-[10px]">添加视频</span>
                  </div>
             </div>
          </CardContent>
        </Card>

        {/* 智能提取结果 */}
        {showAnalysis && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-[var(--color-accent-purple)]/30 bg-[var(--color-accent-purple-soft)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-[var(--color-accent-purple-text)]">
                  <Sparkles className="w-4 h-4" />
                  智能提取结果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {suggestedTags.map((tag, index) => (
                    <Badge
                      key={index}
                      onClick={() => setActiveTags(prev => ({ ...prev, [tag]: !prev[tag] }))}
                      className={`px-3 py-1.5 text-sm cursor-pointer select-none transition-all active:scale-95 ${
                        activeTags[tag]
                          ? 'bg-[var(--color-accent-purple-soft)] text-[var(--color-accent-purple-text)] border-[var(--color-accent-purple)]/30 hover:bg-[var(--color-accent-purple)]/25'
                          : 'bg-[var(--color-neutral-01)] text-[var(--color-neutral-08)] border-[var(--color-neutral-03)] hover:bg-[var(--color-neutral-03)]'
                      }`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-[var(--color-neutral-08)] bg-[var(--color-neutral-02)] p-3 rounded border border-[var(--color-accent-purple)]/30">
                  <p>根据您输入的内容，AI 识别到以上标签。您可以点击标签进行取消或重新选中，{associatedPerson ? `确认后将关联到居民【${associatedPerson.name}】。` : '请先在上方关联居民，再将标签关联到对应的人。'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="p-4 bg-[var(--color-neutral-01)] border-t border-[var(--color-neutral-03)] safe-area-bottom">
        <Button 
          className="w-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-active)] text-lg py-6 shadow-sm"
          onClick={handleSave}
          disabled={!content.trim() || suggestedTags.length === 0 || !canUseLegacyApiMutation}
        >
          <Save className="w-5 h-5 mr-2" />
          关联标签
        </Button>
      </div>
    </div>
  );
}
