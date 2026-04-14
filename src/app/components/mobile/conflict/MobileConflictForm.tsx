import { useState } from 'react';
import { 
  ChevronLeft, 
  MapPin, 
  Users, 
  Camera, 
  X,
  Plus,
  Sparkles,
  Loader2,
  Search
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import { ScrollArea } from '../../ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '../../ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Badge } from '../../ui/badge';
import { MobileStatusBar } from '../MobileStatusBar';
import { db } from '../../../services/db';
import { toast } from 'sonner';

interface MobileConflictFormProps {
  onBack: () => void;
  onRouteChange?: (route: string) => void;
}

export function MobileConflictForm({ onBack, onRouteChange }: MobileConflictFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    location: '',
    involvedParties: [] as { id: string, name: string, type: 'resident' | 'organization' }[],
    images: [] as string[]
  });
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // Party Selection State
  const [isPartyDrawerOpen, setIsPartyDrawerOpen] = useState(false);
  const [tempSelectedParties, setTempSelectedParties] = useState<{ id: string, name: string, type: 'resident' | 'organization' }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Organizations
  const MOCK_ORGS = [
    { id: 'org_wy', name: '物业公司', type: 'organization' as const },
    { id: 'org_jwh', name: '居委会', type: 'organization' as const },
    { id: 'org_mj', name: '社区民警', type: 'organization' as const },
  ];

  // Auto-generate title logic
  const handleDescriptionBlur = () => {
    if (formData.description && !formData.title && !isGeneratingTitle) {
      setIsGeneratingTitle(true);
      setTimeout(() => {
        // Simple mock AI logic
        const desc = formData.description;
        const keywords = desc.slice(0, 15);
        setFormData(prev => ({ ...prev, title: `${keywords}...` }));
        setIsGeneratingTitle(false);
        toast.success('AI已自动生成标题');
      }, 800);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.type || !formData.description) {
      toast.error('请填写必要信息');
      return;
    }

    setLoading(true);
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newConflict = {
        id: `c_${Date.now()}`,
        source: '自行发现' as const,
        title: formData.title,
        type: formData.type as any,
        description: formData.description,
        involvedParties: formData.involvedParties,
        status: '调解中' as const,
        gridId: 'g_002', // Mock Grid ID
        location: formData.location || '未知地点',
        timeline: [
          {
            date: new Date().toLocaleString(),
            content: '网格员上报纠纷',
            operator: '当前用户'
          }
        ],
        images: formData.images,
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      };

      db.addConflict(newConflict);
      toast.success('上报成功');
      onBack();
    } catch (error) {
      toast.error('上报失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddParty = () => {
    setTempSelectedParties([...formData.involvedParties]);
    setSearchTerm('');
    setIsPartyDrawerOpen(true);
  };

  const toggleParty = (party: { id: string, name: string, type: 'resident' | 'organization' }) => {
    setTempSelectedParties(prev => {
      const exists = prev.some(p => p.id === party.id);
      if (exists) {
        return prev.filter(p => p.id !== party.id);
      } else {
        return [...prev, party];
      }
    });
  };

  const handleConfirmSelection = () => {
    setFormData(prev => ({
      ...prev,
      involvedParties: tempSelectedParties
    }));
    setIsPartyDrawerOpen(false);
  };

  const filteredResidents = db.getPeople().filter(p => 
    p.name.includes(searchTerm) || p.address.includes(searchTerm)
  );

  const handleRemoveParty = (id: string) => {
    setFormData(prev => ({
      ...prev,
      involvedParties: prev.involvedParties.filter(p => p.id !== id)
    }));
  };

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
             <h1 className="text-base font-bold text-[var(--color-neutral-11)]">上报矛盾纠纷</h1>
          </div>
          
          {/* Placeholder for balance */}
          <div className="w-8"></div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Description Section */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">纠纷描述 <span className="text-red-500">*</span></Label>
          <Textarea 
            placeholder="请详细描述纠纷发生的时间、地点、起因及经过..."
            className="min-h-[120px] bg-white border-gray-200 resize-none focus-visible:ring-blue-500"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            onBlur={handleDescriptionBlur}
          />
        </div>

        {/* Title Section (Auto-generated) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-gray-700">标题 <span className="text-red-500">*</span></Label>
            {isGeneratingTitle && (
              <span className="text-xs text-blue-600 flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3" /> AI生成中...
              </span>
            )}
          </div>
          <div className="relative">
            <Input 
              placeholder="输入描述后自动生成，也可手动修改" 
              className="bg-white border-gray-200 pr-8"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
            {formData.title && (
              <button 
                onClick={() => setFormData(prev => ({ ...prev, title: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">纠纷类型 <span className="text-red-500">*</span></Label>
            <Select onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}>
              <SelectTrigger className="bg-white border-gray-200">
                <SelectValue placeholder="请选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="邻里纠纷">邻里纠纷</SelectItem>
                <SelectItem value="家庭纠纷">家庭纠纷</SelectItem>
                <SelectItem value="物业纠纷">物业纠纷</SelectItem>
                <SelectItem value="其他">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">发生地点</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="选择或输入地点" 
                className="pl-9 bg-white border-gray-200"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Involved Parties */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-gray-700">当事人/单位</Label>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs border-dashed text-blue-600 border-blue-200 bg-blue-50"
              onClick={handleAddParty}
            >
              <Plus className="w-3 h-3 mr-1" /> 添加对象
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.involvedParties.map(party => (
              <Badge key={party.id} variant="secondary" className="pl-2 pr-1 py-1 bg-white border border-gray-200 text-gray-700 flex items-center gap-1">
                {party.type === 'organization' ? <Users className="w-3 h-3 text-blue-500" /> : <Users className="w-3 h-3 text-green-500" />}
                {party.name}
                <button 
                  onClick={() => handleRemoveParty(party.id)}
                  className="ml-1 p-0.5 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </Badge>
            ))}
            {formData.involvedParties.length === 0 && (
              <div className="text-xs text-gray-400 italic py-2">暂无关联当事人</div>
            )}
          </div>
        </div>

        {/* Media Upload (Mock) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">现场照片/视频</Label>
          <div className="grid grid-cols-4 gap-2">
            {formData.images.map((img, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="现场" className="w-full h-full object-cover" />
              </div>
            ))}
            <button 
              className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 active:bg-gray-100 transition-colors"
              onClick={() => {
                // Mock adding an image
                setFormData(prev => ({ 
                  ...prev, 
                  images: [...prev.images, `https://source.unsplash.com/random/200x200?sig=${Date.now()}`] 
                }));
              }}
            >
              <Camera className="w-6 h-6" />
              <span className="text-[10px]">添加</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-white border-t border-gray-100 pb-8 md:pb-4">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base shadow-lg shadow-blue-600/20"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 提交中...
            </>
          ) : '提交上报'}
        </Button>
      </div>
      {/* Party Selection Drawer */}
      <Drawer open={isPartyDrawerOpen} onOpenChange={setIsPartyDrawerOpen}>
        <DrawerContent className="h-[85vh] flex flex-col rounded-t-[20px]">
          <DrawerHeader className="border-b border-gray-100 pb-4">
            <DrawerTitle className="text-center text-base font-bold text-gray-900">选择当事人/单位</DrawerTitle>
          </DrawerHeader>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="搜索居民姓名、房号..." 
                  className="pl-9 bg-gray-50 border-transparent focus-visible:bg-white focus-visible:border-blue-500 transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-4">
              <div className="py-2 space-y-6">
                {/* Organizations */}
                {!searchTerm && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">常用机构</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {MOCK_ORGS.map(org => {
                         const isSelected = tempSelectedParties.some(p => p.id === org.id);
                         return (
                           <div 
                             key={org.id}
                             onClick={() => toggleParty(org)}
                             className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                               isSelected 
                                 ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                 : 'bg-white border-gray-100 hover:bg-gray-50'
                             }`}
                           >
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                 <Users className="w-4 h-4 text-blue-600" />
                               </div>
                               <span className="font-medium text-gray-900">{org.name}</span>
                             </div>
                             <Checkbox checked={isSelected} className="rounded-full data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                           </div>
                         );
                      })}
                    </div>
                  </div>
                )}

                {/* Residents */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">该网格居民</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {filteredResidents.map(resident => {
                       const isSelected = tempSelectedParties.some(p => p.id === resident.id);
                       return (
                         <div 
                           key={resident.id}
                           onClick={() => toggleParty({ id: resident.id, name: resident.name, type: 'resident' })}
                           className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                             isSelected 
                               ? 'bg-green-50 border-green-200 shadow-sm' 
                               : 'bg-white border-gray-100 hover:bg-gray-50'
                           }`}
                         >
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-xs">
                               {resident.name[0]}
                             </div>
                             <div>
                               <div className="font-medium text-gray-900">{resident.name}</div>
                               <div className="text-xs text-gray-500">{resident.address}</div>
                             </div>
                           </div>
                           <Checkbox checked={isSelected} className="rounded-full data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                         </div>
                       );
                    })}
                    {filteredResidents.length === 0 && (
                       <div className="text-center py-8 text-gray-400 text-sm">无匹配居民</div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          <DrawerFooter className="border-t border-gray-100 pt-4 pb-8 md:pb-4 flex-row gap-3 bg-white z-10">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1 h-11 text-base border-gray-200">取消</Button>
            </DrawerClose>
            <Button onClick={handleConfirmSelection} className="flex-1 h-11 text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
              确认关联 ({tempSelectedParties.length})
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
