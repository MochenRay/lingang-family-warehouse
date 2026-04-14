import { useState } from 'react';
import { ChevronLeft, Sparkles, Save, Camera, X, Search, Link as LinkIcon, MapPin, History } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { MobileStatusBar } from './MobileStatusBar';
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
import { db } from '../../services/db';

interface QuickNoteProps {
  onBack: () => void;
  onRouteChange?: (route: string) => void;
}

interface Person {
  id: string;
  name: string;
  address: string;
  gridId: string;
}

export function QuickNote({ onBack, onRouteChange }: QuickNoteProps) {
  const [content, setContent] = useState('今天走访海源一品小区时，8号楼的陈强情绪非常激动，因为楼上漏水的事情跟邻居大吵了一架。据周围居民反映，他平时脾气就比较暴躁，经常因为一些小事跟人起冲突，在业主群里也总是抱怨物业服务不到位，邻居们对他意见很大。');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTags, setActiveTags] = useState<Record<string, boolean>>({});
  const [associatedPerson, setAssociatedPerson] = useState<Person | null>(null);
  const [isPersonDrawerOpen, setIsPersonDrawerOpen] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState('');

  // 模拟数据 - 与 MobileSearch 保持一致
  const mockPeople: Person[] = [
    { id: "p1", name: "张伟", address: "海源一品1号楼1单元101", gridId: "g1" },
    { id: "p4", name: "李军", address: "海源一品1号楼1单元102", gridId: "g1" },
    { id: "p5", name: "陈强", address: "海源一品8号楼2单元101", gridId: "g2" }
  ];

  // 过滤用于手动搜索的人员
  const filteredPeople = mockPeople.filter(p => 
    p.name.includes(personSearchQuery) || 
    p.address.includes(personSearchQuery)
  );

  // 模拟AI提取标签及关联人
  const handleAnalyze = () => {
    if (!content.trim()) {
      toast.error('请先输入内容');
      return;
    }

    setIsAnalyzing(true);
    
    // 模拟API延迟
    setTimeout(() => {
      const fixedTags = ['暴躁易怒', '爱抱怨', '经常与人起冲突'];
      setSuggestedTags(fixedTags);
      setActiveTags(Object.fromEntries(fixedTags.map(t => [t, true])));

      setIsAnalyzing(false);
      setShowAnalysis(true);
      toast.success('AI分析完成，已识别相关标签');
    }, 1500);
  };

  const handleSave = () => {
    const selectedTags = suggestedTags.filter(t => activeTags[t]);
    if (associatedPerson && selectedTags.length > 0) {
      const person = db.getPerson(associatedPerson.id);
      const existingTags = person?.tags || [];
      const newTags = selectedTags.filter(t => !existingTags.includes(t));
      if (newTags.length > 0) {
        db.updatePerson(associatedPerson.id, { tags: [...existingTags, ...newTags] });
      }
      toast.success(`已为 ${associatedPerson.name} 关联 ${newTags.length} 个标签`);
    } else if (!associatedPerson) {
      toast.error('请先关联居民');
      return;
    } else {
      toast.error('请至少选择一个标签');
      return;
    }
    setTimeout(() => {
      onBack();
    }, 1000);
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <MobileStatusBar variant="light" />
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">电子记事本</h1>
          <button 
            onClick={() => onRouteChange?.('quick-note-history')}
            className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full active:scale-95 transition-transform"
          >
            <History className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* 输入区域 */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              情况描述
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[150px] p-3 text-base bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
              placeholder="请输入您在走访中发现的情况，例如：&#10;“李大爷最近腿脚不太方便，子女都在外地，家里只有他一个人，建议多关注。”"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !content.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin text-white">⏳</span>
                    分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI 智能提取
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 关联对象区域 */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between text-blue-800">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                关联对象
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {associatedPerson ? (
              <div className="bg-blue-50/50 rounded-lg border border-blue-100 p-3 relative">
                 <button 
                   onClick={() => setAssociatedPerson(null)}
                   className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                 >
                   <X className="w-4 h-4" />
                 </button>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {associatedPerson.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        {associatedPerson.name}
                        <Badge variant="outline" className="text-xs font-normal bg-white">居民</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {associatedPerson.address}
                      </div>
                    </div>
                 </div>
              </div>
            ) : (
              <Drawer open={isPersonDrawerOpen} onOpenChange={setIsPersonDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="w-full border-dashed text-gray-500 hover:text-blue-600 hover:border-blue-300 h-12">
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
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        placeholder="搜索姓名或地址..." 
                        className="pl-9"
                        value={personSearchQuery}
                        onChange={(e) => setPersonSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {filteredPeople.map(person => (
                        <div 
                          key={person.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 active:bg-blue-50 cursor-pointer"
                          onClick={() => {
                            setAssociatedPerson(person);
                            setIsPersonDrawerOpen(false);
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
                            {person.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{person.name}</div>
                            <div className="text-xs text-gray-500">{person.address}</div>
                          </div>
                          <div className="px-2 py-1 text-xs bg-gray-50 rounded text-gray-500">
                             选择
                          </div>
                        </div>
                      ))}
                      {filteredPeople.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
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
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between text-blue-800">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                佐证材料
              </div>
              <span className="text-xs font-normal text-gray-400">可选</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-4 gap-2">
                  <div className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-50 transition-all cursor-pointer" onClick={() => toast.info('演示模式：仅支持模拟上传')}>
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px]">添加图片</span>
                  </div>
                  <div className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-50 transition-all cursor-pointer" onClick={() => toast.info('演示模式：仅支持模拟上传')}>
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
            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-indigo-800">
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
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200'
                          : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-gray-500 bg-white p-3 rounded border border-indigo-100">
                  <p>根据您输入的内容，AI 识别到以上标签。您可以点击标签进行取消或重新选中，{associatedPerson ? `确认后将关联到居民【${associatedPerson.name}】。` : '请先在上方关联居民，再将标签关联到对应的人。'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="p-4 bg-white border-t border-gray-200 safe-area-bottom">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 shadow-sm"
          onClick={handleSave}
          disabled={!content.trim()}
        >
          <Save className="w-5 h-5 mr-2" />
          关联标签
        </Button>
      </div>
    </div>
  );
}